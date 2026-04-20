from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import chat, drafts, health, knowledge, materials, settings, workflow_runs

api_router = APIRouter()
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(drafts.router, prefix="/drafts", tags=["drafts"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(workflow_runs.router, prefix="/workflow-runs", tags=["workflow-runs"])
