from celery import shared_task
import time

@shared_task
def add(x, y):
    """Example task that adds two numbers."""
    return x + y

@shared_task
def slow_task(duration=5):
    """Example long-running task."""
    time.sleep(duration)
    return f"Task completed after {duration} seconds"
