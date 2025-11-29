"""
Standardized API response utilities for consistent response formatting.
"""
from typing import Any, Optional, Dict, List
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status


class APIResponse:
    """
    Standardized API response format:
    {
        "success": true/false,
        "data": {...} or [...],
        "message": "Success message or error description",
        "errors": [...],
        "meta": {
            "timestamp": "ISO timestamp",
            "page": 1,
            "per_page": 20,
            "total": 100,
            "total_pages": 5
        }
    }
    """
    
    @staticmethod
    def success(
        data: Any = None,
        message: str = "Success",
        meta: Optional[Dict] = None,
        status_code: int = status.HTTP_200_OK
    ) -> Response:
        """Return a successful API response."""
        from datetime import datetime
        
        response_data = {
            "success": True,
            "data": data,
            "message": message,
            "errors": [],
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                **(meta or {})
            }
        }
        
        return Response(response_data, status=status_code)
    
    @staticmethod
    def error(
        message: str = "An error occurred",
        errors: Optional[List[Dict]] = None,
        data: Any = None,
        status_code: int = status.HTTP_400_BAD_REQUEST
    ) -> Response:
        """Return an error API response."""
        from datetime import datetime
        
        response_data = {
            "success": False,
            "data": data,
            "message": message,
            "errors": errors or [],
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }
        
        return Response(response_data, status=status_code)
    
    @staticmethod
    def paginated(
        data: List,
        page: int,
        per_page: int,
        total: int,
        message: str = "Success",
        status_code: int = status.HTTP_200_OK
    ) -> Response:
        """Return a paginated API response."""
        from datetime import datetime
        import math
        
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        
        response_data = {
            "success": True,
            "data": data,
            "message": message,
            "errors": [],
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "total_pages": total_pages,
                    "has_next": page < total_pages,
                    "has_prev": page > 1
                }
            }
        }
        
        return Response(response_data, status=status_code)
    
    @staticmethod
    def created(
        data: Any = None,
        message: str = "Resource created successfully",
        meta: Optional[Dict] = None
    ) -> Response:
        """Return a response for successful resource creation."""
        return APIResponse.success(
            data=data,
            message=message,
            meta=meta,
            status_code=status.HTTP_201_CREATED
        )
    
    @staticmethod
    def no_content(message: str = "Resource deleted successfully") -> Response:
        """Return a response for successful deletion."""
        from datetime import datetime
        
        response_data = {
            "success": True,
            "data": None,
            "message": message,
            "errors": [],
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


# Django view helper (for non-DRF views)
def json_response(
    success: bool = True,
    data: Any = None,
    message: str = "",
    errors: Optional[List] = None,
    status_code: int = 200,
    meta: Optional[Dict] = None
) -> JsonResponse:
    """Helper for Django views to return standardized JSON responses."""
    from datetime import datetime
    
    response_data = {
        "success": success,
        "data": data,
        "message": message or ("Success" if success else "Error"),
        "errors": errors or [],
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **(meta or {})
        }
    }
    
    return JsonResponse(response_data, status=status_code)
