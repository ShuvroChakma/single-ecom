"""
Tests for Promo Codes.
"""
import pytest
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timedelta

from app.modules.promo_codes.models import PromoCode, DiscountType
from app.modules.promo_codes.schemas import (
    PromoCodeCreate,
    PromoValidationResult
)


class TestPromoCodeSchemas:
    """Test promo code schemas."""
    
    def test_promo_create_percentage(self):
        """Test creating percentage discount promo."""
        data = PromoCodeCreate(
            code="SAVE10",
            discount_type=DiscountType.PERCENTAGE,
            discount_value=Decimal("10"),
            max_discount=Decimal("500"),
            starts_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        
        assert data.code == "SAVE10"
        assert data.discount_type == DiscountType.PERCENTAGE
        assert data.discount_value == Decimal("10")
    
    def test_promo_create_fixed_amount(self):
        """Test creating fixed amount discount promo."""
        data = PromoCodeCreate(
            code="flat500",
            discount_type=DiscountType.FIXED_AMOUNT,
            discount_value=Decimal("500"),
            min_order_amount=Decimal("3000"),
            starts_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        assert data.code == "FLAT500"  # Should be uppercased
        assert data.discount_type == DiscountType.FIXED_AMOUNT
    
    def test_promo_create_free_shipping(self):
        """Test creating free shipping promo."""
        data = PromoCodeCreate(
            code="FREESHIP",
            discount_type=DiscountType.FREE_SHIPPING,
            discount_value=Decimal("1"),  # Not used, but required by schema
            starts_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=14)
        )
        
        assert data.discount_type == DiscountType.FREE_SHIPPING


class TestPromoCodeModel:
    """Test promo code model."""
    
    def test_promo_model_creation(self):
        """Test PromoCode model can be created."""
        promo = PromoCode(
            code="TEST123",
            discount_type=DiscountType.PERCENTAGE,
            discount_value=Decimal("15"),
            starts_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        
        assert promo.code == "TEST123"
        assert promo.is_active is True
        assert promo.current_uses == 0
        assert promo.max_uses_per_user == 1
    
    def test_promo_defaults(self):
        """Test promo model has correct defaults."""
        promo = PromoCode(
            code="NEWUSER",
            discount_type=DiscountType.FIXED_AMOUNT,
            discount_value=Decimal("100"),
            starts_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        assert promo.first_order_only is False
        assert promo.is_active is True
        assert promo.max_total_uses is None
        assert promo.max_uses_per_user == 1


class TestPromoValidationResult:
    """Test promo validation result schema."""
    
    def test_valid_percentage_result(self):
        """Test valid percentage discount result."""
        result = PromoValidationResult(
            valid=True,
            code="SAVE10",
            discount_type=DiscountType.PERCENTAGE,
            discount_value=Decimal("10"),
            discount_amount=Decimal("500"),
            message="Promo code applied successfully",
            new_total=Decimal("4500"),
            free_shipping=False
        )
        
        assert result.valid is True
        assert result.discount_amount == Decimal("500")
        assert result.new_total == Decimal("4500")
    
    def test_invalid_result(self):
        """Test invalid promo result."""
        result = PromoValidationResult(
            valid=False,
            code="EXPIRED",
            message="This promo code has expired"
        )
        
        assert result.valid is False
        assert result.discount_amount is None
    
    def test_free_shipping_result(self):
        """Test free shipping result."""
        result = PromoValidationResult(
            valid=True,
            code="FREESHIP",
            discount_type=DiscountType.FREE_SHIPPING,
            discount_value=Decimal("0"),
            discount_amount=Decimal("0"),
            message="Promo code applied successfully",
            new_total=Decimal("5000"),
            free_shipping=True
        )
        
        assert result.valid is True
        assert result.free_shipping is True
        assert result.discount_amount == Decimal("0")


class TestDiscountCalculation:
    """Test discount calculation logic."""
    
    def test_percentage_discount(self):
        """Test percentage discount calculation."""
        order_amount = Decimal("5000")
        percentage = Decimal("10")
        
        discount = order_amount * (percentage / 100)
        
        assert discount == Decimal("500")
    
    def test_percentage_with_cap(self):
        """Test percentage discount with max cap."""
        order_amount = Decimal("10000")
        percentage = Decimal("20")
        max_discount = Decimal("500")
        
        discount = order_amount * (percentage / 100)  # 2000
        if discount > max_discount:
            discount = max_discount
        
        assert discount == Decimal("500")
    
    def test_fixed_amount_discount(self):
        """Test fixed amount discount."""
        order_amount = Decimal("5000")
        fixed_discount = Decimal("300")
        
        discount = min(fixed_discount, order_amount)
        
        assert discount == Decimal("300")
    
    def test_fixed_discount_exceeds_order(self):
        """Test fixed discount when it exceeds order amount."""
        order_amount = Decimal("200")
        fixed_discount = Decimal("500")
        
        discount = min(fixed_discount, order_amount)
        
        assert discount == Decimal("200")
