from uuid import UUID
from typing import Optional, List, Dict, Any
from sqlalchemy import select, func, or_
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

    async def get_list(
        self,
        page: int = 1,
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ) -> tuple[List[Category], int]:
        """Get paginated list with filters."""
        query = select(self.model)
        
        # Filters
        if filters:
            if "search" in filters and filters["search"]:
                search = f"%{filters['search']}%"
                query = query.where(
                    or_(
                        self.model.name.ilike(search),
                        self.model.slug.ilike(search)
                    )
                )
            if "is_active" in filters:
                query = query.where(self.model.is_active == filters["is_active"])

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        # Sorting
        if sort_by and hasattr(self.model, sort_by):
            col = getattr(self.model, sort_by)
            if sort_order == "desc":
                query = query.order_by(col.desc())
            else:
                query = query.order_by(col.asc())
        else:
            # Default sort
            query = query.order_by(self.model.created_at.desc())

        # Pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        return result.scalars().all(), total
