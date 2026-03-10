"""
API endpoints for inquiries.
"""
import asyncio
import time
from pathlib import Path
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_customer_optional
from app.core.permissions import require_permissions
from app.constants.permissions import PermissionEnum
from app.core.rate_limit import rate_limit
from app.core.schemas.response import SuccessResponse, create_success_response
from app.modules.users.models import User, Customer
from app.modules.inquiries.service import InquiryService
from app.modules.inquiries.schemas import (
    InquiryCreate, CustomJewelleryRequest, InquiryResponse,
    InquiryAdminResponse, InquiryUpdate, InquiryCreatedResponse
)
from app.modules.inquiries.models import InquiryType, InquiryStatus

ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


def _sanitize_filename(filename: str) -> str:
    """Return a safe filename, stripping path components and non-alphanumeric chars."""
    stem = Path(filename).stem
    ext = Path(filename).suffix.lower()
    safe_stem = "".join(c for c in stem if c.isalnum() or c in ("-", "_"))[:50] or "upload"
    safe_ext = ext if ext in ALLOWED_IMAGE_EXTENSIONS else ".jpg"
    return f"{safe_stem}_{int(time.time())}{safe_ext}"

router = APIRouter()


async def get_inquiry_service(
    session: AsyncSession = Depends(get_db)
) -> InquiryService:
    return InquiryService(session)


# ============ PUBLIC ENDPOINTS ============

@router.post("", response_model=SuccessResponse[InquiryCreatedResponse], status_code=201)
async def create_inquiry(
    data: InquiryCreate,
    service: InquiryService = Depends(get_inquiry_service),
    current_customer: Optional[Customer] = Depends(get_current_customer_optional)
):
    """Submit a new inquiry (public, can be guest or logged in)."""
    customer_id = current_customer.id if current_customer else None
    inquiry = await service.create_inquiry(data, customer_id)
    return create_success_response(
        message="Inquiry submitted successfully",
        data=InquiryCreatedResponse(id=inquiry.id)
    )


@router.post("/custom-jewellery", response_model=SuccessResponse[InquiryCreatedResponse], status_code=201)
@rate_limit("inquiries:submit")
async def create_custom_jewellery_request(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    metal_type: str = Form(...),
    budget_range: str = Form(...),
    message: str = Form(...),
    website: str = Form(default=""),  # honeypot — must stay empty
    design_image: Optional[UploadFile] = File(None),
    service: InquiryService = Depends(get_inquiry_service),
    current_customer: Optional[Customer] = Depends(get_current_customer_optional)
):
    """Submit a custom jewellery request with optional design image."""

    # Honeypot: bots fill hidden fields, humans don't
    if website:
        # Return fake success to not reveal detection
        return create_success_response(
            message="Custom jewellery request submitted successfully. Our team will contact you soon.",
            data=InquiryCreatedResponse(id=uuid4())
        )

    customer_id = current_customer.id if current_customer else None

    # Handle file upload if provided
    design_image_path = None
    if design_image and design_image.filename:
        # Validate MIME type
        if design_image.content_type not in ALLOWED_IMAGE_MIMES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files (JPEG, PNG, WebP, GIF) are allowed."
            )

        # Validate file size
        contents = await design_image.read()
        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image must be under 5 MB."
            )

        safe_name = _sanitize_filename(design_image.filename)
        upload_dir = Path("static/uploads/inquiries")
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / safe_name
        await asyncio.get_event_loop().run_in_executor(
            None, file_path.write_bytes, contents
        )
        design_image_path = f"/static/uploads/inquiries/{safe_name}"

    data = CustomJewelleryRequest(
        name=name,
        email=email,
        phone=phone,
        metal_type=metal_type,
        budget_range=budget_range,
        message=message
    )

    inquiry = await service.create_custom_jewellery_request(
        data, customer_id, design_image_path
    )

    return create_success_response(
        message="Custom jewellery request submitted successfully. Our team will contact you soon.",
        data=InquiryCreatedResponse(id=inquiry.id)
    )


# ============ CUSTOMER ENDPOINTS ============

@router.get("/my", response_model=SuccessResponse[List[InquiryResponse]])
async def get_my_inquiries(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=50),
    current_customer: Customer = Depends(get_current_customer_optional),
    service: InquiryService = Depends(get_inquiry_service)
):
    """Get current customer's inquiries."""
    if not current_customer:
        return create_success_response(
            message="Please log in to view your inquiries",
            data=[]
        )

    inquiries, total = await service.get_customer_inquiries(
        current_customer.id, page, per_page
    )
    return create_success_response(
        message="Inquiries retrieved successfully",
        data=[InquiryResponse.model_validate(i) for i in inquiries]
    )


# ============ ADMIN ENDPOINTS ============

@router.get("/admin", response_model=SuccessResponse[dict])
async def list_inquiries(
    inquiry_type: Optional[InquiryType] = None,
    status: Optional[InquiryStatus] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_permissions([PermissionEnum.INQUIRIES_READ])),
    service: InquiryService = Depends(get_inquiry_service)
):
    """List all inquiries with filters (admin)."""
    inquiries, total = await service.list_inquiries(
        inquiry_type, status, page, per_page
    )
    return create_success_response(
        message="Inquiries retrieved successfully",
        data={
            "items": [InquiryAdminResponse.model_validate(i) for i in inquiries],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    )


@router.get("/admin/{inquiry_id}", response_model=SuccessResponse[InquiryAdminResponse])
async def get_inquiry(
    inquiry_id: UUID,
    current_user: User = Depends(require_permissions([PermissionEnum.INQUIRIES_READ])),
    service: InquiryService = Depends(get_inquiry_service)
):
    """Get a specific inquiry (admin)."""
    inquiry = await service.get_inquiry(inquiry_id)
    if not inquiry:
        return create_success_response(
            message="Inquiry not found",
            data=None
        )
    return create_success_response(
        message="Inquiry retrieved successfully",
        data=InquiryAdminResponse.model_validate(inquiry)
    )


@router.put("/admin/{inquiry_id}", response_model=SuccessResponse[InquiryAdminResponse])
async def update_inquiry(
    inquiry_id: UUID,
    data: InquiryUpdate,
    current_user: User = Depends(require_permissions([PermissionEnum.INQUIRIES_WRITE])),
    service: InquiryService = Depends(get_inquiry_service)
):
    """Update an inquiry status/notes (admin)."""
    inquiry = await service.update_inquiry(inquiry_id, data)
    if not inquiry:
        return create_success_response(
            message="Inquiry not found",
            data=None
        )
    return create_success_response(
        message="Inquiry updated successfully",
        data=InquiryAdminResponse.model_validate(inquiry)
    )
