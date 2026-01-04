"""
Service layer for Delivery Zone business logic.
"""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from app.core.exceptions import NotFoundError, ValidationError
from app.constants.error_codes import ErrorCode
from app.modules.delivery.models import DeliveryZone, ChargeType
from app.modules.delivery.repository import DeliveryZoneRepository
from app.modules.delivery.schemas import (
    DeliveryZoneCreate,
    DeliveryZoneUpdate,
    DeliveryChargeRequest,
    DeliveryChargeResponse
)
from app.modules.audit.service import AuditService


class DeliveryZoneService:
    """Service for delivery zone operations."""
    
    def __init__(self, session: AsyncSession, audit_service: Optional[AuditService] = None):
        self.session = session
        self.repo = DeliveryZoneRepository(session)
        self.audit_service = audit_service
    
    async def get_zones(self, include_inactive: bool = False) -> List[DeliveryZone]:
        """Get all delivery zones."""
        return await self.repo.get_all(include_inactive=include_inactive)
    
    async def get_zone(self, zone_id: UUID) -> DeliveryZone:
        """Get a specific zone."""
        zone = await self.repo.get_by_id(zone_id)
        if not zone:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Delivery zone not found"
            )
        return zone
    
    async def create_zone(
        self,
        data: DeliveryZoneCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> DeliveryZone:
        """Create a new delivery zone."""
        zone = DeliveryZone(**data.model_dump())
        zone = await self.repo.create(zone)
        
        # Audit log
        if self.audit_service:
            await self.audit_service.log_action(
                action="create_delivery_zone",
                actor_id=actor_id,
                target_id=str(zone.id),
                target_type="delivery_zone",
                details={"name": zone.name, "districts": zone.districts},
                request=request
            )
        
        return zone
    
    async def update_zone(
        self,
        zone_id: UUID,
        data: DeliveryZoneUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> DeliveryZone:
        """Update a delivery zone."""
        zone = await self.get_zone(zone_id)
        
        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(zone, field, value)
        
        zone = await self.repo.update(zone)
        
        # Audit log
        if self.audit_service:
            await self.audit_service.log_action(
                action="update_delivery_zone",
                actor_id=actor_id,
                target_id=str(zone.id),
                target_type="delivery_zone",
                details={"updated_fields": list(update_data.keys())},
                request=request
            )
        
        return zone
    
    async def delete_zone(
        self,
        zone_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> bool:
        """Delete a delivery zone."""
        zone = await self.get_zone(zone_id)
        zone_name = zone.name
        
        await self.repo.delete(zone)
        
        # Audit log
        if self.audit_service:
            await self.audit_service.log_action(
                action="delete_delivery_zone",
                actor_id=actor_id,
                target_id=str(zone_id),
                target_type="delivery_zone",
                details={"name": zone_name},
                request=request
            )
        
        return True
    
    async def calculate_charge(
        self,
        district: str,
        order_amount: Decimal,
        total_weight_kg: Decimal = Decimal("0")
    ) -> DeliveryChargeResponse:
        """
        Calculate delivery charge for a given district and order.
        
        Logic:
        1. Find zone for district
        2. Check if free delivery applies (order_amount >= free_above)
        3. Calculate charge based on charge_type
        """
        # Find zone
        zone = await self.repo.get_by_district(district)
        
        if not zone:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message=f"No delivery zone found for district: {district}"
            )
        
        # Check free delivery
        is_free = False
        if zone.free_above and order_amount >= zone.free_above:
            is_free = True
        
        # Calculate charge
        base_charge = zone.base_charge
        weight_charge = Decimal("0")
        
        if zone.charge_type == ChargeType.WEIGHT_BASED and zone.per_kg_charge:
            weight_charge = total_weight_kg * zone.per_kg_charge
        
        total_charge = Decimal("0") if is_free else (base_charge + weight_charge)
        
        # Estimated days
        estimated_days = f"{zone.min_days}-{zone.max_days} days"
        if zone.min_days == zone.max_days:
            estimated_days = f"{zone.min_days} day" if zone.min_days == 1 else f"{zone.min_days} days"
        
        return DeliveryChargeResponse(
            zone_name=zone.name,
            charge_type=zone.charge_type,
            base_charge=base_charge,
            weight_charge=round(weight_charge, 2),
            total_charge=round(total_charge, 2),
            is_free=is_free,
            free_above=zone.free_above,
            estimated_days=estimated_days
        )
