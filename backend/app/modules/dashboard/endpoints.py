"""
Dashboard API endpoints for admin analytics.
"""
from typing import List
from datetime import datetime, timedelta, date
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case

from app.core.deps import get_db
from app.core.permissions import require_permissions
from app.core.schemas.response import SuccessResponse, create_success_response
from app.constants.permissions import PermissionEnum
from app.modules.users.models import User, Customer
from app.modules.orders.models import Order, OrderStatus, PaymentStatus
from app.modules.products.models import Product, ProductVariant
from app.modules.dashboard.schemas import (
    DashboardStats,
    RecentOrderItem,
    LowStockProduct,
    SalesDataPoint,
    OrderStatusCount,
    DashboardResponse
)


router = APIRouter()


@router.get("/stats", response_model=SuccessResponse[DashboardStats])
async def get_dashboard_stats(
    current_user: User = Depends(require_permissions([PermissionEnum.ORDERS_READ])),
    session: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics."""
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    # Total orders count
    total_orders_result = await session.execute(
        select(func.count(Order.id))
    )
    total_orders = total_orders_result.scalar() or 0

    # Total revenue (from paid orders)
    total_revenue_result = await session.execute(
        select(func.coalesce(func.sum(Order.total), 0))
        .where(Order.payment_status == PaymentStatus.PAID)
    )
    total_revenue = total_revenue_result.scalar() or Decimal("0")

    # Total customers
    total_customers_result = await session.execute(
        select(func.count(Customer.id))
    )
    total_customers = total_customers_result.scalar() or 0

    # Total active products
    total_products_result = await session.execute(
        select(func.count(Product.id))
        .where(Product.is_active == True)
    )
    total_products = total_products_result.scalar() or 0

    # Pending orders
    pending_orders_result = await session.execute(
        select(func.count(Order.id))
        .where(Order.status == OrderStatus.PENDING)
    )
    pending_orders = pending_orders_result.scalar() or 0

    # Orders today
    orders_today_result = await session.execute(
        select(func.count(Order.id))
        .where(and_(
            Order.created_at >= today_start,
            Order.created_at <= today_end
        ))
    )
    orders_today = orders_today_result.scalar() or 0

    # Revenue today
    revenue_today_result = await session.execute(
        select(func.coalesce(func.sum(Order.total), 0))
        .where(and_(
            Order.created_at >= today_start,
            Order.created_at <= today_end,
            Order.payment_status == PaymentStatus.PAID
        ))
    )
    revenue_today = revenue_today_result.scalar() or Decimal("0")

    stats = DashboardStats(
        total_orders=total_orders,
        total_revenue=total_revenue,
        total_customers=total_customers,
        total_products=total_products,
        pending_orders=pending_orders,
        orders_today=orders_today,
        revenue_today=revenue_today
    )

    return create_success_response(
        message="Dashboard stats retrieved",
        data=stats
    )


@router.get("/recent-orders", response_model=SuccessResponse[List[RecentOrderItem]])
async def get_recent_orders(
    limit: int = 10,
    current_user: User = Depends(require_permissions([PermissionEnum.ORDERS_READ])),
    session: AsyncSession = Depends(get_db)
):
    """Get recent orders for dashboard."""
    result = await session.execute(
        select(Order)
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    orders = result.scalars().all()

    recent_orders = []
    for order in orders:
        # Get customer name
        if order.is_pos_order:
            customer_name = order.pos_customer_name or "Walk-in Customer"
        else:
            # Get from shipping address or customer
            if order.shipping_address and "full_name" in order.shipping_address:
                customer_name = order.shipping_address["full_name"]
            else:
                customer_name = "Customer"

        recent_orders.append(RecentOrderItem(
            id=str(order.id),
            order_number=order.order_number,
            customer_name=customer_name,
            total=order.total,
            status=order.status,
            payment_status=order.payment_status,
            created_at=order.created_at
        ))

    return create_success_response(
        message="Recent orders retrieved",
        data=recent_orders
    )


@router.get("/low-stock", response_model=SuccessResponse[List[LowStockProduct]])
async def get_low_stock_products(
    threshold: int = 10,
    limit: int = 10,
    current_user: User = Depends(require_permissions([PermissionEnum.PRODUCTS_READ])),
    session: AsyncSession = Depends(get_db)
):
    """Get low stock products for dashboard alerts."""
    result = await session.execute(
        select(ProductVariant, Product.name)
        .join(Product, ProductVariant.product_id == Product.id)
        .where(and_(
            ProductVariant.stock_quantity <= threshold,
            ProductVariant.stock_quantity > 0,
            Product.is_active == True
        ))
        .order_by(ProductVariant.stock_quantity.asc())
        .limit(limit)
    )
    rows = result.all()

    low_stock = []
    for variant, product_name in rows:
        variant_info_parts = []
        if variant.metal_type:
            variant_info_parts.append(variant.metal_type)
        if variant.metal_purity:
            variant_info_parts.append(variant.metal_purity)
        if variant.size:
            variant_info_parts.append(f"Size {variant.size}")

        low_stock.append(LowStockProduct(
            id=str(variant.id),
            name=product_name,
            sku=variant.sku,
            stock_quantity=variant.stock_quantity,
            variant_info=" - ".join(variant_info_parts) if variant_info_parts else None
        ))

    return create_success_response(
        message="Low stock products retrieved",
        data=low_stock
    )


@router.get("/sales-chart", response_model=SuccessResponse[List[SalesDataPoint]])
async def get_sales_chart_data(
    days: int = 7,
    current_user: User = Depends(require_permissions([PermissionEnum.ORDERS_READ])),
    session: AsyncSession = Depends(get_db)
):
    """Get sales data for chart (last N days)."""
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    # Generate all dates in range
    date_range = []
    current_date = start_date
    while current_date <= end_date:
        date_range.append(current_date)
        current_date += timedelta(days=1)

    # Get sales data grouped by date
    result = await session.execute(
        select(
            func.date(Order.created_at).label("order_date"),
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(
                case(
                    (Order.payment_status == PaymentStatus.PAID, Order.total),
                    else_=Decimal("0")
                )
            ), Decimal("0")).label("revenue")
        )
        .where(Order.created_at >= datetime.combine(start_date, datetime.min.time()))
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    rows = result.all()

    # Convert to dict for easy lookup
    sales_by_date = {row.order_date: (row.order_count, row.revenue) for row in rows}

    # Build response with all dates (fill missing with zeros)
    sales_data = []
    for d in date_range:
        if d in sales_by_date:
            orders, revenue = sales_by_date[d]
        else:
            orders, revenue = 0, Decimal("0")

        sales_data.append(SalesDataPoint(
            date=d.strftime("%b %d"),
            orders=orders,
            revenue=revenue
        ))

    return create_success_response(
        message="Sales chart data retrieved",
        data=sales_data
    )


@router.get("/order-status-counts", response_model=SuccessResponse[List[OrderStatusCount]])
async def get_order_status_counts(
    current_user: User = Depends(require_permissions([PermissionEnum.ORDERS_READ])),
    session: AsyncSession = Depends(get_db)
):
    """Get order counts by status."""
    result = await session.execute(
        select(
            Order.status,
            func.count(Order.id).label("count")
        )
        .group_by(Order.status)
    )
    rows = result.all()

    counts = [
        OrderStatusCount(status=row.status.value, count=row.count)
        for row in rows
    ]

    return create_success_response(
        message="Order status counts retrieved",
        data=counts
    )


@router.get("", response_model=SuccessResponse[DashboardResponse])
async def get_full_dashboard(
    current_user: User = Depends(require_permissions([PermissionEnum.ORDERS_READ])),
    session: AsyncSession = Depends(get_db)
):
    """
    Get complete dashboard data in a single request.
    This is optimized to reduce multiple API calls from the frontend.
    """
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    # ========== STATS ==========
    # Using a single query with multiple aggregations where possible
    stats_result = await session.execute(
        select(
            func.count(Order.id).label("total_orders"),
            func.coalesce(func.sum(
                case((Order.payment_status == PaymentStatus.PAID, Order.total), else_=Decimal("0"))
            ), Decimal("0")).label("total_revenue"),
            func.count(case((Order.status == OrderStatus.PENDING, 1))).label("pending_orders"),
            func.count(case((and_(
                Order.created_at >= today_start,
                Order.created_at <= today_end
            ), 1))).label("orders_today"),
            func.coalesce(func.sum(
                case((and_(
                    Order.created_at >= today_start,
                    Order.created_at <= today_end,
                    Order.payment_status == PaymentStatus.PAID
                ), Order.total), else_=Decimal("0"))
            ), Decimal("0")).label("revenue_today")
        )
    )
    stats_row = stats_result.one()

    # Separate queries for customers and products (different tables)
    customers_result = await session.execute(select(func.count(Customer.id)))
    total_customers = customers_result.scalar() or 0

    products_result = await session.execute(
        select(func.count(Product.id)).where(Product.is_active == True)
    )
    total_products = products_result.scalar() or 0

    stats = DashboardStats(
        total_orders=stats_row.total_orders,
        total_revenue=stats_row.total_revenue,
        total_customers=total_customers,
        total_products=total_products,
        pending_orders=stats_row.pending_orders,
        orders_today=stats_row.orders_today,
        revenue_today=stats_row.revenue_today
    )

    # ========== RECENT ORDERS ==========
    orders_result = await session.execute(
        select(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    orders = orders_result.scalars().all()

    recent_orders = []
    for order in orders:
        if order.is_pos_order:
            customer_name = order.pos_customer_name or "Walk-in Customer"
        elif order.shipping_address and "full_name" in order.shipping_address:
            customer_name = order.shipping_address["full_name"]
        else:
            customer_name = "Customer"

        recent_orders.append(RecentOrderItem(
            id=str(order.id),
            order_number=order.order_number,
            customer_name=customer_name,
            total=order.total,
            status=order.status,
            payment_status=order.payment_status,
            created_at=order.created_at
        ))

    # ========== LOW STOCK ==========
    low_stock_result = await session.execute(
        select(ProductVariant, Product.name)
        .join(Product, ProductVariant.product_id == Product.id)
        .where(and_(
            ProductVariant.stock_quantity <= 10,
            ProductVariant.stock_quantity > 0,
            Product.is_active == True
        ))
        .order_by(ProductVariant.stock_quantity.asc())
        .limit(5)
    )
    low_stock_rows = low_stock_result.all()

    low_stock_products = []
    for variant, product_name in low_stock_rows:
        variant_info_parts = []
        if variant.metal_type:
            variant_info_parts.append(variant.metal_type)
        if variant.metal_purity:
            variant_info_parts.append(variant.metal_purity)
        if variant.size:
            variant_info_parts.append(f"Size {variant.size}")

        low_stock_products.append(LowStockProduct(
            id=str(variant.id),
            name=product_name,
            sku=variant.sku,
            stock_quantity=variant.stock_quantity,
            variant_info=" - ".join(variant_info_parts) if variant_info_parts else None
        ))

    # ========== SALES CHART (7 days) ==========
    end_date = today
    start_date = end_date - timedelta(days=6)

    sales_result = await session.execute(
        select(
            func.date(Order.created_at).label("order_date"),
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(
                case(
                    (Order.payment_status == PaymentStatus.PAID, Order.total),
                    else_=Decimal("0")
                )
            ), Decimal("0")).label("revenue")
        )
        .where(Order.created_at >= datetime.combine(start_date, datetime.min.time()))
        .group_by(func.date(Order.created_at))
    )
    sales_rows = sales_result.all()
    sales_by_date = {row.order_date: (row.order_count, row.revenue) for row in sales_rows}

    sales_chart = []
    current_date = start_date
    while current_date <= end_date:
        if current_date in sales_by_date:
            orders_count, revenue = sales_by_date[current_date]
        else:
            orders_count, revenue = 0, Decimal("0")

        sales_chart.append(SalesDataPoint(
            date=current_date.strftime("%b %d"),
            orders=orders_count,
            revenue=revenue
        ))
        current_date += timedelta(days=1)

    # ========== ORDER STATUS COUNTS ==========
    status_result = await session.execute(
        select(Order.status, func.count(Order.id).label("count"))
        .group_by(Order.status)
    )
    status_rows = status_result.all()
    order_status_counts = [
        OrderStatusCount(status=row.status.value, count=row.count)
        for row in status_rows
    ]

    response = DashboardResponse(
        stats=stats,
        recent_orders=recent_orders,
        low_stock_products=low_stock_products,
        sales_chart=sales_chart,
        order_status_counts=order_status_counts
    )

    return create_success_response(
        message="Dashboard data retrieved",
        data=response
    )
