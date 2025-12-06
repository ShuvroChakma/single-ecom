"""Unit tests for serializers."""
import pytest
from django.contrib.auth import get_user_model
from account.serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, VerifyEmailSerializer
)

User = get_user_model()


@pytest.mark.django_db
class TestUserSerializer:
    """Test UserSerializer."""
    
    def test_serialize_user(self):
        """Test serializing user data."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )
        
        serializer = UserSerializer(user)
        data = serializer.data
        
        assert data['email'] == 'test@example.com'
        assert data['first_name'] == 'John'
        assert data['last_name'] == 'Doe'
        assert data['user_type'] == 'CUSTOMER'
        assert 'password' not in data


@pytest.mark.django_db
class TestRegisterSerializer:
    """Test RegisterSerializer."""
    
    def test_valid_registration(self):
        """Test valid user registration."""
        data = {
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        
        serializer = RegisterSerializer(data=data)
        assert serializer.is_valid()
        
        user = serializer.save()
        assert user.email == 'test@example.com'
        assert user.user_type == 'CUSTOMER'
        assert user.is_active is False  # Inactive until verified
    
    def test_password_mismatch(self):
        """Test registration with mismatched passwords."""
        data = {
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'password2': 'DifferentPass123!',
        }
        
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert 'password' in serializer.errors
    
    def test_weak_password(self):
        """Test registration with weak password."""
        data = {
            'email': 'test@example.com',
            'password': '123',
            'password2': '123',
        }
        
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
    
    def test_invalid_email(self):
        """Test registration with invalid email."""
        data = {
            'email': 'invalid-email',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
        }
        
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors


@pytest.mark.django_db
class TestLoginSerializer:
    """Test LoginSerializer."""
    
    def test_valid_login(self):
        """Test valid login credentials."""
        user = User.objects.create_user(
            email='test@example.com',
            password='TestPass123!'
        )
        user.is_active = True
        user.email_verified = True
        user.save()
        
        data = {
            'email': 'test@example.com',
            'password': 'TestPass123!'
        }
        
        serializer = LoginSerializer(data=data, context={'request': None})
        assert serializer.is_valid()
        assert serializer.validated_data['user'] == user
    
    def test_invalid_credentials(self):
        """Test login with invalid credentials."""
        User.objects.create_user(
            email='test@example.com',
            password='TestPass123!'
        )
        
        data = {
            'email': 'test@example.com',
            'password': 'WrongPassword'
        }
        
        serializer = LoginSerializer(data=data, context={'request': None})
        assert not serializer.is_valid()
    
    def test_unverified_email(self):
        """Test login with unverified email."""
        user = User.objects.create_user(
            email='test@example.com',
            password='TestPass123!'
        )
        user.is_active = True
        user.email_verified = False
        user.save()
        
        data = {
            'email': 'test@example.com',
            'password': 'TestPass123!'
        }
        
        serializer = LoginSerializer(data=data, context={'request': None})
        assert not serializer.is_valid()
        assert 'email not verified' in str(serializer.errors).lower()


class TestVerifyEmailSerializer:
    """Test VerifyEmailSerializer."""
    
    def test_valid_data(self):
        """Test valid verification data."""
        data = {
            'email': 'test@example.com',
            'otp': '123456'
        }
        
        serializer = VerifyEmailSerializer(data=data)
        assert serializer.is_valid()
    
    def test_invalid_otp_length(self):
        """Test OTP with wrong length."""
        data = {
            'email': 'test@example.com',
            'otp': '123'  # Too short
        }
        
        serializer = VerifyEmailSerializer(data=data)
        assert not serializer.is_valid()
        assert 'otp' in serializer.errors
