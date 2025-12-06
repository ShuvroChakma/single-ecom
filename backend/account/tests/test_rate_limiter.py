"""Unit tests for rate limiter."""
import pytest
import time
from unittest.mock import patch
from config.exceptions import TooManyRequestsError
from account.rate_limiter import RateLimiter


class TestRateLimiter:
    """Test RateLimiter class."""
    
    def test_get_key(self):
        """Test Redis key generation."""
        key = RateLimiter._get_key('user@example.com', 'login')
        assert key == 'rate_limit:login:user@example.com'
    
    @patch('django.core.cache.cache.get')
    @patch('django.core.cache.cache.set')
    def test_check_rate_limit_allowed(self, mock_cache_set, mock_cache_get):
        """Test rate limit check when allowed."""
        mock_cache_get.return_value = []
        
        result = RateLimiter.check_rate_limit(
            identifier='user@example.com',
            action='login',
            max_requests=5,
            window_seconds=300
        )
        
        assert result['allowed'] is True
        assert result['remaining'] == 4
        mock_cache_set.assert_called_once()
    
    @patch('django.core.cache.cache.get')
    def test_check_rate_limit_exceeded(self, mock_cache_get):
        """Test rate limit check when exceeded."""
        current_time = time.time()
        # Simulate 5 recent requests
        mock_cache_get.return_value = [
            current_time - 10,
            current_time - 20,
            current_time - 30,
            current_time - 40,
            current_time - 50
        ]
        
        with pytest.raises(TooManyRequestsError) as exc:
            RateLimiter.check_rate_limit(
                identifier='user@example.com',
                action='login',
                max_requests=5,
                window_seconds=300
            )
        
        assert 'rate limit exceeded' in str(exc.value).lower()
        assert exc.value.details['action'] == 'login'
        assert exc.value.details['limit'] == 5
    
    @patch('django.core.cache.cache.get')
    @patch('django.core.cache.cache.set')
    def test_check_rate_limit_sliding_window(self, mock_cache_set, mock_cache_get):
        """Test sliding window removes old timestamps."""
        current_time = time.time()
        # Mix of old and recent requests
        mock_cache_get.return_value = [
            current_time - 400,  # Outside window (300s)
            current_time - 50,   # Inside window
            current_time - 100   # Inside window
        ]
        
        result = RateLimiter.check_rate_limit(
            identifier='user@example.com',
            action='login',
            max_requests=5,
            window_seconds=300
        )
        
        assert result['allowed'] is True
        assert result['remaining'] == 2  # 5 - 3 (2 old + 1 new)
    
    @patch('django.core.cache.cache.delete')
    def test_reset_limit(self, mock_cache_delete):
        """Test resetting rate limit."""
        result = RateLimiter.reset_limit('user@example.com', 'login')
        
        assert result is True
        mock_cache_delete.assert_called_once()
    
    @patch('django.core.cache.cache.get')
    def test_get_limit_info(self, mock_cache_get):
        """Test getting rate limit info."""
        current_time = time.time()
        mock_cache_get.return_value = [
            current_time - 50,
            current_time - 100
        ]
        
        info = RateLimiter.get_limit_info(
            identifier='user@example.com',
            action='login',
            max_requests=5,
            window_seconds=300
        )
        
        assert info['requests_made'] == 2
        assert info['limit'] == 5
        assert info['remaining'] == 3
        assert info['window_seconds'] == 300
