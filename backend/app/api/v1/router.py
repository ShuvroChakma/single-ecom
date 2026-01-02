"""
API v1 router.
"""
from fastapi import APIRouter

from app.modules.auth import endpoints as auth
from app.modules.roles import endpoints as roles
from app.modules.roles import permissions_endpoints as permissions
from app.modules.oauth import endpoints as oauth
from app.modules.oauth import provider_endpoints as oauth_providers
from app.modules.users import admin_endpoints as admins
from app.modules.users import customer_endpoints as customers
from app.modules.audit import endpoints as audit_logs
from app.modules.catalog import endpoints as catalog
from app.modules.catalog import brand_collection_endpoints as brand_collection
from app.modules.catalog import metal_endpoints as metal
from app.modules.catalog import product_endpoints as products
from app.modules.catalog import attribute_endpoints as attributes
from app.modules.catalog import rate_endpoints as rates


api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(oauth.router, prefix="/auth/oauth")
api_router.include_router(roles.router, prefix="/admin/roles")
api_router.include_router(permissions.router, prefix="/admin/permissions")
api_router.include_router(oauth_providers.router, prefix="/admin/oauth-providers")
api_router.include_router(admins.router, prefix="/admin/admins")
api_router.include_router(customers.router, prefix="/admin/customers")
api_router.include_router(audit_logs.router, prefix="/admin/audit-logs")

api_router.include_router(catalog.router, prefix="/catalog", tags=["Catalog"])
api_router.include_router(brand_collection.router, tags=["Brands & Collections"])
api_router.include_router(metal.router, tags=["Metals & Purities"])
api_router.include_router(products.router, tags=["Products"])
api_router.include_router(attributes.router, tags=["Attributes"])
api_router.include_router(rates.router, tags=["Daily Rates"])
