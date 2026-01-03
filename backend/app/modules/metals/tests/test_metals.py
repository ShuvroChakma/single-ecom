"""Tests for Metals module."""
import pytest
import random
import string
from uuid import uuid4
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.modules.users.models import User
from app.modules.roles.models import Role, Permission, RolePermission
from app.modules.users.models import Admin
from app.constants.enums import UserType
from app.modules.metals.models import Metal, Purity


def random_letters(length: int = 6) -> str:
    """Generate random uppercase letters only."""
    return ''.join(random.choices(string.ascii_uppercase, k=length))


async def get_or_create_permission(session: AsyncSession, code: str, description: str, resource: str, action: str) -> Permission:
    """Get existing permission or create new one."""
    result = await session.execute(select(Permission).where(Permission.code == code))
    perm = result.scalar_one_or_none()
    if perm:
        return perm
    perm = Permission(code=code, description=description, resource=resource, action=action)
    session.add(perm)
    await session.flush()
    return perm


@pytest.fixture
async def setup_metal_admin(session: AsyncSession):
    """Setup admin user with product permissions."""
    perm_write = await get_or_create_permission(session, "products:write", "Products Write", "products", "write")
    perm_delete = await get_or_create_permission(session, "products:delete", "Products Delete", "products", "delete")
    
    role = Role(name=f"TEST_METAL_ADMIN_{uuid4().hex[:6]}", description="Test")
    session.add(role)
    await session.flush()
    
    role_perm1 = RolePermission(role_id=role.id, permission_id=perm_write.id)
    role_perm2 = RolePermission(role_id=role.id, permission_id=perm_delete.id)
    session.add_all([role_perm1, role_perm2])
    
    user = User(
        email=f"metal_admin_{uuid4().hex[:6]}@test.com",
        hashed_password="hash",
        user_type=UserType.ADMIN,
        is_active=True,
        is_verified=True
    )
    session.add(user)
    await session.flush()
    
    admin = Admin(user_id=user.id, username=f"metal_admin_{uuid4().hex[:6]}", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    return user


@pytest.mark.asyncio
async def test_list_metals_public(client: AsyncClient, session: AsyncSession):
    """Test public metals listing endpoint."""
    code = f"GOLD_{random_letters(6)}"
    metal = Metal(name="Gold", code=code, is_active=True)
    session.add(metal)
    await session.commit()
    
    response = await client.get("/api/v1/products/metals")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_metal_with_purities(client: AsyncClient, session: AsyncSession):
    """Test metal with nested purities."""
    code = f"GOLD_TEST_{random_letters(4)}"
    metal = Metal(name="Gold Test", code=code, is_active=True)
    session.add(metal)
    await session.flush()
    
    purity_code = f"K22{random_letters(3)}"
    purity22k = Purity(
        name="22 Karat", 
        code=purity_code, 
        fineness=Decimal("0.916"),
        metal_id=metal.id,
        is_active=True
    )
    session.add(purity22k)
    await session.commit()
    
    response = await client.get(f"/api/v1/products/metals/{metal.id}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["name"] == "Gold Test"
    assert len(data["purities"]) >= 1


@pytest.mark.asyncio
async def test_metal_crud_admin(client: AsyncClient, session: AsyncSession, setup_metal_admin):
    """Test metal CRUD operations."""
    from app.core.permissions import get_current_active_user, get_current_verified_user
    
    user = setup_metal_admin
    code = f"SILVER_{random_letters(4)}"
    
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    try:
        # CREATE Metal
        payload = {"name": "Silver", "code": code, "sort_order": 2}
        response = await client.post("/api/v1/products/admin/metals", json=payload)
        assert response.status_code == 201, response.text
        metal_id = response.json()["data"]["id"]
        
        # CREATE Purity (purity allows A-Z0-9)
        purity_code = f"S925{random_letters(2)}"
        purity_payload = {
            "metal_id": metal_id,
            "name": "Sterling Silver",
            "code": purity_code,
            "fineness": "0.925"
        }
        response = await client.post("/api/v1/products/admin/purities", json=purity_payload)
        assert response.status_code == 201
        purity_id = response.json()["data"]["id"]
        
        # UPDATE Purity
        update_payload = {"name": "Sterling 925"}
        response = await client.put(f"/api/v1/products/admin/purities/{purity_id}", json=update_payload)
        assert response.status_code == 200
        
        # DELETE Purity
        response = await client.delete(f"/api/v1/products/admin/purities/{purity_id}")
        assert response.status_code == 200
        
        # DELETE Metal
        response = await client.delete(f"/api/v1/products/admin/metals/{metal_id}")
        assert response.status_code == 200
    finally:
        app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_duplicate_metal_code(client: AsyncClient, session: AsyncSession, setup_metal_admin):
    """Test duplicate metal code returns 422."""
    from app.core.permissions import get_current_active_user, get_current_verified_user
    
    user = setup_metal_admin
    code = f"PLAT_{random_letters(4)}"
    
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    try:
        # Create first
        payload = {"name": "Platinum", "code": code}
        response = await client.post("/api/v1/products/admin/metals", json=payload)
        assert response.status_code == 201
        
        # Duplicate
        response = await client.post("/api/v1/products/admin/metals", json=payload)
        assert response.status_code == 422
    finally:
        app.dependency_overrides = {}
