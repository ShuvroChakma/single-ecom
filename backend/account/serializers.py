from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with groups and permissions."""
    
    groups = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'mobile_number', 
                  'user_type', 'is_active', 'date_joined', 'groups', 'permissions')
        read_only_fields = ('id', 'date_joined')
    
    def get_groups(self, obj):
        """Get user groups."""
        return list(obj.groups.values_list('name', flat=True))
    
    def get_permissions(self, obj):
        """Get user permissions."""
        return list(obj.get_all_permissions())


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    email = serializers.EmailField(help_text="User's email address (will be used for login)")
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        help_text="Password (min 8 characters, must include letters and numbers)"
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        help_text="Confirm password (must match password field)"
    )
    first_name = serializers.CharField(required=False, help_text="User's first name")
    last_name = serializers.CharField(required=False, help_text="User's last name")
    mobile_number = serializers.CharField(required=False, help_text="User's mobile number")
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password2', 'first_name', 'last_name', 'mobile_number']
        extra_kwargs = {
            # 'first_name': {'required': False}, # Moved to field definition
            # 'last_name': {'required': False}, # Moved to field definition
            # 'mobile_number': {'required': False}, # Moved to field definition
        }
    
    def validate(self, attrs):
        """Validate passwords match."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        """Create user with validated data."""
        validated_data.pop('password2')
        # Force user_type to CUSTOMER for registration
        validated_data['user_type'] = 'CUSTOMER'
        # User is inactive until email is verified
        validated_data['is_active'] = False
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField(required=True, help_text="Registered email address")
    password = serializers.CharField(
        required=True, 
        write_only=True,
        help_text="Account password"
    )
    
    def validate(self, attrs):
        """Validate credentials."""
        from django.contrib.auth import authenticate
        from rest_framework.exceptions import ValidationError as DRFValidationError
        from config.exceptions import EmailNotVerifiedError
        from .models import User
        
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise DRFValidationError({
                'non_field_errors': ['Must include "email" and "password".']
            })

        # Try to get user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise DRFValidationError({
                'non_field_errors': ['Invalid credentials.']
            })
        
        # Check if email is verified
        if not user.email_verified:
            raise EmailNotVerifiedError(email=email)
        
        # Authenticate user
        authenticated_user = authenticate(username=email, password=password)
        if authenticated_user is None:
            raise DRFValidationError({
                'non_field_errors': ['Invalid credentials.']
            })
        
        attrs['user'] = authenticated_user
        return attrs


class VerifyEmailSerializer(serializers.Serializer):
    """Serializer for email verification with OTP."""
    
    email = serializers.EmailField(required=True, help_text="Email address to verify")
    otp = serializers.CharField(
        required=True,
        max_length=6, 
        min_length=6,
        help_text="6-digit OTP code sent to email"
    )
    
    class Meta:
        examples = {
            'email': 'user@example.com',
            'otp': '123456'
        }
