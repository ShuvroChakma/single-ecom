"""
Redis cache operations for cart data.
Uses the existing app/core/cache.py utilities.
"""
import json
from typing import Optional
from uuid import UUID
from decimal import Decimal

from app.core.cache import get_redis_client


# Cart TTL: 7 days
CART_TTL = 60 * 60 * 24 * 7


def cart_key(customer_id: str) -> str:
    """Generate Redis key for customer cart."""
    return f"cart:{customer_id}"


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that handles Decimal types."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        if isinstance(obj, UUID):
            return str(obj)
        return super().default(obj)


def decimal_decoder(dct: dict) -> dict:
    """Decode decimal strings back to Decimal objects."""
    decimal_fields = ["price_snapshot", "rate_snapshot"]
    for field in decimal_fields:
        if field in dct and dct[field] is not None:
            dct[field] = Decimal(str(dct[field]))
    return dct


async def get_cart_from_cache(customer_id: str) -> Optional[dict]:
    """
    Get cart data from Redis.
    
    Returns:
        Cart data dict or None if not cached
    """
    client = get_redis_client()
    data = await client.get(cart_key(customer_id))
    if data:
        return json.loads(data, object_hook=decimal_decoder)
    return None


async def set_cart_in_cache(customer_id: str, cart_data: dict) -> None:
    """
    Save cart data to Redis with TTL.
    
    Args:
        customer_id: Customer UUID as string
        cart_data: Cart data to cache
    """
    client = get_redis_client()
    await client.set(
        cart_key(customer_id),
        json.dumps(cart_data, cls=DecimalEncoder),
        ex=CART_TTL
    )


async def delete_cart_from_cache(customer_id: str) -> None:
    """
    Remove cart from Redis cache.
    
    Args:
        customer_id: Customer UUID as string
    """
    client = get_redis_client()
    await client.delete(cart_key(customer_id))


async def invalidate_cart_cache(customer_id: str) -> None:
    """
    Invalidate cart cache (alias for delete).
    Used when cart is modified.
    
    Args:
        customer_id: Customer UUID as string
    """
    await delete_cart_from_cache(customer_id)
