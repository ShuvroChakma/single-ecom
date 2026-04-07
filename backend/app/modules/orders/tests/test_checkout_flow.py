"""
End-to-end flow tests for the customer purchase journey:

  Flow A — COD
    1. Customer adds a product variant to cart
    2. Customer views cart  (item & price verified)
    3. Customer places a COD order
    4. Order is auto-confirmed; cart is cleared

  Flow B — Online payment with promo code
    1. Customer adds product to cart
    2. Customer applies a promo code
    3. Customer places an online-payment order
    4. Order is PENDING, payment URL returned, discount reflected in total

  Flow C — Edge cases
    - Out-of-stock variant is rejected at add-to-cart
    - Inactive product is rejected at add-to-cart
    - Empty cart is rejected at checkout
"""
from types import SimpleNamespace
from uuid import uuid4
from decimal import Decimal
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.modules.cart.service import CartService
from app.modules.orders.service import OrderService
from app.modules.orders.schemas import CreateOrderRequest
from app.modules.orders.models import OrderStatus
from app.modules.products.models import MetalType
from app.modules.cart.schemas import (
    CartResponse, CartItemResponse, CartItemProductInfo, CartItemVariantInfo,
)
from app.modules.addresses.schemas import AddressResponse
from app.modules.promo_codes.schemas import PromoValidationResult
from app.modules.promo_codes.models import DiscountType
from app.modules.rates.schemas import PriceBreakdown
from app.core.exceptions import ValidationError


# ── Domain objects ────────────────────────────────────────────────────────────

_NOW = datetime(2026, 1, 15, 12, 0, 0)

PRODUCT_PRICE = Decimal("15000")
DELIVERY_CHARGE = Decimal("60")


def _make_product(product_id=None):
    return SimpleNamespace(
        id=product_id or uuid4(),
        name="Gold Ring",
        slug="gold-ring",
        images=["ring.jpg"],
        is_active=True,
    )


def _make_variant(product_id, variant_id=None, stock: int = 10, active: bool = True):
    return SimpleNamespace(
        id=variant_id or uuid4(),
        product_id=product_id,
        sku="GR-22K-YEL-7",
        metal_type=MetalType.GOLD,
        metal_purity="22K",
        metal_color="Yellow",
        size="7",
        gross_weight=Decimal("5.5"),
        net_weight=Decimal("5.0"),
        is_active=active,
        stock_quantity=stock,
        is_default=True,
    )


def _make_price_breakdown(total: Decimal = PRODUCT_PRICE) -> PriceBreakdown:
    return PriceBreakdown(
        rate_per_gram=Decimal("5000"),
        metal_cost=Decimal("25000"),
        making_charge_type="FIXED_PER_GRAM",
        making_charge_value=Decimal("2000"),
        making_charge=Decimal("10000"),
        subtotal=total,
        tax_type="PERCENTAGE",
        tax_rate=Decimal("0"),
        tax_amount=Decimal("0"),
        total_price=total,
    )


def _make_cart_item_obj(product, variant, quantity: int = 1):
    """SimpleNamespace cart item (mimics CartItem ORM row)."""
    return SimpleNamespace(
        id=uuid4(),
        product_id=product.id,
        variant_id=variant.id,
        cart_id=uuid4(),
        quantity=quantity,
        price_snapshot=PRODUCT_PRICE,
        rate_snapshot=Decimal("5000"),
        created_at=_NOW,
    )


def _make_address() -> AddressResponse:
    return AddressResponse(
        id=uuid4(),
        label="Home",
        full_name="Rahim Uddin",
        phone="01712345678",
        address_line1="12 Dhanmondi Road",
        address_line2=None,
        city="Dhaka",
        district="Dhaka",
        postal_code=None,
        country="Bangladesh",
        is_default=True,
        created_at=_NOW,
        updated_at=_NOW,
    )


# ── Cart service factory ──────────────────────────────────────────────────────

