import os

# Database Defaults
DEFAULT_DB_ENGINE = "django.db.backends.sqlite3"
DEFAULT_DB_NAME = "db.sqlite3"
DEFAULT_DB_USER = "user"
DEFAULT_DB_HOST = "localhost"
DEFAULT_DB_PORT = "5432"

# Security Defaults
DEFAULT_DEBUG = 1
DEFAULT_ALLOWED_HOSTS = "localhost 127.0.0.1 [::1]"

# URLs
FRONTEND_URL = "http://localhost:3000"

# Celery & Redis
DEFAULT_REDIS_URL = "redis://redis:6379/0"
