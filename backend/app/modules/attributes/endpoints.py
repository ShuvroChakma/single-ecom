"""
API endpoints for Attribute system.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
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

router = APIRouter(prefix="/products", tags=["Attributes"])


async def get_group_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> AttributeGroupService:
    return AttributeGroupService(session, audit_service)


async def get_attribute_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> AttributeService:
    return AttributeService(session, audit_service)


async def get_product_attr_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> ProductAttributeService:
    return ProductAttributeService(session, audit_service)


# ============ ATTRIBUTE GROUP ENDPOINTS ============

@router.get("/attribute-groups", response_model=SuccessResponse[List[AttributeGroupWithAttributesResponse]])
async def list_attribute_groups(
    service: AttributeGroupService = Depends(get_group_service)
):
    """List all attribute groups with attributes (public)."""
    groups = await service.list_groups()
    return create_success_response(
        message="Attribute groups retrieved successfully",
        data=[AttributeGroupWithAttributesResponse.model_validate(g) for g in groups]
    )


@router.post(
    "/admin/attribute-groups",
    response_model=SuccessResponse[AttributeGroupWithAttributesResponse],
    status_code=201
)
async def create_attribute_group(
    data: AttributeGroupCreate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: AttributeGroupService = Depends(get_group_service)
):
    """Create a new attribute group (admin)."""
    group = await service.create_group(data, str(current_user.id), request)
    return create_success_response(
        message="Attribute group created successfully",
        data=AttributeGroupWithAttributesResponse.model_validate(group)
    )


@router.put(
    "/admin/attribute-groups/{group_id}",
    response_model=SuccessResponse[AttributeGroupWithAttributesResponse]
)
async def update_attribute_group(
    group_id: UUID,
    data: AttributeGroupUpdate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: AttributeGroupService = Depends(get_group_service)
):
    """Update an attribute group (admin)."""
    group = await service.update_group(group_id, data, str(current_user.id), request)
    return create_success_response(
        message="Attribute group updated successfully",
        data=AttributeGroupWithAttributesResponse.model_validate(group)
    )


@router.delete(
    "/admin/attribute-groups/{group_id}",
    response_model=SuccessResponse[dict]
)
async def delete_attribute_group(
    group_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions(["products:delete"])),
    service: AttributeGroupService = Depends(get_group_service)
):
    """Delete an attribute group (admin)."""
    await service.delete_group(group_id, str(current_user.id), request)
    return create_success_response(
        message="Attribute group deleted successfully",
        data={"deleted": True}
    )


# ============ ATTRIBUTE ENDPOINTS ============

@router.get("/attributes/filterable", response_model=SuccessResponse[List[AttributeResponse]])
async def list_filterable_attributes(
    service: AttributeService = Depends(get_attribute_service)
):
    """List filterable attributes for faceted search (public)."""
    attributes = await service.list_filterable()
    return create_success_response(
        message="Filterable attributes retrieved successfully",
        data=[AttributeResponse.model_validate(a) for a in attributes]
    )


@router.post(
    "/admin/attributes",
    response_model=SuccessResponse[AttributeResponse],
    status_code=201
)
async def create_attribute(
    data: AttributeCreate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: AttributeService = Depends(get_attribute_service)
):
    """Create a new attribute (admin)."""
    attribute = await service.create_attribute(data, str(current_user.id), request)
    return create_success_response(
        message="Attribute created successfully",
        data=AttributeResponse.model_validate(attribute)
    )


@router.put(
    "/admin/attributes/{attribute_id}",
    response_model=SuccessResponse[AttributeResponse]
)
async def update_attribute(
    attribute_id: UUID,
    data: AttributeUpdate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: AttributeService = Depends(get_attribute_service)
):
    """Update an attribute (admin)."""
    attribute = await service.update_attribute(attribute_id, data, str(current_user.id), request)
    return create_success_response(
        message="Attribute updated successfully",
        data=AttributeResponse.model_validate(attribute)
    )


@router.delete(
    "/admin/attributes/{attribute_id}",
    response_model=SuccessResponse[dict]
)
async def delete_attribute(
    attribute_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions(["products:delete"])),
    service: AttributeService = Depends(get_attribute_service)
):
    """Delete an attribute (admin)."""
    await service.delete_attribute(attribute_id, str(current_user.id), request)
    return create_success_response(
        message="Attribute deleted successfully",
        data={"deleted": True}
    )


# ============ PRODUCT ATTRIBUTE VALUE ENDPOINTS ============

@router.get("/products/{product_id}/attributes", response_model=SuccessResponse[List[ProductAttributeValueResponse]])
async def get_product_attributes(
    product_id: UUID,
    service: ProductAttributeService = Depends(get_product_attr_service)
):
    """Get all attribute values for a product (public)."""
    values = await service.get_product_attributes(product_id)
    return create_success_response(
        message="Product attributes retrieved successfully",
        data=[ProductAttributeValueResponse.model_validate(v) for v in values]
    )


@router.post(
    "/admin/products/{product_id}/attributes",
    response_model=SuccessResponse[ProductAttributeValueResponse],
    status_code=201
)
async def set_product_attribute(
    product_id: UUID,
    data: ProductAttributeValueCreate,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: ProductAttributeService = Depends(get_product_attr_service)
):
    """Set or update a product attribute value (admin)."""
    value = await service.set_attribute(product_id, data, str(current_user.id), request)
    return create_success_response(
        message="Product attribute set successfully",
        data=ProductAttributeValueResponse.model_validate(value)
    )


@router.delete(
    "/admin/products/{product_id}/attributes/{attribute_id}",
    response_model=SuccessResponse[dict]
)
async def delete_product_attribute(
    product_id: UUID,
    attribute_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    service: ProductAttributeService = Depends(get_product_attr_service)
):
    """Delete a product attribute value (admin)."""
    await service.delete_attribute(product_id, attribute_id, str(current_user.id), request)
    return create_success_response(
        message="Product attribute deleted successfully",
        data={"deleted": True}
    )
