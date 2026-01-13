# KARIGOR.md - Single E-commerce Platform

This document helps AI agents work effectively in this monorepo e-commerce platform.

## Project Overview

Full-stack e-commerce application with modular architecture:
- **Backend**: FastAPI (Python 3.12+) with SQLModel, Alembic, PostgreSQL, Redis, MongoDB
- **Customer Frontend**: TanStack Start (React 19) with TanStack Query, Router, and Table
- **Admin Panel**: TanStack Start (React 19) with shadcn/ui components
- **Infrastructure**: Docker Compose for development and production

### Tech Stack Details
- **Backend**: FastAPI, SQLModel, Alembic, Pytest, Ruff, UV package manager
- **Frontend/Admin**: Vite, TanStack Start, React 19, TanStack Query/Router/Table, TailwindCSS 4, shadcn/ui
- **Databases**: PostgreSQL 15 (main), Redis 7 (cache), MongoDB 6 (audit logs)

---

## Essential Commands

### Backend (Python)

```bash
# Running locally (requires uv)
cd backend
uv sync                              # Install dependencies
./manage.py run                       # Start dev server (auto-reload)
./manage.py test                      # Run all tests
./manage.py test --docker              # Run tests in Docker
uv run pytest                         # Run tests directly
uv run ruff check .                  # Lint
uv run ruff check --fix .            # Auto-fix linting issues

# Database migrations
./manage.py migrate -m "description"  # Create migration (autogenerate)
./manage.py upgrade                  # Apply migrations
./manage.py downgrade                # Rollback last migration
# Or directly with alembic:
alembic revision --autogenerate -m "message"
alembic upgrade head

# Database seeding
./manage.py db:seed                 # Run all seeders
./manage.py db:seed permissions      # Run specific seeder
./manage.py db:seed list           # List available seeders

# Module scaffolding
./manage.py make:module my_module --colocated-test  # Create new module with tests
./manage.py make:seeder my_seeder  # Create new seeder
```

### Frontend (Customer)

```bash
cd frontend
npm run dev                        # Start dev server (port 3000)
npm run build                      # Production build
npm run serve                      # Preview production build
npm run test                       # Run tests
npm run test:coverage              # Run with coverage (80% threshold)
npm run lint                      # ESLint
npm run format                    # Prettier
npm run check                     # Format + lint
```

### Admin Panel

```bash
cd admin
npm run dev                        # Start dev server (port 3000)
npm run build                      # Production build
npm run preview                    # Preview build
npm run test                       # Run tests
npm run lint                      # ESLint
npm run format                    # Prettier
npm run check                     # Format + lint

# Add shadcn components (use latest version)
pnpx shadcn@latest add button
```

### Docker (All Services)

```bash
# Development
docker-compose up -d --build        # Start all services (dev)
docker-compose down                 # Stop all services
docker-compose logs -f backend      # Follow logs

# Run commands in containers
docker-compose exec backend ./manage.py test
docker-compose exec backend alembic upgrade head
docker-compose exec backend ./manage.py db:seed
docker-compose exec frontend npm run test

# Production
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Project Structure

```
single-ecom/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/v1/           # API routers
│   │   ├── core/              # Config, DB, security, filtering
│   │   ├── modules/           # Domain modules (DDD pattern)
│   │   │   ├── auth/         # Authentication
│   │   │   ├── users/        # User management
│   │   │   ├── roles/        # RBAC
│   │   │   ├── products/     # Products
│   │   │   ├── orders/       # Orders
│   │   │   └── ...
│   │   ├── constants/         # Enums, error codes
│   │   ├── templates/        # Email templates
│   │   └── main.py          # FastAPI app entry
│   ├── alembic/              # Migrations (auto-discovers models)
│   ├── seeders/              # Database seeding
│   ├── tests/                # Core & infrastructure tests
│   ├── conftest.py           # Pytest fixtures
│   ├── manage.py             # Management CLI
│   └── pyproject.toml        # UV dependencies
├── frontend/                 # Customer frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── routes/          # TanStack Router file-based routes
│   │   ├── integrations/     # TanStack Query, etc.
│   │   └── utils/          # Utilities (API client)
│   └── package.json
├── admin/                    # Admin panel
│   ├── src/
│   │   ├── api/             # API server functions
│   │   ├── components/       # shadcn/ui + custom
│   │   │   ├── ui/          # shadcn components
│   │   │   └── shared/      # Shared admin components
│   │   ├── hooks/           # React hooks
│   │   ├── lib/             # Utilities
│   │   └── routes/          # TanStack Router
│   └── package.json
├── scripts/                 # Pre-commit scripts
├── docker-compose.yml        # Development
├── docker-compose.prod.yml   # Production
└── .env.dev, .env.prod     # Environment files
```

---

## Backend Development

### Module Architecture (Domain-Driven Design)

Each module follows a standard structure:
```
app/modules/{module_name}/
├── __init__.py
├── models.py          # SQLModel database models
├── schemas.py        # Pydantic request/response schemas
├── repository.py     # Database access layer
├── service.py        # Business logic layer
├── endpoints.py      # FastAPI routes
└── tests/           # Module-specific tests
```

**Always use the CLI to create modules:**
```bash
./manage.py make:module my_module --colocated-test
```

### Models

- Inherit from `BaseUUIDModel` for UUID primary keys with timestamps
- Use `Field` for constraints: `max_length`, `index=True`, `unique=True`, etc.
- Define relationships with `Relationship(back_populates="...")`
- Place circular imports at bottom with `# noqa: E402`

