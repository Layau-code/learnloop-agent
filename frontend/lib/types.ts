export type WorkflowRun = {
  id: string;
  user_id: string;
  workflow_type: string;
  status: string;
  current_node: string | null;
  created_at: string;
};

export type Material = {
  id: string;
  user_id: string;
  title: string;
  source_type: "file" | "url" | "note";
  source_uri: string | null;
  mime_type: string | null;
  raw_text: string | null;
  normalized_text: string | null;
  parse_status: string;
  parse_error: string | null;
  topic_hint: string | null;
  language: string | null;
  imported_at: string;
  updated_at: string;
};

export type MaterialChunk = {
  id: string;
  material_id: string;
  chunk_index: number;
  heading_path: string | null;
  content: string;
  token_count: number | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type MaterialIngestResponse = {
  material: Material;
  workflow_run_id: string;
  generated_draft_ids: string[];
  chunk_count: number;
};

export type DistillDraft = {
  id: string;
  user_id: string;
  source_type: string;
  source_ref_id: string;
  draft_type: string;
  title: string;
  content_md: string;
  structure_json: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type DraftApproveResponse = {
  draft: DistillDraft;
  knowledge_item_id: string;
};

export type KnowledgeItem = {
  id: string;
  user_id: string;
  title: string;
  item_type: string;
  topic: string | null;
  summary: string | null;
  content_md: string;
  tags: string[];
  source_scope: string;
  mastery_score: number | null;
  confidence_score: number | null;
  review_due_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatThread = {
  id: string;
  user_id: string;
  title: string;
  active_material_id: string | null;
  active_topic: string | null;
  status: string;
  last_active_at: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  message_type: string;
  content_md: string;
  citations_json: Array<Record<string, unknown>>;
  retrieval_context_json: Record<string, unknown>;
  model_name: string | null;
  created_at: string;
};

export type StudyQaAskResponse = {
  thread: ChatThread;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  workflow_run_id: string;
};
