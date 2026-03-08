"""
Service layer for Promo Code business logic.
"""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from app.core.exceptions import NotFoundError, ValidationError
from app.constants.error_codes import ErrorCode
from app.modules.promo_codes.models import PromoCode, DiscountType
from app.modules.promo_codes.repository import PromoCodeRepository, PromoCodeUseRepository
from app.modules.promo_codes.schemas import (
    PromoCodeCreate,
    PromoCodeUpdate,
    PromoValidationResult,
    PromoCodeStats
)
from app.modules.audit.service import AuditService


class PromoCodeService:
    """Service for promo code operations."""
    
    def __init__(self, session: AsyncSession, audit_service: Optional[AuditService] = None):
        self.session = session
        self.repo = PromoCodeRepository(session)
        self.use_repo = PromoCodeUseRepository(session)
        self.audit_service = audit_service
    
    async def get_promo_codes(self, include_inactive: bool = False) -> List[PromoCode]:
        """Get all promo codes."""
        return await self.repo.get_all(include_inactive=include_inactive)
    
    async def get_promo_code(self, promo_id: UUID) -> PromoCode:
        """Get a specific promo code."""
        promo = await self.repo.get_by_id(promo_id)
        if not promo:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Promo code not found"
            )
        return promo
    
    async def create_promo_code(
        self,
        data: PromoCodeCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> PromoCode:
        """Create a new promo code."""
        # Check if code already exists
        existing = await self.repo.get_by_code(data.code)
        if existing:
            raise ValidationError(
                error_code=ErrorCode.DUPLICATE_RESOURCE,
                message=f"Promo code '{data.code}' already exists",
                field="code"
            )
        
        # Validate dates
        if data.expires_at <= data.starts_at:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Expiry date must be after start date",
                field="expires_at"
            )
        
        # Validate percentage
        if data.discount_type == DiscountType.PERCENTAGE and data.discount_value > 100:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Percentage discount cannot exceed 100%",
                field="discount_value"
            )
        
        promo = PromoCode(
            **data.model_dump(),
            created_by=UUID(actor_id) if actor_id else None
        )
        promo = await self.repo.create(promo)
        
        # Audit log
        if self.audit_service:
            await self.audit_service.log_action(
                action="create_promo_code",
                actor_id=actor_id,
                target_id=str(promo.id),
                target_type="promo_code",
                details={"code": promo.code, "discount_type": promo.discount_type.value},
                request=request
            )
        
        return promo
    
    async def update_promo_code(
        self,
        promo_id: UUID,
        data: PromoCodeUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> PromoCode:
        """Update a promo code."""
        promo = await self.get_promo_code(promo_id)
        
        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(promo, field, value)
        
        promo = await self.repo.update(promo)
        
        # Audit log
        if self.audit_service:
            await self.audit_service.log_action(
                action="update_promo_code",
                actor_id=actor_id,
                target_id=str(promo.id),
                target_type="promo_code",
                details={"updated_fields": list(update_data.keys())},
                request=request
            )
        
        return promo
    
    async def delete_promo_code(
        self,
        promo_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> bool:
        """Delete a promo code."""
        promo = await self.get_promo_code(promo_id)
        code = promo.code
        
        await self.repo.delete(promo)
        
        # Audit log
        if self.audit_service:
            await self.audit_service.log_action(
                action="delete_promo_code",
                actor_id=actor_id,
                target_id=str(promo_id),
                target_type="promo_code",
                details={"code": code},
                request=request
            )
        
        return True
    
    async def validate_promo(
        self,
        code: str,
        order_amount: Decimal,
        customer_id: Optional[UUID] = None
    ) -> PromoValidationResult:
        """
        Validate a promo code for an order.
        
        Returns validation result with calculated discount.
        """
        code = code.upper().strip()
        
        # Find promo code
        promo = await self.repo.get_by_code(code)
        
        if not promo:
            return PromoValidationResult(
                valid=False,
                code=code,
                message="Invalid promo code"
            )
        
        # Check if active
        if not promo.is_active:
            return PromoValidationResult(
                valid=False,
                code=code,
                message="This promo code is no longer active"
            )
        
        # Check date validity
        now = datetime.utcnow()
        if promo.starts_at > now:
            return PromoValidationResult(
                valid=False,
                code=code,
                message="This promo code is not yet active"
            )
        
        if promo.expires_at <= now:
            return PromoValidationResult(
                valid=False,
                code=code,
                message="This promo code has expired"
            )
        
        # Check total usage limit
        if promo.max_total_uses and promo.current_uses >= promo.max_total_uses:
            return PromoValidationResult(
                valid=False,
                code=code,
                message="This promo code has reached its usage limit"
            )
        
        # Check per-user limit (if customer provided)
        if customer_id:
            user_uses = await self.use_repo.get_user_uses(promo.id, customer_id)
            if user_uses >= promo.max_uses_per_user:
                return PromoValidationResult(
                    valid=False,
                    code=code,
                    message="You have already used this promo code"
                )
        
        # Check minimum order amount
        if promo.min_order_amount and order_amount < promo.min_order_amount:
            return PromoValidationResult(
                valid=False,
                code=code,
                message=f"Minimum order amount of ৳{promo.min_order_amount} required"
            )
        
        # Calculate discount
        discount_amount = Decimal("0")
        free_shipping = False
        
        if promo.discount_type == DiscountType.PERCENTAGE:
            discount_amount = order_amount * (promo.discount_value / 100)
            # Apply max discount cap
            if promo.max_discount and discount_amount > promo.max_discount:
                discount_amount = promo.max_discount
                
        elif promo.discount_type == DiscountType.FIXED_AMOUNT:
            discount_amount = min(promo.discount_value, order_amount)
            
        elif promo.discount_type == DiscountType.FREE_SHIPPING:
            free_shipping = True
            # discount_amount remains 0 as shipping is handled separately
        
        new_total = order_amount - discount_amount
        
        return PromoValidationResult(
            valid=True,
            code=code,
            discount_type=promo.discount_type,
            discount_value=promo.discount_value,
            discount_amount=round(discount_amount, 2),
            message="Promo code applied successfully",
            new_total=round(new_total, 2),
            free_shipping=free_shipping
        )
    
    async def get_stats(self, promo_id: UUID) -> PromoCodeStats:
        """Get usage statistics for a promo code."""
        await self.get_promo_code(promo_id)  # Verify exists
        stats = await self.use_repo.get_stats(promo_id)
        return PromoCodeStats(**stats)
