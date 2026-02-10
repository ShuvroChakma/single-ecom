"""
API endpoints for store locations.
Public endpoints for customers + Admin CRUD.
"""
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.constants.permissions import PermissionEnum
from app.modules.users.models import User
from app.modules.stores.service import StoreService
from app.modules.stores.schemas import (
    StoreCreate,
    StoreUpdate,
    StoreResponse
)


router = APIRouter()


def get_store_service(session: AsyncSession = Depends(get_db)) -> StoreService:
    """Get store service instance."""
    return StoreService(session)


# ============ PUBLIC ENDPOINTS ============

@router.get("", response_model=SuccessResponse[List[StoreResponse]])
async def get_stores(
    city: Optional[str] = Query(None, description="Filter by city name"),
    service: StoreService = Depends(get_store_service)
):
    """Get all active stores, optionally filtered by city."""
    stores = await service.get_stores(city=city, active_only=True)
    return create_success_response(
        message="Stores retrieved successfully",
        data=stores
    )


@router.get("/nearby", response_model=SuccessResponse[List[StoreResponse]])
async def find_nearby_stores(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lng: float = Query(..., ge=-180, le=180, description="Longitude"),
    radius: float = Query(50, ge=1, le=500, description="Search radius in km"),
    service: StoreService = Depends(get_store_service)
):
    """Find stores near a location."""
    stores = await service.find_nearby_stores(lat=lat, lng=lng, radius_km=radius)
    return create_success_response(
        message=f"Found {len(stores)} stores within {radius}km",
        data=stores
    )


@router.get("/{store_id}", response_model=SuccessResponse[StoreResponse])
async def get_store(
    store_id: UUID,
    service: StoreService = Depends(get_store_service)
):
    """Get a specific store by ID."""
    store = await service.get_store(store_id)
    return create_success_response(
        message="Store retrieved successfully",
        data=store
    )


# ============ ADMIN ENDPOINTS ============

@router.get("/admin/all", response_model=SuccessResponse[List[StoreResponse]])
async def admin_get_all_stores(
    include_inactive: bool = Query(False, description="Include inactive stores"),
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_READ])),
    service: StoreService = Depends(get_store_service)
):
    """Get all stores including inactive (admin only)."""
    stores = await service.get_stores(active_only=not include_inactive)
    return create_success_response(
        message="Stores retrieved successfully",
        data=stores
    )


@router.post("/admin", response_model=SuccessResponse[StoreResponse], status_code=201)
async def create_store(
    data: StoreCreate,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_WRITE])),
    service: StoreService = Depends(get_store_service)
):
    """Create a new store (admin only)."""
    store = await service.create_store(data)
    return create_success_response(
        message="Store created successfully",
        data=store
    )


@router.put("/admin/{store_id}", response_model=SuccessResponse[StoreResponse])
async def update_store(
    store_id: UUID,
    data: StoreUpdate,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_WRITE])),
    service: StoreService = Depends(get_store_service)
):
    """Update a store (admin only)."""
    store = await service.update_store(store_id, data)
    return create_success_response(
        message="Store updated successfully",
        data=store
    )


@router.delete("/admin/{store_id}", response_model=SuccessResponse[dict])
async def delete_store(
    store_id: UUID,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_DELETE])),
    service: StoreService = Depends(get_store_service)
):
    """Delete a store (admin only)."""
    await service.delete_store(store_id)
    return create_success_response(
        message="Store deleted successfully",
        data={"deleted": True}
    )
