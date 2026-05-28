import logging
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from utils.session_manager import SessionManager
from utils.pdf_utils import get_pdf_info

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)

@router.post("/create")
async def create_session():
    session_id = session_manager.create_session()
    expires_at = (datetime.now() + timedelta(minutes=30)).isoformat()
    return {"session_id": session_id, "expires_at": expires_at}

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    session_manager.delete_session(session_id)
    return {"deleted": True}

@router.get("/{session_id}/files")
async def list_files(session_id: str):
    return session_manager.list_files(session_id)

@router.post("/{session_id}/upload")
async def upload_file(session_id: str, file: UploadFile = File(...)):
    try:
        data = await file.read()
        filename = file.filename or "upload.pdf"
        file_path = session_manager.save_file(session_id, filename, data)
        info = get_pdf_info(str(file_path))
        return {"filename": filename, "size": len(data), "pages": info["pages"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Upload error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/download/{filename}")
async def download_file(session_id: str, filename: str):
    file_path = session_manager.get_file_path(session_id, filename)
    media_type = "application/pdf"
    if filename.endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif filename.endswith(".xlsx"):
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif filename.endswith((".png", ".jpg", ".jpeg")):
        media_type = f"image/{filename.rsplit('.', 1)[-1]}"
    return FileResponse(path=str(file_path), filename=filename, media_type=media_type)
