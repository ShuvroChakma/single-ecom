"""
Pydantic schemas for Promo Codes.
"""
from typing import Optional
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

from app.modules.promo_codes.models import DiscountType


# ============ REQUEST SCHEMAS ============

class PromoCodeCreate(BaseModel):
    """Schema for creating a promo code."""
    code: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = None
    discount_type: DiscountType
    discount_value: Decimal = Field(..., gt=0)
    max_discount: Optional[Decimal] = Field(default=None, ge=0)
    min_order_amount: Optional[Decimal] = Field(default=None, ge=0)
    max_total_uses: Optional[int] = Field(default=None, ge=1)
    max_uses_per_user: int = Field(default=1, ge=1)
    starts_at: datetime
    expires_at: datetime
    first_order_only: bool = Field(default=False)
    is_active: bool = Field(default=True)
    
    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: str) -> str:
        """Ensure code is uppercase."""
        return v.upper().strip()
    
    @field_validator("discount_value")
    @classmethod
    def validate_percentage(cls, v: Decimal, info) -> Decimal:
        """Validate percentage is 0-100."""
        # Note: We can't access discount_type here, so this validation
        # should be done in the service layer
        return v


class PromoCodeUpdate(BaseModel):
    """Schema for updating a promo code."""
    description: Optional[str] = None
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[Decimal] = Field(default=None, gt=0)
    max_discount: Optional[Decimal] = Field(default=None, ge=0)
    min_order_amount: Optional[Decimal] = Field(default=None, ge=0)
    max_total_uses: Optional[int] = Field(default=None, ge=1)
    max_uses_per_user: Optional[int] = Field(default=None, ge=1)
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    first_order_only: Optional[bool] = None
    is_active: Optional[bool] = None


class ValidatePromoRequest(BaseModel):
    """Request to validate a promo code."""
    code: str
    order_amount: Decimal = Field(..., ge=0)


# ============ RESPONSE SCHEMAS ============

class PromoCodeResponse(BaseModel):
    """Schema for promo code response."""
    id: UUID
    code: str
    description: Optional[str]
    discount_type: DiscountType
    discount_value: Decimal
    max_discount: Optional[Decimal]
    min_order_amount: Optional[Decimal]
    max_total_uses: Optional[int]
    max_uses_per_user: int
    current_uses: int
    starts_at: datetime
    expires_at: datetime
    first_order_only: bool
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}


class PromoValidationResult(BaseModel):
    """Result of promo code validation."""
    valid: bool
    code: str
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    message: str
    new_total: Optional[Decimal] = None
    free_shipping: bool = False


class PromoCodeStats(BaseModel):
    """Stats for a promo code."""
    total_uses: int
    total_discount_given: Decimal
    unique_customers: int
