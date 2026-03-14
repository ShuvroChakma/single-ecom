"""
Service layer for Order business logic.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import BackgroundTasks, Request

from app.core.exceptions import NotFoundError, ValidationError, PermissionDeniedError
from app.constants.error_codes import ErrorCode
from app.modules.orders.models import Order, OrderItem, OrderStatus, PaymentStatus
from app.modules.orders.repository import OrderRepository, OrderItemRepository
from app.modules.orders.schemas import (
    CreateOrderRequest,
    OrderAddressSnapshot,
    OrderResponse,
    OrderItemResponse,
    OrderListResponse,
    OrderCreatedResponse,
    UpdateOrderStatusRequest
)
from sqlalchemy import delete as sql_delete
from app.modules.cart.service import CartService
from app.modules.cart.models import CartItem
from app.modules.cart.cache import invalidate_cart_cache
from app.modules.addresses.service import AddressService
from app.modules.delivery.service import DeliveryZoneService
from app.modules.promo_codes.service import PromoCodeService
from app.modules.payments.service import PaymentGatewayService
from app.modules.audit.service import AuditService
from app.modules.users.models import Customer, User
from app.core.email import EmailService


class OrderService:
    """Service for order operations."""
    
    def __init__(
        self,
        session: AsyncSession,
        audit_service: Optional[AuditService] = None
    ):
        self.session = session
        self.repo = OrderRepository(session)
        self.item_repo = OrderItemRepository(session)
        self.audit_service = audit_service
    
    async def get_customer_orders(
        self,
        customer_id: UUID,
        limit: int = 20,
        offset: int = 0
    ) -> List[OrderListResponse]:
        """Get orders for a customer."""
        orders = await self.repo.get_by_customer(customer_id, limit, offset)
        
        return [
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
    
    async def get_order(
        self,
        order_id: UUID,
        customer_id: Optional[UUID] = None
    ) -> Order:
        """Get order by ID. Optionally verify ownership."""
        order = await self.repo.get_by_id(order_id)
        
        if not order:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Order not found"
            )
        
        # Verify ownership if customer_id provided
        if customer_id and order.customer_id != customer_id:
            raise PermissionDeniedError(
                error_code=ErrorCode.PERMISSION_DENIED,
                message="Order not found"
            )
        
        return order
    
    async def get_order_by_number(self, order_number: str) -> Order:
        """Get order by order number."""
        order = await self.repo.get_by_order_number(order_number)
        if not order:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Order not found"
            )
        return order
    
    async def create_order(
        self,
        customer_id: UUID,
        request: CreateOrderRequest,
        cart_service: CartService,
        address_service: AddressService,
        delivery_service: DeliveryZoneService,
        promo_service: PromoCodeService,
        payment_service: PaymentGatewayService,
        http_request: Optional[Request] = None,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> OrderCreatedResponse:
        """
        Create an order from customer's cart in a single atomic transaction.

        All DB writes use flush() and commit only once at the end.
        On any failure the entire transaction is rolled back.
        """
        # ── READ-ONLY VALIDATION (no DB writes yet) ──────────────────────────

        # 1. Get cart and validate not empty
        cart_response = await cart_service.get_cart(customer_id)
        if not cart_response.items:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Cart is empty",
                field="cart"
            )

        # 2. Validate address
        if not request.address_id:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Shipping address is required",
                field="address_id"
            )
        address = await address_service.get_address(customer_id, request.address_id)
        address_snapshot = {
            "full_name": address.full_name,
            "phone": address.phone,
            "address_line1": address.address_line1,
            "address_line2": address.address_line2,
            "city": address.city,
            "district": address.district,
            "postal_code": address.postal_code,
            "country": address.country
        }

        # 3. Calculate delivery charge
        delivery_result = await delivery_service.calculate_charge(
            district=address.district,
            order_amount=cart_response.subtotal,
            total_weight_kg=Decimal("0")
        )
        delivery_charge = delivery_result.total_charge

        # 4. Validate promo code
        discount_amount = Decimal("0")
        promo_code_id = None
        promo_code_str = None
        if request.promo_code:
            promo_result = await promo_service.validate_promo(
                code=request.promo_code,
                order_amount=cart_response.subtotal,
                customer_id=customer_id
            )
            if not promo_result.valid:
                raise ValidationError(
                    error_code=ErrorCode.VALIDATION_ERROR,
                    message=promo_result.message,
                    field="promo_code"
                )
            discount_amount = promo_result.discount_amount or Decimal("0")
            if promo_result.free_shipping:
                delivery_charge = Decimal("0")
            promo_code_str = request.promo_code.upper()
            promo = await promo_service.repo.get_by_code(promo_code_str)
            if promo:
                promo_code_id = promo.id

        # 5. Validate payment method
        payment_method = await payment_service.get_gateway_by_code(request.payment_method)
        if not payment_method.is_enabled:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message=f"Payment method '{request.payment_method}' is not available",
                field="payment_method"
            )

        # ── SINGLE ATOMIC TRANSACTION ─────────────────────────────────────────
        try:
            # 6. Calculate totals
            subtotal = cart_response.subtotal
            tax_amount = Decimal("0")
            total = subtotal - discount_amount + delivery_charge + tax_amount

            # 7. Build and flush Order (gets order.id without committing)
            order_number = await self.repo.generate_order_number()
            now = datetime.utcnow()
            order = Order(
                order_number=order_number,
                customer_id=customer_id,
                shipping_address=address_snapshot,
                is_gift=request.is_gift,
                gift_message=request.gift_message,
                hide_prices=request.hide_prices,
                subtotal=subtotal,
                discount_amount=discount_amount,
                delivery_charge=delivery_charge,
                tax_amount=tax_amount,
                total=total,
                promo_code_id=promo_code_id,
                promo_code=promo_code_str,
                payment_method=request.payment_method,
                customer_notes=request.notes,
                status_history=[{
                    "status": OrderStatus.PENDING.value,
                    "timestamp": now.isoformat(),
                    "note": "Order created"
                }]
            )
            # COD: confirm immediately within the same transaction
            if request.payment_method == "cod":
                order.status = OrderStatus.CONFIRMED
                order.confirmed_at = now
                order.status_history.append({
                    "status": OrderStatus.CONFIRMED.value,
                    "timestamp": now.isoformat(),
                    "note": "COD order confirmed"
                })

            self.session.add(order)
            await self.session.flush()  # assigns order.id
            order_id = order.id  # capture now — expire_all() will expire order later

            # 8. Flush order items
            for cart_item in cart_response.items:
                self.session.add(OrderItem(
                    order_id=order_id,
                    product_id=cart_item.product.id,
                    variant_id=cart_item.variant.id,
                    product_name=cart_item.product.name,
                    variant_sku=cart_item.variant.sku,
                    product_image=cart_item.product.image,
                    metal_type=cart_item.variant.metal_type,
                    metal_purity=cart_item.variant.metal_purity,
                    metal_color=cart_item.variant.metal_color,
                    size=cart_item.variant.size,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.current_price,
                    line_total=cart_item.line_total,
                    net_weight=cart_item.variant.net_weight
                ))
            await self.session.flush()

            # 9. Clear cart using bulk DELETE (bypasses ORM identity map)
            cart_db = await cart_service.cart_repo.get_by_customer_id(customer_id)
            if cart_db:
                await self.session.execute(
                    sql_delete(CartItem).where(CartItem.cart_id == cart_db.id)
                )
                await self.session.flush()
                # Purge stale CartItem objects so nothing re-saves them
                self.session.expire_all()

            # ── SINGLE COMMIT ──────────────────────────────────────────────────
            await self.session.commit()

        except Exception:
            await self.session.rollback()
            raise

        # ── POST-COMMIT SIDE EFFECTS ──────────────────────────────────────────
        await invalidate_cart_cache(str(customer_id))

        if self.audit_service:
            await self.audit_service.log_action(
                action="create_order",
                actor_id=str(customer_id),
                target_id=str(order_id),
                target_type="order",
                details={
                    "order_number": order_number,
                    "total": str(total),
                    "payment_method": request.payment_method
                },
                request=http_request
            )

        # Send order confirmation email (fire-and-forget – never block the response)
        try:
            customer_record = await self.session.get(Customer, customer_id)
            if customer_record:
                user_record = await self.session.get(User, customer_record.user_id)
                if user_record:
                    customer_name = f"{customer_record.first_name} {customer_record.last_name}".strip()
                    addr = address_snapshot
                    addr_parts = filter(None, [
                        addr.get("address_line1"), addr.get("city"), addr.get("district")
                    ])
                    shipping_str = ", ".join(addr_parts)
                    email_items = [
                        {
                            "name": item.product.name,
                            "quantity": item.quantity,
                            "line_total": f"{item.line_total:.2f}",
                        }
                        for item in cart_response.items
                    ]
                    if background_tasks:
                        background_tasks.add_task(
                            EmailService.send_order_confirmation_email,
                            email=user_record.email,
                            customer_name=customer_name,
                            order_number=order_number,
                            order_id=str(order_id),
                            items=email_items,
                            discount_amount=f"{discount_amount:.2f}" if discount_amount else None,
                            delivery_charge=f"{delivery_charge:.2f}",
                            total=f"{total:.2f}",
                            payment_method=request.payment_method,
                            shipping_address=shipping_str,
                        )
                    else:
                        await EmailService.send_order_confirmation_email(
                            email=user_record.email,
                            customer_name=customer_name,
                            order_number=order_number,
                            order_id=str(order_id),
                            items=email_items,
                            discount_amount=f"{discount_amount:.2f}" if discount_amount else None,
                            delivery_charge=f"{delivery_charge:.2f}",
                            total=f"{total:.2f}",
                            payment_method=request.payment_method,
                            shipping_address=shipping_str,
                        )
        except Exception:
            pass  # Never let email failures affect order creation

        requires_payment = request.payment_method != "cod"
        return OrderCreatedResponse(
            order_id=order_id,
            order_number=order_number,
            payment_method=request.payment_method,
            total=total,
            requires_payment=requires_payment,
            payment_url=f"/payments/{request.payment_method}/initiate/{order_id}" if requires_payment else None,
            message="Order placed successfully" if not requires_payment else "Proceed to payment"
        )
    
    async def update_status(
        self,
        order_id: UUID,
        request: UpdateOrderStatusRequest,
        actor_id: str,
        http_request: Optional[Request] = None
    ) -> Order:
        """Update order status (admin)."""
        order = await self.get_order(order_id)
        
        old_status = order.status
        new_status = request.status
        
        # Update status
        order.status = new_status
        
        # Update timestamp based on status
        now = datetime.utcnow()
        if new_status == OrderStatus.CONFIRMED:
            order.confirmed_at = now
        elif new_status == OrderStatus.SHIPPED:
            order.shipped_at = now
        elif new_status == OrderStatus.DELIVERED:
            order.delivered_at = now
        elif new_status == OrderStatus.CANCELLED:
            order.cancelled_at = now
        
        # Add to history
        order.status_history.append({
            "status": new_status.value,
            "timestamp": now.isoformat(),
            "note": request.notes or f"Status changed from {old_status.value} to {new_status.value}"
        })
        
        order = await self.repo.update(order)
        
        # Audit log
        if self.audit_service:
            await self.audit_service.log_action(
                action="update_order_status",
                actor_id=actor_id,
                target_id=str(order.id),
                target_type="order",
                details={
                    "order_number": order.order_number,
                    "old_status": old_status.value,
                    "new_status": new_status.value
                },
                request=http_request
            )
        
        return order
    
    async def cancel_order(
        self,
        order_id: UUID,
        customer_id: UUID,
        reason: Optional[str] = None,
        http_request: Optional[Request] = None
    ) -> Order:
        """Cancel an order (customer action)."""
        order = await self.get_order(order_id, customer_id)
        
        # Can only cancel pending or confirmed orders
        if order.status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Order cannot be cancelled at this stage",
                field="status"
            )
        
        order.status = OrderStatus.CANCELLED
        order.cancelled_at = datetime.utcnow()
        order.status_history.append({
            "status": OrderStatus.CANCELLED.value,
            "timestamp": datetime.utcnow().isoformat(),
            "note": reason or "Cancelled by customer"
        })
        
        # TODO: If payment was made, initiate refund
        
        order = await self.repo.update(order)
        
        # Audit log
        if self.audit_service:
            await self.audit_service.log_action(
                action="cancel_order",
                actor_id=str(customer_id),
                target_id=str(order.id),
                target_type="order",
                details={"order_number": order.order_number, "reason": reason},
                request=http_request
            )
        
        return order
    
    async def get_all_orders(
        self,
        status: Optional[OrderStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Order]:
        """Get all orders (admin)."""
        return await self.repo.get_all(status, limit, offset)
