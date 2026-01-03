"""
Repository for Slide database operations.
"""
from typing import Optional, List
from uuid import UUID
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.modules.slides.models import Slide, SlideType


class SlideRepository:
    """Repository for Slide database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, slide_id: UUID) -> Optional[Slide]:
        """Get slide by ID."""
        result = await self.session.execute(
            select(Slide).where(Slide.id == slide_id)
        )
        return result.scalar_one_or_none()
    
    async def list_all(self, include_inactive: bool = False) -> List[Slide]:
        """List all slides ordered by sort_order."""
        query = select(Slide)
        
        if not include_inactive:
            query = query.where(Slide.is_active == True)
        
        query = query.order_by(Slide.sort_order, Slide.created_at.desc())
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def list_active(self) -> List[Slide]:
        """List active slides within their schedule."""
        now = datetime.utcnow()
        query = select(Slide).where(Slide.is_active == True)
        
        # Filter by schedule
        query = query.where(
            (Slide.start_date == None) | (Slide.start_date <= now)
        ).where(
            (Slide.end_date == None) | (Slide.end_date >= now)
        )
        
        query = query.order_by(Slide.sort_order)
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def list_by_type(
        self, 
        slide_type: SlideType, 
        include_inactive: bool = False
    ) -> List[Slide]:
        """List slides by type."""
        query = select(Slide).where(Slide.slide_type == slide_type)
        
        if not include_inactive:
            query = query.where(Slide.is_active == True)
        
        query = query.order_by(Slide.sort_order)
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def create(self, slide: Slide) -> Slide:
        """Create a new slide."""
        self.session.add(slide)
        await self.session.commit()
        await self.session.refresh(slide)
        return slide
    
    async def update(self, slide: Slide, data: dict) -> Slide:
        """Update an existing slide."""
        for key, value in data.items():
            if value is not None:
                setattr(slide, key, value)
        slide.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(slide)
        return slide
    
    async def delete(self, slide: Slide) -> None:
        """Delete a slide."""
        await self.session.delete(slide)
        await self.session.commit()
    
    async def update_order(self, slide_ids: List[UUID]) -> None:
        """Update slide order based on position in list."""
        for index, slide_id in enumerate(slide_ids):
            result = await self.session.execute(
                select(Slide).where(Slide.id == slide_id)
            )
            slide = result.scalar_one_or_none()
            if slide:
                slide.sort_order = index
        await self.session.commit()