def _make_cart_service(product, variant, cart_item) -> CartService:
    """
    CartService with all repos mocked for the happy-path:
    add one item, then get_cart returns that item.
    """
    session = MagicMock()
    svc = CartService(session)

    cart_id = uuid4()
    cart_mock = SimpleNamespace(id=cart_id, items=[])
    cart_with_items = SimpleNamespace(id=cart_id, items=[cart_item])

    svc.variant_repo = AsyncMock()
    svc.variant_repo.get = AsyncMock(return_value=variant)

    svc.product_repo = AsyncMock()
    svc.product_repo.get_with_variants = AsyncMock(return_value=product)

    svc.price_service = AsyncMock()
    svc.price_service.calculate_variant_price = AsyncMock(
        return_value=_make_price_breakdown()
    )

    svc.cart_repo = AsyncMock()
    svc.cart_repo.get_or_create = AsyncMock(return_value=cart_mock)
    # First call (in add_to_cart rebuilds totals) and subsequent get_cart calls
    svc.cart_repo.get_by_customer_id = AsyncMock(return_value=cart_with_items)
    svc.cart_repo.update_timestamp = AsyncMock()

    svc.item_repo = AsyncMock()
    svc.item_repo.get_by_variant = AsyncMock(return_value=None)   # first add
    svc.item_repo.create = AsyncMock(return_value=cart_item)
    svc.item_repo.update = AsyncMock()

    return svc


def _make_order_service() -> OrderService:
    session = MagicMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.execute = AsyncMock()
    session.expire_all = MagicMock()
    session.get = AsyncMock(return_value=None)
    svc = OrderService(session)
    svc.repo = AsyncMock()
    svc.repo.generate_order_number = AsyncMock(return_value="ORD-20260115-0001")
    return svc


def _make_order_cart_service(cart: CartResponse) -> AsyncMock:
    """Light CartService mock used inside create_order."""
    cs = AsyncMock()
    cs.get_cart = AsyncMock(return_value=cart)
    cs.cart_repo = AsyncMock()
    cs.cart_repo.get_by_customer_id = AsyncMock(return_value=MagicMock(id=uuid4()))
    return cs


def _make_address_service(address: AddressResponse) -> AsyncMock:
    svc = AsyncMock()
    svc.get_address = AsyncMock(return_value=address)
    return svc


def _make_delivery_service(charge: Decimal = DELIVERY_CHARGE) -> AsyncMock:
    result = MagicMock()
    result.total_charge = charge
    svc = AsyncMock()
    svc.calculate_charge = AsyncMock(return_value=result)
    return svc


def _make_promo_service(
    valid: bool = True,
    discount: Decimal = Decimal("0"),
    free_shipping: bool = False,
) -> AsyncMock:
    promo_obj = MagicMock()
    promo_obj.id = uuid4()
    result = PromoValidationResult(
        valid=valid,
        code="PROMO10",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("10"),
        discount_amount=discount if valid else None,
        message="Valid" if valid else "Invalid",
        new_total=None,
        free_shipping=free_shipping,
    )
    svc = AsyncMock()
    svc.validate_promo = AsyncMock(return_value=result)
    svc.repo = AsyncMock()
    svc.repo.get_by_code = AsyncMock(return_value=promo_obj)
    return svc


def _make_payment_service(enabled: bool = True) -> AsyncMock:
    gw = MagicMock()
    gw.is_enabled = enabled
    svc = AsyncMock()
    svc.get_gateway_by_code = AsyncMock(return_value=gw)
    return svc


# ── Flow A: COD happy path ────────────────────────────────────────────────────

