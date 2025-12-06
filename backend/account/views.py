from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from config.api_response import APIResponse
from config.exceptions import ValidationError, UnauthorizedError, BadRequestError, ForbiddenError, NotFoundError, ServerError
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, VerifyEmailSerializer
from .utils import RefreshTokenManager, OTPManager
from .logging_utils import log_user_action
from .rate_limiter import email_rate_limit, rate_limit
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample, OpenApiResponse, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from .swagger_examples import *
from config.response_serializers import SuccessResponseSerializer, ErrorResponseSerializer
from drf_spectacular.types import OpenApiTypes


class RegisterView(APIView):
    """Register a new user."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    @extend_schema(
        tags=['Authentication'],
        summary='Register new user',
        description='Register a new customer account. Email verification required before login.',
        request=RegisterSerializer,
        responses={
            201: UserSerializer,
            400: {'description': 'Validation error'},
            429: {'description': 'Rate limit exceeded'}
        },
        examples=[
            OpenApiExample(
                'Register Example',
                value={
                    'email': 'user@example.com',
                    'password': 'SecurePass123!',
                    'password2': 'SecurePass123!',
                    'first_name': 'John',
                    'last_name': 'Doe'
                }
            )
        ]
    )
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            log_user_action(
                action='USER_REGISTERED',
                email=request.data.get('email', 'unknown'),
                request=request,
                details={'errors': serializer.errors},
                success=False
            )
            raise ValidationError(
                message='Registration failed',
                errors=serializer.errors
            )
        
        user = serializer.save()
        
        # Generate and send OTP
        OTPManager.create_email_verification_otp(user)
        
        # Log successful registration
        log_user_action(
            action='USER_REGISTERED',
            email=user.email,
            user=user,
            request=request,
            details={'user_type': user.user_type}
        )
        
        log_user_action(
            action='OTP_SENT',
            email=user.email,
            user=user,
            request=request
        )
        
        user_data = UserSerializer(user).data
        return APIResponse.success(
            data=user_data,
            message='User registered successfully. Please check your email for verification code.',
            status_code=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """Login user and return JWT tokens."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    @extend_schema(
        tags=['Authentication'],
        summary='User login',
        description='Authenticate user with email and password. Returns JWT access and refresh tokens.',
        request=LoginSerializer,
        examples=[
            OpenApiExample(
                'Login Request',
                value={
                    'email': 'user@example.com',
                    'password': 'SecurePass123!'
                },
                request_only=True,
                description='Login with registered email and password'
            ),
            OpenApiExample(
                'Login Success',
                value={
                    'success': True,
                    'data': {
                        'access': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMzNTA1NjAwLCJpYXQiOjE3MzM1MDIwMDAsImp0aSI6ImFiYzEyMyIsInVzZXJfaWQiOjF9.xyz',
                        'refresh': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTczMzU4ODQwMCwiaWF0IjoxNzMzNTAyMDAwLCJqdGkiOiJkZWYxMjMiLCJ1c2VyX2lkIjoxfQ.abc',
                        'user': {
                            'id': 1,
                            'email': 'user@example.com',
                            'first_name': 'John',
                            'last_name': 'Doe',
                            'user_type': 'CUSTOMER'
                        }
                    },
                    'message': 'Login successful',
                    'errors': [],
                    'meta': {'timestamp': '2025-12-06T16:00:00Z'}
                },
                response_only=True,
                status_codes=['200']
            ),
            OpenApiExample(
                'Invalid Credentials',
                value={
                    'success': False,
                    'data': None,
                    'message': 'Login failed',
                    'errors': [
                        {'field': 'non_field_errors', 'message': 'Invalid credentials.'}
                    ],
                    'meta': {'timestamp': '2025-12-06T16:00:00Z'}
                },
                response_only=True,
                status_codes=['401']
            ),
            OpenApiExample(
                'Email Not Verified',
                value={
                    'success': False,
                    'data': None,
                    'message': 'Login failed',
                    'errors': [
                        {'field': 'non_field_errors', 'message': 'Email not verified. Please check your email for verification code.'}
                    ],
                    'meta': {'timestamp': '2025-12-06T16:00:00Z'}
                },
                response_only=True,
                status_codes=['401']
            ),
            OpenApiExample(
                'Rate Limit Exceeded',
                value={
                    'success': False,
                    'data': None,
                    'message': 'Rate limit exceeded for login. Try again in 180 seconds.',
                    'errors': [],
                    'meta': {'timestamp': '2025-12-06T16:00:00Z'}
                },
                response_only=True,
                status_codes=['429']
            )
        ],
        responses={
            200: OpenApiResponse(
                response=SuccessResponseSerializer,
                description='Login successful - Returns JWT tokens and user data'
            ),
            401: OpenApiResponse(
                response=ErrorResponseSerializer,
                description='Invalid credentials or email not verified'
            ),
            429: OpenApiResponse(
                response=ErrorResponseSerializer,
                description='Rate limit exceeded (5 attempts per 5 minutes per email)'
            )
        }
    )
    @email_rate_limit('login', max_requests=5, window_seconds=300)  # 5 per 5 min per email
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            log_user_action(
                action='LOGIN_FAILED',
                email=request.data.get('email', 'unknown'),
                request=request,
                details={'errors': serializer.errors},
                success=False
            )
            raise UnauthorizedError(
                message='Login failed',
                errors=serializer.errors
            )
        
        user = serializer.validated_data['user']
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Store refresh token in Redis
        RefreshTokenManager.store_token(
            user_id=user.id,
            jti=str(refresh['jti']),
            metadata={'created_at': str(refresh['iat'])}
        )
        
        # Log successful login
        log_user_action(
            action='LOGIN_SUCCESS',
            email=user.email,
            user=user,
            request=request,
            details={'user_type': user.user_type}
        )
        
        user_data = UserSerializer(user).data
        
        return APIResponse.success(
            data={
                'user': user_data,
                'access': str(access),
                'refresh': str(refresh),
            },
            message='Login successful'
        )


