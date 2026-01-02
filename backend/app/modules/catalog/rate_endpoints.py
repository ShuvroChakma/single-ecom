"""
API endpoints for Daily Rates.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.catalog.rate_service import DailyRateService, PriceCalculationService
from app.modules.catalog.rate_schemas import DailyRateCreate, DailyRateResponse, CurrentRatesResponse
from app.modules.catalog.product_service import ProductService

router = APIRouter(prefix="/catalog", tags=["Daily Rates"])


@router.get("/rates/current", response_model=SuccessResponse[CurrentRatesResponse])
async def get_current_rates(
    session: AsyncSession = Depends(get_db)
):
    """Get current rates for all metals/purities (public)."""
    service = DailyRateService(session, AuditService(session))
    rates = await service.get_current_rates()
    
    return SuccessResponse(data=CurrentRatesResponse(
        rates=[DailyRateResponse.model_validate(r) for r in rates],
        last_updated=max([r.effective_date for r in rates]) if rates else datetime.utcnow()
    ))


@router.get("/rates/history", response_model=SuccessResponse[List[DailyRateResponse]])
async def get_rate_history(
    metal_type: str,
    purity: str,
    limit: int = Query(default=30, ge=1, le=365),
    session: AsyncSession = Depends(get_db)
):
    """Get rate history for a metal type and purity (public)."""
    service = DailyRateService(session, AuditService(session))
    rates = await service.get_rate_history(metal_type, purity, limit)
    return SuccessResponse(data=[DailyRateResponse.model_validate(r) for r in rates])


@router.post(
    "/admin/rates",
    response_model=SuccessResponse[DailyRateResponse],
    status_code=201
)
async def add_rate(
    data: DailyRateCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Add a new daily rate (admin)."""
    service = DailyRateService(session, AuditService(session))
    rate = await service.add_rate(data, str(current_user.id), request)
    return SuccessResponse(data=DailyRateResponse.model_validate(rate))


@router.post(
    "/admin/rates/batch",
    response_model=SuccessResponse[List[DailyRateResponse]],
    status_code=201
)
async def add_rates_batch(
    data: List[DailyRateCreate],
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Add multiple daily rates at once (admin, for BAJUS import)."""
    service = DailyRateService(session, AuditService(session))
    rates = await service.add_rates_batch(data, str(current_user.id), request)
    return SuccessResponse(data=[DailyRateResponse.model_validate(r) for r in rates])


@router.get("/products/{product_id}/pricing", response_model=SuccessResponse[dict])
async def get_product_pricing(
    product_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Calculate prices for all variants of a product (public)."""
    product_service = ProductService(session, AuditService(session))
    product = await product_service.get_product(product_id)
    
    price_service = PriceCalculationService(session)
    variant_prices = await price_service.calculate_all_variant_prices(product)
    
    return SuccessResponse(data={
        "product_id": str(product_id),
        "name": product.name,
        "variants": variant_prices
    })
