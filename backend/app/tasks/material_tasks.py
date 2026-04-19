from __future__ import annotations

from app.tasks.celery_app import celery_app


@celery_app.task(name="materials.parse")
def parse_material_task(material_id: str) -> dict[str, str]:
    return {
        "status": "queued",
        "material_id": material_id,
        "message": "Material parsing workflow will be implemented in P1.",
    }

