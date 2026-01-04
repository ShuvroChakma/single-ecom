"""
API endpoints for Payment Gateways.
Customer can list methods, Admin can configure.
"""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.constants.permissions import PermissionEnum
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.payments.service import PaymentGatewayService
from app.modules.payments.schemas import (
    PaymentGatewayUpdate,
    PaymentGatewayResponse,
    PaymentMethodPublic,
    PaymentMethodsResponse,
    GatewayConfigTemplate,
    GATEWAY_CONFIGS
)


router = APIRouter()


def get_payment_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> PaymentGatewayService:
    """Get payment gateway service instance."""
    return PaymentGatewayService(session, audit_service)


# ============ CUSTOMER ENDPOINTS ============

@router.get("/methods", response_model=SuccessResponse[PaymentMethodsResponse])
async def list_payment_methods(
    order_amount: Optional[float] = None,
    service: PaymentGatewayService = Depends(get_payment_service)
):
    """
    List available payment methods for customers.
    
    Optionally filter by order amount to exclude methods with min/max limits.
    """
    amount = Decimal(str(order_amount)) if order_amount else None
    methods = await service.get_enabled_methods(order_amount=amount)
    
    return create_success_response(
        message="Payment methods retrieved",
        data=PaymentMethodsResponse(methods=methods)
    )


# ============ ADMIN ENDPOINTS ============

@router.get("/admin/gateways", response_model=SuccessResponse[List[PaymentGatewayResponse]])
async def list_all_gateways(
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_READ])),
    service: PaymentGatewayService = Depends(get_payment_service)
):
    """List all payment gateways (admin)."""
    gateways = await service.get_all_gateways()
    
    # Convert to response with has_config flag
    responses = []
    for g in gateways:
        resp = PaymentGatewayResponse(
            id=g.id,
            name=g.name,
            code=g.code,
            description=g.description,
            logo_url=g.logo_url,
            is_enabled=g.is_enabled,
            is_sandbox=g.is_sandbox,
            display_order=g.display_order,
            min_amount=g.min_amount,
            max_amount=g.max_amount,
            has_config=bool(g.config),
            created_at=g.created_at,
            updated_at=g.updated_at
        )
        responses.append(resp)
    
    return create_success_response(
        message="Payment gateways retrieved",
        data=responses
    )


@router.get("/admin/gateways/{gateway_id}", response_model=SuccessResponse[PaymentGatewayResponse])
async def get_gateway(
    gateway_id: UUID,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_READ])),
    service: PaymentGatewayService = Depends(get_payment_service)
):
    """Get a specific payment gateway (admin)."""
    g = await service.get_gateway(gateway_id)
    
    resp = PaymentGatewayResponse(
        id=g.id,
        name=g.name,
        code=g.code,
        description=g.description,
        logo_url=g.logo_url,
        is_enabled=g.is_enabled,
        is_sandbox=g.is_sandbox,
        display_order=g.display_order,
        min_amount=g.min_amount,
        max_amount=g.max_amount,
        has_config=bool(g.config),
        created_at=g.created_at,
        updated_at=g.updated_at
    )
    
    return create_success_response(
        message="Payment gateway retrieved",
        data=resp
    )


@router.put("/admin/gateways/{gateway_id}", response_model=SuccessResponse[PaymentGatewayResponse])
async def update_gateway(
    gateway_id: UUID,
    data: PaymentGatewayUpdate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_WRITE])),
    service: PaymentGatewayService = Depends(get_payment_service)
):
    """Update a payment gateway configuration (admin)."""
    g = await service.update_gateway(gateway_id, data, str(current_user.id), request)
    
    resp = PaymentGatewayResponse(
        id=g.id,
        name=g.name,
        code=g.code,
        description=g.description,
        logo_url=g.logo_url,
        is_enabled=g.is_enabled,
        is_sandbox=g.is_sandbox,
        display_order=g.display_order,
        min_amount=g.min_amount,
        max_amount=g.max_amount,
        has_config=bool(g.config),
        created_at=g.created_at,
        updated_at=g.updated_at
    )
    
    return create_success_response(
        message="Payment gateway updated",
        data=resp
    )


@router.patch("/admin/gateways/{gateway_id}/toggle", response_model=SuccessResponse[PaymentGatewayResponse])
async def toggle_gateway(
    gateway_id: UUID,
    enabled: bool,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_WRITE])),
    service: PaymentGatewayService = Depends(get_payment_service)
):
    """Enable or disable a payment gateway (admin)."""
    g = await service.toggle_gateway(gateway_id, enabled, str(current_user.id), request)
    
    resp = PaymentGatewayResponse(
        id=g.id,
        name=g.name,
        code=g.code,
        description=g.description,
        logo_url=g.logo_url,
        is_enabled=g.is_enabled,
        is_sandbox=g.is_sandbox,
        display_order=g.display_order,
        min_amount=g.min_amount,
        max_amount=g.max_amount,
        has_config=bool(g.config),
        created_at=g.created_at,
        updated_at=g.updated_at
    )
    
    return create_success_response(
        message=f"Payment gateway {'enabled' if enabled else 'disabled'}",
        data=resp
    )


@router.get("/admin/gateways/{gateway_code}/config-template", response_model=SuccessResponse[GatewayConfigTemplate])
async def get_config_template(
    gateway_code: str,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_READ])),
    service: PaymentGatewayService = Depends(get_payment_service)
):
    """Get configuration template for a gateway (admin)."""
    template = service.get_config_template(gateway_code)
    
    return create_success_response(
        message="Config template retrieved",
        data=GatewayConfigTemplate(**template)
    )


@router.post("/admin/gateways/initialize", response_model=SuccessResponse[dict])
async def initialize_gateways(
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_WRITE])),
    service: PaymentGatewayService = Depends(get_payment_service)
):
    """Initialize default payment gateways (admin)."""
    created = await service.initialize_gateways()
    
    return create_success_response(
        message=f"Initialized {len(created)} new gateways",
        data={"created_count": len(created)}
    )
