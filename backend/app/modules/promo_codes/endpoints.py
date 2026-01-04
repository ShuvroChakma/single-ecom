"""
API endpoints for Promo Codes.
Customer validation + Admin CRUD.
"""
from typing import List
from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions, get_current_verified_user
from app.core.schemas.response import SuccessResponse, create_success_response
from app.core.exceptions import PermissionDeniedError
from app.constants.permissions import PermissionEnum
from app.constants.enums import UserType
from app.constants.error_codes import ErrorCode
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.promo_codes.service import PromoCodeService
from app.modules.promo_codes.schemas import (
    PromoCodeCreate,
    PromoCodeUpdate,
    PromoCodeResponse,
    ValidatePromoRequest,
    PromoValidationResult,
    PromoCodeStats
)


router = APIRouter()


def get_promo_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> PromoCodeService:
    """Get promo code service instance."""
    return PromoCodeService(session, audit_service)


# ============ CUSTOMER ENDPOINTS ============

@router.post("/validate", response_model=SuccessResponse[PromoValidationResult])
async def validate_promo_code(
    data: ValidatePromoRequest,
    current_user: User = Depends(get_current_verified_user),
    service: PromoCodeService = Depends(get_promo_service)
):
    """
    Validate a promo code for the current customer.
    
    Returns discount calculation and eligibility.
    """
    customer_id = None
    if current_user.user_type == UserType.CUSTOMER and current_user.customer:
        customer_id = current_user.customer.id
    
    result = await service.validate_promo(
        code=data.code,
        order_amount=data.order_amount,
        customer_id=customer_id
    )
    
    message = "Promo code valid" if result.valid else "Promo code invalid"
    
    return create_success_response(
        message=message,
        data=result
    )


# ============ ADMIN ENDPOINTS ============

@router.get("/admin", response_model=SuccessResponse[List[PromoCodeResponse]])
async def list_promo_codes(
    include_inactive: bool = False,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_READ])),
    service: PromoCodeService = Depends(get_promo_service)
):
    """List all promo codes (admin)."""
    promos = await service.get_promo_codes(include_inactive=include_inactive)
    
    return create_success_response(
        message="Promo codes retrieved",
        data=[PromoCodeResponse.model_validate(p) for p in promos]
    )


@router.post("/admin", response_model=SuccessResponse[PromoCodeResponse], status_code=201)
async def create_promo_code(
    data: PromoCodeCreate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_WRITE])),
    service: PromoCodeService = Depends(get_promo_service)
):
    """Create a new promo code (admin)."""
    promo = await service.create_promo_code(data, str(current_user.id), request)
    
    return create_success_response(
        message="Promo code created",
        data=PromoCodeResponse.model_validate(promo)
    )


@router.get("/admin/{promo_id}", response_model=SuccessResponse[PromoCodeResponse])
async def get_promo_code(
    promo_id: UUID,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_READ])),
    service: PromoCodeService = Depends(get_promo_service)
):
    """Get a specific promo code (admin)."""
    promo = await service.get_promo_code(promo_id)
    
    return create_success_response(
        message="Promo code retrieved",
        data=PromoCodeResponse.model_validate(promo)
    )


@router.put("/admin/{promo_id}", response_model=SuccessResponse[PromoCodeResponse])
async def update_promo_code(
    promo_id: UUID,
    data: PromoCodeUpdate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_WRITE])),
    service: PromoCodeService = Depends(get_promo_service)
):
    """Update a promo code (admin)."""
    promo = await service.update_promo_code(promo_id, data, str(current_user.id), request)
    
    return create_success_response(
        message="Promo code updated",
        data=PromoCodeResponse.model_validate(promo)
    )


@router.delete("/admin/{promo_id}", response_model=SuccessResponse[dict])
async def delete_promo_code(
    promo_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_DELETE])),
    service: PromoCodeService = Depends(get_promo_service)
):
    """Delete a promo code (admin)."""
    await service.delete_promo_code(promo_id, str(current_user.id), request)
    
    return create_success_response(
        message="Promo code deleted",
        data={"deleted": True}
    )


@router.get("/admin/{promo_id}/stats", response_model=SuccessResponse[PromoCodeStats])
async def get_promo_stats(
    promo_id: UUID,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_READ])),
    service: PromoCodeService = Depends(get_promo_service)
):
    """Get usage statistics for a promo code (admin)."""
    stats = await service.get_stats(promo_id)
    
    return create_success_response(
        message="Promo code stats retrieved",
        data=stats
    )
