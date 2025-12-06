from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from config.api_response import APIResponse
from config.exceptions import ValidationError, UnauthorizedError, BadRequestError
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, VerifyEmailSerializer
from .utils import RefreshTokenManager, OTPManager


class RegisterView(APIView):
    """Register a new user."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(
                message='Registration failed',
                errors=serializer.errors
            )
        
        user = serializer.save()
        
        # Generate and send OTP
        OTPManager.create_email_verification_otp(user)
        
        user_data = UserSerializer(user).data
        return APIResponse.success(
            data=user_data,
            message='User registered successfully. Please check your email for verification code.',
            status_code=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """Login user and return JWT tokens."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
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
        user = OTPManager.verify_email_otp(email, otp)
        
        return APIResponse.success(
            message='Email verified successfully. You can now login.'
        )


class ResendOTPView(APIView):
    """Resend OTP for email verification."""
    permission_classes = [AllowAny]
    
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
        
        return APIResponse.success(
            message='OTP sent successfully. Please check your email.'
        )
