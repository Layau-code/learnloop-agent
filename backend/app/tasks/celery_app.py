from __future__ import annotations

from celery import Celery

from app.core.config import settings

celery_app = Celery("myagent", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_track_started=True,
    worker_prefetch_multiplier=1,
)