```python
from app.core.base_model import BaseUUIDModel
from sqlmodel import Field, Relationship
from uuid import UUID, uuid4

class Product(BaseUUIDModel, table=True):
    name: str = Field(max_length=255, index=True)
    description: str | None = Field(default=None)
    # relationships
    category: "Category" = Relationship(back_populates="products")

from app.modules.catalog.models import Category  # noqa: E402
```

### Schemas

- Base schema for shared fields
- `Create` schema (inherits Base)
- `Update` schema (all optional fields for partial updates)
- `Response` schema with `model_config = ConfigDict(from_attributes=True)`

```python
from pydantic import BaseModel, ConfigDict

class ProductBase(BaseModel):
    name: str
    description: str | None = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class ProductResponse(ProductBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

### Repository Pattern

Inherit from `BaseRepository[ModelType]`:
- Gets `get()`, `get_multi()`, `get_list()` with filtering/sorting/search for free
- Add custom methods as needed

```python
from app.core.base_repository import BaseRepository
from app.modules.products.models import Product

class ProductRepository(BaseRepository[Product]):
    def __init__(self, session: AsyncSession):
        super().__init__(model=Product, db=session)

    # Custom query
    async def find_by_slug(self, slug: str) -> Product | None:
        return await self.get_by_field("slug", slug)
```

### Service Layer

Contains business logic:
- `create()`: Create from schema
- `get_list()`: Paginated list with filters, sort, search
- `get_by_id()`: Get by UUID or raise 404
- `update()`: Update from schema (uses `model_dump(exclude_unset=True)`)
- `delete()`: Delete by UUID

```python
class ProductService:
    def __init__(self, session: AsyncSession):
        self.repository = ProductRepository(session)

    async def create(self, data: ProductCreate) -> Product:
        instance = Product(**data.model_dump())
        return await self.repository.create(instance)

    async def get_by_id(self, id: UUID) -> Product:
        instance = await self.repository.get(id)
        if not instance:
            raise HTTPException(status_code=404, detail="Product not found")
        return instance
```

### Endpoints (Routes)

- Always define `response_model` using `SuccessResponse[T]` or `PaginatedResponse[T]`
- Use `doc_responses()` from `app.core.docs` for error docs
- Return `SuccessResponse(message="...", data=...)` for success
- **Critical**: When raising `ValidationError`, ALWAYS provide `field` argument

```python
from app.core.schemas.response import SuccessResponse, PaginatedResponse
from app.core.docs import doc_responses
from fastapi import APIRouter, status

router = APIRouter()

