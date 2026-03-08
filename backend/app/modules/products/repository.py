"""
Repository for Product and ProductVariant database operations.
"""
from typing import Optional, List, Tuple
from uuid import UUID
from decimal import Decimal
from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, exists
from datetime import datetime, timezone

from app.modules.products.models import Product, ProductVariant, MetalType
from app.modules.products.schemas import ProductListParams
from app.modules.attributes.models import Attribute, ProductAttributeValue


class ProductRepository:
    """Repository for Product database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, product_id: UUID) -> Optional[Product]:
        """Get product by ID."""
        result = await self.session.execute(
            select(Product).where(Product.id == product_id)
        )
        return result.scalar_one_or_none()
    
    async def get_with_variants(self, product_id: UUID) -> Optional[Product]:
        """Get product by ID with variants loaded."""
        result = await self.session.execute(
            select(Product)
            .options(selectinload(Product.variants))
            .where(Product.id == product_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_slug(self, slug: str) -> Optional[Product]:
        """Get product by slug with variants."""
        result = await self.session.execute(
            select(Product)
            .options(selectinload(Product.variants))
            .where(Product.slug == slug)
        )
        return result.scalar_one_or_none()
    
    async def get_by_sku(self, sku_base: str) -> Optional[Product]:
        """Get product by base SKU."""
        result = await self.session.execute(
            select(Product).where(Product.sku_base == sku_base)
        )
        return result.scalar_one_or_none()
    
    async def list_with_filters(
        self,
        params: ProductListParams
    ) -> Tuple[List[Product], int]:
        """List products with advanced filters and pagination."""
        query = select(Product).options(selectinload(Product.variants))
        filters = []

        # ===== ID FILTERS =====
        if params.ids:
            filters.append(Product.id.in_(params.ids))

        if params.exclude_ids:
            filters.append(Product.id.notin_(params.exclude_ids))

        # ===== CATEGORY FILTERS =====
        if params.category_id:
            filters.append(Product.category_id == params.category_id)
        elif params.category_ids:
            filters.append(Product.category_id.in_(params.category_ids))

        # ===== BRAND FILTERS =====
        if params.brand_id:
            filters.append(Product.brand_id == params.brand_id)
        elif params.brand_ids:
            filters.append(Product.brand_id.in_(params.brand_ids))

        # ===== COLLECTION FILTERS =====
        if params.collection_id:
            filters.append(Product.collection_id == params.collection_id)
        elif params.collection_ids:
            filters.append(Product.collection_id.in_(params.collection_ids))

        # ===== GENDER FILTERS =====
        if params.gender:
            filters.append(Product.gender == params.gender)
        elif params.genders:
            filters.append(Product.gender.in_(params.genders))

        # ===== STATUS FILTERS =====
        if params.is_featured is not None:
            filters.append(Product.is_featured == params.is_featured)

        if params.is_active is not None:
            filters.append(Product.is_active == params.is_active)

        # ===== SEARCH =====
        if params.search:
            search_filter = f"%{params.search}%"
            filters.append(
                or_(
                    Product.name.ilike(search_filter),
                    Product.sku_base.ilike(search_filter),
                    Product.description.ilike(search_filter)
                )
            )

        # ===== VARIANT-BASED FILTERS (metal, purity, size, stock, weight) =====
        variant_filters = []

        # Metal type filter
        if params.metal_type:
            variant_filters.append(ProductVariant.metal_type == params.metal_type)
        elif params.metal_types:
            variant_filters.append(ProductVariant.metal_type.in_(params.metal_types))

        # Metal purity filter
        if params.metal_purity:
            variant_filters.append(ProductVariant.metal_purity == params.metal_purity)
        elif params.metal_purities:
            variant_filters.append(ProductVariant.metal_purity.in_(params.metal_purities))

        # Size filter
        if params.size:
            variant_filters.append(ProductVariant.size == params.size)
        elif params.sizes:
            variant_filters.append(ProductVariant.size.in_(params.sizes))

        # In-stock filter
        if params.in_stock is True:
            variant_filters.append(ProductVariant.stock_quantity > 0)
        elif params.in_stock is False:
            variant_filters.append(ProductVariant.stock_quantity == 0)

        # Weight range filter
        if params.min_weight is not None:
            variant_filters.append(ProductVariant.net_weight >= params.min_weight)
        if params.max_weight is not None:
            variant_filters.append(ProductVariant.net_weight <= params.max_weight)

        # ===== EAV ATTRIBUTE FILTERS =====
        if params.attribute_filters:
            for attr_code, values in params.attribute_filters.items():
                if values:
                    attr_subquery = (
                        select(ProductAttributeValue.product_id)
                        .join(Attribute, ProductAttributeValue.attribute_id == Attribute.id)
                        .where(
                            ProductAttributeValue.product_id == Product.id,
                            Attribute.code == attr_code,
                            ProductAttributeValue.value.in_(values)
                        )
                    )
                    filters.append(exists(attr_subquery))

        # If we have variant filters, add EXISTS subquery
        if variant_filters:
            variant_subquery = (
                select(ProductVariant.product_id)
                .where(
                    and_(
                        ProductVariant.product_id == Product.id,
                        ProductVariant.is_active == True,
                        *variant_filters
                    )
                )
            )
            filters.append(exists(variant_subquery))

        # Apply all filters
        if filters:
            query = query.where(and_(*filters))

        # ===== COUNT QUERY =====
        count_query = select(func.count(Product.id))
        if filters:
            count_query = count_query.where(and_(*filters))

        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        # ===== SORTING =====
        sort_by = params.sort_by or "newest"
        if sort_by == "newest":
            query = query.order_by(Product.created_at.desc())
        elif sort_by == "oldest":
            query = query.order_by(Product.created_at.asc())
        elif sort_by == "name_asc":
            query = query.order_by(Product.name.asc())
        elif sort_by == "name_desc":
            query = query.order_by(Product.name.desc())
        elif sort_by == "featured":
            query = query.order_by(Product.is_featured.desc(), Product.created_at.desc())
        else:
            # Default to newest
            query = query.order_by(Product.created_at.desc())

        # ===== PAGINATION =====
        offset = (params.page - 1) * params.per_page
        query = query.offset(offset).limit(params.per_page)

        result = await self.session.execute(query)
        products = list(result.scalars().all())

        return products, total

    async def list_with_filters_legacy(
        self,
        category_id: Optional[UUID] = None,
        brand_id: Optional[UUID] = None,
        collection_id: Optional[UUID] = None,
        gender: Optional[str] = None,
        metal_type: Optional[MetalType] = None,
        is_featured: Optional[bool] = None,
        is_active: Optional[bool] = True,
        search: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Product], int]:
        """Legacy method - converts to new params and calls new method."""
        from app.modules.products.models import Gender
        params = ProductListParams(
            category_id=category_id,
            brand_id=brand_id,
            collection_id=collection_id,
            gender=Gender(gender) if gender else None,
            metal_type=metal_type,
            is_featured=is_featured,
            is_active=is_active,
            search=search,
            page=page,
            per_page=per_page
        )
        return await self.list_with_filters(params)
    
    async def create(self, product: Product) -> Product:
        """Create a new product."""
        self.session.add(product)
        await self.session.commit()
        await self.session.refresh(product)
        return product
    
    async def update(self, product: Product, data: dict) -> Product:
        """Update an existing product."""
        for key, value in data.items():
            if value is not None:
                setattr(product, key, value)
        product.updated_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(product)
        return product
    
    async def delete(self, product: Product) -> None:
        """Delete a product and its variants."""
        await self.session.delete(product)
        await self.session.commit()


class ProductVariantRepository:
    """Repository for ProductVariant database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, variant_id: UUID) -> Optional[ProductVariant]:
        """Get variant by ID."""
        result = await self.session.execute(
            select(ProductVariant).where(ProductVariant.id == variant_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_sku(self, sku: str) -> Optional[ProductVariant]:
        """Get variant by SKU."""
        result = await self.session.execute(
            select(ProductVariant).where(ProductVariant.sku == sku)
        )
        return result.scalar_one_or_none()
    
    async def list_by_product(self, product_id: UUID) -> List[ProductVariant]:
        """List variants for a product."""
        result = await self.session.execute(
            select(ProductVariant)
            .where(ProductVariant.product_id == product_id)
            .order_by(ProductVariant.is_default.desc(), ProductVariant.created_at)
        )
        return list(result.scalars().all())
    
    async def create(self, variant: ProductVariant) -> ProductVariant:
        """Create a new variant."""
        self.session.add(variant)
        await self.session.commit()
        await self.session.refresh(variant)
        return variant
    
    async def create_many(self, variants: List[ProductVariant]) -> List[ProductVariant]:
        """Create multiple variants."""
        self.session.add_all(variants)
        await self.session.commit()
        for v in variants:
            await self.session.refresh(v)
        return variants
    
    async def update(self, variant: ProductVariant, data: dict) -> ProductVariant:
        """Update an existing variant."""
        for key, value in data.items():
            if value is not None:
                setattr(variant, key, value)
        variant.updated_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(variant)
        return variant
    
    async def delete(self, variant: ProductVariant) -> None:
        """Delete a variant."""
        await self.session.delete(variant)
        await self.session.commit()
