"""
Pydantic schemas for Slides.
"""
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime

from app.modules.slides.models import SlideType


class SlideCreate(BaseModel):
    """Schema for creating a slide."""
    title: str = Field(..., min_length=1, max_length=200)
    subtitle: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    
    image_url: str = Field(..., description="URL to slide image")
    image_alt: Optional[str] = Field(None, max_length=200)
    
    link_url: Optional[str] = None
    link_text: Optional[str] = Field("Shop Now", max_length=50)
    
    slide_type: SlideType = SlideType.BANNER
    text_color: Optional[str] = Field("#FFFFFF", max_length=20)
    overlay_color: Optional[str] = Field(None, max_length=50)
    
    sort_order: int = Field(default=0, ge=0)
    is_active: bool = True
    
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SlideUpdate(BaseModel):
    """Schema for updating a slide."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    subtitle: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    
    image_url: Optional[str] = None
    image_alt: Optional[str] = Field(None, max_length=200)
    
    link_url: Optional[str] = None
    link_text: Optional[str] = Field(None, max_length=50)
    
    slide_type: Optional[SlideType] = None
    text_color: Optional[str] = Field(None, max_length=20)
    overlay_color: Optional[str] = Field(None, max_length=50)
    
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SlideResponse(BaseModel):
    """Schema for slide response."""
    id: UUID
    title: str
    subtitle: Optional[str]
    description: Optional[str]
    
    image_url: str
    image_alt: Optional[str]
    
    link_url: Optional[str]
    link_text: Optional[str]
    
    slide_type: SlideType
    text_color: Optional[str]
    overlay_color: Optional[str]
    
    sort_order: int
    is_active: bool
    
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SlideOrderUpdate(BaseModel):
    """Schema for updating slide order."""
    slide_ids: List[UUID] = Field(..., description="Ordered list of slide IDs")


class SlideListResponse(BaseModel):
    """Paginated slide list response."""
    items: List[SlideResponse]
    total: int
    page: int
    limit: int
    pages: int
