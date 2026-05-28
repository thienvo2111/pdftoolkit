import logging
from typing import List, Optional, Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import fitz
from utils.session_manager import SessionManager

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)

class SplitRequest(BaseModel):
    session_id: str
    filename: str
    mode: Literal["pages", "range"]
    pages: Optional[List[int]] = None
    ranges: Optional[List[str]] = None

@router.post("/split")
async def split_pdf(req: SplitRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        file_path = session_manager.get_file_path(req.session_id, req.filename)
        base_name = req.filename.rsplit(".", 1)[0]
        output_files = []
        with fitz.open(str(file_path)) as src:
            total_pages = src.page_count
            if req.mode == "pages":
                page_list = req.pages or list(range(1, total_pages + 1))
                for p in page_list:
                    if p < 1 or p > total_pages:
                        raise HTTPException(status_code=400, detail=f"Page {p} out of range (1-{total_pages})")
                    out = fitz.open()
                    out.insert_pdf(src, from_page=p - 1, to_page=p - 1)
                    out_name = f"{base_name}_page_{p}.pdf"
                    out.save(str(session_dir / out_name))
                    out.close()
                    output_files.append({"name": out_name, "pages": 1})
            elif req.mode == "range":
                if not req.ranges:
                    raise HTTPException(status_code=400, detail="ranges required for range mode")
                for r in req.ranges:
                    parts = r.strip().split("-")
                    if len(parts) != 2:
                        raise HTTPException(status_code=400, detail=f"Invalid range format: {r}")
                    start, end = int(parts[0]), int(parts[1])
                    if start < 1 or end > total_pages or start > end:
                        raise HTTPException(status_code=400, detail=f"Range {r} invalid for {total_pages}-page document")
                    out = fitz.open()
                    out.insert_pdf(src, from_page=start - 1, to_page=end - 1)
                    out_name = f"{base_name}_pages_{start}_{end}.pdf"
                    out.save(str(session_dir / out_name))
                    out.close()
                    output_files.append({"name": out_name, "pages": end - start + 1})
        return {"output_files": output_files}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Split error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
