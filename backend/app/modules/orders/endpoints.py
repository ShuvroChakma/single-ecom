"""
API endpoints for Orders.
Customer checkout and order management.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import get_current_verified_user, require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.core.exceptions import PermissionDeniedError
from app.constants.enums import UserType
from app.constants.error_codes import ErrorCode
from app.constants.permissions import PermissionEnum
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.orders.service import OrderService
from app.modules.orders.models import OrderStatus
from app.modules.orders.schemas import (
    CreateOrderRequest,
    UpdateOrderStatusRequest,
    OrderResponse,
    OrderItemResponse,
    OrderListResponse,
    OrderCreatedResponse
)
from app.modules.cart.service import CartService
from app.modules.addresses.service import AddressService
from app.modules.delivery.service import DeliveryZoneService
from app.modules.promo_codes.service import PromoCodeService
from app.modules.payments.service import PaymentGatewayService


router = APIRouter()


def get_order_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> OrderService:
    """Get order service instance."""
    return OrderService(session, audit_service)


async def get_current_customer(
    current_user: User = Depends(get_current_verified_user)
) -> User:
    """Verify user is a customer."""
    if current_user.user_type != UserType.CUSTOMER:
        raise PermissionDeniedError(
            error_code=ErrorCode.PERMISSION_DENIED,
            message="Orders are only available for customers"
        )
    
    if not current_user.customer:
        raise PermissionDeniedError(
            error_code=ErrorCode.PERMISSION_DENIED,
            message="Customer profile not found"
        )
    
    return current_user


# ============ CUSTOMER ENDPOINTS ============

@router.post("", response_model=SuccessResponse[OrderCreatedResponse], status_code=201)
async def create_order(
    data: CreateOrderRequest,
    request: Request,
    current_user: User = Depends(get_current_customer),
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
):
    """
    Create an order from the current cart.
    
    Validates cart, address, promo code, and initiates payment if needed.
    """
    order_service = OrderService(session, audit_service)
    cart_service = CartService(session)
    address_service = AddressService(session)
    delivery_service = DeliveryZoneService(session)
    promo_service = PromoCodeService(session)
    payment_service = PaymentGatewayService(session)
    
    result = await order_service.create_order(
        customer_id=current_user.customer.id,
        request=data,
        cart_service=cart_service,
        address_service=address_service,
        delivery_service=delivery_service,
        promo_service=promo_service,
        payment_service=payment_service,
        http_request=request
    )
    
    return create_success_response(
        message=result.message,
        data=result
    )


@router.get("", response_model=SuccessResponse[List[OrderListResponse]])
async def list_my_orders(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_customer),
    service: OrderService = Depends(get_order_service)
):
    """List current customer's orders."""
    orders = await service.get_customer_orders(
        customer_id=current_user.customer.id,
        limit=limit,
        offset=offset
    )
    
    return create_success_response(
        message="Orders retrieved",
        data=orders
    )


@router.get("/{order_id}", response_model=SuccessResponse[OrderResponse])
async def get_my_order(
    order_id: UUID,
    current_user: User = Depends(get_current_customer),
    service: OrderService = Depends(get_order_service)
):
    """Get a specific order (customer view)."""
    order = await service.get_order(order_id, customer_id=current_user.customer.id)
    
    # Build response
    items = [OrderItemResponse.model_validate(i) for i in order.items]
    response = OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        is_pos_order=order.is_pos_order,
        pos_customer_name=order.pos_customer_name,
        pos_customer_phone=order.pos_customer_phone,
        shipping_address=order.shipping_address,
        is_gift=order.is_gift,
        gift_message=order.gift_message if not order.hide_prices else None,
        hide_prices=order.hide_prices,
        subtotal=order.subtotal,
        discount_amount=order.discount_amount,
        delivery_charge=order.delivery_charge,
        tax_amount=order.tax_amount,
        total=order.total,
        currency=order.currency,
        promo_code=order.promo_code,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        paid_at=order.paid_at,
        status=order.status,
        customer_notes=order.customer_notes,
        items=items,
        created_at=order.created_at,
        confirmed_at=order.confirmed_at,
        shipped_at=order.shipped_at,
        delivered_at=order.delivered_at
    )
    
    return create_success_response(
        message="Order retrieved",
        data=response
    )


