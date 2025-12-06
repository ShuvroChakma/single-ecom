import json
from datetime import timedelta
from django.core.cache import cache
from django.conf import settings


class RefreshTokenManager:
    """Manage refresh tokens in Redis for whitelisting."""
    
    TOKEN_PREFIX = 'refresh_token'
    
    @classmethod
    def _get_key(cls, user_id, jti):
        """Generate Redis key for refresh token."""
        return f'{cls.TOKEN_PREFIX}:{user_id}:{jti}'
    
    @classmethod
    def store_token(cls, user_id, jti, metadata=None):
        """Store refresh token in Redis with TTL."""
        key = cls._get_key(user_id, jti)
        data = {
            'user_id': user_id,
            'jti': jti,
            'created_at': str(metadata.get('created_at')) if metadata else None,
        }
        if metadata:
            data.update(metadata)
        
        # TTL matches REFRESH_TOKEN_LIFETIME
        ttl = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
        cache.set(key, json.dumps(data), timeout=int(ttl.total_seconds()))
        return True
    
    @classmethod
    def is_valid(cls, user_id, jti):
        """Check if refresh token exists in Redis (whitelisted)."""
        key = cls._get_key(user_id, jti)
        return cache.get(key) is not None
    
    @classmethod
    def revoke_token(cls, user_id, jti):
        """Remove refresh token from Redis (blacklist)."""
        key = cls._get_key(user_id, jti)
        cache.delete(key)
        return True
    
    @classmethod
    def revoke_all_user_tokens(cls, user_id):
        """Revoke all refresh tokens for a user."""
        # This requires scanning Redis keys, which can be expensive
        # For production, consider maintaining a user token list
        pattern = f'{cls.TOKEN_PREFIX}:{user_id}:*'
        keys = cache.keys(pattern)
        if keys:
            cache.delete_many(keys)
        return True


import random
import json
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache


class OTPManager:
    """Manage OTP generation and verification using Redis."""
    
    OTP_PREFIX = 'email_otp'
    OTP_EXPIRY = 600  # 10 minutes in seconds
    
    @staticmethod
    def generate_otp():
        """Generate a 6-digit OTP."""
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    @staticmethod
    def _get_key(email):
        """Generate Redis key for email OTP."""
        return f'{OTPManager.OTP_PREFIX}:{email}'
    
    @staticmethod
    def create_email_verification_otp(user):
        """Create and send email verification OTP."""
        # Generate OTP
        otp_code = OTPManager.generate_otp()
        
        # Store in Redis with expiry
        key = OTPManager._get_key(user.email)
        otp_data = {
            'otp': otp_code,
            'user_id': user.id,
            'created_at': timezone.now().isoformat(),
        }
        cache.set(key, json.dumps(otp_data), timeout=OTPManager.OTP_EXPIRY)
        
        # Send email (you can customize this)
        subject = 'Verify Your Email'
        message = f'Your verification code is: {otp_code}\n\nThis code will expire in 10 minutes.'
        from_email = settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@example.com'
        
        try:
            send_mail(subject, message, from_email, [user.email])
        except Exception as e:
            print(f"Failed to send email: {e}")
            # In development, just print the OTP
            print(f"OTP for {user.email}: {otp_code}")
        
        return otp_code
    
    @staticmethod
    def verify_email_otp(email, otp_code):
        """Verify email OTP."""
        from .models import User
        from config.exceptions import ValidationError, NotFoundError
        
        # Get OTP from Redis
        key = OTPManager._get_key(email)
        otp_data_str = cache.get(key)
        
        if not otp_data_str:
            raise ValidationError(message='OTP has expired or does not exist')
        
        try:
            otp_data = json.loads(otp_data_str)
        except json.JSONDecodeError:
            raise ValidationError(message='Invalid OTP data')
        
        # Verify OTP
        if otp_data.get('otp') != otp_code:
            raise ValidationError(message='Invalid OTP')
        
        # Get user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise NotFoundError(message='User not found')
        
        # Delete OTP from Redis (one-time use)
        cache.delete(key)
        
        # Mark user email as verified and activate account
        user.email_verified = True
        user.is_active = True
        user.save()
        
        return user

