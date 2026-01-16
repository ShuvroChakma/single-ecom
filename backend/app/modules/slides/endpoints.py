"""
API endpoints for Slides (Homepage banners/carousels).
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Request, UploadFile, File

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.constants.permissions import PermissionEnum
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.slides.service import SlideService
from app.modules.slides.repository import SlideRepository
from app.modules.slides.schemas import (
    SlideCreate, SlideUpdate, SlideResponse, SlideOrderUpdate, SlideListResponse
)
from app.modules.slides.models import SlideType
from app.modules.uploads.service import UploadService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/slides", tags=["Homepage Slides"])


async def get_slide_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> SlideService:
    repository = SlideRepository(session)
    return SlideService(repository, audit_service)


def get_upload_service() -> UploadService:
    return UploadService()


# ============ PUBLIC ENDPOINTS ============

@router.get("/", response_model=SuccessResponse[List[SlideResponse]])
async def list_active_slides(
    service: SlideService = Depends(get_slide_service)
):
    """
    List active slides for homepage (public).
    
    Returns only currently active slides within their schedule.
    """
    slides = await service.list_active_slides()
    return create_success_response(
        message="Slides retrieved successfully",
        data=[SlideResponse.model_validate(s) for s in slides]
    )


@router.get("/type/{slide_type}", response_model=SuccessResponse[List[SlideResponse]])
async def list_slides_by_type(
    slide_type: SlideType,
    service: SlideService = Depends(get_slide_service)
):
    """List active slides by type (public)."""
    slides = await service.list_slides_by_type(slide_type)
    return create_success_response(
        message=f"{slide_type.value} slides retrieved successfully",
        data=[SlideResponse.model_validate(s) for s in slides]
    )


# ============ ADMIN ENDPOINTS ============

@router.get("/admin", response_model=SuccessResponse[SlideListResponse])
async def list_all_slides(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    include_inactive: bool = True,
    current_user: User = Depends(require_permissions([PermissionEnum.SLIDES_READ])),
    service: SlideService = Depends(get_slide_service)
):
    """List all slides with pagination (admin)."""
    result = await service.list_slides_paginated(
        page=page,
        limit=limit,
        search=search,
        include_inactive=include_inactive
    )
    return create_success_response(
        message="All slides retrieved successfully",
        data=SlideListResponse(
            items=[SlideResponse.model_validate(s) for s in result["items"]],
            total=result["total"],
            page=result["page"],
            limit=result["limit"],
            pages=result["pages"]
        )
    )


@router.get("/admin/{slide_id}", response_model=SuccessResponse[SlideResponse])
async def get_slide(
    slide_id: UUID,
    current_user: User = Depends(require_permissions([PermissionEnum.SLIDES_READ])),
    service: SlideService = Depends(get_slide_service)
):
    """Get a specific slide by ID (admin)."""
    slide = await service.get_slide(slide_id)
    return create_success_response(
        message="Slide retrieved successfully",
        data=SlideResponse.model_validate(slide)
    )


@router.post("/admin", response_model=SuccessResponse[SlideResponse], status_code=201)
async def create_slide(
    data: SlideCreate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.SLIDES_WRITE])),
    service: SlideService = Depends(get_slide_service)
):
    """Create a new slide (admin)."""
    slide = await service.create_slide(data, str(current_user.id), request)
    return create_success_response(
        message="Slide created successfully",
        data=SlideResponse.model_validate(slide)
    )


@router.post(
    "/admin/upload",
    response_model=SuccessResponse[dict],
    status_code=201
)
async def upload_slide_image(
    request: Request,
    file: UploadFile = File(..., description="Slide image"),
    current_user: User = Depends(require_permissions([PermissionEnum.SLIDES_WRITE])),
    upload_service: UploadService = Depends(get_upload_service)
):
    """
    Upload a slide image before creating the slide.
    
    Returns the image URL to use in SlideCreate.
    """
    # Validate file
    upload_service._validate_file(file)
    
    # Upload to slides directory
    from pathlib import Path
    import uuid as uuid_lib
    
    slides_dir = Path("static/uploads/slides")
    slides_dir.mkdir(parents=True, exist_ok=True)
    
    ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"slide_{uuid_lib.uuid4().hex[:12]}.{ext}"
    file_path = slides_dir / filename
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB
        from app.core.exceptions import ValidationError
        from app.constants.error_codes import ErrorCode
        raise ValidationError(
            error_code=ErrorCode.FIELD_INVALID,
            message="File too large. Maximum size: 5MB",
            field="file"
        )
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Optimize image
    upload_service._optimize_image(file_path, max_size=1920)
    
    url = f"/static/uploads/slides/{filename}"
    
    return create_success_response(
        message="Slide image uploaded successfully",
        data={"url": url, "filename": filename}
    )


@router.put("/admin/{slide_id}", response_model=SuccessResponse[SlideResponse])
async def update_slide(
    slide_id: UUID,
    data: SlideUpdate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.SLIDES_WRITE])),
    service: SlideService = Depends(get_slide_service)
):
    """Update a slide (admin)."""
    slide = await service.update_slide(slide_id, data, str(current_user.id), request)
    return create_success_response(
        message="Slide updated successfully",
        data=SlideResponse.model_validate(slide)
    )


@router.delete("/admin/{slide_id}", response_model=SuccessResponse[dict])
async def delete_slide(
    slide_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.SLIDES_DELETE])),
    service: SlideService = Depends(get_slide_service)
):
    """Delete a slide (admin)."""
    await service.delete_slide(slide_id, str(current_user.id), request)
    return create_success_response(
        message="Slide deleted successfully",
        data={"deleted": True}
    )


@router.put("/admin/order", response_model=SuccessResponse[dict])
async def update_slide_order(
    data: SlideOrderUpdate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.SLIDES_WRITE])),
    service: SlideService = Depends(get_slide_service)
):
    """Update slide display order (admin)."""
    await service.update_slide_order(data.slide_ids, str(current_user.id), request)
    return create_success_response(
        message="Slide order updated successfully",
        data={"order": [str(sid) for sid in data.slide_ids]}
    )


@router.patch("/admin/{slide_id}/toggle", response_model=SuccessResponse[SlideResponse])
async def toggle_slide_active(
    slide_id: UUID,
    is_active: bool,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.SLIDES_WRITE])),
    service: SlideService = Depends(get_slide_service)
):
    """Toggle slide active status (admin)."""
    slide = await service.toggle_slide_active(
        slide_id, is_active, str(current_user.id), request
    )
    return create_success_response(
        message=f"Slide {'activated' if is_active else 'deactivated'} successfully",
        data=SlideResponse.model_validate(slide)
    )
