from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision = "20260419_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "user_profiles",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("learning_goals", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("preferred_topics", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("writing_style_profile", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("answer_style_profile", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("locale", sa.String(length=32), nullable=False, server_default="zh-CN"),
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Asia/Shanghai"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "materials",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("source_type", sa.String(length=32), nullable=False),
        sa.Column("source_uri", sa.Text(), nullable=True),
        sa.Column("mime_type", sa.String(length=128), nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("normalized_text", sa.Text(), nullable=True),
        sa.Column("parse_status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("parse_error", sa.Text(), nullable=True),
        sa.Column("topic_hint", sa.String(length=128), nullable=True),
        sa.Column("language", sa.String(length=16), nullable=True),
        sa.Column("imported_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("idx_materials_user_imported_at", "materials", ["user_id", "imported_at"])

    op.create_table(
        "material_chunks",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("material_id", sa.String(length=36), sa.ForeignKey("materials.id"), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("heading_path", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("embedding", Vector(1536), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("idx_material_chunks_material_id", "material_chunks", ["material_id"])

    op.create_table(
        "knowledge_items",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("item_type", sa.String(length=32), nullable=False),
        sa.Column("topic", sa.String(length=128), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("content_md", sa.Text(), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("source_scope", sa.String(length=32), nullable=False),
        sa.Column("mastery_score", sa.Float(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("review_due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("idx_knowledge_items_user_topic", "knowledge_items", ["user_id", "topic"])

    op.create_table(
        "knowledge_links",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("material_id", sa.String(length=36), sa.ForeignKey("materials.id"), nullable=False),
        sa.Column("knowledge_item_id", sa.String(length=36), sa.ForeignKey("knowledge_items.id"), nullable=False),
        sa.Column("relation_type", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "chat_threads",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("active_material_id", sa.String(length=36), sa.ForeignKey("materials.id"), nullable=True),
        sa.Column("active_topic", sa.String(length=128), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("last_active_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("thread_id", sa.String(length=36), sa.ForeignKey("chat_threads.id"), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("message_type", sa.String(length=32), nullable=False),
        sa.Column("content_md", sa.Text(), nullable=False),
        sa.Column("citations_json", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("retrieval_context_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("model_name", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "distill_drafts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("source_type", sa.String(length=32), nullable=False),
        sa.Column("source_ref_id", sa.String(length=36), nullable=False),
        sa.Column("draft_type", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content_md", sa.Text(), nullable=False),
        sa.Column("structure_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "reflection_reports",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("report_date", sa.Date(), nullable=False),
        sa.Column("summary_md", sa.Text(), nullable=False),
        sa.Column("highlights_json", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("blockers_json", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("suggested_actions_json", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("linked_plan_id", sa.String(length=36), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_unique_constraint("uq_reflection_reports_user_date", "reflection_reports", ["user_id", "report_date"])

    op.create_table(
        "learning_plans",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("plan_type", sa.String(length=16), nullable=False),
        sa.Column("plan_date", sa.Date(), nullable=False),
        sa.Column("goal", sa.Text(), nullable=False),
        sa.Column("evidence_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_by", sa.String(length=16), nullable=False, server_default="agent"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "learning_tasks",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("plan_id", sa.String(length=36), sa.ForeignKey("learning_plans.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("related_topic", sa.String(length=128), nullable=True),
        sa.Column("estimated_minutes", sa.Integer(), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("task_status", sa.String(length=32), nullable=False, server_default="todo"),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("source_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "citations",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("target_type", sa.String(length=32), nullable=False),
        sa.Column("target_id", sa.String(length=36), nullable=False),
        sa.Column("source_type", sa.String(length=32), nullable=False),
        sa.Column("source_ref_id", sa.String(length=36), nullable=False),
        sa.Column("quote_text", sa.Text(), nullable=True),
        sa.Column("locator_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "workflow_runs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("workflow_type", sa.String(length=64), nullable=False),
        sa.Column("source_type", sa.String(length=32), nullable=True),
        sa.Column("source_ref_id", sa.String(length=36), nullable=True),
        sa.Column("thread_id", sa.String(length=36), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="queued"),
        sa.Column("current_node", sa.String(length=64), nullable=True),
        sa.Column("input_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("output_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "workflow_checkpoints",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("run_id", sa.String(length=36), sa.ForeignKey("workflow_runs.id"), nullable=False),
        sa.Column("node_name", sa.String(length=64), nullable=False),
        sa.Column("state_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("sequence_no", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "event_logs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("user_profiles.id"), nullable=False),
        sa.Column("run_id", sa.String(length=36), sa.ForeignKey("workflow_runs.id"), nullable=True),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("event_name", sa.String(length=128), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "feedback_records",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("target_type", sa.String(length=32), nullable=False),
        sa.Column("target_id", sa.String(length=36), nullable=False),
        sa.Column("feedback_type", sa.String(length=32), nullable=False),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("feedback_records")
    op.drop_table("event_logs")
    op.drop_table("workflow_checkpoints")
    op.drop_table("workflow_runs")
    op.drop_table("citations")
    op.drop_table("learning_tasks")
    op.drop_table("learning_plans")
    op.drop_constraint("uq_reflection_reports_user_date", "reflection_reports", type_="unique")
    op.drop_table("reflection_reports")
    op.drop_table("distill_drafts")
    op.drop_table("chat_messages")
    op.drop_table("chat_threads")
    op.drop_table("knowledge_links")
    op.drop_index("idx_knowledge_items_user_topic", table_name="knowledge_items")
    op.drop_table("knowledge_items")
    op.drop_index("idx_material_chunks_material_id", table_name="material_chunks")
    op.drop_table("material_chunks")
    op.drop_index("idx_materials_user_imported_at", table_name="materials")
    op.drop_table("materials")
    op.drop_table("user_profiles")

