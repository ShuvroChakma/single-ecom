"""
Admin POS (Point of Sale) endpoints for walk-in customers.
"""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.core.exceptions import ValidationError, NotFoundError
from app.constants.error_codes import ErrorCode
from app.constants.permissions import PermissionEnum
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.orders.models import Order, OrderItem, OrderStatus, PaymentStatus
from app.modules.orders.repository import OrderRepository, OrderItemRepository
from app.modules.orders.schemas import POSOrderRequest, OrderResponse, OrderItemResponse
from app.modules.products.repository import ProductVariantRepository
from app.modules.rates.service import PriceCalculationService


router = APIRouter()


@router.post("/orders", response_model=SuccessResponse[OrderResponse], status_code=201)
async def create_pos_order(
    data: POSOrderRequest,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.ORDERS_WRITE])),
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
):
    """
    Create a POS order for a walk-in customer.
    
    Admin creates order manually with customer info and products.
    """
    order_repo = OrderRepository(session)
    item_repo = OrderItemRepository(session)
    variant_repo = ProductVariantRepository(session)
    price_service = PriceCalculationService(session)
    
    # Generate order number
    order_number = await order_repo.generate_order_number()
    
    # Calculate items and totals
    order_items = []
    subtotal = Decimal("0")
    
    for pos_item in data.items:
        # Get variant with product
        variant = await variant_repo.get_by_id(pos_item.variant_id)
        if not variant:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message=f"Product variant {pos_item.variant_id} not found"
            )
        
        # Calculate price
        price_result = await price_service.calculate_price(variant)
        unit_price = price_result.total_price
        line_total = unit_price * pos_item.quantity
        subtotal += line_total
        
        # Get product info
        product = variant.product
        
        order_items.append({
            "variant": variant,
            "product": product,
            "quantity": pos_item.quantity,
            "unit_price": unit_price,
            "line_total": line_total
        })
    
    # Create order
    order = Order(
        order_number=order_number,
        customer_id=None,  # POS orders don't have registered customer
        is_pos_order=True,
        pos_customer_name=data.customer_name,
        pos_customer_phone=data.customer_phone,
        created_by=current_user.id,
        shipping_address={
            "full_name": data.customer_name,
            "phone": data.customer_phone,
            "type": "POS"
        },
        subtotal=subtotal,
        discount_amount=Decimal("0"),
        delivery_charge=Decimal("0"),  # POS = pickup, no delivery
        tax_amount=Decimal("0"),
        total=subtotal,
        payment_method=data.payment_method,
        payment_status=PaymentStatus.PAID if data.mark_as_paid else PaymentStatus.PENDING,
        status=OrderStatus.CONFIRMED if data.mark_as_paid else OrderStatus.PENDING,
        confirmed_at=datetime.utcnow() if data.mark_as_paid else None,
        paid_at=datetime.utcnow() if data.mark_as_paid else None,
        customer_notes=data.notes,
        status_history=[{
            "status": OrderStatus.CONFIRMED.value if data.mark_as_paid else OrderStatus.PENDING.value,
            "timestamp": datetime.utcnow().isoformat(),
            "note": f"POS order created by {current_user.id}"
        }]
    )
    
    order = await order_repo.create(order)
    
    # Create order items
    db_items = []
    for item_data in order_items:
        variant = item_data["variant"]
        product = item_data["product"]
        
        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            variant_id=variant.id,
            product_name=product.name,
            variant_sku=variant.sku,
            product_image=product.images[0] if product.images else None,
            metal_type=variant.metal_type,
            metal_purity=variant.metal_purity,
            metal_color=variant.metal_color,
            size=variant.size,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            line_total=item_data["line_total"],
            net_weight=variant.net_weight
        )
        db_items.append(item)
    
    await item_repo.create_many(db_items)
    order.items = db_items
    
    # Audit log
    await audit_service.log_action(
        action="create_pos_order",
        actor_id=str(current_user.id),
        target_id=str(order.id),
        target_type="order",
        details={
            "order_number": order_number,
            "customer_name": data.customer_name,
            "total": str(subtotal),
            "item_count": len(db_items)
        },
        request=request
    )
    
    # Build response
    items_response = [OrderItemResponse.model_validate(i) for i in db_items]
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
        items=items_response,
        created_at=order.created_at,
        confirmed_at=order.confirmed_at,
        shipped_at=order.shipped_at,
        delivered_at=order.delivered_at
    )
    
    return create_success_response(
        message="POS order created successfully",
        data=response
    )
