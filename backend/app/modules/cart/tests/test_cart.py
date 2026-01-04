"""
Tests for Cart API endpoints.
"""
import pytest
from uuid import uuid4
from decimal import Decimal
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.core.deps import get_db
from app.core.permissions import get_current_verified_user
from app.constants.enums import UserType
from app.modules.users.models import User, Customer
from app.modules.products.models import Product, ProductVariant, MetalType, MakingChargeType, Gender
from app.modules.rates.models import DailyRate
from app.modules.cart.models import Cart, CartItem


# ============ FIXTURES ============

@pytest.fixture
def mock_customer_user():
    """Create a mock customer user for testing."""
    user_id = uuid4()
    customer_id = uuid4()
    
    customer = Customer(
        id=customer_id,
        user_id=user_id,
        first_name="Test",
        last_name="Customer",
        phone_number="01712345678"
    )
    
    user = User(
        id=user_id,
        email="customer@test.com",
        hashed_password="hashed",
        is_active=True,
        is_verified=True,
        user_type=UserType.CUSTOMER
    )
    user.customer = customer
    
    return user


@pytest.fixture
def mock_product():
    """Create a mock product."""
    return Product(
        id=uuid4(),
        sku_base="TEST001",
        name="Test Gold Ring",
        slug="test-gold-ring",
        description="A beautiful test ring",
        gender=Gender.UNISEX,
        category_id=uuid4(),
        base_making_charge_type=MakingChargeType.FIXED_PER_GRAM,
        base_making_charge_value=Decimal("500"),
        images=["https://example.com/ring.jpg"],
        is_active=True
    )


@pytest.fixture
def mock_variant(mock_product):
    """Create a mock product variant."""
    return ProductVariant(
        id=uuid4(),
        product_id=mock_product.id,
        sku="TEST001-22K-YELLOW-6",
        metal_type=MetalType.GOLD,
        metal_purity="22K",
        metal_color="yellow",
        size="6",
        gross_weight=Decimal("5.5"),
        net_weight=Decimal("5.0"),
        is_default=True,
        stock_quantity=10,
        is_active=True
    )


@pytest.fixture
def mock_rate():
    """Create a mock daily rate."""
    return DailyRate(
        id=uuid4(),
        metal_type="GOLD",
        purity="22K",
        rate_per_gram=Decimal("8500"),
        currency="BDT"
    )


# ============ UNIT TESTS ============

class TestCartSchemas:
    """Test cart schemas."""
    
    def test_add_to_cart_request_validation(self):
        """Test AddToCartRequest validates properly."""
        from app.modules.cart.schemas import AddToCartRequest
        
        # Valid request
        request = AddToCartRequest(variant_id=uuid4(), quantity=2)
        assert request.quantity == 2
        
        # Default quantity
        request = AddToCartRequest(variant_id=uuid4())
        assert request.quantity == 1
    
    def test_add_to_cart_request_invalid_quantity(self):
        """Test AddToCartRequest rejects invalid quantity."""
        from app.modules.cart.schemas import AddToCartRequest
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            AddToCartRequest(variant_id=uuid4(), quantity=0)
        
        with pytest.raises(ValidationError):
            AddToCartRequest(variant_id=uuid4(), quantity=-1)
    
    def test_update_cart_item_request_validation(self):
        """Test UpdateCartItemRequest validates properly."""
        from app.modules.cart.schemas import UpdateCartItemRequest
        from pydantic import ValidationError
        
        # Valid request
        request = UpdateCartItemRequest(quantity=5)
        assert request.quantity == 5
        
        # Invalid - zero quantity
        with pytest.raises(ValidationError):
            UpdateCartItemRequest(quantity=0)


class TestCartCache:
    """Test cart cache operations."""
    
    @pytest.mark.asyncio
    async def test_cart_key_generation(self):
        """Test cart key is generated correctly."""
        from app.modules.cart.cache import cart_key
        
        customer_id = "123e4567-e89b-12d3-a456-426614174000"
        key = cart_key(customer_id)
        assert key == f"cart:{customer_id}"
    
    def test_decimal_encoder(self):
        """Test DecimalEncoder handles Decimal and UUID."""
        import json
        from app.modules.cart.cache import DecimalEncoder
        
        data = {
            "price": Decimal("99.99"),
            "id": uuid4()
        }
        encoded = json.dumps(data, cls=DecimalEncoder)
        assert "99.99" in encoded


class TestCartModels:
    """Test cart models."""
    
    def test_cart_item_has_correct_defaults(self):
        """Test CartItem has correct default values."""
        item = CartItem(
            cart_id=uuid4(),
            product_id=uuid4(),
            variant_id=uuid4(),
            quantity=1,
            price_snapshot=Decimal("50000"),
            rate_snapshot=Decimal("8500")
        )
        
        assert item.quantity == 1
        assert item.price_snapshot == Decimal("50000")
        assert item.rate_snapshot == Decimal("8500")
    
    def test_cart_model_creation(self):
        """Test Cart model can be created."""
        customer_id = uuid4()
        cart = Cart(customer_id=customer_id)
        
        assert cart.customer_id == customer_id
        assert cart.items == []


class TestCartResponse:
    """Test cart response schema."""
    
    def test_empty_cart_response(self):
        """Test creating empty cart response."""
        from app.modules.cart.schemas import CartResponse
        
        response = CartResponse(
            items=[],
            item_count=0,
            unique_items=0,
            subtotal=Decimal("0"),
            tax_amount=Decimal("0"),
            total=Decimal("0"),
            currency="BDT"
        )
        
        assert response.item_count == 0
        assert response.total == Decimal("0")
        assert len(response.items) == 0
    
    def test_cart_response_serialization(self):
        """Test cart response serializes to JSON correctly."""
        from app.modules.cart.schemas import CartResponse
        
        response = CartResponse(
            items=[],
            item_count=0,
            unique_items=0,
            subtotal=Decimal("100.50"),
            tax_amount=Decimal("3.02"),
            total=Decimal("103.52"),
            currency="BDT"
        )
        
        json_data = response.model_dump_json()
        assert "103.52" in json_data
        assert "BDT" in json_data


class TestCartService:
    """Test cart service logic."""
    
    def test_cart_service_initialization(self):
        """Test CartService can be instantiated."""
        from unittest.mock import MagicMock
        from app.modules.cart.service import CartService
        
        mock_session = MagicMock()
        service = CartService(mock_session)
        
        assert service.session == mock_session
        assert service.cart_repo is not None
        assert service.item_repo is not None
