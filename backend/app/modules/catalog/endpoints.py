from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from starlette import status

from app.core.deps import get_db
from app.core.schemas.response import SuccessResponse, create_success_response
from app.modules.audit.service import AuditService
from app.modules.catalog.schemas import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryTreeResponse
from app.modules.catalog.service import CategoryService
from app.modules.catalog.repository import CategoryRepository
from app.modules.users.models import User
from app.core.permissions import require_permissions, get_current_active_user

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
    current_user: User = Depends(require_permissions(["manage_categories"])),
    service: CategoryService = Depends(get_category_service)
):
    """
    Create a new category.
    - Max depth: 3 levels (0, 1, 2)
    - Requires 'manage_categories' permission
    """
    category = await service.create_category(data, str(current_user.id), request)
    return create_success_response(message="Category created successfully", data=category)

@router.delete(
    "/admin/categories/{category_id}",
    response_model=SuccessResponse[None],
    summary="Delete category"
)
async def delete_category(
    category_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions(["manage_categories"])),
    service: CategoryService = Depends(get_category_service)
):
    """
    Delete a category.
    - Strict Check: Fails if category has children
    - Requires 'manage_categories' permission
    """
    await service.delete_category(category_id, str(current_user.id), request)
    return create_success_response(message="Category deleted successfully")
