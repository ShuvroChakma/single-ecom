"""
APScheduler configuration for background jobs.
Runs BAJUS rate sync every hour.
"""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def _sync_bajus_job() -> None:
    """Scheduled job: scrape BAJUS rates and save to DB."""
    logger.info("Scheduled BAJUS sync starting...")
    try:
        from app.core.database import async_session_maker
        from app.modules.audit.service import AuditService
        from app.modules.rates.service import DailyRateService

        async with async_session_maker() as session:
            audit_service = AuditService()
            service = DailyRateService(session, audit_service)
            result = await service.sync_from_bajus(actor_id="scheduler")
            logger.info("Scheduled BAJUS sync complete: %s", result.message)
    except Exception as exc:
        logger.error("Scheduled BAJUS sync failed: %s", exc, exc_info=True)


def setup_scheduler() -> None:
    """Register all scheduled jobs."""
    scheduler.add_job(
        _sync_bajus_job,
        trigger=IntervalTrigger(hours=1),
        id="bajus_hourly_sync",
        name="BAJUS Hourly Rate Sync",
        replace_existing=True,
        misfire_grace_time=600,
    )
    logger.info("Scheduled jobs registered: %s", [job.name for job in scheduler.get_jobs()])
