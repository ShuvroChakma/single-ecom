"""
DeliveryZone model for configuring delivery charges by region.
"""
from typing import Optional, List
from uuid import UUID, uuid4
from decimal import Decimal
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import String


class ChargeType(str, Enum):
    """Delivery charge calculation type."""
    FIXED = "FIXED"              # Fixed delivery charge
    WEIGHT_BASED = "WEIGHT_BASED"  # Base + per kg charge


class DeliveryZone(SQLModel, table=True):
    """Delivery zone database model for configuring charges by region."""
    __tablename__ = "delivery_zones"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Zone Info
    name: str = Field(max_length=100, description="Zone name e.g. 'Dhaka City'")
    districts: List[str] = Field(
        default=[],
        sa_column=Column(ARRAY(String)),
        description="List of districts in this zone. Use '*' for catch-all"
    )
    
    # Charge Calculation
    charge_type: ChargeType = Field(default=ChargeType.FIXED)
    base_charge: Decimal = Field(
        default=Decimal("0"),
        description="Base delivery fee"
    )
    per_kg_charge: Optional[Decimal] = Field(
        default=None,
        description="Additional charge per kg (for weight-based)"
    )
    
    # Free Delivery Threshold
    free_above: Optional[Decimal] = Field(
        default=None,
        description="Free delivery for orders above this amount"
    )
    
    # Estimated Delivery
    min_days: int = Field(default=1, description="Minimum delivery days")
    max_days: int = Field(default=3, description="Maximum delivery days")
    
    # Settings
    is_active: bool = Field(default=True)
    display_order: int = Field(default=0, description="Sort order for display")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
