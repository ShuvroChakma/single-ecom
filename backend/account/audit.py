from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone


class AuditLog(models.Model):
    """Audit log for tracking user actions and system events."""
    
    ACTION_CHOICES = (
        ('USER_REGISTERED', 'User Registered'),
        ('EMAIL_VERIFIED', 'Email Verified'),
        ('OTP_SENT', 'OTP Sent'),
        ('OTP_VERIFIED', 'OTP Verified'),
        ('OTP_FAILED', 'OTP Verification Failed'),
        ('LOGIN_SUCCESS', 'Login Successful'),
        ('LOGIN_FAILED', 'Login Failed'),
        ('LOGOUT', 'Logout'),
        ('TOKEN_REFRESHED', 'Token Refreshed'),
        ('TOKEN_REVOKED', 'Token Revoked'),
        ('PASSWORD_CHANGED', 'Password Changed'),
        ('PROFILE_UPDATED', 'Profile Updated'),
    )
    
    user = models.ForeignKey(
        'account.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True)
    email = models.EmailField(db_index=True)  # Store email even if user is deleted
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)
    success = models.BooleanField(default=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp', 'action']),
            models.Index(fields=['email', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
        ]
    
    def __str__(self):
        return f'{self.email} - {self.action} at {self.timestamp}'
    
    @classmethod
    def log(cls, action, email, user=None, ip_address=None, user_agent=None, 
            details=None, success=True):
        """Create an audit log entry."""
        return cls.objects.create(
            user=user,
            action=action,
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {},
            success=success
        )
