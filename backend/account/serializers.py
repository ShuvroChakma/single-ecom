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
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name', 'mobile_number')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'mobile_number': {'required': False},
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
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        """Validate credentials."""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'),
                                username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials.')
            if not user.is_active:
                raise serializers.ValidationError('Please verify your email before logging in.')
            if not user.email_verified:
                raise serializers.ValidationError('Email not verified. Please check your email for verification code.')
        else:
            raise serializers.ValidationError('Must include "email" and "password".')
        
        attrs['user'] = user
        return attrs


class VerifyEmailSerializer(serializers.Serializer):
    """Serializer for email verification."""
    
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, max_length=6, min_length=6)
