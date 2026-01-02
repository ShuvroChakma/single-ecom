"""
Repository for Brand and Collection CRUD operations.
"""
from typing import Optional, List
from uuid import UUID
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.modules.catalog.brand_collection_models import Brand, Collection


class BrandRepository:
    """Repository for Brand database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, brand_id: UUID) -> Optional[Brand]:
        """Get brand by ID."""
        result = await self.session.execute(
            select(Brand).where(Brand.id == brand_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_slug(self, slug: str) -> Optional[Brand]:
        """Get brand by slug."""
        result = await self.session.execute(
            select(Brand).where(Brand.slug == slug)
        )
        return result.scalar_one_or_none()
    
    async def list_active(self) -> List[Brand]:
        """List all active brands."""
        result = await self.session.execute(
            select(Brand).where(Brand.is_active == True).order_by(Brand.name)
        )
        return list(result.scalars().all())
    
    async def list_all(self) -> List[Brand]:
        """List all brands (admin)."""
        result = await self.session.execute(
            select(Brand).order_by(Brand.name)
        )
        return list(result.scalars().all())
    
    async def create(self, brand: Brand) -> Brand:
        """Create a new brand."""
        self.session.add(brand)
        await self.session.commit()
        await self.session.refresh(brand)
        return brand
    
    async def update(self, brand: Brand, data: dict) -> Brand:
        """Update an existing brand."""
        for key, value in data.items():
            if value is not None:
                setattr(brand, key, value)
        brand.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(brand)
        return brand
    
    async def delete(self, brand: Brand) -> None:
        """Delete a brand."""
        await self.session.delete(brand)
        await self.session.commit()


class CollectionRepository:
    """Repository for Collection database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, collection_id: UUID) -> Optional[Collection]:
        """Get collection by ID."""
        result = await self.session.execute(
            select(Collection).where(Collection.id == collection_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_slug(self, slug: str) -> Optional[Collection]:
        """Get collection by slug."""
        result = await self.session.execute(
            select(Collection).where(Collection.slug == slug)
        )
        return result.scalar_one_or_none()
    
    async def list_active(self) -> List[Collection]:
        """List all active collections."""
        result = await self.session.execute(
            select(Collection).where(Collection.is_active == True).order_by(Collection.name)
        )
        return list(result.scalars().all())
    
    async def list_all(self) -> List[Collection]:
        """List all collections (admin)."""
        result = await self.session.execute(
            select(Collection).order_by(Collection.name)
        )
        return list(result.scalars().all())
    
    async def create(self, collection: Collection) -> Collection:
        """Create a new collection."""
        self.session.add(collection)
        await self.session.commit()
        await self.session.refresh(collection)
        return collection
    
    async def update(self, collection: Collection, data: dict) -> Collection:
        """Update an existing collection."""
        for key, value in data.items():
            if value is not None:
                setattr(collection, key, value)
        collection.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(collection)
        return collection
    
    async def delete(self, collection: Collection) -> None:
        """Delete a collection."""
        await self.session.delete(collection)
        await self.session.commit()
