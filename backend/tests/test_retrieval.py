import uuid
from types import SimpleNamespace

from app.core.retrieval import retrieve_relevant_chunks


class FakeResult:
    def __init__(self, rows) -> None:
        self._rows = rows

    def all(self):
        return self._rows


class FakeAsyncSession:
    def __init__(self, rows) -> None:
        self.rows = rows
        self.statement = None

    async def execute(self, statement):
        self.statement = statement
        return FakeResult(self.rows)


async def test_retrieve_relevant_chunks_uses_hybrid_scores() -> None:
    kb_id = uuid.uuid4()
    chunk_id = uuid.uuid4()
    document_id = uuid.uuid4()
    db = FakeAsyncSession(
        [
            SimpleNamespace(
                id=chunk_id,
                doc_id=document_id,
                content="這是一段測試內容",
                chunk_index=2,
                metadata_={"page": 1},
                filename="測試文件.md",
                semantic_score=0.91,
                lexical_score=0.35,
                relevance_score=0.798,
            )
        ]
    )

    results = await retrieve_relevant_chunks(
        db,
        kb_id=kb_id,
        query_embedding=[0.1, 0.2, 0.3],
        query_text="測試查詢",
        top_k=3,
    )

    assert results == [
        {
            "chunk_id": str(chunk_id),
            "document_id": str(document_id),
            "content": "這是一段測試內容",
            "chunk_index": 2,
            "metadata": {"page": 1},
            "filename": "測試文件.md",
            "relevance_score": 0.798,
        }
    ]

    compiled = str(db.statement)
    assert "similarity" in compiled
    assert "cosine_distance" in compiled
