# Development Guidelines

## Project Overview

This is a Django + TanStack Start e-commerce application with strict development standards for security, performance, and code quality.

## Architecture Standards

### 1. Backend Views - Class-Based Only

**Always use class-based views (APIView), never function-based views.**

```python
# ✅ CORRECT
from rest_framework.views import APIView

class ProductListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Implementation
        pass

# ❌ INCORRECT - Don't use function-based views
@api_view(['GET'])
def product_list(request):
    pass
```

### 2. Audit Logging - Mandatory

**Log all user actions for security and debugging.**

```python
from account.logging_utils import log_user_action

# Log successful actions
log_user_action(
    action='ORDER_CREATED',
    email=user.email,
    user=user,
    request=request,
    details={'order_id': order.id, 'total': order.total}
)

# Log failed actions
log_user_action(
    action='PAYMENT_FAILED',
    email=user.email,
    user=user,
    request=request,
    details={'error': str(e)},
    success=False
)
```

**What to log:**
- User registration, login, logout
- Data creation, updates, deletions
- Payment transactions
- Failed attempts (login, payment, etc.)
- Security events

### 3. Redis Caching - Performance

**Use Redis for caching and temporary data storage.**

```python
from django.core.cache import cache

# Cache user data
cache_key = f'user:{user.id}'
user_data = cache.get(cache_key)
if not user_data:
    user_data = UserSerializer(user).data
    cache.set(cache_key, user_data, timeout=900)  # 15 minutes

# Cache invalidation
cache.delete(f'user:{user.id}')

# Store temporary data (OTPs, tokens)
cache.set(f'otp:{email}', otp_code, timeout=600)  # 10 minutes
```

**What to cache:**
- User data and permissions
- Product listings
- Shopping cart data
- Session data
- OTPs and verification codes
- Rate limit counters

### 4. Rate Limiting - Security

**Apply rate limiting to all public endpoints.**

```python
from account.rate_limiter import rate_limit, email_rate_limit, user_rate_limit

class LoginView(APIView):
    @email_rate_limit('login', max_requests=5, window_seconds=300)
    def post(self, request):
        # Implementation
        pass

class ProductSearchView(APIView):
    @rate_limit('product_search', max_requests=100, window_seconds=60)
    def get(self, request):
        # Implementation
        pass

class CreateOrderView(APIView):
    @user_rate_limit('create_order', max_requests=10, window_seconds=3600)
    def post(self, request):
        # Implementation
        pass
```

**Rate limit guidelines:**
- **Authentication**: 5-10 attempts per 5-10 minutes (email-based)
- **Search/Browse**: 100-200 requests per minute (IP-based)
- **Mutations**: 10-20 per hour (user-based)
- **Critical ops**: 3-5 per hour (user-based)

### 5. Testing - 90% Coverage Required

**Write comprehensive tests for all code.**

#### Unit Tests
Test individual functions and methods in isolation.

```python
# tests/test_utils.py
from account.utils import OTPManager

class TestOTPManager:
    def test_generate_otp(self):
        otp = OTPManager.generate_otp()
        assert len(otp) == 6
        assert otp.isdigit()
```

#### Integration Tests
Test component interactions.

```python
# tests/test_integration.py
from account.models import User
from account.utils import OTPManager

class TestEmailVerification:
    def test_otp_verification_flow(self):
        user = User.objects.create_user(email='test@example.com')
        otp = OTPManager.create_email_verification_otp(user)
        result = OTPManager.verify_email_otp(user.email, otp)
        assert result.email_verified is True
```

#### API Tests
Test endpoints end-to-end.

```python
# tests/test_api.py
import pytest
from rest_framework.test import APIClient

@pytest.mark.django_db
class TestAuthAPI:
    def test_register_user(self):
        client = APIClient()
        response = client.post('/api/v1/auth/register/', {
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!'
        })
        assert response.status_code == 201
        assert 'email' in response.data['data']
```

**Coverage target: 90%+**

Run tests with coverage:
```bash
# Backend
docker-compose exec backend pytest --cov=. --cov-report=html

# Frontend
docker-compose exec frontend npm run test:coverage
```

## Error Handling

**Use custom exceptions, never return error responses directly.**

