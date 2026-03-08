"""
API endpoints for Daily Rates.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, date as DateType

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.constants.permissions import PermissionEnum
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.rates.service import DailyRateService, PriceCalculationService
from app.modules.rates.schemas import DailyRateCreate, DailyRateResponse, CurrentRatesResponse, SyncResult
from app.modules.products.service import ProductService

router = APIRouter(prefix="/products", tags=["Daily Rates"])


async def get_rate_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> DailyRateService:
    return DailyRateService(session, audit_service)


async def get_product_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> ProductService:
    return ProductService(session, audit_service)


async def get_price_service(
    session: AsyncSession = Depends(get_db)
) -> PriceCalculationService:
    return PriceCalculationService(session)


@router.get("/rates/current", response_model=SuccessResponse[CurrentRatesResponse])
async def get_current_rates(
    service: DailyRateService = Depends(get_rate_service)
):
    """Get current rates for all metals/purities (public)."""
    rates = await service.get_current_rates()
    
    return create_success_response(
        message="Current rates retrieved successfully",
        data=CurrentRatesResponse(
            rates=[DailyRateResponse.model_validate(r) for r in rates],
            last_updated=max([r.effective_date for r in rates]) if rates else datetime.utcnow()
        )
    )


@router.get("/rates/history")
async def get_rate_history(
    metal_type: str,
    purity: str,
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    date: Optional[DateType] = Query(default=None, description="Filter by date (YYYY-MM-DD)"),
    service: DailyRateService = Depends(get_rate_service)
):
    """Get paginated rate history for a metal type and purity (public)."""
    date_dt = datetime.combine(date, datetime.min.time()) if date else None
    rates, total = await service.get_rate_history(metal_type, purity, limit, offset, date_dt)
    return create_success_response(
        message="Rate history retrieved successfully",
        data={
            "items": [DailyRateResponse.model_validate(r) for r in rates],
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    )


@router.post(
    "/admin/rates",
    response_model=SuccessResponse[DailyRateResponse],
    status_code=201
)
async def add_rate(
    data: DailyRateCreate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.RATES_WRITE])),
    service: DailyRateService = Depends(get_rate_service)
):
    """Add a new daily rate (admin)."""
    rate = await service.add_rate(data, str(current_user.id), request)
    return create_success_response(
        message="Rate added successfully",
        data=DailyRateResponse.model_validate(rate)
    )


@router.post(
    "/admin/rates/batch",
    response_model=SuccessResponse[List[DailyRateResponse]],
    status_code=201
)
async def add_rates_batch(
    data: List[DailyRateCreate],
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.RATES_WRITE])),
    service: DailyRateService = Depends(get_rate_service)
):
    """Add multiple daily rates at once (admin, for BAJUS import)."""
    rates = await service.add_rates_batch(data, str(current_user.id), request)
    return create_success_response(
        message="Rates added successfully",
        data=[DailyRateResponse.model_validate(r) for r in rates]
    )


@router.post(
    "/admin/rates/sync-bajus",
    response_model=SuccessResponse[SyncResult],
    status_code=200
)
async def sync_rates_from_bajus(
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.RATES_WRITE])),
    service: DailyRateService = Depends(get_rate_service)
):
    """Scrape BAJUS website and save current gold/silver rates (admin)."""
    result = await service.sync_from_bajus(str(current_user.id), request)
    return create_success_response(
        message=result.message,
        data=result
    )


@router.get("/products/{product_id}/pricing", response_model=SuccessResponse[dict])
async def get_product_pricing(
    product_id: UUID,
    product_service: ProductService = Depends(get_product_service),
    price_service: PriceCalculationService = Depends(get_price_service)
):
    """Calculate prices for all variants of a product (public)."""
    product = await product_service.get_product(product_id)
    variant_prices = await price_service.calculate_all_variant_prices(product)
    
    return create_success_response(
        message="Product pricing calculated successfully",
        data={
            "product_id": str(product_id),
            "name": product.name,
            "variants": variant_prices
        }
    )
