"""
SSL Commerz Payment Gateway implementation.
"""
from typing import Optional, Dict, Any
from uuid import UUID
from decimal import Decimal
import httpx
from urllib.parse import urlencode

from app.modules.payments.gateways.base import (
    PaymentGatewayBase,
    PaymentInitResult,
    PaymentVerifyResult,
    RefundResult,
    PaymentStatus
)


class SSLCommerzGateway(PaymentGatewayBase):
    """
    SSL Commerz payment gateway implementation.
    
    Documentation: https://developer.sslcommerz.com/
    
    Required config:
    - store_id
    - store_password
    """
    
    SANDBOX_URL = "https://sandbox.sslcommerz.com"
    PRODUCTION_URL = "https://securepay.sslcommerz.com"
    
    @property
    def gateway_code(self) -> str:
        return "sslcommerz"
    
    @property
    def gateway_name(self) -> str:
        return "SSL Commerz"
    
    def get_base_url(self) -> str:
        return self.SANDBOX_URL if self.is_sandbox else self.PRODUCTION_URL
    
    def validate_config(self) -> bool:
        required = ["store_id", "store_password"]
        return all(key in self.config for key in required)
    
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
        Initialize SSL Commerz payment session.
        
        Returns redirect URL to SSL Commerz checkout page.
        """
        if not self.validate_config():
            return PaymentInitResult(
                success=False,
                error_message="SSL Commerz gateway not configured properly"
            )
        
        url = f"{self.get_base_url()}/gwprocess/v4/api.php"
        
        # Prepare payment data
        payment_data = {
            "store_id": self.config.get("store_id"),
            "store_passwd": self.config.get("store_password"),
            "total_amount": str(amount),
            "currency": currency,
            "tran_id": str(order_id),
            "success_url": success_url,
            "fail_url": fail_url,
            "cancel_url": cancel_url,
            "cus_name": customer_name,
            "cus_email": customer_email,
            "cus_phone": customer_phone,
            "cus_add1": "N/A",
            "cus_city": "Dhaka",
            "cus_country": "Bangladesh",
            "shipping_method": "NO",
            "product_name": description,
            "product_category": "Jewelry",
            "product_profile": "physical-goods"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, data=payment_data, timeout=30)
                data = response.json()
                
                if data.get("status") == "SUCCESS":
                    return PaymentInitResult(
                        success=True,
                        transaction_id=data.get("sessionkey"),
                        redirect_url=data.get("GatewayPageURL"),
                        gateway_response=data
                    )
                else:
                    return PaymentInitResult(
                        success=False,
                        error_message=data.get("failedreason", "Payment initialization failed"),
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
        """Verify payment using validation API."""
        url = f"{self.get_base_url()}/validator/api/validationserverAPI.php"
        
        params = {
            "val_id": gateway_data.get("val_id"),
            "store_id": self.config.get("store_id"),
            "store_passwd": self.config.get("store_password"),
            "format": "json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30)
                data = response.json()
                
                if data.get("status") == "VALID" or data.get("status") == "VALIDATED":
                    return PaymentVerifyResult(
                        success=True,
                        transaction_id=data.get("tran_id"),
                        amount=Decimal(data.get("amount", "0")),
                        status=PaymentStatus.SUCCESS,
                        gateway_response=data
                    )
                else:
                    return PaymentVerifyResult(
                        success=False,
                        transaction_id=data.get("tran_id"),
                        status=PaymentStatus.FAILED,
                        error_message=data.get("error", "Validation failed"),
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
        """Process SSL Commerz IPN callback."""
        status = callback_data.get("status")
        tran_id = callback_data.get("tran_id")
        val_id = callback_data.get("val_id")
        
        if status == "VALID":
            # Verify with validation API
            return await self.verify_payment(tran_id, callback_data)
        elif status == "FAILED":
            return PaymentVerifyResult(
                success=False,
                transaction_id=tran_id,
                status=PaymentStatus.FAILED,
                error_message=callback_data.get("error", "Payment failed"),
                gateway_response=callback_data
            )
        elif status == "CANCELLED":
            return PaymentVerifyResult(
                success=False,
                transaction_id=tran_id,
                status=PaymentStatus.CANCELLED,
                error_message="Payment cancelled by user",
                gateway_response=callback_data
            )
        else:
            return PaymentVerifyResult(
                success=False,
                transaction_id=tran_id,
                status=PaymentStatus.PENDING,
                gateway_response=callback_data
            )
    
    async def refund(
        self,
        transaction_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None
    ) -> RefundResult:
        """Issue refund via SSL Commerz API."""
        url = f"{self.get_base_url()}/validator/api/merchantTransIDvalidationAPI.php"
        
        params = {
            "tran_id": transaction_id,
            "store_id": self.config.get("store_id"),
            "store_passwd": self.config.get("store_password"),
            "format": "json"
        }
        
        try:
            # First get transaction details
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30)
                data = response.json()
                
                if data.get("status") != "VALID":
                    return RefundResult(
                        success=False,
                        error_message="Transaction not found or invalid",
                        gateway_response=data
                    )
                
                # Initiate refund
                refund_url = f"{self.get_base_url()}/validator/api/merchantTransIDvalidationAPI.php"
                refund_params = {
                    "refund_amount": str(amount) if amount else data.get("amount"),
                    "refund_remarks": reason or "Customer refund",
                    "bank_tran_id": data.get("bank_tran_id"),
                    "store_id": self.config.get("store_id"),
                    "store_passwd": self.config.get("store_password"),
                    "format": "json"
                }
                
                refund_response = await client.get(
                    f"{self.get_base_url()}/validator/api/merchantTransIDvalidationAPI.php",
                    params=refund_params,
                    timeout=30
                )
                refund_data = refund_response.json()
                
                if refund_data.get("status") == "success":
                    return RefundResult(
                        success=True,
                        refund_id=refund_data.get("refund_ref_id"),
                        amount=Decimal(refund_params["refund_amount"]),
                        gateway_response=refund_data
                    )
                else:
                    return RefundResult(
                        success=False,
                        error_message=refund_data.get("errorReason", "Refund failed"),
                        gateway_response=refund_data
                    )
                    
        except Exception as e:
            return RefundResult(
                success=False,
                error_message=str(e)
            )
