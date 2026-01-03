"""Tests for Rates module (Daily Rates & Pricing)."""
import pytest
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.main import app
from app.modules.users.models import User
from app.modules.roles.models import Role, Permission, RolePermission
from app.modules.users.models import Admin
from app.constants.enums import UserType
from app.modules.rates.models import DailyRate, RateSource
from app.modules.catalog.models import Category
from app.modules.products.models import Product, ProductVariant, MetalType, MakingChargeType


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
async def setup_rate_admin(session: AsyncSession):
    """Setup admin user with rates permissions."""
    perm_write = await get_or_create_permission(session, "rates:write", "Rates Write", "rates", "write")
    # Rates typically don't have delete endpoint in current implementation, but adding for completeness if needed
    
    role = Role(name=f"TEST_RATE_ADMIN_{uuid4().hex[:6]}", description="Test")
    session.add(role)
    await session.flush()
    
    session.add(RolePermission(role_id=role.id, permission_id=perm_write.id))
    
    user = User(
        email=f"rate_admin_{uuid4().hex[:6]}@test.com",
        hashed_password="hash",
        user_type=UserType.ADMIN,
        is_active=True,
        is_verified=True
    )
    session.add(user)
    await session.flush()
    
    admin = Admin(user_id=user.id, username=f"rate_admin_{uuid4().hex[:6]}", role_id=role.id)
    session.add(admin)
    await session.commit()
    
    return user


@pytest.fixture
async def setup_product_with_variant(session: AsyncSession):
    """Create a product with variant for price calculation."""
    slug = f"rate-test-cat-{uuid4().hex[:6]}"
    category = Category(name="Rate Test Cat", slug=slug, path=slug)
    session.add(category)
    await session.flush()
    
    product = Product(
        name="Rate Test Product",
        sku_base=f"RTP{uuid4().hex[:6].upper()}",
        slug=f"rate-test-product-{uuid4().hex[:6]}",
        category_id=category.id,
        base_making_charge_type=MakingChargeType.FIXED_PER_GRAM,
        base_making_charge_value=Decimal("500")
    )
    session.add(product)
    await session.flush()
    
    variant = ProductVariant(
        product_id=product.id,
        sku=f"RTP{uuid4().hex[:4].upper()}-22K-YELLOW",
        metal_type=MetalType.GOLD,
        metal_purity="22K",
        metal_color="yellow",
        gross_weight=Decimal("10"),
        net_weight=Decimal("9.5"),
        is_default=True
    )
    session.add(variant)
    await session.commit()
    
    return product, variant


@pytest.mark.asyncio
async def test_get_current_rates(client: AsyncClient, session: AsyncSession):
    """Test getting current rates."""
    rate = DailyRate(
        metal_type=f"GOLD_{uuid4().hex[:4].upper()}",
        purity="22K",
        rate_per_gram=Decimal("7500"),
        source=RateSource.MANUAL,
        effective_date=datetime.utcnow()
    )
    session.add(rate)
    await session.commit()
    
    response = await client.get("/api/v1/products/rates/current")
    assert response.status_code == 200
    data = response.json()["data"]
    assert "rates" in data
    assert "last_updated" in data


@pytest.mark.asyncio
async def test_get_rate_history(client: AsyncClient, session: AsyncSession):
    """Test getting rate history."""
    metal_type = f"GOLD_{uuid4().hex[:4].upper()}"
    
    # Create historical rates
    for i in range(5):
        rate = DailyRate(
            metal_type=metal_type,
            purity="22K",
            rate_per_gram=Decimal(f"{7500 + i * 100}"),
            source=RateSource.MANUAL,
            effective_date=datetime.utcnow() - timedelta(days=i)
        )
        session.add(rate)
    await session.commit()
    
    response = await client.get(f"/api/v1/products/rates/history?metal_type={metal_type}&purity=22K")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) >= 5


@pytest.mark.asyncio
async def test_add_rate(client: AsyncClient, session: AsyncSession, setup_rate_admin):
    """Test adding a new rate."""
    from app.core.permissions import get_current_active_user, get_current_verified_user
    
    user = setup_rate_admin
    
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    try:
        payload = {
            "metal_type": f"GOLD_{uuid4().hex[:4].upper()}",
            "purity": "18K",
            "rate_per_gram": "6800",
            "source": "MANUAL"
        }
        response = await client.post("/api/v1/products/admin/rates", json=payload)
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["purity"] == "18K"
        assert Decimal(data["rate_per_gram"]) == Decimal("6800")
    finally:
        app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_add_rates_batch(client: AsyncClient, session: AsyncSession, setup_rate_admin):
    """Test batch rate import (BAJUS simulation)."""
    from app.core.permissions import get_current_active_user, get_current_verified_user
    
    user = setup_rate_admin
    batch_id = uuid4().hex[:4].upper()
    
    async def mock_get_user():
        return user
    
    app.dependency_overrides[get_current_active_user] = mock_get_user
    app.dependency_overrides[get_current_verified_user] = mock_get_user
    
    try:
        payload = [
            {"metal_type": f"GOLD_B{batch_id}", "purity": "22K", "rate_per_gram": "7600", "source": "BAJUS"},
            {"metal_type": f"GOLD_B{batch_id}", "purity": "21K", "rate_per_gram": "7200", "source": "BAJUS"},
        ]
        response = await client.post("/api/v1/products/admin/rates/batch", json=payload)
        assert response.status_code == 201
        data = response.json()["data"]
        assert len(data) == 2
    finally:
        app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_product_pricing(client: AsyncClient, session: AsyncSession, setup_product_with_variant):
    """Test dynamic price calculation for a product."""
    product, variant = setup_product_with_variant
    
    # Add a rate for this metal/purity
    rate = DailyRate(
        metal_type="GOLD",
        purity="22K",
        rate_per_gram=Decimal("7500"),
        source=RateSource.MANUAL,
        effective_date=datetime.utcnow()
    )
    session.add(rate)
    await session.commit()
    
    response = await client.get(f"/api/v1/products/products/{product.id}/pricing")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["product_id"] == str(product.id)
    assert "variants" in data
