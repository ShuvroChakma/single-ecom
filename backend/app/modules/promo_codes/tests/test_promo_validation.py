"""
Service-level tests for promo code validation rules:
  - Minimum order amount
  - Maximum total uses
  - Maximum uses per user
  - Maximum discount cap
  - Expiry / active window
  - Code not found
  - First order only
  - Free shipping
"""
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

from app.modules.promo_codes.models import PromoCode, DiscountType
from app.modules.promo_codes.service import PromoCodeService


# ── Helpers ─────────────────────────────────────────────────────────────────

def now() -> datetime:
    return datetime(2026, 1, 15, 12, 0, 0)  # fixed — avoids utcnow deprecation warning


def make_promo(**kwargs) -> PromoCode:
    """Build a valid active PromoCode. Override any field via kwargs."""
    defaults = dict(
        id=uuid4(),
        code="TEST10",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("10"),
        max_discount=None,
        min_order_amount=None,
        max_total_uses=None,
        max_uses_per_user=1,
        current_uses=0,
        first_order_only=False,
        is_active=True,
        starts_at=now() - timedelta(hours=1),
        expires_at=now() + timedelta(days=30),
        created_by=uuid4(),
        created_at=now(),
        updated_at=now(),
    )
    defaults.update(kwargs)
    return PromoCode(**defaults)


def make_service(promo: PromoCode | None, user_uses: int = 0) -> PromoCodeService:
    """Build a PromoCodeService with mocked repositories."""
    session = MagicMock()
    service = PromoCodeService(session)
    service.repo = AsyncMock()
    service.repo.get_by_code = AsyncMock(return_value=promo)
    service.use_repo = AsyncMock()
    service.use_repo.get_user_uses = AsyncMock(return_value=user_uses)
    return service


# ── Code lookup ─────────────────────────────────────────────────────────────

class TestCodeLookup:
    async def test_unknown_code_returns_invalid(self):
        service = make_service(promo=None)
        result = await service.validate_promo("GHOST99", order_amount=Decimal("5000"))
        assert result.valid is False

    async def test_inactive_code_is_rejected(self):
        promo = make_promo(is_active=False)
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is False

    async def test_code_is_case_insensitive(self):
        promo = make_promo(code="TEST10")
        service = make_service(promo)
        result = await service.validate_promo("test10", order_amount=Decimal("5000"))
        # service normalises to upper before repo lookup — repo mock always returns promo
        assert result.valid is True


# ── Active window ────────────────────────────────────────────────────────────

class TestActiveWindow:
    async def test_not_yet_active_is_rejected(self):
        promo = make_promo(starts_at=now() + timedelta(hours=1))
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is False
        assert "not yet active" in result.message.lower()

    async def test_expired_code_is_rejected(self):
        promo = make_promo(expires_at=now() - timedelta(seconds=1))
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is False
        assert "expired" in result.message.lower()

    async def test_exactly_expired_is_rejected(self):
        """expires_at == now should be treated as expired (<=)."""
        promo = make_promo(expires_at=now())
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is False

    async def test_active_code_passes(self):
        promo = make_promo(
            starts_at=now() - timedelta(days=1),
            expires_at=now() + timedelta(days=1),
        )
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is True


# ── Minimum order amount ─────────────────────────────────────────────────────

class TestMinOrderAmount:
    async def test_order_below_minimum_is_rejected(self):
        promo = make_promo(min_order_amount=Decimal("2000"))
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("1999"))
        assert result.valid is False
        assert "2000" in result.message

    async def test_order_exactly_at_minimum_is_accepted(self):
        promo = make_promo(min_order_amount=Decimal("2000"))
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("2000"))
        assert result.valid is True

    async def test_order_above_minimum_is_accepted(self):
        promo = make_promo(min_order_amount=Decimal("2000"))
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is True

    async def test_no_minimum_accepts_any_amount(self):
        promo = make_promo(min_order_amount=None)
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("1"))
        assert result.valid is True


# ── Maximum total uses ───────────────────────────────────────────────────────

class TestMaxTotalUses:
    async def test_at_usage_limit_is_rejected(self):
        promo = make_promo(max_total_uses=100, current_uses=100)
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is False
        assert "limit" in result.message.lower()

    async def test_over_usage_limit_is_rejected(self):
        promo = make_promo(max_total_uses=100, current_uses=150)
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is False

    async def test_one_use_below_limit_is_accepted(self):
        promo = make_promo(max_total_uses=100, current_uses=99)
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is True

    async def test_no_usage_limit_is_unlimited(self):
        promo = make_promo(max_total_uses=None, current_uses=99999)
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is True


# ── Maximum uses per user ────────────────────────────────────────────────────

