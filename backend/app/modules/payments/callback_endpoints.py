"""
Payment callback endpoints for gateway webhooks.
"""
from typing import Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.schemas.response import SuccessResponse, create_success_response
from app.modules.payments.models import PaymentGateway
from app.modules.payments.repository import PaymentGatewayRepository, PaymentTransactionRepository
from app.modules.payments.gateways import BKashGateway, SSLCommerzGateway
from app.modules.orders.models import Order, OrderStatus, PaymentStatus
from app.modules.orders.repository import OrderRepository
from app.modules.audit.service import AuditService


router = APIRouter()


async def get_gateway_instance(code: str, session: AsyncSession):
    """Get configured gateway instance."""
    repo = PaymentGatewayRepository(session)
    gateway = await repo.get_by_code(code)
    
    if not gateway or not gateway.is_enabled:
        return None
    
    if code == "bkash":
        return BKashGateway(gateway.config or {}, gateway.is_sandbox)
    elif code == "sslcommerz":
        return SSLCommerzGateway(gateway.config or {}, gateway.is_sandbox)
    
    return None


@router.post("/bkash/callback")
async def bkash_callback(
    request: Request,
    session: AsyncSession = Depends(get_db)
):
    """Handle bKash payment callback."""
    # Get callback data from query params
    callback_data = dict(request.query_params)
    
    gateway = await get_gateway_instance("bkash", session)
    if not gateway:
        return {"status": "error", "message": "Gateway not configured"}
    
    result = await gateway.process_callback(callback_data)
    
    if result.success:
        # Update order status
        order_repo = OrderRepository(session)
        order_number = callback_data.get("merchantInvoiceNumber")
        if order_number:
            order = await order_repo.get_by_order_number(order_number)
            if order:
                order.payment_status = PaymentStatus.PAID
                order.payment_transaction_id = result.transaction_id
                order.status = OrderStatus.CONFIRMED
                await order_repo.update(order)
                
                # Record transaction
                trans_repo = PaymentTransactionRepository(session)
                from app.modules.payments.models import PaymentTransaction
                from datetime import datetime
                
                transaction = PaymentTransaction(
                    order_id=order.id,
                    gateway_code="bkash",
                    transaction_id=result.transaction_id,
                    amount=result.amount,
                    status="SUCCESS",
                    gateway_response=result.gateway_response,
                    completed_at=datetime.utcnow()
                )
                await trans_repo.create(transaction)
    
    return {
        "status": "success" if result.success else "error",
        "transaction_id": result.transaction_id,
        "message": result.error_message
    }


@router.post("/sslcommerz/success")
async def sslcommerz_success(
    request: Request,
    session: AsyncSession = Depends(get_db)
):
    """Handle SSL Commerz success callback."""
    form_data = await request.form()
    callback_data = dict(form_data)
    
    gateway = await get_gateway_instance("sslcommerz", session)
    if not gateway:
        return {"status": "error", "message": "Gateway not configured"}
    
    result = await gateway.process_callback(callback_data)
    
    if result.success:
        # Update order
        order_repo = OrderRepository(session)
        tran_id = callback_data.get("tran_id")
        if tran_id:
            try:
                order = await order_repo.get_by_id(UUID(tran_id))
                if order:
                    order.payment_status = PaymentStatus.PAID
                    order.payment_transaction_id = result.transaction_id
                    order.status = OrderStatus.CONFIRMED
                    await order_repo.update(order)
                    
                    # Record transaction
                    trans_repo = PaymentTransactionRepository(session)
                    from app.modules.payments.models import PaymentTransaction
                    from datetime import datetime
                    
                    transaction = PaymentTransaction(
                        order_id=order.id,
                        gateway_code="sslcommerz",
                        transaction_id=result.transaction_id,
                        amount=result.amount,
                        status="SUCCESS",
                        gateway_response=result.gateway_response,
                        completed_at=datetime.utcnow()
                    )
                    await trans_repo.create(transaction)
            except ValueError:
                pass  # Invalid UUID
    
    # Redirect to frontend
    return {"status": "success", "redirect": f"/orders/{callback_data.get('tran_id')}/success"}


@router.post("/sslcommerz/fail")
async def sslcommerz_fail(
    request: Request,
    session: AsyncSession = Depends(get_db)
):
    """Handle SSL Commerz failure callback."""
    form_data = await request.form()
    callback_data = dict(form_data)
    
    tran_id = callback_data.get("tran_id")
    
    return {"status": "failed", "redirect": f"/orders/{tran_id}/failed"}


@router.post("/sslcommerz/cancel")
async def sslcommerz_cancel(
    request: Request,
    session: AsyncSession = Depends(get_db)
):
    """Handle SSL Commerz cancel callback."""
    form_data = await request.form()
    callback_data = dict(form_data)
    
    tran_id = callback_data.get("tran_id")
    
    return {"status": "cancelled", "redirect": f"/orders/{tran_id}/cancelled"}


@router.post("/sslcommerz/ipn")
async def sslcommerz_ipn(
    request: Request,
    session: AsyncSession = Depends(get_db)
):
    """Handle SSL Commerz IPN (Instant Payment Notification)."""
    form_data = await request.form()
    callback_data = dict(form_data)
    
    gateway = await get_gateway_instance("sslcommerz", session)
    if not gateway:
        return {"status": "error"}
    
    result = await gateway.process_callback(callback_data)
    
    if result.success:
        order_repo = OrderRepository(session)
        tran_id = callback_data.get("tran_id")
        if tran_id:
            try:
                order = await order_repo.get_by_id(UUID(tran_id))
                if order and order.payment_status != PaymentStatus.PAID:
                    order.payment_status = PaymentStatus.PAID
                    order.payment_transaction_id = result.transaction_id
                    order.status = OrderStatus.CONFIRMED
                    await order_repo.update(order)
            except ValueError:
                pass
    
    return {"status": "success"}
