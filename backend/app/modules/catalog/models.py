from typing import Optional, List
from uuid import UUID, uuid4
from sqlmodel import Field, Relationship, SQLModel
from datetime import datetime

class CategoryBase(SQLModel):
    name: str = Field(index=True)
    slug: str = Field(unique=True, index=True)
    is_active: bool = Field(default=True)
    icon: Optional[str] = Field(default=None)
    banner: Optional[str] = Field(default=None)
    level: int = Field(default=0, description="Hierarchy level: 0=Root, 1=Sub, 2=Leaf")
    path: str = Field(index=True, description="Materialized path for efficiency, e.g. root_id/sub_id")

class Category(CategoryBase, table=True):
    __tablename__ = "categories"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    parent_id: Optional[UUID] = Field(default=None, foreign_key="categories.id", nullable=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    parent: Optional["Category"] = Relationship(
        sa_relationship_kwargs={
            "remote_side": "Category.id",
            "backref": "children"
        }
    )
    # Note: 'children' backref is created automatically by the line above
