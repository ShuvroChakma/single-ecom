# Error Handling System

## Overview

The backend now has a comprehensive error handling system that automatically catches and formats all errors into the standardized API response format.

## Custom Exceptions

Located in `backend/config/exceptions.py`:

### Available Exceptions

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

## Usage in Views/Services

### Example 1: Validation Error
```python
from config.exceptions import ValidationError

def create_user(request):
    if not request.POST.get('email'):
        raise ValidationError(
            message="Invalid user data",
            errors=[
                {"field": "email", "message": "Email is required"},
                {"field": "password", "message": "Password must be at least 8 characters"}
            ]
        )
```

**Response:**
```json
{
  "success": false,
  "data": null,
  "message": "Invalid user data",
  "errors": [
    {"field": "email", "message": "Email is required"},
    {"field": "password", "message": "Password must be at least 8 characters"}
  ],
  "meta": {"timestamp": "2025-11-30T04:52:37.123456Z"}
}
```

### Example 2: Not Found Error
```python
from config.exceptions import NotFoundError
from django.shortcuts import get_object_or_404

def get_product(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        raise NotFoundError(
            message=f"Product with ID {pk} not found"
        )
```

### Example 3: Unauthorized Error
```python
from config.exceptions import UnauthorizedError

def protected_view(request):
    if not request.user.is_authenticated:
        raise UnauthorizedError(
            message="Please log in to access this resource"
        )
```

### Example 4: Conflict Error
```python
from config.exceptions import ConflictError

def register_user(request):
    email = request.POST.get('email')
    if User.objects.filter(email=email).exists():
        raise ConflictError(
            message="Email already registered",
            errors=[{"field": "email", "message": "This email is already in use"}]
        )
```

## Automatic Error Handling

The middleware (`config/middleware.py`) automatically catches and formats:

1. **Custom API Exceptions** - Your raised exceptions
2. **Django Validation Errors** - Form/model validation
3. **DRF Exceptions** - REST framework errors
4. **Database Integrity Errors** - Unique constraints, foreign keys
5. **Permission Errors** - Access control violations
6. **Unexpected Exceptions** - Any other errors (500)

## Error Response Format

All errors return this format:

```json
{
  "success": false,
  "data": null,
  "message": "Human-readable error message",
  "errors": [
    {
      "field": "field_name",  // Optional
      "message": "Error description",
      "code": "error_code"    // Optional
    }
  ],
  "meta": {
    "timestamp": "ISO 8601 timestamp"
  }
}
```

## Best Practices

1. **Use specific exceptions** - Choose the most appropriate exception type
2. **Provide clear messages** - Help users understand what went wrong
3. **Include field names** - For validation errors, specify which field failed
4. **Don't expose sensitive data** - Never include passwords, tokens, etc.
5. **Log errors** - All errors are automatically logged

## Testing

Example endpoints are available in `config/example_views.py` to test different error types.
