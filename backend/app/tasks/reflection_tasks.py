from __future__ import annotations

from app.tasks.celery_app import celery_app


@celery_app.task(name="reflections.generate_daily")
def generate_daily_reflection_task(report_date: str) -> dict[str, str]:
    return {
        "status": "queued",
        "report_date": report_date,
        "message": "Daily reflection workflow will be implemented in P3.",
    }

