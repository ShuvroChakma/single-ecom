"""
CustomerAddress model for storing customer shipping/billing addresses.
"""
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

from sqlmodel import Field, SQLModel


class CustomerAddress(SQLModel, table=True):
    """Customer address database model."""
    __tablename__ = "customer_addresses"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    customer_id: UUID = Field(foreign_key="customers.id", index=True)
    
    # Address Label
    label: str = Field(default="Home", max_length=50, description="Home, Office, etc.")
    
    # Contact Info
    full_name: str = Field(max_length=100)
    phone: str = Field(max_length=20)
    
    # Address Details
    address_line1: str = Field(max_length=255)
    address_line2: Optional[str] = Field(default=None, max_length=255)
    city: str = Field(max_length=100, index=True)
    district: str = Field(max_length=100, index=True)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    country: str = Field(default="Bangladesh", max_length=50)
    
    # Flags
    is_default: bool = Field(default=False)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
