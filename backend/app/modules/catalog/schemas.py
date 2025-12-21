from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# Base Schema
class CategoryBase(BaseModel):
    name: str
    slug: str
    is_active: bool = True
    icon: Optional[str] = None
    banner: Optional[str] = None

# Create Schema
class CategoryCreate(CategoryBase):
    parent_id: Optional[UUID] = None

# Update Schema
class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    is_active: Optional[bool] = None
    icon: Optional[str] = None
    banner: Optional[str] = None
    parent_id: Optional[UUID] = None

# Response Schema
class CategoryResponse(CategoryBase):
    id: UUID
    parent_id: Optional[UUID]
    level: int
    path: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Tree Response Schema
class CategoryTreeResponse(CategoryResponse):
    children: List["CategoryTreeResponse"] = []

class CategoryListResponse(BaseModel):
    items: List[CategoryResponse]
    total: int
    page: int
    per_page: int
