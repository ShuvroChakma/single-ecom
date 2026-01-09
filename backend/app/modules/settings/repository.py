"""
Repository layer for Settings database operations.
"""
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.models import Setting, SettingCategory


class SettingsRepository:
    """Repository for Settings operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, setting_id: UUID) -> Optional[Setting]:
        """Get setting by ID."""
        query = select(Setting).where(Setting.id == setting_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_key(self, key: str) -> Optional[Setting]:
        """Get setting by key."""
        query = select(Setting).where(Setting.key == key)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all(self) -> List[Setting]:
        """Get all settings."""
        query = select(Setting).order_by(Setting.category, Setting.key)
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def get_by_category(self, category: SettingCategory) -> List[Setting]:
        """Get settings by category."""
        query = (
            select(Setting)
            .where(Setting.category == category)
            .order_by(Setting.key)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def get_public(self) -> List[Setting]:
        """Get public settings only."""
        query = (
            select(Setting)
            .where(Setting.is_public == True)
            .order_by(Setting.category, Setting.key)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def create(self, setting: Setting) -> Setting:
        """Create a new setting."""
        self.session.add(setting)
        await self.session.commit()
        await self.session.refresh(setting)
        return setting
    
    async def update(self, setting: Setting) -> Setting:
        """Update a setting."""
        setting.updated_at = datetime.utcnow()
        self.session.add(setting)
        await self.session.commit()
        await self.session.refresh(setting)
        return setting
    
    async def delete(self, setting: Setting) -> None:
        """Delete a setting."""
        await self.session.delete(setting)
        await self.session.commit()
    
    async def get_value(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Get just the value of a setting."""
        setting = await self.get_by_key(key)
        if setting:
            return setting.value
        return default