class LogoutView(APIView):
    """Logout user by removing refresh token from Redis."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            raise BadRequestError(message='Refresh token is required')
        
        try:
            token = RefreshToken(refresh_token)
            user_id = token['user_id']
            jti = str(token['jti'])
            
            # Remove token from Redis
            RefreshTokenManager.revoke_token(user_id, jti)
            
            return APIResponse.success(message='Logout successful')
        except Exception as e:
            raise BadRequestError(
                message='Invalid token',
                errors={'token': str(e)}
            )


class TokenRefreshView(APIView):
    """Refresh access token using refresh token."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    @rate_limit('token_refresh', max_requests=20, window_seconds=60)  # 20 per min per IP
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            raise BadRequestError(message='Refresh token is required')
        
        try:
            token = RefreshToken(refresh_token)
            user_id = token['user_id']
            jti = str(token['jti'])
            
            # Check if token is whitelisted in Redis
            if not RefreshTokenManager.is_valid(user_id, jti):
                raise UnauthorizedError(message='Token has been revoked')
            
            # Generate new access token
            access = token.access_token
            
            # Log token refresh
            log_user_action(
                action='TOKEN_REFRESHED',
                email=request.user.email if request.user.is_authenticated else 'unknown',
                user=request.user if request.user.is_authenticated else None,
                request=request
            )
            
            return APIResponse.success(
                data={'access': str(access)},
                message='Token refreshed successfully'
            )
        except UnauthorizedError:
            raise
        except Exception as e:
            raise UnauthorizedError(
                message='Invalid or expired token',
                errors={'token': str(e)}
            )


class TokenVerifyView(APIView):
    """Verify access token validity."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from rest_framework_simplejwt.tokens import AccessToken
        
        token = request.data.get('token')
        if not token:
            raise BadRequestError(message='Token is required')
        
        try:
            # This will raise an exception if token is invalid
            AccessToken(token)
            return APIResponse.success(message='Token is valid')
        except Exception as e:
            raise UnauthorizedError(
                message='Invalid or expired token',
                errors={'token': str(e)}
            )


class CurrentUserView(APIView):
    """Get current user info with groups and permissions (cached)."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        cache_key = f'user:{user.id}'
        
        # Try to get from cache
        cached_data = cache.get(cache_key)
        if cached_data:
            return APIResponse.success(
                data=cached_data,
                message='User data retrieved'
            )
        
        # If not in cache, serialize and cache it
        user_data = UserSerializer(user).data
        cache.set(cache_key, user_data, timeout=900)  # 15 minutes
        
        return APIResponse.success(
            data=user_data,
            message='User data retrieved'
        )


