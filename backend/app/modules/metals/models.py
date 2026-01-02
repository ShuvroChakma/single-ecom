"""
Metal and Purity models for jewelry pricing engine.
"""
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from decimal import Decimal
from sqlmodel import Field, Relationship, SQLModel
from datetime import datetime

if TYPE_CHECKING:
    from app.modules.metals.models import Purity


class MetalBase(SQLModel):
    """Base Metal schema."""
    name: str = Field(index=True, description="Metal name e.g. Gold, Silver")
    code: str = Field(unique=True, index=True, description="Code e.g. GOLD, SILVER")
    sort_order: int = Field(default=0, description="Display order")
    is_active: bool = Field(default=True)


class Metal(MetalBase, table=True):
    """Metal database model."""
    __tablename__ = "metals"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    purities: List["Purity"] = Relationship(back_populates="metal")


class PurityBase(SQLModel):
    """Base Purity schema."""
    name: str = Field(index=True, description="Purity name e.g. 22K, 18K")
    code: str = Field(unique=True, index=True, description="Code e.g. 22K, 18K")
    fineness: Decimal = Field(description="Fineness ratio e.g. 0.916 for 22K")
    sort_order: int = Field(default=0, description="Display order")
    is_active: bool = Field(default=True)


class Purity(PurityBase, table=True):
    """Purity database model."""
    __tablename__ = "purities"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    metal_id: UUID = Field(foreign_key="metals.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    metal: Optional[Metal] = Relationship(back_populates="purities")
