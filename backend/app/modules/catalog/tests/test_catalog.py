import pytest
from uuid import uuid4
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalog.models import Category
from app.modules.catalog.service import CategoryService
from app.modules.catalog.repository import CategoryRepository
from app.modules.catalog.schemas import CategoryCreate
from app.core.exceptions import ValidationError, ConflictError

@pytest.mark.asyncio
async def test_category_hierarchy_depth(session: AsyncSession, mock_audit_service):
    """Test 3-level depth constraint."""
    repo = CategoryRepository(session)
    service = CategoryService(repo, mock_audit_service)
    actor_id = str(uuid4())

    # Level 0 (Root)
    root = await service.create_category(
        CategoryCreate(name="Root", slug="root"), actor_id
    )
    assert root.level == 0
    assert root.path == str(root.id)

    # Level 1 (Sub)
    sub = await service.create_category(
        CategoryCreate(name="Sub", slug="sub", parent_id=root.id), actor_id
    )
    assert sub.level == 1
    assert sub.path == f"{root.path}/{sub.id}"

    # Level 2 (Leaf)
    leaf = await service.create_category(
        CategoryCreate(name="Leaf", slug="leaf", parent_id=sub.id), actor_id
    )
    assert leaf.level == 2

    # Level 3 (Should Fail)
    with pytest.raises(ValidationError) as exc:
        await service.create_category(
            CategoryCreate(name="Fail", slug="fail", parent_id=leaf.id), actor_id
        )
    assert "depth" in str(exc.value).lower()

@pytest.mark.asyncio
async def test_category_deletion_protection(session: AsyncSession, mock_audit_service):
    """Test strict deletion logic."""
    repo = CategoryRepository(session)
    service = CategoryService(repo, mock_audit_service)
    actor_id = str(uuid4())

    # Setup Parent -> Child
    parent = await service.create_category(CategoryCreate(name="Parent", slug="parent"), actor_id)
    child = await service.create_category(CategoryCreate(name="Child", slug="child", parent_id=parent.id), actor_id)

    # Try Delete Parent (Should Fail)
    with pytest.raises(ConflictError) as exc:
        await service.delete_category(parent.id, actor_id)
    assert "subcategories" in str(exc.value)

    # Delete Child (Should Succeed)
    await service.delete_category(child.id, actor_id)

    # Delete Parent (Should Succeed now)
    await service.delete_category(parent.id, actor_id)
    
    # Verify Gone
    assert await repo.get(parent.id) is None

@pytest.fixture
def mock_audit_service():
    class MockAudit:
        async def log_action(self, *args, **kwargs):
            pass
    return MockAudit()
