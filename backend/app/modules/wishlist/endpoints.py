"""
API endpoints for wishlist operations.
All endpoints require authenticated customer.
"""
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import get_current_verified_user
from app.core.schemas.response import SuccessResponse, create_success_response
from app.constants.enums import UserType
from app.core.exceptions import PermissionDeniedError
from app.constants.error_codes import ErrorCode
from app.modules.users.models import User
from app.modules.wishlist.service import WishlistService
from app.modules.wishlist.schemas import (
    AddToWishlistRequest,
    WishlistResponse,
    WishlistItemResponse,
    WishlistCheckResponse
)


router = APIRouter()


def get_wishlist_service(session: AsyncSession = Depends(get_db)) -> WishlistService:
    """Get wishlist service instance."""
    return WishlistService(session)


async def get_current_customer(
    current_user: User = Depends(get_current_verified_user)
) -> User:
    """Verify user is a customer."""
    if current_user.user_type != UserType.CUSTOMER:
        raise PermissionDeniedError(
            error_code=ErrorCode.PERMISSION_DENIED,
            message="Wishlist is only available for customers"
        )

    if not current_user.customer:
        raise PermissionDeniedError(
            error_code=ErrorCode.PERMISSION_DENIED,
            message="Customer profile not found"
        )

    return current_user


@router.get("", response_model=SuccessResponse[WishlistResponse])
async def get_wishlist(
    current_user: User = Depends(get_current_customer),
    service: WishlistService = Depends(get_wishlist_service)
):
    """Get current user's wishlist."""
    wishlist = await service.get_wishlist(current_user.customer.id)
    return create_success_response(
        message="Wishlist retrieved successfully",
        data=wishlist
    )


@router.post("", response_model=SuccessResponse[WishlistItemResponse], status_code=201)
async def add_to_wishlist(
    request: AddToWishlistRequest,
    current_user: User = Depends(get_current_customer),
    service: WishlistService = Depends(get_wishlist_service)
):
    """Add product to wishlist."""
    item = await service.add_to_wishlist(
        customer_id=current_user.customer.id,
        product_id=request.product_id,
        variant_id=request.variant_id
    )
    return create_success_response(
        message="Item added to wishlist",
        data=item
    )


@router.delete("/{item_id}", response_model=SuccessResponse[dict])
async def remove_from_wishlist(
    item_id: UUID,
    current_user: User = Depends(get_current_customer),
    service: WishlistService = Depends(get_wishlist_service)
):
    """Remove item from wishlist."""
    await service.remove_from_wishlist(
        customer_id=current_user.customer.id,
        item_id=item_id
    )
    return create_success_response(
        message="Item removed from wishlist",
        data={"removed": True}
    )


@router.delete("", response_model=SuccessResponse[dict])
async def clear_wishlist(
    current_user: User = Depends(get_current_customer),
    service: WishlistService = Depends(get_wishlist_service)
):
    """Clear all items from wishlist."""
    await service.clear_wishlist(current_user.customer.id)
    return create_success_response(
        message="Wishlist cleared",
        data={"cleared": True}
    )


@router.get("/check/{product_id}", response_model=SuccessResponse[WishlistCheckResponse])
async def check_in_wishlist(
    product_id: UUID,
    current_user: User = Depends(get_current_customer),
    service: WishlistService = Depends(get_wishlist_service)
):
    """Check if product is in wishlist."""
    result = await service.check_in_wishlist(
        customer_id=current_user.customer.id,
        product_id=product_id
    )
    return create_success_response(
        message="Wishlist check completed",
        data=result
    )


@router.post("/{item_id}/move-to-cart", response_model=SuccessResponse[dict])
async def move_to_cart(
    item_id: UUID,
    current_user: User = Depends(get_current_customer),
    service: WishlistService = Depends(get_wishlist_service)
):
    """Move wishlist item to cart."""
    await service.move_to_cart(
        customer_id=current_user.customer.id,
        item_id=item_id
    )
    return create_success_response(
        message="Item moved to cart",
        data={"success": True}
    )
