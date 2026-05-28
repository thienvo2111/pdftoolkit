import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import fitz
from utils.session_manager import SessionManager

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)

class DeletePagesRequest(BaseModel):
    session_id: str
    filename: str
    pages: List[int]
    output_name: Optional[str] = None

class ReorderPagesRequest(BaseModel):
    session_id: str
    filename: str
    order: List[int]
    output_name: Optional[str] = None

class ExtractPagesRequest(BaseModel):
    session_id: str
    filename: str
    pages: List[int]
    output_name: Optional[str] = None

@router.post("/pages/delete")
async def delete_pages(req: DeletePagesRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        file_path = session_manager.get_file_path(req.session_id, req.filename)
        output_name = req.output_name or f"deleted_{req.filename}"
        if not output_name.endswith(".pdf"):
            output_name += ".pdf"
        output_path = session_dir / output_name
        with fitz.open(str(file_path)) as doc:
            total_pages = doc.page_count
            for p in req.pages:
                if p < 1 or p > total_pages:
                    raise HTTPException(status_code=400, detail=f"Page {p} out of range")
            indices_to_delete = sorted([p - 1 for p in set(req.pages)], reverse=True)
            for idx in indices_to_delete:
                doc.delete_page(idx)
            doc.save(str(output_path))
            remaining = doc.page_count
        return {"output_filename": output_name, "pages": remaining}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Delete pages error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pages/reorder")
async def reorder_pages(req: ReorderPagesRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        file_path = session_manager.get_file_path(req.session_id, req.filename)
        output_name = req.output_name or f"reordered_{req.filename}"
        if not output_name.endswith(".pdf"):
            output_name += ".pdf"
        output_path = session_dir / output_name
        with fitz.open(str(file_path)) as src:
            total_pages = src.page_count
            if len(req.order) != total_pages:
                raise HTTPException(status_code=400, detail=f"Order must contain exactly {total_pages} page numbers")
            if sorted(req.order) != list(range(1, total_pages + 1)):
                raise HTTPException(status_code=400, detail="Order must contain each page number exactly once")
            out = fitz.open()
            for p in req.order:
                out.insert_pdf(src, from_page=p - 1, to_page=p - 1)
            out.save(str(output_path))
            out.close()
        return {"output_filename": output_name, "pages": total_pages}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Reorder pages error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pages/extract")
async def extract_pages(req: ExtractPagesRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        file_path = session_manager.get_file_path(req.session_id, req.filename)
        output_name = req.output_name or f"extracted_{req.filename}"
        if not output_name.endswith(".pdf"):
            output_name += ".pdf"
        output_path = session_dir / output_name
        with fitz.open(str(file_path)) as src:
            total_pages = src.page_count
            for p in req.pages:
                if p < 1 or p > total_pages:
                    raise HTTPException(status_code=400, detail=f"Page {p} out of range")
            out = fitz.open()
            for p in req.pages:
                out.insert_pdf(src, from_page=p - 1, to_page=p - 1)
            out.save(str(output_path))
            out.close()
        return {"output_filename": output_name, "pages": len(req.pages)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Extract pages error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
