import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from utils.session_manager import SessionManager
from routers import merge, split, rotate, pages, protect, ocr, compress, convert, session

logging.basicConfig(level=logging.INFO)
scheduler = AsyncIOScheduler()
session_manager = SessionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(session_manager.cleanup_expired_sessions, "interval", minutes=10)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(
    title="PDFTool API",
    description="Professional PDF processing tool API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router, prefix="/api/session", tags=["Session"])
app.include_router(merge.router, prefix="/api/pdf", tags=["Merge"])
app.include_router(split.router, prefix="/api/pdf", tags=["Split"])
app.include_router(rotate.router, prefix="/api/pdf", tags=["Rotate"])
app.include_router(pages.router, prefix="/api/pdf", tags=["Pages"])
app.include_router(protect.router, prefix="/api/pdf", tags=["Protect"])
app.include_router(ocr.router, prefix="/api/pdf", tags=["OCR"])
app.include_router(compress.router, prefix="/api/pdf", tags=["Compress"])
app.include_router(convert.router, prefix="/api/pdf", tags=["Convert"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
