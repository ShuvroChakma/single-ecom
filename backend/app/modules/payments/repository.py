"""
Repository layer for Payment Gateway database operations.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payments.models import PaymentGateway, PaymentTransaction


class PaymentGatewayRepository:
    """Repository for PaymentGateway operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, gateway_id: UUID) -> Optional[PaymentGateway]:
        """Get gateway by ID."""
        query = select(PaymentGateway).where(PaymentGateway.id == gateway_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_code(self, code: str) -> Optional[PaymentGateway]:
        """Get gateway by code."""
        query = select(PaymentGateway).where(PaymentGateway.code == code)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all(self) -> List[PaymentGateway]:
        """Get all gateways."""
        query = select(PaymentGateway).order_by(PaymentGateway.display_order)
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def get_enabled(self) -> List[PaymentGateway]:
        """Get enabled gateways only."""
        query = (
            select(PaymentGateway)
            .where(PaymentGateway.is_enabled == True)
            .order_by(PaymentGateway.display_order)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def create(self, gateway: PaymentGateway) -> PaymentGateway:
        """Create a new gateway."""
        self.session.add(gateway)
        await self.session.commit()
        await self.session.refresh(gateway)
        return gateway
    
    async def update(self, gateway: PaymentGateway) -> PaymentGateway:
        """Update a gateway."""
        gateway.updated_at = datetime.utcnow()
        self.session.add(gateway)
        await self.session.commit()
        await self.session.refresh(gateway)
        return gateway
    
    async def delete(self, gateway: PaymentGateway) -> None:
        """Delete a gateway."""
        await self.session.delete(gateway)
        await self.session.commit()


class PaymentTransactionRepository:
    """Repository for PaymentTransaction operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, transaction_id: UUID) -> Optional[PaymentTransaction]:
        """Get transaction by ID."""
        query = select(PaymentTransaction).where(PaymentTransaction.id == transaction_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_gateway_transaction_id(
        self,
        gateway_code: str,
        transaction_id: str
    ) -> Optional[PaymentTransaction]:
        """Get transaction by gateway transaction ID."""
        query = (
            select(PaymentTransaction)
            .where(PaymentTransaction.gateway_code == gateway_code)
            .where(PaymentTransaction.transaction_id == transaction_id)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_order(self, order_id: UUID) -> List[PaymentTransaction]:
        """Get all transactions for an order."""
        query = (
            select(PaymentTransaction)
            .where(PaymentTransaction.order_id == order_id)
            .order_by(PaymentTransaction.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def create(self, transaction: PaymentTransaction) -> PaymentTransaction:
        """Create a new transaction."""
        self.session.add(transaction)
        await self.session.commit()
        await self.session.refresh(transaction)
        return transaction
    
    async def update(self, transaction: PaymentTransaction) -> PaymentTransaction:
        """Update a transaction."""
        self.session.add(transaction)
        await self.session.commit()
        await self.session.refresh(transaction)
        return transaction
