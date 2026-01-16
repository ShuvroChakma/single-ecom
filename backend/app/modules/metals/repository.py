"""
Repository for Metal and Purity database operations.
"""
from typing import Optional, List
from uuid import UUID
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.modules.metals.models import Metal, Purity


class MetalRepository:
    """Repository for Metal database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, metal_id: UUID) -> Optional[Metal]:
        """Get metal by ID."""
        result = await self.session.execute(
            select(Metal).where(Metal.id == metal_id)
        )
        return result.scalar_one_or_none()
    
    async def get_with_purities(self, metal_id: UUID) -> Optional[Metal]:
        """Get metal by ID with purities loaded."""
        result = await self.session.execute(
            select(Metal)
            .options(selectinload(Metal.purities))
            .where(Metal.id == metal_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_code(self, code: str) -> Optional[Metal]:
        """Get metal by code."""
        result = await self.session.execute(
            select(Metal).where(Metal.code == code)
        )
        return result.scalar_one_or_none()
    
    async def list_active(self) -> List[Metal]:
        """List all active metals with purities."""
        result = await self.session.execute(
            select(Metal)
            .options(selectinload(Metal.purities))
            .where(Metal.is_active == True)
            .order_by(Metal.sort_order)
        )
        return list(result.scalars().all())
    
    async def list_all(self) -> List[Metal]:
        """List all metals (admin)."""
        result = await self.session.execute(
            select(Metal)
            .options(selectinload(Metal.purities))
            .order_by(Metal.sort_order)
        )
        return list(result.scalars().all())
    
    async def search(self, query: str = "", limit: int = 20) -> List[Metal]:
        """Search metals by name or code."""
        stmt = select(Metal).where(Metal.is_active == True)
        
        if query:
            search_pattern = f"%{query}%"
            stmt = stmt.where(
                (Metal.name.ilike(search_pattern)) | 
                (Metal.code.ilike(search_pattern))
            )
        
        stmt = stmt.order_by(Metal.sort_order).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def create(self, metal: Metal) -> Metal:
        """Create a new metal."""
        self.session.add(metal)
        await self.session.commit()
        await self.session.refresh(metal)
        return metal
    
    async def update(self, metal: Metal, data: dict) -> Metal:
        """Update an existing metal."""
        for key, value in data.items():
            if value is not None:
                setattr(metal, key, value)
        metal.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(metal)
        return metal
    
    async def delete(self, metal: Metal) -> None:
        """Delete a metal."""
        await self.session.delete(metal)
        await self.session.commit()


class PurityRepository:
    """Repository for Purity database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, purity_id: UUID) -> Optional[Purity]:
        """Get purity by ID."""
        result = await self.session.execute(
            select(Purity).where(Purity.id == purity_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_code(self, code: str) -> Optional[Purity]:
        """Get purity by code."""
        result = await self.session.execute(
            select(Purity).where(Purity.code == code)
        )
        return result.scalar_one_or_none()
    
    async def list_by_metal(self, metal_id: UUID) -> List[Purity]:
        """List purities by metal."""
        result = await self.session.execute(
            select(Purity)
            .where(Purity.metal_id == metal_id, Purity.is_active == True)
            .order_by(Purity.sort_order)
        )
        return list(result.scalars().all())
    
    async def create(self, purity: Purity) -> Purity:
        """Create a new purity."""
        self.session.add(purity)
        await self.session.commit()
        await self.session.refresh(purity)
        return purity
    
    async def update(self, purity: Purity, data: dict) -> Purity:
        """Update an existing purity."""
        for key, value in data.items():
            if value is not None:
                setattr(purity, key, value)
        purity.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(purity)
        return purity
    
    async def delete(self, purity: Purity) -> None:
        """Delete a purity."""
        await self.session.delete(purity)
        await self.session.commit()
