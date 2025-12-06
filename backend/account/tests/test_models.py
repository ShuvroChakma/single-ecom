"""Unit tests for account models."""
import pytest
from django.contrib.auth import get_user_model
from account.audit import AuditLog

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    """Test User model."""
    
    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        assert user.email == 'test@example.com'
        assert user.check_password('testpass123')
        assert user.user_type == 'CUSTOMER'
        assert user.is_active is False  # Inactive until email verified
        assert user.is_staff is False
        assert user.email_verified is False
    
    def test_create_superuser(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        assert user.is_staff is True
        assert user.is_superuser is True
        assert user.user_type == 'ADMIN'
    
    def test_user_str(self):
        """Test user string representation."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        assert str(user) == 'test@example.com'
    
    def test_get_full_name(self):
        """Test get_full_name method."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )
        assert user.get_full_name() == 'John Doe'
    
    def test_get_full_name_no_names(self):
        """Test get_full_name when no names provided."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        assert user.get_full_name() == 'test@example.com'
    
    def test_get_short_name(self):
        """Test get_short_name method."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John'
        )
        assert user.get_short_name() == 'John'
    
    def test_email_unique(self):
        """Test email uniqueness constraint."""
        User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        with pytest.raises(Exception):
            User.objects.create_user(
                email='test@example.com',
                password='testpass456'
            )


@pytest.mark.django_db
class TestAuditLogModel:
    """Test AuditLog model."""
    
    def test_create_audit_log(self):
        """Test creating an audit log entry."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        log = AuditLog.log(
            action='LOGIN_SUCCESS',
            email=user.email,
            user=user,
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0',
            details={'user_type': 'CUSTOMER'}
        )
        
        assert log.action == 'LOGIN_SUCCESS'
        assert log.email == user.email
        assert log.user == user
        assert log.ip_address == '192.168.1.1'
        assert log.success is True
        assert log.details['user_type'] == 'CUSTOMER'
    
    def test_audit_log_str(self):
        """Test audit log string representation."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        log = AuditLog.log(
            action='LOGIN_SUCCESS',
            email=user.email,
            user=user
        )
        
        assert 'test@example.com' in str(log)
        assert 'LOGIN_SUCCESS' in str(log)
    
    def test_audit_log_failed_action(self):
        """Test logging failed actions."""
        log = AuditLog.log(
            action='LOGIN_FAILED',
            email='test@example.com',
            success=False,
            details={'error': 'Invalid credentials'}
        )
        
        assert log.success is False
        assert log.details['error'] == 'Invalid credentials'
