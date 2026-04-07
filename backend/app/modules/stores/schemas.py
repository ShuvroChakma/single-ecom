"""
Pydantic schemas for Stores API.
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime


# ============ REQUEST SCHEMAS ============

class StoreCreate(BaseModel):
    """Request to create a store."""
    name: str = Field(..., max_length=200)
    address: str = Field(..., max_length=500)
    city: str = Field(..., max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: str = Field(default="Bangladesh", max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=200)
    hours: Optional[str] = Field(None, max_length=500)
    latitude: Decimal = Field(..., ge=-90, le=90)
    longitude: Decimal = Field(..., ge=-180, le=180)
    image_url: Optional[str] = Field(None, max_length=500)
    is_active: bool = Field(default=True)


class StoreUpdate(BaseModel):
    """Request to update a store."""
    name: Optional[str] = Field(None, max_length=200)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=200)
    hours: Optional[str] = Field(None, max_length=500)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    image_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


# ============ RESPONSE SCHEMAS ============

class StoreResponse(BaseModel):
    """Store response."""
    id: UUID
    name: str
    address: str
    city: str
    state: Optional[str] = None
    country: str
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    hours: Optional[str] = None
    latitude: Decimal
    longitude: Decimal
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StoreListResponse(BaseModel):
    """List of stores."""
    items: List[StoreResponse]
    total: int
