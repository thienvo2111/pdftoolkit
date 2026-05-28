import logging
from typing import List, Optional, Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import fitz
from utils.session_manager import SessionManager

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)

class RotateRequest(BaseModel):
    session_id: str
    filename: str
    angle: Literal[90, 180, 270]
    pages: Optional[List[int]] = None
    output_name: Optional[str] = None

@router.post("/rotate")
async def rotate_pdf(req: RotateRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        file_path = session_manager.get_file_path(req.session_id, req.filename)
        output_name = req.output_name or f"rotated_{req.filename}"
        if not output_name.endswith(".pdf"):
            output_name += ".pdf"
        output_path = session_dir / output_name
        with fitz.open(str(file_path)) as doc:
            total_pages = doc.page_count
            target_pages = req.pages if req.pages else list(range(1, total_pages + 1))
            for p in target_pages:
                if p < 1 or p > total_pages:
                    raise HTTPException(status_code=400, detail=f"Page {p} out of range")
                page = doc[p - 1]
                page.set_rotation(page.rotation + req.angle)
            doc.save(str(output_path))
        return {"output_filename": output_name, "pages": total_pages}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Rotate error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
