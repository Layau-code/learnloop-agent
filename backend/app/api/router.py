from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import health, settings, workflow_runs

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(workflow_runs.router, prefix="/workflow-runs", tags=["workflow-runs"])

