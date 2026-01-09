"""
Settings model for managing site-wide configurations.
"""
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import JSON, Text


class SettingCategory(str, Enum):
    """Categories of settings."""
    GENERAL = "GENERAL"           # Store name, logo, tagline
    CONTACT = "CONTACT"           # Email, phone, address
    SOCIAL = "SOCIAL"             # Social media links
    PAYMENT = "PAYMENT"           # Payment settings
    SHIPPING = "SHIPPING"         # Shipping defaults
    EMAIL = "EMAIL"               # Email templates/SMTP
    SEO = "SEO"                   # Meta tags, analytics
    APPEARANCE = "APPEARANCE"     # Theme, colors


class Setting(SQLModel, table=True):
    """
    Key-value settings storage.
    
    Allows flexible storage of any setting with categorization.
    """
    __tablename__ = "settings"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    key: str = Field(max_length=100, unique=True, index=True)
    value: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # For JSON values (complex settings)
    json_value: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSON)
    )
    
    category: SettingCategory = Field(default=SettingCategory.GENERAL)
    description: Optional[str] = Field(default=None, max_length=255)
    
    # Is this a public setting (can be read by frontend)?
    is_public: bool = Field(default=True)
    
    # Is this sensitive (should not be logged)?
    is_sensitive: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Default settings to initialize
DEFAULT_SETTINGS = [
    # General
    {"key": "store_name", "value": "Jewelry Store", "category": "GENERAL", "description": "Store name"},
    {"key": "store_tagline", "value": "Exquisite Jewelry for Every Occasion", "category": "GENERAL"},
    {"key": "store_logo", "value": "/static/logo.png", "category": "GENERAL"},
    {"key": "store_favicon", "value": "/static/favicon.ico", "category": "GENERAL"},
    {"key": "currency", "value": "BDT", "category": "GENERAL"},
    {"key": "currency_symbol", "value": "৳", "category": "GENERAL"},
    
    # Contact
    {"key": "contact_email", "value": "info@store.com", "category": "CONTACT"},
    {"key": "contact_phone", "value": "+880 1711-000000", "category": "CONTACT"},
    {"key": "contact_address", "value": "123 Jewelry Lane, Dhaka", "category": "CONTACT"},
    {"key": "support_email", "value": "support@store.com", "category": "CONTACT"},
    {"key": "whatsapp_number", "value": "+8801711000000", "category": "CONTACT"},
    
    # Social
    {"key": "facebook_url", "value": "", "category": "SOCIAL"},
    {"key": "instagram_url", "value": "", "category": "SOCIAL"},
    {"key": "youtube_url", "value": "", "category": "SOCIAL"},
    {"key": "twitter_url", "value": "", "category": "SOCIAL"},
    {"key": "pinterest_url", "value": "", "category": "SOCIAL"},
    
    # Shipping
    {"key": "free_shipping_threshold", "value": "5000", "category": "SHIPPING", "description": "Order amount for free shipping"},
    {"key": "default_shipping_days_min", "value": "3", "category": "SHIPPING"},
    {"key": "default_shipping_days_max", "value": "7", "category": "SHIPPING"},
    
    # SEO
    {"key": "meta_title", "value": "Jewelry Store - Exquisite Jewelry", "category": "SEO"},
    {"key": "meta_description", "value": "Shop the finest jewelry collection", "category": "SEO"},
    {"key": "google_analytics_id", "value": "", "category": "SEO", "is_sensitive": True},
    {"key": "facebook_pixel_id", "value": "", "category": "SEO", "is_sensitive": True},
    
    # Appearance
    {"key": "primary_color", "value": "#D4AF37", "category": "APPEARANCE"},
    {"key": "secondary_color", "value": "#1a1a1a", "category": "APPEARANCE"},
    {"key": "accent_color", "value": "#C9A959", "category": "APPEARANCE"},
]
