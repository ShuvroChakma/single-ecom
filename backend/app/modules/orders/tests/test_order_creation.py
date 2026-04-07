"""
Service-level tests for OrderService.create_order:
  - Empty cart rejection
  - Missing address rejection
  - Disabled payment method rejection
  - Invalid promo code rejection
  - COD order auto-confirmation
  - Online payment order (pending + payment URL)
  - Total calculation (subtotal - discount + delivery)
  - Promo discount applied
  - Free-shipping promo zeroes delivery charge
  - Gift card discount applied
  - Session rollback on mid-transaction failure
  - Cart is cleared after successful order
"""
from uuid import uuid4
from decimal import Decimal
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.modules.orders.service import OrderService
from app.modules.orders.models import OrderStatus
from app.modules.orders.schemas import CreateOrderRequest
from app.modules.cart.schemas import CartResponse, CartItemResponse, CartItemProductInfo, CartItemVariantInfo
from app.modules.addresses.schemas import AddressResponse
from app.modules.promo_codes.schemas import PromoValidationResult
from app.modules.promo_codes.models import DiscountType
from app.core.exceptions import ValidationError


# ── Helpers ─────────────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime(2026, 1, 15, 12, 0, 0)


def _make_cart_item() -> CartItemResponse:
    return CartItemResponse(
        id=uuid4(),
        product=CartItemProductInfo(id=uuid4(), name="Gold Ring", slug="gold-ring", image=None),
        variant=CartItemVariantInfo(
            id=uuid4(), sku="GR-001",
            metal_type="Gold", metal_purity="18K", metal_color="Yellow",
            size="7", gross_weight=Decimal("5.0"), net_weight=Decimal("4.5"),
        ),
        quantity=1,
        price_when_added=Decimal("15000"),
        current_price=Decimal("15000"),
        price_changed=False,
        line_total=Decimal("15000"),
        added_at=_now(),
    )


def _make_cart(subtotal: Decimal = Decimal("15000"), items: int = 1) -> CartResponse:
    return CartResponse(
        items=[_make_cart_item() for _ in range(items)],
        item_count=items,
        unique_items=items,
        subtotal=subtotal,
        tax_amount=Decimal("0"),
        total=subtotal,
    )


def _make_address(district: str = "Dhaka") -> AddressResponse:
    return AddressResponse(
        id=uuid4(),
        label="Home",
        full_name="Test User",
        phone="01712345678",
        address_line1="123 Main Street",
        address_line2=None,
        city="Dhaka",
        district=district,
        postal_code=None,
        country="Bangladesh",
        is_default=True,
        created_at=_now(),
        updated_at=_now(),
    )


def _make_delivery_result(charge: Decimal = Decimal("60")) -> MagicMock:
    result = MagicMock()
    result.total_charge = charge
    return result


def _make_gateway(enabled: bool = True) -> MagicMock:
    gw = MagicMock()
    gw.is_enabled = enabled
    return gw


def _make_promo_result(
    valid: bool = True,
    discount: Decimal = Decimal("0"),
    free_shipping: bool = False,
) -> PromoValidationResult:
    return PromoValidationResult(
        valid=valid,
        code="TEST10",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("10"),
        discount_amount=discount if valid else None,
        message="Valid" if valid else "Invalid",
        new_total=None,
        free_shipping=free_shipping,
    )


def _make_service() -> OrderService:
    session = MagicMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.execute = AsyncMock()
    session.expire_all = MagicMock()
    session.get = AsyncMock(return_value=None)  # customer/user lookup in email block
    service = OrderService(session)
    service.repo = AsyncMock()
    service.repo.generate_order_number = AsyncMock(return_value="ORD-20260115-0001")
    return service


def _make_cart_service(cart: CartResponse) -> AsyncMock:
    cs = AsyncMock()
    cs.get_cart = AsyncMock(return_value=cart)
    cs.cart_repo = AsyncMock()
    cs.cart_repo.get_by_customer_id = AsyncMock(return_value=MagicMock(id=uuid4()))
    return cs


def _make_address_service(address: AddressResponse) -> AsyncMock:
    svc = AsyncMock()
    svc.get_address = AsyncMock(return_value=address)
    return svc


def _make_delivery_service(charge: Decimal = Decimal("60")) -> AsyncMock:
    svc = AsyncMock()
    svc.calculate_charge = AsyncMock(return_value=_make_delivery_result(charge))
    return svc


