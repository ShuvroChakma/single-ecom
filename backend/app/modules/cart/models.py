"""
Cart and CartItem models for shopping cart persistence.
"""
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from decimal import Decimal
from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint
from sqlalchemy import Column, DECIMAL

if TYPE_CHECKING:
    from app.modules.users.models import Customer
    from app.modules.products.models import Product, ProductVariant


class Cart(SQLModel, table=True):
    """Cart database model (PostgreSQL backup for Redis cache)."""
    __tablename__ = "carts"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    customer_id: UUID = Field(foreign_key="customers.id", unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    items: List["CartItem"] = Relationship(
        back_populates="cart",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class CartItem(SQLModel, table=True):
    """Cart item database model."""
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("cart_id", "variant_id", name="uq_cart_variant"),
    )
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    cart_id: UUID = Field(foreign_key="carts.id", index=True)
    product_id: UUID = Field(foreign_key="products.id", index=True)
    variant_id: UUID = Field(foreign_key="product_variants.id", index=True)
    quantity: int = Field(default=1, ge=1)
    
    # Price snapshots when item was added (for price change detection)
    price_snapshot: Decimal = Field(
        sa_column=Column(DECIMAL(12, 2), nullable=False),
        description="Total price when added to cart"
    )
    rate_snapshot: Decimal = Field(
        sa_column=Column(DECIMAL(12, 2), nullable=False),
        description="Rate per gram when added to cart"
    )
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    cart: "Cart" = Relationship(back_populates="items")
