"""
Pydantic schemas for Orders.
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime

from app.modules.orders.models import OrderStatus, PaymentStatus


# ============ ADDRESS SCHEMA ============

class OrderAddressSnapshot(BaseModel):
    """Address snapshot stored with order."""
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    district: str
    postal_code: Optional[str] = None
    country: str = "Bangladesh"


# ============ REQUEST SCHEMAS ============

class CreateOrderRequest(BaseModel):
    """Request to create an order (checkout)."""
    # Address
    address_id: Optional[UUID] = None  # Use saved address
    
    # Gift Options
    is_gift: bool = False
    gift_message: Optional[str] = Field(default=None, max_length=500)
    hide_prices: bool = False
    
    # Payment
    payment_method: str = Field(..., description="Payment gateway code")
    
    # Promo (applied in cart, passed here for validation)
    promo_code: Optional[str] = None
    
    # Notes
    notes: Optional[str] = Field(default=None, max_length=500)


class POSOrderRequest(BaseModel):
    """Request to create a POS order (admin)."""
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=10, max_length=20)
    
    # Items
    items: List["POSOrderItem"] = Field(..., min_length=1)
    
    # Payment
    payment_method: str = Field(default="cod")
    mark_as_paid: bool = Field(default=True)
    
    # Notes
    notes: Optional[str] = None


class POSOrderItem(BaseModel):
    """Item for POS order."""
    variant_id: UUID
    quantity: int = Field(..., ge=1)


class UpdateOrderStatusRequest(BaseModel):
    """Request to update order status (admin)."""
    status: OrderStatus
    notes: Optional[str] = None


# ============ RESPONSE SCHEMAS ============

class OrderItemResponse(BaseModel):
    """Order item in response."""
    id: UUID
    product_id: UUID
    variant_id: UUID
    product_name: str
    variant_sku: str
    product_image: Optional[str]
    metal_type: Optional[str]
    metal_purity: Optional[str]
    metal_color: Optional[str]
    size: Optional[str]
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    net_weight: Optional[Decimal]
    
    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    """Order response."""
    id: UUID
    order_number: str
    
    # Customer
    customer_id: Optional[UUID]
    is_pos_order: bool
    pos_customer_name: Optional[str]
    pos_customer_phone: Optional[str]
    
    # Shipping
    shipping_address: Dict[str, Any]
    
    # Gift
    is_gift: bool
    gift_message: Optional[str]
    hide_prices: bool
    
    # Pricing
    subtotal: Decimal
    discount_amount: Decimal
    delivery_charge: Decimal
    tax_amount: Decimal
    total: Decimal
    currency: str
    
    # Promo
    promo_code: Optional[str]
    
    # Payment
    payment_method: str
    payment_status: PaymentStatus
    paid_at: Optional[datetime]
    
    # Status
    status: OrderStatus
    
    # Notes
    customer_notes: Optional[str]
    
    # Items
    items: List[OrderItemResponse]
    
    # Timestamps
    created_at: datetime
    confirmed_at: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]
    
    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    """Order list item (less details)."""
    id: UUID
    order_number: str
    status: OrderStatus
    payment_status: PaymentStatus
    total: Decimal
    item_count: int
    created_at: datetime


class OrderCreatedResponse(BaseModel):
    """Response after order creation."""
    order_id: UUID
    order_number: str
    payment_method: str
    total: Decimal
    requires_payment: bool
    payment_url: Optional[str] = None  # Redirect URL for online payment
    message: str


class ReorderCheckResult(BaseModel):
    """Result of checking if order can be reordered."""
    can_reorder: bool
    available_items: List[UUID]  # variant IDs that are still active
    unavailable_items: List[str]  # product names that are not available
    message: str
