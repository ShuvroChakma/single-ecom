"""
API endpoints for shopping cart operations.
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
from app.modules.users.models import User, Customer
from app.modules.users.repository import CustomerRepository
from app.modules.cart.service import CartService
from app.modules.cart.schemas import (
    AddToCartRequest,
    UpdateCartItemRequest,
    CartResponse,
    CartItemResponse,
    CartItemAddedResponse
)


router = APIRouter()


def get_cart_service(session: AsyncSession = Depends(get_db)) -> CartService:
    """Get cart service instance."""
    return CartService(session)


async def get_current_customer(
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db),
) -> Customer:
    """Verify user is a customer and return Customer record (no lazy load)."""
    if current_user.user_type != UserType.CUSTOMER:
        raise PermissionDeniedError(
            error_code=ErrorCode.PERMISSION_DENIED,
            message="Cart is only available for customers"
        )
    customer = await CustomerRepository(db).get_by_user_id(current_user.id)
    if not customer:
        raise PermissionDeniedError(
            error_code=ErrorCode.PERMISSION_DENIED,
            message="Customer profile not found"
        )
    return customer


# ============ CART ENDPOINTS ============

@router.get("", response_model=SuccessResponse[CartResponse])
async def get_cart(
    current_user: User = Depends(get_current_customer),
    service: CartService = Depends(get_cart_service)
):
    """
    Get current user's shopping cart.
    
    Returns cart with all items and real-time calculated prices.
    Price changes are detected and flagged.
    """
    cart = await service.get_cart(current_user.id)
    return create_success_response(
        message="Cart retrieved successfully",
        data=cart
    )


@router.post("/items", response_model=SuccessResponse[CartItemAddedResponse], status_code=201)
async def add_to_cart(
    request: AddToCartRequest,
    current_user: User = Depends(get_current_customer),
    service: CartService = Depends(get_cart_service)
):
    """
    Add item to cart.
    
    If the variant already exists in cart, quantity is incremented.
    Price snapshot is stored for price change detection.
    """
    result = await service.add_to_cart(
        customer_id=current_user.id,
        variant_id=request.variant_id,
        quantity=request.quantity
    )
    return create_success_response(
        message="Item added to cart",
        data=result
    )


@router.put("/items/{item_id}", response_model=SuccessResponse[CartItemResponse])
async def update_cart_item(
    item_id: UUID,
    request: UpdateCartItemRequest,
    current_user: User = Depends(get_current_customer),
    service: CartService = Depends(get_cart_service)
):
    """
    Update cart item quantity.
    
    Validates stock availability before updating.
    """
    item = await service.update_item_quantity(
        customer_id=current_user.id,
        item_id=item_id,
        quantity=request.quantity
    )
    return create_success_response(
        message="Cart item updated",
        data=item
    )


@router.delete("/items/{item_id}", response_model=SuccessResponse[dict])
async def remove_cart_item(
    item_id: UUID,
    current_user: User = Depends(get_current_customer),
    service: CartService = Depends(get_cart_service)
):
    """
    Remove item from cart.
    """
    await service.remove_item(
        customer_id=current_user.id,
        item_id=item_id
    )
    return create_success_response(
        message="Item removed from cart",
        data={"removed": True}
    )


@router.delete("", response_model=SuccessResponse[dict])
async def clear_cart(
    current_user: User = Depends(get_current_customer),
    service: CartService = Depends(get_cart_service)
):
    """
    Clear all items from cart.
    """
    await service.clear_cart(current_user.id)
    return create_success_response(
        message="Cart cleared",
        data={"cleared": True}
    )
