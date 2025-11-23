'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, GitBranch, Check, Loader2 } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';
import { WorkflowDesignerDialog } from './workflow-designer-dialog';
import type { WorkflowSummary } from '@/lib/workflows/types';

// Wrapper to handle spaceSlug -> spaceId conversion
function WorkflowDesignerDialogWrapper({
  spaceSlug,
  open,
  onOpenChange,
  onSaved,
}: {
  spaceSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (workflow: any, options?: { assign?: boolean }) => void;
}) {
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetch(`/api/spaces/${spaceSlug}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSpaceId(data.space.id);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [open, spaceSlug]);

  if (loading || !spaceId) {
    return null;
  }

  return (
    <WorkflowDesignerDialog
      spaceId={spaceId}
      workflowId={null}
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
    />
  );
}

interface WorkflowSelectionProps {
  onSelect: (choice: 'default' | 'custom', workflowId?: string | null) => void;
  spaceSlug: string;
  saving?: boolean;
  open?: boolean;
  onCancel?: () => void;
  mode?: 'select' | 'choose';
}

export function WorkflowSelection({
  onSelect,
  spaceSlug,
  saving = false,
  open,
  onCancel,
  mode = 'choose',
}: WorkflowSelectionProps) {
  const { error: showError } = useToastHelpers();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'select' || open) {
      fetchWorkflows();
    }
  }, [mode, open, spaceSlug]);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      // Extract spaceId from spaceSlug - we'll need to fetch it or pass it as prop
      // For now, using a workaround
      const spaceResponse = await fetch(`/api/spaces/${spaceSlug}`, { credentials: 'include' });
      const spaceData = await spaceResponse.json();
      if (!spaceData.success) {
        throw new Error('Failed to fetch space');
      }
      const spaceId = spaceData.space.id;

      const response = await fetch(`/api/workflows?spaceId=${spaceId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setWorkflows(data.workflows || []);
      } else {
        showError(data.message || 'Failed to fetch workflows');
      }
    } catch (err) {
      console.error('Failed to fetch workflows', err);
      showError('Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleDefaultWorkflow = () => {
    onSelect('default', null);
  };

  const handleCustomWorkflow = () => {
    if (mode === 'select') {
      // Already in selection mode, just show the list
      return;
    }
    onSelect('custom');
  };

  const handleSelectExisting = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    onSelect('custom', workflowId);
  };

  const handleCreateNew = () => {
    setDesignerOpen(true);
  };

  const handleDesignerSaved = (workflow: any, options?: { assign?: boolean }) => {
    setDesignerOpen(false);
    onSelect('custom', workflow.id);
  };

  const content = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Workflow Type</h3>
        <p className="text-sm text-muted-foreground">
          Select how tasks created from this template will move through statuses.
        </p>
      </div>

      {/* Default Workflow Option */}
      <Card
        className="cursor-pointer hover:border-primary transition-colors"
        onClick={handleDefaultWorkflow}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">Default Workflow</CardTitle>
              <CardDescription className="mt-2">
                The workflow automatically adapts to the board's statuses. Tasks can move from any status to any other
                status available on the board. No additional configuration required.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Custom Workflow Option */}
      <Card
        className="cursor-pointer hover:border-primary transition-colors"
        onClick={handleCustomWorkflow}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">Custom Workflow</CardTitle>
              <CardDescription className="mt-2">
                Define a custom workflow with specific status transitions and rules. Choose from existing workflows or
                create a new one.
              </CardDescription>
            </div>
            <GitBranch className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>

      {/* Workflow List (shown when custom is selected in select mode) */}
      {mode === 'select' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Select Workflow</h3>
            <Button onClick={handleCreateNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create New Workflow
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : workflows.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="mb-4">No workflows available.</p>
                <Button onClick={handleCreateNew} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {workflows.map((workflow) => (
                <Card
                  key={workflow.id}
                  className={`cursor-pointer hover:border-primary transition-colors ${
                    selectedWorkflowId === workflow.id ? 'border-primary' : ''
                  }`}
                  onClick={() => handleSelectExisting(workflow.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{workflow.name}</h4>
                          {workflow.isDefault && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              Default
                            </span>
                          )}
                        </div>
                        {workflow.description && (
                          <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
                        )}
                      </div>
                      {selectedWorkflowId === workflow.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {saving && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Saving template...</span>
        </div>
      )}
    </div>
  );

  if (mode === 'select' && open !== undefined) {
    return (
      <>
        <Dialog open={open} onOpenChange={() => onCancel?.()}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Workflow</DialogTitle>
              <DialogDescription>
                Choose an existing workflow or create a new one for this template.
              </DialogDescription>
            </DialogHeader>
            {content}
            {onCancel && (
              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {designerOpen && (
          <WorkflowDesignerDialogWrapper
            spaceSlug={spaceSlug}
            open={designerOpen}
            onOpenChange={setDesignerOpen}
            onSaved={handleDesignerSaved}
          />
        )}
      </>
    );
  }

  return content;
}

