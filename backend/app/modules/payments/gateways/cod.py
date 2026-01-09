"""
Cash on Delivery (COD) gateway implementation.
"""
from typing import Optional, Dict, Any
from uuid import UUID
from decimal import Decimal

from app.modules.payments.gateways.base import (
    PaymentGatewayBase,
    PaymentInitResult,
    PaymentVerifyResult,
    RefundResult,
    PaymentStatus
)


class CODGateway(PaymentGatewayBase):
    """
    Cash on Delivery implementation.
    
    COD doesn't require online payment - order is confirmed immediately
    and payment is collected upon delivery.
    """
    
    @property
    def gateway_code(self) -> str:
        return "cod"
    
    @property
    def gateway_name(self) -> str:
        return "Cash on Delivery"
    
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
        COD doesn't initiate online payment.
        Returns success immediately - payment collected on delivery.
        """
        return PaymentInitResult(
            success=True,
            transaction_id=f"COD-{order_id}",
            redirect_url=None,  # No redirect needed
            gateway_response={"method": "cod", "order_id": str(order_id)}
        )
    
    async def verify_payment(
        self,
        transaction_id: str,
        gateway_data: Dict[str, Any]
    ) -> PaymentVerifyResult:
        """COD verification - always pending until delivery."""
        return PaymentVerifyResult(
            success=True,
            transaction_id=transaction_id,
            status=PaymentStatus.PENDING,
            gateway_response=gateway_data
        )
    
    async def process_callback(
        self,
        callback_data: Dict[str, Any]
    ) -> PaymentVerifyResult:
        """COD doesn't have callbacks - payment is manual."""
        return PaymentVerifyResult(
            success=True,
            status=PaymentStatus.PENDING,
            gateway_response=callback_data
        )
    
    def validate_config(self) -> bool:
        """COD doesn't require configuration."""
        return True
