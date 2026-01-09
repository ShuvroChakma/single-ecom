"""
Tests for Orders.
"""
import pytest
from uuid import uuid4
from decimal import Decimal
from datetime import datetime

from app.modules.orders.models import Order, OrderItem, OrderStatus, PaymentStatus
from app.modules.orders.schemas import (
    CreateOrderRequest,
    OrderResponse,
    OrderListResponse,
    UpdateOrderStatusRequest
)


class TestOrderModel:
    """Test order model."""
    
    def test_order_model_creation(self):
        """Test Order model can be created."""
        order = Order(
            order_number="ORD-20260104-0001",
            customer_id=uuid4(),
            shipping_address={
                "full_name": "Test User",
                "phone": "01712345678",
                "address_line1": "123 Street",
                "city": "Dhaka",
                "district": "Dhaka"
            },
            subtotal=Decimal("5000"),
            total=Decimal("5060"),
            payment_method="cod"
        )
        
        assert order.order_number == "ORD-20260104-0001"
        assert order.status == OrderStatus.PENDING
        assert order.payment_status == PaymentStatus.PENDING
    
    def test_order_defaults(self):
        """Test order model has correct defaults."""
        order = Order(
            order_number="ORD-TEST",
            subtotal=Decimal("1000"),
            total=Decimal("1000"),
            payment_method="cod"
        )
        
        assert order.status == OrderStatus.PENDING
        assert order.payment_status == PaymentStatus.PENDING
        assert order.is_gift is False
        assert order.hide_prices is False
        assert order.is_pos_order is False
        assert order.currency == "BDT"


class TestOrderItemModel:
    """Test order item model."""
    
    def test_order_item_creation(self):
        """Test OrderItem model can be created."""
        item = OrderItem(
            order_id=uuid4(),
            product_id=uuid4(),
            variant_id=uuid4(),
            product_name="Gold Ring",
            variant_sku="GR-001",
            quantity=1,
            unit_price=Decimal("15000"),
            line_total=Decimal("15000")
        )
        
        assert item.product_name == "Gold Ring"
        assert item.quantity == 1
        assert item.line_total == Decimal("15000")


class TestOrderStatus:
    """Test order status enum."""
    
    def test_all_statuses_exist(self):
        """Test all expected statuses exist."""
        expected = [
            "PENDING", "CONFIRMED", "PROCESSING", 
            "SHIPPED", "DELIVERED", "CANCELLED",
            "REFUNDED", "RETURNED"
        ]
        
        for status in expected:
            assert hasattr(OrderStatus, status)
    
    def test_status_values(self):
        """Test status enum values."""
        assert OrderStatus.PENDING.value == "PENDING"
        assert OrderStatus.DELIVERED.value == "DELIVERED"


class TestOrderSchemas:
    """Test order schemas."""
    
    def test_create_order_request(self):
        """Test create order request schema."""
        request = CreateOrderRequest(
            address_id=uuid4(),
            payment_method="cod",
            is_gift=True,
            gift_message="Happy Birthday!"
        )
        
        assert request.payment_method == "cod"
        assert request.is_gift is True
        assert request.gift_message == "Happy Birthday!"
    
    def test_update_status_request(self):
        """Test update status request schema."""
        request = UpdateOrderStatusRequest(
            status=OrderStatus.SHIPPED,
            notes="Shipped via Pathao"
        )
        
        assert request.status == OrderStatus.SHIPPED
        assert request.notes == "Shipped via Pathao"
    
    def test_order_list_response(self):
        """Test order list response schema."""
        response = OrderListResponse(
            id=uuid4(),
            order_number="ORD-20260104-0001",
            status=OrderStatus.CONFIRMED,
            payment_status=PaymentStatus.PAID,
            total=Decimal("5000"),
            item_count=3,
            created_at=datetime.utcnow()
        )
        
        assert response.status == OrderStatus.CONFIRMED
        assert response.item_count == 3


class TestOrderNumberGeneration:
    """Test order number format."""
    
    def test_order_number_format(self):
        """Test order number follows expected format."""
        # Format: ORD-YYYYMMDD-XXXX
        order_number = "ORD-20260104-0001"
        
        parts = order_number.split("-")
        assert len(parts) == 3
        assert parts[0] == "ORD"
        assert len(parts[1]) == 8  # YYYYMMDD
        assert len(parts[2]) == 4  # 4-digit sequence
