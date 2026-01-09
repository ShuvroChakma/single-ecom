"""
Base class for payment gateway implementations.
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from uuid import UUID
from decimal import Decimal
from dataclasses import dataclass
from enum import Enum


class PaymentStatus(str, Enum):
    """Payment transaction status."""
    INITIATED = "INITIATED"
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


@dataclass
class PaymentInitResult:
    """Result of payment initiation."""
    success: bool
    transaction_id: Optional[str] = None
    redirect_url: Optional[str] = None
    error_message: Optional[str] = None
    gateway_response: Optional[Dict[str, Any]] = None


@dataclass
class PaymentVerifyResult:
    """Result of payment verification/callback."""
    success: bool
    transaction_id: Optional[str] = None
    amount: Optional[Decimal] = None
    status: PaymentStatus = PaymentStatus.PENDING
    error_message: Optional[str] = None
    gateway_response: Optional[Dict[str, Any]] = None


@dataclass  
class RefundResult:
    """Result of refund request."""
    success: bool
    refund_id: Optional[str] = None
    amount: Optional[Decimal] = None
    error_message: Optional[str] = None
    gateway_response: Optional[Dict[str, Any]] = None


class PaymentGatewayBase(ABC):
    """
    Abstract base class for payment gateway implementations.
    
    Each gateway (bKash, SSL Commerz, etc.) should inherit from this
    and implement the required methods.
    """
    
    def __init__(self, config: Dict[str, Any], is_sandbox: bool = True):
        """
        Initialize gateway with configuration.
        
        Args:
            config: Gateway-specific configuration (API keys, etc.)
            is_sandbox: Whether to use sandbox/test mode
        """
        self.config = config
        self.is_sandbox = is_sandbox
    
    @property
    @abstractmethod
    def gateway_code(self) -> str:
        """Return the gateway code (e.g., 'bkash', 'sslcommerz')."""
        pass
    
    @property
    @abstractmethod
    def gateway_name(self) -> str:
        """Return the display name."""
        pass
    
    @abstractmethod
    async def initiate_payment(
        self,
        order_id: UUID,
        amount: Decimal,
        currency: str,
        customer_name: str,
        customer_email: str,
        customer_phone: str,
        description: str,
        success_url: str,
        cancel_url: str,
        fail_url: str
    ) -> PaymentInitResult:
        """
        Initiate a payment.
        
        Returns a PaymentInitResult with redirect URL for online payments.
        """
        pass
    
    @abstractmethod
    async def verify_payment(
        self,
        transaction_id: str,
        gateway_data: Dict[str, Any]
    ) -> PaymentVerifyResult:
        """
        Verify a payment after callback/redirect.
        
        Args:
            transaction_id: Our internal transaction ID
            gateway_data: Data returned by gateway (query params, POST data, etc.)
        """
        pass
    
    @abstractmethod
    async def process_callback(
        self,
        callback_data: Dict[str, Any]
    ) -> PaymentVerifyResult:
        """
        Process IPN/webhook callback from gateway.
        
        Args:
            callback_data: Raw callback data from gateway
        """
        pass
    
    async def refund(
        self,
        transaction_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None
    ) -> RefundResult:
        """
        Issue a refund.
        
        Optional - not all gateways support refunds via API.
        Default implementation returns not supported.
        """
        return RefundResult(
            success=False,
            error_message="Refund not supported for this gateway"
        )
    
    def validate_config(self) -> bool:
        """Validate that required config fields are present."""
        return True
    
    def get_base_url(self) -> str:
        """Get API base URL based on sandbox mode."""
        return ""
