from __future__ import annotations

from app.workflows.base import WorkflowDefinition

daily_reflection_workflow = WorkflowDefinition(
    workflow_type="daily_reflection",
    nodes=[
        "CollectDailyEvents",
        "AnalyzeLearningState",
        "GenerateReflectionDraft",
        "GeneratePlanDraft",
        "AwaitPlanApproval",
        "PersistReflectionAndPlan",
        "CompleteRun",
    ],
)

