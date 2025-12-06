"""
Custom exceptions for standardized error handling.
"""
from rest_framework import status


class APIException(Exception):
    """Base API exception class."""
    
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = "An error occurred"
    error_code = "api_error"
    
    def __init__(self, message=None, errors=None, status_code=None, error_code=None):
        self.message = message or self.default_message
        self.errors = errors or []
        if status_code:
            self.status_code = status_code
        if error_code:
            self.error_code = error_code
        super().__init__(self.message)


class ValidationError(APIException):
    """Validation error exception."""
    
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = "Validation failed"
    error_code = "validation_error"


class NotFoundError(APIException):
    """Resource not found exception."""
    
    status_code = status.HTTP_404_NOT_FOUND
    default_message = "Resource not found"
    error_code = "not_found"


class UnauthorizedError(APIException):
    """Unauthorized access exception."""
    
    status_code = status.HTTP_401_UNAUTHORIZED
    default_message = "Authentication required"
    error_code = "unauthorized"


class ForbiddenError(APIException):
    """Forbidden access exception."""
    
    status_code = status.HTTP_403_FORBIDDEN
    default_message = "Access forbidden"
    error_code = "forbidden"


class ConflictError(APIException):
    """Resource conflict exception."""
    
    status_code = status.HTTP_409_CONFLICT
    default_message = "Resource conflict"
    error_code = "conflict"


class ServerError(APIException):
    """Internal server error exception."""
    
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_message = "Internal server error"
    error_code = "server_error"


class BadRequestError(APIException):
    """Bad request exception."""
    
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = "Bad request"
    error_code = "bad_request"


class RateLimitError(APIException):
    """Rate limit exceeded exception."""
    
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_message = "Rate limit exceeded"
    error_code = "rate_limit_exceeded"


class TooManyRequestsError(APIException):
    """Exception for rate limit exceeded (429)."""
    
    def __init__(self, message="Too many requests", errors=None, details=None):
        super().__init__(message, errors)
        self.status_code = 429
        self.details = details or {}
