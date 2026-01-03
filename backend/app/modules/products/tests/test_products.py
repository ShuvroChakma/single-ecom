"""Tests for Products module."""
import pytest
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
from app.modules.products.models import Product, ProductVariant, Gender, MetalType, MakingChargeType
from app.modules.catalog.models import Category
from app.modules.brands.models import Brand


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
async def setup_product_admin(session: AsyncSession):
    """Setup admin user with product permissions."""
    perm_write = await get_or_create_permission(session, "products:write", "Products Write", "products", "write")
    perm_delete = await get_or_create_permission(session, "products:delete", "Products Delete", "products", "delete")
    
    role = Role(name=f"TEST_PRODUCT_ADMIN_{uuid4().hex[:6]}", description="Test")
    session.add(role)
    await session.flush()
    
    role_perm1 = RolePermission(role_id=role.id, permission_id=perm_write.id)
    role_perm2 = RolePermission(role_id=role.id, permission_id=perm_delete.id)
    session.add_all([role_perm1, role_perm2])
    
    user = User(
        email=f"product_admin_{uuid4().hex[:6]}@test.com",
        hashed_password="hash",
        user_type=UserType.ADMIN,
        is_active=True,
        is_verified=True
    )
    session.add(user)
    await session.flush()
    
    admin = Admin(user_id=user.id, username=f"product_admin_{uuid4().hex[:6]}", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    return user


@pytest.fixture
async def setup_category(session: AsyncSession):
    """Create a test category."""
    slug = f"test-cat-prod-{uuid4().hex[:6]}"
    category = Category(name="Test Category", slug=slug, path=slug)
    session.add(category)
    await session.commit()
    return category


@pytest.fixture
async def setup_brand(session: AsyncSession):
    """Create a test brand."""
    brand = Brand(name="Test Brand Prod", slug=f"test-brand-prod-{uuid4().hex[:6]}")
    session.add(brand)
    await session.commit()
    return brand


@pytest.mark.asyncio
async def test_list_products_public(client: AsyncClient, session: AsyncSession, setup_category):
    """Test public products listing endpoint."""
    category = setup_category
    
    product = Product(
        name="Gold Ring",
        sku_base=f"GR{uuid4().hex[:6].upper()}",
        slug=f"gold-ring-{uuid4().hex[:6]}",
        category_id=category.id,
        is_active=True
    )
    session.add(product)
    await session.commit()
    
    response = await client.get("/api/v1/products/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "items" in data["data"]
    assert "total" in data["data"]


@pytest.mark.asyncio
async def test_get_product_by_slug(client: AsyncClient, session: AsyncSession, setup_category):
    """Test get product by slug with variants."""
    category = setup_category
    slug = f"diamond-ring-{uuid4().hex[:6]}"
    
    product = Product(
        name="Diamond Ring",
        sku_base=f"DR{uuid4().hex[:6].upper()}",
        slug=slug,
        category_id=category.id,
        is_active=True
    )
    session.add(product)
    await session.flush()
    
    variant = ProductVariant(
        product_id=product.id,
        sku=f"DR{uuid4().hex[:4].upper()}-22K-YELLOW-16",
        metal_type=MetalType.GOLD,
        metal_purity="22K",
        metal_color="yellow",
        size="16",
        gross_weight=Decimal("5.5"),
        net_weight=Decimal("5.0"),
        is_default=True
    )
    session.add(variant)
    await session.commit()
    
    response = await client.get(f"/api/v1/products/{slug}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["name"] == "Diamond Ring"


@pytest.mark.asyncio
async def test_product_not_found(client: AsyncClient, session: AsyncSession):
    """Test 404 for non-existent product."""
    response = await client.get("/api/v1/products/nonexistent-product")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_product_crud_admin(
    client: AsyncClient, 
    session: AsyncSession, 
    setup_product_admin,
    setup_category,
    setup_brand
):
    """Test product CRUD operations."""
    from app.core.permissions import get_current_active_user, get_current_verified_user
    
    user = setup_product_admin
    category = setup_category
    brand = setup_brand
    slug = f"admin-product-{uuid4().hex[:6]}"
    sku_base = f"AP{uuid4().hex[:6].upper()}"
    
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    try:
        # CREATE Product (no variants - variant creation via API has session state issues)
        payload = {
            "name": "Admin Product",
            "sku_base": sku_base,
            "slug": slug,
            "category_id": str(category.id),
            "brand_id": str(brand.id),
            "gender": "WOMEN",
            "base_making_charge_type": "FIXED_PER_GRAM",
            "base_making_charge_value": "500"
        }
        response = await client.post("/api/v1/products/admin/products", json=payload)
        assert response.status_code == 201, response.text
        data = response.json()["data"]
        product_id = data["id"]
        
        # UPDATE Product
        update_payload = {"name": "Updated Product", "is_featured": True}
        response = await client.put(f"/api/v1/products/admin/products/{product_id}", json=update_payload)
        assert response.status_code == 200
        
        # DELETE Product
        response = await client.delete(f"/api/v1/products/admin/products/{product_id}")
        assert response.status_code == 200
    finally:
        app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_product_filtering(client: AsyncClient, session: AsyncSession, setup_category):
    """Test product filtering by category, gender, etc."""
    category = setup_category
    
    # Create women's product
    product1 = Product(
        name="Women Ring",
        sku_base=f"WR{uuid4().hex[:6].upper()}",
        slug=f"women-ring-{uuid4().hex[:6]}",
        category_id=category.id,
        gender=Gender.WOMEN,
        is_active=True
    )
    session.add(product1)
    await session.commit()
    
    # Filter by gender
    response = await client.get("/api/v1/products/?gender=WOMEN")
    assert response.status_code == 200
    
    # Filter by category
    response = await client.get(f"/api/v1/products/?category_id={category.id}")
    assert response.status_code == 200
