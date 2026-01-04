"""
Tests for Customer Addresses.
"""
import pytest
from uuid import uuid4
from decimal import Decimal

from app.modules.addresses.models import CustomerAddress
from app.modules.addresses.schemas import AddressCreate, AddressUpdate, AddressResponse


# ============ UNIT TESTS ============

class TestAddressSchemas:
    """Test address schemas."""
    
    def test_address_create_valid(self):
        """Test valid address creation schema."""
        data = AddressCreate(
            label="Home",
            full_name="John Doe",
            phone="01712345678",
            address_line1="123 Main Street",
            city="Dhaka",
            district="Dhaka",
            postal_code="1205"
        )
        
        assert data.label == "Home"
        assert data.full_name == "John Doe"
        assert data.country == "Bangladesh"  # Default
        assert data.is_default is False  # Default
    
    def test_address_create_defaults(self):
        """Test address create uses correct defaults."""
        data = AddressCreate(
            full_name="Jane Doe",
            phone="01812345678",
            address_line1="456 Oak Avenue",
            city="Chittagong",
            district="Chittagong"
        )
        
        assert data.label == "Home"
        assert data.country == "Bangladesh"
        assert data.address_line2 is None
        assert data.postal_code is None
    
    def test_address_create_validation(self):
        """Test address create validates required fields."""
        from pydantic import ValidationError
        
        # Missing required fields
        with pytest.raises(ValidationError):
            AddressCreate(
                full_name="John Doe",
                phone="01712345678"
                # Missing address_line1, city, district
            )
    
    def test_address_update_partial(self):
        """Test address update with partial data."""
        data = AddressUpdate(
            phone="01912345678"
        )
        
        assert data.phone == "01912345678"
        assert data.full_name is None
        assert data.city is None


class TestAddressModel:
    """Test address model."""
    
    def test_address_model_creation(self):
        """Test CustomerAddress model can be created."""
        customer_id = uuid4()
        
        address = CustomerAddress(
            customer_id=customer_id,
            label="Office",
            full_name="Test User",
            phone="01712345678",
            address_line1="Road 10, House 5",
            city="Dhaka",
            district="Dhaka"
        )
        
        assert address.customer_id == customer_id
        assert address.label == "Office"
        assert address.country == "Bangladesh"
        assert address.is_default is False
    
    def test_address_default_values(self):
        """Test address model has correct defaults."""
        address = CustomerAddress(
            customer_id=uuid4(),
            full_name="Test",
            phone="01700000000",
            address_line1="Test Address",
            city="Test City",
            district="Test District"
        )
        
        assert address.label == "Home"
        assert address.country == "Bangladesh"
        assert address.is_default is False
        assert address.address_line2 is None


class TestAddressResponse:
    """Test address response schema."""
    
    def test_address_response_from_model(self):
        """Test AddressResponse can be created from model."""
        address = CustomerAddress(
            id=uuid4(),
            customer_id=uuid4(),
            label="Home",
            full_name="Test User",
            phone="01712345678",
            address_line1="123 Street",
            city="Dhaka",
            district="Dhaka",
            is_default=True
        )
        
        response = AddressResponse.model_validate(address)
        
        assert response.id == address.id
        assert response.full_name == "Test User"
        assert response.is_default is True


class TestAddressService:
    """Test address service logic."""
    
    def test_max_addresses_constant(self):
        """Test service has correct max addresses constant."""
        from app.modules.addresses.service import AddressService
        
        assert AddressService.MAX_ADDRESSES == 5