class VerifyEmailView(APIView):
    """Verify user email with OTP."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    @extend_schema(
        tags=['Authentication'],
        summary='Verify email with OTP',
        description='Verify user email address using the OTP code sent during registration',
        request=VerifyEmailSerializer,
        examples=[
            OpenApiExample(
                'Verify Email Request',
                value={
                    'email': 'user@example.com',
                    'otp': '123456'
                },
                request_only=True
            )
        ],
        
        responses={
            200: OpenApiResponse(
                response=SuccessResponseSerializer,
                description='Email verified successfully',
                examples=[OpenApiExample('Success', value={
                    'success': True,
                    'data': None,
                    'message': 'Email verified successfully. You can now login.',
                    'errors': [],
                    'meta': {'timestamp': '2025-12-06T15:00:00Z'}
                })]
            ),
            400: OpenApiResponse(
                response=ErrorResponseSerializer,
                description='Invalid or expired OTP',
                examples=[OpenApiExample('Invalid OTP', value={
                    'success': False,
                    'data': None,
                    'message': 'Invalid or expired OTP',
                    'errors': [{'message': 'Invalid OTP code'}],
                    'meta': {'timestamp': '2025-12-06T15:00:00Z'}
                })]
            )
        }
    )
    @email_rate_limit('verify_email', max_requests=5, window_seconds=300)  # 5 per 5 min per email
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(
                message='Validation failed',
                errors=serializer.errors
            )
        
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        
        # Verify OTP
        try:
            user = OTPManager.verify_email_otp(email, otp)
            
            # Log successful verification
            log_user_action(
                action='EMAIL_VERIFIED',
                email=email,
                user=user,
                request=request
            )
            
            return APIResponse.success(
                message='Email verified successfully. You can now login.'
            )
        except Exception as e:
            # Log failed verification
            log_user_action(
                action='OTP_FAILED',
                email=email,
                request=request,
                details={'error': str(e)},
                success=False
            )
            raise


class ResendOTPView(APIView):
    """Resend OTP for email verification."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    @extend_schema(
        tags=['Authentication'],
        summary='Resend OTP',
        description='Resend OTP code for email verification. Use this if the original OTP expired or was not received.',
        request={
            'type': 'object',
            'required': ['email'],
            'properties': {
                'email': {'type': 'string', 'format': 'email', 'description': 'Email address to resend OTP to'}
            },
            'example': {'email': 'user@example.com'}
        },
        responses={
            200: OpenApiResponse(
                response=SuccessResponseSerializer,
                description='OTP sent successfully',
                examples=[OpenApiExample('Success', value={
                    'success': True,
                    'data': None,
                    'message': 'OTP sent successfully. Please check your email.',
                    'errors': [],
                    'meta': {'timestamp': '2025-12-06T15:00:00Z'}
                })]
            ),
            400: OpenApiResponse(
                response=ErrorResponseSerializer,
                description='Email already verified or not found',
                examples=[OpenApiExample('Already Verified', value={
                    'success': False,
                    'data': None,
                    'message': 'Email is already verified',
                    'errors': [],
                    'meta': {'timestamp': '2025-12-06T15:00:00Z'}
                })]
            )
        }
    )
    @email_rate_limit('resend_otp', max_requests=3, window_seconds=600)  # 3 per 10 min per email
    def post(self, request):
        from .models import User
        from config.exceptions import NotFoundError
        
        email = request.data.get('email')
        if not email:
            raise BadRequestError(message='Email is required')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise NotFoundError(message='User not found')
        
        if user.email_verified:
            raise ValidationError(message='Email is already verified')
        
        # Generate and send new OTP
        OTPManager.create_email_verification_otp(user)
        
        # Log OTP resend
        log_user_action(
            action='OTP_SENT',
            email=user.email,
            user=user,
            request=request,
            details={'resend': True}
        )
        
        return APIResponse.success(
            message='OTP sent successfully. Please check your email.'
        )


