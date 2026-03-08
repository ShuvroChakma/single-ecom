"""
Delivery Zones Seeder - Seeds default delivery zones for Bangladesh.
"""
from decimal import Decimal
from sqlmodel import select
from seeders.base import BaseSeeder
from app.modules.delivery.models import DeliveryZone, ChargeType


# All districts of Dhaka division (inside Dhaka metro + surrounding districts)
DHAKA_DISTRICTS = [
    "Dhaka",
    "Gazipur",
    "Narayanganj",
    "Manikganj",
    "Munshiganj",
    "Narsingdi",
    "Tangail",
    "Kishoreganj",
    "Netrokona",
    "Faridpur",
    "Gopalganj",
    "Madaripur",
    "Rajbari",
    "Shariatpur",
]

DEFAULT_ZONES = [
    {
        "name": "Inside Dhaka",
        "districts": DHAKA_DISTRICTS,
        "charge_type": ChargeType.FIXED,
        "base_charge": Decimal("60"),
        "per_kg_charge": None,
        "free_above": Decimal("2000"),
        "min_days": 1,
        "max_days": 2,
        "display_order": 1,
    },
    {
        "name": "Outside Dhaka",
        "districts": ["*"],  # catch-all for all other districts
        "charge_type": ChargeType.FIXED,
        "base_charge": Decimal("120"),
        "per_kg_charge": None,
        "free_above": Decimal("5000"),
        "min_days": 3,
        "max_days": 5,
        "display_order": 2,
    },
]


class DeliveryZonesSeeder(BaseSeeder):
    """Seed default delivery zones."""

    order = 60

    async def should_run(self) -> bool:
        """Run if delivery_zones table is empty."""
        result = await self.session.execute(select(DeliveryZone))
        return result.first() is None

    async def run(self) -> None:
        """Seed default delivery zones."""
        for zone_data in DEFAULT_ZONES:
            zone = DeliveryZone(**zone_data)
            self.session.add(zone)

        await self.session.commit()
        print(f"  ✅ Seeded {len(DEFAULT_ZONES)} delivery zones")
