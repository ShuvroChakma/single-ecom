"""
Service layer for Customer Address business logic.
"""
from typing import List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.constants.error_codes import ErrorCode
from app.modules.addresses.models import CustomerAddress
from app.modules.addresses.repository import AddressRepository
from app.modules.addresses.schemas import AddressCreate, AddressUpdate, AddressResponse


class AddressService:
    """Service for customer address operations."""
    
    MAX_ADDRESSES = 5
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = AddressRepository(session)
    
    async def get_addresses(self, customer_id: UUID) -> List[CustomerAddress]:
        """Get all addresses for a customer."""
        return await self.repo.get_by_customer(customer_id)
    
    async def get_address(self, customer_id: UUID, address_id: UUID) -> CustomerAddress:
        """Get a specific address, verifying ownership."""
        address = await self.repo.get_by_id(address_id)
        
        if not address:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Address not found"
            )
        
        if address.customer_id != customer_id:
            raise NotFoundError(
                error_code=ErrorCode.RESOURCE_NOT_FOUND,
                message="Address not found"
            )
        
        return address
    
    async def create_address(
        self,
        customer_id: UUID,
        data: AddressCreate
    ) -> CustomerAddress:
        """
        Create a new address for a customer.
        
        Enforces max 5 addresses per customer.
        """
        # Check address limit
        count = await self.repo.count_by_customer(customer_id)
        if count >= self.MAX_ADDRESSES:
            raise ValidationError(
                error_code=ErrorCode.VALIDATION_ERROR,
                message=f"Maximum {self.MAX_ADDRESSES} addresses allowed. Please delete an existing address first.",
                field="addresses"
            )
        
        # If this is the first address or marked as default, handle default flag
        if data.is_default or count == 0:
            await self.repo.clear_default(customer_id)
            data.is_default = True  # First address is always default
        
        # Create address
        address = CustomerAddress(
            customer_id=customer_id,
            **data.model_dump()
        )
        
        return await self.repo.create(address)
    
    async def update_address(
        self,
        customer_id: UUID,
        address_id: UUID,
        data: AddressUpdate
    ) -> CustomerAddress:
        """Update an existing address."""
        address = await self.get_address(customer_id, address_id)
        
        # Handle default flag
        if data.is_default is True and not address.is_default:
            await self.repo.clear_default(customer_id)
        
        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(address, field, value)
        
        return await self.repo.update(address)
    
    async def delete_address(self, customer_id: UUID, address_id: UUID) -> bool:
        """Delete an address."""
        address = await self.get_address(customer_id, address_id)
        
        was_default = address.is_default
        
        await self.repo.delete(address)
        
        # If deleted address was default, set another as default
        if was_default:
            addresses = await self.repo.get_by_customer(customer_id)
            if addresses:
                addresses[0].is_default = True
                await self.repo.update(addresses[0])
        
        return True
    
    async def set_default(self, customer_id: UUID, address_id: UUID) -> CustomerAddress:
        """Set an address as the default."""
        address = await self.get_address(customer_id, address_id)
        
        if not address.is_default:
            await self.repo.clear_default(customer_id)
            address.is_default = True
            address = await self.repo.update(address)
        
        return address
