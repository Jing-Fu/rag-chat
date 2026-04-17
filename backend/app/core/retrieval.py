import uuid

from sqlalchemy import func, literal, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chunk import Chunk
from app.models.document import Document


async def retrieve_relevant_chunks(
    db: AsyncSession,
    kb_id: uuid.UUID,
    query_embedding: list[float],
    query_text: str,
    top_k: int = 5,
) -> list[dict]:
    """Retrieve top-k chunks with hybrid vector and lexical similarity."""
    normalized_query = query_text.strip()
    semantic_score = (1 - Chunk.embedding.cosine_distance(query_embedding)).label("semantic_score")

    if normalized_query:
        lexical_score = func.greatest(
            func.similarity(Chunk.content, normalized_query),
            func.similarity(Document.filename, normalized_query),
        ).label("lexical_score")
    else:
        lexical_score = literal(0.0).label("lexical_score")

    hybrid_score = (semantic_score * 0.8 + lexical_score * 0.2).label("relevance_score")
    stmt = (
        select(
            Chunk.id,
            Chunk.doc_id,
            Chunk.content,
            Chunk.chunk_index,
            Chunk.metadata_,
            Document.filename,
            semantic_score,
            lexical_score,
            hybrid_score,
        )
        .join(Document, Chunk.doc_id == Document.id)
        .where(Document.kb_id == kb_id)
        .where(Chunk.embedding.is_not(None))
        .order_by(hybrid_score.desc(), semantic_score.desc(), Chunk.chunk_index.asc())
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
