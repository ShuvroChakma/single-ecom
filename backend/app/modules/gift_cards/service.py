"""
Gift Card service — business logic.
"""
import logging
from pathlib import Path
from typing import Tuple
from uuid import UUID
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.email import EmailService
from app.core.exceptions import NotFoundError, ValidationError
from app.constants.error_codes import ErrorCode
from app.modules.gift_cards.models import GiftCard, GiftCardTransaction, GiftCardStatus, GiftCardChannel
from app.modules.gift_cards.schemas import GiftCardCreate, ValidateGiftCardResponse
from app.modules.gift_cards.repository import GiftCardRepository

logger = logging.getLogger(__name__)


class GiftCardService:
    def __init__(self, session: AsyncSession):
        self.repo = GiftCardRepository(session)
        self.session = session

    async def create_card(
        self,
        data: GiftCardCreate,
        created_by: str,
    ) -> GiftCard:
        """Admin or system creates a gift card."""
        code = await self.repo.generate_unique_code()
        card = GiftCard(
            code=code,
            initial_balance=data.initial_balance,
            remaining_balance=data.initial_balance,
            recipient_name=data.recipient_name,
            recipient_email=data.recipient_email,
            personal_message=data.personal_message,
            expires_at=data.expires_at,
            created_by=created_by,
        )
        card = await self.repo.create(card)

        # Generate QR code
        try:
            qr_url = self._generate_qr(card.code)
            card.qr_code_url = qr_url
            card = await self.repo.save(card)
        except Exception as e:
            logger.warning("QR generation failed for gift card %s: %s", card.code, e)

        # Send email if recipient provided
        if data.recipient_email:
            try:
                await self._send_gift_card_email(card)
            except Exception as e:
                logger.warning("Gift card email failed for %s: %s", card.recipient_email, e)

        return card

    async def validate_code(self, code: str) -> ValidateGiftCardResponse:
        """Validate a gift card code and return its balance."""
        card = await self.repo.get_by_code(code.upper())
        if not card:
            return ValidateGiftCardResponse(
                valid=False,
                remaining_balance=Decimal("0"),
                currency="BDT",
                expires_at=None,
                message="Invalid gift card code",
            )

        # Check expiry
        if card.expires_at and datetime.now(timezone.utc) > card.expires_at:
            card.status = GiftCardStatus.EXPIRED
            await self.repo.save(card)
            return ValidateGiftCardResponse(
                valid=False,
                remaining_balance=Decimal("0"),
                currency=card.currency,
                expires_at=card.expires_at,
                message="Gift card has expired",
            )

        if card.status != GiftCardStatus.ACTIVE:
            return ValidateGiftCardResponse(
                valid=False,
                remaining_balance=card.remaining_balance,
                currency=card.currency,
                expires_at=card.expires_at,
                message=f"Gift card is {card.status.value.lower()}",
            )

        return ValidateGiftCardResponse(
            valid=True,
            remaining_balance=card.remaining_balance,
            currency=card.currency,
            expires_at=card.expires_at,
            message="Gift card is valid",
        )

    async def redeem(
        self,
        code: str,
        amount_to_use: Decimal,
        order_id: UUID,
        redeemed_by: str,
        channel: GiftCardChannel = GiftCardChannel.ONLINE,
    ) -> Tuple[GiftCard, Decimal]:
        """
        Deduct from gift card balance. Call this inside the order transaction (before commit).
        Returns (updated_card, actual_amount_deducted).
        actual_amount_deducted may be less than amount_to_use if balance < amount_to_use.
        """
        card = await self.repo.get_by_code(code.upper())
        if not card or card.status != GiftCardStatus.ACTIVE:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Gift card is not valid for redemption",
                field="gift_card_code",
            )

        # Check expiry
        if card.expires_at and datetime.now(timezone.utc) > card.expires_at:
            card.status = GiftCardStatus.EXPIRED
            await self.repo.save(card)
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Gift card has expired",
                field="gift_card_code",
            )

        if card.remaining_balance <= 0:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Gift card has no remaining balance",
                field="gift_card_code",
            )

        # Deduct: use min of requested and available
        actual_deduction = min(amount_to_use, card.remaining_balance)
        balance_before = card.remaining_balance
        card.remaining_balance -= actual_deduction
        card.updated_at = datetime.now(timezone.utc)

        if card.remaining_balance <= 0:
            card.remaining_balance = Decimal("0")
            card.status = GiftCardStatus.EXHAUSTED

        tx = GiftCardTransaction(
            gift_card_id=card.id,
            order_id=order_id,
            amount_used=actual_deduction,
            balance_before=balance_before,
            balance_after=card.remaining_balance,
            redeemed_by=redeemed_by,
            channel=channel,
        )
        await self.repo.save(card)
        await self.repo.create_transaction(tx)
        return card, actual_deduction

    async def cancel_card(self, card_id: UUID, _actor_id: str) -> GiftCard:
        """Admin: cancel a gift card."""
        card = await self.repo.get_by_id(card_id)
        if not card:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Gift card not found",
            )
        card.status = GiftCardStatus.CANCELLED
        card.updated_at = datetime.now(timezone.utc)
        return await self.repo.save(card)

    def _generate_qr(self, code: str) -> str:
        """Generate QR code PNG and save to media/gift_cards/. Returns relative path."""
        try:
            import qrcode  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeError(
                "qrcode package is not installed. Run: pip install 'qrcode[pil]'"
            ) from exc

        output_dir = Path(settings.MEDIA_ROOT) / "gift_cards"
        output_dir.mkdir(parents=True, exist_ok=True)

        img = qrcode.make(code)
        filename = f"{code}.png"
        filepath = output_dir / filename
        img.save(str(filepath))
        return f"{settings.BASE_URL}/media/gift_cards/{filename}"

    async def _send_gift_card_email(self, card: GiftCard) -> None:
        """Send gift card code to recipient via email."""
        html = EmailService.render_template("gift_card.html", {
            "code": card.code,
            "balance": card.initial_balance,
            "currency": card.currency,
            "recipient_name": card.recipient_name or "Valued Customer",
            "personal_message": card.personal_message,
            "expires_at": card.expires_at,
            "qr_code_url": card.qr_code_url,
            "app_name": settings.PROJECT_NAME,
        })
        await EmailService.send_email(
            to_email=card.recipient_email,
            subject="Your Gift Card",
            html_content=html,
        )
