"""Tests for Attributes module (EAV)."""
import pytest
import random
import string
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.modules.users.models import User
from app.modules.roles.models import Role, Permission, RolePermission
from app.modules.users.models import Admin
from app.constants.enums import UserType
from app.modules.attributes.models import AttributeGroup, Attribute, ProductAttributeValue, AttributeType
from app.modules.catalog.models import Category
from app.modules.products.models import Product


def random_lowercase(length: int = 6) -> str:
    """Generate random lowercase letters only for attribute codes."""
    return ''.join(random.choices(string.ascii_lowercase, k=length))


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
async def setup_attr_admin(session: AsyncSession):
    """Setup admin user with product permissions."""
    perm_write = await get_or_create_permission(session, "products:write", "Products Write", "products", "write")
    perm_delete = await get_or_create_permission(session, "products:delete", "Products Delete", "products", "delete")
    
    role = Role(name=f"TEST_ATTR_ADMIN_{uuid4().hex[:6]}", description="Test")
    session.add(role)
    await session.flush()
    
    session.add(RolePermission(role_id=role.id, permission_id=perm_write.id))
    session.add(RolePermission(role_id=role.id, permission_id=perm_delete.id))
    
    user = User(
        email=f"attr_admin_{uuid4().hex[:6]}@test.com",
        hashed_password="hash",
        user_type=UserType.ADMIN,
        is_active=True,
        is_verified=True
    )
    session.add(user)
    await session.flush()
    
    admin = Admin(user_id=user.id, username=f"attr_admin_{uuid4().hex[:6]}", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    return user


@pytest.fixture
async def setup_product(session: AsyncSession):
    """Create a test product."""
    slug = f"attr-test-cat-{uuid4().hex[:6]}"
    category = Category(name="Attr Test Cat", slug=slug, path=slug)
    session.add(category)
    await session.flush()
    
    product = Product(
        name="Attr Test Product",
        sku_base=f"ATP{uuid4().hex[:6].upper()}",
        slug=f"attr-test-product-{uuid4().hex[:6]}",
        category_id=category.id
    )
    session.add(product)
    await session.commit()
    return product


@pytest.mark.asyncio
async def test_list_attribute_groups_public(client: AsyncClient, session: AsyncSession):
    """Test public attribute groups listing."""
    group = AttributeGroup(name=f"Basic Info {uuid4().hex[:6]}", is_active=True)
    session.add(group)
    await session.commit()
    
    response = await client.get("/api/v1/products/attribute-groups")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_list_filterable_attributes(client: AsyncClient, session: AsyncSession):
    """Test filterable attributes endpoint."""
    group = AttributeGroup(name=f"Filters Group {uuid4().hex[:6]}", is_active=True)
    session.add(group)
    await session.flush()
    
    # Use lowercase letters only for attribute code
    attr = Attribute(
        group_id=group.id,
        code=f"product_type_{random_lowercase(6)}",
        name="Product Type",
        type=AttributeType.SELECT,
        options=["ring", "necklace", "earring"],
        is_filterable=True,
        is_active=True
    )
    session.add(attr)
    await session.commit()
    
    response = await client.get("/api/v1/products/attributes/filterable")
    assert response.status_code == 200
    data = response.json()["data"]
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_attribute_group_crud(client: AsyncClient, session: AsyncSession, setup_attr_admin):
    """Test attribute group CRUD operations."""
    from app.core.permissions import get_current_active_user, get_current_verified_user
    
    user = setup_attr_admin
    
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    try:
        # CREATE Group
        payload = {"name": f"Metal Details {uuid4().hex[:6]}", "sort_order": 1}
        response = await client.post("/api/v1/products/admin/attribute-groups", json=payload)
        assert response.status_code == 201
        group_id = response.json()["data"]["id"]
        
        # CREATE Attribute (use lowercase letters only for code)
        attr_payload = {
            "group_id": group_id,
            "code": f"metal_finish_{random_lowercase(6)}",
            "name": "Metal Finish",
            "type": "SELECT",
            "options": ["polished", "matte", "brushed"],
            "is_filterable": True
        }
        response = await client.post("/api/v1/products/admin/attributes", json=attr_payload)
        assert response.status_code == 201, response.text
        attr_id = response.json()["data"]["id"]
        
        # DELETE Attribute
        response = await client.delete(f"/api/v1/products/admin/attributes/{attr_id}")
        assert response.status_code == 200
        
        # DELETE Group
        response = await client.delete(f"/api/v1/products/admin/attribute-groups/{group_id}")
        assert response.status_code == 200
    finally:
        app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_product_attribute_values(
    client: AsyncClient, 
    session: AsyncSession, 
    setup_attr_admin,
    setup_product
):
    """Test setting and getting product attribute values."""
    from app.core.permissions import get_current_active_user, get_current_verified_user
    
    user = setup_attr_admin
    product = setup_product
    
    # Create attribute (lowercase code)
    group = AttributeGroup(name=f"Product Attr Group {uuid4().hex[:6]}", is_active=True)
    session.add(group)
    await session.flush()
    
    attr = Attribute(
        group_id=group.id,
        code=f"test_attr_{random_lowercase(6)}",
        name="Test Attribute",
        type=AttributeType.TEXT,
        is_active=True
    )
    session.add(attr)
    await session.commit()
    
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    try:
        # SET attribute value
        payload = {"attribute_id": str(attr.id), "value": "Test Value"}
        response = await client.post(
            f"/api/v1/products/admin/products/{product.id}/attributes", 
            json=payload
        )
        assert response.status_code == 201, response.text
        
        # GET product attributes (correct path)
        response = await client.get(f"/api/v1/products/products/{product.id}/attributes")
        assert response.status_code == 200
        data = response.json()["data"]
        assert len(data) >= 1
        
        # DELETE attribute value
        response = await client.delete(
            f"/api/v1/products/admin/products/{product.id}/attributes/{attr.id}"
        )
        assert response.status_code == 200
    finally:
        app.dependency_overrides = {}
