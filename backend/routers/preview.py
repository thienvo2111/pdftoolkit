import logging
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
import fitz
from utils.session_manager import SessionManager

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)


@router.get("/thumbnail")
async def get_thumbnail(
    session_id: str = Query(...),
    filename: str = Query(...),
    page: int = Query(1, ge=1),
    dpi: int = Query(96, ge=36, le=300),
):
    """Trả về PNG thumbnail của một trang PDF."""
    try:
        file_path = session_manager.get_file_path(session_id, filename)
        with fitz.open(str(file_path)) as doc:
            if page < 1 or page > doc.page_count:
                raise HTTPException(status_code=400, detail=f"Page {page} out of range (1–{doc.page_count})")
            mat = fitz.Matrix(dpi / 72, dpi / 72)
            pix = doc[page - 1].get_pixmap(matrix=mat)
            png_bytes = pix.tobytes("png")
        return Response(
            content=png_bytes,
            media_type="image/png",
            headers={"Cache-Control": "private, max-age=300"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Thumbnail error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
