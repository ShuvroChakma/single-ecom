"""
Main API Router for v1 endpoints.
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
from app.modules.brands import endpoints as brands
from app.modules.metals import endpoints as metals
from app.modules.products import endpoints as products
from app.modules.attributes import endpoints as attributes
from app.modules.rates import endpoints as rates
from app.modules.uploads import endpoints as uploads
from app.modules.slides import endpoints as slides
from app.modules.cart import endpoints as cart
from app.modules.addresses import endpoints as addresses
from app.modules.delivery import endpoints as delivery
from app.modules.promo_codes import endpoints as promo_codes
from app.modules.payments import endpoints as payments
from app.modules.payments import callback_endpoints as payment_callbacks
from app.modules.orders import endpoints as orders
from app.modules.orders import pos_endpoints as pos
from app.modules.settings import endpoints as settings


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
api_router.include_router(brands.router, tags=["Brands & Collections"])
api_router.include_router(metals.router, tags=["Metals & Purities"])
# IMPORTANT: Include attributes, rates, uploads, and slides BEFORE products 
# because products has a /{slug} catch-all route
api_router.include_router(attributes.router, tags=["Attributes"])
api_router.include_router(rates.router, tags=["Daily Rates"])
api_router.include_router(uploads.router, tags=["Product Images"])
api_router.include_router(slides.router, tags=["Homepage Slides"])
api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["Addresses"])
api_router.include_router(delivery.router, prefix="/delivery", tags=["Delivery"])
api_router.include_router(promo_codes.router, prefix="/promo", tags=["Promo Codes"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(payment_callbacks.router, prefix="/payments/callback", tags=["Payment Callbacks"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(pos.router, prefix="/admin/pos", tags=["Admin POS"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
api_router.include_router(products.router, tags=["Products"])
