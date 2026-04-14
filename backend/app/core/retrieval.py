import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chunk import Chunk
from app.models.document import Document


async def retrieve_relevant_chunks(
    db: AsyncSession,
    kb_id: uuid.UUID,
    query_embedding: list[float],
    top_k: int = 5,
) -> list[dict]:
    """Retrieve top-k relevant chunks by cosine distance from pgvector."""
    stmt = (
        select(
            Chunk.id,
            Chunk.doc_id,
            Chunk.content,
            Chunk.chunk_index,
            Chunk.metadata_,
            Document.filename,
            (1 - Chunk.embedding.cosine_distance(query_embedding)).label("relevance_score"),
        )
        .join(Document, Chunk.doc_id == Document.id)
        .where(Document.kb_id == kb_id)
        .where(Chunk.embedding.is_not(None))
        .order_by(Chunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    )

    rows = (await db.execute(stmt)).all()
    return [
        {
            "chunk_id": str(row.id),
            "document_id": str(row.doc_id),
            "content": row.content,
            "chunk_index": row.chunk_index,
            "metadata": row.metadata_,
            "filename": row.filename,
            "relevance_score": (
                float(row.relevance_score) if row.relevance_score is not None else 0.0
            ),
        }
        for row in rows
    ]
