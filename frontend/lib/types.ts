export type WorkflowRun = {
  id: string;
  user_id: string;
  workflow_type: string;
  status: string;
  current_node: string | null;
  created_at: string;
};

