"""
Pydantic schemas for Settings.
"""
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

from app.modules.settings.models import SettingCategory


class SettingUpdate(BaseModel):
    """Schema for updating a setting."""
    value: Optional[str] = None
    json_value: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class SettingBulkUpdate(BaseModel):
    """Schema for bulk updating settings."""
    settings: Dict[str, str]  # key -> value pairs


class SettingResponse(BaseModel):
    """Schema for setting response."""
    id: UUID
    key: str
    value: Optional[str]
    json_value: Optional[Dict[str, Any]]
    category: SettingCategory
    description: Optional[str]
    is_public: bool
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class SettingPublic(BaseModel):
    """Public setting (no sensitive data)."""
    key: str
    value: Optional[str]
    json_value: Optional[Dict[str, Any]]
    category: SettingCategory


class SettingsGrouped(BaseModel):
    """Settings grouped by category."""
    general: Dict[str, Any]
    contact: Dict[str, Any]
    social: Dict[str, Any]
    shipping: Dict[str, Any]
    seo: Dict[str, Any]
    appearance: Dict[str, Any]
