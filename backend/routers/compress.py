import logging
from typing import Optional, Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import fitz
from utils.session_manager import SessionManager

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)

class CompressRequest(BaseModel):
    session_id: str
    filename: str
    quality: Literal["low", "medium", "high"] = "medium"
    output_name: Optional[str] = None

COMPRESS_OPTIONS = {
    "low":    {"garbage": 4, "deflate": True, "clean": True, "deflate_images": True, "deflate_fonts": True},
    "medium": {"garbage": 3, "deflate": True, "clean": True},
    "high":   {"garbage": 1, "deflate": True},
}

@router.post("/compress")
async def compress_pdf(req: CompressRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        file_path = session_manager.get_file_path(req.session_id, req.filename)
        original_size = file_path.stat().st_size
        output_name = req.output_name or f"compressed_{req.filename}"
        if not output_name.endswith(".pdf"):
            output_name += ".pdf"
        output_path = session_dir / output_name
        with fitz.open(str(file_path)) as doc:
            doc.save(str(output_path), **COMPRESS_OPTIONS[req.quality])
        compressed_size = output_path.stat().st_size
        reduction = round((1 - compressed_size / original_size) * 100, 2) if original_size > 0 else 0
        return {
            "output_filename": output_name,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "reduction_percent": reduction,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Compress error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
