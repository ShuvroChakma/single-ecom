"""
API endpoints for Delivery Zones.
Customer can check charges, Admin can manage zones.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions, get_current_verified_user
from app.core.schemas.response import SuccessResponse, create_success_response
from app.constants.permissions import PermissionEnum
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.delivery.service import DeliveryZoneService
from app.modules.delivery.schemas import (
    DeliveryZoneCreate,
    DeliveryZoneUpdate,
    DeliveryZoneResponse,
    DeliveryChargeRequest,
    DeliveryChargeResponse
)


router = APIRouter()


def get_delivery_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> DeliveryZoneService:
    """Get delivery zone service instance."""
    return DeliveryZoneService(session, audit_service)


# ============ CUSTOMER ENDPOINTS ============

@router.get("/charges", response_model=SuccessResponse[DeliveryChargeResponse])
async def calculate_delivery_charge(
    district: str,
    order_amount: float,
    weight_kg: float = 0,
    service: DeliveryZoneService = Depends(get_delivery_service)
):
    """
    Calculate delivery charge for a district.
    
    Public endpoint - no auth required.
    """
    from decimal import Decimal
    
    result = await service.calculate_charge(
        district=district,
        order_amount=Decimal(str(order_amount)),
        total_weight_kg=Decimal(str(weight_kg))
    )
    
    return create_success_response(
        message="Delivery charge calculated",
        data=result
    )


@router.get("/zones", response_model=SuccessResponse[List[DeliveryZoneResponse]])
async def list_active_zones(
    service: DeliveryZoneService = Depends(get_delivery_service)
):
    """
    List active delivery zones.
    
    Public endpoint for customers to see delivery options.
    """
    zones = await service.get_zones(include_inactive=False)
    
    return create_success_response(
        message="Delivery zones retrieved",
        data=[DeliveryZoneResponse.model_validate(z) for z in zones]
    )


# ============ ADMIN ENDPOINTS ============

@router.get("/admin/zones", response_model=SuccessResponse[List[DeliveryZoneResponse]])
async def list_all_zones(
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_READ])),
    service: DeliveryZoneService = Depends(get_delivery_service)
):
    """List all delivery zones (including inactive)."""
    zones = await service.get_zones(include_inactive=True)
    
    return create_success_response(
        message="All delivery zones retrieved",
        data=[DeliveryZoneResponse.model_validate(z) for z in zones]
    )


@router.post("/admin/zones", response_model=SuccessResponse[DeliveryZoneResponse], status_code=201)
async def create_zone(
    data: DeliveryZoneCreate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_WRITE])),
    service: DeliveryZoneService = Depends(get_delivery_service)
):
    """Create a new delivery zone."""
    zone = await service.create_zone(data, str(current_user.id), request)
    
    return create_success_response(
        message="Delivery zone created",
        data=DeliveryZoneResponse.model_validate(zone)
    )


@router.put("/admin/zones/{zone_id}", response_model=SuccessResponse[DeliveryZoneResponse])
async def update_zone(
    zone_id: UUID,
    data: DeliveryZoneUpdate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_WRITE])),
    service: DeliveryZoneService = Depends(get_delivery_service)
):
    """Update a delivery zone."""
    zone = await service.update_zone(zone_id, data, str(current_user.id), request)
    
    return create_success_response(
        message="Delivery zone updated",
        data=DeliveryZoneResponse.model_validate(zone)
    )


@router.delete("/admin/zones/{zone_id}", response_model=SuccessResponse[dict])
async def delete_zone(
    zone_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_DELETE])),
    service: DeliveryZoneService = Depends(get_delivery_service)
):
    """Delete a delivery zone."""
    await service.delete_zone(zone_id, str(current_user.id), request)
    
    return create_success_response(
        message="Delivery zone deleted",
        data={"deleted": True}
    )
