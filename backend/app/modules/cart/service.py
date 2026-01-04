"""
Service layer for Cart business logic.
Implements hybrid Redis + PostgreSQL strategy.
"""
from typing import Optional, List
from uuid import UUID, uuid4
from decimal import Decimal
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.core.exceptions import NotFoundError, ValidationError
from app.constants.error_codes import ErrorCode
from app.modules.cart.models import Cart, CartItem
from app.modules.cart.repository import CartRepository, CartItemRepository
from app.modules.cart.cache import (
    get_cart_from_cache,
    set_cart_in_cache,
    invalidate_cart_cache
)
from app.modules.cart.schemas import (
    CartResponse,
    CartItemResponse,
    CartItemProductInfo,
    CartItemVariantInfo,
    CartItemAddedResponse
)
from app.modules.products.models import Product, ProductVariant
from app.modules.products.repository import ProductRepository, ProductVariantRepository
from app.modules.rates.service import PriceCalculationService
from app.modules.rates.schemas import PriceBreakdown


class CartService:
    """
    Service for cart operations.
    
    Strategy:
    - Reads: Redis first, fallback to PostgreSQL
    - Writes: PostgreSQL first, then update Redis cache
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.cart_repo = CartRepository(session)
        self.item_repo = CartItemRepository(session)
        self.product_repo = ProductRepository(session)
        self.variant_repo = ProductVariantRepository(session)
        self.price_service = PriceCalculationService(session)
    
    async def get_cart(self, customer_id: UUID) -> CartResponse:
        """
        Get customer's cart with current prices.
        
        Returns cart with real-time price calculations for each item.
        """
        # Get cart from database
        cart = await self.cart_repo.get_by_customer_id(customer_id)
        
        if not cart or not cart.items:
            return CartResponse(
                items=[],
                item_count=0,
                unique_items=0,
                subtotal=Decimal("0"),
                tax_amount=Decimal("0"),
                total=Decimal("0"),
                currency="BDT"
            )
        
        # Build response with current prices
        return await self._build_cart_response(cart)
    
    async def add_to_cart(
        self,
        customer_id: UUID,
        variant_id: UUID,
        quantity: int = 1
    ) -> CartItemAddedResponse:
        """
        Add item to cart or increment quantity if exists.
        
        Args:
            customer_id: Customer UUID
            variant_id: Product variant to add
            quantity: Quantity to add
            
        Returns:
            CartItemAddedResponse with item details and cart totals
        """
        # Get variant with product
        variant = await self._get_variant_with_product(variant_id)
        if not variant:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Product variant not found"
            )
        
        product = await self.product_repo.get_with_variants(variant.product_id)
        if not product:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Product not found"
            )
        
        # Check if variant is active
        if not variant.is_active or not product.is_active:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="This product is currently unavailable",
                field="variant_id"
            )
        
        # Check stock
        if variant.stock_quantity < quantity:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message=f"Only {variant.stock_quantity} items available in stock",
                field="quantity"
            )
        
        # Calculate current price
        price_breakdown = await self.price_service.calculate_variant_price(
            variant, product
        )
        
        # Get or create cart
        cart = await self.cart_repo.get_or_create(customer_id)
        
        # Check if item already in cart
        existing_item = await self.item_repo.get_by_variant(cart.id, variant_id)
        
        if existing_item:
            # Increment quantity
            new_quantity = existing_item.quantity + quantity
            if new_quantity > variant.stock_quantity:
                raise ValidationError(
                    error_code=ErrorCode.VALIDATION_ERROR,
                    message=f"Cannot add more. Only {variant.stock_quantity} items available",
                    field="quantity"
                )
            existing_item.quantity = new_quantity
            existing_item.price_snapshot = price_breakdown.total_price
            existing_item.rate_snapshot = price_breakdown.rate_per_gram
            item = await self.item_repo.update(existing_item)
        else:
            # Create new cart item
            item = CartItem(
                id=uuid4(),
                cart_id=cart.id,
                product_id=product.id,
                variant_id=variant_id,
                quantity=quantity,
                price_snapshot=price_breakdown.total_price,
                rate_snapshot=price_breakdown.rate_per_gram
            )
            item = await self.item_repo.create(item)
        
        # Update cart timestamp
        await self.cart_repo.update_timestamp(cart)
        
        # Invalidate cache
        await invalidate_cart_cache(str(customer_id))
        
        # Build item response
        item_response = await self._build_item_response(
            item, product, variant, price_breakdown
        )
        
        # Get updated cart totals
        cart = await self.cart_repo.get_by_customer_id(customer_id)
        cart_response = await self._build_cart_response(cart)
        
        return CartItemAddedResponse(
            item=item_response,
            cart_total=cart_response.total,
            item_count=cart_response.item_count
        )
    
    async def update_item_quantity(
        self,
        customer_id: UUID,
        item_id: UUID,
        quantity: int
    ) -> CartItemResponse:
        """
        Update cart item quantity.
        
        Args:
            customer_id: Customer UUID
            item_id: Cart item ID
            quantity: New quantity
            
        Returns:
            Updated CartItemResponse
        """
        # Get cart and verify ownership
        cart = await self.cart_repo.get_by_customer_id(customer_id)
        if not cart:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Cart not found"
            )
        
        # Get item
        item = await self.item_repo.get_by_id(item_id)
        if not item or item.cart_id != cart.id:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Cart item not found"
            )
        
        # Get variant and product
        variant = await self._get_variant_with_product(item.variant_id)
        product = await self.product_repo.get_with_variants(item.product_id)
        
        # Check stock
        if variant.stock_quantity < quantity:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message=f"Only {variant.stock_quantity} items available in stock",
                field="quantity"
            )
        
        # Update quantity
        item.quantity = quantity
        item = await self.item_repo.update(item)
        
        # Update cart timestamp
        await self.cart_repo.update_timestamp(cart)
        
        # Invalidate cache
        await invalidate_cart_cache(str(customer_id))
        
        # Calculate current price
        price_breakdown = await self.price_service.calculate_variant_price(
            variant, product
        )
        
        return await self._build_item_response(item, product, variant, price_breakdown)
    
    async def remove_item(self, customer_id: UUID, item_id: UUID) -> bool:
        """
        Remove item from cart.
        
        Args:
            customer_id: Customer UUID
            item_id: Cart item ID to remove
            
        Returns:
            True if removed successfully
        """
        # Get cart and verify ownership
        cart = await self.cart_repo.get_by_customer_id(customer_id)
        if not cart:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Cart not found"
            )
        
        # Get item
        item = await self.item_repo.get_by_id(item_id)
        if not item or item.cart_id != cart.id:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Cart item not found"
            )
        
        # Delete item
        await self.item_repo.delete(item)
        
        # Update cart timestamp
        await self.cart_repo.update_timestamp(cart)
        
        # Invalidate cache
        await invalidate_cart_cache(str(customer_id))
        
        return True
    
    async def clear_cart(self, customer_id: UUID) -> bool:
        """
        Clear all items from cart.
        
        Args:
            customer_id: Customer UUID
            
        Returns:
            True if cleared successfully
        """
        cart = await self.cart_repo.get_by_customer_id(customer_id)
        if not cart:
            return True  # No cart to clear
        
        # Clear all items
        await self.item_repo.clear_cart(cart.id)
        
        # Update cart timestamp
        await self.cart_repo.update_timestamp(cart)
        
        # Invalidate cache
        await invalidate_cart_cache(str(customer_id))
        
        return True
    
    # ============ PRIVATE HELPERS ============
    
    async def _get_variant_with_product(
        self,
        variant_id: UUID
    ) -> Optional[ProductVariant]:
        """Get variant by ID."""
        return await self.variant_repo.get(variant_id)
    
    async def _build_cart_response(self, cart: Cart) -> CartResponse:
        """Build full cart response with current prices."""
        items = []
        total_quantity = 0
        subtotal = Decimal("0")
        total_tax = Decimal("0")
        
        for cart_item in cart.items:
            # Get product and variant
            product = await self.product_repo.get_with_variants(cart_item.product_id)
            variant = await self.variant_repo.get(cart_item.variant_id)
            
            if not product or not variant:
                continue  # Skip invalid items
            
            try:
                # Calculate current price
                price_breakdown = await self.price_service.calculate_variant_price(
                    variant, product
                )
                
                item_response = await self._build_item_response(
                    cart_item, product, variant, price_breakdown
                )
                items.append(item_response)
                
                total_quantity += cart_item.quantity
                subtotal += item_response.line_total - (
                    price_breakdown.tax_amount * cart_item.quantity
                )
                total_tax += price_breakdown.tax_amount * cart_item.quantity
                
            except NotFoundError:
                # Rate not found, skip item or use snapshot
                continue
        
        return CartResponse(
            items=items,
            item_count=total_quantity,
            unique_items=len(items),
            subtotal=round(subtotal, 2),
            tax_amount=round(total_tax, 2),
            total=round(subtotal + total_tax, 2),
            currency="BDT"
        )
    
    async def _build_item_response(
        self,
        item: CartItem,
        product: Product,
        variant: ProductVariant,
        price_breakdown: PriceBreakdown
    ) -> CartItemResponse:
        """Build cart item response with pricing."""
        current_price = price_breakdown.total_price
        price_changed = current_price != item.price_snapshot
        line_total = current_price * item.quantity
        
        # Get first image or None
        product_image = product.images[0] if product.images else None
        
        return CartItemResponse(
            id=item.id,
            product=CartItemProductInfo(
                id=product.id,
                name=product.name,
                slug=product.slug,
                image=product_image
            ),
            variant=CartItemVariantInfo(
                id=variant.id,
                sku=variant.sku,
                metal_type=variant.metal_type.value,
                metal_purity=variant.metal_purity,
                metal_color=variant.metal_color,
                size=variant.size,
                gross_weight=variant.gross_weight,
                net_weight=variant.net_weight
            ),
            quantity=item.quantity,
            price_when_added=item.price_snapshot,
            current_price=current_price,
            price_changed=price_changed,
            line_total=round(line_total, 2),
            added_at=item.created_at
        )
