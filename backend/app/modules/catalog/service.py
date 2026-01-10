from uuid import UUID
from typing import Optional, List, Dict, Any
from fastapi import Request
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ValidationError, NotFoundError, ConflictError
from app.constants.error_codes import ErrorCode
from app.core.cache import get_cache, set_cache, delete_cache
from app.modules.audit.service import AuditService
from app.modules.catalog.models import Category
from app.modules.catalog.schemas import CategoryCreate, CategoryUpdate, CategoryTreeResponse
from app.modules.catalog.repository import CategoryRepository

CACHE_KEY_TREE = "catalog:category:tree"

class CategoryService:
    def __init__(self, repository: CategoryRepository, audit_service: AuditService):
        self.repository = repository
        self.audit_service = audit_service

    async def get_tree(self) -> List[CategoryTreeResponse]:
        """Get full category tree from cache or db."""
        cached = await get_cache(CACHE_KEY_TREE)
        if cached:
            return [CategoryTreeResponse(**item) for item in cached]
            
        # Fetch all active
        categories = await self.repository.get_all_active()
        
        # Build Tree
        tree = self._build_tree(categories)
        
        # Cache (serialize first)
        await set_cache(CACHE_KEY_TREE, [item.model_dump(mode='json') for item in tree], expire=300)
        
        return tree

    def _build_tree(self, categories: List[Category], parent_id: Optional[UUID] = None) -> List[CategoryTreeResponse]:
        """Recursive tree builder."""
        from app.modules.catalog.schemas import CategoryResponse
        node_list = []
        for cat in categories:
            if cat.parent_id == parent_id:
                # Validate against base response to avoid triggering 'children' relationship access on ORM model
                base_data = CategoryResponse.model_validate(cat)
                # Helper to convert to dict and create Tree response
                node = CategoryTreeResponse(
                    **base_data.model_dump(),
                    children=self._build_tree(categories, cat.id)
                )
                node_list.append(node)
        return node_list

    async def create_category(self, data: CategoryCreate, actor_id: str, request: Optional[Request] = None) -> Category:
        """Create category with depth validation."""
        # Validate Depth
        level = 0
        path = "root"
        
        if data.parent_id:
            parent = await self.repository.get(data.parent_id)
            if not parent:
                raise NotFoundError(message="Parent category not found", code="CATALOG_002")
            
            if parent.level >= 2:
                raise ValidationError(
                    error_code=ErrorCode.CATEGORY_MAX_DEPTH,
                    message="Maximum category depth (3 levels) exceeded",
                    field="parent_id"
                )
            
            level = parent.level + 1
            # Simple path logic for now
            path = f"{parent.name}/{data.name}"

        # Create (commits and generates ID)
        obj_data = data.model_dump()
        obj_data.update({"level": level, "path": path}) 
        
        try:
            category = await self.repository.create(Category(**obj_data))
        except IntegrityError as e:
            if "ix_categories_slug" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.CATEGORY_DUPLICATE_SLUG,
                    message=f"Slug '{data.slug}' already exists. Please use a unique slug.",
                    field="slug"
                )
            raise
        
        # Update Path if needed (now that we have ID)
        if not data.parent_id:
            new_path = str(category.id)
            if category.path != new_path:
                 category = await self.repository.update(category, {"path": new_path})
        elif data.parent_id:
             # Logic above already set path using parent name? 
             # Wait, existing logic was path = f"{parent.name}/{data.name}"
             # But step 71 said: category.path = f"{parent.path}/{category.id}"
             
             # Re-implement path logic correctly using ID
             new_path = f"{parent.path}/{category.id}"
             category = await self.repository.update(category, {"path": new_path})

        # Clear Cache
        await delete_cache(CACHE_KEY_TREE)

        # Audit
        await self.audit_service.log_action(
            action="create_category",
            actor_id=actor_id,
            target_id=str(category.id),
            target_type="category",
            details={"name": category.name, "level": level},
            request=request
        )
        return category

    async def update_category(self, category_id: UUID, data: CategoryUpdate, actor_id: str, request: Optional[Request] = None) -> Category:
        """Update category with validation."""
        category = await self.repository.get(category_id)
        if not category:
            raise NotFoundError(message="Category not found", error_code="CATALOG_002")
        
        # Prepare update data
        update_data = data.model_dump(exclude_unset=True)
        
        # If changing parent, validate depth
        if "parent_id" in update_data and update_data["parent_id"] != category.parent_id:
            if update_data["parent_id"] is not None:
                parent = await self.repository.get(update_data["parent_id"])
                if not parent:
                    raise NotFoundError(message="Parent category not found", error_code="CATALOG_002")
                
                # Check if new placement would exceed depth
                if parent.level >= 2:
                    raise ValidationError(
                        error_code=ErrorCode.CATEGORY_MAX_DEPTH,
                        message="Maximum category depth (3 levels) exceeded",
                        field="parent_id"
                    )
                
                # Cannot move to its own child
                if str(parent.id) == str(category.id):
                    raise ValidationError(
                        error_code=ErrorCode.CATEGORY_INVALID_PARENT,
                        message="Cannot set category as its own parent",
                        field="parent_id"
                    )
                
                # Update level and path
                update_data["level"] = parent.level + 1
                update_data["path"] = f"{parent.path}/{category.id}"
            else:
                # Moving to root
                update_data["level"] = 0
                update_data["path"] = str(category.id)
        
        # Update category
        try:
            updated_category = await self.repository.update(category, update_data)
        except IntegrityError as e:
            if "ix_categories_slug" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.CATEGORY_DUPLICATE_SLUG,
                    message=f"Slug '{update_data.get('slug')}' already exists. Please use a unique slug.",
                    field="slug"
                )
            raise
        
        # Clear cache
        await delete_cache(CACHE_KEY_TREE)
        
        # Audit
        await self.audit_service.log_action(
            action="update_category",
            actor_id=actor_id,
            target_id=str(category_id),
            target_type="category",
            details={"updates": update_data},
            request=request
        )
        
        return updated_category

    async def delete_category(self, category_id: UUID, actor_id: str, request: Optional[Request] = None) -> None:
        """Delete category with strict child check."""
        # Check Children
        if await self.repository.has_children(category_id):
            raise ConflictError(
                message="Cannot delete category with subcategories. Remove children first.",
                error_code="CATALOG_HAS_CHILDREN"
            )
            
        # TODO: Check Products (Placeholder)
        # if await product_repo.count_by_category(category_id) > 0:
        #    raise ConflictError(...)

        category = await self.repository.get(category_id)
        if not category:
            raise NotFoundError(message="Category not found", error_code="CATALOG_002")

        await self.repository.delete(category_id)

        # Clear Cache
        await delete_cache(CACHE_KEY_TREE)
        
        # Audit
        await self.audit_service.log_action(
            action="delete_category",
            actor_id=actor_id,
            target_id=str(category_id),
            target_type="category",
            details={"name": category.name},
            request=request
        )
    async def get_list(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ) -> Dict[str, Any]:
        """Get paginated list."""
        filters = {}
        if search:
            filters["search"] = search
            
        items, total = await self.repository.get_list(page, limit, filters, sort_by, sort_order)
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": limit,
            "pages": (total + limit - 1) // limit
        }

    async def toggle_active(self, category_id: UUID, is_active: bool, actor_id: str, request: Optional[Request] = None) -> Category:
        """Toggle active status."""
        category = await self.repository.get(category_id)
        if not category:
            raise NotFoundError(message="Category not found", error_code="CATALOG_002")
            
        category = await self.repository.update(category, {"is_active": is_active})
        
        # Clear cache
        await delete_cache(CACHE_KEY_TREE)
        
        # Audit
        await self.audit_service.log_action(
            action="update_category",
            actor_id=actor_id,
            target_id=str(category_id),
            target_type="category",
            details={"is_active": is_active},
            request=request
        )
        return category
