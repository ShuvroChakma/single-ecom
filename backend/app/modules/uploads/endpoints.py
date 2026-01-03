"""
API endpoints for file uploads.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, Request, Body

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.modules.users.models import User
from app.modules.uploads.service import UploadService
from app.modules.uploads.schemas import ImageUploadResponse, MultiImageUploadResponse, ImageDeleteResponse
from app.modules.products.service import ProductService
from app.modules.products.repository import ProductRepository
from app.modules.audit.service import AuditService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/products", tags=["Product Images"])


def get_upload_service() -> UploadService:
    return UploadService()


async def get_product_service(
    session: AsyncSession = Depends(get_db),
    audit_service: AuditService = Depends(AuditService)
) -> ProductService:
    return ProductService(session, audit_service)


# ============ PRODUCT IMAGE ENDPOINTS ============

@router.post(
    "/admin/products/{product_id}/images",
    response_model=SuccessResponse[MultiImageUploadResponse],
    status_code=201
)
async def upload_product_images(
    product_id: UUID,
    request: Request,
    files: List[UploadFile] = File(..., description="Image files to upload"),
    current_user: User = Depends(require_permissions(["products:write"])),
    upload_service: UploadService = Depends(get_upload_service),
    product_service: ProductService = Depends(get_product_service)
):
    """
    Upload one or more images for a product.
    
    - Accepts: jpg, jpeg, png, webp, gif
    - Max size: 5MB per file
    - Images are automatically optimized and resized
    """
    # Verify product exists
    product = await product_service.get_product(product_id)
    
    # Upload images
    urls = await upload_service.upload_product_images(str(product_id), files)
    
    # Update product with new image URLs
    existing_images = product.images or []
    product.images = existing_images + urls
    await product_service.repository.session.commit()
    
    return create_success_response(
        message=f"Uploaded {len(urls)} image(s) successfully",
        data=MultiImageUploadResponse(urls=urls, count=len(urls))
    )


@router.post(
    "/admin/products/{product_id}/image",
    response_model=SuccessResponse[ImageUploadResponse],
    status_code=201
)
async def upload_single_product_image(
    product_id: UUID,
    request: Request,
    file: UploadFile = File(..., description="Image file to upload"),
    current_user: User = Depends(require_permissions(["products:write"])),
    upload_service: UploadService = Depends(get_upload_service),
    product_service: ProductService = Depends(get_product_service)
):
    """
    Upload a single image for a product.
    
    - Accepts: jpg, jpeg, png, webp, gif
    - Max size: 5MB
    - Image is automatically optimized and resized
    """
    # Verify product exists
    product = await product_service.get_product(product_id)
    
    # Upload image
    url = await upload_service.upload_product_image(str(product_id), file)
    
    # Update product with new image URL
    existing_images = product.images or []
    product.images = existing_images + [url]
    await product_service.repository.session.commit()
    
    # Extract filename from URL
    filename = url.split("/")[-1]
    
    return create_success_response(
        message="Image uploaded successfully",
        data=ImageUploadResponse(url=url, filename=filename)
    )


@router.delete(
    "/admin/products/{product_id}/images",
    response_model=SuccessResponse[dict]
)
async def delete_product_image(
    product_id: UUID,
    request: Request,
    image_url: str = Body(..., embed=True, description="URL of image to delete"),
    current_user: User = Depends(require_permissions(["products:write"])),
    upload_service: UploadService = Depends(get_upload_service),
    product_service: ProductService = Depends(get_product_service)
):
    """Delete a specific image from a product."""
    # Verify product exists
    product = await product_service.get_product(product_id)
    
    # Delete file
    deleted = upload_service.delete_product_image(image_url)
    
    # Remove URL from product
    if image_url in product.images:
        product.images = [img for img in product.images if img != image_url]
        await product_service.repository.session.commit()
    
    return create_success_response(
        message="Image deleted successfully" if deleted else "Image not found",
        data={"deleted": deleted, "url": image_url}
    )


@router.delete(
    "/admin/products/{product_id}/images/all",
    response_model=SuccessResponse[dict]
)
async def delete_all_product_images(
    product_id: UUID,
    request: Request,
    current_user: User = Depends(require_permissions(["products:write"])),
    upload_service: UploadService = Depends(get_upload_service),
    product_service: ProductService = Depends(get_product_service)
):
    """Delete all images from a product."""
    # Verify product exists
    product = await product_service.get_product(product_id)
    
    # Delete all files
    count = upload_service.delete_all_product_images(str(product_id))
    
    # Clear product images
    product.images = []
    await product_service.repository.session.commit()
    
    return create_success_response(
        message=f"Deleted {count} image(s)",
        data={"deleted_count": count}
    )


@router.put(
    "/admin/products/{product_id}/images/order",
    response_model=SuccessResponse[dict]
)
async def reorder_product_images(
    product_id: UUID,
    request: Request,
    image_urls: List[str] = Body(..., description="Ordered list of image URLs"),
    current_user: User = Depends(require_permissions(["products:write"])),
    product_service: ProductService = Depends(get_product_service)
):
    """Reorder product images."""
    # Verify product exists
    product = await product_service.get_product(product_id)
    
    # Validate all URLs exist in current images
    current_images = set(product.images or [])
    new_images = set(image_urls)
    
    if new_images != current_images:
        from app.core.exceptions import ValidationError
        from app.constants.error_codes import ErrorCode
        raise ValidationError(
            error_code=ErrorCode.FIELD_INVALID,
            message="Image URLs must match existing product images",
            field="image_urls"
        )
    
    # Update order
    product.images = image_urls
    await product_service.repository.session.commit()
    
    return create_success_response(
        message="Image order updated",
        data={"images": image_urls}
    )
