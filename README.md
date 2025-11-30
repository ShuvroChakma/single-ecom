# E-commerce Platform

A full-stack e-commerce application built with Django (Backend), TanStack Start (Frontend), PostgreSQL, Redis, and Celery.

## Tech Stack

- **Backend**: Django 5.2 + Django REST Framework
- **Frontend**: TanStack Start (React 19) - **Requires Node 22+**
- **Database**: PostgreSQL 15
- **Cache & Message Broker**: Redis 7
- **Task Queue**: Celery 5
- **Containerization**: Docker + Docker Compose

## Prerequisites

- Docker & Docker Compose
- Git

## Quick Start

### Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd single-ecom
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin
   - Frontend: http://localhost:3000
   - Redis: localhost:6379

4. **Create a superuser** (first time only)
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

### Production Environment

1. **Update environment variables**
   - Edit `.env.prod` with production values
   - **IMPORTANT**: Change `SECRET_KEY` to a secure random string

2. **Build and start services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

## Project Structure

```
single-ecom/
├── backend/              # Django application
│   ├── config/          # Project configuration
│   │   ├── constants.py # Configuration constants
│   │   ├── celery.py    # Celery configuration
│   │   ├── settings.py  # Django settings
│   │   └── tasks.py     # Example Celery tasks
│   ├── Dockerfile       # Backend container
│   └── requirements.txt # Python dependencies
├── frontend/            # TanStack Start application
│   ├── Dockerfile       # Frontend container
│   └── package.json     # Node dependencies
├── docker-compose.yml   # Development setup
├── docker-compose.prod.yml # Production setup
├── .env.dev            # Development environment variables
└── .env.prod           # Production environment variables
```

## Environment Variables

### Backend (.env.dev / .env.prod)

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Debug mode (0 or 1) | 1 (dev), 0 (prod) |
| `SECRET_KEY` | Django secret key | - |
| `DJANGO_ALLOWED_HOSTS` | Allowed hosts | localhost 127.0.0.1 |
| `DB_ENGINE` | Database engine | django.db.backends.postgresql |
| `DB_NAME` | Database name | hello_django_dev |
| `DB_USER` | Database user | hello_django |
| `DB_PASSWORD` | Database password | hello_django |
| `DB_HOST` | Database host | db |
| `DB_PORT` | Database port | 5432 |
| `DATABASE` | Database type | postgres |
| `REDIS_URL` | Redis connection URL | redis://redis:6379/0 |

## Development Workflow

### Running Tests

**Backend (pytest with 90% coverage requirement)**
```bash
docker-compose exec backend pytest
```

**Frontend (Vitest)**
```bash
docker-compose exec frontend npm run test
```

**Frontend E2E (Playwright)**
```bash
docker-compose exec frontend npm run e2e
```

### Working with Celery

**View Celery logs**
```bash
docker-compose logs -f celery
```

**Test a Celery task**
```bash
docker-compose exec backend python manage.py shell
>>> from config.tasks import add
>>> result = add.delay(4, 6)
>>> result.get()
10
```

### Database Migrations

**Create migrations**
```bash
docker-compose exec backend python manage.py makemigrations
```

**Apply migrations**
```bash
docker-compose exec backend python manage.py migrate
```

### Accessing Services

**Django shell**
```bash
docker-compose exec backend python manage.py shell
```

**Redis CLI**
```bash
docker-compose exec redis redis-cli
```

**PostgreSQL**
```bash
docker-compose exec db psql -U hello_django -d hello_django_dev
```

## Git Branching Strategy

We follow a **Git Flow** branching model for organized development and releases.

### Branch Types

#### 1. Main Branches

- **`main`** (or `master`)
  - Production-ready code
  - Always stable and deployable
  - Protected branch (requires pull request + reviews)
  - Tagged with version numbers (e.g., `v1.0.0`, `v1.1.0`)

- **`develop`**
  - Integration branch for features
  - Latest development changes
  - Base branch for feature branches

#### 2. Supporting Branches

- **`feature/*`**
  - New features or enhancements
  - Branch from: `develop`
  - Merge into: `develop`
  - Naming: `feature/user-authentication`, `feature/product-catalog`

- **`bugfix/*`**
  - Bug fixes for development
  - Branch from: `develop`
  - Merge into: `develop`
  - Naming: `bugfix/fix-login-error`, `bugfix/cart-calculation`

