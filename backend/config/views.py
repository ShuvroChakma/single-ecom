from django.views.decorators.http import require_GET
from django.db import connection
from django.core.cache import cache
from .api_response import json_response


@require_GET
def health_check(request):
    """
    Health check endpoint that verifies:
    - API is responding
    - Database connection
    - Redis/Cache connection
    """
    checks = {}
    is_healthy = True
    
    # Check database
    try:
        connection.ensure_connection()
        checks["database"] = "healthy"
    except Exception as e:
        is_healthy = False
        checks["database"] = f"unhealthy: {str(e)}"
    
    # Check Redis/Cache
    try:
        cache.set("health_check", "ok", 10)
        result = cache.get("health_check")
        if result == "ok":
            checks["cache"] = "healthy"
        else:
            is_healthy = False
            checks["cache"] = "unhealthy: cache read/write failed"
    except Exception as e:
        is_healthy = False
        checks["cache"] = f"unhealthy: {str(e)}"
    
    data = {
        "service": "ecommerce-backend",
        "status": "healthy" if is_healthy else "unhealthy",
        "checks": checks
    }
    
    status_code = 200 if is_healthy else 503
    
    return json_response(
        success=is_healthy,
        data=data,
        message="Service is healthy" if is_healthy else "Service is unhealthy",
        status_code=status_code
    )
