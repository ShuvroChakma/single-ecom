"""Custom response serializers for Swagger documentation."""
from rest_framework import serializers


class MetaSerializer(serializers.Serializer):
    """Metadata for API responses."""
    timestamp = serializers.DateTimeField()


class ErrorDetailSerializer(serializers.Serializer):
    """Error detail structure."""
    field = serializers.CharField(required=False)
    message = serializers.CharField()


class APIResponseSerializer(serializers.Serializer):
    """Standard API response format."""
    success = serializers.BooleanField()
    data = serializers.JSONField(allow_null=True)
    message = serializers.CharField()
    errors = ErrorDetailSerializer(many=True)
    meta = MetaSerializer()


class SuccessResponseSerializer(serializers.Serializer):
    """Success response format."""
    success = serializers.BooleanField(default=True)
    data = serializers.JSONField()
    message = serializers.CharField()
    errors = serializers.ListField(default=[])
    meta = MetaSerializer()


class ErrorResponseSerializer(serializers.Serializer):
    """Error response format."""
    success = serializers.BooleanField(default=False)
    data = serializers.JSONField(allow_null=True, default=None)
    message = serializers.CharField()
    errors = ErrorDetailSerializer(many=True)
    meta = MetaSerializer()
