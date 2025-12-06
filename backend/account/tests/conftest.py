import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    """Return API client for testing."""
    return APIClient()


@pytest.fixture
def user_data():
    """Return valid user registration data."""
    return {
        'email': 'test@example.com',
        'password': 'SecurePass123!',
        'password2': 'SecurePass123!',
        'first_name': 'Test',
        'last_name': 'User',
        'mobile_number': '+1234567890'
    }


@pytest.fixture
def create_user(db):
    """Factory fixture to create users."""
    def _create_user(email='test@example.com', password='TestPass123!', **kwargs):
        user = User.objects.create_user(
            email=email,
            password=password,
            **kwargs
        )
        return user
    return _create_user


@pytest.fixture
def authenticated_client(api_client, create_user):
    """Return authenticated API client."""
    user = create_user()
    user.email_verified = True
    user.is_active = True
    user.save()
    
    # Login to get token
    response = api_client.post('/api/v1/auth/login/', {
        'email': user.email,
        'password': 'TestPass123!'
    })
    
    token = response.data['data']['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    api_client.user = user
    
    return api_client


@pytest.fixture
def mock_redis(mocker):
    """Mock Redis cache for testing."""
    return mocker.patch('django.core.cache.cache')
