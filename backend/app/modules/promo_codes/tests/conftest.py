"""
Shared fixtures for promo code tests.
"""
from datetime import datetime
from unittest.mock import patch

import pytest

# The fixed "now" used in test_promo_validation.py
TEST_NOW = datetime(2026, 1, 15, 12, 0, 0)


@pytest.fixture(autouse=True)
def freeze_promo_service_time():
    """Freeze datetime.utcnow() inside PromoCodeService to TEST_NOW."""
    with patch("app.modules.promo_codes.service.datetime") as mock_dt:
        mock_dt.utcnow.return_value = TEST_NOW
        yield
