"""API tests for authentication endpoints."""
import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestRegisterAPI:
    """Test user registration API."""
    
    @patch('account.rate_limiter.RateLimiter.check_rate_limit')
    @patch('account.utils.OTPManager.create_email_verification_otp')
    def test_register_success(self, mock_otp, mock_rate_limit, api_client, user_data):
        """Test successful user registration."""
        mock_rate_limit.return_value = {'allowed': True, 'remaining': 2}
        mock_otp.return_value = '123456'
        
        response = api_client.post('/api/v1/auth/register/', user_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert response.data['data']['email'] == user_data['email']
        assert User.objects.filter(email=user_data['email']).exists()
    
    @patch('account.rate_limiter.RateLimiter.check_rate_limit')
    def test_register_password_mismatch(self, mock_rate_limit, api_client, user_data):
        """Test registration with mismatched passwords."""
        mock_rate_limit.return_value = {'allowed': True, 'remaining': 2}
        data = user_data.copy()
        data['password2'] = 'DifferentPass123!'
        
        response = api_client.post('/api/v1/auth/register/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False
    
    @patch('account.rate_limiter.RateLimiter.check_rate_limit')
    def test_register_duplicate_email(self, mock_rate_limit, api_client, user_data, create_user):
        """Test registration with existing email."""
        mock_rate_limit.return_value = {'allowed': True, 'remaining': 2}
        create_user(email=user_data['email'])
        
        response = api_client.post('/api/v1/auth/register/', user_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False


@pytest.mark.django_db
class TestLoginAPI:
    """Test user login API."""
    
    @patch('account.rate_limiter.RateLimiter.check_rate_limit')
    @patch('account.utils.RefreshTokenManager.store_token')
    def test_login_success(self, mock_store_token, mock_rate_limit, api_client, create_user):
        """Test successful login."""
        mock_rate_limit.return_value = {'allowed': True, 'remaining': 4}
        mock_store_token.return_value = True
        
        user = create_user()
        user.email_verified = True
        user.is_active = True
        user.save()
        
        response = api_client.post('/api/v1/auth/login/', {
            'email': user.email,
            'password': 'TestPass123!'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'access' in response.data['data']
        assert 'refresh' in response.data['data']
    
    @patch('account.rate_limiter.RateLimiter.check_rate_limit')
    def test_login_invalid_credentials(self, mock_rate_limit, api_client, create_user):
        """Test login with invalid credentials."""
        mock_rate_limit.return_value = {'allowed': True, 'remaining': 4}
        create_user()
        
        response = api_client.post('/api/v1/auth/login/', {
            'email': 'test@example.com',
            'password': 'WrongPassword'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.data['success'] is False
    
    @patch('account.rate_limiter.RateLimiter.check_rate_limit')
    def test_login_unverified_email(self, mock_rate_limit, api_client, create_user):
        """Test login with unverified email."""
        mock_rate_limit.return_value = {'allowed': True, 'remaining': 4}
        user = create_user()
        user.is_active = True
        user.email_verified = False
        user.save()
        
        response = api_client.post('/api/v1/auth/login/', {
            'email': user.email,
            'password': 'TestPass123!'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'email not verified' in str(response.data).lower()


@pytest.mark.django_db
class TestVerifyEmailAPI:
    """Test email verification API."""
    
    @patch('account.rate_limiter.RateLimiter.check_rate_limit')
    @patch('account.utils.OTPManager.verify_email_otp')
    def test_verify_email_success(self, mock_verify_otp, mock_rate_limit, api_client, create_user):
        """Test successful email verification."""
        mock_rate_limit.return_value = {'allowed': True, 'remaining': 4}
        user = create_user()
        mock_verify_otp.return_value = user
        
        response = api_client.post('/api/v1/auth/verify-email/', {
            'email': user.email,
            'otp': '123456'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
    
    @patch('account.rate_limiter.RateLimiter.check_rate_limit')
    def test_verify_email_invalid_otp(self, mock_rate_limit, api_client):
        """Test email verification with invalid OTP."""
        mock_rate_limit.return_value = {'allowed': True, 'remaining': 4}
        
        response = api_client.post('/api/v1/auth/verify-email/', {
            'email': 'test@example.com',
            'otp': '123'  # Too short
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False


@pytest.mark.django_db
class TestResendOTPAPI:
    """Test resend OTP API."""
    
    @patch('account.rate_limiter.RateLimiter.check_rate_limit')
    @patch('account.utils.OTPManager.create_email_verification_otp')
    def test_resend_otp_success(self, mock_create_otp, mock_rate_limit, api_client, create_user):
        """Test successful OTP resend."""
        mock_rate_limit.return_value = {'allowed': True, 'remaining': 2}
        mock_create_otp.return_value = '123456'
        
        user = create_user()
        
        response = api_client.post('/api/v1/auth/resend-otp/', {
            'email': user.email
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
    
    @patch('account.rate_limiter.RateLimiter.check_rate_limit')
    def test_resend_otp_already_verified(self, mock_rate_limit, api_client, create_user):
        """Test resending OTP for already verified email."""
        mock_rate_limit.return_value = {'allowed': True, 'remaining': 2}
        user = create_user()
        user.email_verified = True
        user.save()
        
        response = api_client.post('/api/v1/auth/resend-otp/', {
            'email': user.email
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already verified' in str(response.data).lower()


@pytest.mark.django_db
class TestLogoutAPI:
    """Test logout API."""
    
    @patch('account.utils.RefreshTokenManager.revoke_token')
    def test_logout_success(self, mock_revoke, authenticated_client):
        """Test successful logout."""
        mock_revoke.return_value = True
        
        # Get refresh token from login
        response = authenticated_client.post('/api/v1/auth/login/', {
            'email': authenticated_client.user.email,
            'password': 'TestPass123!'
        })
        refresh_token = response.data['data']['refresh']
        
        response = authenticated_client.post('/api/v1/auth/logout/', {
            'refresh': refresh_token
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
    
    def test_logout_unauthenticated(self, api_client):
        """Test logout without authentication."""
        response = api_client.post('/api/v1/auth/logout/', {
            'refresh': 'fake-token'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestTokenRefreshAPI:
    """Test token refresh API."""
    
    @patch('account.rate_limiter.RateLimiter.check_rate_limit')
    @patch('account.utils.RefreshTokenManager.is_valid')
    def test_token_refresh_success(self, mock_is_valid, mock_rate_limit, authenticated_client):
        """Test successful token refresh."""
        mock_rate_limit.return_value = {'allowed': True, 'remaining': 19}
        mock_is_valid.return_value = True
        
        # Get refresh token
        response = authenticated_client.post('/api/v1/auth/login/', {
            'email': authenticated_client.user.email,
            'password': 'TestPass123!'
        })
        refresh_token = response.data['data']['refresh']
        
        response = authenticated_client.post('/api/v1/auth/token/refresh/', {
            'refresh': refresh_token
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data['data']


@pytest.mark.django_db
class TestCurrentUserAPI:
    """Test current user API."""
    
    @patch('django.core.cache.cache.get')
    @patch('django.core.cache.cache.set')
    def test_get_current_user(self, mock_cache_set, mock_cache_get, authenticated_client):
        """Test getting current user info."""
        mock_cache_get.return_value = None
        
        response = authenticated_client.get('/api/v1/auth/me/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['data']['email'] == authenticated_client.user.email
    
    def test_get_current_user_unauthenticated(self, api_client):
        """Test getting current user without authentication."""
        response = api_client.get('/api/v1/auth/me/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
