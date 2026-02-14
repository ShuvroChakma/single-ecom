"""
Inquiry models for storing customer inquiries and custom jewellery requests.
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class InquiryType(str, Enum):
    CUSTOM_JEWELLERY = "CUSTOM_JEWELLERY"
    GENERAL = "GENERAL"
    SUPPORT = "SUPPORT"
    FEEDBACK = "FEEDBACK"


class InquiryStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class Inquiry(SQLModel, table=True):
    """Customer inquiry model."""
    __tablename__ = "inquiries"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    type: InquiryType = Field(default=InquiryType.GENERAL)
    status: InquiryStatus = Field(default=InquiryStatus.PENDING)

    # Customer info (can be guest or logged in)
    customer_id: Optional[UUID] = Field(default=None, foreign_key="customers.id", index=True)
    name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)

    # Inquiry details
    subject: str = Field(max_length=255)
    message: str = Field(max_length=5000)

    # Custom jewellery specific fields
    metal_type: Optional[str] = Field(default=None, max_length=50)
    budget_range: Optional[str] = Field(default=None, max_length=100)
    design_image: Optional[str] = Field(default=None, max_length=500)  # File path

    # Admin response
    admin_notes: Optional[str] = Field(default=None, max_length=2000)
    assigned_to: Optional[UUID] = Field(default=None, foreign_key="users.id")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = Field(default=None)
