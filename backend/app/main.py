from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.core.config import settings
from app.core.exceptions import add_exception_handlers
from app.core.docs import create_error_responses
from app.core.lifespan import lifespan
from app.core.logging_config import logger

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    responses=create_error_responses(400, 401, 403, 404, 422, 429, 500),
    lifespan=lifespan  # Auto-initialize database on startup
)

# Mount static files for uploads
static_dir = Path("static/uploads")
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory="static/uploads"), name="uploads")

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    # Check if wildcard is in origins
    origins = [str(origin).rstrip('/') for origin in settings.BACKEND_CORS_ORIGINS]
    if "*" in origins:
        # Allow all origins in development
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=False,  # Cannot use credentials with wildcard
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

# Add rate limiting middleware (200 requests per minute globally)
from app.core.rate_limit import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware, limit=200, window=60)

add_exception_handlers(app)

# Request/response logging middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
import time

_SENSITIVE_FIELDS = {"password", "new_password", "old_password", "token", "access_token",
                     "refresh_token", "otp", "otp_code", "secret", "card_number", "cvv"}

def _sanitize_body(raw: bytes) -> str:
    """Mask sensitive fields in request body before logging."""
    import json
    if not raw:
        return ""
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            sanitized = {
                k: "***" if k.lower() in _SENSITIVE_FIELDS else v
                for k, v in data.items()
            }
            return json.dumps(sanitized)
    except Exception:
        pass
    return "<binary or non-JSON body>"


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        start = time.time()
        body = await request.body()
        logger.info(
            "→ %s %s | auth: %s | body: %s",
            request.method,
            request.url,
            "present" if request.headers.get("authorization") else "none",
            _sanitize_body(body),
        )
        response = await call_next(request)
        elapsed = (time.time() - start) * 1000
        logger.info("← %s %s %.1fms", response.status_code, request.url, elapsed)
        return response

app.add_middleware(RequestLoggingMiddleware)

from app.core.schemas.response import SuccessResponse
from app.core.docs import doc_responses

@app.get(
    "/api/v1/health",
    response_model=SuccessResponse,
    summary="Health Check",
    responses=doc_responses(
        success_example={"status": "ok", "version": "1.0.0"},
        success_message="System is healthy",
        errors=()  # No auth required for health check
    )
)
async def health_check():
    """Check if the API is running and healthy."""
    return SuccessResponse(
        data={"status": "ok", "version": "1.0.0"},
        message="System is healthy"
    )

# Include API routes
from app.api.v1.router import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)


# ============ SEO ENDPOINTS ============
from fastapi import Depends
from fastapi.responses import PlainTextResponse, Response as FastAPIResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db


@app.get("/robots.txt", response_class=PlainTextResponse, include_in_schema=False)
async def robots_txt():
    site_url = settings.FRONTEND_URL.rstrip("/")
    return (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /checkout\n"
        "Disallow: /orders\n"
        "Disallow: /profile\n"
        "Disallow: /cart\n"
        f"Sitemap: {site_url}/sitemap.xml\n"
    )


@app.get("/sitemap.xml", response_class=FastAPIResponse, include_in_schema=False)
async def sitemap_xml(session: AsyncSession = Depends(get_db)):
    from sqlmodel import select
    from app.modules.products.models import Product
    from app.modules.catalog.models import Category

    site_url = settings.FRONTEND_URL.rstrip("/")

    products_result = await session.execute(
        select(Product.slug, Product.id, Product.updated_at).where(Product.is_active == True)
    )
    products = products_result.all()

    categories_result = await session.execute(
        select(Category.slug, Category.updated_at).where(Category.is_active == True)
    )
    categories = categories_result.all()

    urls = []

    # Static pages
    for path, changefreq, priority in [
        ("", "weekly", "1.0"),
        ("products", "daily", "0.9"),
    ]:
        loc = f"{site_url}/{path}".rstrip("/")
        urls.append(
            f"  <url>\n    <loc>{loc}</loc>\n"
            f"    <changefreq>{changefreq}</changefreq>\n"
            f"    <priority>{priority}</priority>\n  </url>"
        )

    for cat in categories:
        urls.append(
            f"  <url>\n    <loc>{site_url}/categories/{cat.slug}</loc>\n"
            f"    <lastmod>{cat.updated_at.strftime('%Y-%m-%d')}</lastmod>\n"
            f"    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>"
        )

    for prod in products:
        urls.append(
            f"  <url>\n    <loc>{site_url}/products/{prod.slug}-{prod.id}</loc>\n"
            f"    <lastmod>{prod.updated_at.strftime('%Y-%m-%d')}</lastmod>\n"
            f"    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>"
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>"
    )
    return FastAPIResponse(content=xml, media_type="application/xml")

