"""
Pydantic schemas for Wishlist API.
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime


# ============ REQUEST SCHEMAS ============

class AddToWishlistRequest(BaseModel):
    """Request to add product to wishlist."""
    product_id: UUID
    variant_id: Optional[UUID] = None


# ============ RESPONSE SCHEMAS ============

class WishlistProductInfo(BaseModel):
    """Product summary for wishlist item."""
    id: UUID
    name: str
    slug: str
    image: Optional[str] = None

    model_config = {"from_attributes": True}


class WishlistVariantInfo(BaseModel):
    """Variant summary for wishlist item."""
    id: UUID
    sku: str
    metal_type: str
    metal_purity: str
    metal_color: str
    size: Optional[str] = None
    calculated_price: Optional[Decimal] = None

    model_config = {"from_attributes": True}


class WishlistItemResponse(BaseModel):
    """Wishlist item with product details."""
    id: UUID
    product: WishlistProductInfo
    variant: Optional[WishlistVariantInfo] = None
    added_at: datetime

    model_config = {"from_attributes": True}


class WishlistResponse(BaseModel):
    """Full wishlist with items and count."""
    items: List[WishlistItemResponse] = Field(default_factory=list)
    total: int = Field(description="Total number of items in wishlist")

    model_config = {"from_attributes": True}


class WishlistCheckResponse(BaseModel):
    """Response for checking if product is in wishlist."""
    in_wishlist: bool
    item_id: Optional[UUID] = None
