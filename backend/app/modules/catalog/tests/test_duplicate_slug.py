import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.main import app
from app.modules.users.models import User, Admin
from app.modules.roles.models import Role, Permission, RolePermission
from app.constants.enums import UserType
from app.core.permissions import get_current_verified_user, get_current_active_user
from uuid import uuid4

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
async def test_duplicate_slug_error(client: AsyncClient, session: AsyncSession):
    """Test that duplicate slug returns proper error message."""
    # Setup permission and user
    perm_write = await get_or_create_permission(session, "categories:write", "Categories Write", "categories", "write")
    
    role = Role(name=f"TEST_DUP_{uuid4().hex[:8]}", description="Test", is_system=False)
    session.add(role)
    await session.flush()
    
    role_perm = RolePermission(role_id=role.id, permission_id=perm_write.id)
    session.add(role_perm)
    
    user = User(
        email=f"test_{uuid4().hex[:8]}@test.com", 
        hashed_password="hash", 
        user_type=UserType.ADMIN,
        is_active=True, 
        is_verified=True
    )
    session.add(user)
    await session.flush()
    
    admin = Admin(user_id=user.id, username=f"test_{uuid4().hex[:8]}", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    # Override auth
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    # Create first category
    payload = {"name": "First Category", "slug": "unique-test-slug"}
    response = await client.post("/api/v1/catalog/admin/categories", json=payload)
    assert response.status_code == 201
    
    # Try to create second category with same slug
    payload2 = {"name": "Second Category", "slug": "unique-test-slug"}
    response = await client.post("/api/v1/catalog/admin/categories", json=payload2)
    
    # Should return 422 with proper error message
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VAL_001"
    assert "errors" in data
    assert len(data["errors"]) == 1
    assert data["errors"][0]["code"] == "CAT_003"
    assert "already exists" in data["errors"][0]["message"].lower()
    assert data["errors"][0]["field"] == "slug"
    
    app.dependency_overrides = {}
