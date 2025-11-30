"""
Example views demonstrating error handling usage.
"""
from django.views.decorators.http import require_http_methods
from config.exceptions import (
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    BadRequestError
)
from config.api_response import APIResponse


@require_http_methods(["GET"])
def example_validation_error(request):
    """Example of raising a validation error."""
    raise ValidationError(
        message="Invalid input data",
        errors=[
            {"field": "email", "message": "Invalid email format"},
            {"field": "age", "message": "Must be at least 18"}
        ]
    )


@require_http_methods(["GET"])
def example_not_found(request):
    """Example of raising a not found error."""
    raise NotFoundError(
        message="Product not found",
        errors=[{"message": "Product with ID 123 does not exist"}]
    )


@require_http_methods(["GET"])
def example_unauthorized(request):
    """Example of raising an unauthorized error."""
    raise UnauthorizedError(
        message="Authentication required",
        errors=[{"message": "Please provide a valid authentication token"}]
    )


@require_http_methods(["GET"])
def example_forbidden(request):
    """Example of raising a forbidden error."""
    raise ForbiddenError(
        message="Access denied",
        errors=[{"message": "You don't have permission to access this resource"}]
    )


@require_http_methods(["GET"])
def example_conflict(request):
    """Example of raising a conflict error."""
    raise ConflictError(
        message="Email already exists",
        errors=[{"field": "email", "message": "This email is already registered"}]
    )


@require_http_methods(["GET"])
def example_success(request):
    """Example of a successful response."""
    from config.api_response import json_response
    return json_response(
        success=True,
        data={"id": 1, "name": "Example Product", "price": 29.99},
        message="Product retrieved successfully"
    )
