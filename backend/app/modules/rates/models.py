"""
Daily Rate model for jewelry pricing engine.
"""
from typing import Optional
from uuid import UUID, uuid4
from decimal import Decimal
from enum import Enum
from sqlmodel import Field, SQLModel
from datetime import datetime


class RateSource(str, Enum):
    """Source of the rate."""
    BAJUS = "BAJUS"
    MANUAL = "MANUAL"
    API = "API"


class DailyRateBase(SQLModel):
    """Base DailyRate schema."""
    source: RateSource = Field(default=RateSource.MANUAL)
    metal_type: str = Field(index=True, description="GOLD, SILVER, PLATINUM")
    purity: str = Field(index=True, description="22K, 18K, etc.")
    rate_per_gram: Decimal = Field(description="Price per gram in currency")
    currency: str = Field(default="BDT")
    effective_date: datetime = Field(default_factory=datetime.utcnow, index=True)


class DailyRate(DailyRateBase, table=True):
    """DailyRate database model."""
    __tablename__ = "daily_rates"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    metal_id: Optional[UUID] = Field(default=None, foreign_key="metals.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = Field(default=None, description="User ID who created this rate")