```python
from config.exceptions import ValidationError, UnauthorizedError, NotFoundError

# ✅ CORRECT - Raise exceptions
if not serializer.is_valid():
    raise ValidationError(
        message='Validation failed',
        errors=serializer.errors
    )

# ❌ INCORRECT - Don't return error responses
if not serializer.is_valid():
    return APIResponse.error(...)
```

**Available exceptions:**
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `TooManyRequestsError` (429)
- `ServerError` (500)

## Response Format

**All API responses follow a standard format.**

```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "errors": [],
  "meta": {
    "timestamp": "2025-12-06T14:42:00Z"
  }
}
```

Use `APIResponse` helper:
```python
from config.api_response import APIResponse

# Success
return APIResponse.success(
    data=serializer.data,
    message='Resource created',
    status_code=201
)

# Pagination
return APIResponse.paginated(
    data=items,
    page=1,
    per_page=20,
    total=100
)
```

## Code Quality

### Type Hints
```python
from typing import Optional, Dict, List

def process_order(user_id: int, items: List[Dict]) -> Optional[Order]:
    pass
```

### Docstrings
```python
def calculate_total(items: List[Dict]) -> float:
    """
    Calculate total price for cart items.
    
    Args:
        items: List of cart items with 'price' and 'quantity'
        
    Returns:
        Total price as float
        
    Raises:
        ValidationError: If items are invalid
    """
    pass
```

### Logging
```python
import logging

logger = logging.getLogger(__name__)

logger.info(f"Processing order {order_id}")
logger.warning(f"Low stock for product {product_id}")
logger.error(f"Payment failed: {error}")
```

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Validate all input** - Use serializers
3. **Sanitize output** - Prevent XSS
4. **Use HTTPS** - In production
5. **Rate limit everything** - Prevent abuse
6. **Log security events** - Audit trail
7. **Hash passwords** - Never store plain text
8. **Validate permissions** - Check user access

## Git Workflow

1. **Pre-commit hooks** - Automatic linting and formatting
2. **Commit messages** - Clear and descriptive
3. **Branch naming** - `feature/`, `bugfix/`, `hotfix/`
4. **Pull requests** - Required for all changes
5. **Code review** - At least one approval

## Running the Project

```bash
# Development
docker-compose up

# Run tests
docker-compose exec backend pytest
docker-compose exec frontend npm test

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

## File Structure

```
backend/
├── account/          # Authentication & user management
│   ├── models.py     # User, AuditLog
│   ├── views.py      # Class-based views
│   ├── serializers.py
│   ├── utils.py      # OTPManager, RefreshTokenManager
│   ├── logging_utils.py
│   ├── rate_limiter.py
│   └── tests/
├── config/           # Project settings
│   ├── settings.py
│   ├── exceptions.py # Custom exceptions
│   ├── api_response.py
│   └── middleware.py
└── logs/            # Application logs

frontend/
├── src/
│   ├── routes/      # TanStack Start routes
│   ├── components/
│   ├── utils/
│   └── types/
└── tests/
```

## Questions?

For questions or clarifications, refer to:
- `ERROR_HANDLING.md` - Error handling system
- `logging_documentation.md` - Logging and audit trails
- `rate_limiting_documentation.md` - Rate limiting policies
- Django docs: https://docs.djangoproject.com/
- DRF docs: https://www.django-rest-framework.org/

## API Documentation (Swagger/OpenAPI)

All API endpoints are automatically documented using drf-spectacular.

### Accessing Documentation

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### Documenting Endpoints

Use the `@extend_schema` decorator on all API methods:

```python
from drf_spectacular.utils import extend_schema, OpenApiExample

class MyView(APIView):
    @extend_schema(
        tags=['Category Name'],
        summary='Short description',
        description='Detailed description of what this endpoint does',
        request=RequestSerializer,
        responses={
            200: ResponseSerializer,
            400: {'description': 'Bad request'},
            401: {'description': 'Unauthorized'},
        },
        examples=[
            OpenApiExample(
                'Example Name',
                value={'field': 'value'}
            )
        ]
    )
    def post(self, request):
        # Implementation
        pass
```

### Best Practices

1. **Always add tags** - Group related endpoints
2. **Include examples** - Help frontend developers understand usage
3. **Document all responses** - Including error cases
4. **Use clear descriptions** - Explain what the endpoint does
5. **Keep schema updated** - Documentation should match implementation

