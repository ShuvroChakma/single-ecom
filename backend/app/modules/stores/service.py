"""
Store business logic service.
"""
from uuid import UUID
from typing import Optional, List
from decimal import Decimal
from math import radians, cos, sin, asin, sqrt
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.constants.error_codes import ErrorCode
from app.modules.stores.models import Store
from app.modules.stores.schemas import (
    StoreCreate,
    StoreUpdate,
    StoreResponse,
    StoreListResponse
)


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on earth (in km).
    """
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r


class StoreService:
    """Service for store operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_stores(
        self,
        city: Optional[str] = None,
        active_only: bool = True
    ) -> List[StoreResponse]:
        """Get all stores, optionally filtered by city."""
        stmt = select(Store)

        if active_only:
            stmt = stmt.where(Store.is_active == True)

        if city:
            stmt = stmt.where(func.lower(Store.city) == city.lower())

        stmt = stmt.order_by(Store.name)
        result = await self.session.execute(stmt)
        stores = result.scalars().all()

        return [StoreResponse.model_validate(store) for store in stores]

    async def get_store(self, store_id: UUID) -> StoreResponse:
        """Get store by ID."""
        store = await self.session.get(Store, store_id)
        if not store:
            raise NotFoundError(
                error_code=ErrorCode.ITEM_NOT_FOUND,
                message="Store not found"
            )
        return StoreResponse.model_validate(store)

    async def find_nearby_stores(
        self,
        lat: float,
        lng: float,
        radius_km: float = 50,
        limit: int = 10
    ) -> List[StoreResponse]:
        """Find stores within a radius of the given coordinates."""
        # Get all active stores
        stmt = select(Store).where(Store.is_active == True)
        result = await self.session.execute(stmt)
        stores = result.scalars().all()

        # Calculate distances and filter
        nearby = []
        for store in stores:
            distance = haversine(
                lat, lng,
                float(store.latitude), float(store.longitude)
            )
            if distance <= radius_km:
                nearby.append((distance, store))

        # Sort by distance and limit
        nearby.sort(key=lambda x: x[0])
        nearby = nearby[:limit]

        return [StoreResponse.model_validate(store) for _, store in nearby]

    async def create_store(self, data: StoreCreate) -> StoreResponse:
        """Create a new store."""
        store = Store(**data.model_dump())
        self.session.add(store)
        await self.session.commit()
        await self.session.refresh(store)
        return StoreResponse.model_validate(store)

    async def update_store(self, store_id: UUID, data: StoreUpdate) -> StoreResponse:
        """Update a store."""
        store = await self.session.get(Store, store_id)
        if not store:
            raise NotFoundError(
                error_code=ErrorCode.ITEM_NOT_FOUND,
                message="Store not found"
            )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(store, key, value)

        await self.session.commit()
        await self.session.refresh(store)
        return StoreResponse.model_validate(store)

    async def delete_store(self, store_id: UUID) -> bool:
        """Delete a store."""
        store = await self.session.get(Store, store_id)
        if not store:
            raise NotFoundError(
                error_code=ErrorCode.ITEM_NOT_FOUND,
                message="Store not found"
            )

        await self.session.delete(store)
        await self.session.commit()
        return True
