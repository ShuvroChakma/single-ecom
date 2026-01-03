"""
Service layer for Daily Rates and price calculation.
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.core.exceptions import NotFoundError
from app.constants.error_codes import ErrorCode
from app.modules.audit.service import AuditService
from app.modules.rates.models import DailyRate
from app.modules.rates.schemas import DailyRateCreate, PriceBreakdown
from app.modules.rates.repository import DailyRateRepository
from app.modules.products.models import Product, ProductVariant, MakingChargeType


# Default tax rate for jewelry in Bangladesh (3% for gold)
DEFAULT_TAX_RATE = Decimal("3.0")


class DailyRateService:
    """Service for DailyRate business logic."""
    
    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.repository = DailyRateRepository(session)
        self.audit_service = audit_service
    
    async def get_current_rates(self) -> List[DailyRate]:
        """Get all current rates."""
        return await self.repository.get_all_current_rates()
    
    async def get_rate(self, metal_type: str, purity: str) -> Optional[DailyRate]:
        """Get current rate for a metal type and purity."""
        return await self.repository.get_current_rate(metal_type, purity)
    
    async def get_rate_history(
        self,
        metal_type: str,
        purity: str,
        limit: int = 30
    ) -> List[DailyRate]:
        """Get rate history for a metal type and purity."""
        return await self.repository.list_history(metal_type, purity, limit)
    
    async def add_rate(
        self,
        data: DailyRateCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> DailyRate:
        """Add a new daily rate."""
        rate_data = data.model_dump(exclude={"effective_date"})
        rate = DailyRate(
            **rate_data,
            created_by=actor_id,
            effective_date=data.effective_date or datetime.utcnow()
        )
        rate = await self.repository.create(rate)
        
        await self.audit_service.log_action(
            action="add_daily_rate",
            actor_id=actor_id,
            target_id=str(rate.id),
            target_type="daily_rate",
            details={
                "metal_type": rate.metal_type,
                "purity": rate.purity,
                "rate_per_gram": str(rate.rate_per_gram)
            },
            request=request
        )
        return rate
    
    async def add_rates_batch(
        self,
        rates_data: List[DailyRateCreate],
        actor_id: str,
        request: Optional[Request] = None
    ) -> List[DailyRate]:
        """Add multiple daily rates at once (e.g., from BAJUS scrape)."""
        rates = []
        for data in rates_data:
            rate_data = data.model_dump(exclude={"effective_date"})
            rate = DailyRate(
                **rate_data,
                created_by=actor_id,
                effective_date=data.effective_date or datetime.utcnow()
            )
            rates.append(rate)
        
        rates = await self.repository.create_many(rates)
        
        await self.audit_service.log_action(
            action="add_daily_rates_batch",
            actor_id=actor_id,
            target_id="batch",
            target_type="daily_rate",
            details={"count": len(rates), "source": rates[0].source if rates else "unknown"},
            request=request
        )
        return rates


class PriceCalculationService:
    """Service for calculating product prices based on current rates."""
    
    def __init__(self, session: AsyncSession):
        self.rate_repository = DailyRateRepository(session)
    
    async def calculate_variant_price(
        self,
        variant: ProductVariant,
        product: Product,
        override_rate: Optional[Decimal] = None
    ) -> PriceBreakdown:
        """
        Calculate price for a product variant.
        
        Formula:
        1. Metal Cost = net_weight × rate_per_gram
        2. Making Charge = based on type (% or fixed)
        3. Subtotal = Metal Cost + Making Charge
        4. Tax = Subtotal × tax_rate
        5. Total = Subtotal + Tax
        """
        # Get current rate for this metal/purity
        if override_rate:
            rate_per_gram = override_rate
        else:
            rate = await self.rate_repository.get_current_rate(
                variant.metal_type.value,
                variant.metal_purity
            )
            if not rate:
                raise NotFoundError(
                    error_code=ErrorCode.RESOURCE_NOT_FOUND,
                    message=f"No rate found for {variant.metal_type.value} {variant.metal_purity}"
                )
            rate_per_gram = rate.rate_per_gram
        
        # 1. Calculate metal cost
        metal_cost = variant.net_weight * rate_per_gram
        
        # 2. Calculate making charge
        making_charge_type = product.base_making_charge_type
        making_charge_value = product.base_making_charge_value
        
        if making_charge_type == MakingChargeType.PERCENTAGE:
            making_charge = metal_cost * (making_charge_value / Decimal("100"))
        elif making_charge_type == MakingChargeType.FIXED_PER_GRAM:
            making_charge = variant.net_weight * making_charge_value
        else:  # FLAT
            making_charge = making_charge_value
        
        # 3. Calculate subtotal
        subtotal = metal_cost + making_charge
        
        # 4. Calculate tax (default 3% for jewelry)
        tax_rate = DEFAULT_TAX_RATE
        tax_amount = subtotal * (tax_rate / Decimal("100"))
        
        # 5. Calculate total
        total_price = subtotal + tax_amount
        
        return PriceBreakdown(
            rate_per_gram=rate_per_gram,
            metal_cost=round(metal_cost, 2),
            making_charge_type=making_charge_type.value,
            making_charge_value=making_charge_value,
            making_charge=round(making_charge, 2),
            subtotal=round(subtotal, 2),
            tax_type="GLOBAL",
            tax_rate=tax_rate,
            tax_amount=round(tax_amount, 2),
            total_price=round(total_price, 2)
        )
    
    async def calculate_all_variant_prices(
        self,
        product: Product
    ) -> List[dict]:
        """Calculate prices for all variants of a product."""
        results = []
        for variant in product.variants:
            try:
                pricing = await self.calculate_variant_price(variant, product)
                results.append({
                    "variant_id": str(variant.id),
                    "sku": variant.sku,
                    "pricing": pricing.model_dump()
                })
            except NotFoundError:
                # Skip variants without rates
                results.append({
                    "variant_id": str(variant.id),
                    "sku": variant.sku,
                    "pricing": None,
                    "error": "Rate not found"
                })
        return results
