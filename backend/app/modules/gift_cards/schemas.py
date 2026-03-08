"""
Gift Card Pydantic schemas.
"""
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field

from app.modules.gift_cards.models import GiftCardStatus


# ── Admin ──────────────────────────────────────────────────────────────────

class GiftCardCreate(BaseModel):
    """Admin: manually create a gift card."""
    initial_balance: Decimal = Field(..., gt=0, description="Card value in BDT")
    recipient_name: Optional[str] = Field(default=None, max_length=100)
    recipient_email: Optional[str] = Field(default=None, max_length=255)
    personal_message: Optional[str] = Field(default=None, max_length=500)
    expires_at: Optional[datetime] = None


class GiftCardResponse(BaseModel):
    """Full gift card representation."""

    id: UUID
    code: str
    initial_balance: Decimal
    remaining_balance: Decimal
    currency: str
    status: GiftCardStatus
    purchased_by: Optional[UUID] = None
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    personal_message: Optional[str] = None
    qr_code_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GiftCardListResponse(BaseModel):
    """Paginated list of gift cards."""

    items: list[GiftCardResponse]
    total: int
    page: int
    pages: int


class GiftCardTransactionResponse(BaseModel):
    """Gift card redemption ledger entry."""

    id: UUID
    gift_card_id: UUID
    order_id: Optional[UUID]
    amount_used: Decimal
    balance_before: Decimal
    balance_after: Decimal
    redeemed_by: str
    channel: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Customer / Public ───────────────────────────────────────────────────────

class ValidateGiftCardRequest(BaseModel):
    """Request to validate a gift card code."""

    code: str = Field(..., min_length=4, max_length=20)


class ValidateGiftCardResponse(BaseModel):
    """Result of gift card validation."""

    valid: bool
    remaining_balance: Decimal
    currency: str
    expires_at: Optional[datetime]
    message: str


# TODO: customer self-service purchase endpoint
class PurchaseGiftCardRequest(BaseModel):
    """Customer purchasing a gift card from the store."""
    initial_balance: Decimal = Field(..., gt=0)
    recipient_name: Optional[str] = Field(default=None, max_length=100)
    recipient_email: Optional[str] = Field(default=None, max_length=255)
    personal_message: Optional[str] = Field(default=None, max_length=500)
    expires_at: Optional[datetime] = None
    payment_method: str = Field(..., description="Payment gateway code")
