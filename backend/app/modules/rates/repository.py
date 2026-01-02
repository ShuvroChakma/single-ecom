"""
Repository for Daily Rates.
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.modules.rates.models import DailyRate


class DailyRateRepository:
    """Repository for DailyRate database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, rate_id: UUID) -> Optional[DailyRate]:
        """Get rate by ID."""
        result = await self.session.execute(
            select(DailyRate).where(DailyRate.id == rate_id)
        )
        return result.scalar_one_or_none()
    
    async def get_current_rate(self, metal_type: str, purity: str) -> Optional[DailyRate]:
        """Get the most recent rate for a metal type and purity."""
        result = await self.session.execute(
            select(DailyRate)
            .where(
                DailyRate.metal_type == metal_type,
                DailyRate.purity == purity,
                DailyRate.effective_date <= datetime.utcnow()
            )
            .order_by(DailyRate.effective_date.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    async def get_all_current_rates(self) -> List[DailyRate]:
        """Get the most recent rate for each metal_type/purity combination."""
        # Subquery to get max effective_date for each combination
        subquery = (
            select(
                DailyRate.metal_type,
                DailyRate.purity,
                func.max(DailyRate.effective_date).label("max_date")
            )
            .where(DailyRate.effective_date <= datetime.utcnow())
            .group_by(DailyRate.metal_type, DailyRate.purity)
            .subquery()
        )
        
        result = await self.session.execute(
            select(DailyRate)
            .join(
                subquery,
                (DailyRate.metal_type == subquery.c.metal_type) &
                (DailyRate.purity == subquery.c.purity) &
                (DailyRate.effective_date == subquery.c.max_date)
            )
            .order_by(DailyRate.metal_type, DailyRate.purity)
        )
        return list(result.scalars().all())
    
    async def list_history(
        self,
        metal_type: str,
        purity: str,
        limit: int = 30
    ) -> List[DailyRate]:
        """Get rate history for a metal type and purity."""
        result = await self.session.execute(
            select(DailyRate)
            .where(
                DailyRate.metal_type == metal_type,
                DailyRate.purity == purity
            )
            .order_by(DailyRate.effective_date.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def create(self, rate: DailyRate) -> DailyRate:
        """Create a new daily rate."""
        self.session.add(rate)
        await self.session.commit()
        await self.session.refresh(rate)
        return rate
    
    async def create_many(self, rates: List[DailyRate]) -> List[DailyRate]:
        """Create multiple daily rates."""
        self.session.add_all(rates)
        await self.session.commit()
        for rate in rates:
            await self.session.refresh(rate)
        return rates
