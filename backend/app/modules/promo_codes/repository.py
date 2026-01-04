"""
Repository layer for Promo Code database operations.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.promo_codes.models import PromoCode, PromoCodeUse


class PromoCodeRepository:
    """Repository for PromoCode operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, promo_id: UUID) -> Optional[PromoCode]:
        """Get promo code by ID."""
        query = select(PromoCode).where(PromoCode.id == promo_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_code(self, code: str) -> Optional[PromoCode]:
        """Get promo code by code string."""
        query = select(PromoCode).where(PromoCode.code == code.upper())
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all(self, include_inactive: bool = False) -> List[PromoCode]:
        """Get all promo codes."""
        query = select(PromoCode).order_by(PromoCode.created_at.desc())
        
        if not include_inactive:
            query = query.where(PromoCode.is_active == True)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def get_active_codes(self) -> List[PromoCode]:
        """Get currently active and valid promo codes."""
        now = datetime.utcnow()
        query = (
            select(PromoCode)
            .where(PromoCode.is_active == True)
            .where(PromoCode.starts_at <= now)
            .where(PromoCode.expires_at > now)
            .order_by(PromoCode.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def create(self, promo: PromoCode) -> PromoCode:
        """Create a new promo code."""
        self.session.add(promo)
        await self.session.commit()
        await self.session.refresh(promo)
        return promo
    
    async def update(self, promo: PromoCode) -> PromoCode:
        """Update a promo code."""
        promo.updated_at = datetime.utcnow()
        self.session.add(promo)
        await self.session.commit()
        await self.session.refresh(promo)
        return promo
    
    async def delete(self, promo: PromoCode) -> None:
        """Delete a promo code."""
        await self.session.delete(promo)
        await self.session.commit()
    
    async def increment_uses(self, promo_id: UUID) -> None:
        """Increment the usage counter."""
        promo = await self.get_by_id(promo_id)
        if promo:
            promo.current_uses += 1
            await self.update(promo)


class PromoCodeUseRepository:
    """Repository for tracking promo code usage."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_user_uses(self, promo_id: UUID, customer_id: UUID) -> int:
        """Get number of times a customer has used a promo code."""
        query = (
            select(func.count(PromoCodeUse.id))
            .where(PromoCodeUse.promo_code_id == promo_id)
            .where(PromoCodeUse.customer_id == customer_id)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0
    
    async def record_use(
        self,
        promo_id: UUID,
        customer_id: UUID,
        order_id: UUID,
        discount_applied: Decimal
    ) -> PromoCodeUse:
        """Record a promo code use."""
        use = PromoCodeUse(
            promo_code_id=promo_id,
            customer_id=customer_id,
            order_id=order_id,
            discount_applied=discount_applied
        )
        self.session.add(use)
        await self.session.commit()
        await self.session.refresh(use)
        return use
    
    async def get_stats(self, promo_id: UUID) -> dict:
        """Get usage statistics for a promo code."""
        # Total uses
        query = (
            select(
                func.count(PromoCodeUse.id).label("total_uses"),
                func.coalesce(func.sum(PromoCodeUse.discount_applied), 0).label("total_discount"),
                func.count(func.distinct(PromoCodeUse.customer_id)).label("unique_customers")
            )
            .where(PromoCodeUse.promo_code_id == promo_id)
        )
        result = await self.session.execute(query)
        row = result.one()
        
        return {
            "total_uses": row.total_uses,
            "total_discount_given": row.total_discount,
            "unique_customers": row.unique_customers
        }
