from uuid import UUID
from typing import Optional, List, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.base_repository import BaseRepository
from app.modules.catalog.models import Category

class CategoryRepository(BaseRepository[Category]):
    def __init__(self, db: AsyncSession):
        super().__init__(Category, db)

    async def get_all_active(self) -> List[Category]:
        """Get all active categories ordered by path/level."""
        query = select(self.model).where(self.model.is_active == True).order_by(self.model.level, self.model.name)
        result = await self.db.execute(query)
        return result.scalars().all()
        
    async def get_children(self, category_id: UUID) -> List[Category]:
        """Get immediate children of a category."""
        query = select(self.model).where(self.model.parent_id == category_id)
        result = await self.db.execute(query)
        return result.scalars().all()
        
    async def has_children(self, category_id: UUID) -> bool:
        """Check if category has any children."""
        query = select(func.count(self.model.id)).where(self.model.parent_id == category_id)
        result = await self.db.execute(query)
        return result.scalar_one() > 0

    async def get_by_slug(self, slug: str) -> Optional[Category]:
        """Get category by slug."""
        query = select(self.model).where(self.model.slug == slug)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
