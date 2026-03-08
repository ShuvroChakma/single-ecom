"""Tests for BAJUS scraper."""
import pytest
from decimal import Decimal
from app.modules.rates.bajus_scraper import parse_bajus_html, ScrapedRate

SAMPLE_HTML = """
<html><body>
  <h2>Gold Price</h2>
  <table>
    <tr><th>Product</th><th>Description</th><th>Price</th></tr>
    <tr><td></td><td>22 Karat Cadmium (Hallmarked)</td><td>22,995</td></tr>
    <tr><td></td><td>21 Karat Cadmium (Hallmarked)</td><td>21,950</td></tr>
    <tr><td></td><td>18 Karat Cadmium (Hallmarked)</td><td>18,815</td></tr>
    <tr><td></td><td>Traditional</td><td>15,360</td></tr>
  </table>
  <h2>Silver Price</h2>
  <table>
    <tr><th>Product</th><th>Description</th><th>Price</th></tr>
    <tr><td></td><td>999 Fine Silver</td><td>95</td></tr>
  </table>
</body></html>
"""

def test_parse_bajus_html_returns_rates():
    rates = parse_bajus_html(SAMPLE_HTML)
    assert len(rates) >= 4

def test_parse_bajus_html_gold_22k():
    rates = parse_bajus_html(SAMPLE_HTML)
    gold_22k = next((r for r in rates if r.metal_type == "GOLD" and r.purity == "22K"), None)
    assert gold_22k is not None
    assert gold_22k.rate_per_gram == Decimal("22995")

def test_parse_bajus_html_silver():
    rates = parse_bajus_html(SAMPLE_HTML)
    silver = [r for r in rates if r.metal_type == "SILVER"]
    assert len(silver) >= 1

def test_parse_bajus_html_no_zero_rates():
    rates = parse_bajus_html(SAMPLE_HTML)
    assert all(r.rate_per_gram > 0 for r in rates)

def test_parse_bajus_html_all_metals_detected():
    rates = parse_bajus_html(SAMPLE_HTML)
    metal_types = {r.metal_type for r in rates}
    assert "GOLD" in metal_types
    assert "SILVER" in metal_types
