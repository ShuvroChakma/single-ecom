"""
API endpoints for Products and ProductVariants.
"""
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.products.service import ProductService, ProductVariantService
from app.modules.products.schemas import (
    ProductCreate, ProductUpdate, ProductResponse, ProductWithVariantsResponse,
    ProductListParams, ProductVariantCreate, ProductVariantUpdate, ProductVariantResponse
)
from app.modules.products.models import Gender, MetalType

router = APIRouter(prefix="/products", tags=["Products"])


async def get_product_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> ProductService:
    return ProductService(session, audit_service)


async def get_variant_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> ProductVariantService:
    return ProductVariantService(session, audit_service)


# ============ PRODUCT ENDPOINTS ============

@router.get("/", response_model=SuccessResponse[dict])
async def list_products(
    request: Request,
    service: ProductService = Depends(get_product_service),
    # Category filters
    category_id: Optional[UUID] = Query(default=None, description="Filter by single category ID"),
    category_ids: Optional[str] = Query(default=None, description="Filter by multiple category IDs (comma-separated)"),
    # Brand filters
    brand_id: Optional[UUID] = Query(default=None, description="Filter by single brand ID"),
    brand_ids: Optional[str] = Query(default=None, description="Filter by multiple brand IDs (comma-separated)"),
    # Collection filters
    collection_id: Optional[UUID] = Query(default=None, description="Filter by single collection ID"),
    collection_ids: Optional[str] = Query(default=None, description="Filter by multiple collection IDs (comma-separated)"),
    # Gender filter
    gender: Optional[Gender] = Query(default=None, description="Filter by gender"),
    genders: Optional[str] = Query(default=None, description="Filter by multiple genders (comma-separated)"),
    # Metal filters
    metal_type: Optional[MetalType] = Query(default=None, description="Filter by metal type"),
    metal_types: Optional[str] = Query(default=None, description="Filter by multiple metal types (comma-separated)"),
    metal_purity: Optional[str] = Query(default=None, description="Filter by metal purity (e.g., 22K, 18K)"),
    metal_purities: Optional[str] = Query(default=None, description="Filter by multiple purities (comma-separated)"),
    # Size filter
    size: Optional[str] = Query(default=None, description="Filter by size"),
    sizes: Optional[str] = Query(default=None, description="Filter by multiple sizes (comma-separated)"),
    # Weight range
    min_weight: Optional[Decimal] = Query(default=None, description="Minimum weight in grams"),
    max_weight: Optional[Decimal] = Query(default=None, description="Maximum weight in grams"),
    # Stock filter
    in_stock: Optional[bool] = Query(default=None, description="Filter by stock availability"),
    # Status filters
    is_featured: Optional[bool] = Query(default=None, description="Filter featured products only"),
    # Search
    search: Optional[str] = Query(default=None, description="Search in name, SKU, description"),
    # Sorting
    sort_by: Optional[str] = Query(default="newest", description="Sort by: newest, oldest, name_asc, name_desc, featured"),
    # Pagination
    page: int = Query(default=1, ge=1, description="Page number"),
    per_page: int = Query(default=20, ge=1, le=100, description="Items per page"),
    # IDs filter
    ids: Optional[str] = Query(default=None, description="Get specific product IDs (comma-separated)"),
    exclude_ids: Optional[str] = Query(default=None, description="Exclude specific product IDs (comma-separated)"),
):
    """
    List products with advanced filters and pagination (public).

    Supports multiple filter combinations for:
    - Category pages: Use category_id or category_ids
    - Brand pages: Use brand_id or brand_ids
    - Featured sections: Use is_featured=true
    - Search results: Use search parameter
    - Price/Weight filtering: Use min_weight, max_weight
    - Metal/Purity filtering: Use metal_type, metal_types, metal_purity
    - Stock filtering: Use in_stock=true for available products
    """
    # Helper to parse comma-separated UUIDs
    def parse_uuids(value: Optional[str]) -> Optional[List[UUID]]:
        if not value:
            return None
        try:
            return [UUID(v.strip()) for v in value.split(",") if v.strip()]
        except ValueError:
            return None

    # Helper to parse comma-separated strings
    def parse_strings(value: Optional[str]) -> Optional[List[str]]:
        if not value:
            return None
        return [v.strip() for v in value.split(",") if v.strip()]

    # Helper to parse comma-separated genders
    def parse_genders(value: Optional[str]) -> Optional[List[Gender]]:
        if not value:
            return None
        try:
            return [Gender(v.strip().upper()) for v in value.split(",") if v.strip()]
        except ValueError:
            return None

    # Helper to parse comma-separated metal types
    def parse_metal_types(value: Optional[str]) -> Optional[List[MetalType]]:
        if not value:
            return None
        try:
            return [MetalType(v.strip().upper()) for v in value.split(",") if v.strip()]
        except ValueError:
            return None

    # Parse EAV attribute filters: attr_{code}=value1,value2
    attribute_filters: dict = {}
    for key, value in request.query_params.items():
        if key.startswith('attr_') and value:
            code = key[5:]  # strip 'attr_' prefix
            values = [v.strip() for v in value.split(',') if v.strip()]
            if values:
                attribute_filters[code] = values

    params = ProductListParams(
        attribute_filters=attribute_filters if attribute_filters else None,
        category_id=category_id,
        category_ids=parse_uuids(category_ids),
        brand_id=brand_id,
        brand_ids=parse_uuids(brand_ids),
        collection_id=collection_id,
        collection_ids=parse_uuids(collection_ids),
        gender=gender,
        genders=parse_genders(genders),
        metal_type=metal_type,
        metal_types=parse_metal_types(metal_types),
        metal_purity=metal_purity,
        metal_purities=parse_strings(metal_purities),
        size=size,
        sizes=parse_strings(sizes),
        min_weight=min_weight,
        max_weight=max_weight,
        in_stock=in_stock,
        is_featured=is_featured,
        is_active=True,
        search=search,
        sort_by=sort_by,
        page=page,
        per_page=per_page,
        ids=parse_uuids(ids),
        exclude_ids=parse_uuids(exclude_ids),
    )

    products, total = await service.list_products(params)

    return create_success_response(
        message="Products retrieved successfully",
        data={
            "items": [ProductWithVariantsResponse.model_validate(p) for p in products],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page,
            "filters_applied": {
                "category_id": str(category_id) if category_id else None,
                "brand_id": str(brand_id) if brand_id else None,
                "collection_id": str(collection_id) if collection_id else None,
                "gender": gender.value if gender else None,
                "metal_type": metal_type.value if metal_type else None,
                "in_stock": in_stock,
                "is_featured": is_featured,
                "search": search,
                "sort_by": sort_by,
            }
        }
    )


