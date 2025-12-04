import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, GitBranch, Edit, Copy, Trash2, MoreVertical, Zap, ArrowLeft } from 'lucide-react';
import { WorkflowDesignerDialog } from '@/components/templates/workflow-designer-dialog';
import type { WorkflowDetail, WorkflowSummary } from '@/lib/workflows/types';
import { useToastHelpers } from '@/components/toast';

interface WorkflowsManagerProps {
  spaceId: string;
  spaceSlug: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  standalone?: boolean;
  onBack?: () => void;
  onEditorOpenChange?: (open: boolean) => void;
}

export function WorkflowsManager({
  spaceId,
  spaceSlug,
  open,
  onOpenChange,
  standalone = false,
  onBack,
  onEditorOpenChange,
}: WorkflowsManagerProps) {
  const { success, error: showError } = useToastHelpers();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false); // Show list first, then editor when creating/editing
  const [designerWorkflowId, setDesignerWorkflowId] = useState<string | null>(null);
  const [designerSeedWorkflow, setDesignerSeedWorkflow] = useState<WorkflowDetail | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchWorkflows = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/workflows?spaceId=${spaceId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setWorkflows(data.workflows || []);
        setErrorMessage('');
      } else {
        const message = data.message || 'Failed to fetch workflows';
        setErrorMessage(message);
        showError(message);
      }
    } catch (err) {
      console.error('Failed to fetch workflows', err);
      const message = 'Failed to fetch workflows';
      setErrorMessage(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [spaceId, showError]);

  useEffect(() => {
    if (standalone || open) {
      fetchWorkflows();
    }
  }, [standalone, open, fetchWorkflows]);

  // In standalone mode, show workflow list first (user can then create/edit workflows)

  const handleCreate = () => {
    setDesignerWorkflowId(null);
    setDesignerSeedWorkflow(null);
    setDesignerOpen(true);
    setShowWorkflowEditor(true);
    onEditorOpenChange?.(true);
  };

  const handleEdit = (workflowId: string) => {
    setDesignerWorkflowId(workflowId);
    setDesignerSeedWorkflow(null);
    setDesignerOpen(true);
    setShowWorkflowEditor(true);
    onEditorOpenChange?.(true);
  };

  const handleDuplicate = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/duplicate?spaceId=${spaceId}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        success('Workflow duplicated successfully.');
        fetchWorkflows();
      } else {
        showError(data.message || 'Failed to duplicate workflow');
      }
    } catch (err) {
      console.error('Failed to duplicate workflow', err);
      showError('Failed to duplicate workflow');
    }
  };

  const handleDelete = (workflow: WorkflowSummary) => {
    setWorkflowToDelete(workflow);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!workflowToDelete) return;
    try {
      const response = await fetch(`/api/workflows/${workflowToDelete.id}?spaceId=${spaceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        success('Workflow deleted successfully.');
        fetchWorkflows();
      } else {
        showError(data.message || 'Failed to delete workflow');
      }
    } catch (err) {
      console.error('Failed to delete workflow', err);
      showError('Failed to delete workflow');
    } finally {
      setDeleteConfirmOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const handleDesignerSaved = useCallback(
    async (workflow: WorkflowSummary) => {
      setDesignerOpen(false);
      setShowWorkflowEditor(false);
      setDesignerWorkflowId(null);
      setDesignerSeedWorkflow(null);
      onEditorOpenChange?.(false);
      await fetchWorkflows();
      success(`Workflow "${workflow.name}" saved.`);
      // In standalone mode, return to list view after saving
      if (standalone) {
        setShowWorkflowEditor(false);
      }
    },
    [fetchWorkflows, success, standalone, onEditorOpenChange],
  );

  const openWorkflowsCount = workflows.length;

  const defaultWorkflowId = useMemo(() => {
    const defaultWorkflow = workflows.find((workflow) => workflow.isDefault);
    return defaultWorkflow?.id ?? null;
  }, [workflows]);

  const content = (
    <div className="space-y-4">
      {!standalone && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {openWorkflowsCount} workflow{openWorkflowsCount === 1 ? '' : 's'} available
          </p>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>
      )}
      {standalone && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {openWorkflowsCount} workflow{openWorkflowsCount === 1 ? '' : 's'} available
          </p>
        </div>
      )}

      {errorMessage && (
        <Alert>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground" />
            <div className="text-center text-muted-foreground">
              <p className="text-sm">No workflows yet</p>
              <p className="text-xs">Use workflows to control how tasks move between statuses.</p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workflows.map((workflow) => {
            const linkedCount = workflow.linkedTemplates?.length ?? 0;
            return (
              <Card key={workflow.id} className="transition-shadow hover:shadow-md self-start">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {workflow.name}
                        {workflow.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                        {workflow.aiOptimized && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Zap className="h-3 w-3" /> AI
                          </Badge>
                        )}
                      </CardTitle>
                      {workflow.description && (
                        <CardDescription>{workflow.description}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(workflow.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(workflow.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(workflow)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>Version {workflow.version}</span>
                    <span>
                      Updated {new Date(workflow.updatedAt).toLocaleDateString()}
                    </span>
                    {linkedCount > 0 ? (
                      <span>{linkedCount} linked template{linkedCount === 1 ? '' : 's'}</span>
                    ) : (
                      <span>No linked templates</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  if (standalone) {
    // In standalone mode, show workflow list or editor in place of overview (matching design pattern)
    return (
      <>
        {showWorkflowEditor ? (
          <WorkflowDesignerDialog
            open={designerOpen || showWorkflowEditor}
            onOpenChange={(value) => {
              setDesignerOpen(value);
              setShowWorkflowEditor(value);
              onEditorOpenChange?.(value);
              if (!value) {
                setDesignerWorkflowId(null);
                setDesignerSeedWorkflow(null);
              }
            }}
            spaceId={spaceId}
            workflowId={designerWorkflowId}
            initialWorkflow={designerSeedWorkflow ?? undefined}
            draftWorkflow={designerSeedWorkflow ?? undefined}
            assignOnSave={false}
            onSaved={(detail) => handleDesignerSaved(detail)}
            standalone={true}
          />
        ) : (
          <div className="flex-1 min-h-0 flex flex-col p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold">Workflows</h1>
                <p className="text-muted-foreground mt-1">
                  Define and maintain the lifecycle rules used across this space.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workflow
                </Button>
              </div>
            </div>
            {content}
          </div>
        )}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Workflow</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{workflowToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={open ?? false} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workflows</DialogTitle>
            <DialogDescription>Define and maintain the lifecycle rules used across this space.</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      {designerOpen ? (
        <WorkflowDesignerDialog
          open={designerOpen}
          onOpenChange={(value) => {
            setDesignerOpen(value);
            if (!value) {
              setDesignerWorkflowId(null);
              setDesignerSeedWorkflow(null);
            }
          }}
          spaceId={spaceId}
          workflowId={designerWorkflowId}
          initialWorkflow={designerSeedWorkflow ?? undefined}
          draftWorkflow={designerSeedWorkflow ?? undefined}
          assignOnSave={false}
          onSaved={(detail) => handleDesignerSaved(detail)}
        />
      ) : null}

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{workflowToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
