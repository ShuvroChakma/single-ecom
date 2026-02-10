"""
Wishlist database models.
"""
from uuid import UUID
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.users.models import Customer
    from app.modules.products.models import Product, ProductVariant


class WishlistItem(SQLModel, table=True):
    """Wishlist item model - customer's saved products."""

    __tablename__ = "wishlist_items"

    id: UUID = Field(default_factory=lambda: __import__('uuid').uuid4(), primary_key=True)
    customer_id: UUID = Field(foreign_key="customers.id", index=True)
    product_id: UUID = Field(foreign_key="products.id", index=True)
    variant_id: Optional[UUID] = Field(default=None, foreign_key="product_variants.id")
    added_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    customer: Optional["Customer"] = Relationship(back_populates="wishlist_items")
    product: Optional["Product"] = Relationship()
    variant: Optional["ProductVariant"] = Relationship()

    class Config:
        arbitrary_types_allowed = True
