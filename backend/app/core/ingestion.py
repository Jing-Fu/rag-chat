from pathlib import Path

from docx import Document as DocxDoc
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

SUPPORTED_FILE_TYPES = {".txt", ".md", ".csv", ".pdf", ".docx"}


def extract_text(file_path: str, file_type: str) -> str:
    """Extract plain text content from an uploaded file."""
    normalized_type = file_type.lower()

    if normalized_type in {".txt", ".md", ".csv"}:
        return Path(file_path).read_text(encoding="utf-8", errors="ignore")

    if normalized_type == ".pdf":
        reader = PdfReader(file_path)
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)

    if normalized_type == ".docx":
        doc = DocxDoc(file_path)
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())

    raise ValueError(f"Unsupported file type: {file_type}")


def split_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """Split text into chunks using recursive character splitting."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", "。", "！", "？", " ", ""],
    )
    chunks = splitter.split_text(text)
    return [chunk for chunk in chunks if chunk.strip()]
