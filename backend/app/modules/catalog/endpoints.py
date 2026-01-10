from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from starlette import status

from app.core.deps import get_db
from app.core.schemas.response import SuccessResponse, create_success_response
from app.modules.audit.service import AuditService
from app.modules.catalog.schemas import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryTreeResponse, CategoryListResponse
from app.modules.catalog.service import CategoryService
from app.modules.catalog.repository import CategoryRepository
from app.modules.users.models import User
from app.core.permissions import require_permissions, get_current_active_user
from app.constants.permissions import PermissionEnum

router = APIRouter()

# Dependency Injection
async def get_category_service(
    db=Depends(get_db),
    audit_service=Depends(AuditService)
) -> CategoryService:
    repository = CategoryRepository(db)
    return CategoryService(repository, audit_service)

@router.get(
    "/categories/tree",
    response_model=SuccessResponse[List[CategoryTreeResponse]],
    summary="Get full category tree"
)
async def get_category_tree(
    service: CategoryService = Depends(get_category_service)
):
    """
    Get the full category hierarchy.
    Response is cached for 5 minutes.
    """
    tree = await service.get_tree()
    return create_success_response(message="Categories retrieved successfully", data=tree)

@router.post(
    "/admin/categories",
    response_model=SuccessResponse[CategoryResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create category"
)
async def create_category(
    data: CategoryCreate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.CATEGORIES_WRITE])),
    service: CategoryService = Depends(get_category_service)
):
    """
    Create a new category.
    - Max depth: 3 levels (0, 1, 2)
    - Requires 'categories:write' permission
    """
    category = await service.create_category(data, str(current_user.id), request)
    return create_success_response(message="Category created successfully", data=category)

@router.put(
    "/admin/categories/{category_id}",
    response_model=SuccessResponse[CategoryResponse],
    summary="Update category"
)
async def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.CATEGORIES_WRITE])),
    service: CategoryService = Depends(get_category_service)
):
    """
    Update an existing category.
    - Can change name, slug, icon, banner, is_active, parent
    - Validates depth constraints when changing parent
    - Requires 'categories:write' permission
    """
    category = await service.update_category(category_id, data, str(current_user.id), request)
    return create_success_response(message="Category updated successfully", data=category)

@router.get(
    "/admin/categories/{category_id}",
    response_model=SuccessResponse[CategoryResponse],
    summary="Get category by ID"
)
async def get_category(
    category_id: UUID,
    service: CategoryService = Depends(get_category_service),
    current_user: User = Depends(require_permissions([PermissionEnum.CATEGORIES_READ]))
):
    """
    Get a single category by ID.
    - Requires 'categories:read' permission
    """
    category = await service.repository.get(category_id)
    if not category:
         from app.core.exceptions import NotFoundError
         raise NotFoundError(message="Category not found", error_code="CATALOG_002")
    return create_success_response(message="Category retrieved successfully", data=category)

@router.delete(
    "/admin/categories/{category_id}",
    response_model=SuccessResponse[None],
    summary="Delete category"
)
async def delete_category(
    category_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions([PermissionEnum.CATEGORIES_DELETE])),
    service: CategoryService = Depends(get_category_service)
):
    """
    Delete a category.
    - Strict Check: Fails if category has children
    - Requires 'categories:delete' permission
    """
    await service.delete_category(category_id, str(current_user.id), request)
    return create_success_response(message="Category deleted successfully")

@router.get(
    "/admin/categories",
    response_model=SuccessResponse[CategoryListResponse],
    summary="Get paginated categories"
)
async def get_categories(
    page: int = 1,
    limit: int = 20,
    search: str = None,
    sort_by: str = None,
    sort_order: str = "asc",
    service: CategoryService = Depends(get_category_service),
    current_user: User = Depends(require_permissions([PermissionEnum.CATEGORIES_READ]))
):
    """
    Get paginated categories with filtering and sorting.
    """
    data = await service.get_list(page, limit, search, sort_by, sort_order)
    return create_success_response(message="Categories retrieved successfully", data=data)

@router.patch(
    "/admin/categories/{category_id}/toggle",
    response_model=SuccessResponse[CategoryResponse],
    summary="Toggle category status"
)
async def toggle_category_status(
    category_id: UUID,
    is_active: bool,
    request: Request,
    service: CategoryService = Depends(get_category_service),
    current_user: User = Depends(require_permissions([PermissionEnum.CATEGORIES_WRITE]))
):
    """
    Toggle category active status.
    """
    category = await service.toggle_active(category_id, is_active, str(current_user.id), request)
    return create_success_response(message="Category status updated successfully", data=category)
