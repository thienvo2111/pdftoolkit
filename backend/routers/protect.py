import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pikepdf
from utils.session_manager import SessionManager

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)

class ProtectRequest(BaseModel):
    session_id: str
    filename: str
    user_password: str = ""
    owner_password: str = ""
    allow_print: bool = True
    allow_copy: bool = True
    output_name: Optional[str] = None

class UnlockRequest(BaseModel):
    session_id: str
    filename: str
    password: str
    output_name: Optional[str] = None

@router.post("/protect")
async def protect_pdf(req: ProtectRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        file_path = session_manager.get_file_path(req.session_id, req.filename)
        output_name = req.output_name or f"protected_{req.filename}"
        if not output_name.endswith(".pdf"):
            output_name += ".pdf"
        output_path = session_dir / output_name
        with pikepdf.open(str(file_path)) as pdf:
            permissions = pikepdf.Permissions(
                print_lowres=req.allow_print,
                print_highres=req.allow_print,
                extract=req.allow_copy,
                modify_annotation=False,
                modify_assembly=False,
                modify_form=False,
                modify_other=False,
            )
            encryption = pikepdf.Encryption(
                user=req.user_password,
                owner=req.owner_password if req.owner_password else req.user_password + "_owner",
                allow=permissions,
            )
            pdf.save(str(output_path), encryption=encryption)
        return {"output_filename": output_name, "encrypted": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Protect error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unlock")
async def unlock_pdf(req: UnlockRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        file_path = session_manager.get_file_path(req.session_id, req.filename)
        output_name = req.output_name or f"unlocked_{req.filename}"
        if not output_name.endswith(".pdf"):
            output_name += ".pdf"
        output_path = session_dir / output_name
        with pikepdf.open(str(file_path), password=req.password) as pdf:
            pdf.save(str(output_path))
        return {"output_filename": output_name, "encrypted": False}
    except pikepdf.PasswordError:
        raise HTTPException(status_code=400, detail="Incorrect password")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unlock error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
