"""
Pydantic schemas for Attribute system.
"""
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime

from app.modules.attributes.models import AttributeType


# ============ ATTRIBUTE GROUP SCHEMAS ============

class AttributeGroupCreate(BaseModel):
    """Schema for creating an attribute group."""
    name: str = Field(..., min_length=1, max_length=100)
    sort_order: int = Field(default=0)
    is_active: bool = True


class AttributeGroupUpdate(BaseModel):
    """Schema for updating an attribute group."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class AttributeGroupResponse(BaseModel):
    """Schema for attribute group response."""
    id: UUID
    name: str
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ============ ATTRIBUTE SCHEMAS ============

class AttributeCreate(BaseModel):
    """Schema for creating an attribute."""
    group_id: UUID
    code: str = Field(..., min_length=1, max_length=50, pattern=r"^[a-z_]+$")
    name: str = Field(..., min_length=1, max_length=100)
    type: AttributeType = AttributeType.TEXT
    options: Optional[List[str]] = None
    is_required: bool = False
    is_filterable: bool = False
    sort_order: int = Field(default=0)
    is_active: bool = True


class AttributeUpdate(BaseModel):
    """Schema for updating an attribute."""
    group_id: Optional[UUID] = None
    code: Optional[str] = Field(None, min_length=1, max_length=50, pattern=r"^[a-z_]+$")
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[AttributeType] = None
    options: Optional[List[str]] = None
    is_required: Optional[bool] = None
    is_filterable: Optional[bool] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class AttributeResponse(BaseModel):
    """Schema for attribute response."""
    id: UUID
    group_id: UUID
    code: str
    name: str
    type: AttributeType
    options: Optional[List[str]]
    is_required: bool
    is_filterable: bool
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AttributeGroupWithAttributesResponse(AttributeGroupResponse):
    """Attribute group with nested attributes."""
    attributes: List[AttributeResponse] = []


# ============ PRODUCT ATTRIBUTE VALUE SCHEMAS ============

class ProductAttributeValueCreate(BaseModel):
    """Schema for setting a product attribute value."""
    attribute_id: UUID
    value: str


class ProductAttributeValueUpdate(BaseModel):
    """Schema for updating a product attribute value."""
    value: str


class ProductAttributeValueResponse(BaseModel):
    """Schema for product attribute value response."""
    id: UUID
    product_id: UUID
    attribute_id: UUID
    value: str
    attribute: Optional[AttributeResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductAttributeDisplayItem(BaseModel):
    """Display item for grouped attributes."""
    code: str
    name: str
    value: str


class ProductAttributeGroupDisplay(BaseModel):
    """Grouped attributes for product detail page."""
    group: str
    items: List[ProductAttributeDisplayItem]
