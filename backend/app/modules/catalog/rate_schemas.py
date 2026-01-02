"""
Pydantic schemas for Daily Rates and pricing.
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime

from app.modules.catalog.rate_models import RateSource


# ============ DAILY RATE SCHEMAS ============

class DailyRateCreate(BaseModel):
    """Schema for creating a daily rate."""
    metal_id: Optional[UUID] = None
    metal_type: str = Field(..., min_length=1, max_length=20)
    purity: str = Field(..., min_length=1, max_length=20)
    rate_per_gram: Decimal = Field(..., gt=0)
    currency: str = Field(default="BDT", max_length=5)
    source: RateSource = RateSource.MANUAL
    effective_date: Optional[datetime] = None


class DailyRateResponse(BaseModel):
    """Schema for daily rate response."""
    id: UUID
    metal_id: Optional[UUID]
    metal_type: str
    purity: str
    rate_per_gram: Decimal
    currency: str
    source: RateSource
    effective_date: datetime
    created_at: datetime
    created_by: Optional[str]

    model_config = {"from_attributes": True}


# ============ PRICE CALCULATION SCHEMAS ============

class PriceBreakdown(BaseModel):
    """Breakdown of product price calculation."""
    rate_per_gram: Decimal
    metal_cost: Decimal
    making_charge_type: str
    making_charge_value: Decimal
    making_charge: Decimal
    subtotal: Decimal
    tax_type: str
    tax_rate: Decimal
    tax_amount: Decimal
    total_price: Decimal


class VariantWithPricing(BaseModel):
    """Product variant with calculated pricing."""
    id: UUID
    sku: str
    metal_type: str
    metal_purity: str
    metal_color: str
    size: Optional[str]
    gross_weight: Decimal
    net_weight: Decimal
    is_default: bool
    stock_quantity: int
    pricing: PriceBreakdown


class CurrentRatesResponse(BaseModel):
    """Current rates for all metals/purities."""
    rates: List[DailyRateResponse]
    last_updated: datetime
