"""
bKash Payment Gateway implementation.
"""
from typing import Optional, Dict, Any
from uuid import UUID
from decimal import Decimal
import httpx
import json
from datetime import datetime

from app.modules.payments.gateways.base import (
    PaymentGatewayBase,
    PaymentInitResult,
    PaymentVerifyResult,
    RefundResult,
    PaymentStatus
)


class BKashGateway(PaymentGatewayBase):
    """
    bKash Tokenized Checkout implementation.
    
    Documentation: https://developer.bka.sh/
    
    Required config:
    - app_key
    - app_secret
    - username
    - password
    """
    
    SANDBOX_URL = "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
    PRODUCTION_URL = "https://tokenized.pay.bka.sh/v1.2.0-beta"
    
    @property
    def gateway_code(self) -> str:
        return "bkash"
    
    @property
    def gateway_name(self) -> str:
        return "bKash"
    
    def get_base_url(self) -> str:
        return self.SANDBOX_URL if self.is_sandbox else self.PRODUCTION_URL
    
    def validate_config(self) -> bool:
        required = ["app_key", "app_secret", "username", "password"]
        return all(key in self.config for key in required)
    
    async def _get_token(self) -> Optional[str]:
        """Get authentication token from bKash."""
        url = f"{self.get_base_url()}/tokenized/checkout/token/grant"
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "username": self.config.get("username", ""),
            "password": self.config.get("password", "")
        }
        
        body = {
            "app_key": self.config.get("app_key", ""),
            "app_secret": self.config.get("app_secret", "")
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=body, headers=headers, timeout=30)
                data = response.json()
                
                if response.status_code == 200 and data.get("statusCode") == "0000":
                    return data.get("id_token")
                    
        except Exception as e:
            print(f"bKash token error: {e}")
        
        return None
    
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
        Create a bKash payment.
        
        Returns redirect URL to bKash checkout page.
        """
        if not self.validate_config():
            return PaymentInitResult(
                success=False,
                error_message="bKash gateway not configured properly"
            )
        
        # Get token
        token = await self._get_token()
        if not token:
            return PaymentInitResult(
                success=False,
                error_message="Failed to authenticate with bKash"
            )
        
        # Create payment
        url = f"{self.get_base_url()}/tokenized/checkout/create"
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": token,
            "X-APP-Key": self.config.get("app_key", "")
        }
        
        body = {
            "mode": "0011",  # Tokenized
            "payerReference": customer_phone,
            "callbackURL": success_url,
            "amount": str(amount),
            "currency": "BDT",
            "intent": "sale",
            "merchantInvoiceNumber": str(order_id)
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=body, headers=headers, timeout=30)
                data = response.json()
                
                if response.status_code == 200 and data.get("statusCode") == "0000":
                    return PaymentInitResult(
                        success=True,
                        transaction_id=data.get("paymentID"),
                        redirect_url=data.get("bkashURL"),
                        gateway_response=data
                    )
                else:
                    return PaymentInitResult(
                        success=False,
                        error_message=data.get("statusMessage", "Payment creation failed"),
                        gateway_response=data
                    )
                    
        except Exception as e:
            return PaymentInitResult(
                success=False,
                error_message=str(e)
            )
    
    async def verify_payment(
        self,
        transaction_id: str,
        gateway_data: Dict[str, Any]
    ) -> PaymentVerifyResult:
        """Execute payment after customer authorization."""
        token = await self._get_token()
        if not token:
            return PaymentVerifyResult(
                success=False,
                status=PaymentStatus.FAILED,
                error_message="Failed to authenticate with bKash"
            )
        
        url = f"{self.get_base_url()}/tokenized/checkout/execute"
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": token,
            "X-APP-Key": self.config.get("app_key", "")
        }
        
        body = {
            "paymentID": gateway_data.get("paymentID", transaction_id)
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=body, headers=headers, timeout=30)
                data = response.json()
                
                if response.status_code == 200 and data.get("statusCode") == "0000":
                    return PaymentVerifyResult(
                        success=True,
                        transaction_id=data.get("trxID"),
                        amount=Decimal(data.get("amount", "0")),
                        status=PaymentStatus.SUCCESS,
                        gateway_response=data
                    )
                else:
                    return PaymentVerifyResult(
                        success=False,
                        status=PaymentStatus.FAILED,
                        error_message=data.get("statusMessage", "Payment execution failed"),
                        gateway_response=data
                    )
                    
        except Exception as e:
            return PaymentVerifyResult(
                success=False,
                status=PaymentStatus.FAILED,
                error_message=str(e)
            )
    
    async def process_callback(
        self,
        callback_data: Dict[str, Any]
    ) -> PaymentVerifyResult:
        """Process bKash callback/redirect."""
        payment_id = callback_data.get("paymentID")
        status = callback_data.get("status")
        
        if status == "success":
            return await self.verify_payment(payment_id, callback_data)
        elif status == "cancel":
            return PaymentVerifyResult(
                success=False,
                transaction_id=payment_id,
                status=PaymentStatus.CANCELLED,
                error_message="Payment cancelled by user",
                gateway_response=callback_data
            )
        else:
            return PaymentVerifyResult(
                success=False,
                transaction_id=payment_id,
                status=PaymentStatus.FAILED,
                error_message="Payment failed",
                gateway_response=callback_data
            )
    
    async def refund(
        self,
        transaction_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None
    ) -> RefundResult:
        """Issue refund via bKash API."""
        token = await self._get_token()
        if not token:
            return RefundResult(
                success=False,
                error_message="Failed to authenticate with bKash"
            )
        
        url = f"{self.get_base_url()}/tokenized/checkout/payment/refund"
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": token,
            "X-APP-Key": self.config.get("app_key", "")
        }
        
        body = {
            "paymentID": transaction_id,
            "amount": str(amount) if amount else None,
            "trxID": transaction_id,
            "sku": "refund",
            "reason": reason or "Customer refund request"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=body, headers=headers, timeout=30)
                data = response.json()
                
                if response.status_code == 200 and data.get("statusCode") == "0000":
                    return RefundResult(
                        success=True,
                        refund_id=data.get("refundTrxID"),
                        amount=Decimal(data.get("amount", "0")),
                        gateway_response=data
                    )
                else:
                    return RefundResult(
                        success=False,
                        error_message=data.get("statusMessage", "Refund failed"),
                        gateway_response=data
                    )
                    
        except Exception as e:
            return RefundResult(
                success=False,
                error_message=str(e)
            )
