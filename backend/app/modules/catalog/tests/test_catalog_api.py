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
MOk_USER_ID = str(uuid4())
mock_admin_user = User(
    id=MOk_USER_ID,
    email="admin@test.com",
    hashed_password="hashed",
    user_type=UserType.ADMIN,
    is_active=True,
    is_verified=True
)

@pytest.fixture
def override_permissions():
    """Mock permission dependency to allow access."""
    async def mock_require_permissions():
        return mock_admin_user
    
    # Override all variants used in endpoints
    app.dependency_overrides[require_permissions(["manage_categories"])] = mock_require_permissions 
    # Note: Dependency overrides match by function object. 
    # 'require_permissions' returns a closure 'permission_checker'.
    # This is tricky to override dynamically.
    # Pattern: Override the *caller* or use a simpler override mechanism if possible.
    # Easier approach: Override 'get_current_active_user' and ensure logic passes? 
    # Or strict override of the exact closure used in endpoint?
    # In 'endpoints.py': current_user: User = Depends(require_permissions(["manage_categories"]))
    # We need to override the result of `require_permissions(["manage_categories"])`
    
    yield
    app.dependency_overrides = {}

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
    from app.modules.roles.models import Role, Permission
    from app.modules.users.models import Admin
    
    # 1. Setup Permissions
    perm = Permission(code="manage_categories", description="Manage Categories")
    session.add(perm)
    
    # 2. Setup Role
    role = Role(name="TEST_ADMIN", description="Test")
    session.add(role)
    await session.commit()
    
    # Link Perm to Role (Many-to-Many - manual association table usually)
    from sqlalchemy import text
    await session.execute(
        text(f"INSERT INTO role_permissions (role_id, permission_id) VALUES ('{role.id}', '{perm.id}')")
    )
    
    # 3. Setup User & Admin
    user = User(
        email="admin_api@test.com", 
        hashed_password="hash", 
        user_type=UserType.ADMIN,
        is_active=True, 
        is_verified=True
    )
    session.add(user)
    await session.commit()
    
    admin = Admin(user_id=user.id, username="admin_api", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    # 4. Override get_current_active_user to return this user
    # The endpoint calls `require_permissions` which calls `get_current_verified_user` -> `get_current_active_user`
    # -> `get_user_permissions` (which hits DB)
    
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
