"""
Gift Card models.
"""
from typing import Optional
from uuid import UUID, uuid4
from decimal import Decimal
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class GiftCardStatus(str, Enum):
    """Gift card lifecycle status."""
    ACTIVE = "ACTIVE"
    EXHAUSTED = "EXHAUSTED"   # remaining_balance == 0
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class GiftCardChannel(str, Enum):
    """Redemption channel."""
    ONLINE = "ONLINE"
    POS = "POS"


class GiftCard(SQLModel, table=True):
    """Issued gift card instance."""
    __tablename__ = "gift_cards"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    code: str = Field(max_length=20, unique=True, index=True)  # "GIFT-XXXX-XXXX-XXXX"

    # Value
    initial_balance: Decimal = Field(decimal_places=2, max_digits=10)
    remaining_balance: Decimal = Field(decimal_places=2, max_digits=10)
    currency: str = Field(default="BDT", max_length=3)

    # Who purchased it
    purchased_by: Optional[UUID] = Field(default=None, foreign_key="customers.id", index=True)
    purchased_order_id: Optional[UUID] = Field(default=None, foreign_key="orders.id")

    # Recipient (for email delivery)
    recipient_name: Optional[str] = Field(default=None, max_length=100)
    recipient_email: Optional[str] = Field(default=None, max_length=255)
    personal_message: Optional[str] = Field(default=None, max_length=500)

    # QR code (stored path/URL)
    qr_code_url: Optional[str] = Field(default=None, max_length=500)

    # Validity
    expires_at: Optional[datetime] = Field(default=None)
    status: GiftCardStatus = Field(default=GiftCardStatus.ACTIVE)

    # Audit
    created_by: str = Field(max_length=50)  # user UUID or "admin"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class GiftCardTransaction(SQLModel, table=True):
    """Ledger entry for each gift card redemption."""
    __tablename__ = "gift_card_transactions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    gift_card_id: UUID = Field(foreign_key="gift_cards.id", index=True)
    order_id: Optional[UUID] = Field(default=None, foreign_key="orders.id")

    amount_used: Decimal = Field(decimal_places=2, max_digits=10)
    balance_before: Decimal = Field(decimal_places=2, max_digits=10)
    balance_after: Decimal = Field(decimal_places=2, max_digits=10)

    redeemed_by: str = Field(max_length=50)   # customer UUID or staff UUID
    channel: GiftCardChannel = Field(default=GiftCardChannel.ONLINE)

    created_at: datetime = Field(default_factory=datetime.utcnow)
