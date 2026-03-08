"""
Repository layer for Customer Address database operations.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.addresses.models import CustomerAddress


class AddressRepository:
    """Repository for CustomerAddress operations."""
    
    MAX_ADDRESSES_PER_CUSTOMER = 5
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, address_id: UUID) -> Optional[CustomerAddress]:
        """Get address by ID."""
        query = select(CustomerAddress).where(CustomerAddress.id == address_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_customer(self, customer_id: UUID) -> List[CustomerAddress]:
        """Get all addresses for a customer."""
        query = (
            select(CustomerAddress)
            .where(CustomerAddress.customer_id == customer_id)
            .order_by(CustomerAddress.is_default.desc(), CustomerAddress.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def get_default(self, customer_id: UUID) -> Optional[CustomerAddress]:
        """Get default address for a customer."""
        query = (
            select(CustomerAddress)
            .where(CustomerAddress.customer_id == customer_id)
            .where(CustomerAddress.is_default == True)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def count_by_customer(self, customer_id: UUID) -> int:
        """Count addresses for a customer."""
        query = (
            select(func.count(CustomerAddress.id))
            .where(CustomerAddress.customer_id == customer_id)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0
    
    async def create(self, address: CustomerAddress) -> CustomerAddress:
        """Create a new address."""
        self.session.add(address)
        await self.session.commit()
        await self.session.refresh(address)
        return address
    
    async def update(self, address: CustomerAddress) -> CustomerAddress:
        """Update an address."""
        address.updated_at = datetime.utcnow()
        self.session.add(address)
        await self.session.commit()
        await self.session.refresh(address)
        return address
    
    async def delete(self, address: CustomerAddress) -> None:
        """Delete an address."""
        await self.session.delete(address)
        await self.session.commit()
    
    async def clear_default(self, customer_id: UUID) -> None:
        """Clear default flag from all customer addresses."""
        query = (
            update(CustomerAddress)
            .where(CustomerAddress.customer_id == customer_id)
            .where(CustomerAddress.is_default == True)
            .values(is_default=False, updated_at=datetime.utcnow())
        )
        await self.session.execute(query)
        await self.session.commit()
