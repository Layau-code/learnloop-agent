from __future__ import annotations

from app.db.session import SessionLocal
from app.services.material_ingest import MaterialIngestService
from app.tasks.celery_app import celery_app


@celery_app.task(name="materials.parse")
def parse_material_task(material_id: str) -> dict[str, str]:
    db = SessionLocal()
    try:
        result = MaterialIngestService(db).run(material_id)
        return {
            "status": "succeeded",
            "material_id": material_id,
            "workflow_run_id": result["workflow_run"].id,
        }
    finally:
        db.close()
