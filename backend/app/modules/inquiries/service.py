"""
Inquiry service for business logic.
"""
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.inquiries.models import Inquiry, InquiryType, InquiryStatus
from app.modules.inquiries.schemas import InquiryCreate, CustomJewelleryRequest, InquiryUpdate
from app.core.email import EmailService


class InquiryService:
    """Service for managing customer inquiries."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_inquiry(
        self,
        data: InquiryCreate,
        customer_id: Optional[UUID] = None,
        design_image: Optional[str] = None
    ) -> Inquiry:
        """Create a new inquiry."""
        inquiry = Inquiry(
            type=data.type,
            customer_id=customer_id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            subject=data.subject,
            message=data.message,
            metal_type=data.metal_type,
            budget_range=data.budget_range,
            design_image=design_image,
        )
        self.session.add(inquiry)
        await self.session.commit()
        await self.session.refresh(inquiry)
        return inquiry

    async def create_custom_jewellery_request(
        self,
        data: CustomJewelleryRequest,
        customer_id: Optional[UUID] = None,
        design_image: Optional[str] = None
    ) -> Inquiry:
        """Create a custom jewellery request."""
        inquiry = Inquiry(
            type=InquiryType.CUSTOM_JEWELLERY,
            customer_id=customer_id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            subject=f"Custom Jewellery Request - {data.metal_type}",
            message=data.message,
            metal_type=data.metal_type,
            budget_range=data.budget_range,
            design_image=design_image,
        )
        self.session.add(inquiry)
        await self.session.commit()
        await self.session.refresh(inquiry)

        # Send acknowledgement email (fire-and-forget)
        try:
            await EmailService.send_inquiry_acknowledgement_email(
                email=data.email,
                customer_name=data.name,
                metal_type=data.metal_type,
                message=data.message,
                budget_range=data.budget_range,
            )
        except Exception:
            pass

        return inquiry

    async def get_inquiry(self, inquiry_id: UUID) -> Optional[Inquiry]:
        """Get an inquiry by ID."""
        result = await self.session.execute(
            select(Inquiry).where(Inquiry.id == inquiry_id)
        )
        return result.scalar_one_or_none()

    async def list_inquiries(
        self,
        inquiry_type: Optional[InquiryType] = None,
        status: Optional[InquiryStatus] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Inquiry], int]:
        """List inquiries with filters and pagination."""
        query = select(Inquiry)

        if inquiry_type:
            query = query.where(Inquiry.type == inquiry_type)
        if status:
            query = query.where(Inquiry.status == status)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar() or 0

        # Apply pagination
        query = query.order_by(Inquiry.created_at.desc())
        query = query.offset((page - 1) * per_page).limit(per_page)

        result = await self.session.execute(query)
        return list(result.scalars().all()), total

    async def update_inquiry(
        self,
        inquiry_id: UUID,
        data: InquiryUpdate
    ) -> Optional[Inquiry]:
        """Update an inquiry (admin)."""
        inquiry = await self.get_inquiry(inquiry_id)
        if not inquiry:
            return None

        if data.status is not None:
            inquiry.status = data.status
            if data.status == InquiryStatus.RESOLVED:
                inquiry.resolved_at = datetime.now(timezone.utc)

        if data.admin_notes is not None:
            inquiry.admin_notes = data.admin_notes

        if data.assigned_to is not None:
            inquiry.assigned_to = data.assigned_to

        inquiry.updated_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(inquiry)
        return inquiry

    async def get_customer_inquiries(
        self,
        customer_id: UUID,
        page: int = 1,
        per_page: int = 10
    ) -> Tuple[List[Inquiry], int]:
        """Get inquiries for a specific customer."""
        query = select(Inquiry).where(Inquiry.customer_id == customer_id)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar() or 0

        # Apply pagination
        query = query.order_by(Inquiry.created_at.desc())
        query = query.offset((page - 1) * per_page).limit(per_page)

        result = await self.session.execute(query)
        return list(result.scalars().all()), total
