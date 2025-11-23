import { WorkflowEditor } from "./workflow-editor";

interface ClickUpWorkflowsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ClickUpWorkflows({
  open = false,
  onOpenChange,
}: ClickUpWorkflowsProps) {
  // Directly show the workflow editor in edit mode
  return (
    <WorkflowEditor
      open={open}
      onOpenChange={onOpenChange}
      workflowName="Task Workflow"
    />
  );
}