class DebugGetOTPView(APIView):
    """
    DEBUG ONLY: Get OTP for email verification testing.
    This endpoint is only available when DEBUG=True.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        from django.conf import settings
        
        # Only available in debug mode
        if not settings.DEBUG:
            raise ForbiddenError(message='This endpoint is only available in debug mode')
        
        email = request.query_params.get('email')
        if not email:
            raise BadRequestError(message='Email parameter is required')
        
        # Get OTP from Redis
        import json
        
        key = f'email_otp:{email}'
        otp_data_str = cache.get(key)
        
        if not otp_data_str:
            raise NotFoundError(message=f'No OTP found for {email}. Please register or request OTP first.')
        
        try:
            otp_data = json.loads(otp_data_str)
            return APIResponse.success(
                data={
                    'email': email,
                    'otp': otp_data.get('otp'),
                    'created_at': otp_data.get('created_at'),
                    'expires_in_seconds': 600  # 10 minutes
                },
                message='OTP retrieved successfully (DEBUG MODE ONLY)'
            )
        except json.JSONDecodeError:
            raise ServerError(message='Invalid OTP data format')


class CheckEmailStatusView(APIView):
    """
    Check if an email is registered and verified.
    Helps frontend determine what action to show.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    @extend_schema(
        tags=['Authentication'],
        summary='Check email status',
        description='Check if email is registered and verified. Helps determine next action for user.',
        parameters=[OpenApiParameter('email', str, OpenApiParameter.QUERY, description='Email to check')],
        responses={
            200: OpenApiResponse(
                response=SuccessResponseSerializer,
                description='Email status retrieved',
                examples=[
                    OpenApiExample(
                        'Email Not Registered',
                        value={
                            'success': True,
                            'data': {
                                'email': 'user@example.com',
                                'exists': False,
                                'verified': False,
                                'can_login': False,
                                'action': 'register'
                            },
                            'message': 'Email is available for registration',
                            'errors': [],
                            'meta': {'timestamp': '2025-12-06T15:00:00Z'}
                        }
                    ),
                    OpenApiExample(
                        'Email Registered but Not Verified',
                        value={
                            'success': True,
                            'data': {
                                'email': 'user@example.com',
                                'exists': True,
                                'verified': False,
                                'can_login': False,
                                'action': 'verify_email'
                            },
                            'message': 'Email registered but not verified',
                            'errors': [],
                            'meta': {'timestamp': '2025-12-06T15:00:00Z'}
                        }
                    ),
                    OpenApiExample(
                        'Email Verified',
                        value={
                            'success': True,
                            'data': {
                                'email': 'user@example.com',
                                'exists': True,
                                'verified': True,
                                'can_login': True,
                                'action': 'login'
                            },
                            'message': 'Email is verified and can login',
                            'errors': [],
                            'meta': {'timestamp': '2025-12-06T15:00:00Z'}
                        }
                    )
                ]
            ),
            400: OpenApiResponse(response=ErrorResponseSerializer, description='Email parameter missing')
        }
    )
    @rate_limit('check_email', max_requests=20, window_seconds=60)  # 20 per minute per IP
    def get(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        email = request.query_params.get('email')
        if not email:
            raise BadRequestError(message='Email parameter is required')
        
        try:
            user = User.objects.get(email=email)
            
            # User exists
            if user.email_verified:
                return APIResponse.success(
                    data={
                        'email': email,
                        'exists': True,
                        'verified': True,
                        'can_login': True,
                        'action': 'login'
                    },
                    message='Email is verified and can login'
                )
            else:
                return APIResponse.success(
                    data={
                        'email': email,
                        'exists': True,
                        'verified': False,
                        'can_login': False,
                        'action': 'verify_email'
                    },
                    message='Email registered but not verified'
                )
        except User.DoesNotExist:
            # User doesn't exist
            return APIResponse.success(
                data={
                    'email': email,
                    'exists': False,
                    'verified': False,
                    'can_login': False,
                    'action': 'register'
                },
                message='Email is available for registration'
            )