@router.post(
    "/",
    response_model=SuccessResponse[ProductResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Product",
    responses=doc_responses(
        success_message="Product created",
        errors=(400, 422)
    )
)
async def create_product(data: ProductCreate, session: AsyncSession = Depends(get_db)):
    service = ProductService(session)
    result = await service.create(data)
    return SuccessResponse(message="Product created", data=result)
```

### Filtering & Sorting

Backend uses a built-in filtering system via `BaseRepository.get_list()`:

**Query params in endpoint:**
```python
@router.get("/")
async def list_products(
    q: str | None = Query(None),           # Global search
    sort: str = Query("created_at"),       # Sort field
    order: str = Query("desc"),           # asc/desc
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    # Module-specific filters
    status: str | None = Query(None),
    min_price: float | None = Query(None),
    session: AsyncSession = Depends(get_db)
):
    filters = {"status": status}
    # Range filters use __operator syntax
    if min_price:
        filters["price__gte"] = min_price

    result = await service.get_list(
        page=page, per_page=per_page,
        filters=filters, search_query=q,
        sort_by=sort, sort_order=order
    )
    return SuccessResponse(data=result)
```

**Filter operators:**
- `field=value` or `field__eq=value`: equals
- `field__gt=value`, `field__gte=value`: greater than
- `field__lt=value`, `field__lte=value`: less than
- `field__ne=value`: not equals
- `field__like=value`: LIKE (case-sensitive)
- `field__ilike=value`: ILIKE (case-insensitive)
- `field__in=value1,value2`: IN list

### Error Handling

Use standardized error codes from `app.constants.error_codes.ErrorCode`:

```python
from app.core.exceptions import ValidationError, NotFoundError, ConflictError
from app.constants.error_codes import ErrorCode

# Validation error with field
raise ValidationError(
    error_code=ErrorCode.FIELD_REQUIRED,
    message="Email is required",
    field="email"
)

# Not found
raise NotFoundError(
    error_code=ErrorCode.USER_NOT_FOUND,
    message="User not found"
)

# Conflict
raise ConflictError(
    error_code=ErrorCode.USER_ALREADY_EXISTS,
    message="User with this email exists"
)
```

**Error response format:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials",
    "field": null
  }
}
```

### Testing

**Test database**: Automatically uses separate `test_db` (configured in conftest.py)

**Test patterns:**
- Place module tests in `app/modules/{module}/tests/test_{module}.py`
- Place core/infrastructure tests in `tests/`
- Use `@pytest.mark.asyncio` for async tests
- Use the `client` fixture for API tests (shares session with test data)

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_product(client: AsyncClient):
    payload = {"name": "Test Product"}
    response = await client.post("/api/v1/products/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "Test Product"

@pytest.mark.asyncio
async def test_list_products_filtering(client: AsyncClient):
    # Create items
    await client.post("/api/v1/products/", json={"name": "Alpha"})
    await client.post("/api/v1/products/", json={"name": "Beta"})

    # Test search
    response = await client.get("/api/v1/products/?q=Alpha")
    assert response.status_code == 200
    items = response.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Alpha"

    # Test sorting
    response = await client.get("/api/v1/products/?sort=name&order=desc")
    assert response.status_code == 200
    items = response.json()["data"]["items"]
    names = [item["name"] for item in items]
    assert names == ["Beta", "Alpha"]  # Descending order
```

### Database Migrations

Alembic auto-discovers models from `app/modules/*/models.py` - **no manual editing needed**.

```bash
# Create migration after model changes
alembic revision --autogenerate -m "Add discount field to products"

# Review generated migration
# Apply migration
alembic upgrade head
```

### Seeders

Seeders populate initial data (permissions, roles, super admin, etc.).

```bash
# List seeders
./manage.py db:seed list

# Run specific seeder
./manage.py db:seed permissions

# Run all seeders (in order by `order` attribute)
./manage.py db:seed

# Force re-run
./manage.py db:seed permissions --force
```

---

## Frontend (Customer) Development

### Routing

TanStack Start uses file-based routing:
```
src/routes/
├── __root.tsx              # Root layout with providers
├── index.tsx               # Home page (/)
└── products/
    └── $slug.tsx          # Dynamic route (/products/:slug)
```

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$slug')({
  component: RouteComponent,
})

function RouteComponent() {
  const { slug } = Route.useParams()
  // ...
}
```

### API Calls

Use `createServerFn` from TanStack Start for server functions:

```typescript
import { createServerFn } from "@tanstack/react-start"
import { apiRequest, ApiResponse } from "./client"

export const getProducts = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data?: { page?: number; limit?: number } }) => {
    const query = new URLSearchParams();
    if (data?.page) query.set("page", data.page.toString());
    if (data?.limit) query.set("limit", data.limit.toString());

    return apiRequest<ApiResponse<Product[]>>(`/products?${query.toString()}`);
  });

export const createProduct = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { product: Partial<Product>; token: string } }) => {
    return apiRequest<ApiResponse<Product>>(
      "/products",
      { method: "POST", body: JSON.stringify(data.product) },
      data.token
    );
  });
```

**API client** (`utils/api-client.ts`) handles:
- Automatic token refresh on 401
- Error extraction and throwing `ApiError`
- Headers management

### TanStack Query

Queries and mutations are defined in routes:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, createProduct } from '@/utils/api-client'

function ProductsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts({ data: { page: 1, limit: 20 } })
  })

  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}
```

---

## Admin Panel Development

### Routing Structure

Same file-based routing as frontend:
```
src/routes/
├── __root.tsx              # Root with QueryClient, AuthProvider, Toaster
├── index.tsx               # Login redirect
└── dashboard/
    ├── index.tsx            # Dashboard home
    ├── products/
    │   └── index.tsx       # Products list
    └── orders/
        └── index.tsx       # Orders list
```

### Components

- **shadcn/ui**: Pre-built components in `src/components/ui/`
- **Custom**: Shared components in `src/components/shared/`
- Use `pnpx shadcn@latest add <component>` to add new shadcn components

### Data Tables

Admin uses `DataTable` component with TanStack Table for server-side pagination/sorting/filtering:

```typescript
import { DataTable } from '@/components/shared/data-table'
import { getProducts } from '@/api/products'

function ProductsTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ['products', pagination, sorting, globalFilter],
    queryFn: () => getProducts({
      data: {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        ...(globalFilter && { search: globalFilter })
      }
    })
  })

  const columns: ColumnDef<Product>[] = [
    // Define columns
  ]

  return (
    <DataTable
      columns={columns}
      data={data?.items || []}
      pageCount={data?.pages || 0}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      manualPagination={true}
      isLoading={isLoading}
    />
  )
}
```

### API Integration

Admin API functions in `src/api/` use `createServerFn` pattern:

```typescript
import { createServerFn } from "@tanstack/react-start"
import { apiRequest, ApiResponse } from "./client"

export const getProducts = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data?: { page?: number; limit?: number; search?: string } }) => {
    const query = new URLSearchParams();
    if (data?.page) query.set("page", data.page.toString());
    if (data?.limit) query.set("limit", data.limit.toString());
    if (data?.search) query.set("search", data.search);

    return apiRequest<ApiResponse<Product[]>>(`/products?${query.toString()}`);
  });
```

### Authentication

Admin uses `AuthProvider` for auth state and token management:
- Login stores access/refresh tokens
- API client auto-refreshes tokens via `setTokenRefreshCallback`
- Protected routes check auth status

---

## Testing

### Backend (pytest)

```bash
# All tests
./manage.py test

# Specific test file
uv run pytest app/modules/auth/tests/test_auth.py -v

# With coverage
uv run pytest --cov=app --cov-report=html

# Watch mode (requires pytest-watch)
./manage.py test --watch
```

**Test fixtures** (conftest.py):
- `session`: AsyncSession for direct DB access
- `client`: AsyncClient for API tests (shares session)
- `setup_test_db`: Creates/drops test database
- `reset_redis`: Clears Redis between tests
- `setup_mongo_test_db`: Uses MongoDB test database

### Frontend/Admin (vitest)

```bash
# Frontend
cd frontend && npm run test
cd frontend && npm run test:coverage

# Admin
cd admin && npm run test
```

---

## Code Conventions

### Backend (Python)

- **Package manager**: `uv` (not pip)
- **Type hints**: Required for all functions
- **Async/await**: Use for all I/O operations
- **Line length**: 100 characters (Ruff config)
- **Import order**: stdlib, third-party, local (with blank lines)
- **Naming**:
  - Classes: `PascalCase`
  - Functions/variables: `snake_case`
  - Constants: `UPPER_SNAKE_CASE`

### Frontend/Admin (TypeScript)

- **Framework**: TanStack Start, React 19
- **State**: TanStack Query for server state
- **Routing**: TanStack Router (file-based)
- **Styling**: TailwindCSS 4
- **UI Library**: shadcn/ui (admin panel)
- **Components**: Functional components with hooks
- **Naming**:
  - Components: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`

---

## Important Gotchas

### Backend

1. **Rate limiting**: Disabled when `TESTING=1` environment variable is set
2. **Alembic auto-discovery**: Never edit `alembic/env.py` - models are auto-discovered from `app/modules/*/models.py`
3. **Validation errors**: ALWAYS provide `field` argument to map errors to form fields
4. **Test database**: Separate from dev database, automatically created/dropped
5. **UUID primary keys**: Use `BaseUUIDModel` for automatic UUID and timestamps
6. **Repository `get_list()`**: Returns `(items, total)` tuple, not just items
7. **Circular imports**: Place at bottom with `# noqa: E402` comment
8. **Response models**: Always wrap in `SuccessResponse[T]` or `PaginatedResponse[T]`
9. **Filter operators**: Use double underscore syntax (`price__gte` for >=)
10. **MongoDB**: Used only for audit logs, not main data

### Frontend/Admin

1. **Node version**: Requires Node 22+
2. **Environment variables**: Use `VITE_` prefix for frontend, no prefix for admin
3. **API URL**: Frontend uses `VITE_API_URL`, Admin uses `API_URL`
4. **Server functions**: Must use `createServerFn` for TanStack Start
5. **Debouncing**: DataTable has 500ms search debounce built-in
6. **Token refresh**: Automatic on 401, requires `setTokenRefreshCallback` setup
7. **Pre-commit**: Frontend/Admin run lint-staged on commit
8. **Shadcn**: Always use latest version: `pnpx shadcn@latest add <component>`

### Docker

1. **Hot reload**: Backend uses `--reload` flag in dev mode
2. **Database health checks**: Services wait for DB/Redis to be healthy
3. **Volumes**: `node_modules` is excluded in admin/frontend volumes
4. **Port conflicts**: Backend on 8000, Frontend on 3000, Admin also on 3000 (don't run both simultaneously)
5. **Environment files**: Backend uses `.env`, Frontend uses `.env`, Admin uses `.env`

---

## Pre-commit Hooks

Automated checks on commit:
- **Backend**: Ruff lint + format
- **Frontend/Admin**: ESLint + Prettier
- **Tests**: Backend and frontend test suites run
- **Commit size**: Limits commit size (see `scripts/pre-commit/check-commit-size.sh`)

Skip hooks (not recommended): `git commit --no-verify`

---

## Environment Configuration

### Backend (.env)

Required variables (see `backend/.env.example`):
- Database: `POSTGRES_SERVER`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- Redis: `REDIS_HOST`, `REDIS_PORT`
- MongoDB: `MONGO_URI`, `MONGO_DB_NAME`
- Security: `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- OTP: `OTP_LENGTH`, `OTP_EXPIRE_MINUTES`, `OTP_MAX_ATTEMPTS`

### Frontend (.env)

See `frontend/.env.example`:
- `VITE_API_URL`: Backend API URL
- `VITE_APP_NAME`, `VITE_APP_ENV`

### Admin (.env)

See `admin/.env.example`:
- `API_URL`: Backend API URL (no VITE_ prefix)

### Docker Compose

Root environment files:
- `.env.dev`: Development defaults
- `.env.prod`: Production values

---

## API Response Format

### Success
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": { ... }
}
```

### Paginated Success
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials",
    "field": null
  }
}
```

### Validation Error (422)
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Request validation failed",
    "field": null
  },
  "errors": [
    {
      "code": "FIELD_REQUIRED",
      "message": "Email is required",
      "field": "email"
    }
  ]
}
```

---

## Quick Reference

### Common Tasks

**Add new backend module:**
```bash
cd backend && ./manage.py make:module my_module --colocated-test
```

**Add shadcn component to admin:**
```bash
cd admin && pnpx shadcn@latest add button
```

**Create database migration:**
```bash
cd backend && alembic revision --autogenerate -m "description"
```

**Run tests:**
```bash
# Backend
cd backend && ./manage.py test

# Frontend
cd frontend && npm run test

# Admin
cd admin && npm run test
```

**Start everything:**
```bash
docker-compose up -d --build
```

### Key Files Reference

- `backend/manage.py`: Management CLI (test, migrate, seed, scaffold)
- `backend/app/core/base_repository.py`: Repository with CRUD + filtering
- `backend/app/core/filtering.py`: Filter/sort/search utilities
- `backend/app/core/schemas/response.py`: Response schemas
- `backend/conftest.py`: Test fixtures
- `backend/alembic/env.py`: Migration config (auto-discovers models)
- `admin/src/api/client.ts`: API client with token refresh
- `admin/src/components/shared/data-table.tsx`: Reusable table component

---

## Error Code Reference

See `backend/docs/error_codes.md` and `backend/app/constants/error_codes.py` for complete list.

Common codes:
- `AUTH_001`: Invalid credentials
- `AUTH_005`: Token expired
- `USER_001`: User not found
- `USER_002`: User already exists
- `PERM_001`: Permission denied
- `VAL_002`: Field required
- `VAL_003`: Field invalid
- `RATE_001`: Rate limit exceeded
