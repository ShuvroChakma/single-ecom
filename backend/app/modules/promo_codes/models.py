"""
PromoCode models for managing promotional discounts.
"""
from typing import Optional
from uuid import UUID, uuid4
from decimal import Decimal
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class DiscountType(str, Enum):
    """Type of discount."""
    PERCENTAGE = "PERCENTAGE"        # e.g., 10% off
    FIXED_AMOUNT = "FIXED_AMOUNT"    # e.g., ৳500 off
    FREE_SHIPPING = "FREE_SHIPPING"  # Free delivery


class PromoCode(SQLModel, table=True):
    """Promo code database model."""
    __tablename__ = "promo_codes"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Code Details
    code: str = Field(max_length=50, unique=True, index=True)
    description: Optional[str] = Field(default=None)
    
    # Discount Configuration
    discount_type: DiscountType = Field(default=DiscountType.PERCENTAGE)
    discount_value: Decimal = Field(
        description="Percentage (0-100) or fixed amount"
    )
    max_discount: Optional[Decimal] = Field(
        default=None,
        description="Maximum discount for percentage type"
    )
    
    # Conditions
    min_order_amount: Optional[Decimal] = Field(
        default=None,
        description="Minimum order value required"
    )
    
    # Usage Limits
    max_total_uses: Optional[int] = Field(
        default=None,
        description="Total number of uses allowed"
    )
    max_uses_per_user: int = Field(
        default=1,
        description="Maximum uses per customer"
    )
    current_uses: int = Field(default=0)
    
    # Validity Period
    starts_at: datetime = Field()
    expires_at: datetime = Field()
    
    # Targeting
    first_order_only: bool = Field(default=False)
    
    # Status
    is_active: bool = Field(default=True)
    
    # Audit
    created_by: Optional[UUID] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PromoCodeUse(SQLModel, table=True):
    """Track promo code usage per customer."""
    __tablename__ = "promo_code_uses"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    promo_code_id: UUID = Field(foreign_key="promo_codes.id", index=True)
    customer_id: UUID = Field(foreign_key="customers.id", index=True)
    order_id: Optional[UUID] = Field(default=None, index=True)  # FK added after orders table
    
    discount_applied: Decimal = Field(description="Actual discount amount")
    used_at: datetime = Field(default_factory=datetime.utcnow)
