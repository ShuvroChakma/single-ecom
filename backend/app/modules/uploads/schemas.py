"""
Pydantic schemas for uploads.
"""
from typing import List
from pydantic import BaseModel


class ImageUploadResponse(BaseModel):
    """Response for single image upload."""
    url: str
    filename: str


class MultiImageUploadResponse(BaseModel):
    """Response for multiple image uploads."""
    urls: List[str]
    count: int


class ImageDeleteResponse(BaseModel):
    """Response for image deletion."""
    deleted: bool
    url: str


class ImageListResponse(BaseModel):
    """Response for listing images."""
    items: List[ImageUploadResponse]
    count: int
