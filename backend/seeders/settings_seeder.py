"""
Settings Seeder - Seeds default site settings.
"""
from sqlmodel import select
from seeders.base import BaseSeeder
from app.modules.settings.models import Setting, SettingCategory, DEFAULT_SETTINGS


class SettingsSeeder(BaseSeeder):
    """Seed default site settings."""

    order = 50

    async def should_run(self) -> bool:
        """Run if settings table is empty."""
        result = await self.session.execute(select(Setting))
        return result.first() is None

    async def run(self) -> None:
        """Seed default settings."""
        count = 0
        for item in DEFAULT_SETTINGS:
            setting = Setting(
                key=item["key"],
                value=item.get("value"),
                category=SettingCategory(item["category"]),
                description=item.get("description"),
                is_public=item.get("is_public", True),
                is_sensitive=item.get("is_sensitive", False),
            )
            self.session.add(setting)
            count += 1

        await self.session.commit()
        print(f"  ✅ Seeded {count} default settings")
