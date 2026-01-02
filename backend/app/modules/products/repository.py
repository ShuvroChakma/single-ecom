"""
Repository for Product and ProductVariant database operations.
"""
from typing import Optional, List, Tuple
from uuid import UUID
from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.modules.products.models import Product, ProductVariant, MetalType


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
        """List products with filters and pagination."""
        query = select(Product).options(selectinload(Product.variants))
        count_query = select(func.count(Product.id))
        
        # Apply filters
        if category_id:
            query = query.where(Product.category_id == category_id)
            count_query = count_query.where(Product.category_id == category_id)
        
        if brand_id:
            query = query.where(Product.brand_id == brand_id)
            count_query = count_query.where(Product.brand_id == brand_id)
        
        if collection_id:
            query = query.where(Product.collection_id == collection_id)
            count_query = count_query.where(Product.collection_id == collection_id)
        
        if gender:
            query = query.where(Product.gender == gender)
            count_query = count_query.where(Product.gender == gender)
        
        if is_featured is not None:
            query = query.where(Product.is_featured == is_featured)
            count_query = count_query.where(Product.is_featured == is_featured)
        
        if is_active is not None:
            query = query.where(Product.is_active == is_active)
            count_query = count_query.where(Product.is_active == is_active)
        
        if search:
            search_filter = f"%{search}%"
            query = query.where(Product.name.ilike(search_filter))
            count_query = count_query.where(Product.name.ilike(search_filter))
        
        # Get total count
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page).order_by(Product.created_at.desc())
        
        result = await self.session.execute(query)
        products = list(result.scalars().all())
        
        return products, total
    
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
        product.updated_at = datetime.utcnow()
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
        variant.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(variant)
        return variant
    
    async def delete(self, variant: ProductVariant) -> None:
        """Delete a variant."""
        await self.session.delete(variant)
        await self.session.commit()
