import os
import uuid
import shutil
import tempfile
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class SessionManager:
    def __init__(self):
        self.base_path = Path(tempfile.gettempdir()) / "pdftool"
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.timeout_minutes = 30

    def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        session_dir = self.base_path / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        self._touch_access(session_dir)
        logger.info("Session created: %s", session_id)
        return session_id

    def get_session_path(self, session_id: str) -> Path:
        session_dir = self.base_path / session_id
        if not session_dir.exists() or not session_dir.is_dir():
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found or expired")
        self._touch_access(session_dir)
        return session_dir

    def save_file(self, session_id: str, filename: str, data: bytes) -> Path:
        session_dir = self.get_session_path(session_id)
        file_path = session_dir / filename
        file_path.write_bytes(data)
        return file_path

    def get_file(self, session_id: str, filename: str) -> bytes:
        session_dir = self.get_session_path(session_id)
        file_path = session_dir / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File {filename} not found in session")
        return file_path.read_bytes()

    def get_file_path(self, session_id: str, filename: str) -> Path:
        session_dir = self.get_session_path(session_id)
        file_path = session_dir / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File {filename} not found in session")
        return file_path

    def list_files(self, session_id: str) -> List[Dict]:
        session_dir = self.get_session_path(session_id)
        files = []
        for f in session_dir.iterdir():
            if f.is_file() and not f.name.startswith("."):
                stat = f.stat()
                files.append({
                    "name": f.name,
                    "size": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                })
        return files

    def delete_session(self, session_id: str):
        session_dir = self.base_path / session_id
        if session_dir.exists():
            shutil.rmtree(session_dir)
            logger.info("Session deleted: %s", session_id)

    def cleanup_expired_sessions(self):
        cutoff = datetime.now() - timedelta(minutes=self.timeout_minutes)
        for session_dir in self.base_path.iterdir():
            if not session_dir.is_dir():
                continue
            access_file = session_dir / ".last_access"
            try:
                if access_file.exists():
                    mtime = datetime.fromtimestamp(access_file.stat().st_mtime)
                else:
                    mtime = datetime.fromtimestamp(session_dir.stat().st_mtime)
                if mtime < cutoff:
                    shutil.rmtree(session_dir)
                    logger.info("Cleaned up expired session: %s", session_dir.name)
            except Exception as e:
                logger.warning("Error cleaning session %s: %s", session_dir.name, e)

    def _touch_access(self, session_dir: Path):
        access_file = session_dir / ".last_access"
        access_file.write_text(datetime.now().isoformat())
