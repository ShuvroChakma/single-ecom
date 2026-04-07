"""
Pydantic schemas for Dashboard analytics.
"""
from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel
from datetime import datetime, date

from app.modules.orders.models import OrderStatus, PaymentStatus


class DashboardStats(BaseModel):
    """Overall dashboard statistics."""
    total_orders: int
    total_revenue: Decimal
    total_customers: int
    total_products: int
    pending_orders: int
    orders_today: int
    revenue_today: Decimal


class RecentOrderItem(BaseModel):
    """Recent order for dashboard."""
    id: str
    order_number: str
    customer_name: str
    total: Decimal
    status: OrderStatus
    payment_status: PaymentStatus
    created_at: datetime


class LowStockProduct(BaseModel):
    """Low stock product alert."""
    id: str
    name: str
    sku: str
    stock_quantity: int
    variant_info: Optional[str] = None


class SalesDataPoint(BaseModel):
    """Sales data point for chart."""
    date: str
    orders: int
    revenue: Decimal


class OrderStatusCount(BaseModel):
    """Order count by status."""
    status: str
    count: int


class DashboardResponse(BaseModel):
    """Complete dashboard data response."""
    stats: DashboardStats
    recent_orders: List[RecentOrderItem]
    low_stock_products: List[LowStockProduct]
    sales_chart: List[SalesDataPoint]
    order_status_counts: List[OrderStatusCount]
