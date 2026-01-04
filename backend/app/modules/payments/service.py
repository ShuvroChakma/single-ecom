"""
Service layer for Payment Gateway operations.
"""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from app.core.exceptions import NotFoundError, ValidationError
from app.constants.error_codes import ErrorCode
from app.modules.payments.models import PaymentGateway, PaymentGatewayCode
from app.modules.payments.repository import PaymentGatewayRepository
from app.modules.payments.schemas import (
    PaymentGatewayUpdate,
    PaymentGatewayResponse,
    PaymentMethodPublic,
    GATEWAY_CONFIGS
)
from app.modules.audit.service import AuditService


class PaymentGatewayService:
    """Service for payment gateway operations."""
    
    def __init__(self, session: AsyncSession, audit_service: Optional[AuditService] = None):
        self.session = session
        self.repo = PaymentGatewayRepository(session)
        self.audit_service = audit_service
    
    async def initialize_gateways(self) -> List[PaymentGateway]:
        """
        Initialize default payment gateways if they don't exist.
        Called during app startup.
        """
        default_gateways = [
            {
                "name": "Cash on Delivery",
                "code": PaymentGatewayCode.COD.value,
                "description": "Pay when you receive your order",
                "is_enabled": True,  # COD enabled by default
                "display_order": 0
            },
            {
                "name": "bKash",
                "code": PaymentGatewayCode.BKASH.value,
                "description": "Pay with bKash mobile wallet",
                "logo_url": "/static/payment/bkash.png",
                "is_enabled": False,
                "display_order": 1
            },
            {
                "name": "Nagad",
                "code": PaymentGatewayCode.NAGAD.value,
                "description": "Pay with Nagad mobile wallet",
                "logo_url": "/static/payment/nagad.png",
                "is_enabled": False,
                "display_order": 2
            },
            {
                "name": "Rocket",
                "code": PaymentGatewayCode.ROCKET.value,
                "description": "Pay with Rocket mobile banking",
                "logo_url": "/static/payment/rocket.png",
                "is_enabled": False,
                "display_order": 3
            },
            {
                "name": "SSL Commerz",
                "code": PaymentGatewayCode.SSLCOMMERZ.value,
                "description": "Pay with card or mobile banking",
                "logo_url": "/static/payment/sslcommerz.png",
                "is_enabled": False,
                "display_order": 4
            },
            {
                "name": "AmarPay",
                "code": PaymentGatewayCode.AMARPAY.value,
                "description": "Pay with card or mobile banking",
                "logo_url": "/static/payment/amarpay.png",
                "is_enabled": False,
                "display_order": 5
            }
        ]
        
        created = []
        for gateway_data in default_gateways:
            existing = await self.repo.get_by_code(gateway_data["code"])
            if not existing:
                gateway = PaymentGateway(**gateway_data)
                gateway = await self.repo.create(gateway)
                created.append(gateway)
        
        return created
    
    async def get_all_gateways(self) -> List[PaymentGateway]:
        """Get all gateways (admin)."""
        return await self.repo.get_all()
    
    async def get_enabled_methods(self, order_amount: Optional[Decimal] = None) -> List[PaymentMethodPublic]:
        """
        Get enabled payment methods for customers.
        
        Optionally filters by order amount.
        """
        gateways = await self.repo.get_enabled()
        methods = []
        
        for gateway in gateways:
            # Check amount limits
            if order_amount:
                if gateway.min_amount and order_amount < gateway.min_amount:
                    continue
                if gateway.max_amount and order_amount > gateway.max_amount:
                    continue
            
            methods.append(PaymentMethodPublic(
                code=gateway.code,
                name=gateway.name,
                description=gateway.description,
                logo_url=gateway.logo_url,
                min_amount=gateway.min_amount,
                max_amount=gateway.max_amount
            ))
        
        return methods
    
    async def get_gateway(self, gateway_id: UUID) -> PaymentGateway:
        """Get a specific gateway."""
        gateway = await self.repo.get_by_id(gateway_id)
        if not gateway:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Payment gateway not found"
            )
        return gateway
    
    async def get_gateway_by_code(self, code: str) -> PaymentGateway:
        """Get gateway by code."""
        gateway = await self.repo.get_by_code(code)
        if not gateway:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message=f"Payment gateway '{code}' not found"
            )
        return gateway
    
    async def update_gateway(
        self,
        gateway_id: UUID,
        data: PaymentGatewayUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> PaymentGateway:
        """Update a payment gateway configuration."""
        gateway = await self.get_gateway(gateway_id)
        
        # Validate config if provided
        if data.config is not None and gateway.code in GATEWAY_CONFIGS:
            required = GATEWAY_CONFIGS[gateway.code]["required_fields"]
            missing = [f for f in required if f not in data.config]
            if missing and data.is_enabled:
                raise ValidationError(
                    error_code=ErrorCode.VALIDATION_ERROR,
                    message=f"Missing required config fields: {', '.join(missing)}",
                    field="config"
                )
        
        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(gateway, field, value)
        
        gateway = await self.repo.update(gateway)
        
        # Audit log (don't log config for security)
        if self.audit_service:
            safe_details = {k: v for k, v in update_data.items() if k != "config"}
            if "config" in update_data:
                safe_details["config_updated"] = True
            
            await self.audit_service.log_action(
                action="update_payment_gateway",
                actor_id=actor_id,
                target_id=str(gateway.id),
                target_type="payment_gateway",
                details=safe_details,
                request=request
            )
        
        return gateway
    
    async def toggle_gateway(
        self,
        gateway_id: UUID,
        enabled: bool,
        actor_id: str,
        request: Optional[Request] = None
    ) -> PaymentGateway:
        """Enable or disable a payment gateway."""
        gateway = await self.get_gateway(gateway_id)
        
        # Check config before enabling
        if enabled and gateway.code != PaymentGatewayCode.COD.value:
            if not gateway.config:
                raise ValidationError(
                    error_code=ErrorCode.VALIDATION_ERROR,
                    message="Cannot enable gateway without configuration",
                    field="is_enabled"
                )
        
        gateway.is_enabled = enabled
        gateway = await self.repo.update(gateway)
        
        # Audit log
        if self.audit_service:
            await self.audit_service.log_action(
                action="toggle_payment_gateway",
                actor_id=actor_id,
                target_id=str(gateway.id),
                target_type="payment_gateway",
                details={"enabled": enabled, "gateway": gateway.code},
                request=request
            )
        
        return gateway
    
    def get_config_template(self, gateway_code: str) -> dict:
        """Get configuration template for a gateway."""
        if gateway_code not in GATEWAY_CONFIGS:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message=f"Unknown gateway code: {gateway_code}"
            )
        
        return {
            "gateway_code": gateway_code,
            **GATEWAY_CONFIGS[gateway_code]
        }
