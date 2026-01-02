"""
API endpoints for Attribute system.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.modules.attributes.service import (
    AttributeGroupService, AttributeService, ProductAttributeService
)
from app.modules.attributes.schemas import (
    AttributeGroupCreate, AttributeGroupUpdate, AttributeGroupWithAttributesResponse,
    AttributeCreate, AttributeUpdate, AttributeResponse,
    ProductAttributeValueCreate, ProductAttributeValueResponse
)

router = APIRouter(prefix="/catalog", tags=["Attributes"])


# ============ ATTRIBUTE GROUP ENDPOINTS ============

@router.get("/attribute-groups", response_model=SuccessResponse[List[AttributeGroupWithAttributesResponse]])
async def list_attribute_groups(
    session: AsyncSession = Depends(get_db)
):
    """List all attribute groups with attributes (public)."""
    service = AttributeGroupService(session, AuditService(session))
    groups = await service.list_groups()
    return SuccessResponse(data=[AttributeGroupWithAttributesResponse.model_validate(g) for g in groups])


@router.post(
    "/admin/attribute-groups",
    response_model=SuccessResponse[AttributeGroupWithAttributesResponse],
    status_code=201
)
async def create_attribute_group(
    data: AttributeGroupCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Create a new attribute group (admin)."""
    service = AttributeGroupService(session, AuditService(session))
    group = await service.create_group(data, str(current_user.id), request)
    return SuccessResponse(data=AttributeGroupWithAttributesResponse.model_validate(group))


@router.put(
    "/admin/attribute-groups/{group_id}",
    response_model=SuccessResponse[AttributeGroupWithAttributesResponse]
)
async def update_attribute_group(
    group_id: UUID,
    data: AttributeGroupUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Update an attribute group (admin)."""
    service = AttributeGroupService(session, AuditService(session))
    group = await service.update_group(group_id, data, str(current_user.id), request)
    return SuccessResponse(data=AttributeGroupWithAttributesResponse.model_validate(group))


@router.delete(
    "/admin/attribute-groups/{group_id}",
    response_model=SuccessResponse[dict]
)
async def delete_attribute_group(
    group_id: UUID,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:delete"]))
):
    """Delete an attribute group (admin)."""
    service = AttributeGroupService(session, AuditService(session))
    await service.delete_group(group_id, str(current_user.id), request)
    return SuccessResponse(data={"message": "Attribute group deleted successfully"})


# ============ ATTRIBUTE ENDPOINTS ============

@router.get("/attributes/filterable", response_model=SuccessResponse[List[AttributeResponse]])
async def list_filterable_attributes(
    session: AsyncSession = Depends(get_db)
):
    """List filterable attributes for faceted search (public)."""
    service = AttributeService(session, AuditService(session))
    attributes = await service.list_filterable()
    return SuccessResponse(data=[AttributeResponse.model_validate(a) for a in attributes])


@router.post(
    "/admin/attributes",
    response_model=SuccessResponse[AttributeResponse],
    status_code=201
)
async def create_attribute(
    data: AttributeCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Create a new attribute (admin)."""
    service = AttributeService(session, AuditService(session))
    attribute = await service.create_attribute(data, str(current_user.id), request)
    return SuccessResponse(data=AttributeResponse.model_validate(attribute))


@router.put(
    "/admin/attributes/{attribute_id}",
    response_model=SuccessResponse[AttributeResponse]
)
async def update_attribute(
    attribute_id: UUID,
    data: AttributeUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Update an attribute (admin)."""
    service = AttributeService(session, AuditService(session))
    attribute = await service.update_attribute(attribute_id, data, str(current_user.id), request)
    return SuccessResponse(data=AttributeResponse.model_validate(attribute))


@router.delete(
    "/admin/attributes/{attribute_id}",
    response_model=SuccessResponse[dict]
)
async def delete_attribute(
    attribute_id: UUID,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:delete"]))
):
    """Delete an attribute (admin)."""
    service = AttributeService(session, AuditService(session))
    await service.delete_attribute(attribute_id, str(current_user.id), request)
    return SuccessResponse(data={"message": "Attribute deleted successfully"})


# ============ PRODUCT ATTRIBUTE VALUE ENDPOINTS ============

@router.get("/products/{product_id}/attributes", response_model=SuccessResponse[List[ProductAttributeValueResponse]])
async def get_product_attributes(
    product_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Get all attribute values for a product (public)."""
    service = ProductAttributeService(session, AuditService(session))
    values = await service.get_product_attributes(product_id)
    return SuccessResponse(data=[ProductAttributeValueResponse.model_validate(v) for v in values])


@router.post(
    "/admin/products/{product_id}/attributes",
    response_model=SuccessResponse[ProductAttributeValueResponse],
    status_code=201
)
async def set_product_attribute(
    product_id: UUID,
    data: ProductAttributeValueCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Set or update a product attribute value (admin)."""
    service = ProductAttributeService(session, AuditService(session))
    value = await service.set_attribute(product_id, data, str(current_user.id), request)
    return SuccessResponse(data=ProductAttributeValueResponse.model_validate(value))


@router.delete(
    "/admin/products/{product_id}/attributes/{attribute_id}",
    response_model=SuccessResponse[dict]
)
async def delete_product_attribute(
    product_id: UUID,
    attribute_id: UUID,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["products:write"]))
):
    """Delete a product attribute value (admin)."""
    service = ProductAttributeService(session, AuditService(session))
    await service.delete_attribute(product_id, attribute_id, str(current_user.id), request)
    return SuccessResponse(data={"message": "Product attribute deleted successfully"})
