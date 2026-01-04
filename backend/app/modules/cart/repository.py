"""
Repository layer for Cart database operations.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.cart.models import Cart, CartItem


class CartRepository:
    """Repository for Cart operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, cart_id: UUID) -> Optional[Cart]:
        """Get cart by ID with items."""
        query = (
            select(Cart)
            .options(selectinload(Cart.items))
            .where(Cart.id == cart_id)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_customer_id(self, customer_id: UUID) -> Optional[Cart]:
        """Get cart by customer ID with items."""
        query = (
            select(Cart)
            .options(selectinload(Cart.items))
            .where(Cart.customer_id == customer_id)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_or_create(self, customer_id: UUID) -> Cart:
        """Get existing cart or create new one."""
        cart = await self.get_by_customer_id(customer_id)
        if cart:
            return cart
        
        # Create new cart
        cart = Cart(customer_id=customer_id)
        self.session.add(cart)
        await self.session.commit()
        await self.session.refresh(cart)
        return cart
    
    async def update_timestamp(self, cart: Cart) -> Cart:
        """Update cart's updated_at timestamp."""
        cart.updated_at = datetime.utcnow()
        self.session.add(cart)
        await self.session.commit()
        await self.session.refresh(cart)
        return cart
    
    async def delete(self, cart: Cart) -> None:
        """Delete a cart and all its items."""
        await self.session.delete(cart)
        await self.session.commit()


class CartItemRepository:
    """Repository for CartItem operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, item_id: UUID) -> Optional[CartItem]:
        """Get cart item by ID."""
        query = select(CartItem).where(CartItem.id == item_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_cart_items(self, cart_id: UUID) -> List[CartItem]:
        """Get all items in a cart."""
        query = (
            select(CartItem)
            .where(CartItem.cart_id == cart_id)
            .order_by(CartItem.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def get_by_variant(
        self,
        cart_id: UUID,
        variant_id: UUID
    ) -> Optional[CartItem]:
        """Get cart item by cart and variant ID."""
        query = (
            select(CartItem)
            .where(CartItem.cart_id == cart_id)
            .where(CartItem.variant_id == variant_id)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def create(self, item: CartItem) -> CartItem:
        """Create a new cart item."""
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item
    
    async def update(self, item: CartItem) -> CartItem:
        """Update a cart item."""
        item.updated_at = datetime.utcnow()
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item
    
    async def delete(self, item: CartItem) -> None:
        """Delete a cart item."""
        await self.session.delete(item)
        await self.session.commit()
    
    async def clear_cart(self, cart_id: UUID) -> int:
        """Delete all items in a cart. Returns count deleted."""
        query = delete(CartItem).where(CartItem.cart_id == cart_id)
        result = await self.session.execute(query)
        await self.session.commit()
        return result.rowcount
