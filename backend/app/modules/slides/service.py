"""
Service for Slide business logic.
"""
from typing import Optional, List
from uuid import UUID
from fastapi import Request

from app.core.exceptions import NotFoundError
from app.constants.error_codes import ErrorCode
from app.modules.slides.models import Slide, SlideType
from app.modules.slides.repository import SlideRepository
from app.modules.slides.schemas import SlideCreate, SlideUpdate
from app.modules.audit.service import AuditService
from app.modules.uploads.service import UploadService


class SlideService:
    """Service for Slide business logic."""
    
    def __init__(
        self, 
        repository: SlideRepository, 
        audit_service: AuditService,
        upload_service: Optional[UploadService] = None
    ):
        self.repository = repository
        self.audit_service = audit_service
        self.upload_service = upload_service or UploadService()
    
    async def get_slide(self, slide_id: UUID) -> Slide:
        """Get slide by ID."""
        slide = await self.repository.get(slide_id)
        if not slide:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Slide not found"
            )
        return slide
    
    async def list_slides(self, include_inactive: bool = False) -> List[Slide]:
        """List all slides (admin)."""
        return await self.repository.list_all(include_inactive)

    async def list_slides_paginated(
        self,
        page: int = 1,
        limit: int = 10,
        search: Optional[str] = None,
        include_inactive: bool = True
    ) -> dict:
        """List slides with pagination."""
        offset = (page - 1) * limit
        return await self.repository.list_paginated(
            limit=limit,
            offset=offset,
            search=search,
            include_inactive=include_inactive
        )
    
    async def list_active_slides(self) -> List[Slide]:
        """List active slides for homepage (public)."""
        return await self.repository.list_active()
    
    async def list_slides_by_type(
        self, 
        slide_type: SlideType,
        include_inactive: bool = False
    ) -> List[Slide]:
        """List slides by type."""
        return await self.repository.list_by_type(slide_type, include_inactive)
    
    async def create_slide(
        self,
        data: SlideCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Slide:
        """Create a new slide."""
        slide = Slide(**data.model_dump())
        slide = await self.repository.create(slide)
        
        await self.audit_service.log_action(
            action="create_slide",
            actor_id=actor_id,
            target_id=str(slide.id),
            target_type="slide",
            details={"title": slide.title, "type": slide.slide_type.value},
            request=request
        )
        return slide
    
    async def update_slide(
        self,
        slide_id: UUID,
        data: SlideUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Slide:
        """Update an existing slide."""
        slide = await self.get_slide(slide_id)
        update_data = data.model_dump(exclude_unset=True)
        slide = await self.repository.update(slide, update_data)
        
        await self.audit_service.log_action(
            action="update_slide",
            actor_id=actor_id,
            target_id=str(slide_id),
            target_type="slide",
            details=update_data,
            request=request
        )
        return slide
    
    async def delete_slide(
        self,
        slide_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> None:
        """Delete a slide and its image."""
        slide = await self.get_slide(slide_id)
        
        # Delete associated image
        if slide.image_url and slide.image_url.startswith("/static/uploads/"):
            self.upload_service.delete_product_image(slide.image_url)
        
        await self.repository.delete(slide)
        
        await self.audit_service.log_action(
            action="delete_slide",
            actor_id=actor_id,
            target_id=str(slide_id),
            target_type="slide",
            details={"title": slide.title},
            request=request
        )
    
    async def update_slide_order(
        self,
        slide_ids: List[UUID],
        actor_id: str,
        request: Optional[Request] = None
    ) -> None:
        """Update slide display order."""
        await self.repository.update_order(slide_ids)
        
        await self.audit_service.log_action(
            action="reorder_slides",
            actor_id=actor_id,
            target_id="slides",
            target_type="slides",
            details={"order": [str(sid) for sid in slide_ids]},
            request=request
        )
    
    async def toggle_slide_active(
        self,
        slide_id: UUID,
        is_active: bool,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Slide:
        """Toggle slide active status."""
        slide = await self.get_slide(slide_id)
        slide = await self.repository.update(slide, {"is_active": is_active})
        
        await self.audit_service.log_action(
            action="toggle_slide",
            actor_id=actor_id,
            target_id=str(slide_id),
            target_type="slide",
            details={"is_active": is_active},
            request=request
        )
        return slide
