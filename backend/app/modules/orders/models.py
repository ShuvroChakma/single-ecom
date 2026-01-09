"""
Order models for managing customer orders.
"""
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from decimal import Decimal
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel, Column, Relationship
from sqlalchemy import JSON, Text


class OrderStatus(str, Enum):
    """Order status lifecycle."""
    PENDING = "PENDING"           # Order placed, awaiting payment/confirmation
    CONFIRMED = "CONFIRMED"       # Payment received / COD confirmed
    PROCESSING = "PROCESSING"     # Being prepared
    SHIPPED = "SHIPPED"           # Handed to courier
    DELIVERED = "DELIVERED"       # Delivered to customer
    CANCELLED = "CANCELLED"       # Cancelled by customer/admin
    REFUNDED = "REFUNDED"         # Money refunded
    RETURNED = "RETURNED"         # Product returned


class PaymentStatus(str, Enum):
    """Payment status."""
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class Order(SQLModel, table=True):
    """Order database model."""
    __tablename__ = "orders"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    order_number: str = Field(max_length=20, unique=True, index=True)
    customer_id: Optional[UUID] = Field(default=None, foreign_key="customers.id", index=True)
    
    # POS Mode (walk-in customers)
    is_pos_order: bool = Field(default=False)
    pos_customer_name: Optional[str] = Field(default=None, max_length=100)
    pos_customer_phone: Optional[str] = Field(default=None, max_length=20)
    created_by: Optional[UUID] = Field(default=None, foreign_key="users.id")
    
    # Shipping Address (snapshot)
    shipping_address: Dict[str, Any] = Field(
        default={},
        sa_column=Column(JSON)
    )
    
    # Gift Options
    is_gift: bool = Field(default=False)
    gift_message: Optional[str] = Field(default=None, sa_column=Column(Text))
    hide_prices: bool = Field(default=False, description="Hide prices on invoice")
    
    # Pricing
    subtotal: Decimal = Field(description="Sum of line totals before discount")
    discount_amount: Decimal = Field(default=Decimal("0"))
    delivery_charge: Decimal = Field(default=Decimal("0"))
    tax_amount: Decimal = Field(default=Decimal("0"))
    total: Decimal = Field(description="Grand total")
    currency: str = Field(default="BDT", max_length=5)
    
    # Promo
    promo_code_id: Optional[UUID] = Field(default=None, foreign_key="promo_codes.id")
    promo_code: Optional[str] = Field(default=None, max_length=50)
    
    # Payment
    payment_method: str = Field(max_length=20)  # bkash, sslcommerz, cod etc.
    payment_status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    payment_transaction_id: Optional[str] = Field(default=None, max_length=100)
    paid_at: Optional[datetime] = Field(default=None)
    
    # Order Status
    status: OrderStatus = Field(default=OrderStatus.PENDING)
    status_history: List[Dict[str, Any]] = Field(
        default=[],
        sa_column=Column(JSON)
    )
    
    # Notes
    customer_notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    admin_notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = Field(default=None)
    shipped_at: Optional[datetime] = Field(default=None)
    delivered_at: Optional[datetime] = Field(default=None)
    cancelled_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    items: List["OrderItem"] = Relationship(
        back_populates="order",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class OrderItem(SQLModel, table=True):
    """Order item (product snapshot at order time)."""
    __tablename__ = "order_items"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    order_id: UUID = Field(foreign_key="orders.id", index=True)
    
    # Product Snapshot
    product_id: UUID = Field(index=True)
    variant_id: UUID = Field(index=True)
    product_name: str = Field(max_length=255)
    variant_sku: str = Field(max_length=100)
    product_image: Optional[str] = Field(default=None, max_length=255)
    
    # Variant Details (snapshot)
    metal_type: Optional[str] = Field(default=None, max_length=20)
    metal_purity: Optional[str] = Field(default=None, max_length=20)
    metal_color: Optional[str] = Field(default=None, max_length=20)
    size: Optional[str] = Field(default=None, max_length=20)
    
    # Pricing
    quantity: int = Field(ge=1)
    unit_price: Decimal = Field(description="Price per item at order time")
    line_total: Decimal = Field(description="quantity × unit_price")
    
    # Weight
    net_weight: Optional[Decimal] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship
    order: "Order" = Relationship(back_populates="items")