- **`hotfix/*`**
  - Critical fixes for production
  - Branch from: `main`
  - Merge into: `main` AND `develop`
  - Naming: `hotfix/security-patch`, `hotfix/payment-failure`

- **`release/*`**
  - Prepare for production release
  - Branch from: `develop`
  - Merge into: `main` AND `develop`
  - Naming: `release/v1.0.0`, `release/v1.1.0`

### Workflow Examples

#### Creating a Feature

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/add-payment-gateway

# Work on feature, commit changes
git add .
git commit -m "feat: implement stripe payment integration"

# Push to remote
git push origin feature/add-payment-gateway

# Create pull request to develop
# After review and approval, merge to develop
```

#### Creating a Hotfix

```bash
# Start from main
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/fix-checkout-crash

# Fix the issue
git add .
git commit -m "fix: resolve null pointer in checkout process"

# Push to remote
git push origin hotfix/fix-checkout-crash

# Create pull request to main
# After merge, also merge to develop
git checkout develop
git merge hotfix/fix-checkout-crash
git push origin develop
```

#### Creating a Release

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create release branch
git checkout -b release/v1.0.0

# Update version numbers, changelog, final testing
git add .
git commit -m "chore: prepare release v1.0.0"

# Merge to main
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge release/v1.0.0
git push origin develop

# Delete release branch
git branch -d release/v1.0.0
```

### Commit Message Convention

We follow **Conventional Commits** for clear and consistent commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add JWT authentication
fix(cart): resolve item duplication issue
docs(readme): update installation instructions
test(products): add unit tests for product model
```

### Pull Request Guidelines

1. **Title**: Use conventional commit format
2. **Description**: Explain what and why
3. **Link Issues**: Reference related issues (#123)
4. **Tests**: Ensure all tests pass
5. **Coverage**: Maintain 90% test coverage
6. **Reviews**: Require at least 1 approval
7. **Conflicts**: Resolve before merging

## API Response Format

All API endpoints follow a standardized response format for consistency and ease of frontend integration.

### Standard Response Structure

```json
{
  "success": true,
  "data": {...} or [...] or null,
  "message": "Human-readable message",
  "errors": [],
  "meta": {
    "timestamp": "2025-11-29T17:46:44.940609Z"
  }
}
```

### Response Types

#### Success Response (200, 201)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Product Name"
  },
  "message": "Product retrieved successfully",
  "errors": [],
  "meta": {
    "timestamp": "2025-11-29T17:46:44.940609Z"
  }
}
```