@router.get("/id/{product_id}", response_model=SuccessResponse[ProductWithVariantsResponse])
async def get_product_by_id(
    product_id: UUID,
    service: ProductService = Depends(get_product_service)
):
    """Get product by ID with variants (public)."""
    product = await service.get_product(product_id)
    return create_success_response(
        message="Product retrieved successfully",
        data=ProductWithVariantsResponse.model_validate(product)
    )


@router.get("/{slug}", response_model=SuccessResponse[ProductWithVariantsResponse])
async def get_product_by_slug(
    slug: str,
    service: ProductService = Depends(get_product_service)
):
    """Get product by slug with variants (public)."""
    product = await service.get_product_by_slug(slug)
    return create_success_response(
        message="Product retrieved successfully",
        data=ProductWithVariantsResponse.model_validate(product)
    )


@router.post(
    "/admin/products",
    response_model=SuccessResponse[ProductWithVariantsResponse],
    status_code=201
)
async def create_product(
    data: ProductCreate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: ProductService = Depends(get_product_service)
):
    """Create a new product (admin)."""
    product = await service.create_product(data, str(current_user.id), request)
    return create_success_response(
        message="Product created successfully",
        data=ProductWithVariantsResponse.model_validate(product)
    )


@router.put(
    "/admin/products/{product_id}",
    response_model=SuccessResponse[ProductWithVariantsResponse]
)
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: ProductService = Depends(get_product_service)
):
    """Update a product (admin)."""
    product = await service.update_product(product_id, data, str(current_user.id), request)
    return create_success_response(
        message="Product updated successfully",
        data=ProductWithVariantsResponse.model_validate(product)
    )


@router.delete(
    "/admin/products/{product_id}",
    response_model=SuccessResponse[dict]
)
async def delete_product(
    product_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions(["products:delete"])),
    service: ProductService = Depends(get_product_service)
):
    """Delete a product and its variants (admin)."""
    await service.delete_product(product_id, str(current_user.id), request)
    return create_success_response(
        message="Product deleted successfully",
        data={"deleted": True}
    )


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
    current_user: User = Depends(require_permissions(["products:write"])),
    service: ProductVariantService = Depends(get_variant_service)
):
    """Create a new product variant (admin)."""
    variant = await service.create_variant(product_id, data, str(current_user.id), request)
    return create_success_response(
        message="Variant created successfully",
        data=ProductVariantResponse.model_validate(variant)
    )


@router.put(
    "/admin/variants/{variant_id}",
    response_model=SuccessResponse[ProductVariantResponse]
)
async def update_variant(
    variant_id: UUID,
    data: ProductVariantUpdate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: ProductVariantService = Depends(get_variant_service)
):
    """Update a product variant (admin)."""
    variant = await service.update_variant(variant_id, data, str(current_user.id), request)
    return create_success_response(
        message="Variant updated successfully",
        data=ProductVariantResponse.model_validate(variant)
    )


@router.delete(
    "/admin/variants/{variant_id}",
    response_model=SuccessResponse[dict]
)
async def delete_variant(
    variant_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions(["products:delete"])),
    service: ProductVariantService = Depends(get_variant_service)
):
    """Delete a product variant (admin)."""
    await service.delete_variant(variant_id, str(current_user.id), request)
    return create_success_response(
        message="Variant deleted successfully",
        data={"deleted": True}
    )