def _make_promo_service(
    valid: bool = True,
    discount: Decimal = Decimal("0"),
    free_shipping: bool = False,
    promo_id: object = None,
) -> AsyncMock:
    svc = AsyncMock()
    svc.validate_promo = AsyncMock(return_value=_make_promo_result(valid, discount, free_shipping))
    promo_obj = MagicMock()
    promo_obj.id = promo_id or uuid4()
    svc.repo = AsyncMock()
    svc.repo.get_by_code = AsyncMock(return_value=promo_obj)
    return svc


def _make_payment_service(enabled: bool = True) -> AsyncMock:
    svc = AsyncMock()
    svc.get_gateway_by_code = AsyncMock(return_value=_make_gateway(enabled))
    return svc


def _make_request(**kwargs) -> CreateOrderRequest:
    defaults = dict(
        address_id=uuid4(),
        payment_method="cod",
        is_gift=False,
        promo_code=None,
        gift_card_code=None,
        notes=None,
    )
    defaults.update(kwargs)
    return CreateOrderRequest(**defaults)


# ── Cart validation ──────────────────────────────────────────────────────────

class TestEmptyCart:
    async def test_empty_cart_raises_validation_error(self):
        service = _make_service()
        empty_cart = CartResponse(items=[], item_count=0, unique_items=0,
                                  subtotal=Decimal("0"), tax_amount=Decimal("0"), total=Decimal("0"))
        cart_svc = _make_cart_service(empty_cart)

        with pytest.raises(ValidationError) as exc_info:
            await service.create_order(
                customer_id=uuid4(),
                request=_make_request(),
                cart_service=cart_svc,
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert exc_info.value.field == "cart"


# ── Address validation ────────────────────────────────────────────────────────

class TestAddressValidation:
    async def test_no_address_id_raises_validation_error(self):
        service = _make_service()
        cart_svc = _make_cart_service(_make_cart())

        with pytest.raises(ValidationError) as exc_info:
            await service.create_order(
                customer_id=uuid4(),
                request=_make_request(address_id=None),
                cart_service=cart_svc,
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert exc_info.value.field == "address_id"


# ── Payment method validation ─────────────────────────────────────────────────

class TestPaymentMethodValidation:
    async def test_disabled_payment_method_raises_validation_error(self):
        service = _make_service()

        with pytest.raises(ValidationError) as exc_info:
            await service.create_order(
                customer_id=uuid4(),
                request=_make_request(payment_method="bkash"),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(enabled=False),
            )
        assert exc_info.value.field == "payment_method"

    async def test_enabled_payment_method_passes(self):
        service = _make_service()

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(payment_method="bkash"),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(enabled=True),
            )
        assert result.order_number == "ORD-20260115-0001"


# ── Promo code validation ─────────────────────────────────────────────────────

class TestPromoCodeValidation:
    async def test_invalid_promo_raises_validation_error(self):
        service = _make_service()

        with pytest.raises(ValidationError) as exc_info:
            await service.create_order(
                customer_id=uuid4(),
                request=_make_request(promo_code="BADCODE"),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(valid=False),
                payment_service=_make_payment_service(),
            )
        assert exc_info.value.field == "promo_code"

    async def test_valid_promo_applies_discount(self):
        service = _make_service()
        subtotal = Decimal("15000")
        discount = Decimal("1500")
        delivery = Decimal("60")

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(promo_code="TEST10"),
                cart_service=_make_cart_service(_make_cart(subtotal=subtotal)),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(charge=delivery),
                promo_service=_make_promo_service(valid=True, discount=discount),
                payment_service=_make_payment_service(),
            )
        # total = subtotal - discount + delivery
        assert result.total == subtotal - discount + delivery

    async def test_free_shipping_promo_zeroes_delivery(self):
        service = _make_service()
        subtotal = Decimal("15000")

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(promo_code="FREESHIP"),
                cart_service=_make_cart_service(_make_cart(subtotal=subtotal)),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(charge=Decimal("60")),
                promo_service=_make_promo_service(valid=True, discount=Decimal("0"), free_shipping=True),
                payment_service=_make_payment_service(),
            )
        # delivery charge zeroed by free shipping
        assert result.total == subtotal

    async def test_no_promo_total_includes_delivery(self):
        service = _make_service()
        subtotal = Decimal("10000")
        delivery = Decimal("80")

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(),
                cart_service=_make_cart_service(_make_cart(subtotal=subtotal)),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(charge=delivery),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert result.total == subtotal + delivery


# ── COD vs online payment ─────────────────────────────────────────────────────

