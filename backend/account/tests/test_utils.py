"""Unit tests for account utilities."""
import pytest
import json
from unittest.mock import patch, MagicMock
from django.core.cache import cache
from account.utils import RefreshTokenManager, OTPManager


class TestRefreshTokenManager:
    """Test RefreshTokenManager."""
    
    def test_generate_key(self):
        """Test Redis key generation."""
        key = RefreshTokenManager._get_key(123, 'abc-def')
        assert key == 'refresh_token:123:abc-def'
    
    @patch('django.core.cache.cache.set')
    def test_store_token(self, mock_cache_set):
        """Test storing refresh token."""
        result = RefreshTokenManager.store_token(
            user_id=123,
            jti='abc-def',
            metadata={'created_at': '2025-12-06'}
        )
        
        assert result is True
        mock_cache_set.assert_called_once()
    
    @patch('django.core.cache.cache.get')
    def test_is_valid_token_exists(self, mock_cache_get):
        """Test checking valid token."""
        mock_cache_get.return_value = '{"user_id": 123}'
        
        result = RefreshTokenManager.is_valid(123, 'abc-def')
        assert result is True
    
    @patch('django.core.cache.cache.get')
    def test_is_valid_token_not_exists(self, mock_cache_get):
        """Test checking invalid token."""
        mock_cache_get.return_value = None
        
        result = RefreshTokenManager.is_valid(123, 'abc-def')
        assert result is False
    
    @patch('django.core.cache.cache.delete')
    def test_revoke_token(self, mock_cache_delete):
        """Test revoking token."""
        result = RefreshTokenManager.revoke_token(123, 'abc-def')
        
        assert result is True
        mock_cache_delete.assert_called_once()


class TestOTPManager:
    """Test OTPManager."""
    
    def test_generate_otp(self):
        """Test OTP generation."""
        otp = OTPManager.generate_otp()
        
        assert len(otp) == 6
        assert otp.isdigit()
    
    def test_get_key(self):
        """Test Redis key generation."""
        key = OTPManager._get_key('test@example.com')
        assert key == 'email_otp:test@example.com'
    
    @pytest.mark.django_db
    @patch('django.core.cache.cache.set')
    @patch('account.utils.send_mail')
    def test_create_email_verification_otp(self, mock_send_mail, mock_cache_set):
        """Test creating and sending OTP."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        otp = OTPManager.create_email_verification_otp(user)
        
        assert len(otp) == 6
        assert otp.isdigit()
        mock_cache_set.assert_called_once()
    
    @pytest.mark.django_db
    @patch('django.core.cache.cache.get')
    @patch('django.core.cache.cache.delete')
    def test_verify_email_otp_success(self, mock_cache_delete, mock_cache_get):
        """Test successful OTP verification."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        otp_data = {
            'otp': '123456',
            'user_id': user.id,
            'created_at': '2025-12-06T10:00:00'
        }
        mock_cache_get.return_value = json.dumps(otp_data)
        
        result = OTPManager.verify_email_otp('test@example.com', '123456')
        
        assert result.email_verified is True
        assert result.is_active is True
        mock_cache_delete.assert_called_once()
    
    @patch('django.core.cache.cache.get')
    def test_verify_email_otp_expired(self, mock_cache_get):
        """Test OTP verification with expired OTP."""
        from config.exceptions import ValidationError
        
        mock_cache_get.return_value = None
        
        with pytest.raises(ValidationError) as exc:
            OTPManager.verify_email_otp('test@example.com', '123456')
        
        assert 'expired' in str(exc.value).lower()
    
    @pytest.mark.django_db
    @patch('django.core.cache.cache.get')
    def test_verify_email_otp_invalid(self, mock_cache_get):
        """Test OTP verification with wrong OTP."""
        from django.contrib.auth import get_user_model
        from config.exceptions import ValidationError
        User = get_user_model()
        
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        otp_data = {
            'otp': '123456',
            'user_id': user.id,
            'created_at': '2025-12-06T10:00:00'
        }
        mock_cache_get.return_value = json.dumps(otp_data)
        
        with pytest.raises(ValidationError) as exc:
            OTPManager.verify_email_otp('test@example.com', '999999')
        
        assert 'invalid' in str(exc.value).lower()
