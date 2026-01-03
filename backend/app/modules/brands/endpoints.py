"""
API endpoints for Brands and Collections.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.constants.permissions import PermissionEnum
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.brands.service import BrandService, CollectionService
from app.modules.brands.schemas import (
    BrandCreate, BrandUpdate, BrandResponse,
    CollectionCreate, CollectionUpdate, CollectionResponse
)

router = APIRouter(prefix="/products")


async def get_brand_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> BrandService:
    return BrandService(session, audit_service)


async def get_collection_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> CollectionService:
    return CollectionService(session, audit_service)


# ============ BRAND ENDPOINTS ============

@router.get("/brands", response_model=SuccessResponse[List[BrandResponse]])
async def list_brands(
    service: BrandService = Depends(get_brand_service)
):
    """List all active brands (public)."""
    brands = await service.list_brands(include_inactive=False)
    return create_success_response(
        message="Brands retrieved successfully",
        data=[BrandResponse.model_validate(b) for b in brands]
    )


@router.get("/brands/{slug}", response_model=SuccessResponse[BrandResponse])
async def get_brand_by_slug(
    slug: str,
    service: BrandService = Depends(get_brand_service)
):
    """Get brand by slug (public)."""
    brand = await service.get_brand_by_slug(slug)
    return create_success_response(
        message="Brand retrieved successfully",
        data=BrandResponse.model_validate(brand)
    )


@router.post(
    "/admin/brands",
    response_model=SuccessResponse[BrandResponse],
    status_code=201
)
async def create_brand(
    data: BrandCreate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.BRANDS_WRITE])),
    service: BrandService = Depends(get_brand_service)
):
    """Create a new brand (admin)."""
    brand = await service.create_brand(data, str(current_user.id), request)
    return create_success_response(
        message="Brand created successfully",
        data=BrandResponse.model_validate(brand)
    )


@router.put(
    "/admin/brands/{brand_id}",
    response_model=SuccessResponse[BrandResponse]
)
async def update_brand(
    brand_id: UUID,
    data: BrandUpdate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.BRANDS_WRITE])),
    service: BrandService = Depends(get_brand_service)
):
    """Update a brand (admin)."""
    brand = await service.update_brand(brand_id, data, str(current_user.id), request)
    return create_success_response(
        message="Brand updated successfully",
        data=BrandResponse.model_validate(brand)
    )


@router.delete(
    "/admin/brands/{brand_id}",
    response_model=SuccessResponse[dict]
)
async def delete_brand(
    brand_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.BRANDS_DELETE])),
    service: BrandService = Depends(get_brand_service)
):
    """Delete a brand (admin)."""
    await service.delete_brand(brand_id, str(current_user.id), request)
    return create_success_response(
        message="Brand deleted successfully",
        data={"deleted": True}
    )


# ============ COLLECTION ENDPOINTS ============

@router.get("/collections", response_model=SuccessResponse[List[CollectionResponse]])
async def list_collections(
    service: CollectionService = Depends(get_collection_service)
):
    """List all active collections (public)."""
    collections = await service.list_collections(include_inactive=False)
    return create_success_response(
        message="Collections retrieved successfully",
        data=[CollectionResponse.model_validate(c) for c in collections]
    )


@router.get("/collections/{slug}", response_model=SuccessResponse[CollectionResponse])
async def get_collection_by_slug(
    slug: str,
    service: CollectionService = Depends(get_collection_service)
):
    """Get collection by slug (public)."""
    collection = await service.get_collection_by_slug(slug)
    return create_success_response(
        message="Collection retrieved successfully",
        data=CollectionResponse.model_validate(collection)
    )


@router.post(
    "/admin/collections",
    response_model=SuccessResponse[CollectionResponse],
    status_code=201
)
async def create_collection(
    data: CollectionCreate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.COLLECTIONS_WRITE])),
    service: CollectionService = Depends(get_collection_service)
):
    """Create a new collection (admin)."""
    collection = await service.create_collection(data, str(current_user.id), request)
    return create_success_response(
        message="Collection created successfully",
        data=CollectionResponse.model_validate(collection)
    )


@router.put(
    "/admin/collections/{collection_id}",
    response_model=SuccessResponse[CollectionResponse]
)
async def update_collection(
    collection_id: UUID,
    data: CollectionUpdate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.COLLECTIONS_WRITE])),
    service: CollectionService = Depends(get_collection_service)
):
    """Update a collection (admin)."""
    collection = await service.update_collection(collection_id, data, str(current_user.id), request)
    return create_success_response(
        message="Collection updated successfully",
        data=CollectionResponse.model_validate(collection)
    )


@router.delete(
    "/admin/collections/{collection_id}",
    response_model=SuccessResponse[dict]
)
async def delete_collection(
    collection_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.COLLECTIONS_DELETE])),
    service: CollectionService = Depends(get_collection_service)
):
    """Delete a collection (admin)."""
    await service.delete_collection(collection_id, str(current_user.id), request)
    return create_success_response(
        message="Collection deleted successfully",
        data={"deleted": True}
    )