#### Error Response (400, 404, 500)
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_format"
    }
  ],
  "meta": {
    "timestamp": "2025-11-29T17:46:44.940609Z"
  }
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "message": "Products retrieved successfully",
  "errors": [],
  "meta": {
    "timestamp": "2025-11-29T17:46:44.940609Z",
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 100,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### Backend Usage

```python
from config.api_response import APIResponse

# Success
def get_product(request, pk):
    product = Product.objects.get(pk=pk)
    return APIResponse.success(
        data=ProductSerializer(product).data,
        message="Product retrieved successfully"
    )

# Error
def create_product(request):
    return APIResponse.error(
        message="Validation failed",
        errors=[{"field": "name", "message": "Required"}],
        status_code=400
    )

# Paginated
def list_products(request):
    return APIResponse.paginated(
        data=products_data,
        page=1,
        per_page=20,
        total=100
    )
```

### Frontend Usage (TypeScript)

```typescript
interface APIResponse<T = any> {
  success: boolean;
  data: T | null;
  message: string;
  errors: APIError[];
  meta: APIMeta;
}

// Usage
async function fetchProduct(id: number) {
  const response = await fetch(`/api/v1/products/${id}/`);
  const data: APIResponse<Product> = await response.json();
  
  if (data.success) {
    console.log(data.data); // Type-safe product data
  } else {
    console.error(data.message, data.errors);
  }
}
```

### Available Endpoints

- **Health Check**: `GET /api/v1/health/` - Service health status

## Error Handling

The backend includes a comprehensive error handling system that automatically catches and formats all errors into the standardized API response format.

### Custom Exceptions

```python
from config.exceptions import (
    ValidationError,      # 400 - Validation errors
    BadRequestError,      # 400 - Bad request
    UnauthorizedError,    # 401 - Authentication required
    ForbiddenError,       # 403 - Access forbidden
    NotFoundError,        # 404 - Resource not found
    ConflictError,        # 409 - Resource conflict
    RateLimitError,       # 429 - Rate limit exceeded
    ServerError,          # 500 - Internal server error
)
```

### Usage in Views

```python
from config.exceptions import ValidationError, NotFoundError

def get_product(request, pk):
    # Raise not found error
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        raise NotFoundError(f"Product {pk} not found")
    
    # Raise validation error with field-specific errors
    if not product.is_active:
        raise ValidationError(
            message="Product is not available",
            errors=[
                {"field": "status", "message": "Product is inactive"}
            ]
        )
```

### Error Response Format

```json
{
  "success": false,
  "data": null,
  "message": "Product 123 not found",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "meta": {
    "timestamp": "2025-11-30T04:52:37.123456Z"
  }
}
```

### Automatic Error Handling

The global exception handler middleware automatically catches:
- Custom API exceptions
- Django validation errors
- DRF exceptions
- Database integrity errors (unique constraints, foreign keys)
- Permission errors
- Unexpected exceptions (logged and returned as 500)

All errors are logged and formatted consistently. See `backend/ERROR_HANDLING.md` for detailed documentation.

## Best Practices & Coding Standards

### General Principles

1. **DRY (Don't Repeat Yourself)**: Extract reusable code into functions, classes, or modules
2. **KISS (Keep It Simple, Stupid)**: Favor simple, readable solutions over complex ones
3. **YAGNI (You Aren't Gonna Need It)**: Don't add functionality until it's needed
4. **Separation of Concerns**: Keep business logic, data access, and presentation separate
5. **Code Reviews**: All code must be reviewed before merging
6. **Test-Driven Development**: Write tests before or alongside code (90% coverage required)

### Backend (Django/Python)

#### Code Style

- **Follow PEP 8**: Use `black` for formatting and `flake8` for linting
- **Line Length**: Maximum 88 characters (Black default)
- **Imports**: Group in order: standard library, third-party, local
- **Type Hints**: Use type hints for function signatures

```python
# Good
from typing import List, Optional

def get_active_products(category_id: Optional[int] = None) -> List[Product]:
    """Retrieve active products, optionally filtered by category."""
    queryset = Product.objects.filter(is_active=True)
    if category_id:
        queryset = queryset.filter(category_id=category_id)
    return list(queryset)
```

#### Django Best Practices

**Models**
- Use descriptive model and field names
- Add `verbose_name` and `help_text` to fields
- Implement `__str__()` method for all models
- Use `Meta` class for ordering and indexes
- Add database indexes for frequently queried fields

```python
class Product(models.Model):
    name = models.CharField(max_length=200, verbose_name="Product Name")
    slug = models.SlugField(unique=True, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug', 'is_active']),
        ]
    
    def __str__(self):
        return self.name
```

**Views & Serializers**
- Use class-based views for consistency
- Keep views thin, move logic to services/managers
- Validate data in serializers, not views
- Use `select_related()` and `prefetch_related()` to avoid N+1 queries

```python
# Good - Optimized query
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').prefetch_related('images')
    serializer_class = ProductSerializer
```

**Configuration**
- Never hardcode values - use `constants.py` or environment variables
- Keep sensitive data in environment variables
- Use different settings for dev/staging/production

**Celery Tasks**
- Keep tasks idempotent (safe to run multiple times)
- Add retry logic with exponential backoff
- Use meaningful task names

```python
@shared_task(bind=True, max_retries=3)
def send_order_confirmation(self, order_id: int):
    try:
        order = Order.objects.get(id=order_id)
        send_email(order.customer.email, order)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

#### Testing

- **Unit Tests**: Test individual functions/methods
- **Integration Tests**: Test API endpoints
- **Use Fixtures**: Create reusable test data with `model_bakery`
- **Mock External Services**: Don't make real API calls in tests

```python
from model_bakery import baker

def test_product_creation():
    product = baker.make(Product, name="Test Product")
    assert product.name == "Test Product"
    assert product.slug is not None
```

### Frontend (React/TanStack Start)

#### Code Style

- **Use TypeScript**: Type safety prevents bugs
- **ESLint & Prettier**: Enforce consistent formatting
- **Component Naming**: PascalCase for components, camelCase for functions

#### React Best Practices

**Component Structure**
- Keep components small and focused (< 200 lines)
- Use functional components with hooks
- Extract custom hooks for reusable logic
- Separate business logic from UI

```tsx
// Good - Separated concerns
function useProductData(productId: string) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProduct(productId).then(setProduct).finally(() => setLoading(false));
  }, [productId]);
  
  return { product, loading };
}

