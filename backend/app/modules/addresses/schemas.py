"""
Pydantic schemas for Customer Addresses.
"""
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime


# ============ REQUEST SCHEMAS ============

class AddressCreate(BaseModel):
    """Schema for creating a new address."""
    label: str = Field(default="Home", max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    address_line1: str = Field(..., min_length=5, max_length=255)
    address_line2: Optional[str] = Field(default=None, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    country: str = Field(default="Bangladesh", max_length=50)
    is_default: bool = Field(default=False)


class AddressUpdate(BaseModel):
    """Schema for updating an address."""
    label: Optional[str] = Field(default=None, max_length=50)
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, min_length=10, max_length=20)
    address_line1: Optional[str] = Field(default=None, min_length=5, max_length=255)
    address_line2: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, min_length=2, max_length=100)
    district: Optional[str] = Field(default=None, min_length=2, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    country: Optional[str] = Field(default=None, max_length=50)
    is_default: Optional[bool] = None


# ============ RESPONSE SCHEMAS ============

class AddressResponse(BaseModel):
    """Schema for address response."""
    id: UUID
    label: str
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str]
    city: str
    district: str
    postal_code: Optional[str]
    country: str
    is_default: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class AddressListResponse(BaseModel):
    """Response for list of addresses."""
    addresses: list[AddressResponse]
    count: int
    max_allowed: int = 5