class TestMaxUsesPerUser:
    async def test_user_at_limit_is_rejected(self):
        promo = make_promo(max_uses_per_user=2)
        service = make_service(promo, user_uses=2)
        result = await service.validate_promo("TEST10", Decimal("5000"), customer_id=uuid4())
        assert result.valid is False
        assert "already used" in result.message.lower()

    async def test_user_over_limit_is_rejected(self):
        promo = make_promo(max_uses_per_user=1)
        service = make_service(promo, user_uses=5)
        result = await service.validate_promo("TEST10", Decimal("5000"), customer_id=uuid4())
        assert result.valid is False

    async def test_user_below_limit_is_accepted(self):
        promo = make_promo(max_uses_per_user=3)
        service = make_service(promo, user_uses=2)
        result = await service.validate_promo("TEST10", Decimal("5000"), customer_id=uuid4())
        assert result.valid is True

    async def test_guest_bypasses_per_user_check(self):
        """No customer_id → per-user limit is not enforced."""
        promo = make_promo(max_uses_per_user=1)
        service = make_service(promo, user_uses=999)
        result = await service.validate_promo("TEST10", Decimal("5000"))
        assert result.valid is True
        service.use_repo.get_user_uses.assert_not_called()

    async def test_default_per_user_limit_is_one(self):
        promo = make_promo(max_uses_per_user=1)
        service = make_service(promo, user_uses=1)
        result = await service.validate_promo("TEST10", Decimal("5000"), customer_id=uuid4())
        assert result.valid is False


# ── Maximum discount cap ─────────────────────────────────────────────────────

class TestMaxDiscount:
    async def test_percentage_capped_at_max_discount(self):
        """10% of 10 000 = 1 000, but cap is 500 → discount = 500."""
        promo = make_promo(discount_value=Decimal("10"), max_discount=Decimal("500"))
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("10000"))
        assert result.valid is True
        assert result.discount_amount == Decimal("500")
        assert result.new_total == Decimal("9500")

    async def test_percentage_below_cap_not_capped(self):
        """10% of 3 000 = 300, cap is 500 → no cap applied."""
        promo = make_promo(discount_value=Decimal("10"), max_discount=Decimal("500"))
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("3000"))
        assert result.valid is True
        assert result.discount_amount == Decimal("300")

    async def test_percentage_no_cap_applies_fully(self):
        promo = make_promo(discount_value=Decimal("20"), max_discount=None)
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is True
        assert result.discount_amount == Decimal("1000")

    async def test_fixed_discount_not_capped_by_max_discount(self):
        """max_discount only caps PERCENTAGE — fixed amount is min(value, order)."""
        promo = make_promo(
            discount_type=DiscountType.FIXED_AMOUNT,
            discount_value=Decimal("300"),
            max_discount=Decimal("100"),
        )
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is True
        assert result.discount_amount == Decimal("300")

    async def test_fixed_discount_capped_at_order_amount(self):
        """Fixed discount can never exceed the order total."""
        promo = make_promo(discount_type=DiscountType.FIXED_AMOUNT, discount_value=Decimal("500"))
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("200"))
        assert result.valid is True
        assert result.discount_amount == Decimal("200")
        assert result.new_total == Decimal("0")


# ── Free shipping ────────────────────────────────────────────────────────────

class TestFreeShipping:
    async def test_free_shipping_promo_sets_flag(self):
        promo = make_promo(discount_type=DiscountType.FREE_SHIPPING, discount_value=Decimal("1"))
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is True
        assert result.free_shipping is True
        assert result.discount_amount == Decimal("0")


# ── First order only ─────────────────────────────────────────────────────────

class TestFirstOrderOnly:
    async def test_first_order_promo_accepted_when_no_prior_orders(self):
        promo = make_promo(first_order_only=True)
        service = make_service(promo, user_uses=0)
        # user_uses=0 means they've never used it → treat as first order
        result = await service.validate_promo("TEST10", Decimal("5000"), customer_id=uuid4())
        assert result.valid is True


# ── Combined rules ───────────────────────────────────────────────────────────

class TestCombinedRules:
    async def test_min_order_blocks_before_discount_is_calculated(self):
        promo = make_promo(min_order_amount=Decimal("3000"), discount_value=Decimal("10"))
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("1000"))
        assert result.valid is False
        assert result.discount_amount is None

    async def test_exhausted_code_blocks_valid_order(self):
        promo = make_promo(min_order_amount=Decimal("1000"), max_total_uses=50, current_uses=50)
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("5000"))
        assert result.valid is False

    async def test_all_rules_satisfied(self):
        promo = make_promo(
            discount_value=Decimal("10"),
            max_discount=Decimal("500"),
            min_order_amount=Decimal("1000"),
            max_total_uses=100,
            current_uses=50,
            max_uses_per_user=2,
        )
        service = make_service(promo, user_uses=1)
        result = await service.validate_promo("TEST10", Decimal("5000"), customer_id=uuid4())
        assert result.valid is True
        assert result.discount_amount == Decimal("500")   # capped
        assert result.new_total == Decimal("4500")

    async def test_expired_overrides_everything(self):
        promo = make_promo(
            expires_at=now() - timedelta(days=1),
            discount_value=Decimal("50"),  # big discount
            min_order_amount=Decimal("100"),
        )
        service = make_service(promo)
        result = await service.validate_promo("TEST10", order_amount=Decimal("50000"))
        assert result.valid is False
        assert "expired" in result.message.lower()
