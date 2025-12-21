import pytest
from uuid import uuid4
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.modules.users.models import User
from app.constants.enums import UserType
from app.core.permissions import require_permissions, get_current_active_user

# Mock User
MOCK_USER_ID = str(uuid4())
mock_admin_user = User(
    id=MOCK_USER_ID,
    email="admin@test.com",
    hashed_password="hashed",
    user_type=UserType.ADMIN,
    is_active=True,
    is_verified=True
)

@pytest.mark.asyncio
async def test_get_tree(client: AsyncClient, session: AsyncSession):
    """Test public tree endpoint."""
    response = await client.get("/api/v1/catalog/categories/tree")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_api_flow_real_db(client: AsyncClient, session: AsyncSession):
    """
    Test flow using real DB records to satisfy permissions.
    1. Create Role + Permissions
    2. Create Admin User
    3. Login / Get Token (Or override get_current_user)
    4. Call Endpoints
    """
    from app.modules.roles.models import Role, Permission, RolePermission
    from app.modules.users.models import Admin
    
    # 1. Setup Permissions (use new granular permissions)
    perm_write = Permission(code="categories:write", description="Categories Write", resource="categories", action="write")
    perm_delete = Permission(code="categories:delete", description="Categories Delete", resource="categories", action="delete")
    session.add_all([perm_write, perm_delete])
    await session.flush()
    
    # 2. Setup Role
    role = Role(name="TEST_ADMIN", description="Test")
    session.add(role)
    await session.flush()
    
    # Link Perms to Role
    role_perm1 = RolePermission(role_id=role.id, permission_id=perm_write.id)
    role_perm2 = RolePermission(role_id=role.id, permission_id=perm_delete.id)
    session.add_all([role_perm1, role_perm2])
    
    # 3. Setup User & Admin
    user = User(
        email="admin_api@test.com", 
        hashed_password="hash", 
        user_type=UserType.ADMIN,
        is_active=True, 
        is_verified=True
    )
    session.add(user)
    await session.flush()
    
    admin = Admin(user_id=user.id, username="admin_api", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    # 4. Override get_current_active_user to return this user
    async def mock_get_user():
        return user
        
    from app.core.permissions import get_current_verified_user, get_current_active_user
    # Override base user fetchers
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    # --- TEST CREATE ---
    payload = {
        "name": "API Root",
        "slug": "api-root"
    }
    response = await client.post("/api/v1/catalog/admin/categories", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()
    cat_id = data["data"]["id"]
    assert data["data"]["name"] == "API Root"
    
    # --- TEST TREE ---
    response = await client.get("/api/v1/catalog/categories/tree")
    assert response.status_code == 200
    tree = response.json()["data"]
    assert len(tree) >= 1
    assert any(c["id"] == cat_id for c in tree)
    
    # --- TEST DELETE ---
    response = await client.delete(f"/api/v1/catalog/admin/categories/{cat_id}")
    assert response.status_code == 200
    
    # Verify Gone
    response = await client.get(f"/api/v1/catalog/categories/tree")
    tree = response.json()["data"]
    assert not any(c["id"] == cat_id for c in tree)
    
    app.dependency_overrides = {}
