"""
Upload service for handling file uploads.
"""
import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import UploadFile, HTTPException
from PIL import Image

from app.core.config import settings
from app.core.exceptions import ValidationError
from app.constants.error_codes import ErrorCode


# Allowed image types
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
IMAGE_QUALITY = 85
MAX_IMAGE_DIMENSION = 2000  # Max width/height


class UploadService:
    """Service for handling file uploads."""
    
    def __init__(self, upload_dir: str = "static/uploads"):
        self.base_upload_dir = Path(upload_dir)
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create upload directories if they don't exist."""
        dirs = ["products", "brands", "collections", "categories"]
        for d in dirs:
            (self.base_upload_dir / d).mkdir(parents=True, exist_ok=True)
    
    def _get_extension(self, filename: str) -> str:
        """Get file extension from filename."""
        return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    def _validate_file(self, file: UploadFile) -> str:
        """Validate uploaded file and return extension."""
        if not file.filename:
            raise ValidationError(
                error_code=ErrorCode.FIELD_REQUIRED,
                message="Filename is required",
                field="file"
            )
        
        ext = self._get_extension(file.filename)
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationError(
                error_code=ErrorCode.FIELD_INVALID,
                message=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
                field="file"
            )
        
        return ext
    
    def _generate_filename(self, original_name: str, prefix: str = "") -> str:
        """Generate a unique filename."""
        ext = self._get_extension(original_name)
        unique_id = uuid.uuid4().hex[:12]
        if prefix:
            return f"{prefix}_{unique_id}.{ext}"
        return f"{unique_id}.{ext}"
    
    def _optimize_image(self, file_path: Path, max_size: int = MAX_IMAGE_DIMENSION) -> None:
        """Optimize image: resize if too large and compress."""
        try:
            with Image.open(file_path) as img:
                # Convert RGBA to RGB for JPEG
                if img.mode == 'RGBA' and file_path.suffix.lower() in ['.jpg', '.jpeg']:
                    img = img.convert('RGB')
                
                # Resize if larger than max dimension
                if img.width > max_size or img.height > max_size:
                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                # Save with optimization
                if file_path.suffix.lower() in ['.jpg', '.jpeg']:
                    img.save(file_path, 'JPEG', quality=IMAGE_QUALITY, optimize=True)
                elif file_path.suffix.lower() == '.png':
                    img.save(file_path, 'PNG', optimize=True)
                elif file_path.suffix.lower() == '.webp':
                    img.save(file_path, 'WEBP', quality=IMAGE_QUALITY)
                else:
                    img.save(file_path)
        except Exception as e:
            # If optimization fails, keep original
            pass
    
    async def upload_product_image(
        self, 
        product_id: str, 
        file: UploadFile,
        optimize: bool = True
    ) -> str:
        """
        Upload a product image.
        
        Returns the relative URL path to the uploaded image.
        """
        ext = self._validate_file(file)
        
        # Create product-specific directory
        product_dir = self.base_upload_dir / "products" / product_id
        product_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        filename = self._generate_filename(file.filename, prefix="img")
        file_path = product_dir / filename
        
        # Read and validate file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise ValidationError(
                error_code=ErrorCode.FIELD_INVALID,
                message=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB",
                field="file"
            )
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Optimize image
        if optimize:
            self._optimize_image(file_path)
        
        # Return relative URL path
        return f"/static/uploads/products/{product_id}/{filename}"
    
    async def upload_product_images(
        self,
        product_id: str,
        files: List[UploadFile],
        optimize: bool = True
    ) -> List[str]:
        """Upload multiple product images."""
        urls = []
        for file in files:
            url = await self.upload_product_image(product_id, file, optimize)
            urls.append(url)
        return urls
    
    def delete_product_image(self, image_url: str) -> bool:
        """Delete a product image by its URL."""
        # Convert URL to file path
        if image_url.startswith("/static/uploads/"):
            relative_path = image_url.replace("/static/uploads/", "")
            file_path = self.base_upload_dir / relative_path
            
            if file_path.exists():
                file_path.unlink()
                return True
        return False
    
    def delete_all_product_images(self, product_id: str) -> int:
        """Delete all images for a product."""
        product_dir = self.base_upload_dir / "products" / product_id
        count = 0
        
        if product_dir.exists():
            for file in product_dir.iterdir():
                if file.is_file():
                    file.unlink()
                    count += 1
            # Remove empty directory
            try:
                product_dir.rmdir()
            except OSError:
                pass
        
        return count
    
    async def upload_brand_logo(self, brand_id: str, file: UploadFile) -> str:
        """Upload a brand logo."""
        ext = self._validate_file(file)
        
        filename = f"{brand_id}_logo.{ext}"
        file_path = self.base_upload_dir / "brands" / filename
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise ValidationError(
                error_code=ErrorCode.FIELD_INVALID,
                message=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB",
                field="file"
            )
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        self._optimize_image(file_path, max_size=500)
        
        return f"/static/uploads/brands/{filename}"
    
    async def upload_collection_image(self, collection_id: str, file: UploadFile) -> str:
        """Upload a collection banner/image."""
        ext = self._validate_file(file)
        
        filename = f"{collection_id}_banner.{ext}"
        file_path = self.base_upload_dir / "collections" / filename
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise ValidationError(
                error_code=ErrorCode.FIELD_INVALID,
                message=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB",
                field="file"
            )
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        self._optimize_image(file_path, max_size=1200)
        
        return f"/static/uploads/collections/{filename}"
    
    async def upload_category_icon(self, category_id: str, file: UploadFile) -> str:
        """Upload a category icon."""
        ext = self._validate_file(file)
        
        filename = f"{category_id}_icon.{ext}"
        file_path = self.base_upload_dir / "categories" / filename
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise ValidationError(
                error_code=ErrorCode.FIELD_INVALID,
                message=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB",
                field="file"
            )
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        self._optimize_image(file_path, max_size=256)
        
        return f"/static/uploads/categories/{filename}"

    async def upload_category_image_generic(self, file: UploadFile, type: str = "image") -> str:
        """
        Upload a generic category image (icon or banner).
        Generates a random filename.
        """
        ext = self._validate_file(file)
        
        # Determine prefix based on type
        prefix = "icon" if type == "icon" else "banner"
        filename = self._generate_filename(file.filename, prefix=prefix)
        file_path = self.base_upload_dir / "categories" / filename
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise ValidationError(
                error_code=ErrorCode.FIELD_INVALID,
                message=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB",
                field="file"
            )
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Optimization based on type
        if type == "icon":
            self._optimize_image(file_path, max_size=256)
        else:
            self._optimize_image(file_path, max_size=1200)
            
        return f"/static/uploads/categories/{filename}"

    def list_category_images(self) -> List[dict]:
        """List all category images."""
        category_dir = self.base_upload_dir / "categories"
        images = []
        
        if category_dir.exists():
            for file in category_dir.iterdir():
                if file.is_file() and self._get_extension(file.name) in ALLOWED_EXTENSIONS:
                    images.append({
                        "url": f"/static/uploads/categories/{file.name}",
                        "filename": file.name,
                        "mtime": file.stat().st_mtime
                    })
        
        # Sort by modification time, newest first
        images.sort(key=lambda x: x["mtime"], reverse=True)
        
        return images
