from __future__ import annotations

from app.workflows.base import WorkflowDefinition

study_qa_workflow = WorkflowDefinition(
    workflow_type="study_qa",
    nodes=[
        "ParseQuestion",
        "LoadStudyContext",
        "RetrieveEvidence",
        "SynthesizeAnswer",
        "PersistChat",
        "GenerateDistillDraft",
        "OptionalApproval",
        "CompleteRun",
    ],
)