function ProductDetail({ productId }: { productId: string }) {
  const { product, loading } = useProductData(productId);
  
  if (loading) return <Spinner />;
  return <div>{product.name}</div>;
}
```

**State Management**
- Use local state when possible
- Lift state up when needed by multiple components
- Use context for global state (auth, theme)
- Consider Zustand or Redux for complex state

**Performance**
- Use `React.memo()` for expensive components
- Memoize callbacks with `useCallback()`
- Memoize computed values with `useMemo()`
- Lazy load routes and heavy components

```tsx
const ProductList = React.memo(({ products }) => {
  return products.map(p => <ProductCard key={p.id} product={p} />);
});
```

**Naming Conventions**
- Components: `ProductCard.tsx`
- Hooks: `useProductData.ts`
- Utils: `formatPrice.ts`
- Types: `product.types.ts`

#### Testing

- **Unit Tests**: Test components in isolation (Vitest)
- **E2E Tests**: Test user flows (Playwright)
- **Test User Behavior**: Not implementation details
- **Use Testing Library**: Query by role, label, text

```tsx
import { render, screen } from '@testing-library/react';

test('displays product name', () => {
  render(<ProductCard product={{ name: 'Test Product' }} />);
  expect(screen.getByText('Test Product')).toBeInTheDocument();
});
```

### Database

**Migrations**
- Never edit existing migrations
- Test migrations on a copy of production data
- Make migrations reversible when possible
- Add indexes for foreign keys and frequently queried fields

**Queries**
- Use indexes for WHERE, ORDER BY, JOIN columns
- Avoid SELECT * - specify needed fields
- Use pagination for large datasets
- Monitor slow queries with Django Debug Toolbar (dev only)

### Security

**Backend**
- Validate all user input
- Use parameterized queries (Django ORM does this)
- Implement rate limiting on API endpoints
- Use HTTPS in production
- Keep dependencies updated
- Never commit secrets to git

**Frontend**
- Sanitize user input before rendering
- Use Content Security Policy headers
- Implement CSRF protection
- Store tokens securely (httpOnly cookies)

### API Design

**RESTful Conventions**
- Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Use plural nouns for resources (`/products`, not `/product`)
- Use nested routes for relationships (`/products/123/reviews`)
- Return appropriate status codes (200, 201, 400, 404, 500)

**Versioning**
- Version your API (`/api/v1/products`)
- Maintain backward compatibility when possible

**Response Format**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 100
  },
  "errors": []
}
```

### Documentation

- **Code Comments**: Explain WHY, not WHAT
- **Docstrings**: Document all public functions/classes
- **API Docs**: Use Django REST Framework's built-in docs or Swagger
- **README**: Keep updated with setup instructions

### Performance

**Backend**
- Use caching (Redis) for expensive queries
- Implement database query optimization
- Use Celery for long-running tasks
- Enable gzip compression
- Use CDN for static files in production

**Frontend**
- Optimize images (WebP, lazy loading)
- Code splitting and lazy loading
- Minimize bundle size
- Use production builds

### Monitoring & Logging

**Logging Levels**
- `DEBUG`: Detailed diagnostic info
- `INFO`: General informational messages
- `WARNING`: Warning messages
- `ERROR`: Error messages
- `CRITICAL`: Critical issues

**What to Log**
- API requests/responses (excluding sensitive data)
- Errors with stack traces
- Performance metrics
- User actions (audit trail)

```python
import logging

logger = logging.getLogger(__name__)

def process_order(order_id):
    logger.info(f"Processing order {order_id}")
    try:
        # ... process order
        logger.info(f"Order {order_id} processed successfully")
    except Exception as e:
        logger.error(f"Failed to process order {order_id}: {str(e)}", exc_info=True)
        raise
```

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] No hardcoded values or secrets
- [ ] Error handling is implemented
- [ ] Documentation is updated
- [ ] No console.log or print statements
- [ ] Database queries are optimized
- [ ] Security best practices followed
- [ ] Backward compatibility maintained

## Troubleshooting

### Containers won't start
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database connection errors
```bash
# Check if database is running
docker-compose ps db

# View database logs
docker-compose logs db
```

### Permission errors
```bash
# Fix file permissions
docker run --rm -v $(pwd)/backend:/app alpine chown -R 1000:1000 /app
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.
