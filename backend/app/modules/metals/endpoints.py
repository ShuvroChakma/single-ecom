"""
API endpoints for Metals and Purities.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.metals.service import MetalService, PurityService
from app.modules.metals.schemas import (
    MetalCreate, MetalUpdate, MetalResponse, MetalWithPuritiesResponse,
    PurityCreate, PurityUpdate, PurityResponse, PurityFullResponse
)

router = APIRouter(prefix="/products", tags=["Metals & Purities"])


async def get_metal_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> MetalService:
    return MetalService(session, audit_service)


async def get_purity_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> PurityService:
    return PurityService(session, audit_service)


# ============ METAL ENDPOINTS ============

@router.get("/metals", response_model=SuccessResponse[List[MetalWithPuritiesResponse]])
async def list_metals(
    service: MetalService = Depends(get_metal_service)
):
    """List all active metals with their purities (public)."""
    metals = await service.list_metals(include_inactive=False)
    return create_success_response(
        message="Metals retrieved successfully",
        data=[MetalWithPuritiesResponse.model_validate(m) for m in metals]
    )


@router.get("/metals/{metal_id}", response_model=SuccessResponse[MetalWithPuritiesResponse])
async def get_metal(
    metal_id: UUID,
    service: MetalService = Depends(get_metal_service)
):
    """Get metal by ID with purities (public)."""
    metal = await service.get_metal(metal_id)
    return create_success_response(
        message="Metal retrieved successfully",
        data=MetalWithPuritiesResponse.model_validate(metal)
    )


@router.post(
    "/admin/metals",
    response_model=SuccessResponse[MetalResponse],
    status_code=201
)
async def create_metal(
    data: MetalCreate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: MetalService = Depends(get_metal_service)
):
    """Create a new metal (admin)."""
    metal = await service.create_metal(data, str(current_user.id), request)
    return create_success_response(
        message="Metal created successfully",
        data=MetalResponse.model_validate(metal)
    )


@router.put(
    "/admin/metals/{metal_id}",
    response_model=SuccessResponse[MetalResponse]
)
async def update_metal(
    metal_id: UUID,
    data: MetalUpdate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: MetalService = Depends(get_metal_service)
):
    """Update a metal (admin)."""
    metal = await service.update_metal(metal_id, data, str(current_user.id), request)
    return create_success_response(
        message="Metal updated successfully",
        data=MetalResponse.model_validate(metal)
    )


@router.delete(
    "/admin/metals/{metal_id}",
    response_model=SuccessResponse[dict]
)
async def delete_metal(
    metal_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions(["products:delete"])),
    service: MetalService = Depends(get_metal_service)
):
    """Delete a metal (admin)."""
    await service.delete_metal(metal_id, str(current_user.id), request)
    return create_success_response(
        message="Metal deleted successfully",
        data={"deleted": True}
    )


# ============ PURITY ENDPOINTS ============

@router.get("/metals/{metal_id}/purities", response_model=SuccessResponse[List[PurityResponse]])
async def list_purities(
    metal_id: UUID,
    service: PurityService = Depends(get_purity_service)
):
    """List purities for a metal (public)."""
    purities = await service.list_by_metal(metal_id)
    return create_success_response(
        message="Purities retrieved successfully",
        data=[PurityResponse.model_validate(p) for p in purities]
    )


@router.post(
    "/admin/purities",
    response_model=SuccessResponse[PurityFullResponse],
    status_code=201
)
async def create_purity(
    data: PurityCreate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: PurityService = Depends(get_purity_service)
):
    """Create a new purity (admin)."""
    purity = await service.create_purity(data, str(current_user.id), request)
    return create_success_response(
        message="Purity created successfully",
        data=PurityFullResponse.model_validate(purity)
    )


@router.put(
    "/admin/purities/{purity_id}",
    response_model=SuccessResponse[PurityFullResponse]
)
async def update_purity(
    purity_id: UUID,
    data: PurityUpdate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: PurityService = Depends(get_purity_service)
):
    """Update a purity (admin)."""
    purity = await service.update_purity(purity_id, data, str(current_user.id), request)
    return create_success_response(
        message="Purity updated successfully",
        data=PurityFullResponse.model_validate(purity)
    )


@router.delete(
    "/admin/purities/{purity_id}",
    response_model=SuccessResponse[dict]
)
async def delete_purity(
    purity_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions(["products:delete"])),
    service: PurityService = Depends(get_purity_service)
):
    """Delete a purity (admin)."""
    await service.delete_purity(purity_id, str(current_user.id), request)
    return create_success_response(
        message="Purity deleted successfully",
        data={"deleted": True}
    )