class TestCODCheckoutFlow:
    """Full flow: add product → view cart → COD checkout → order confirmed."""

    async def test_add_to_cart_returns_item_details(self):
        """Stage 1: add_to_cart returns correct item and count."""
        product = _make_product()
        variant = _make_variant(product.id)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()

        with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
            result = await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)

        assert result.item_count == 1
        assert result.item.product.name == "Gold Ring"
        assert result.item.current_price == PRODUCT_PRICE
        assert result.item.quantity == 1
        assert result.cart_total == PRODUCT_PRICE

    async def test_cart_contains_item_after_add(self):
        """Stage 2: get_cart reflects the added item."""
        product = _make_product()
        variant = _make_variant(product.id)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()

        with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
            await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)

        cart = await cart_svc.get_cart(customer_id)

        assert len(cart.items) == 1
        assert cart.items[0].product.name == "Gold Ring"
        assert cart.items[0].current_price == PRODUCT_PRICE
        assert cart.subtotal == PRODUCT_PRICE

    async def test_cod_order_confirmed_with_correct_total(self):
        """Stage 3+4: COD order created, confirmed, correct total."""
        product = _make_product()
        variant = _make_variant(product.id)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()
        address = _make_address()

        # Build cart state
        with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
            await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)
        cart = await cart_svc.get_cart(customer_id)

        # Checkout
        order_svc = _make_order_service()
        request = CreateOrderRequest(address_id=address.id, payment_method="cod")

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            order = await order_svc.create_order(
                customer_id=customer_id,
                request=request,
                cart_service=_make_order_cart_service(cart),
                address_service=_make_address_service(address),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )

        assert order.order_number == "ORD-20260115-0001"
        assert order.requires_payment is False
        assert order.payment_url is None
        assert order.total == PRODUCT_PRICE + DELIVERY_CHARGE

    async def test_cod_order_status_is_confirmed(self):
        """COD order is auto-confirmed (not PENDING)."""
        product = _make_product()
        variant = _make_variant(product.id)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()
        address = _make_address()

        with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
            await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)
        cart = await cart_svc.get_cart(customer_id)

        order_svc = _make_order_service()
        confirmed_order = None

        def capture(obj):
            from app.modules.orders.models import Order
            nonlocal confirmed_order
            if isinstance(obj, Order):
                confirmed_order = obj

        order_svc.session.add = capture

        request = CreateOrderRequest(address_id=address.id, payment_method="cod")

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            await order_svc.create_order(
                customer_id=customer_id,
                request=request,
                cart_service=_make_order_cart_service(cart),
                address_service=_make_address_service(address),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )

        assert confirmed_order is not None
        assert confirmed_order.status == OrderStatus.CONFIRMED

    async def test_cart_cleared_after_cod_order(self):
        """Cart DELETE is executed after order is created."""
        product = _make_product()
        variant = _make_variant(product.id)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()
        address = _make_address()

        with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
            await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)
        cart = await cart_svc.get_cart(customer_id)

        order_svc = _make_order_service()
        mock_invalidate = AsyncMock()

        request = CreateOrderRequest(address_id=address.id, payment_method="cod")

        with patch("app.modules.orders.service.invalidate_cart_cache", new=mock_invalidate):
            await order_svc.create_order(
                customer_id=customer_id,
                request=request,
                cart_service=_make_order_cart_service(cart),
                address_service=_make_address_service(address),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )

        # session.execute was called (for the bulk DELETE CartItem)
        order_svc.session.execute.assert_called()
        # Cache invalidated
        mock_invalidate.assert_called_once_with(str(customer_id))


# ── Flow B: Online payment with promo code ────────────────────────────────────

class TestOnlinePaymentWithPromoFlow:
    """Flow: add product → apply promo → online payment order → PENDING + URL."""

    async def test_promo_discount_reflected_in_order_total(self):
        """10% promo on ৳15 000 → discount ৳1 500, total = 15 000 - 1 500 + delivery."""
        product = _make_product()
        variant = _make_variant(product.id)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()
        address = _make_address()

        with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
            await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)
        cart = await cart_svc.get_cart(customer_id)

        discount = Decimal("1500")
        order_svc = _make_order_service()
        request = CreateOrderRequest(
            address_id=address.id,
            payment_method="bkash",
            promo_code="PROMO10",
        )

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            order = await order_svc.create_order(
                customer_id=customer_id,
                request=request,
                cart_service=_make_order_cart_service(cart),
                address_service=_make_address_service(address),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(valid=True, discount=discount),
                payment_service=_make_payment_service(),
            )

        expected_total = PRODUCT_PRICE - discount + DELIVERY_CHARGE
        assert order.total == expected_total

    async def test_online_payment_order_is_pending_with_payment_url(self):
        """Online order stays PENDING and provides a payment URL."""
        product = _make_product()
        variant = _make_variant(product.id)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()
        address = _make_address()

        with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
            await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)
        cart = await cart_svc.get_cart(customer_id)

        order_svc = _make_order_service()
        request = CreateOrderRequest(address_id=address.id, payment_method="bkash")

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            order = await order_svc.create_order(
                customer_id=customer_id,
                request=request,
                cart_service=_make_order_cart_service(cart),
                address_service=_make_address_service(address),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )

        assert order.requires_payment is True
        assert order.payment_url is not None
        assert "bkash" in order.payment_url

    async def test_free_shipping_promo_removes_delivery_charge(self):
        """FREE_SHIPPING promo: total = subtotal only (no delivery charge)."""
        product = _make_product()
        variant = _make_variant(product.id)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()
        address = _make_address()

        with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
            await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)
        cart = await cart_svc.get_cart(customer_id)

        order_svc = _make_order_service()
        request = CreateOrderRequest(
            address_id=address.id,
            payment_method="cod",
            promo_code="FREESHIP",
        )

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            order = await order_svc.create_order(
                customer_id=customer_id,
                request=request,
                cart_service=_make_order_cart_service(cart),
                address_service=_make_address_service(address),
                delivery_service=_make_delivery_service(charge=Decimal("80")),
                promo_service=_make_promo_service(valid=True, free_shipping=True),
                payment_service=_make_payment_service(),
            )

        # Delivery zeroed by free shipping
        assert order.total == PRODUCT_PRICE


