"""
Repository layer for Order database operations.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.orders.models import Order, OrderItem, OrderStatus


class OrderRepository:
    """Repository for Order operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, order_id: UUID, include_items: bool = True) -> Optional[Order]:
        """Get order by ID."""
        query = select(Order).where(Order.id == order_id)
        if include_items:
            query = query.options(selectinload(Order.items))
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_order_number(self, order_number: str) -> Optional[Order]:
        """Get order by order number."""
        query = (
            select(Order)
            .where(Order.order_number == order_number)
            .options(selectinload(Order.items))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_customer(
        self,
        customer_id: UUID,
        limit: int = 20,
        offset: int = 0
    ) -> List[Order]:
        """Get orders for a customer."""
        query = (
            select(Order)
            .where(Order.customer_id == customer_id)
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def get_all(
        self,
        status: Optional[OrderStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Order]:
        """Get all orders with optional status filter."""
        query = select(Order).order_by(Order.created_at.desc())
        
        if status:
            query = query.where(Order.status == status)
        
        query = query.offset(offset).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def generate_order_number(self) -> str:
        """Generate unique order number."""
        today = date.today()
        prefix = f"ORD-{today.strftime('%Y%m%d')}"
        
        # Count today's orders
        query = select(func.count(Order.id)).where(
            Order.order_number.like(f"{prefix}%")
        )
        result = await self.session.execute(query)
        count = result.scalar() or 0
        
        return f"{prefix}-{count + 1:04d}"
    
    async def create(self, order: Order) -> Order:
        """Create a new order."""
        self.session.add(order)
        await self.session.commit()
        await self.session.refresh(order)
        return order
    
    async def update(self, order: Order) -> Order:
        """Update an order."""
        order.updated_at = datetime.utcnow()
        self.session.add(order)
        await self.session.commit()
        await self.session.refresh(order)
        return order
    
    async def count_by_customer(self, customer_id: UUID) -> int:
        """Count orders for a customer (for first order promo check)."""
        query = select(func.count(Order.id)).where(
            Order.customer_id == customer_id
        ).where(
            Order.status != OrderStatus.CANCELLED
        )
        result = await self.session.execute(query)
        return result.scalar() or 0


class OrderItemRepository:
    """Repository for OrderItem operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_many(self, items: List[OrderItem]) -> List[OrderItem]:
        """Create multiple order items."""
        for item in items:
            self.session.add(item)
        await self.session.commit()
        return items
    
    async def get_by_order(self, order_id: UUID) -> List[OrderItem]:
        """Get all items for an order."""
        query = select(OrderItem).where(OrderItem.order_id == order_id)
        result = await self.session.execute(query)
        return list(result.scalars().all())
