from uuid import UUID
from typing import Optional, List, Dict, Any
from fastapi import Request

from app.core.exceptions import ValidationError, NotFoundError, ConflictError
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
                raise ValidationError(message="Maximum category depth (3 levels) exceeded", error_code="CATALOG_001")
            
            level = parent.level + 1
            # Simple path logic for now
            path = f"{parent.name}/{data.name}"

        # Create (commits and generates ID)
        obj_data = data.model_dump()
        obj_data.update({"level": level, "path": path}) 
        
        category = await self.repository.create(Category(**obj_data))
        
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
