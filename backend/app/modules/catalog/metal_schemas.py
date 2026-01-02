"""
Pydantic schemas for Metal and Purity.
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime


# ============ METAL SCHEMAS ============

class MetalCreate(BaseModel):
    """Schema for creating a metal."""
    name: str = Field(..., min_length=1, max_length=50)
    code: str = Field(..., min_length=1, max_length=20, pattern=r"^[A-Z_]+$")
    sort_order: int = Field(default=0)
    is_active: bool = True


class MetalUpdate(BaseModel):
    """Schema for updating a metal."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    code: Optional[str] = Field(None, min_length=1, max_length=20, pattern=r"^[A-Z_]+$")
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class MetalResponse(BaseModel):
    """Schema for metal response."""
    id: UUID
    name: str
    code: str
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PurityResponse(BaseModel):
    """Schema for purity response (nested)."""
    id: UUID
    name: str
    code: str
    fineness: Decimal
    sort_order: int
    is_active: bool

    model_config = {"from_attributes": True}


class MetalWithPuritiesResponse(MetalResponse):
    """Metal with nested purities."""
    purities: List[PurityResponse] = []


# ============ PURITY SCHEMAS ============

class PurityCreate(BaseModel):
    """Schema for creating a purity."""
    metal_id: UUID
    name: str = Field(..., min_length=1, max_length=20)
    code: str = Field(..., min_length=1, max_length=10, pattern=r"^[A-Z0-9]+$")
    fineness: Decimal = Field(..., ge=0, le=1, description="0.916 for 22K")
    sort_order: int = Field(default=0)
    is_active: bool = True


class PurityUpdate(BaseModel):
    """Schema for updating a purity."""
    metal_id: Optional[UUID] = None
    name: Optional[str] = Field(None, min_length=1, max_length=20)
    code: Optional[str] = Field(None, min_length=1, max_length=10, pattern=r"^[A-Z0-9]+$")
    fineness: Optional[Decimal] = Field(None, ge=0, le=1)
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class PurityFullResponse(PurityResponse):
    """Full purity response with metal info."""
    metal_id: UUID
    created_at: datetime
    updated_at: datetime
