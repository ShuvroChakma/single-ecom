"""
Pydantic schemas for Brand and Collection.
"""
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime


# ============ BRAND SCHEMAS ============

class BrandCreate(BaseModel):
    """Schema for creating a brand."""
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    logo: Optional[str] = None
    is_active: bool = True


class BrandUpdate(BaseModel):
    """Schema for updating a brand."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    logo: Optional[str] = None
    is_active: Optional[bool] = None


class BrandResponse(BaseModel):
    """Schema for brand response."""
    id: UUID
    name: str
    slug: str
    logo: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ============ COLLECTION SCHEMAS ============

class CollectionCreate(BaseModel):
    """Schema for creating a collection."""
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    banner_image: Optional[str] = None
    is_active: bool = True


class CollectionUpdate(BaseModel):
    """Schema for updating a collection."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    banner_image: Optional[str] = None
    is_active: Optional[bool] = None


class CollectionResponse(BaseModel):
    """Schema for collection response."""
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    banner_image: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
