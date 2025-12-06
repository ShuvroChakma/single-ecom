import logging
from django.conf import settings

# Configure logger
logger = logging.getLogger('account')


def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """Extract user agent from request."""
    return request.META.get('HTTP_USER_AGENT', '')


def log_user_action(action, email, user=None, request=None, details=None, success=True):
    """
    Log user action to both application logs and audit trail.
    
    Args:
        action: Action type (e.g., 'USER_REGISTERED', 'LOGIN_SUCCESS')
        email: User email
        user: User object (optional)
        request: HTTP request object (optional)
        details: Additional details dict (optional)
        success: Whether action was successful
    """
    from .audit import AuditLog
    
    # Extract request metadata
    ip_address = get_client_ip(request) if request else None
    user_agent = get_user_agent(request) if request else None
    
    # Log to application logger
    log_message = f"[{action}] Email: {email}"
    if ip_address:
        log_message += f" | IP: {ip_address}"
    if details:
        log_message += f" | Details: {details}"
    
    if success:
        logger.info(log_message)
    else:
        logger.warning(log_message)
    
    # Create audit log entry
    try:
        AuditLog.log(
            action=action,
            email=email,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {},
            success=success
        )
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
