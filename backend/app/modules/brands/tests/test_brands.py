"""Tests for Brands module."""
import pytest
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.modules.users.models import User
from app.modules.roles.models import Role, Permission, RolePermission
from app.modules.users.models import Admin
from app.constants.enums import UserType
from app.modules.brands.models import Brand, Collection


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
async def setup_admin_user(session: AsyncSession):
    """Setup admin user with product permissions."""
    perm_write = await get_or_create_permission(session, "products:write", "Products Write", "products", "write")
    perm_delete = await get_or_create_permission(session, "products:delete", "Products Delete", "products", "delete")
    
    role = Role(name=f"TEST_BRAND_ADMIN_{uuid4().hex[:6]}", description="Test")
    session.add(role)
    await session.flush()
    
    role_perm1 = RolePermission(role_id=role.id, permission_id=perm_write.id)
    role_perm2 = RolePermission(role_id=role.id, permission_id=perm_delete.id)
    session.add_all([role_perm1, role_perm2])
    
    user = User(
        email=f"brand_admin_{uuid4().hex[:6]}@test.com",
        hashed_password="hash",
        user_type=UserType.ADMIN,
        is_active=True,
        is_verified=True
    )
    session.add(user)
    await session.flush()
    
    admin = Admin(user_id=user.id, username=f"brand_admin_{uuid4().hex[:6]}", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    return user


@pytest.mark.asyncio
async def test_list_brands_public(client: AsyncClient, session: AsyncSession):
    """Test public brands listing endpoint."""
    # Create an active brand
    brand = Brand(name="Test Brand", slug=f"test-brand-{uuid4().hex[:6]}", is_active=True)
    session.add(brand)
    await session.commit()
    
    response = await client.get("/api/v1/products/brands")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) >= 1


@pytest.mark.asyncio
async def test_get_brand_by_slug(client: AsyncClient, session: AsyncSession):
    """Test get brand by slug."""
    slug = f"slug-brand-{uuid4().hex[:6]}"
    brand = Brand(name="Slug Brand", slug=slug, is_active=True)
    session.add(brand)
    await session.commit()
    
    response = await client.get(f"/api/v1/products/brands/{slug}")
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["name"] == "Slug Brand"


@pytest.mark.asyncio
async def test_brand_not_found(client: AsyncClient, session: AsyncSession):
    """Test 404 for non-existent brand."""
    response = await client.get("/api/v1/products/brands/nonexistent-slug")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_brand_crud_admin(client: AsyncClient, session: AsyncSession, setup_admin_user):
    """Test brand CRUD operations with admin permissions."""
    from app.core.permissions import get_current_active_user, get_current_verified_user
    
    user = setup_admin_user
    slug = f"admin-brand-{uuid4().hex[:6]}"
    
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    try:
        # CREATE
        payload = {"name": "Admin Brand", "slug": slug, "is_active": True}
        response = await client.post("/api/v1/products/admin/brands", json=payload)
        assert response.status_code == 201, response.text
        brand_id = response.json()["data"]["id"]
        
        # UPDATE
        update_payload = {"name": "Updated Brand"}
        response = await client.put(f"/api/v1/products/admin/brands/{brand_id}", json=update_payload)
        assert response.status_code == 200
        assert response.json()["data"]["name"] == "Updated Brand"
        
        # DELETE
        response = await client.delete(f"/api/v1/products/admin/brands/{brand_id}")
        assert response.status_code == 200
        
        # Verify deleted
        response = await client.get(f"/api/v1/products/brands/{slug}")
        assert response.status_code == 404
    finally:
        app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_duplicate_brand_slug(client: AsyncClient, session: AsyncSession, setup_admin_user):
    """Test duplicate slug returns 422."""
    from app.core.permissions import get_current_active_user, get_current_verified_user
    
    user = setup_admin_user
    slug = f"dup-brand-{uuid4().hex[:6]}"
    
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    try:
        # Create first brand
        payload = {"name": "Dup Brand", "slug": slug}
        response = await client.post("/api/v1/products/admin/brands", json=payload)
        assert response.status_code == 201
        
        # Try to create duplicate
        response = await client.post("/api/v1/products/admin/brands", json=payload)
        assert response.status_code == 422
    finally:
        app.dependency_overrides = {}


# ============ COLLECTION TESTS ============

@pytest.mark.asyncio
async def test_list_collections_public(client: AsyncClient, session: AsyncSession):
    """Test public collections listing endpoint."""
    collection = Collection(name="Test Collection", slug=f"test-collection-{uuid4().hex[:6]}", is_active=True)
    session.add(collection)
    await session.commit()
    
    response = await client.get("/api/v1/products/collections")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_collection_crud_admin(client: AsyncClient, session: AsyncSession, setup_admin_user):
    """Test collection CRUD operations."""
    from app.core.permissions import get_current_active_user, get_current_verified_user
    
    user = setup_admin_user
    slug = f"admin-collection-{uuid4().hex[:6]}"
    
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    try:
        # CREATE
        payload = {"name": "Admin Collection", "slug": slug, "description": "Test desc"}
        response = await client.post("/api/v1/products/admin/collections", json=payload)
        assert response.status_code == 201
        coll_id = response.json()["data"]["id"]
        
        # DELETE
        response = await client.delete(f"/api/v1/products/admin/collections/{coll_id}")
        assert response.status_code == 200
    finally:
        app.dependency_overrides = {}
