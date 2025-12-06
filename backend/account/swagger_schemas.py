"""
Helper file to add comprehensive Swagger documentation to all authentication views.
Run this to update views.py with proper OpenAPI schemas.
"""

SCHEMA_ADDITIONS = {
    'LoginView': '''    @extend_schema(
        tags=['Authentication'],
        summary='User login',
        description='Authenticate user and return JWT tokens',
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(
                response=SuccessResponseSerializer,
                description='Login successful',
                examples=[OpenApiExample('Success', value={
                    'success': True,
                    'data': {'access': 'eyJ...', 'refresh': 'eyJ...', 'user': {'email': 'user@example.com'}},
                    'message': 'Login successful',
                    'errors': [],
                    'meta': {'timestamp': '2025-12-06T15:00:00Z'}
                })]
            ),
            401: OpenApiResponse(response=ErrorResponseSerializer, description='Invalid credentials'),
            429: OpenApiResponse(response=ErrorResponseSerializer, description='Rate limit exceeded')
        }
    )''',
    
    'VerifyEmailView': '''    @extend_schema(
        tags=['Authentication'],
        summary='Verify email with OTP',
        description='Verify user email address using OTP code',
        request=VerifyEmailSerializer,
        responses={
            200: OpenApiResponse(response=SuccessResponseSerializer, description='Email verified'),
            400: OpenApiResponse(response=ErrorResponseSerializer, description='Invalid OTP')
        }
    )''',
    
    'ResendOTPView': '''    @extend_schema(
        tags=['Authentication'],
        summary='Resend OTP',
        description='Resend OTP for email verification',
        request={'type': 'object', 'properties': {'email': {'type': 'string'}}},
        responses={
            200: OpenApiResponse(response=SuccessResponseSerializer, description='OTP sent'),
            400: OpenApiResponse(response=ErrorResponseSerializer, description='Email already verified')
        }
    )''',
    
    'LogoutView': '''    @extend_schema(
        tags=['Authentication'],
        summary='Logout user',
        description='Revoke refresh token and logout user',
        request={'type': 'object', 'properties': {'refresh': {'type': 'string'}}},
        responses={
            200: OpenApiResponse(response=SuccessResponseSerializer, description='Logged out'),
            401: OpenApiResponse(response=ErrorResponseSerializer, description='Unauthorized')
        }
    )''',
    
    'TokenRefreshView': '''    @extend_schema(
        tags=['Authentication'],
        summary='Refresh access token',
        description='Get new access token using refresh token',
        request={'type': 'object', 'properties': {'refresh': {'type': 'string'}}},
        responses={
            200: OpenApiResponse(response=SuccessResponseSerializer, description='Token refreshed'),
            401: OpenApiResponse(response=ErrorResponseSerializer, description='Invalid token')
        }
    )''',
    
    'TokenVerifyView': '''    @extend_schema(
        tags=['Authentication'],
        summary='Verify token',
        description='Verify if a token is valid',
        request={'type': 'object', 'properties': {'token': {'type': 'string'}}},
        responses={
            200: OpenApiResponse(response=SuccessResponseSerializer, description='Token valid'),
            401: OpenApiResponse(response=ErrorResponseSerializer, description='Token invalid')
        }
    )''',
    
    'CurrentUserView': '''    @extend_schema(
        tags=['Users'],
        summary='Get current user',
        description='Get authenticated user information',
        responses={
            200: OpenApiResponse(response=SuccessResponseSerializer, description='User data retrieved'),
            401: OpenApiResponse(response=ErrorResponseSerializer, description='Unauthorized')
        }
    )''',
    
    'DebugGetOTPView': '''    @extend_schema(
        tags=['Debug'],
        summary='Get OTP (DEBUG ONLY)',
        description='Retrieve OTP for testing (only available in DEBUG mode)',
        parameters=[OpenApiParameter('email', str, OpenApiParameter.QUERY, description='User email')],
        responses={
            200: OpenApiResponse(response=SuccessResponseSerializer, description='OTP retrieved'),
            403: OpenApiResponse(response=ErrorResponseSerializer, description='Not in debug mode'),
            404: OpenApiResponse(response=ErrorResponseSerializer, description='OTP not found')
        }
    )'''
}

print("Schema additions ready. Use this to add to views.py")
