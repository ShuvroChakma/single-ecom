"""
Product and ProductVariant models for jewelry e-commerce.
"""
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from decimal import Decimal
from enum import Enum
from sqlmodel import Field, Relationship, SQLModel, Column
from sqlalchemy import JSON
from datetime import datetime


class Gender(str, Enum):
    """Gender enum for products."""
    WOMEN = "WOMEN"
    MEN = "MEN"
    KIDS = "KIDS"
    UNISEX = "UNISEX"


class MakingChargeType(str, Enum):
    """Making charge calculation type."""
    PERCENTAGE = "PERCENTAGE"
    FIXED_PER_GRAM = "FIXED_PER_GRAM"
    FLAT = "FLAT"


class MetalType(str, Enum):
    """Metal type enum."""
    GOLD = "GOLD"
    SILVER = "SILVER"
    PLATINUM = "PLATINUM"


class ProductBase(SQLModel):
    """Base Product schema."""
    sku_base: str = Field(unique=True, index=True, description="Base SKU e.g. BRDZL40932")
    name: str = Field(index=True)
    slug: str = Field(unique=True, index=True)
    description: Optional[str] = Field(default=None)
    
    gender: Gender = Field(default=Gender.UNISEX)
    
    # Making charges
    base_making_charge_type: MakingChargeType = Field(default=MakingChargeType.FIXED_PER_GRAM)
    base_making_charge_value: Decimal = Field(default=Decimal("0"), description="Making charge value")
    
    # Tax
    tax_code: Optional[str] = Field(default=None, description="HSN/SAC code")
    
    # Status
    is_active: bool = Field(default=True)
    is_featured: bool = Field(default=False)


class Product(ProductBase, table=True):
    """Product database model (Base Design)."""
    __tablename__ = "products"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Foreign keys
    category_id: UUID = Field(foreign_key="categories.id", index=True)
    brand_id: Optional[UUID] = Field(default=None, foreign_key="brands.id", index=True, nullable=True)
    collection_id: Optional[UUID] = Field(default=None, foreign_key="collections.id", index=True, nullable=True)
    
    # Images stored as JSON array
    images: List[str] = Field(default=[], sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    variants: List["ProductVariant"] = Relationship(back_populates="product")


class ProductVariantBase(SQLModel):
    """Base ProductVariant schema."""
    sku: str = Field(unique=True, index=True, description="Full SKU for variant")
    
    # Metal details
    metal_type: MetalType = Field(index=True)
    metal_purity: str = Field(description="Purity code e.g. 22K, 18K")
    metal_color: str = Field(description="rose, yellow, white")
    
    # Size
    size: Optional[str] = Field(default=None, description="Ring/bangle size")
    
    # Weights in grams
    gross_weight: Decimal = Field(description="Total weight including stones")
    net_weight: Decimal = Field(description="Metal-only weight")
    
    # Status
    is_default: bool = Field(default=False, description="Default variant to show")
    stock_quantity: int = Field(default=0)
    is_active: bool = Field(default=True)


class ProductVariant(ProductVariantBase, table=True):
    """ProductVariant database model (SKU)."""
    __tablename__ = "product_variants"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    product_id: UUID = Field(foreign_key="products.id", index=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    product: Optional[Product] = Relationship(back_populates="variants")
