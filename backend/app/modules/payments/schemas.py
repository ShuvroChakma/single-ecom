"""
Pydantic schemas for Payment Gateways.
"""
from typing import Optional, Dict, Any, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime


# ============ REQUEST SCHEMAS ============

class PaymentGatewayUpdate(BaseModel):
    """Schema for updating a payment gateway."""
    name: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    logo_url: Optional[str] = Field(default=None, max_length=255)
    config: Optional[Dict[str, Any]] = None  # API credentials
    is_enabled: Optional[bool] = None
    is_sandbox: Optional[bool] = None
    display_order: Optional[int] = None
    min_amount: Optional[Decimal] = Field(default=None, ge=0)
    max_amount: Optional[Decimal] = Field(default=None, ge=0)


# ============ RESPONSE SCHEMAS ============

class PaymentGatewayResponse(BaseModel):
    """Schema for payment gateway response (admin view)."""
    id: UUID
    name: str
    code: str
    description: Optional[str]
    logo_url: Optional[str]
    is_enabled: bool
    is_sandbox: bool
    display_order: int
    min_amount: Optional[Decimal]
    max_amount: Optional[Decimal]
    has_config: bool  # Whether credentials are configured (don't expose actual config)
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class PaymentMethodPublic(BaseModel):
    """Public payment method info for customers."""
    code: str
    name: str
    description: Optional[str]
    logo_url: Optional[str]
    min_amount: Optional[Decimal]
    max_amount: Optional[Decimal]


class PaymentMethodsResponse(BaseModel):
    """Response with available payment methods."""
    methods: List[PaymentMethodPublic]
    

class GatewayConfigTemplate(BaseModel):
    """Template showing required config fields for a gateway."""
    gateway_code: str
    required_fields: List[str]
    optional_fields: List[str]
    example: Dict[str, str]


# ============ GATEWAY CONFIG TEMPLATES ============

GATEWAY_CONFIGS = {
    "cod": {
        "required_fields": [],
        "optional_fields": [],
        "example": {}
    },
    "bkash": {
        "required_fields": ["app_key", "app_secret", "username", "password"],
        "optional_fields": ["base_url"],
        "example": {
            "app_key": "your-app-key",
            "app_secret": "your-app-secret",
            "username": "your-username",
            "password": "your-password",
            "base_url": "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
        }
    },
    "nagad": {
        "required_fields": ["merchant_id", "public_key", "private_key"],
        "optional_fields": ["base_url"],
        "example": {
            "merchant_id": "your-merchant-id",
            "public_key": "-----BEGIN PUBLIC KEY-----...",
            "private_key": "-----BEGIN RSA PRIVATE KEY-----...",
            "base_url": "http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0"
        }
    },
    "rocket": {
        "required_fields": ["merchant_id", "api_key"],
        "optional_fields": ["base_url"],
        "example": {
            "merchant_id": "your-merchant-id",
            "api_key": "your-api-key"
        }
    },
    "sslcommerz": {
        "required_fields": ["store_id", "store_password"],
        "optional_fields": ["is_sandbox"],
        "example": {
            "store_id": "your-store-id",
            "store_password": "your-store-password",
            "is_sandbox": "true"
        }
    },
    "amarpay": {
        "required_fields": ["store_id", "signature_key"],
        "optional_fields": ["base_url"],
        "example": {
            "store_id": "your-store-id",
            "signature_key": "your-signature-key",
            "base_url": "https://sandbox.aamarpay.com"
        }
    }
}
