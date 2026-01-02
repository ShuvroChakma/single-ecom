"""
Brand and Collection models for Catalog module.
"""
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel
from datetime import datetime


class BrandBase(SQLModel):
    """Base Brand schema."""
    name: str = Field(index=True)
    slug: str = Field(unique=True, index=True)
    logo: Optional[str] = Field(default=None, description="Logo image URL")
    is_active: bool = Field(default=True)


class Brand(BrandBase, table=True):
    """Brand database model."""
    __tablename__ = "brands"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CollectionBase(SQLModel):
    """Base Collection schema."""
    name: str = Field(index=True)
    slug: str = Field(unique=True, index=True)
    description: Optional[str] = Field(default=None)
    banner_image: Optional[str] = Field(default=None, description="Banner image URL")
    is_active: bool = Field(default=True)


class Collection(CollectionBase, table=True):
    """Collection database model."""
    __tablename__ = "collections"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
