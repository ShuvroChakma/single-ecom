"""
Scraper for BAJUS (Bangladesh Jewellers Samity) gold/silver rates.
https://www.bajus.org/gold-price
"""
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional
import logging
import re

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

BAJUS_URL = "https://www.bajus.org/gold-price"
REQUEST_TIMEOUT = 30  # seconds

# Map description keywords → purity code (order matters: more specific first)
PURITY_MAP = [
    ("22 karat", "22K"),
    ("21 karat", "21K"),
    ("18 karat", "18K"),
    ("14 karat", "14K"),
    ("traditional", "Traditional"),
    ("999", "999"),
    ("925", "925"),
    ("800", "800"),
]


@dataclass
class ScrapedRate:
    metal_type: str        # "GOLD" or "SILVER"
    purity: str            # "22K", "18K", "Traditional", etc.
    rate_per_gram: Decimal
    currency: str = field(default="BDT")


def _detect_purity(description: str) -> Optional[str]:
    """Map a BAJUS description string to a purity code."""
    lower = description.lower().strip()
    for keyword, code in PURITY_MAP:
        if keyword in lower:
            return code
    return None


def _detect_metal(heading_text: str) -> Optional[str]:
    """Return 'GOLD' or 'SILVER' from a section heading."""
    lower = heading_text.lower()
    if "gold" in lower:
        return "GOLD"
    if "silver" in lower:
        return "SILVER"
    return None


def _parse_price(raw: str) -> Optional[Decimal]:
    """Parse a price string like '22,995' or '22995.00' to Decimal."""
    cleaned = re.sub(r"[^\d.]", "", raw)
    if not cleaned:
        return None
    try:
        value = Decimal(cleaned)
        return value if value > 0 else None
    except Exception:
        return None


def parse_bajus_html(html: str) -> list[ScrapedRate]:
    """
    Parse BAJUS gold price page HTML and return a list of ScrapedRate objects.

    BAJUS uses <img alt="gold price"> / <img alt="silver price"> as section
    separators (not text headings). Each table row has three columns:
      [Product, Description, Price]
    where Product contains e.g. "22 KARAT Gold" — used to detect metal + purity.
    Falls back to the nearest img-based section heading if Product column is empty.
    """
    soup = BeautifulSoup(html, "html.parser")
    rates: list[ScrapedRate] = []
    current_metal: Optional[str] = None

    for element in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "img", "table"]):
        tag = element.name

        # Text headings (fallback for test HTML / future site changes)
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            metal = _detect_metal(element.get_text())
            if metal:
                current_metal = metal
            continue

        # BAJUS uses <img alt="gold price"> / <img alt="silver price"> as section headings
        if tag == "img":
            metal = _detect_metal(element.get("alt", ""))
            if metal:
                current_metal = metal
            continue

        if tag == "table":
            for row in element.find_all("tr"):
                cells = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
                if len(cells) < 2:
                    continue
                # Skip header rows
                if cells[0].lower() in ("product", "description", "metal", "type"):
                    continue

                if len(cells) >= 3:
                    product_col = cells[0]   # e.g. "22 KARAT Gold"
                    desc_col = cells[1]      # e.g. "CADMIUM (HALLMARKED GOLD)"
                    price_str = cells[2]
                else:
                    product_col = ""
                    desc_col = cells[0]
                    price_str = cells[1]

                # Derive metal from product column first, fall back to section heading
                metal = _detect_metal(product_col) or current_metal
                # Derive purity from product column first, fall back to description
                purity = _detect_purity(product_col) or _detect_purity(desc_col)
                price = _parse_price(price_str)

                if metal and purity and price:
                    rates.append(ScrapedRate(
                        metal_type=metal,
                        purity=purity,
                        rate_per_gram=price,
                    ))

    return rates


async def fetch_bajus_rates() -> list[ScrapedRate]:
    """
    Fetch the BAJUS gold price page and return parsed rates.
    Raises httpx.HTTPError on network failure.
    """
    logger.info("Fetching BAJUS rates from %s", BAJUS_URL)
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
        response = await client.get(BAJUS_URL)
        response.raise_for_status()

    rates = parse_bajus_html(response.text)
    logger.info("Scraped %d rates from BAJUS", len(rates))
    return rates
