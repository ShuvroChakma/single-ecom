"""
Service layer for Brand and Collection.
"""
from typing import Optional, List
from uuid import UUID
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ValidationError, NotFoundError
from app.constants.error_codes import ErrorCode
from app.modules.audit.service import AuditService
from app.modules.brands.models import Brand, Collection
from app.modules.brands.schemas import BrandCreate, BrandUpdate, CollectionCreate, CollectionUpdate
from app.modules.brands.repository import BrandRepository, CollectionRepository


class BrandService:
    """Service for Brand business logic."""
    
    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.repository = BrandRepository(session)
        self.audit_service = audit_service
    
    async def list_brands(self, include_inactive: bool = False) -> List[Brand]:
        """List brands."""
        if include_inactive:
            return await self.repository.list_all()
        return await self.repository.list_active()
    
    async def get_brand(self, brand_id: UUID) -> Brand:
        """Get brand by ID."""
        brand = await self.repository.get(brand_id)
        if not brand:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Brand not found"
            )
        return brand
    
    async def get_brand_by_slug(self, slug: str) -> Brand:
        """Get brand by slug."""
        brand = await self.repository.get_by_slug(slug)
        if not brand:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Brand not found"
            )
        return brand
    
    async def create_brand(
        self, 
        data: BrandCreate, 
        actor_id: str, 
        request: Optional[Request] = None
    ) -> Brand:
        """Create a new brand."""
        try:
            brand = Brand(**data.model_dump())
            brand = await self.repository.create(brand)
        except IntegrityError as e:
            if "ix_brands_slug" in str(e.orig) or "brands_slug" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Slug '{data.slug}' already exists",
                    field="slug"
                )
            raise
        
        await self.audit_service.log_action(
            action="create_brand",
            actor_id=actor_id,
            target_id=str(brand.id),
            target_type="brand",
            details={"name": brand.name},
            request=request
        )
        return brand
    
    async def update_brand(
        self,
        brand_id: UUID,
        data: BrandUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Brand:
        """Update a brand."""
        brand = await self.get_brand(brand_id)
        update_data = data.model_dump(exclude_unset=True)
        
        try:
            brand = await self.repository.update(brand, update_data)
        except IntegrityError as e:
            if "ix_brands_slug" in str(e.orig) or "brands_slug" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Slug '{data.slug}' already exists",
                    field="slug"
                )
            raise
        
        await self.audit_service.log_action(
            action="update_brand",
            actor_id=actor_id,
            target_id=str(brand_id),
            target_type="brand",
            details=update_data,
            request=request
        )
        return brand
    
    async def delete_brand(
        self,
        brand_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> None:
        """Delete a brand."""
        brand = await self.get_brand(brand_id)
        await self.repository.delete(brand)
        
        await self.audit_service.log_action(
            action="delete_brand",
            actor_id=actor_id,
            target_id=str(brand_id),
            target_type="brand",
            details={"name": brand.name},
            request=request
        )


class CollectionService:
    """Service for Collection business logic."""
    
    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.repository = CollectionRepository(session)
        self.audit_service = audit_service
    
    async def list_collections(self, include_inactive: bool = False) -> List[Collection]:
        """List collections."""
        if include_inactive:
            return await self.repository.list_all()
        return await self.repository.list_active()
    
    async def get_collection(self, collection_id: UUID) -> Collection:
        """Get collection by ID."""
        collection = await self.repository.get(collection_id)
        if not collection:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Collection not found"
            )
        return collection
    
    async def get_collection_by_slug(self, slug: str) -> Collection:
        """Get collection by slug."""
        collection = await self.repository.get_by_slug(slug)
        if not collection:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Collection not found"
            )
        return collection
    
    async def create_collection(
        self,
        data: CollectionCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Collection:
        """Create a new collection."""
        try:
            collection = Collection(**data.model_dump())
            collection = await self.repository.create(collection)
        except IntegrityError as e:
            if "ix_collections_slug" in str(e.orig) or "collections_slug" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Slug '{data.slug}' already exists",
                    field="slug"
                )
            raise
        
        await self.audit_service.log_action(
            action="create_collection",
            actor_id=actor_id,
            target_id=str(collection.id),
            target_type="collection",
            details={"name": collection.name},
            request=request
        )
        return collection
    
    async def update_collection(
        self,
        collection_id: UUID,
        data: CollectionUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Collection:
        """Update a collection."""
        collection = await self.get_collection(collection_id)
        update_data = data.model_dump(exclude_unset=True)
        
        try:
            collection = await self.repository.update(collection, update_data)
        except IntegrityError as e:
            if "ix_collections_slug" in str(e.orig) or "collections_slug" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Slug '{data.slug}' already exists",
                    field="slug"
                )
            raise
        
        await self.audit_service.log_action(
            action="update_collection",
            actor_id=actor_id,
            target_id=str(collection_id),
            target_type="collection",
            details=update_data,
            request=request
        )
        return collection
    
    async def delete_collection(
        self,
        collection_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> None:
        """Delete a collection."""
        collection = await self.get_collection(collection_id)
        await self.repository.delete(collection)
        
        await self.audit_service.log_action(
            action="delete_collection",
            actor_id=actor_id,
            target_id=str(collection_id),
            target_type="collection",
            details={"name": collection.name},
            request=request
        )
