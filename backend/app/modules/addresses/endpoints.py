"""
API endpoints for Customer Addresses.
All endpoints require authenticated customer.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.permissions import get_current_verified_user
from app.core.schemas.response import SuccessResponse, create_success_response
from app.core.exceptions import PermissionDeniedError
from app.constants.enums import UserType
from app.constants.error_codes import ErrorCode
from app.modules.users.models import User
from app.modules.addresses.service import AddressService
from app.modules.addresses.schemas import (
    AddressCreate,
    AddressUpdate,
    AddressResponse,
    AddressListResponse
)


router = APIRouter()


def get_address_service(session: AsyncSession = Depends(get_db)) -> AddressService:
    """Get address service instance."""
    return AddressService(session)


async def get_current_customer(
    current_user: User = Depends(get_current_verified_user)
) -> User:
    """Verify user is a customer."""
    if current_user.user_type != UserType.CUSTOMER:
        raise PermissionDeniedError(
            error_code=ErrorCode.PERMISSION_DENIED,
            message="Addresses are only available for customers"
        )
    
    if not current_user.customer:
        raise PermissionDeniedError(
            error_code=ErrorCode.PERMISSION_DENIED,
            message="Customer profile not found"
        )
    
    return current_user


# ============ ENDPOINTS ============

@router.get("", response_model=SuccessResponse[AddressListResponse])
async def list_addresses(
    current_user: User = Depends(get_current_customer),
    service: AddressService = Depends(get_address_service)
):
    """
    List all addresses for the current customer.
    
    Returns addresses sorted by default first, then by creation date.
    """
    addresses = await service.get_addresses(current_user.customer.id)
    
    return create_success_response(
        message="Addresses retrieved successfully",
        data=AddressListResponse(
            addresses=[AddressResponse.model_validate(a) for a in addresses],
            count=len(addresses),
            max_allowed=5
        )
    )


@router.post("", response_model=SuccessResponse[AddressResponse], status_code=201)
async def create_address(
    data: AddressCreate,
    current_user: User = Depends(get_current_customer),
    service: AddressService = Depends(get_address_service)
):
    """
    Create a new address.
    
    Maximum 5 addresses per customer.
    First address is automatically set as default.
    """
    address = await service.create_address(current_user.customer.id, data)
    
    return create_success_response(
        message="Address created successfully",
        data=AddressResponse.model_validate(address)
    )


@router.get("/{address_id}", response_model=SuccessResponse[AddressResponse])
async def get_address(
    address_id: UUID,
    current_user: User = Depends(get_current_customer),
    service: AddressService = Depends(get_address_service)
):
    """Get a specific address."""
    address = await service.get_address(current_user.customer.id, address_id)
    
    return create_success_response(
        message="Address retrieved successfully",
        data=AddressResponse.model_validate(address)
    )


@router.put("/{address_id}", response_model=SuccessResponse[AddressResponse])
async def update_address(
    address_id: UUID,
    data: AddressUpdate,
    current_user: User = Depends(get_current_customer),
    service: AddressService = Depends(get_address_service)
):
    """Update an address."""
    address = await service.update_address(current_user.customer.id, address_id, data)
    
    return create_success_response(
        message="Address updated successfully",
        data=AddressResponse.model_validate(address)
    )


@router.delete("/{address_id}", response_model=SuccessResponse[dict])
async def delete_address(
    address_id: UUID,
    current_user: User = Depends(get_current_customer),
    service: AddressService = Depends(get_address_service)
):
    """
    Delete an address.
    
    If the deleted address was default, another address will be set as default.
    """
    await service.delete_address(current_user.customer.id, address_id)
    
    return create_success_response(
        message="Address deleted successfully",
        data={"deleted": True}
    )


@router.patch("/{address_id}/default", response_model=SuccessResponse[AddressResponse])
async def set_default_address(
    address_id: UUID,
    current_user: User = Depends(get_current_customer),
    service: AddressService = Depends(get_address_service)
):
    """Set an address as the default."""
    address = await service.set_default(current_user.customer.id, address_id)
    
    return create_success_response(
        message="Default address updated",
        data=AddressResponse.model_validate(address)
    )
