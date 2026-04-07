"""
Wishlist business logic service.
"""
from uuid import UUID
from typing import Optional, List
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError, ConflictError
from app.constants.error_codes import ErrorCode
from app.modules.wishlist.models import WishlistItem
from app.modules.wishlist.schemas import (
    WishlistResponse,
    WishlistItemResponse,
    WishlistProductInfo,
    WishlistVariantInfo,
    WishlistCheckResponse
)
from app.modules.products.models import Product, ProductVariant


class WishlistService:
    """Service for wishlist operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_wishlist(self, customer_id: UUID) -> WishlistResponse:
        """Get all items in customer's wishlist."""
        stmt = (
            select(WishlistItem)
            .where(WishlistItem.customer_id == customer_id)
            .options(
                selectinload(WishlistItem.product),
                selectinload(WishlistItem.variant)
            )
            .order_by(WishlistItem.added_at.desc())
        )
        result = await self.session.execute(stmt)
        items = result.scalars().all()

        wishlist_items = []
        for item in items:
            product_info = WishlistProductInfo(
                id=item.product.id,
                name=item.product.name,
                slug=item.product.slug,
                image=item.product.images[0] if item.product.images else None
            )

            variant_info = None
            if item.variant:
                variant_info = WishlistVariantInfo(
                    id=item.variant.id,
                    sku=item.variant.sku,
                    metal_type=item.variant.metal_type,
                    metal_purity=item.variant.metal_purity,
                    metal_color=item.variant.metal_color,
                    size=item.variant.size,
                    calculated_price=getattr(item.variant, 'calculated_price', None)
                )

            wishlist_items.append(WishlistItemResponse(
                id=item.id,
                product=product_info,
                variant=variant_info,
                added_at=item.added_at
            ))

        return WishlistResponse(
            items=wishlist_items,
            total=len(wishlist_items)
        )

    async def add_to_wishlist(
        self,
        customer_id: UUID,
        product_id: UUID,
        variant_id: Optional[UUID] = None
    ) -> WishlistItemResponse:
        """Add product to wishlist."""
        # Check if product exists
        product = await self.session.get(Product, product_id)
        if not product:
            raise NotFoundError(
                error_code=ErrorCode.PRODUCT_NOT_FOUND,
                message="Product not found"
            )

        # Check if variant exists (if provided)
        variant = None
        if variant_id:
            variant = await self.session.get(ProductVariant, variant_id)
            if not variant or variant.product_id != product_id:
                raise NotFoundError(
                    error_code=ErrorCode.VARIANT_NOT_FOUND,
                    message="Variant not found"
                )

        # Check if already in wishlist
        stmt = select(WishlistItem).where(
            WishlistItem.customer_id == customer_id,
            WishlistItem.product_id == product_id,
            WishlistItem.variant_id == variant_id
        )
        existing = await self.session.execute(stmt)
        if existing.scalar_one_or_none():
            raise ConflictError(
                error_code=ErrorCode.DUPLICATE_ENTRY,
                message="Item already in wishlist"
            )

        # Create wishlist item
        item = WishlistItem(
            customer_id=customer_id,
            product_id=product_id,
            variant_id=variant_id
        )
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)

        # Build response
        product_info = WishlistProductInfo(
            id=product.id,
            name=product.name,
            slug=product.slug,
            image=product.images[0] if product.images else None
        )

        variant_info = None
        if variant:
            variant_info = WishlistVariantInfo(
                id=variant.id,
                sku=variant.sku,
                metal_type=variant.metal_type,
                metal_purity=variant.metal_purity,
                metal_color=variant.metal_color,
                size=variant.size,
                calculated_price=getattr(variant, 'calculated_price', None)
            )

        return WishlistItemResponse(
            id=item.id,
            product=product_info,
            variant=variant_info,
            added_at=item.added_at
        )

    async def remove_from_wishlist(self, customer_id: UUID, item_id: UUID) -> bool:
        """Remove item from wishlist."""
        stmt = delete(WishlistItem).where(
            WishlistItem.id == item_id,
            WishlistItem.customer_id == customer_id
        )
        result = await self.session.execute(stmt)
        await self.session.commit()

        if result.rowcount == 0:
            raise NotFoundError(
                error_code=ErrorCode.ITEM_NOT_FOUND,
                message="Wishlist item not found"
            )

        return True

    async def clear_wishlist(self, customer_id: UUID) -> bool:
        """Remove all items from wishlist."""
        stmt = delete(WishlistItem).where(
            WishlistItem.customer_id == customer_id
        )
        await self.session.execute(stmt)
        await self.session.commit()
        return True

    async def check_in_wishlist(
        self,
        customer_id: UUID,
        product_id: UUID
    ) -> WishlistCheckResponse:
        """Check if product is in customer's wishlist."""
        stmt = select(WishlistItem).where(
            WishlistItem.customer_id == customer_id,
            WishlistItem.product_id == product_id
        )
        result = await self.session.execute(stmt)
        item = result.scalar_one_or_none()

        return WishlistCheckResponse(
            in_wishlist=item is not None,
            item_id=item.id if item else None
        )

    async def move_to_cart(self, customer_id: UUID, item_id: UUID) -> bool:
        """Move wishlist item to cart (stub - cart service should handle this)."""
        # Get wishlist item
        stmt = select(WishlistItem).where(
            WishlistItem.id == item_id,
            WishlistItem.customer_id == customer_id
        ).options(selectinload(WishlistItem.variant))
        result = await self.session.execute(stmt)
        item = result.scalar_one_or_none()

        if not item:
            raise NotFoundError(
                error_code=ErrorCode.ITEM_NOT_FOUND,
                message="Wishlist item not found"
            )

        # For now, just remove from wishlist
        # Cart service integration would add to cart first
        await self.remove_from_wishlist(customer_id, item_id)
        return True
