"""
Gift Card repository for DB access.
"""
import secrets
import string
from typing import Optional, List, Tuple
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.gift_cards.models import GiftCard, GiftCardTransaction, GiftCardStatus


def _generate_code() -> str:
    """Generate a unique 16-char gift card code: GIFT-XXXX-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    parts = ["".join(secrets.choice(chars) for _ in range(4)) for _ in range(3)]
    return "GIFT-" + "-".join(parts)


class GiftCardRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, card: GiftCard) -> GiftCard:
        """Persist a new GiftCard and return the refreshed instance."""
        self.session.add(card)
        await self.session.flush()
        await self.session.refresh(card)
        return card

    async def generate_unique_code(self) -> str:
        """Generate a DB-unique gift card code (up to 10 attempts)."""
        for _ in range(10):
            code = _generate_code()
            existing = await self.get_by_code(code)
            if not existing:
                return code
        raise RuntimeError("Could not generate unique gift card code after 10 attempts")

    async def get_by_id(self, card_id: UUID) -> Optional[GiftCard]:
        """Fetch a GiftCard by primary key with a row-level lock to prevent concurrent modification."""
        result = await self.session.execute(
            select(GiftCard).where(GiftCard.id == card_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[GiftCard]:
        """Fetch a GiftCard by code (case-insensitive) with a row-level lock to prevent double-spend."""
        result = await self.session.execute(
            select(GiftCard).where(GiftCard.code == code.upper()).with_for_update()
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        page: int = 1,
        limit: int = 20,
        status: Optional[GiftCardStatus] = None,
    ) -> Tuple[List[GiftCard], int]:
        """Return paginated list of gift cards with optional status filter."""
        query = select(GiftCard)
        if status:
            query = query.where(GiftCard.status == status)

        count_result = await self.session.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar_one()

        result = await self.session.execute(
            query.order_by(GiftCard.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        return result.scalars().all(), total

    async def save(self, card: GiftCard) -> GiftCard:
        """Persist updates to an existing GiftCard."""
        self.session.add(card)
        await self.session.flush()
        await self.session.refresh(card)
        return card

    async def create_transaction(self, tx: GiftCardTransaction) -> GiftCardTransaction:
        """Persist a redemption ledger entry."""
        self.session.add(tx)
        await self.session.flush()
        return tx

    async def list_transactions(self, card_id: UUID) -> List[GiftCardTransaction]:
        """Return all transactions for a gift card, newest first."""
        result = await self.session.execute(
            select(GiftCardTransaction)
            .where(GiftCardTransaction.gift_card_id == card_id)
            .order_by(GiftCardTransaction.created_at.desc())
        )
        return result.scalars().all()
