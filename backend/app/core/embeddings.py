import ollama as ollama_client

from app.config import get_settings


async def generate_embeddings(texts: list[str], model: str | None = None) -> list[list[float]]:
    """Generate embedding vectors for a list of texts through Ollama."""
    settings = get_settings()
    model_name = model or settings.ollama_embedding_model
    client = ollama_client.AsyncClient(host=settings.ollama_base_url)

    embeddings: list[list[float]] = []
    for text in texts:
        response = await client.embed(model=model_name, input=text)
        vector = response.get("embeddings", [])
        if not vector:
            raise RuntimeError("Ollama embedding returned empty result")
        embeddings.append(vector[0])

    return embeddings
