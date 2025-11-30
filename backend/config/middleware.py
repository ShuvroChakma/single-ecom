"""
Global exception handler middleware for Django.
"""
import logging
from django.http import JsonResponse
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework.exceptions import APIException as DRFAPIException
from .exceptions import APIException
from .api_response import json_response

logger = logging.getLogger(__name__)


def exception_handler(get_response):
    """
    Middleware to handle exceptions globally and return standardized responses.
    """
    
    def middleware(request):
        try:
            response = get_response(request)
            return response
        except APIException as exc:
            # Handle custom API exceptions
            logger.warning(f"API Exception: {exc.message}", exc_info=True)
            return json_response(
                success=False,
                data=None,
                message=exc.message,
                errors=exc.errors if hasattr(exc, 'errors') else [],
                status_code=exc.status_code
            )
        except DRFAPIException as exc:
            # Handle Django REST Framework exceptions
            logger.warning(f"DRF Exception: {str(exc)}", exc_info=True)
            errors = []
            if hasattr(exc, 'detail'):
                if isinstance(exc.detail, dict):
                    errors = [
                        {"field": field, "message": str(msg)}
                        for field, msg in exc.detail.items()
                    ]
                elif isinstance(exc.detail, list):
                    errors = [{"message": str(msg)} for msg in exc.detail]
                else:
                    errors = [{"message": str(exc.detail)}]
            
            return json_response(
                success=False,
                data=None,
                message=str(exc.detail) if hasattr(exc, 'detail') else "An error occurred",
                errors=errors,
                status_code=exc.status_code if hasattr(exc, 'status_code') else 400
            )
        except DjangoValidationError as exc:
            # Handle Django validation errors
            logger.warning(f"Validation Error: {str(exc)}", exc_info=True)
            errors = []
            if hasattr(exc, 'message_dict'):
                errors = [
                    {"field": field, "message": str(msg)}
                    for field, msgs in exc.message_dict.items()
                    for msg in (msgs if isinstance(msgs, list) else [msgs])
                ]
            else:
                errors = [{"message": str(msg)} for msg in exc.messages]
            
            return json_response(
                success=False,
                data=None,
                message="Validation failed",
                errors=errors,
                status_code=400
            )
        except IntegrityError as exc:
            # Handle database integrity errors
            logger.error(f"Integrity Error: {str(exc)}", exc_info=True)
            return json_response(
                success=False,
                data=None,
                message="Database integrity error. The operation conflicts with existing data.",
                errors=[{"message": "Duplicate entry or constraint violation"}],
                status_code=409
            )
        except PermissionError as exc:
            # Handle permission errors
            logger.warning(f"Permission Error: {str(exc)}", exc_info=True)
            return json_response(
                success=False,
                data=None,
                message="You don't have permission to perform this action",
                errors=[{"message": str(exc)}],
                status_code=403
            )
        except Exception as exc:
            # Handle unexpected errors
            logger.error(f"Unexpected Error: {str(exc)}", exc_info=True)
            
            # In production, don't expose internal error details
            from django.conf import settings
            if settings.DEBUG:
                error_message = str(exc)
            else:
                error_message = "An unexpected error occurred. Please try again later."
            
            return json_response(
                success=False,
                data=None,
                message=error_message,
                errors=[],
                status_code=500
            )
    
    return middleware
