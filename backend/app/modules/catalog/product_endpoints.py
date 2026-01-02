"""
API endpoints for Products and ProductVariants.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.catalog.product_service import ProductService, ProductVariantService
from app.modules.catalog.product_schemas import (
    ProductCreate, ProductUpdate, ProductResponse, ProductWithVariantsResponse,
    ProductListParams, ProductVariantCreate, ProductVariantUpdate, ProductVariantResponse
)
from app.modules.catalog.product_models import Gender, MetalType

router = APIRouter(prefix="/catalog", tags=["Products"])


# ============ PRODUCT ENDPOINTS ============

@router.get("/products", response_model=SuccessResponse[dict])
async def list_products(
    session: AsyncSession = Depends(get_db),
    category_id: Optional[UUID] = None,
    brand_id: Optional[UUID] = None,
    collection_id: Optional[UUID] = None,
    gender: Optional[Gender] = None,
    metal_type: Optional[MetalType] = None,
    is_featured: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100)
):
    """List products with filters and pagination (public)."""
    params = ProductListParams(
        category_id=category_id,
        brand_id=brand_id,
        collection_id=collection_id,
        gender=gender,
        metal_type=metal_type,
        is_featured=is_featured,
        is_active=True,
        search=search,
        page=page,
        per_page=per_page
    )
    
    service = ProductService(session, AuditService(session))
    products, total = await service.list_products(params)
    
    return SuccessResponse(data={
        "items": [ProductWithVariantsResponse.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    })


@router.get("/products/{slug}", response_model=SuccessResponse[ProductWithVariantsResponse])
async def get_product_by_slug(
    slug: str,
    session: AsyncSession = Depends(get_db)
):
    """Get product by slug with variants (public)."""
    service = ProductService(session, AuditService(session))
    product = await service.get_product_by_slug(slug)
    return SuccessResponse(data=ProductWithVariantsResponse.model_validate(product))


@router.post(
    "/admin/products",
    response_model=SuccessResponse[ProductWithVariantsResponse],
    status_code=201
)
async def create_product(
    data: ProductCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Create a new product (admin)."""
    service = ProductService(session, AuditService(session))
    product = await service.create_product(data, str(current_user.id), request)
    return SuccessResponse(data=ProductWithVariantsResponse.model_validate(product))


@router.put(
    "/admin/products/{product_id}",
    response_model=SuccessResponse[ProductWithVariantsResponse]
)
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Update a product (admin)."""
    service = ProductService(session, AuditService(session))
    product = await service.update_product(product_id, data, str(current_user.id), request)
    return SuccessResponse(data=ProductWithVariantsResponse.model_validate(product))


@router.delete(
    "/admin/products/{product_id}",
    response_model=SuccessResponse[dict]
)
async def delete_product(
    product_id: UUID,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:delete"]))
):
    """Delete a product and its variants (admin)."""
    service = ProductService(session, AuditService(session))
    await service.delete_product(product_id, str(current_user.id), request)
    return SuccessResponse(data={"message": "Product deleted successfully"})


# ============ PRODUCT VARIANT ENDPOINTS ============

@router.post(
    "/admin/products/{product_id}/variants",
    response_model=SuccessResponse[ProductVariantResponse],
    status_code=201
)
async def create_variant(
    product_id: UUID,
    data: ProductVariantCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Create a new product variant (admin)."""
    service = ProductVariantService(session, AuditService(session))
    variant = await service.create_variant(product_id, data, str(current_user.id), request)
    return SuccessResponse(data=ProductVariantResponse.model_validate(variant))


@router.put(
    "/admin/variants/{variant_id}",
    response_model=SuccessResponse[ProductVariantResponse]
)
async def update_variant(
    variant_id: UUID,
    data: ProductVariantUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Update a product variant (admin)."""
    service = ProductVariantService(session, AuditService(session))
    variant = await service.update_variant(variant_id, data, str(current_user.id), request)
    return SuccessResponse(data=ProductVariantResponse.model_validate(variant))


@router.delete(
    "/admin/variants/{variant_id}",
    response_model=SuccessResponse[dict]
)
async def delete_variant(
    variant_id: UUID,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:delete"]))
):
    """Delete a product variant (admin)."""
    service = ProductVariantService(session, AuditService(session))
    await service.delete_variant(variant_id, str(current_user.id), request)
    return SuccessResponse(data={"message": "Variant deleted successfully"})
