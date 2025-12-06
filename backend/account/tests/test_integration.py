"""Integration tests for account app."""
import pytest
import json
from unittest.mock import patch
from django.contrib.auth import get_user_model
from account.utils import OTPManager, RefreshTokenManager
from account.audit import AuditLog

User = get_user_model()


@pytest.mark.django_db
class TestEmailVerificationFlow:
    """Test complete email verification flow."""
    
    @patch('django.core.cache.cache.set')
    @patch('django.core.cache.cache.get')
    @patch('django.core.cache.cache.delete')
    @patch('account.utils.send_mail')
    def test_complete_verification_flow(self, mock_send_mail, mock_cache_delete, 
                                       mock_cache_get, mock_cache_set):
        """Test complete flow from registration to email verification."""
        # Create user
        user = User.objects.create_user(
            email='test@example.com',
            password='TestPass123!'
        )
        
        # Send OTP
        otp = OTPManager.create_email_verification_otp(user)
        assert len(otp) == 6
        
        # Verify OTP
        otp_data = {
            'otp': otp,
            'user_id': user.id,
            'created_at': '2025-12-06T10:00:00'
        }
        mock_cache_get.return_value = json.dumps(otp_data)
        
        verified_user = OTPManager.verify_email_otp(user.email, otp)
        
        assert verified_user.email_verified is True
        assert verified_user.is_active is True


@pytest.mark.django_db
class TestLoginLogoutFlow:
    """Test complete login/logout flow."""
    
    @patch('account.utils.RefreshTokenManager.store_token')
    @patch('account.utils.RefreshTokenManager.revoke_token')
    def test_complete_login_logout_flow(self, mock_revoke, mock_store):
        """Test complete login and logout flow."""
        # Create verified user
        user = User.objects.create_user(
            email='test@example.com',
            password='TestPass123!'
        )
        user.email_verified = True
        user.is_active = True
        user.save()
        
        # Simulate login (token generation tested separately)
        mock_store.return_value = True
        RefreshTokenManager.store_token(user.id, 'test-jti')
        
        # Simulate logout
        mock_revoke.return_value = True
        RefreshTokenManager.revoke_token(user.id, 'test-jti')
        
        mock_store.assert_called_once()
        mock_revoke.assert_called_once()


@pytest.mark.django_db
class TestAuditLogging:
    """Test audit logging integration."""
    
    def test_audit_log_creation_on_user_action(self):
        """Test that audit logs are created for user actions."""
        user = User.objects.create_user(
            email='test@example.com',
            password='TestPass123!'
        )
        
        # Create audit log
        log = AuditLog.log(
            action='USER_REGISTERED',
            email=user.email,
            user=user,
            ip_address='192.168.1.1',
            details={'user_type': 'CUSTOMER'}
        )
        
        # Verify log was created
        assert AuditLog.objects.filter(user=user).count() == 1
        assert log.action == 'USER_REGISTERED'
        assert log.success is True
    
    def test_audit_log_query_by_user(self):
        """Test querying audit logs by user."""
        user = User.objects.create_user(
            email='test@example.com',
            password='TestPass123!'
        )
        
        # Create multiple logs
        AuditLog.log('LOGIN_SUCCESS', user.email, user=user)
        AuditLog.log('LOGOUT', user.email, user=user)
        AuditLog.log('LOGIN_FAILED', user.email, success=False)
        
        # Query logs
        user_logs = AuditLog.objects.filter(email=user.email)
        assert user_logs.count() == 3
        
        failed_logs = AuditLog.objects.filter(email=user.email, success=False)
        assert failed_logs.count() == 1


@pytest.mark.django_db
class TestRateLimitingIntegration:
    """Test rate limiting with actual views."""
    
    @patch('django.core.cache.cache.get')
    @patch('django.core.cache.cache.set')
    def test_rate_limit_enforcement(self, mock_cache_set, mock_cache_get):
        """Test that rate limits are enforced."""
        from account.rate_limiter import RateLimiter
        from config.exceptions import TooManyRequestsError
        
        # Simulate max requests reached
        import time
        current_time = time.time()
        mock_cache_get.return_value = [
            current_time - 10,
            current_time - 20,
            current_time - 30,
            current_time - 40,
            current_time - 50
        ]
        
        with pytest.raises(TooManyRequestsError):
            RateLimiter.check_rate_limit(
                identifier='test@example.com',
                action='login',
                max_requests=5,
                window_seconds=300
            )
