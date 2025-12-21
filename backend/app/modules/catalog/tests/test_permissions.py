import pytest
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.main import app
from app.modules.users.models import User, Admin
from app.modules.roles.models import Role, Permission, RolePermission
from app.constants.enums import UserType
from app.core.permissions import get_current_verified_user, get_current_active_user

async def get_or_create_permission(session: AsyncSession, code: str, description: str, resource: str = None, action: str = None) -> Permission:
    """Helper to get or create a permission."""
    result = await session.execute(select(Permission).where(Permission.code == code))
    perm = result.scalar_one_or_none()
    if not perm:
        perm = Permission(code=code, description=description, resource=resource, action=action)
        session.add(perm)
        await session.flush()
    return perm

@pytest.mark.asyncio
async def test_permission_denied_create(client: AsyncClient, session: AsyncSession):
    """Test POST /admin/categories without categories:write permission."""
    # Setup user with NO permissions
    role = Role(name=f"NO_PERM_{uuid4().hex[:8]}", description="No permissions", is_system=False)
    session.add(role)
    await session.flush()
    
    user = User(
        email=f"noperm_{uuid4().hex[:8]}@test.com", 
        hashed_password="hash", 
        user_type=UserType.ADMIN,
        is_active=True, 
        is_verified=True
    )
    session.add(user)
    await session.flush()
    
    admin = Admin(user_id=user.id, username=f"noperm_{uuid4().hex[:8]}", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    # Override auth
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    # Try to create category without permission
    payload = {"name": "Forbidden", "slug": f"forbidden-{uuid4().hex[:8]}"}
    response = await client.post("/api/v1/catalog/admin/categories", json=payload)
    assert response.status_code == 403  # Permission Denied
    
    app.dependency_overrides = {}

@pytest.mark.asyncio
async def test_permission_denied_delete(client: AsyncClient, session: AsyncSession):
    """Test DELETE /admin/categories/{id} without categories:delete permission."""
    # Get or create categories:write permission
    perm_write = await get_or_create_permission(session, "categories:write", "Categories Write", "categories", "write")
    
    role = Role(name=f"WRITE_ONLY_{uuid4().hex[:8]}", description="Write only", is_system=False)
    session.add(role)
    await session.flush()
    
    role_perm = RolePermission(role_id=role.id, permission_id=perm_write.id)
    session.add(role_perm)
    
    user = User(
        email=f"writeonly_{uuid4().hex[:8]}@test.com", 
        hashed_password="hash", 
        user_type=UserType.ADMIN,
        is_active=True, 
        is_verified=True
    )
    session.add(user)
    await session.flush()
    
    admin = Admin(user_id=user.id, username=f"writeonly_{uuid4().hex[:8]}", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    # Override auth
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    # Create a category (should work with categories:write)
    payload = {"name": "Test", "slug": f"test-{uuid4().hex[:8]}"}
    response = await client.post("/api/v1/catalog/admin/categories", json=payload)
    assert response.status_code == 201
    cat_id = response.json()["data"]["id"]
    
    # Try to delete without categories:delete permission
    response = await client.delete(f"/api/v1/catalog/admin/categories/{cat_id}")
    assert response.status_code == 403  # Permission Denied
    
    app.dependency_overrides = {}

@pytest.mark.asyncio
async def test_full_permissions_granted(client: AsyncClient, session: AsyncSession):
    """Test all CRUD operations with proper permissions."""
    # Get or create both permissions
    perm_write = await get_or_create_permission(session, "categories:write", "Categories Write", "categories", "write")
    perm_delete = await get_or_create_permission(session, "categories:delete", "Categories Delete", "categories", "delete")
    
    role = Role(name=f"CATEGORY_ADMIN_{uuid4().hex[:8]}", description="Category Admin", is_system=False)
    session.add(role)
    await session.flush()
    
    # Link both permissions
    role_perm1 = RolePermission(role_id=role.id, permission_id=perm_write.id)
    role_perm2 = RolePermission(role_id=role.id, permission_id=perm_delete.id)
    session.add_all([role_perm1, role_perm2])
    
    user = User(
        email=f"catadmin_{uuid4().hex[:8]}@test.com", 
        hashed_password="hash", 
        user_type=UserType.ADMIN,
        is_active=True, 
        is_verified=True
    )
    session.add(user)
    await session.flush()
    
    admin = Admin(user_id=user.id, username=f"catadmin_{uuid4().hex[:8]}", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    # Override auth
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    # Create category
    payload = {"name": "Original", "slug": f"original-{uuid4().hex[:8]}"}
    response = await client.post("/api/v1/catalog/admin/categories", json=payload)
    assert response.status_code == 201, response.text
    cat_id = response.json()["data"]["id"]
    
    # Update category (should work with categories:write)
    update_payload = {"name": "Updated", "slug": f"updated-{uuid4().hex[:8]}"}
    response = await client.put(f"/api/v1/catalog/admin/categories/{cat_id}", json=update_payload)
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "Updated"
    
    # Delete category (should work with categories:delete)
    response = await client.delete(f"/api/v1/catalog/admin/categories/{cat_id}")
    assert response.status_code == 200
    
    app.dependency_overrides = {}
