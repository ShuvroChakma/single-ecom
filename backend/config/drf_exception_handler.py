"""
Custom DRF exception handler to format all errors in our standard format.
"""
from rest_framework.views import exception_handler as drf_exception_handler
from config.api_response import json_response
from config.exceptions import APIException
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats all DRF exceptions in our standard format.
    """
    # Handle our custom exceptions first
    if isinstance(exc, APIException):
        logger.warning(f"Custom API Exception: {exc.message}", exc_info=True)
        
        # Format errors as object with code and message if error_code exists
        if exc.error_code:
            errors = {
                'code': exc.error_code,
                'message': exc.message
            }
        else:
            # Legacy format for backward compatibility
            errors = []
            if hasattr(exc, 'errors') and exc.errors:
                if isinstance(exc.errors, dict):
                    for field, messages in exc.errors.items():
                        if isinstance(messages, list):
                            for msg in messages:
                                errors.append({'field': field, 'message': str(msg)})
                        else:
                            errors.append({'field': field, 'message': str(messages)})
                elif isinstance(exc.errors, list):
                    for item in exc.errors:
                        if isinstance(item, dict):
                            errors.append(item)
                        else:
                            errors.append({'message': str(item)})
                else:
                    errors = [{'message': str(exc.errors)}]
        
        return json_response(
            success=False,
            data=None,
            message=exc.message,
            errors=errors,
            status_code=exc.status_code
        )
    
    # Call DRF's default exception handler for other exceptions
    response = drf_exception_handler(exc, context)
    
    if response is not None:
        # Format the error in our standard format
        errors = []
        error_code = None
        
        if isinstance(response.data, dict):
            # Extract error_code and email if present (before processing errors)
            error_code = response.data.pop('error_code', None)
            email_metadata = response.data.pop('email', None)  # Remove email metadata
            
            # Handle dict errors (field-specific or general)
            if 'detail' in response.data:
                # General error
                errors = [{'message': str(response.data['detail'])}]
            else:
                # Field-specific errors
                for field, messages in response.data.items():
                    if isinstance(messages, list):
                        for msg in messages:
                            errors.append({'field': field, 'message': str(msg)})
                    else:
                        errors.append({'field': field, 'message': str(messages)})
        elif isinstance(response.data, list):
            # Handle list errors
            for item in response.data:
                errors.append({'message': str(item)})
        else:
            # Handle other types
            errors = [{'message': str(response.data)}]
        
        # Get error message
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict) and 'detail' in exc.detail:
                message = str(exc.detail['detail'])
            elif isinstance(exc.detail, str):
                message = exc.detail
            else:
                message = 'An error occurred'
        else:
            message = str(exc)
        
        # Log the error
        logger.warning(f"DRF Exception: {message}", exc_info=True)
        
        # Return formatted response
        return json_response(
            success=False,
            data=None,
            message=message,
            errors=errors,
            status_code=response.status_code,
            error_code=error_code
        )
    
    return response
