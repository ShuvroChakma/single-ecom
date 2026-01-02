"""
Repository for Attribute system database operations.
"""
from typing import Optional, List
from uuid import UUID
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.modules.catalog.attribute_models import AttributeGroup, Attribute, ProductAttributeValue


class AttributeGroupRepository:
    """Repository for AttributeGroup database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, group_id: UUID) -> Optional[AttributeGroup]:
        """Get attribute group by ID."""
        result = await self.session.execute(
            select(AttributeGroup).where(AttributeGroup.id == group_id)
        )
        return result.scalar_one_or_none()
    
    async def get_with_attributes(self, group_id: UUID) -> Optional[AttributeGroup]:
        """Get attribute group with attributes loaded."""
        result = await self.session.execute(
            select(AttributeGroup)
            .options(selectinload(AttributeGroup.attributes))
            .where(AttributeGroup.id == group_id)
        )
        return result.scalar_one_or_none()
    
    async def list_all(self) -> List[AttributeGroup]:
        """List all attribute groups with attributes."""
        result = await self.session.execute(
            select(AttributeGroup)
            .options(selectinload(AttributeGroup.attributes))
            .order_by(AttributeGroup.sort_order)
        )
        return list(result.scalars().all())
    
    async def create(self, group: AttributeGroup) -> AttributeGroup:
        """Create a new attribute group."""
        self.session.add(group)
        await self.session.commit()
        await self.session.refresh(group)
        return group
    
    async def update(self, group: AttributeGroup, data: dict) -> AttributeGroup:
        """Update an existing attribute group."""
        for key, value in data.items():
            if value is not None:
                setattr(group, key, value)
        group.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(group)
        return group
    
    async def delete(self, group: AttributeGroup) -> None:
        """Delete an attribute group."""
        await self.session.delete(group)
        await self.session.commit()


class AttributeRepository:
    """Repository for Attribute database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, attribute_id: UUID) -> Optional[Attribute]:
        """Get attribute by ID."""
        result = await self.session.execute(
            select(Attribute).where(Attribute.id == attribute_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_code(self, code: str) -> Optional[Attribute]:
        """Get attribute by code."""
        result = await self.session.execute(
            select(Attribute).where(Attribute.code == code)
        )
        return result.scalar_one_or_none()
    
    async def list_filterable(self) -> List[Attribute]:
        """List filterable attributes."""
        result = await self.session.execute(
            select(Attribute)
            .where(Attribute.is_filterable == True, Attribute.is_active == True)
            .order_by(Attribute.sort_order)
        )
        return list(result.scalars().all())
    
    async def create(self, attribute: Attribute) -> Attribute:
        """Create a new attribute."""
        self.session.add(attribute)
        await self.session.commit()
        await self.session.refresh(attribute)
        return attribute
    
    async def update(self, attribute: Attribute, data: dict) -> Attribute:
        """Update an existing attribute."""
        for key, value in data.items():
            if value is not None:
                setattr(attribute, key, value)
        attribute.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(attribute)
        return attribute
    
    async def delete(self, attribute: Attribute) -> None:
        """Delete an attribute."""
        await self.session.delete(attribute)
        await self.session.commit()


class ProductAttributeValueRepository:
    """Repository for ProductAttributeValue database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get(self, value_id: UUID) -> Optional[ProductAttributeValue]:
        """Get product attribute value by ID."""
        result = await self.session.execute(
            select(ProductAttributeValue)
            .options(selectinload(ProductAttributeValue.attribute))
            .where(ProductAttributeValue.id == value_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_product_and_attribute(
        self, product_id: UUID, attribute_id: UUID
    ) -> Optional[ProductAttributeValue]:
        """Get value for a specific product and attribute."""
        result = await self.session.execute(
            select(ProductAttributeValue)
            .where(
                ProductAttributeValue.product_id == product_id,
                ProductAttributeValue.attribute_id == attribute_id
            )
        )
        return result.scalar_one_or_none()
    
    async def list_by_product(self, product_id: UUID) -> List[ProductAttributeValue]:
        """List all attribute values for a product."""
        result = await self.session.execute(
            select(ProductAttributeValue)
            .options(selectinload(ProductAttributeValue.attribute))
            .where(ProductAttributeValue.product_id == product_id)
        )
        return list(result.scalars().all())
    
    async def create(self, value: ProductAttributeValue) -> ProductAttributeValue:
        """Create a new product attribute value."""
        self.session.add(value)
        await self.session.commit()
        await self.session.refresh(value)
        return value
    
    async def update(self, value: ProductAttributeValue, data: dict) -> ProductAttributeValue:
        """Update an existing product attribute value."""
        for key, val in data.items():
            if val is not None:
                setattr(value, key, val)
        value.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(value)
        return value
    
    async def delete(self, value: ProductAttributeValue) -> None:
        """Delete a product attribute value."""
        await self.session.delete(value)
        await self.session.commit()
