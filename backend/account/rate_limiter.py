import time
from functools import wraps
from django.core.cache import cache
from config.exceptions import TooManyRequestsError


class RateLimiter:
    """Redis-based rate limiter using sliding window algorithm."""
    
    RATE_LIMIT_PREFIX = 'rate_limit'
    
    @staticmethod
    def _get_key(identifier, action):
        """Generate Redis key for rate limit tracking."""
        return f'{RateLimiter.RATE_LIMIT_PREFIX}:{action}:{identifier}'
    
    @staticmethod
    def check_rate_limit(identifier, action, max_requests, window_seconds):
        """
        Check if request is within rate limit using sliding window.
        
        Args:
            identifier: Unique identifier (IP, email, user_id)
            action: Action being rate limited (e.g., 'login', 'register')
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            
        Returns:
            dict: Rate limit info with 'allowed', 'remaining', 'reset_at'
            
        Raises:
            TooManyRequestsError: If rate limit exceeded
        """
        key = RateLimiter._get_key(identifier, action)
        current_time = time.time()
        
        # Get current request timestamps from Redis
        request_times = cache.get(key, [])
        
        # Remove timestamps outside the window
        request_times = [t for t in request_times if current_time - t < window_seconds]
        
        # Check if limit exceeded
        if len(request_times) >= max_requests:
            oldest_request = min(request_times)
            reset_at = oldest_request + window_seconds
            retry_after = int(reset_at - current_time)
            
            raise TooManyRequestsError(
                message=f'Rate limit exceeded for {action}. Try again in {retry_after} seconds.',
                details={
                    'action': action,
                    'limit': max_requests,
                    'window': window_seconds,
                    'retry_after': retry_after,
                    'reset_at': int(reset_at)
                }
            )
        
        # Add current request timestamp
        request_times.append(current_time)
        
        # Store updated timestamps with TTL
        cache.set(key, request_times, timeout=window_seconds)
        
        return {
            'allowed': True,
            'remaining': max_requests - len(request_times),
            'reset_at': int(current_time + window_seconds)
        }
    
    @staticmethod
    def reset_limit(identifier, action):
        """Reset rate limit for an identifier and action."""
        key = RateLimiter._get_key(identifier, action)
        cache.delete(key)
        return True
    
    @staticmethod
    def get_limit_info(identifier, action, max_requests, window_seconds):
        """Get current rate limit status without incrementing."""
        key = RateLimiter._get_key(identifier, action)
        current_time = time.time()
        
        request_times = cache.get(key, [])
        request_times = [t for t in request_times if current_time - t < window_seconds]
        
        return {
            'requests_made': len(request_times),
            'limit': max_requests,
            'remaining': max_requests - len(request_times),
            'window_seconds': window_seconds
        }


def rate_limit(action, max_requests, window_seconds, key_func=None):
    """
    Decorator for rate limiting views.
    
    Args:
        action: Action name for rate limiting
        max_requests: Maximum requests allowed
        window_seconds: Time window in seconds
        key_func: Function to extract identifier from request (default: IP address)
    
    Example:
        @rate_limit('login', max_requests=5, window_seconds=300)
        def login_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            # Determine identifier
            if key_func:
                identifier = key_func(request)
            else:
                # Default to IP address
                from account.logging_utils import get_client_ip
                identifier = get_client_ip(request)
            
            # Check rate limit
            RateLimiter.check_rate_limit(
                identifier=identifier,
                action=action,
                max_requests=max_requests,
                window_seconds=window_seconds
            )
            
            # Call the view
            return view_func(self, request, *args, **kwargs)
        
        return wrapper
    return decorator


def email_rate_limit(action, max_requests, window_seconds):
    """
    Rate limit decorator using email as identifier.
    
    Example:
        @email_rate_limit('register', max_requests=3, window_seconds=3600)
        def register_view(request):
            ...
    """
    def key_func(request):
        return request.data.get('email', 'unknown')
    
    return rate_limit(action, max_requests, window_seconds, key_func=key_func)


def user_rate_limit(action, max_requests, window_seconds):
    """
    Rate limit decorator using user ID as identifier.
    
    Example:
        @user_rate_limit('profile_update', max_requests=10, window_seconds=60)
        def update_profile_view(request):
            ...
    """
    def key_func(request):
        if request.user.is_authenticated:
            return f'user_{request.user.id}'
        from account.logging_utils import get_client_ip
        return get_client_ip(request)
    
    return rate_limit(action, max_requests, window_seconds, key_func=key_func)
