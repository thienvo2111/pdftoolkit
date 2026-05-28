import logging
import io
from typing import List, Optional, Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import fitz
from PIL import Image
from utils.session_manager import SessionManager

router = APIRouter()
session_manager = SessionManager()
logger = logging.getLogger(__name__)

class ToImagesRequest(BaseModel):
    session_id: str
    filename: str
    format: Literal["png", "jpg"] = "png"
    dpi: int = 150
    pages: Optional[List[int]] = None

class FromImagesRequest(BaseModel):
    session_id: str
    filenames: List[str]
    output_name: str = "converted.pdf"

class WatermarkRequest(BaseModel):
    session_id: str
    filename: str
    text: str
    opacity: float = 0.3
    font_size: int = 40
    angle: int = 45
    color: str = "#808080"
    output_name: Optional[str] = None

def hex_to_rgb_float(hex_color: str):
    hex_color = hex_color.lstrip("#")
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    return (r / 255, g / 255, b / 255)

@router.post("/to-images")
async def pdf_to_images(req: ToImagesRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        file_path = session_manager.get_file_path(req.session_id, req.filename)
        base_name = req.filename.rsplit(".", 1)[0]
        mat = fitz.Matrix(req.dpi / 72, req.dpi / 72)
        output_files = []
        with fitz.open(str(file_path)) as doc:
            total = doc.page_count
            target_pages = req.pages if req.pages else list(range(1, total + 1))
            for p in target_pages:
                if p < 1 or p > total:
                    raise HTTPException(status_code=400, detail=f"Page {p} out of range")
                pix = doc[p - 1].get_pixmap(matrix=mat)
                out_name = f"{base_name}_page_{p}.{req.format}"
                out_path = session_dir / out_name
                if req.format == "jpg":
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    img.save(str(out_path), "JPEG", quality=85)
                else:
                    pix.save(str(out_path))
                output_files.append(out_name)
        return {"output_files": output_files}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("PDF to images error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/from-images")
async def images_to_pdf(req: FromImagesRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        output_name = req.output_name if req.output_name.endswith(".pdf") else req.output_name + ".pdf"
        output_path = session_dir / output_name
        doc = fitz.open()
        for filename in req.filenames:
            file_path = session_manager.get_file_path(req.session_id, filename)
            img = Image.open(str(file_path)).convert("RGB")
            img_bytes = io.BytesIO()
            img.save(img_bytes, format="PNG")
            img_bytes.seek(0)
            img_doc = fitz.open("png", img_bytes.read())
            rect = img_doc[0].rect
            page = doc.new_page(width=rect.width, height=rect.height)
            page.show_pdf_page(rect, img_doc, 0)
            img_doc.close()
        doc.save(str(output_path))
        doc.close()
        return {"output_filename": output_name, "pages": len(req.filenames)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Images to PDF error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/watermark")
async def add_watermark(req: WatermarkRequest):
    try:
        session_dir = session_manager.get_session_path(req.session_id)
        file_path = session_manager.get_file_path(req.session_id, req.filename)
        output_name = req.output_name or f"watermarked_{req.filename}"
        if not output_name.endswith(".pdf"):
            output_name += ".pdf"
        output_path = session_dir / output_name
        color = hex_to_rgb_float(req.color)
        with fitz.open(str(file_path)) as doc:
            for page in doc:
                rect = page.rect
                center = fitz.Point(rect.width / 2, rect.height / 2)
                page.insert_text(
                    center,
                    req.text,
                    fontsize=req.font_size,
                    color=color,
                    rotate=req.angle,
                    overlay=True,
                    render_mode=3,
                )
            doc.save(str(output_path))
        return {"output_filename": output_name}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Watermark error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
