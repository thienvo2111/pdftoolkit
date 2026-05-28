import fitz
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def open_pdf(path: str) -> fitz.Document:
    return fitz.open(str(path))

def save_pdf(doc: fitz.Document, path: str):
    doc.save(str(path))

def get_page_count(path: str) -> int:
    with fitz.open(str(path)) as doc:
        return doc.page_count

def get_pdf_info(path: str) -> dict:
    with fitz.open(str(path)) as doc:
        meta = doc.metadata or {}
        return {
            "pages": doc.page_count,
            "file_size": Path(path).stat().st_size,
            "title": meta.get("title", ""),
            "author": meta.get("author", ""),
            "encrypted": doc.is_encrypted,
        }
