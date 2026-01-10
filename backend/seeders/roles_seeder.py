"""
Roles Seeder - Seeds default system roles.
"""
from sqlmodel import select
from seeders.base import BaseSeeder
from app.modules.roles.models import Role, Permission, RolePermission


class RolesSeeder(BaseSeeder):
    """Seed default system roles."""
    
    order = 20  # After permissions
    
    DEFAULT_ROLES = [
        {
            "name": "SUPER_ADMIN",
            "description": "Super Administrator with all permissions",
            "is_system": True,
            "permissions": ["*"]  # All permissions
        },
        {
            "name": "ADMIN",
            "description": "Administrator",
            "is_system": True,
            "permissions": [
                "users:read", "users:write",
                "roles:read",
                "permissions:read",
                "audit_logs:read",
                "oauth_providers:read",
                "slides:read", "slides:write", "slides:delete",
                "brands:read", "brands:write", "brands:delete",
                "collections:read", "collections:write", "collections:delete",
                "metals:read", "metals:write", "metals:delete",
                "attributes:read", "attributes:write", "attributes:delete",
                "rates:read", "rates:write",
            ]
        },
        {
            "name": "MODERATOR",
            "description": "Moderator with limited admin access",
            "is_system": True,
            "permissions": [
                "users:read",
                "audit_logs:read",
            ]
        }
    ]
    
    async def should_run(self) -> bool:
        """Check if roles need to be seeded."""
        # Always run to ensure permissions are up to date for SUPER_ADMIN
        return True
    
    async def run(self) -> None:
        """Create default roles with permissions."""
        # Get all permissions
        result = await self.session.execute(select(Permission))
        all_permissions = {p.code: p for p in result.scalars().all()}
        
        for role_data in self.DEFAULT_ROLES:
            # Check if role exists
            result = await self.session.execute(
                select(Role).where(Role.name == role_data["name"])
            )
            role = result.scalars().first()
            
            if not role:
                # Create role
                role = Role(
                    name=role_data["name"],
                    description=role_data["description"],
                    is_system=role_data["is_system"]
                )
                self.session.add(role)
                await self.session.flush()  # Get role.id
            
            # For SUPER_ADMIN, ensure all permissions are assigned
            if role_data["permissions"] == ["*"]:
                # Get existing permissions for role
                result = await self.session.execute(
                    select(RolePermission).where(RolePermission.role_id == role.id)
                )
                existing_role_perms = {rp.permission_id for rp in result.scalars().all()}
                
                # Add missing permissions
                for permission in all_permissions.values():
                    if permission.id not in existing_role_perms:
                        role_perm = RolePermission(role_id=role.id, permission_id=permission.id)
                        self.session.add(role_perm)
                        
            # For other roles, we skip updating for now to preserve manual changes
            # (unless strictly enforcing seed state is desired, but let's be safe)
        
        await self.session.commit()
        print(f"  ✅ Seeded/Updated {len(self.DEFAULT_ROLES)} roles")

