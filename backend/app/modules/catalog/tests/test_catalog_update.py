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
async def test_update_category(client: AsyncClient, session: AsyncSession):
    """Test PUT /admin/categories/{id} endpoint."""
    
    # Get or create categories:write permission
    perm_write = await get_or_create_permission(session, "categories:write", "Categories Write", "categories", "write")
    
    role = Role(name=f"TEST_UPDATE_{uuid4().hex[:8]}", description="Test", is_system=False)
    session.add(role)
    await session.flush()
    
    role_perm = RolePermission(role_id=role.id, permission_id=perm_write.id)
    session.add(role_perm)
    
    user = User(
        email=f"update_{uuid4().hex[:8]}@test.com", 
        hashed_password="hash", 
        user_type=UserType.ADMIN,
        is_active=True, 
        is_verified=True
    )
    session.add(user)
    await session.flush()
    
    admin = Admin(user_id=user.id, username=f"update_{uuid4().hex[:8]}", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    # Override auth
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    # Create category
    unique_slug = f"original-{uuid4().hex[:8]}"
    payload = {"name": "Original Name", "slug": unique_slug}
    response = await client.post("/api/v1/catalog/admin/categories", json=payload)
    assert response.status_code == 201
    cat_id = response.json()["data"]["id"]
    
    # Test 1: Update name and slug
    update_payload = {"name": "Updated Name", "slug": f"updated-{uuid4().hex[:8]}"}
    response = await client.put(f"/api/v1/catalog/admin/categories/{cat_id}", json=update_payload)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["name"] == "Updated Name"
    
    # Test 2: Update icon and banner
    icon_payload = {"icon": "https://example.com/icon.png", "banner": "https://example.com/banner.jpg"}
    response = await client.put(f"/api/v1/catalog/admin/categories/{cat_id}", json=icon_payload)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["icon"] == "https://example.com/icon.png"
    assert data["banner"] == "https://example.com/banner.jpg"
    
    # Test 3: Create child and try to move beyond depth limit
    child_payload = {"name": "Child", "slug": f"child-{uuid4().hex[:8]}", "parent_id": cat_id}
    response = await client.post("/api/v1/catalog/admin/categories", json=child_payload)
    child_id = response.json()["data"]["id"]
    
    grandchild_payload = {"name": "Grandchild", "slug": f"grandchild-{uuid4().hex[:8]}", "parent_id": child_id}
    response = await client.post("/api/v1/catalog/admin/categories", json=grandchild_payload)
    grandchild_id = response.json()["data"]["id"]
    
    # Try adding another child to grandchild (should fail - level 3)
    invalid_payload = {"name": "Invalid", "slug": f"invalid-{uuid4().hex[:8]}", "parent_id": grandchild_id}
    response = await client.post("/api/v1/catalog/admin/categories", json=invalid_payload)
    assert response.status_code == 422  # ValidationError returns 422
    
    # Test 4: Test 404 on non-existent category update
    fake_id = str(uuid4())
    response = await client.put(f"/api/v1/catalog/admin/categories/{fake_id}", json={"name": "Fake"})
    assert response.status_code == 404
    
    app.dependency_overrides = {}
