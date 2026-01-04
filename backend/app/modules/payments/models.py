"""
Payment Gateway models for storing payment method configurations.
"""
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from decimal import Decimal
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import JSON


class PaymentGatewayCode(str, Enum):
    """Supported payment gateway codes."""
    COD = "cod"                  # Cash on Delivery
    BKASH = "bkash"              # bKash Mobile Banking
    NAGAD = "nagad"              # Nagad Mobile Banking
    ROCKET = "rocket"            # Rocket Mobile Banking
    SSLCOMMERZ = "sslcommerz"    # SSL Commerz Payment Gateway
    AMARPAY = "amarpay"          # AmarPay Payment Gateway


class PaymentGateway(SQLModel, table=True):
    """Payment gateway configuration model."""
    __tablename__ = "payment_gateways"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Gateway Info
    name: str = Field(max_length=50, description="Display name")
    code: str = Field(max_length=20, unique=True, index=True, description="Gateway code")
    description: Optional[str] = Field(default=None)
    logo_url: Optional[str] = Field(default=None, max_length=255)
    
    # Configuration (credentials stored as JSON)
    config: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSON),
        description="API credentials and settings"
    )
    
    # Settings
    is_enabled: bool = Field(default=False)
    is_sandbox: bool = Field(default=True, description="Use sandbox/test mode")
    display_order: int = Field(default=0)
    
    # Amount limits
    min_amount: Optional[Decimal] = Field(default=None, description="Minimum order amount")
    max_amount: Optional[Decimal] = Field(default=None, description="Maximum order amount")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PaymentTransaction(SQLModel, table=True):
    """Record of payment transactions."""
    __tablename__ = "payment_transactions"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    order_id: Optional[UUID] = Field(default=None, index=True)  # FK added after orders table
    gateway_code: str = Field(max_length=20, index=True)
    
    # Transaction Details
    transaction_id: Optional[str] = Field(default=None, max_length=100, index=True)
    amount: Decimal = Field()
    currency: str = Field(default="BDT", max_length=5)
    
    # Status
    status: str = Field(default="INITIATED", max_length=20)  # INITIATED, SUCCESS, FAILED, REFUNDED
    
    # Gateway Response
    gateway_response: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSON)
    )
    
    # Timestamps
    initiated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
