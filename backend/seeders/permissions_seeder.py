"""
Permissions Seeder - Seeds all system permissions from PermissionEnum.
"""
from sqlmodel import select
from seeders.base import BaseSeeder
from app.modules.roles.models import Permission
from app.constants import PermissionEnum


class PermissionsSeeder(BaseSeeder):
    """Seed system permissions from PermissionEnum."""
    
    order = 10  # Run first
    
    async def should_run(self) -> bool:
        """Always run to check for new permissions."""
        return True
    
    async def run(self) -> None:
        """Create permissions that don't exist yet."""
        new_count = 0
        existing_count = 0
        
        for perm_enum in PermissionEnum:
            # Check if permission already exists
            result = await self.session.execute(
                select(Permission).where(Permission.code == perm_enum.value)
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                existing_count += 1
                continue
            
            # Create new permission
            # Parse resource and action from code (e.g., "users:read" -> resource="users", action="read")
            code_parts = perm_enum.value.split(":")
            resource = code_parts[0] if len(code_parts) > 1 else None
            action = code_parts[1] if len(code_parts) > 1 else None
            
            # Generate description from enum name (e.g., USERS_READ -> "Users Read")
            description = perm_enum.name.replace("_", " ").title()
            
            permission = Permission(
                code=perm_enum.value,
                description=description,
                resource=resource,
                action=action
            )
            self.session.add(permission)
            new_count += 1
        
        await self.session.commit()
        
        if new_count > 0:
            print(f"  ✅ Added {new_count} new permissions ({existing_count} already existed)")
        else:
            print(f"  ✅ All {existing_count} permissions already exist")
