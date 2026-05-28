import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import fitz
from utils.session_manager import SessionManager
from pathlib import Path

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)

class MergeRequest(BaseModel):
    session_id: str
    files: List[str]
    output_name: str = "merged.pdf"

@router.post("/merge")
async def merge_pdfs(req: MergeRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        if len(req.files) < 2:
            raise HTTPException(status_code=400, detail="At least 2 files required for merge")
        merged = fitz.open()
        for filename in req.files:
            file_path = session_manager.get_file_path(req.session_id, filename)
            with fitz.open(str(file_path)) as doc:
                merged.insert_pdf(doc)
        output_name = req.output_name if req.output_name.endswith(".pdf") else req.output_name + ".pdf"
        output_path = session_dir / output_name
        merged.save(str(output_path))
        merged.close()
        return {"output_filename": output_name, "pages": fitz.open(str(output_path)).page_count, "size": output_path.stat().st_size}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Merge error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
