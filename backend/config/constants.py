import os

# Database Defaults
DEFAULT_DB_ENGINE = "django.db.backends.sqlite3"
DEFAULT_DB_NAME = "db.sqlite3"
DEFAULT_DB_USER = "user"
DEFAULT_DB_PASSWORD = "password"
DEFAULT_DB_HOST = "localhost"
DEFAULT_DB_PORT = "5432"

# Security Defaults
DEFAULT_SECRET_KEY = "django-insecure-lz&9$bo6-8&qh@31banop+4bh_k*$!!&8hl2m^7%bo+n4t&g)c"
DEFAULT_DEBUG = 1
DEFAULT_ALLOWED_HOSTS = "localhost 127.0.0.1 [::1]"

# URLs
FRONTEND_URL = "http://localhost:3000"

# Celery & Redis
REDIS_URL = "redis://redis:6379/0"
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
