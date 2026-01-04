"""
Tests for Delivery Zones.
"""
import pytest
from uuid import uuid4
from decimal import Decimal

from app.modules.delivery.models import DeliveryZone, ChargeType
from app.modules.delivery.schemas import DeliveryZoneCreate, DeliveryChargeResponse


class TestDeliveryZoneSchemas:
    """Test delivery zone schemas."""
    
    def test_zone_create_valid(self):
        """Test valid zone creation."""
        data = DeliveryZoneCreate(
            name="Dhaka City",
            districts=["Dhaka"],
            charge_type=ChargeType.FIXED,
            base_charge=Decimal("60"),
            free_above=Decimal("5000")
        )
        
        assert data.name == "Dhaka City"
        assert data.charge_type == ChargeType.FIXED
        assert data.free_above == Decimal("5000")
    
    def test_zone_create_weight_based(self):
        """Test weight-based zone creation."""
        data = DeliveryZoneCreate(
            name="Outside Dhaka",
            districts=["*"],
            charge_type=ChargeType.WEIGHT_BASED,
            base_charge=Decimal("150"),
            per_kg_charge=Decimal("20")
        )
        
        assert data.charge_type == ChargeType.WEIGHT_BASED
        assert data.per_kg_charge == Decimal("20")


class TestDeliveryZoneModel:
    """Test delivery zone model."""
    
    def test_zone_model_creation(self):
        """Test DeliveryZone model can be created."""
        zone = DeliveryZone(
            name="Test Zone",
            districts=["Dhaka", "Gazipur"],
            charge_type=ChargeType.FIXED,
            base_charge=Decimal("100")
        )
        
        assert zone.name == "Test Zone"
        assert "Dhaka" in zone.districts
        assert zone.is_active is True
    
    def test_zone_defaults(self):
        """Test zone model has correct defaults."""
        zone = DeliveryZone(
            name="Test",
            base_charge=Decimal("50")
        )
        
        assert zone.charge_type == ChargeType.FIXED
        assert zone.is_active is True
        assert zone.min_days == 1
        assert zone.max_days == 3


class TestDeliveryChargeCalculation:
    """Test delivery charge calculation logic."""
    
    def test_charge_response_fixed(self):
        """Test fixed charge response."""
        response = DeliveryChargeResponse(
            zone_name="Dhaka City",
            charge_type=ChargeType.FIXED,
            base_charge=Decimal("60"),
            weight_charge=Decimal("0"),
            total_charge=Decimal("60"),
            is_free=False,
            free_above=Decimal("5000"),
            estimated_days="1-2 days"
        )
        
        assert response.total_charge == Decimal("60")
        assert response.is_free is False
    
    def test_charge_response_free(self):
        """Test free delivery response."""
        response = DeliveryChargeResponse(
            zone_name="Dhaka City",
            charge_type=ChargeType.FIXED,
            base_charge=Decimal("60"),
            weight_charge=Decimal("0"),
            total_charge=Decimal("0"),
            is_free=True,
            free_above=Decimal("5000"),
            estimated_days="1-2 days"
        )
        
        assert response.total_charge == Decimal("0")
        assert response.is_free is True
    
    def test_charge_response_weight_based(self):
        """Test weight-based charge response."""
        response = DeliveryChargeResponse(
            zone_name="Outside Dhaka",
            charge_type=ChargeType.WEIGHT_BASED,
            base_charge=Decimal("100"),
            weight_charge=Decimal("40"),  # 2kg * 20
            total_charge=Decimal("140"),
            is_free=False,
            free_above=None,
            estimated_days="3-5 days"
        )
        
        assert response.total_charge == Decimal("140")
        assert response.weight_charge == Decimal("40")