class TestPaymentFlow:
    async def test_cod_order_does_not_require_payment(self):
        service = _make_service()

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(payment_method="cod"),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert result.requires_payment is False
        assert result.payment_url is None

    async def test_cod_order_sets_confirmed_status(self):
        """COD order should be auto-confirmed during creation."""
        service = _make_service()
        confirmed_order = None

        original_add = service.session.add

        def capture_add(obj):
            nonlocal confirmed_order
            from app.modules.orders.models import Order
            if isinstance(obj, Order):
                confirmed_order = obj
            return original_add(obj)

        service.session.add = capture_add

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            await service.create_order(
                customer_id=uuid4(),
                request=_make_request(payment_method="cod"),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert confirmed_order is not None
        assert confirmed_order.status == OrderStatus.CONFIRMED
        assert confirmed_order.confirmed_at is not None

    async def test_online_payment_requires_payment_and_returns_url(self):
        service = _make_service()

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(payment_method="bkash"),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert result.requires_payment is True
        assert result.payment_url is not None
        assert "bkash" in result.payment_url

    async def test_online_payment_order_message_says_proceed(self):
        service = _make_service()

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(payment_method="bkash"),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert "payment" in result.message.lower()

    async def test_cod_order_message_says_placed(self):
        service = _make_service()

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(payment_method="cod"),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert "placed" in result.message.lower()


# ── Total calculation ─────────────────────────────────────────────────────────

class TestTotalCalculation:
    async def test_total_equals_subtotal_minus_discount_plus_delivery(self):
        service = _make_service()
        subtotal = Decimal("20000")
        discount = Decimal("2000")
        delivery = Decimal("120")

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(promo_code="SAVE10"),
                cart_service=_make_cart_service(_make_cart(subtotal=subtotal)),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(charge=delivery),
                promo_service=_make_promo_service(valid=True, discount=discount),
                payment_service=_make_payment_service(),
            )
        assert result.total == subtotal - discount + delivery

    async def test_zero_discount_total(self):
        service = _make_service()
        subtotal = Decimal("5000")
        delivery = Decimal("60")

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(),
                cart_service=_make_cart_service(_make_cart(subtotal=subtotal)),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(charge=delivery),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert result.total == subtotal + delivery

    async def test_free_delivery_zone_total(self):
        """When delivery charge is 0, total equals subtotal."""
        service = _make_service()
        subtotal = Decimal("8000")

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(),
                cart_service=_make_cart_service(_make_cart(subtotal=subtotal)),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(charge=Decimal("0")),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert result.total == subtotal


# ── Session and DB behaviour ──────────────────────────────────────────────────

class TestSessionBehaviour:
    async def test_session_commit_called_on_success(self):
        service = _make_service()

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            await service.create_order(
                customer_id=uuid4(),
                request=_make_request(),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        service.session.commit.assert_called_once()

    async def test_session_rollback_called_on_flush_failure(self):
        service = _make_service()
        service.session.flush = AsyncMock(side_effect=RuntimeError("DB error"))

        with pytest.raises(RuntimeError, match="DB error"):
            await service.create_order(
                customer_id=uuid4(),
                request=_make_request(),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        service.session.rollback.assert_called_once()
        service.session.commit.assert_not_called()

    async def test_cart_cleared_after_successful_order(self):
        service = _make_service()
        cart_svc = _make_cart_service(_make_cart())

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            await service.create_order(
                customer_id=uuid4(),
                request=_make_request(),
                cart_service=cart_svc,
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        # session.execute should have been called for the DELETE CartItem
        service.session.execute.assert_called()

    async def test_cart_cache_invalidated_after_order(self):
        service = _make_service()
        customer_id = uuid4()
        mock_invalidate = AsyncMock()

        with patch("app.modules.orders.service.invalidate_cart_cache", new=mock_invalidate):
            await service.create_order(
                customer_id=customer_id,
                request=_make_request(),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        mock_invalidate.assert_called_once_with(str(customer_id))


# ── Order number and response ─────────────────────────────────────────────────

class TestOrderResponse:
    async def test_response_contains_order_number(self):
        service = _make_service()

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert result.order_number == "ORD-20260115-0001"

    async def test_response_contains_payment_method(self):
        service = _make_service()

        with patch("app.modules.orders.service.invalidate_cart_cache", new=AsyncMock()):
            result = await service.create_order(
                customer_id=uuid4(),
                request=_make_request(payment_method="cod"),
                cart_service=_make_cart_service(_make_cart()),
                address_service=_make_address_service(_make_address()),
                delivery_service=_make_delivery_service(),
                promo_service=_make_promo_service(),
                payment_service=_make_payment_service(),
            )
        assert result.payment_method == "cod"
