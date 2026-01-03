"""
Metals Seeder - Seeds default metals and purities.
"""
from decimal import Decimal
from sqlmodel import select
from seeders.base import BaseSeeder
from app.modules.metals.models import Metal, Purity


class MetalsSeeder(BaseSeeder):
    """Seed default metals and purities."""
    
    order = 30
    
    METALS_DATA = [
        {
            "name": "Gold",
            "code": "GOLD",
            "purities": [
                {"name": "24K", "code": "24K", "fineness": "0.999"},
                {"name": "22K", "code": "22K", "fineness": "0.916"},
                {"name": "21K", "code": "21K", "fineness": "0.875"},
                {"name": "18K", "code": "18K", "fineness": "0.750"},
                {"name": "14K", "code": "14K", "fineness": "0.585"},
            ]
        },
        {
            "name": "Silver",
            "code": "SILVER",
            "purities": [
                {"name": "999 Fine", "code": "999", "fineness": "0.999"},
                {"name": "Sterling 925", "code": "925", "fineness": "0.925"},
            ]
        },
        {
            "name": "Platinum",
            "code": "PLATINUM",
            "purities": [
                {"name": "950", "code": "950", "fineness": "0.950"},
            ]
        }
    ]
    
    async def should_run(self) -> bool:
        """Run if no metals exist."""
        result = await self.session.execute(select(Metal))
        return result.first() is None
    
    async def run(self) -> None:
        """Seed metals and purities."""
        for metal_data in self.METALS_DATA:
            # Create Metal
            metal = Metal(
                name=metal_data["name"],
                code=metal_data["code"],
                sort_order=0
            )
            self.session.add(metal)
            await self.session.flush()
            
            # Create Purities
            for i, purity_data in enumerate(metal_data["purities"]):
                purity = Purity(
                    metal_id=metal.id,
                    name=purity_data["name"],
                    code=purity_data["code"],
                    fineness=Decimal(purity_data["fineness"]),
                    sort_order=i
                )
                self.session.add(purity)
        
        await self.session.commit()
        print(f"  ✅ Seeded {len(self.METALS_DATA)} metals with purities")
