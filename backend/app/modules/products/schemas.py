"""
Pydantic schemas for Product and ProductVariant.
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime

from app.modules.products.models import Gender, MakingChargeType, MetalType


# ============ PRODUCT VARIANT SCHEMAS ============

class ProductVariantCreate(BaseModel):
    """Schema for creating a product variant."""
    sku: str = Field(..., min_length=1, max_length=100)
    metal_type: MetalType
    metal_purity: str = Field(..., min_length=1, max_length=10)
    metal_color: str = Field(..., min_length=1, max_length=20)
    size: Optional[str] = None
    gross_weight: Decimal = Field(..., ge=0)
    net_weight: Decimal = Field(..., ge=0)
    is_default: bool = False
    stock_quantity: int = Field(default=0, ge=0)
    is_active: bool = True


class ProductVariantUpdate(BaseModel):
    """Schema for updating a product variant."""
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    metal_type: Optional[MetalType] = None
    metal_purity: Optional[str] = Field(None, min_length=1, max_length=10)
    metal_color: Optional[str] = Field(None, min_length=1, max_length=20)
    size: Optional[str] = None
    gross_weight: Optional[Decimal] = Field(None, ge=0)
    net_weight: Optional[Decimal] = Field(None, ge=0)
    is_default: Optional[bool] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ProductVariantResponse(BaseModel):
    """Schema for product variant response."""
    id: UUID
    product_id: UUID
    sku: str
    metal_type: MetalType
    metal_purity: str
    metal_color: str
    size: Optional[str]
    gross_weight: Decimal
    net_weight: Decimal
    is_default: bool
    stock_quantity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ============ PRODUCT SCHEMAS ============

class ProductCreate(BaseModel):
    """Schema for creating a product."""
    sku_base: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    category_id: UUID
    brand_id: Optional[UUID] = None
    collection_id: Optional[UUID] = None
    gender: Gender = Gender.UNISEX
    base_making_charge_type: MakingChargeType = MakingChargeType.FIXED_PER_GRAM
    base_making_charge_value: Decimal = Field(default=Decimal("0"), ge=0)
    tax_code: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    images: List[str] = []
    
    # Optional: Create with initial variants
    variants: List[ProductVariantCreate] = []


class ProductUpdate(BaseModel):
    """Schema for updating a product."""
    sku_base: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=200, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    brand_id: Optional[UUID] = None
    collection_id: Optional[UUID] = None
    gender: Optional[Gender] = None
    base_making_charge_type: Optional[MakingChargeType] = None
    base_making_charge_value: Optional[Decimal] = Field(None, ge=0)
    tax_code: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    images: Optional[List[str]] = None


class ProductResponse(BaseModel):
    """Schema for product response (without variants)."""
    id: UUID
    sku_base: str
    name: str
    slug: str
    description: Optional[str]
    category_id: UUID
    brand_id: Optional[UUID]
    collection_id: Optional[UUID]
    gender: Gender
    base_making_charge_type: MakingChargeType
    base_making_charge_value: Decimal
    tax_code: Optional[str]
    is_active: bool
    is_featured: bool
    images: List[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductWithVariantsResponse(ProductResponse):
    """Product with nested variants."""
    variants: List[ProductVariantResponse] = []


class ProductListParams(BaseModel):
    """Query parameters for product listing."""
    category_id: Optional[UUID] = None
    brand_id: Optional[UUID] = None
    collection_id: Optional[UUID] = None
    gender: Optional[Gender] = None
    metal_type: Optional[MetalType] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = True
    search: Optional[str] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
