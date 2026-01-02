"""
API endpoints for Metals and Purities.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.metals.service import MetalService, PurityService
from app.modules.metals.schemas import (
    MetalCreate, MetalUpdate, MetalResponse, MetalWithPuritiesResponse,
    PurityCreate, PurityUpdate, PurityResponse, PurityFullResponse
)

router = APIRouter(prefix="/catalog", tags=["Metals & Purities"])


# ============ METAL ENDPOINTS ============

@router.get("/metals", response_model=SuccessResponse[List[MetalWithPuritiesResponse]])
async def list_metals(
    session: AsyncSession = Depends(get_db)
):
    """List all active metals with their purities (public)."""
    service = MetalService(session, AuditService(session))
    metals = await service.list_metals(include_inactive=False)
    return SuccessResponse(data=[MetalWithPuritiesResponse.model_validate(m) for m in metals])


@router.get("/metals/{metal_id}", response_model=SuccessResponse[MetalWithPuritiesResponse])
async def get_metal(
    metal_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Get metal by ID with purities (public)."""
    service = MetalService(session, AuditService(session))
    metal = await service.get_metal(metal_id)
    return SuccessResponse(data=MetalWithPuritiesResponse.model_validate(metal))


@router.post(
    "/admin/metals",
    response_model=SuccessResponse[MetalResponse],
    status_code=201
)
async def create_metal(
    data: MetalCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Create a new metal (admin)."""
    service = MetalService(session, AuditService(session))
    metal = await service.create_metal(data, str(current_user.id), request)
    return SuccessResponse(data=MetalResponse.model_validate(metal))


@router.put(
    "/admin/metals/{metal_id}",
    response_model=SuccessResponse[MetalResponse]
)
async def update_metal(
    metal_id: UUID,
    data: MetalUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Update a metal (admin)."""
    service = MetalService(session, AuditService(session))
    metal = await service.update_metal(metal_id, data, str(current_user.id), request)
    return SuccessResponse(data=MetalResponse.model_validate(metal))


@router.delete(
    "/admin/metals/{metal_id}",
    response_model=SuccessResponse[dict]
)
async def delete_metal(
    metal_id: UUID,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:delete"]))
):
    """Delete a metal (admin)."""
    service = MetalService(session, AuditService(session))
    await service.delete_metal(metal_id, str(current_user.id), request)
    return SuccessResponse(data={"message": "Metal deleted successfully"})


# ============ PURITY ENDPOINTS ============

@router.get("/metals/{metal_id}/purities", response_model=SuccessResponse[List[PurityResponse]])
async def list_purities(
    metal_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """List purities for a metal (public)."""
    service = PurityService(session, AuditService(session))
    purities = await service.list_by_metal(metal_id)
    return SuccessResponse(data=[PurityResponse.model_validate(p) for p in purities])


@router.post(
    "/admin/purities",
    response_model=SuccessResponse[PurityFullResponse],
    status_code=201
)
async def create_purity(
    data: PurityCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Create a new purity (admin)."""
    service = PurityService(session, AuditService(session))
    purity = await service.create_purity(data, str(current_user.id), request)
    return SuccessResponse(data=PurityFullResponse.model_validate(purity))


@router.put(
    "/admin/purities/{purity_id}",
    response_model=SuccessResponse[PurityFullResponse]
)
async def update_purity(
    purity_id: UUID,
    data: PurityUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Update a purity (admin)."""
    service = PurityService(session, AuditService(session))
    purity = await service.update_purity(purity_id, data, str(current_user.id), request)
    return SuccessResponse(data=PurityFullResponse.model_validate(purity))


@router.delete(
    "/admin/purities/{purity_id}",
    response_model=SuccessResponse[dict]
)
async def delete_purity(
    purity_id: UUID,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:delete"]))
):
    """Delete a purity (admin)."""
    service = PurityService(session, AuditService(session))
    await service.delete_purity(purity_id, str(current_user.id), request)
    return SuccessResponse(data={"message": "Purity deleted successfully"})
