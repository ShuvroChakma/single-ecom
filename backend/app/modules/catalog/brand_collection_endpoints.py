"""
API endpoints for Brands and Collections.
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
from app.modules.catalog.brand_collection_service import BrandService, CollectionService
from app.modules.catalog.brand_collection_schemas import (
    BrandCreate, BrandUpdate, BrandResponse,
    CollectionCreate, CollectionUpdate, CollectionResponse
)

router = APIRouter(prefix="/catalog", tags=["Brands & Collections"])


# ============ BRAND ENDPOINTS ============

@router.get("/brands", response_model=SuccessResponse[List[BrandResponse]])
async def list_brands(
    session: AsyncSession = Depends(get_db)
):
    """List all active brands (public)."""
    service = BrandService(session, AuditService(session))
    brands = await service.list_brands(include_inactive=False)
    return SuccessResponse(data=[BrandResponse.model_validate(b) for b in brands])


@router.get("/brands/{slug}", response_model=SuccessResponse[BrandResponse])
async def get_brand_by_slug(
    slug: str,
    session: AsyncSession = Depends(get_db)
):
    """Get brand by slug (public)."""
    service = BrandService(session, AuditService(session))
    brand = await service.get_brand_by_slug(slug)
    return SuccessResponse(data=BrandResponse.model_validate(brand))


@router.post(
    "/admin/brands",
    response_model=SuccessResponse[BrandResponse],
    status_code=201
)
async def create_brand(
    data: BrandCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Create a new brand (admin)."""
    service = BrandService(session, AuditService(session))
    brand = await service.create_brand(data, str(current_user.id), request)
    return SuccessResponse(data=BrandResponse.model_validate(brand))


@router.put(
    "/admin/brands/{brand_id}",
    response_model=SuccessResponse[BrandResponse]
)
async def update_brand(
    brand_id: UUID,
    data: BrandUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Update a brand (admin)."""
    service = BrandService(session, AuditService(session))
    brand = await service.update_brand(brand_id, data, str(current_user.id), request)
    return SuccessResponse(data=BrandResponse.model_validate(brand))


@router.delete(
    "/admin/brands/{brand_id}",
    response_model=SuccessResponse[dict]
)
async def delete_brand(
    brand_id: UUID,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:delete"]))
):
    """Delete a brand (admin)."""
    service = BrandService(session, AuditService(session))
    await service.delete_brand(brand_id, str(current_user.id), request)
    return SuccessResponse(data={"message": "Brand deleted successfully"})


# ============ COLLECTION ENDPOINTS ============

@router.get("/collections", response_model=SuccessResponse[List[CollectionResponse]])
async def list_collections(
    session: AsyncSession = Depends(get_db)
):
    """List all active collections (public)."""
    service = CollectionService(session, AuditService(session))
    collections = await service.list_collections(include_inactive=False)
    return SuccessResponse(data=[CollectionResponse.model_validate(c) for c in collections])


@router.get("/collections/{slug}", response_model=SuccessResponse[CollectionResponse])
async def get_collection_by_slug(
    slug: str,
    session: AsyncSession = Depends(get_db)
):
    """Get collection by slug (public)."""
    service = CollectionService(session, AuditService(session))
    collection = await service.get_collection_by_slug(slug)
    return SuccessResponse(data=CollectionResponse.model_validate(collection))


@router.post(
    "/admin/collections",
    response_model=SuccessResponse[CollectionResponse],
    status_code=201
)
async def create_collection(
    data: CollectionCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Create a new collection (admin)."""
    service = CollectionService(session, AuditService(session))
    collection = await service.create_collection(data, str(current_user.id), request)
    return SuccessResponse(data=CollectionResponse.model_validate(collection))


@router.put(
    "/admin/collections/{collection_id}",
    response_model=SuccessResponse[CollectionResponse]
)
async def update_collection(
    collection_id: UUID,
    data: CollectionUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Update a collection (admin)."""
    service = CollectionService(session, AuditService(session))
    collection = await service.update_collection(collection_id, data, str(current_user.id), request)
    return SuccessResponse(data=CollectionResponse.model_validate(collection))


@router.delete(
    "/admin/collections/{collection_id}",
    response_model=SuccessResponse[dict]
)
async def delete_collection(
    collection_id: UUID,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:delete"]))
):
    """Delete a collection (admin)."""
    service = CollectionService(session, AuditService(session))
    await service.delete_collection(collection_id, str(current_user.id), request)
    return SuccessResponse(data={"message": "Collection deleted successfully"})
