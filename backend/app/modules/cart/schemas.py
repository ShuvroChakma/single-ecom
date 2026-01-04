"""
Pydantic schemas for Cart API requests and responses.
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime


# ============ REQUEST SCHEMAS ============

class AddToCartRequest(BaseModel):
    """Request to add item to cart."""
    variant_id: UUID = Field(..., description="Product variant ID to add")
    quantity: int = Field(default=1, ge=1, description="Quantity to add")


class UpdateCartItemRequest(BaseModel):
    """Request to update cart item quantity."""
    quantity: int = Field(..., ge=1, description="New quantity")


# ============ RESPONSE SCHEMAS ============

class CartItemProductInfo(BaseModel):
    """Product summary for cart item."""
    id: UUID
    name: str
    slug: str
    image: Optional[str] = None
    
    model_config = {"from_attributes": True}


class CartItemVariantInfo(BaseModel):
    """Variant summary for cart item."""
    id: UUID
    sku: str
    metal_type: str
    metal_purity: str
    metal_color: str
    size: Optional[str] = None
    gross_weight: Decimal
    net_weight: Decimal
    
    model_config = {"from_attributes": True}


class CartItemResponse(BaseModel):
    """Cart item with product/variant details and pricing."""
    id: UUID
    product: CartItemProductInfo
    variant: CartItemVariantInfo
    quantity: int
    price_when_added: Decimal = Field(description="Price at time of adding to cart")
    current_price: Decimal = Field(description="Current calculated price")
    price_changed: bool = Field(description="True if price changed since adding")
    line_total: Decimal = Field(description="current_price × quantity")
    added_at: datetime
    
    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    """Full cart with items and totals."""
    items: List[CartItemResponse] = Field(default_factory=list)
    item_count: int = Field(description="Total number of items")
    unique_items: int = Field(description="Number of unique products/variants")
    subtotal: Decimal = Field(description="Sum of all line totals (before tax)")
    tax_amount: Decimal = Field(description="Total tax amount")
    total: Decimal = Field(description="Grand total (subtotal + tax)")
    currency: str = Field(default="BDT")
    
    model_config = {"from_attributes": True}


class CartItemAddedResponse(BaseModel):
    """Response when item is added to cart."""
    item: CartItemResponse
    cart_total: Decimal
    item_count: int


# ============ INTERNAL SCHEMAS ============

class CartItemCacheData(BaseModel):
    """Cart item data for Redis cache."""
    id: str
    product_id: str
    variant_id: str
    quantity: int
    price_snapshot: Decimal
    rate_snapshot: Decimal
    added_at: str
    
    model_config = {"from_attributes": True}


class CartCacheData(BaseModel):
    """Cart data for Redis cache."""
    items: dict[str, CartItemCacheData] = Field(
        default_factory=dict,
        description="Map of variant_id -> item data"
    )
    updated_at: str
