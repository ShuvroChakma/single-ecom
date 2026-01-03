"""
Slide model for homepage banners/carousels.
"""
from typing import Optional
from uuid import UUID, uuid4
from enum import Enum
from sqlmodel import Field, SQLModel
from datetime import datetime


class SlideType(str, Enum):
    """Types of slides."""
    BANNER = "BANNER"  # Full-width homepage banner
    PROMO = "PROMO"    # Promotional slide
    OFFER = "OFFER"    # Special offer
    COLLECTION = "COLLECTION"  # Collection highlight


class SlideBase(SQLModel):
    """Base Slide schema."""
    title: str = Field(index=True, max_length=200)
    subtitle: Optional[str] = Field(default=None, max_length=300)
    description: Optional[str] = Field(default=None)
    
    # Image
    image_url: str = Field(description="URL to slide image")
    image_alt: Optional[str] = Field(default=None, max_length=200)
    
    # Link
    link_url: Optional[str] = Field(default=None, description="Where slide links to")
    link_text: Optional[str] = Field(default="Shop Now", max_length=50)
    
    # Type and styling
    slide_type: SlideType = Field(default=SlideType.BANNER)
    text_color: Optional[str] = Field(default="#FFFFFF", max_length=20)
    overlay_color: Optional[str] = Field(default=None, max_length=50)
    
    # Display options
    sort_order: int = Field(default=0)
    is_active: bool = Field(default=True)
    
    # Scheduling
    start_date: Optional[datetime] = Field(default=None)
    end_date: Optional[datetime] = Field(default=None)


class Slide(SlideBase, table=True):
    """Slide database model."""
    __tablename__ = "slides"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
