"""
Permission constants for RBAC system.
"""
from enum import Enum


class PermissionEnum(str, Enum):
    """Predefined permission scopes."""
    # User permissions
    USERS_READ = "users:read"
    USERS_WRITE = "users:write"
    USERS_DELETE = "users:delete"
    
    # Role permissions
    ROLES_READ = "roles:read"
    ROLES_WRITE = "roles:write"
    ROLES_DELETE = "roles:delete"
    
    # Permission permissions
    PERMISSIONS_READ = "permissions:read"
    PERMISSIONS_WRITE = "permissions:write"
    PERMISSIONS_DELETE = "permissions:delete"
    
    # OAuth Provider permissions
    OAUTH_PROVIDERS_READ = "oauth_providers:read"
    OAUTH_PROVIDERS_WRITE = "oauth_providers:write"
    OAUTH_PROVIDERS_DELETE = "oauth_providers:delete"
    
    # Admin management
    ADMINS_MANAGE = "admins:manage"
    
    # Order permissions
    ORDERS_READ = "orders:read"
    ORDERS_WRITE = "orders:write"
    
    # Product permissions
    PRODUCTS_READ = "products:read"
    PRODUCTS_WRITE = "products:write"
    PRODUCTS_DELETE = "products:delete"
    
    # Category permissions
    CATEGORIES_READ = "categories:read"
    CATEGORIES_WRITE = "categories:write"
    CATEGORIES_DELETE = "categories:delete"
    
    # Slides permissions (homepage banners)
    SLIDES_READ = "slides:read"
    SLIDES_WRITE = "slides:write"
    SLIDES_DELETE = "slides:delete"

    # Brand & Collection permissions
    BRANDS_READ = "brands:read"
    BRANDS_WRITE = "brands:write"
    BRANDS_DELETE = "brands:delete"
    
    COLLECTIONS_READ = "collections:read"
    COLLECTIONS_WRITE = "collections:write"
    COLLECTIONS_DELETE = "collections:delete"
    
    # Metal & Purity permissions
    METALS_READ = "metals:read"
    METALS_WRITE = "metals:write"
    METALS_DELETE = "metals:delete"
    
    # Attribute permissions
    ATTRIBUTES_READ = "attributes:read"
    ATTRIBUTES_WRITE = "attributes:write"
    ATTRIBUTES_DELETE = "attributes:delete"
    
    # Rate permissions
    RATES_READ = "rates:read"
    RATES_WRITE = "rates:write"
    
    # Cart permissions
    CART_READ = "cart:read"
    CART_WRITE = "cart:write"
    
    # System permissions
    SYSTEM_CONFIG = "system:config"


# Default role-to-permission mappings
DEFAULT_ROLE_PERMISSIONS = {
    "SUPER_ADMIN": ["*"],  # All permissions
    "MANAGER": [
        PermissionEnum.USERS_READ,
        PermissionEnum.USERS_WRITE,
        PermissionEnum.ORDERS_READ,
        PermissionEnum.ORDERS_WRITE,
        PermissionEnum.PRODUCTS_READ,
        PermissionEnum.PRODUCTS_WRITE,
        PermissionEnum.CATEGORIES_READ,
        PermissionEnum.CATEGORIES_WRITE,
    ],
    "SUPPORT": [
        PermissionEnum.USERS_READ,
        PermissionEnum.ORDERS_READ,
        PermissionEnum.CATEGORIES_READ,
    ],
    "CUSTOMER": [
        "profile:read",
        "profile:write",
        PermissionEnum.ORDERS_READ,
        PermissionEnum.CART_READ,
        PermissionEnum.CART_WRITE,
    ],
}
