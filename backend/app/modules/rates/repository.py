"""
Repository for Daily Rates.
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from typing import Optional, List
from sqlmodel import select, func
from sqlalchemy import case
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
            .order_by(
                DailyRate.effective_date.desc(),
                case(
                    (DailyRate.metal_type == "GOLD", 1),
                    (DailyRate.metal_type == "SILVER", 2),
                    (DailyRate.metal_type == "PLATINUM", 3),
                    else_=4
                ),
                case(
                    (DailyRate.purity == "22K", 1),
                    (DailyRate.purity == "21K", 2),
                    (DailyRate.purity == "18K", 3),
                    (DailyRate.purity == "14K", 4),
                    (DailyRate.purity == "999", 5),
                    (DailyRate.purity == "950", 6),
                    (DailyRate.purity == "925", 7),
                    (DailyRate.purity == "800", 8),
                    (DailyRate.purity == "Traditional", 9),
                    else_=10
                )
            )
        )
        return list(result.scalars().all())
    
    async def list_history(
        self,
        metal_type: str,
        purity: str,
        limit: int = 30,
        offset: int = 0,
        date: Optional[datetime] = None,
    ) -> tuple[List[DailyRate], int]:
        """Get paginated rate history. Returns (rows, total_count)."""
        from sqlalchemy import func as sa_func

        base = (
            select(DailyRate)
            .where(
                DailyRate.metal_type == metal_type,
                DailyRate.purity == purity,
            )
        )
        if date is not None:
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
            base = base.where(DailyRate.effective_date.between(day_start, day_end))

        count_result = await self.session.execute(
            select(sa_func.count()).select_from(base.subquery())
        )
        total = count_result.scalar_one()

        rows_result = await self.session.execute(
            base.order_by(DailyRate.effective_date.desc()).offset(offset).limit(limit)
        )
        return list(rows_result.scalars().all()), total
    
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
