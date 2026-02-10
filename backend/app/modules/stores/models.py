"""
Store database models.
"""
from uuid import UUID
from datetime import datetime
from sqlmodel import SQLModel, Field
from typing import Optional
from decimal import Decimal


class Store(SQLModel, table=True):
    """Store/showroom location model."""

    __tablename__ = "stores"

    id: UUID = Field(default_factory=lambda: __import__('uuid').uuid4(), primary_key=True)
    name: str = Field(max_length=200, index=True)
    address: str = Field(max_length=500)
    city: str = Field(max_length=100, index=True)
    state: Optional[str] = Field(default=None, max_length=100)
    country: str = Field(default="Bangladesh", max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    phone: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=200)
    hours: Optional[str] = Field(default=None, max_length=500)  # Operating hours description
    latitude: Decimal = Field(max_digits=10, decimal_places=7)
    longitude: Decimal = Field(max_digits=10, decimal_places=7)
    image_url: Optional[str] = Field(default=None, max_length=500)
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
