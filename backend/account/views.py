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
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes


class RegisterView(APIView):
    """Register a new user."""
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
    permission_classes = [AllowAny]
    
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
    permission_classes = [AllowAny]
    
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
    permission_classes = [AllowAny]
    
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
