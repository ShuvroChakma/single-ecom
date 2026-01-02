"""
Service layer for Attribute system.
"""
from typing import Optional, List
from uuid import UUID
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ValidationError, NotFoundError
from app.constants.error_codes import ErrorCode
from app.modules.audit.service import AuditService
from app.modules.attributes.models import AttributeGroup, Attribute, ProductAttributeValue
from app.modules.attributes.schemas import (
    AttributeGroupCreate, AttributeGroupUpdate,
    AttributeCreate, AttributeUpdate,
    ProductAttributeValueCreate, ProductAttributeValueUpdate
)
from app.modules.attributes.repository import (
    AttributeGroupRepository, AttributeRepository, ProductAttributeValueRepository
)


class AttributeGroupService:
    """Service for AttributeGroup business logic."""
    
    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.repository = AttributeGroupRepository(session)
        self.audit_service = audit_service
    
    async def list_groups(self) -> List[AttributeGroup]:
        """List all attribute groups with attributes."""
        return await self.repository.list_all()
    
    async def get_group(self, group_id: UUID) -> AttributeGroup:
        """Get attribute group by ID."""
        group = await self.repository.get_with_attributes(group_id)
        if not group:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Attribute group not found"
            )
        return group
    
    async def create_group(
        self,
        data: AttributeGroupCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> AttributeGroup:
        """Create a new attribute group."""
        group = AttributeGroup(**data.model_dump())
        group = await self.repository.create(group)
        
        await self.audit_service.log_action(
            action="create_attribute_group",
            actor_id=actor_id,
            target_id=str(group.id),
            target_type="attribute_group",
            details={"name": group.name},
            request=request
        )
        return group
    
    async def update_group(
        self,
        group_id: UUID,
        data: AttributeGroupUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> AttributeGroup:
        """Update an attribute group."""
        group = await self.get_group(group_id)
        update_data = data.model_dump(exclude_unset=True)
        group = await self.repository.update(group, update_data)
        
        await self.audit_service.log_action(
            action="update_attribute_group",
            actor_id=actor_id,
            target_id=str(group_id),
            target_type="attribute_group",
            details=update_data,
            request=request
        )
        return group
    
    async def delete_group(
        self,
        group_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> None:
        """Delete an attribute group."""
        group = await self.get_group(group_id)
        await self.repository.delete(group)
        
        await self.audit_service.log_action(
            action="delete_attribute_group",
            actor_id=actor_id,
            target_id=str(group_id),
            target_type="attribute_group",
            details={"name": group.name},
            request=request
        )


class AttributeService:
    """Service for Attribute business logic."""
    
    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.repository = AttributeRepository(session)
        self.group_repository = AttributeGroupRepository(session)
        self.audit_service = audit_service
    
    async def get_attribute(self, attribute_id: UUID) -> Attribute:
        """Get attribute by ID."""
        attribute = await self.repository.get(attribute_id)
        if not attribute:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Attribute not found"
            )
        return attribute
    
    async def list_filterable(self) -> List[Attribute]:
        """List filterable attributes for faceted search."""
        return await self.repository.list_filterable()
    
    async def create_attribute(
        self,
        data: AttributeCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Attribute:
        """Create a new attribute."""
        # Validate group exists
        group = await self.group_repository.get(data.group_id)
        if not group:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Attribute group not found"
            )
        
        try:
            attribute = Attribute(**data.model_dump())
            attribute = await self.repository.create(attribute)
        except IntegrityError as e:
            if "attributes_code" in str(e.orig) or "ix_attributes_code" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Attribute code '{data.code}' already exists",
                    field="code"
                )
            raise
        
        await self.audit_service.log_action(
            action="create_attribute",
            actor_id=actor_id,
            target_id=str(attribute.id),
            target_type="attribute",
            details={"code": attribute.code, "name": attribute.name},
            request=request
        )
        return attribute
    
    async def update_attribute(
        self,
        attribute_id: UUID,
        data: AttributeUpdate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> Attribute:
        """Update an attribute."""
        attribute = await self.get_attribute(attribute_id)
        update_data = data.model_dump(exclude_unset=True)
        
        # Validate new group if changing
        if "group_id" in update_data:
            group = await self.group_repository.get(update_data["group_id"])
            if not group:
                raise NotFoundError(
                    error_code=ErrorCode.RESOURCE_NOT_FOUND,
                    message="Attribute group not found"
                )
        
        try:
            attribute = await self.repository.update(attribute, update_data)
        except IntegrityError as e:
            if "attributes_code" in str(e.orig) or "ix_attributes_code" in str(e.orig):
                raise ValidationError(
                    error_code=ErrorCode.FIELD_INVALID,
                    message=f"Attribute code '{data.code}' already exists",
                    field="code"
                )
            raise
        
        await self.audit_service.log_action(
            action="update_attribute",
            actor_id=actor_id,
            target_id=str(attribute_id),
            target_type="attribute",
            details=update_data,
            request=request
        )
        return attribute
    
    async def delete_attribute(
        self,
        attribute_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> None:
        """Delete an attribute."""
        attribute = await self.get_attribute(attribute_id)
        await self.repository.delete(attribute)
        
        await self.audit_service.log_action(
            action="delete_attribute",
            actor_id=actor_id,
            target_id=str(attribute_id),
            target_type="attribute",
            details={"code": attribute.code},
            request=request
        )


class ProductAttributeService:
    """Service for ProductAttributeValue business logic."""
    
    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.repository = ProductAttributeValueRepository(session)
        self.attribute_repository = AttributeRepository(session)
        self.audit_service = audit_service
    
    async def get_product_attributes(self, product_id: UUID) -> List[ProductAttributeValue]:
        """Get all attribute values for a product."""
        return await self.repository.list_by_product(product_id)
    
    async def set_attribute(
        self,
        product_id: UUID,
        data: ProductAttributeValueCreate,
        actor_id: str,
        request: Optional[Request] = None
    ) -> ProductAttributeValue:
        """Set or update a product attribute value."""
        # Validate attribute exists
        attribute = await self.attribute_repository.get(data.attribute_id)
        if not attribute:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Attribute not found"
            )
        
        # Check if value already exists
        existing = await self.repository.get_by_product_and_attribute(
            product_id, data.attribute_id
        )
        
        if existing:
            # Update existing value
            existing = await self.repository.update(existing, {"value": data.value})
            action = "update_product_attribute"
        else:
            # Create new value
            existing = ProductAttributeValue(
                product_id=product_id,
                attribute_id=data.attribute_id,
                value=data.value
            )
            existing = await self.repository.create(existing)
            action = "set_product_attribute"
        
        await self.audit_service.log_action(
            action=action,
            actor_id=actor_id,
            target_id=str(product_id),
            target_type="product",
            details={"attribute_code": attribute.code, "value": data.value},
            request=request
        )
        return existing
    
    async def delete_attribute(
        self,
        product_id: UUID,
        attribute_id: UUID,
        actor_id: str,
        request: Optional[Request] = None
    ) -> None:
        """Delete a product attribute value."""
        value = await self.repository.get_by_product_and_attribute(product_id, attribute_id)
        if not value:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Product attribute value not found"
            )
        
        await self.repository.delete(value)
        
        await self.audit_service.log_action(
            action="delete_product_attribute",
            actor_id=actor_id,
            target_id=str(product_id),
            target_type="product",
            details={"attribute_id": str(attribute_id)},
            request=request
        )
