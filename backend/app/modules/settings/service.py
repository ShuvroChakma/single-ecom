"""
Service layer for Settings business logic.
"""
from typing import List, Dict, Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from app.core.exceptions import NotFoundError
from app.constants.error_codes import ErrorCode
from app.modules.settings.models import Setting, SettingCategory, DEFAULT_SETTINGS
from app.modules.settings.repository import SettingsRepository
from app.modules.settings.schemas import SettingUpdate, SettingsGrouped
from app.modules.audit.service import AuditService


class SettingsService:
    """Service for settings operations."""
    
    def __init__(self, session: AsyncSession, audit_service: Optional[AuditService] = None):
        self.session = session
        self.repo = SettingsRepository(session)
        self.audit_service = audit_service
    
    async def initialize_settings(self) -> int:
        """
        Initialize default settings if they don't exist.
        Returns count of settings created.
        """
        created = 0
        for setting_data in DEFAULT_SETTINGS:
            existing = await self.repo.get_by_key(setting_data["key"])
            if not existing:
                setting = Setting(
                    key=setting_data["key"],
                    value=setting_data.get("value"),
                    category=SettingCategory(setting_data.get("category", "GENERAL")),
                    description=setting_data.get("description"),
                    is_public=setting_data.get("is_public", True),
                    is_sensitive=setting_data.get("is_sensitive", False)
                )
                await self.repo.create(setting)
                created += 1
        
        return created
    
    async def get_all_settings(self) -> List[Setting]:
        """Get all settings (admin)."""
        return await self.repo.get_all()
    
    async def get_public_settings(self) -> List[Setting]:
        """Get public settings for frontend."""
        return await self.repo.get_public()
    
    async def get_grouped_settings(self, public_only: bool = True) -> SettingsGrouped:
        """Get settings grouped by category."""
        if public_only:
            settings = await self.repo.get_public()
        else:
            settings = await self.repo.get_all()
        
        grouped = {
            "general": {},
            "contact": {},
            "social": {},
            "shipping": {},
            "seo": {},
            "appearance": {}
        }
        
        for s in settings:
            category_key = s.category.value.lower()
            if category_key in grouped:
                value = s.json_value if s.json_value else s.value
                grouped[category_key][s.key] = value
        
        return SettingsGrouped(**grouped)
    
    async def get_setting(self, key: str) -> Setting:
        """Get a specific setting by key."""
        setting = await self.repo.get_by_key(key)
        if not setting:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message=f"Setting '{key}' not found"
            )
        return setting
    
    async def get_value(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Get just the value of a setting."""
        return await self.repo.get_value(key, default)
    
    async def update_setting(
        self,
        key: str,
        data: SettingUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Setting:
        """Update a setting by key."""
        setting = await self.get_setting(key)
        
        if data.value is not None:
            setting.value = data.value
        if data.json_value is not None:
            setting.json_value = data.json_value
        if data.description is not None:
            setting.description = data.description
        if data.is_public is not None:
            setting.is_public = data.is_public
        
        setting = await self.repo.update(setting)
        
        # Audit log (mask sensitive values)
        if self.audit_service:
            log_value = data.value
            if setting.is_sensitive and data.value:
                log_value = "****"
            
            await self.audit_service.log_action(
                action="update_setting",
                actor_id=actor_id,
                target_id=str(setting.id),
                target_type="setting",
                details={"key": key, "value": log_value},
                request=request
            )
        
        return setting
    
    async def bulk_update(
        self,
        settings: Dict[str, str],
        actor_id: str,
        request: Optional[Request] = None
    ) -> int:
        """
        Bulk update settings.
        Returns count of settings updated.
        """
        updated = 0
        for key, value in settings.items():
            try:
                setting = await self.get_setting(key)
                setting.value = value
                await self.repo.update(setting)
                updated += 1
            except NotFoundError:
                continue  # Skip unknown settings
        
        # Audit log
        if self.audit_service:
            await self.audit_service.log_action(
                action="bulk_update_settings",
                actor_id=actor_id,
                target_id="settings",
                target_type="setting",
                details={"count": updated, "keys": list(settings.keys())},
                request=request
            )
        
        return updated
    
    async def get_by_category(self, category: SettingCategory) -> List[Setting]:
        """Get settings by category."""
        return await self.repo.get_by_category(category)
