"""
Inquiry schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.modules.inquiries.models import InquiryType, InquiryStatus


class InquiryCreate(BaseModel):
    """Schema for creating a new inquiry."""
    type: InquiryType = InquiryType.GENERAL
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=20)
    subject: str = Field(min_length=5, max_length=255)
    message: str = Field(min_length=10, max_length=5000)

    # Custom jewellery specific
    metal_type: Optional[str] = Field(default=None, max_length=50)
    budget_range: Optional[str] = Field(default=None, max_length=100)


class CustomJewelleryRequest(BaseModel):
    """Schema specifically for custom jewellery requests."""
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=20)
    metal_type: str = Field(min_length=2, max_length=50)
    budget_range: str = Field(min_length=2, max_length=100)
    message: str = Field(min_length=10, max_length=5000)


class InquiryResponse(BaseModel):
    """Schema for inquiry response."""
    id: UUID
    type: InquiryType
    status: InquiryStatus
    name: str
    email: str
    phone: Optional[str]
    subject: str
    message: str
    metal_type: Optional[str]
    budget_range: Optional[str]
    design_image: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InquiryAdminResponse(InquiryResponse):
    """Schema for admin inquiry response with additional fields."""
    customer_id: Optional[UUID]
    admin_notes: Optional[str]
    assigned_to: Optional[UUID]
    resolved_at: Optional[datetime]


class InquiryUpdate(BaseModel):
    """Schema for updating an inquiry (admin)."""
    status: Optional[InquiryStatus] = None
    admin_notes: Optional[str] = Field(default=None, max_length=2000)
    assigned_to: Optional[UUID] = None


class InquiryCreatedResponse(BaseModel):
    """Response after creating an inquiry."""
    id: UUID
    message: str = "Your inquiry has been submitted successfully. We will get back to you soon."
