"""
Gift Card API endpoints.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.core.exceptions import NotFoundError
from app.constants.error_codes import ErrorCode
from app.constants.permissions import PermissionEnum
from app.modules.users.models import User
from app.modules.gift_cards.service import GiftCardService
from app.modules.gift_cards.models import GiftCardStatus
from app.modules.gift_cards.schemas import (
    GiftCardCreate,
    GiftCardResponse,
    GiftCardListResponse,
    GiftCardTransactionResponse,
    ValidateGiftCardRequest,
    ValidateGiftCardResponse,
)

router = APIRouter()


def get_gift_card_service(session: AsyncSession = Depends(get_db)) -> GiftCardService:
    return GiftCardService(session)


# ── Public ──────────────────────────────────────────────────────────────────

@router.post("/validate", response_model=SuccessResponse[ValidateGiftCardResponse])
async def validate_gift_card(
    body: ValidateGiftCardRequest,
    service: GiftCardService = Depends(get_gift_card_service),
):
    """Validate a gift card code and return remaining balance (public)."""
    result = await service.validate_code(body.code)
    return create_success_response(message="Gift card validated", data=result)


# ── Admin ───────────────────────────────────────────────────────────────────

@router.post(
    "/admin",
    response_model=SuccessResponse[GiftCardResponse],
    status_code=201,
)
async def create_gift_card(
    data: GiftCardCreate,
    current_user: User = Depends(require_permissions([PermissionEnum.GIFT_CARDS_WRITE])),
    service: GiftCardService = Depends(get_gift_card_service),
):
    """Admin: create a new gift card."""
    card = await service.create_card(data, created_by=str(current_user.id))
    await service.session.commit()
    return create_success_response(
        message="Gift card created", data=GiftCardResponse.model_validate(card)
    )


@router.get("/admin", response_model=SuccessResponse[GiftCardListResponse])
async def list_gift_cards(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    status: Optional[GiftCardStatus] = Query(default=None),
    current_user: User = Depends(require_permissions([PermissionEnum.GIFT_CARDS_READ])),
    service: GiftCardService = Depends(get_gift_card_service),
):
    """Admin: list all gift cards with pagination."""
    cards, total = await service.repo.list_all(page=page, limit=limit, status=status)
    pages = (total + limit - 1) // limit
    return create_success_response(
        message="Gift cards retrieved",
        data=GiftCardListResponse(
            items=[GiftCardResponse.model_validate(c) for c in cards],
            total=total,
            page=page,
            pages=pages,
        ),
    )


@router.get("/admin/{card_id}", response_model=SuccessResponse[GiftCardResponse])
async def get_gift_card(
    card_id: UUID,
    current_user: User = Depends(require_permissions([PermissionEnum.GIFT_CARDS_READ])),
    service: GiftCardService = Depends(get_gift_card_service),
):
    """Admin: get a single gift card."""
    card = await service.repo.get_by_id(card_id)
    if not card:
        raise NotFoundError(error_code=ErrorCode.RESOURCE_NOT_FOUND, message="Gift card not found")
    return create_success_response(
        message="Gift card retrieved", data=GiftCardResponse.model_validate(card)
    )


@router.get(
    "/admin/{card_id}/transactions",
    response_model=SuccessResponse[list[GiftCardTransactionResponse]],
)
async def get_gift_card_transactions(
    card_id: UUID,
    current_user: User = Depends(require_permissions([PermissionEnum.GIFT_CARDS_READ])),
    service: GiftCardService = Depends(get_gift_card_service),
):
    """Admin: get redemption history for a gift card."""
    txs = await service.repo.list_transactions(card_id)
    return create_success_response(
        message="Transactions retrieved",
        data=[GiftCardTransactionResponse.model_validate(t) for t in txs],
    )


@router.patch(
    "/admin/{card_id}/cancel",
    response_model=SuccessResponse[GiftCardResponse],
)
async def cancel_gift_card(
    card_id: UUID,
    current_user: User = Depends(require_permissions([PermissionEnum.GIFT_CARDS_WRITE])),
    service: GiftCardService = Depends(get_gift_card_service),
):
    """Admin: cancel a gift card."""
    card = await service.cancel_card(card_id, str(current_user.id))
    await service.session.commit()
    return create_success_response(
        message="Gift card cancelled", data=GiftCardResponse.model_validate(card)
    )
