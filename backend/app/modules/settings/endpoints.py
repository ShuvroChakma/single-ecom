"""
API endpoints for Settings.
Public read + Admin write.
"""
from typing import List, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.constants.permissions import PermissionEnum
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.settings.service import SettingsService
from app.modules.settings.models import SettingCategory
from app.modules.settings.schemas import (
    SettingUpdate,
    SettingBulkUpdate,
    SettingResponse,
    SettingPublic,
    SettingsGrouped
)


router = APIRouter()


def get_settings_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> SettingsService:
    """Get settings service instance."""
    return SettingsService(session, audit_service)


# ============ PUBLIC ENDPOINTS ============

@router.get("", response_model=SuccessResponse[SettingsGrouped])
async def get_public_settings(
    service: SettingsService = Depends(get_settings_service)
):
    """
    Get public settings for frontend.
    
    Returns settings grouped by category.
    """
    grouped = await service.get_grouped_settings(public_only=True)
    
    return create_success_response(
        message="Settings retrieved",
        data=grouped
    )


@router.get("/{key}")
async def get_setting_value(
    key: str,
    service: SettingsService = Depends(get_settings_service)
):
    """Get a specific public setting by key."""
    setting = await service.get_setting(key)
    
    if not setting.is_public:
        from app.core.exceptions import PermissionDeniedError
        from app.constants.error_codes import ErrorCode
        raise PermissionDeniedError(
            error_code=ErrorCode.PERMISSION_DENIED,
            message="Setting is not public"
        )
    
    value = setting.json_value if setting.json_value else setting.value
    
    return create_success_response(
        message="Setting retrieved",
        data={"key": setting.key, "value": value}
    )


# ============ ADMIN ENDPOINTS ============

@router.get("/admin/all", response_model=SuccessResponse[List[SettingResponse]])
async def list_all_settings(
    current_user: User = Depends(require_permissions([PermissionEnum.SETTINGS_READ])),
    service: SettingsService = Depends(get_settings_service)
):
    """List all settings (admin)."""
    settings = await service.get_all_settings()
    
    return create_success_response(
        message="All settings retrieved",
        data=[SettingResponse.model_validate(s) for s in settings]
    )


@router.get("/admin/grouped", response_model=SuccessResponse[SettingsGrouped])
async def get_all_grouped_settings(
    current_user: User = Depends(require_permissions([PermissionEnum.SETTINGS_READ])),
    service: SettingsService = Depends(get_settings_service)
):
    """Get all settings grouped by category (admin)."""
    grouped = await service.get_grouped_settings(public_only=False)
    
    return create_success_response(
        message="Settings retrieved",
        data=grouped
    )


@router.get("/admin/category/{category}", response_model=SuccessResponse[List[SettingResponse]])
async def get_settings_by_category(
    category: SettingCategory,
    current_user: User = Depends(require_permissions([PermissionEnum.SETTINGS_READ])),
    service: SettingsService = Depends(get_settings_service)
):
    """Get settings by category (admin)."""
    settings = await service.get_by_category(category)
    
    return create_success_response(
        message=f"{category.value} settings retrieved",
        data=[SettingResponse.model_validate(s) for s in settings]
    )


@router.put("/admin/{key}", response_model=SuccessResponse[SettingResponse])
async def update_setting(
    key: str,
    data: SettingUpdate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.SETTINGS_WRITE])),
    service: SettingsService = Depends(get_settings_service)
):
    """Update a setting by key (admin)."""
    setting = await service.update_setting(key, data, str(current_user.id), request)
    
    return create_success_response(
        message="Setting updated",
        data=SettingResponse.model_validate(setting)
    )


@router.put("/admin/bulk", response_model=SuccessResponse[dict])
async def bulk_update_settings(
    data: SettingBulkUpdate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.SETTINGS_WRITE])),
    service: SettingsService = Depends(get_settings_service)
):
    """Bulk update multiple settings (admin)."""
    count = await service.bulk_update(data.settings, str(current_user.id), request)
    
    return create_success_response(
        message=f"{count} settings updated",
        data={"updated_count": count}
    )


@router.post("/admin/initialize", response_model=SuccessResponse[dict])
async def initialize_settings(
    current_user: User = Depends(require_permissions([PermissionEnum.SETTINGS_WRITE])),
    service: SettingsService = Depends(get_settings_service)
):
    """Initialize default settings (admin)."""
    count = await service.initialize_settings()
    
    return create_success_response(
        message=f"Initialized {count} new settings",
        data={"created_count": count}
    )
