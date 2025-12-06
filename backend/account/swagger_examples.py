"""
Comprehensive Swagger/OpenAPI examples for all authentication endpoints.
This file contains all the request/response examples in one place.
"""

from drf_spectacular.utils import OpenApiExample

# Registration Examples
REGISTER_REQUEST_EXAMPLE = OpenApiExample(
    'Registration Request',
    value={
        'email': 'john.doe@example.com',
        'password': 'SecurePassword123!',
        'password2': 'SecurePassword123!',
        'first_name': 'John',
        'last_name': 'Doe',
        'mobile_number': '+1234567890'
    },
    request_only=True,
    description='Example registration request with all fields'
)

REGISTER_SUCCESS_EXAMPLE = OpenApiExample(
    'Registration Success',
    value={
        'success': True,
        'data': {
            'id': 1,
            'email': 'john.doe@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'mobile_number': '+1234567890',
            'user_type': 'CUSTOMER',
            'is_active': False,
            'email_verified': False,
            'date_joined': '2025-12-06T15:00:00Z'
        },
        'message': 'User registered successfully. Please check your email for verification code.',
        'errors': [],
        'meta': {'timestamp': '2025-12-06T15:00:00Z'}
    },
    response_only=True,
    status_codes=['201']
)

# Login Examples
LOGIN_REQUEST_EXAMPLE = OpenApiExample(
    'Login Request',
    value={
        'email': 'john.doe@example.com',
        'password': 'SecurePassword123!'
    },
    request_only=True,
    description='Login with email and password'
)

LOGIN_SUCCESS_EXAMPLE = OpenApiExample(
    'Login Success',
    value={
        'success': True,
        'data': {
            'access': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'refresh': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'user': {
                'id': 1,
                'email': 'john.doe@example.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'user_type': 'CUSTOMER'
            }
        },
        'message': 'Login successful',
        'errors': [],
        'meta': {'timestamp': '2025-12-06T15:00:00Z'}
    },
    response_only=True,
    status_codes=['200']
)

# Verify Email Examples
VERIFY_EMAIL_REQUEST_EXAMPLE = OpenApiExample(
    'Verify Email Request',
    value={
        'email': 'john.doe@example.com',
        'otp': '123456'
    },
    request_only=True,
    description='Verify email with 6-digit OTP code'
)

VERIFY_EMAIL_SUCCESS_EXAMPLE = OpenApiExample(
    'Verification Success',
    value={
        'success': True,
        'data': None,
        'message': 'Email verified successfully. You can now login.',
        'errors': [],
        'meta': {'timestamp': '2025-12-06T15:00:00Z'}
    },
    response_only=True,
    status_codes=['200']
)

# Resend OTP Examples
RESEND_OTP_REQUEST_EXAMPLE = OpenApiExample(
    'Resend OTP Request',
    value={
        'email': 'john.doe@example.com'
    },
    request_only=True,
    description='Request new OTP for email verification'
)

RESEND_OTP_SUCCESS_EXAMPLE = OpenApiExample(
    'OTP Sent',
    value={
        'success': True,
        'data': None,
        'message': 'OTP sent successfully. Please check your email.',
        'errors': [],
        'meta': {'timestamp': '2025-12-06T15:00:00Z'}
    },
    response_only=True,
    status_codes=['200']
)

# Error Examples
VALIDATION_ERROR_EXAMPLE = OpenApiExample(
    'Validation Error',
    value={
        'success': False,
        'data': None,
        'message': 'Validation failed',
        'errors': [
            {'field': 'email', 'message': 'This field is required'},
            {'field': 'password', 'message': 'Password is too weak'}
        ],
        'meta': {'timestamp': '2025-12-06T15:00:00Z'}
    },
    response_only=True,
    status_codes=['400']
)

RATE_LIMIT_ERROR_EXAMPLE = OpenApiExample(
    'Rate Limit Exceeded',
    value={
        'success': False,
        'data': None,
        'message': 'Rate limit exceeded. Try again in 245 seconds.',
        'errors': [],
        'meta': {'timestamp': '2025-12-06T15:00:00Z'}
    },
    response_only=True,
    status_codes=['429']
)

UNAUTHORIZED_ERROR_EXAMPLE = OpenApiExample(
    'Unauthorized',
    value={
        'success': False,
        'data': None,
        'message': 'Invalid credentials',
        'errors': [{'message': 'Email or password is incorrect'}],
        'meta': {'timestamp': '2025-12-06T15:00:00Z'}
    },
    response_only=True,
    status_codes=['401']
)
