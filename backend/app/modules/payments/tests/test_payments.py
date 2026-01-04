"""
Tests for Payment Gateways.
"""
import pytest
from uuid import uuid4
from decimal import Decimal

from app.modules.payments.models import PaymentGateway, PaymentGatewayCode, PaymentTransaction
from app.modules.payments.schemas import (
    PaymentGatewayUpdate,
    PaymentMethodPublic,
    GATEWAY_CONFIGS
)


class TestPaymentGatewayModel:
    """Test payment gateway model."""
    
    def test_gateway_model_creation(self):
        """Test PaymentGateway model can be created."""
        gateway = PaymentGateway(
            name="bKash",
            code=PaymentGatewayCode.BKASH.value,
            description="Pay with bKash"
        )
        
        assert gateway.name == "bKash"
        assert gateway.code == "bkash"
        assert gateway.is_enabled is False
        assert gateway.is_sandbox is True
    
    def test_gateway_defaults(self):
        """Test gateway model has correct defaults."""
        gateway = PaymentGateway(
            name="Test",
            code="test"
        )
        
        assert gateway.is_enabled is False
        assert gateway.is_sandbox is True
        assert gateway.display_order == 0
        assert gateway.config is None


class TestPaymentTransactionModel:
    """Test payment transaction model."""
    
    def test_transaction_creation(self):
        """Test PaymentTransaction model can be created."""
        transaction = PaymentTransaction(
            gateway_code="bkash",
            amount=Decimal("5000"),
            status="INITIATED"
        )
        
        assert transaction.gateway_code == "bkash"
        assert transaction.amount == Decimal("5000")
        assert transaction.currency == "BDT"
        assert transaction.status == "INITIATED"


class TestPaymentGatewaySchemas:
    """Test payment gateway schemas."""
    
    def test_gateway_update_schema(self):
        """Test gateway update schema."""
        data = PaymentGatewayUpdate(
            is_enabled=True,
            config={"app_key": "test-key"}
        )
        
        assert data.is_enabled is True
        assert data.config["app_key"] == "test-key"
    
    def test_payment_method_public(self):
        """Test public payment method schema."""
        method = PaymentMethodPublic(
            code="bkash",
            name="bKash",
            description="Pay with bKash",
            logo_url="/static/bkash.png",
            min_amount=Decimal("100"),
            max_amount=Decimal("50000")
        )
        
        assert method.code == "bkash"
        assert method.min_amount == Decimal("100")


class TestGatewayConfigs:
    """Test gateway configuration templates."""
    
    def test_all_gateways_have_config(self):
        """Test all gateway codes have config templates."""
        for code in PaymentGatewayCode:
            assert code.value in GATEWAY_CONFIGS
    
    def test_bkash_config_fields(self):
        """Test bKash config has required fields."""
        config = GATEWAY_CONFIGS["bkash"]
        
        assert "app_key" in config["required_fields"]
        assert "app_secret" in config["required_fields"]
        assert "username" in config["required_fields"]
        assert "password" in config["required_fields"]
    
    def test_sslcommerz_config_fields(self):
        """Test SSL Commerz config has required fields."""
        config = GATEWAY_CONFIGS["sslcommerz"]
        
        assert "store_id" in config["required_fields"]
        assert "store_password" in config["required_fields"]
    
    def test_cod_has_no_required_fields(self):
        """Test COD has no required config fields."""
        config = GATEWAY_CONFIGS["cod"]
        
        assert len(config["required_fields"]) == 0
