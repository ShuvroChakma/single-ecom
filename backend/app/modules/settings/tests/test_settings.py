"""
Tests for Settings.
"""
import pytest
from uuid import uuid4

from app.modules.settings.models import Setting, SettingCategory, DEFAULT_SETTINGS
from app.modules.settings.schemas import (
    SettingUpdate,
    SettingBulkUpdate,
    SettingsGrouped
)


class TestSettingModel:
    """Test setting model."""
    
    def test_setting_model_creation(self):
        """Test Setting model can be created."""
        setting = Setting(
            key="test_key",
            value="test_value",
            category=SettingCategory.GENERAL
        )
        
        assert setting.key == "test_key"
        assert setting.value == "test_value"
        assert setting.category == SettingCategory.GENERAL
    
    def test_setting_defaults(self):
        """Test setting model has correct defaults."""
        setting = Setting(
            key="another_key",
            value="another_value"
        )
        
        assert setting.is_public is True
        assert setting.is_sensitive is False
        assert setting.category == SettingCategory.GENERAL


class TestSettingCategories:
    """Test setting categories."""
    
    def test_all_categories_exist(self):
        """Test all expected categories exist."""
        expected = [
            "GENERAL", "CONTACT", "SOCIAL", "PAYMENT",
            "SHIPPING", "EMAIL", "SEO", "APPEARANCE"
        ]
        
        for cat in expected:
            assert hasattr(SettingCategory, cat)


class TestDefaultSettings:
    """Test default settings configuration."""
    
    def test_default_settings_exist(self):
        """Test default settings are defined."""
        assert len(DEFAULT_SETTINGS) > 0
    
    def test_default_settings_have_keys(self):
        """Test all default settings have keys."""
        for setting in DEFAULT_SETTINGS:
            assert "key" in setting
            assert len(setting["key"]) > 0
    
    def test_store_name_in_defaults(self):
        """Test store_name is in default settings."""
        keys = [s["key"] for s in DEFAULT_SETTINGS]
        assert "store_name" in keys
    
    def test_contact_email_in_defaults(self):
        """Test contact_email is in default settings."""
        keys = [s["key"] for s in DEFAULT_SETTINGS]
        assert "contact_email" in keys


class TestSettingSchemas:
    """Test setting schemas."""
    
    def test_setting_update(self):
        """Test setting update schema."""
        update = SettingUpdate(
            value="new_value",
            is_public=False
        )
        
        assert update.value == "new_value"
        assert update.is_public is False
    
    def test_bulk_update(self):
        """Test bulk update schema."""
        bulk = SettingBulkUpdate(
            settings={
                "store_name": "New Store",
                "contact_email": "new@store.com"
            }
        )
        
        assert len(bulk.settings) == 2
        assert bulk.settings["store_name"] == "New Store"
    
    def test_settings_grouped(self):
        """Test grouped settings schema."""
        grouped = SettingsGrouped(
            general={"store_name": "Test"},
            contact={"email": "test@test.com"},
            social={"facebook": ""},
            shipping={"threshold": "5000"},
            seo={"title": "Test"},
            appearance={"color": "#fff"}
        )
        
        assert grouped.general["store_name"] == "Test"
        assert grouped.contact["email"] == "test@test.com"