@router.post("/{order_id}/cancel", response_model=SuccessResponse[OrderResponse])
async def cancel_my_order(
    order_id: UUID,
    reason: Optional[str] = None,
    request: Request = None,
    current_user: User = Depends(get_current_customer),
    service: OrderService = Depends(get_order_service)
):
    """Cancel an order (if still possible)."""
    order = await service.cancel_order(
        order_id=order_id,
        customer_id=current_user.customer.id,
        reason=reason,
        http_request=request
    )
    
    items = [OrderItemResponse.model_validate(i) for i in order.items]
    response = OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        is_pos_order=order.is_pos_order,
        pos_customer_name=order.pos_customer_name,
        pos_customer_phone=order.pos_customer_phone,
        shipping_address=order.shipping_address,
        is_gift=order.is_gift,
        gift_message=order.gift_message,
        hide_prices=order.hide_prices,
        subtotal=order.subtotal,
        discount_amount=order.discount_amount,
        delivery_charge=order.delivery_charge,
        tax_amount=order.tax_amount,
        total=order.total,
        currency=order.currency,
        promo_code=order.promo_code,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        paid_at=order.paid_at,
        status=order.status,
        customer_notes=order.customer_notes,
        items=items,
        created_at=order.created_at,
        confirmed_at=order.confirmed_at,
        shipped_at=order.shipped_at,
        delivered_at=order.delivered_at
    )
    
    return create_success_response(
        message="Order cancelled",
        data=response
    )


# ============ ADMIN ENDPOINTS ============

@router.get("/admin/all", response_model=SuccessResponse[List[OrderListResponse]])
async def list_all_orders(
    status: Optional[OrderStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_permissions([PermissionEnum.ORDERS_READ])),
    service: OrderService = Depends(get_order_service)
):
    """List all orders (admin)."""
    orders = await service.get_all_orders(status=status, limit=limit, offset=offset)
    
    result = [
        OrderListResponse(
            id=o.id,
            order_number=o.order_number,
            status=o.status,
            payment_status=o.payment_status,
            total=o.total,
            item_count=len(o.items) if o.items else 0,
            created_at=o.created_at
        )
        for o in orders
    ]
    
    return create_success_response(
        message="Orders retrieved",
        data=result
    )


@router.get("/admin/{order_id}", response_model=SuccessResponse[OrderResponse])
async def get_order_admin(
    order_id: UUID,
    current_user: User = Depends(require_permissions([PermissionEnum.ORDERS_READ])),
    service: OrderService = Depends(get_order_service)
):
    """Get order details (admin)."""
    order = await service.get_order(order_id)
    
    items = [OrderItemResponse.model_validate(i) for i in order.items]
    response = OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        is_pos_order=order.is_pos_order,
        pos_customer_name=order.pos_customer_name,
        pos_customer_phone=order.pos_customer_phone,
        shipping_address=order.shipping_address,
        is_gift=order.is_gift,
        gift_message=order.gift_message,
        hide_prices=order.hide_prices,
        subtotal=order.subtotal,
        discount_amount=order.discount_amount,
        delivery_charge=order.delivery_charge,
        tax_amount=order.tax_amount,
        total=order.total,
        currency=order.currency,
        promo_code=order.promo_code,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        paid_at=order.paid_at,
        status=order.status,
        customer_notes=order.customer_notes,
        items=items,
        created_at=order.created_at,
        confirmed_at=order.confirmed_at,
        shipped_at=order.shipped_at,
        delivered_at=order.delivered_at
    )
    
    return create_success_response(
        message="Order retrieved",
        data=response
    )


@router.patch("/admin/{order_id}/status", response_model=SuccessResponse[OrderResponse])
async def update_order_status(
    order_id: UUID,
    data: UpdateOrderStatusRequest,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.ORDERS_WRITE])),
    service: OrderService = Depends(get_order_service)
):
    """Update order status (admin)."""
    order = await service.update_status(
        order_id=order_id,
        request=data,
        actor_id=str(current_user.id),
        http_request=request
    )
    
    items = [OrderItemResponse.model_validate(i) for i in order.items]
    response = OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        is_pos_order=order.is_pos_order,
        pos_customer_name=order.pos_customer_name,
        pos_customer_phone=order.pos_customer_phone,
        shipping_address=order.shipping_address,
        is_gift=order.is_gift,
        gift_message=order.gift_message,
        hide_prices=order.hide_prices,
        subtotal=order.subtotal,
        discount_amount=order.discount_amount,
        delivery_charge=order.delivery_charge,
        tax_amount=order.tax_amount,
        total=order.total,
        currency=order.currency,
        promo_code=order.promo_code,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        paid_at=order.paid_at,
        status=order.status,
        customer_notes=order.customer_notes,
        items=items,
        created_at=order.created_at,
        confirmed_at=order.confirmed_at,
        shipped_at=order.shipped_at,
        delivered_at=order.delivered_at
    )
    
    return create_success_response(
        message=f"Order status updated to {order.status.value}",
        data=response
    )
