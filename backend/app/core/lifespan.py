"""
FastAPI lifespan event handler.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for FastAPI application.
    Handles startup and shutdown events.
    """
    # Startup
    print("🚀 Application starting up...")
    
    # MongoDB connection (disabled — re-enable when MongoDB is available)
    # from app.core.mongo import mongodb
    # mongodb.connect()

    # NOTE: Database tables are managed by Alembic migrations
    # Run: alembic upgrade head
    # For development auto-creation, uncomment below:
    # from app.core.database import init_db
    # await init_db()

    from app.core.scheduler import scheduler, setup_scheduler
    setup_scheduler()
    scheduler.start()
    print("Scheduler started")

    yield

    # Mongo Shutdown (disabled)
    # mongodb.close()

    scheduler.shutdown(wait=False)
    print("Scheduler stopped")

    # Shutdown
    print("👋 Application shutting down...")
