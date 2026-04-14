from __future__ import annotations

import uuid
from pathlib import Path
from shutil import rmtree

from fastapi import UploadFile
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_endpoint import ApiEndpoint
from app.models.chat import ChatSession
from app.config import get_settings
from app.core.embeddings import generate_embeddings
from app.core.ingestion import SUPPORTED_FILE_TYPES, extract_text, split_text
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.knowledge_base import KnowledgeBase
from app.schemas.document import DocumentResponse
from app.schemas.knowledge_base import (
    KnowledgeBaseCreate,
    KnowledgeBaseResponse,
    KnowledgeBaseUpdate,
)


class ServiceError(Exception):
    def __init__(self, detail: str, status_code: int) -> None:
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class KnowledgeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()

    async def list_knowledge_bases(self) -> list[KnowledgeBaseResponse]:
        stmt = (
            select(KnowledgeBase, func.count(Document.id).label("document_count"))
            .outerjoin(Document, Document.kb_id == KnowledgeBase.id)
            .group_by(KnowledgeBase.id)
            .order_by(KnowledgeBase.created_at.desc())
        )
        rows = (await self.db.execute(stmt)).all()
        return [self._to_kb_response(kb, document_count) for kb, document_count in rows]

    async def create_knowledge_base(self, data: KnowledgeBaseCreate) -> KnowledgeBaseResponse:
        kb = KnowledgeBase(**data.model_dump())
        self.db.add(kb)
        await self.db.commit()
        await self.db.refresh(kb)
        return self._to_kb_response(kb, document_count=0)

    async def get_knowledge_base(self, kb_id: uuid.UUID) -> KnowledgeBaseResponse | None:
        stmt = (
            select(KnowledgeBase, func.count(Document.id).label("document_count"))
            .outerjoin(Document, Document.kb_id == KnowledgeBase.id)
            .where(KnowledgeBase.id == kb_id)
            .group_by(KnowledgeBase.id)
        )
        row = (await self.db.execute(stmt)).first()
        if not row:
            return None
        kb, document_count = row
        return self._to_kb_response(kb, document_count)

    async def update_knowledge_base(
        self,
        kb_id: uuid.UUID,
        data: KnowledgeBaseUpdate,
    ) -> KnowledgeBaseResponse | None:
        kb = await self.db.get(KnowledgeBase, kb_id)
        if kb is None:
            return None

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(kb, key, value)

        await self.db.commit()
        await self.db.refresh(kb)

        count_stmt = select(func.count(Document.id)).where(Document.kb_id == kb_id)
        document_count = (await self.db.scalar(count_stmt)) or 0
        return self._to_kb_response(kb, document_count)

    async def delete_knowledge_base(self, kb_id: uuid.UUID) -> None:
        kb = await self.db.get(KnowledgeBase, kb_id)
        if kb is None:
            raise ServiceError("Knowledge base not found", status_code=404)

        await self.db.execute(delete(ApiEndpoint).where(ApiEndpoint.kb_id == kb_id))
        await self.db.execute(delete(ChatSession).where(ChatSession.kb_id == kb_id))
        await self.db.delete(kb)
        await self.db.commit()
        self._delete_knowledge_base_files(kb_id)

    async def upload_document(self, kb_id: uuid.UUID, file: UploadFile) -> DocumentResponse:
        kb = await self.db.get(KnowledgeBase, kb_id)
        if kb is None:
            raise ServiceError("Knowledge base not found", status_code=404)

        suffix = Path(file.filename or "").suffix.lower()
        if suffix not in SUPPORTED_FILE_TYPES:
            raise ServiceError(
                f"Unsupported file type: {suffix or 'unknown'}. "
                f"Supported types: {', '.join(sorted(SUPPORTED_FILE_TYPES))}",
                status_code=400,
            )

        data = await file.read()
        max_size = self.settings.upload_max_size_mb * 1024 * 1024
        if len(data) > max_size:
            raise ServiceError(
                f"File exceeds upload limit ({self.settings.upload_max_size_mb} MB)",
                status_code=413,
            )

        document = Document(
            kb_id=kb.id,
            filename=file.filename or "unnamed",
            file_type=suffix,
            file_size=len(data),
            chunk_count=0,
            status="processing",
        )
        self.db.add(document)
        await self.db.flush()

        file_path = self._document_path(kb.id, document.id, suffix)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(data)

        try:
            await self._index_document(kb, document, file_path)
        except ServiceError:
            document.status = "error"
            await self.db.commit()
            raise
        except Exception as exc:  # pragma: no cover - defensive branch
            document.status = "error"
            await self.db.commit()
            raise ServiceError(f"Failed to index document: {exc}", status_code=502) from exc

        await self.db.commit()
        await self.db.refresh(document)
        return DocumentResponse.model_validate(document)

    async def list_documents(self, kb_id: uuid.UUID) -> list[DocumentResponse]:
        kb = await self.db.get(KnowledgeBase, kb_id)
        if kb is None:
            raise ServiceError("Knowledge base not found", status_code=404)

        stmt = select(Document).where(Document.kb_id == kb_id).order_by(Document.created_at.desc())
        docs = (await self.db.execute(stmt)).scalars().all()
        return [DocumentResponse.model_validate(doc) for doc in docs]

    async def delete_document(self, kb_id: uuid.UUID, doc_id: uuid.UUID) -> None:
        stmt = select(Document).where(Document.id == doc_id, Document.kb_id == kb_id)
        document = (await self.db.execute(stmt)).scalar_one_or_none()
        if document is None:
            raise ServiceError("Document not found", status_code=404)

        await self.db.delete(document)
        await self.db.commit()

    async def reindex_document(self, kb_id: uuid.UUID, doc_id: uuid.UUID) -> DocumentResponse:
        stmt = select(Document).where(Document.id == doc_id, Document.kb_id == kb_id)
        document = (await self.db.execute(stmt)).scalar_one_or_none()
        if document is None:
            raise ServiceError("Document not found", status_code=404)

        kb = await self.db.get(KnowledgeBase, kb_id)
        if kb is None:
            raise ServiceError("Knowledge base not found", status_code=404)

        file_path = self._document_path(kb_id, doc_id, document.file_type)
        if not file_path.exists():
            raise ServiceError("Original document file is missing, cannot reindex", status_code=400)

        await self.db.execute(delete(Chunk).where(Chunk.doc_id == document.id))
        document.chunk_count = 0
        document.status = "processing"

        try:
            await self._index_document(kb, document, file_path)
        except ServiceError:
            document.status = "error"
            await self.db.commit()
            raise
        except Exception as exc:  # pragma: no cover - defensive branch
            document.status = "error"
            await self.db.commit()
            raise ServiceError(f"Failed to reindex document: {exc}", status_code=502) from exc

        await self.db.commit()
        await self.db.refresh(document)
        return DocumentResponse.model_validate(document)

    async def _index_document(self, kb: KnowledgeBase, document: Document, file_path: Path) -> None:
        text = extract_text(str(file_path), document.file_type)
        if not text.strip():
            raise ServiceError("Document contains no extractable text", status_code=400)

        chunks = split_text(text, kb.chunk_size, kb.chunk_overlap)
        if not chunks:
            raise ServiceError("Document split result is empty", status_code=400)

        try:
            vectors = await generate_embeddings(chunks, model=kb.embedding_model)
        except Exception as exc:
            raise ServiceError(f"Embedding generation failed: {exc}", status_code=502) from exc

        for idx, (chunk_text, vector) in enumerate(zip(chunks, vectors, strict=False)):
            chunk = Chunk(
                doc_id=document.id,
                content=chunk_text,
                chunk_index=idx,
                metadata_={"filename": document.filename},
                embedding=vector,
            )
            self.db.add(chunk)

        document.chunk_count = len(chunks)
        document.status = "ready"

    @staticmethod
    def _to_kb_response(kb: KnowledgeBase, document_count: int) -> KnowledgeBaseResponse:
        return KnowledgeBaseResponse(
            id=kb.id,
            name=kb.name,
            description=kb.description,
            chunk_size=kb.chunk_size,
            chunk_overlap=kb.chunk_overlap,
            embedding_model=kb.embedding_model,
            status=kb.status,
            document_count=document_count,
            created_at=kb.created_at,
            updated_at=kb.updated_at,
        )

    def _document_path(self, kb_id: uuid.UUID, doc_id: uuid.UUID, file_type: str) -> Path:
        return self.settings.upload_dir / str(kb_id) / f"{doc_id}{file_type}"

    def _delete_knowledge_base_files(self, kb_id: uuid.UUID) -> None:
        kb_path = self.settings.upload_dir / str(kb_id)
        if kb_path.exists():
            rmtree(kb_path, ignore_errors=True)
