"""
Attribute system models for EAV (Entity-Attribute-Value) pattern.
"""
from typing import Optional, List
from uuid import UUID, uuid4
from enum import Enum
from sqlmodel import Field, Relationship, SQLModel, Column
from sqlalchemy import JSON
from datetime import datetime


class AttributeType(str, Enum):
    """Attribute data types."""
    TEXT = "TEXT"
    NUMBER = "NUMBER"
    SELECT = "SELECT"
    MULTI_SELECT = "MULTI_SELECT"
    BOOLEAN = "BOOLEAN"


class AttributeGroupBase(SQLModel):
    """Base AttributeGroup schema."""
    name: str = Field(index=True, description="Group name e.g. 'Basic Information'")
    sort_order: int = Field(default=0)
    is_active: bool = Field(default=True)


class AttributeGroup(AttributeGroupBase, table=True):
    """AttributeGroup database model."""
    __tablename__ = "attribute_groups"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    attributes: List["Attribute"] = Relationship(back_populates="group")


class AttributeBase(SQLModel):
    """Base Attribute schema."""
    code: str = Field(unique=True, index=True, description="Attribute code e.g. 'product_type'")
    name: str = Field(index=True, description="Display name e.g. 'Product Type'")
    type: AttributeType = Field(default=AttributeType.TEXT)
    options: Optional[List[str]] = Field(default=None, sa_column=Column(JSON), description="Options for SELECT types")
    is_required: bool = Field(default=False)
    is_filterable: bool = Field(default=False, description="Can be used as filter in product listing")
    sort_order: int = Field(default=0)
    is_active: bool = Field(default=True)


class Attribute(AttributeBase, table=True):
    """Attribute database model."""
    __tablename__ = "attributes"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    group_id: UUID = Field(foreign_key="attribute_groups.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    group: Optional[AttributeGroup] = Relationship(back_populates="attributes")
    values: List["ProductAttributeValue"] = Relationship(back_populates="attribute")


class ProductAttributeValueBase(SQLModel):
    """Base ProductAttributeValue schema."""
    value: str = Field(description="The attribute value (JSON string for complex types)")


class ProductAttributeValue(ProductAttributeValueBase, table=True):
    """ProductAttributeValue database model (EAV junction table)."""
    __tablename__ = "product_attribute_values"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    product_id: UUID = Field(foreign_key="products.id", index=True)
    attribute_id: UUID = Field(foreign_key="attributes.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    attribute: Optional[Attribute] = Relationship(back_populates="values")