# ── Flow C: Edge cases ────────────────────────────────────────────────────────

class TestCartEdgeCases:
    """Cart-level rejections before checkout ever happens."""

    async def test_out_of_stock_variant_rejected(self):
        """Variant with stock_quantity=0 raises ValidationError at add-to-cart."""
        product = _make_product()
        variant = _make_variant(product.id, stock=0)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()

        with pytest.raises(ValidationError) as exc_info:
            with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
                await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)

        assert exc_info.value.field == "quantity"

    async def test_inactive_product_rejected(self):
        """Inactive product raises ValidationError at add-to-cart."""
        product = _make_product()
        product.is_active = False
        variant = _make_variant(product.id, active=True)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()

        with pytest.raises(ValidationError) as exc_info:
            with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
                await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)

        assert exc_info.value.field == "variant_id"

    async def test_inactive_variant_rejected(self):
        """Inactive variant raises ValidationError at add-to-cart."""
        product = _make_product()
        variant = _make_variant(product.id, active=False, stock=10)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()

        with pytest.raises(ValidationError) as exc_info:
            with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
                await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)

        assert exc_info.value.field == "variant_id"

    async def test_quantity_exceeding_stock_rejected(self):
        """Requesting more than available stock raises ValidationError."""
        product = _make_product()
        variant = _make_variant(product.id, stock=3)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()

        with pytest.raises(ValidationError) as exc_info:
            with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
                await cart_svc.add_to_cart(customer_id, variant.id, quantity=5)

        assert exc_info.value.field == "quantity"

    async def test_empty_cart_blocked_at_checkout(self):
        """Attempting checkout with empty cart raises ValidationError."""
        empty_cart = CartResponse(
            items=[], item_count=0, unique_items=0,
            subtotal=Decimal("0"), tax_amount=Decimal("0"), total=Decimal("0"),
        )
        order_svc = _make_order_service()
        address = _make_address()

        with pytest.raises(ValidationError) as exc_info:
            await order_svc.create_order(
                customer_id=uuid4(),
                request=CreateOrderRequest(address_id=address.id, payment_method="cod"),
                cart_service=_make_order_cart_service(empty_cart),
                address_service=_make_address_service(address),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )

        assert exc_info.value.field == "cart"

    async def test_disabled_payment_method_blocked_at_checkout(self):
        """Disabled payment gateway raises ValidationError at checkout."""
        product = _make_product()
        variant = _make_variant(product.id)
        cart_item = _make_cart_item_obj(product, variant)
        cart_svc = _make_cart_service(product, variant, cart_item)
        customer_id = uuid4()
        address = _make_address()

        with patch("app.modules.cart.service.invalidate_cart_cache", new=AsyncMock()):
            await cart_svc.add_to_cart(customer_id, variant.id, quantity=1)
        cart = await cart_svc.get_cart(customer_id)

        order_svc = _make_order_service()

        with pytest.raises(ValidationError) as exc_info:
            await order_svc.create_order(
                customer_id=customer_id,
                request=CreateOrderRequest(address_id=address.id, payment_method="nagad"),
                cart_service=_make_order_cart_service(cart),
                address_service=_make_address_service(address),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(enabled=False),
            )

        assert exc_info.value.field == "payment_method"
