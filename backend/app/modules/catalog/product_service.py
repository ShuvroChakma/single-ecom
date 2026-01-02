"""
Service layer for Product and ProductVariant business logic.
"""
from typing import Optional, List, Tuple
from uuid import UUID
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ValidationError, NotFoundError
from app.constants.error_codes import ErrorCode
from app.modules.audit.service import AuditService
from app.modules.catalog.product_models import Product, ProductVariant, MetalType
from app.modules.catalog.product_schemas import (
    ProductCreate, ProductUpdate, ProductListParams,
    ProductVariantCreate, ProductVariantUpdate
)
from app.modules.catalog.product_repository import ProductRepository, ProductVariantRepository
from app.modules.catalog.repository import CategoryRepository


class ProductService:
    """Service for Product business logic."""
    
    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.session = session
        self.repository = ProductRepository(session)
        self.variant_repository = ProductVariantRepository(session)
        self.category_repository = CategoryRepository(session)
        self.audit_service = audit_service
    
    async def list_products(
        self, params: ProductListParams
    ) -> Tuple[List[Product], int]:
        """List products with filters."""
        return await self.repository.list_with_filters(
            category_id=params.category_id,
            brand_id=params.brand_id,
            collection_id=params.collection_id,
            gender=params.gender.value if params.gender else None,
            metal_type=params.metal_type,
            is_featured=params.is_featured,
            is_active=params.is_active,
            search=params.search,
            page=params.page,
            per_page=params.per_page
        )
    
    async def get_product(self, product_id: UUID) -> Product:
        """Get product by ID with variants."""
        product = await self.repository.get_with_variants(product_id)
        if not product:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Product not found"
            )
        return product
    
    async def get_product_by_slug(self, slug: str) -> Product:
        """Get product by slug with variants."""
        product = await self.repository.get_by_slug(slug)
        if not product:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Product not found"
            )
        return product
    
    async def create_product(
        self,
        data: ProductCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Product:
        """Create a new product with optional variants."""
        # Validate category exists
        category = await self.category_repository.get(data.category_id)
        if not category:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Category not found"
            )
        
        # Extract variants for separate creation
        variants_data = data.variants
        product_data = data.model_dump(exclude={"variants"})
        
        try:
            product = Product(**product_data)
            product = await self.repository.create(product)
        except IntegrityError as e:
            error_str = str(e.orig)
            if "products_sku_base" in error_str or "ix_products_sku_base" in error_str:
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"SKU '{data.sku_base}' already exists",
                    field="sku_base"
                )
            if "products_slug" in error_str or "ix_products_slug" in error_str:
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Slug '{data.slug}' already exists",
                    field="slug"
                )
            raise
        
        # Create variants if provided
        if variants_data:
            variants = []
            for v_data in variants_data:
                variant = ProductVariant(**v_data.model_dump(), product_id=product.id)
                variants.append(variant)
            await self.variant_repository.create_many(variants)
            
            # Reload product with variants
            product = await self.repository.get_with_variants(product.id)
        
        await self.audit_service.log_action(
            action="create_product",
            actor_id=actor_id,
            target_id=str(product.id),
            target_type="product",
            details={"name": product.name, "sku_base": product.sku_base},
            request=request
        )
        return product
    
    async def update_product(
        self,
        product_id: UUID,
        data: ProductUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Product:
        """Update a product."""
        product = await self.get_product(product_id)
        update_data = data.model_dump(exclude_unset=True)
        
        # Validate new category if changing
        if "category_id" in update_data:
            category = await self.category_repository.get(update_data["category_id"])
            if not category:
                raise NotFoundError(
                    error_code=ErrorCode.RESOURCE_NOT_FOUND,
                    message="Category not found"
                )
        
        try:
            product = await self.repository.update(product, update_data)
        except IntegrityError as e:
            error_str = str(e.orig)
            if "products_sku_base" in error_str or "ix_products_sku_base" in error_str:
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"SKU '{data.sku_base}' already exists",
                    field="sku_base"
                )
            if "products_slug" in error_str or "ix_products_slug" in error_str:
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Slug '{data.slug}' already exists",
                    field="slug"
                )
            raise
        
        await self.audit_service.log_action(
            action="update_product",
            actor_id=actor_id,
            target_id=str(product_id),
            target_type="product",
            details=update_data,
            request=request
        )
        return product
    
    async def delete_product(
        self,
        product_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> None:
        """Delete a product and its variants."""
        product = await self.get_product(product_id)
        await self.repository.delete(product)
        
        await self.audit_service.log_action(
            action="delete_product",
            actor_id=actor_id,
            target_id=str(product_id),
            target_type="product",
            details={"name": product.name},
            request=request
        )


class ProductVariantService:
    """Service for ProductVariant business logic."""
    
    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.session = session
        self.repository = ProductVariantRepository(session)
        self.product_repository = ProductRepository(session)
        self.audit_service = audit_service
    
    async def get_variant(self, variant_id: UUID) -> ProductVariant:
        """Get variant by ID."""
        variant = await self.repository.get(variant_id)
        if not variant:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Product variant not found"
            )
        return variant
    
    async def create_variant(
        self,
        product_id: UUID,
        data: ProductVariantCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> ProductVariant:
        """Create a new product variant."""
        # Validate product exists
        product = await self.product_repository.get(product_id)
        if not product:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Product not found"
            )
        
        try:
            variant = ProductVariant(**data.model_dump(), product_id=product_id)
            variant = await self.repository.create(variant)
        except IntegrityError as e:
            if "product_variants_sku" in str(e.orig) or "ix_product_variants_sku" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Variant SKU '{data.sku}' already exists",
                    field="sku"
                )
            raise
        
        await self.audit_service.log_action(
            action="create_variant",
            actor_id=actor_id,
            target_id=str(variant.id),
            target_type="product_variant",
            details={"sku": variant.sku, "product_id": str(product_id)},
            request=request
        )
        return variant
    
    async def update_variant(
        self,
        variant_id: UUID,
        data: ProductVariantUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> ProductVariant:
        """Update a product variant."""
        variant = await self.get_variant(variant_id)
        update_data = data.model_dump(exclude_unset=True)
        
        try:
            variant = await self.repository.update(variant, update_data)
        except IntegrityError as e:
            if "product_variants_sku" in str(e.orig) or "ix_product_variants_sku" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Variant SKU '{data.sku}' already exists",
                    field="sku"
                )
            raise
        
        await self.audit_service.log_action(
            action="update_variant",
            actor_id=actor_id,
            target_id=str(variant_id),
            target_type="product_variant",
            details=update_data,
            request=request
        )
        return variant
    
    async def delete_variant(
        self,
        variant_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> None:
        """Delete a product variant."""
        variant = await self.get_variant(variant_id)
        await self.repository.delete(variant)
        
        await self.audit_service.log_action(
            action="delete_variant",
            actor_id=actor_id,
            target_id=str(variant_id),
            target_type="product_variant",
            details={"sku": variant.sku},
            request=request
        )
