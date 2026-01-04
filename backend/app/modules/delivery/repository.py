"""
Repository layer for Delivery Zone database operations.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.delivery.models import DeliveryZone


class DeliveryZoneRepository:
    """Repository for DeliveryZone operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, zone_id: UUID) -> Optional[DeliveryZone]:
        """Get zone by ID."""
        query = select(DeliveryZone).where(DeliveryZone.id == zone_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all(self, include_inactive: bool = False) -> List[DeliveryZone]:
        """Get all delivery zones."""
        query = select(DeliveryZone).order_by(DeliveryZone.display_order)
        
        if not include_inactive:
            query = query.where(DeliveryZone.is_active == True)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def get_by_district(self, district: str) -> Optional[DeliveryZone]:
        """
        Get zone that covers a district.
        
        First tries exact match, then looks for catch-all zone (*).
        """
        # Get all active zones
        zones = await self.get_all(include_inactive=False)
        
        # First pass: look for exact district match
        for zone in zones:
            if district in zone.districts:
                return zone
        
        # Second pass: look for catch-all zone
        for zone in zones:
            if "*" in zone.districts:
                return zone
        
        return None
    
    async def create(self, zone: DeliveryZone) -> DeliveryZone:
        """Create a new zone."""
        self.session.add(zone)
        await self.session.commit()
        await self.session.refresh(zone)
        return zone
    
    async def update(self, zone: DeliveryZone) -> DeliveryZone:
        """Update a zone."""
        zone.updated_at = datetime.utcnow()
        self.session.add(zone)
        await self.session.commit()
        await self.session.refresh(zone)
        return zone
    
    async def delete(self, zone: DeliveryZone) -> None:
        """Delete a zone."""
        await self.session.delete(zone)
        await self.session.commit()
