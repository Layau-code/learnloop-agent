from __future__ import annotations

from app.workflows.base import WorkflowDefinition

material_ingest_workflow = WorkflowDefinition(
    workflow_type="material_ingest",
    nodes=[
        "LoadMaterial",
        "NormalizeContent",
        "ChunkMaterial",
        "IndexChunks",
        "ExtractKnowledgeDraft",
        "DeduplicateDrafts",
        "AwaitApproval",
        "PersistArtifacts",
        "CompleteRun",
    ],
)

