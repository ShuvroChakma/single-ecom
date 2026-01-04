"""
Pydantic schemas for Delivery Zones.
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime

from app.modules.delivery.models import ChargeType


# ============ REQUEST SCHEMAS ============

class DeliveryZoneCreate(BaseModel):
    """Schema for creating a delivery zone."""
    name: str = Field(..., min_length=2, max_length=100)
    districts: List[str] = Field(default=[], description="List of district names")
    charge_type: ChargeType = Field(default=ChargeType.FIXED)
    base_charge: Decimal = Field(..., ge=0)
    per_kg_charge: Optional[Decimal] = Field(default=None, ge=0)
    free_above: Optional[Decimal] = Field(default=None, ge=0)
    min_days: int = Field(default=1, ge=1)
    max_days: int = Field(default=3, ge=1)
    is_active: bool = Field(default=True)
    display_order: int = Field(default=0)


class DeliveryZoneUpdate(BaseModel):
    """Schema for updating a delivery zone."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    districts: Optional[List[str]] = None
    charge_type: Optional[ChargeType] = None
    base_charge: Optional[Decimal] = Field(default=None, ge=0)
    per_kg_charge: Optional[Decimal] = Field(default=None, ge=0)
    free_above: Optional[Decimal] = Field(default=None, ge=0)
    min_days: Optional[int] = Field(default=None, ge=1)
    max_days: Optional[int] = Field(default=None, ge=1)
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


# ============ RESPONSE SCHEMAS ============

class DeliveryZoneResponse(BaseModel):
    """Schema for delivery zone response."""
    id: UUID
    name: str
    districts: List[str]
    charge_type: ChargeType
    base_charge: Decimal
    per_kg_charge: Optional[Decimal]
    free_above: Optional[Decimal]
    min_days: int
    max_days: int
    is_active: bool
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class DeliveryChargeRequest(BaseModel):
    """Request to calculate delivery charge."""
    district: str = Field(..., min_length=2)
    order_amount: Decimal = Field(..., ge=0)
    total_weight_kg: Decimal = Field(default=Decimal("0"), ge=0)


class DeliveryChargeResponse(BaseModel):
    """Response with calculated delivery charge."""
    zone_name: str
    charge_type: ChargeType
    base_charge: Decimal
    weight_charge: Decimal = Decimal("0")
    total_charge: Decimal
    is_free: bool
    free_above: Optional[Decimal]
    estimated_days: str  # "2-4 days"
