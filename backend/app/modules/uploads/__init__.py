"""
Uploads module for file handling.
"""
from app.modules.uploads.service import UploadService
from app.modules.uploads.endpoints import router

__all__ = ["UploadService", "router"]
