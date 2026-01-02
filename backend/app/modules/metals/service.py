"""
Service layer for Metal and Purity business logic.
"""
from typing import Optional, List
from uuid import UUID
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ValidationError, NotFoundError
from app.constants.error_codes import ErrorCode
from app.modules.audit.service import AuditService
from app.modules.metals.models import Metal, Purity
from app.modules.metals.schemas import MetalCreate, MetalUpdate, PurityCreate, PurityUpdate
from app.modules.metals.repository import MetalRepository, PurityRepository


class MetalService:
    """Service for Metal business logic."""
    
    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.repository = MetalRepository(session)
        self.purity_repository = PurityRepository(session)
        self.audit_service = audit_service
    
    async def list_metals(self, include_inactive: bool = False) -> List[Metal]:
        """List metals with purities."""
        if include_inactive:
            return await self.repository.list_all()
        return await self.repository.list_active()
    
    async def get_metal(self, metal_id: UUID) -> Metal:
        """Get metal by ID with purities."""
        metal = await self.repository.get_with_purities(metal_id)
        if not metal:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Metal not found"
            )
        return metal
    
    async def create_metal(
        self,
        data: MetalCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Metal:
        """Create a new metal."""
        try:
            metal = Metal(**data.model_dump())
            metal = await self.repository.create(metal)
        except IntegrityError as e:
            if "metals_code" in str(e.orig) or "ix_metals_code" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Metal code '{data.code}' already exists",
                    field="code"
                )
            raise
        
        await self.audit_service.log_action(
            action="create_metal",
            actor_id=actor_id,
            target_id=str(metal.id),
            target_type="metal",
            details={"name": metal.name, "code": metal.code},
            request=request
        )
        return metal
    
    async def update_metal(
        self,
        metal_id: UUID,
        data: MetalUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Metal:
        """Update a metal."""
        metal = await self.get_metal(metal_id)
        update_data = data.model_dump(exclude_unset=True)
        
        try:
            metal = await self.repository.update(metal, update_data)
        except IntegrityError as e:
            if "metals_code" in str(e.orig) or "ix_metals_code" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Metal code '{data.code}' already exists",
                    field="code"
                )
            raise
        
        await self.audit_service.log_action(
            action="update_metal",
            actor_id=actor_id,
            target_id=str(metal_id),
            target_type="metal",
            details=update_data,
            request=request
        )
        return metal
    
    async def delete_metal(
        self,
        metal_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> None:
        """Delete a metal."""
        metal = await self.get_metal(metal_id)
        await self.repository.delete(metal)
        
        await self.audit_service.log_action(
            action="delete_metal",
            actor_id=actor_id,
            target_id=str(metal_id),
            target_type="metal",
            details={"name": metal.name},
            request=request
        )


class PurityService:
    """Service for Purity business logic."""
    
    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.repository = PurityRepository(session)
        self.metal_repository = MetalRepository(session)
        self.audit_service = audit_service
    
    async def get_purity(self, purity_id: UUID) -> Purity:
        """Get purity by ID."""
        purity = await self.repository.get(purity_id)
        if not purity:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Purity not found"
            )
        return purity
    
    async def list_by_metal(self, metal_id: UUID) -> List[Purity]:
        """List purities for a metal."""
        return await self.repository.list_by_metal(metal_id)
    
    async def create_purity(
        self,
        data: PurityCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Purity:
        """Create a new purity."""
        # Validate metal exists
        metal = await self.metal_repository.get(data.metal_id)
        if not metal:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Metal not found"
            )
        
        try:
            purity = Purity(**data.model_dump())
            purity = await self.repository.create(purity)
        except IntegrityError as e:
            if "purities_code" in str(e.orig) or "ix_purities_code" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Purity code '{data.code}' already exists",
                    field="code"
                )
            raise
        
        await self.audit_service.log_action(
            action="create_purity",
            actor_id=actor_id,
            target_id=str(purity.id),
            target_type="purity",
            details={"name": purity.name, "code": purity.code, "fineness": str(purity.fineness)},
            request=request
        )
        return purity
    
    async def update_purity(
        self,
        purity_id: UUID,
        data: PurityUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Purity:
        """Update a purity."""
        purity = await self.get_purity(purity_id)
        update_data = data.model_dump(exclude_unset=True)
        
        # Validate new metal if changing
        if "metal_id" in update_data:
            metal = await self.metal_repository.get(update_data["metal_id"])
            if not metal:
                raise NotFoundError(
                    error_code=ErrorCode.RESOURCE_NOT_FOUND,
                    message="Metal not found"
                )
        
        try:
            purity = await self.repository.update(purity, update_data)
        except IntegrityError as e:
            if "purities_code" in str(e.orig) or "ix_purities_code" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Purity code '{data.code}' already exists",
                    field="code"
                )
            raise
        
        await self.audit_service.log_action(
            action="update_purity",
            actor_id=actor_id,
            target_id=str(purity_id),
            target_type="purity",
            details=update_data,
            request=request
        )
        return purity
    
    async def delete_purity(
        self,
        purity_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> None:
        """Delete a purity."""
        purity = await self.get_purity(purity_id)
        await self.repository.delete(purity)
        
        await self.audit_service.log_action(
            action="delete_purity",
            actor_id=actor_id,
            target_id=str(purity_id),
            target_type="purity",
            details={"name": purity.name},
            request=request
        )
