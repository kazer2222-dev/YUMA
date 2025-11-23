'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Switch } from '../ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Settings,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Status {
  id: string;
  name: string;
  key: string;
  color?: string;
  description?: string;
  order: number;
  isStart: boolean;
  isDone: boolean;
  wipLimit?: number;
  hidden?: boolean;
}

interface BoardConfigurationProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusesUpdated?: () => void;
}

export function BoardConfiguration({ 
  boardId, 
  open, 
  onOpenChange,
  onStatusesUpdated 
}: BoardConfigurationProps) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    color: '#808080',
    description: '',
    isStart: false,
    isDone: false,
    wipLimit: ''
  });

  useEffect(() => {
    if (open) {
      fetchStatuses();
    }
  }, [open, boardId]);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      setError('');
      // Diagnostic: print which boardId is being hit
      if (!boardId) {
        setError('No board selected (boardId is missing).');
        console.error('BoardConfiguration boardId is undefined/null:', boardId);
        return;
      }
      const response = await fetch(`/api/boards/${boardId}/statuses`, {
        credentials: 'include'
      });
      const data = await response.json();
      // Diagnostic: log API error and data
      if (!response.ok) {
        console.error('Statuses API error:', response.status, data);
      }
      if (data.success) {
        setStatuses(data.statuses);
      } else {
        setError(data.message || `Failed to load statuses. (Board ID: ${boardId})`);
        console.error('Board statuses fetch: ', data.message, data, 'BoardId:', boardId);
      }
    } catch (err) {
      setError(`Failed to fetch statuses. (Board ID: ${boardId})`);
      console.error('Fetch statuses error:', err, 'BoardId:', boardId);
    } finally {
      setLoading(false);
    }
  };

  const generateKeyFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      key: formData.key || generateKeyFromName(name)
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.key) {
      setError('Name and key are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        name: formData.name,
        key: formData.key,
        color: formData.color,
        description: formData.description || undefined,
        isStart: formData.isStart,
        isDone: formData.isDone,
        wipLimit: formData.wipLimit ? parseInt(formData.wipLimit) : undefined
      };

      if (editingStatus) {
        // Update existing status
        const response = await fetch(
          `/api/boards/${boardId}/statuses/${editingStatus.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
          }
        );

        const data = await response.json();
        if (data.success) {
          await fetchStatuses();
          setIsAddDialogOpen(false);
          setEditingStatus(null);
          resetForm();
          onStatusesUpdated?.();
        } else {
          setError(data.message || 'Failed to update status');
        }
      } else {
        // Create new status
        const response = await fetch(
          `/api/boards/${boardId}/statuses`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
          }
        );

        const data = await response.json();
        if (data.success) {
          await fetchStatuses();
          setIsAddDialogOpen(false);
          resetForm();
          onStatusesUpdated?.();
        } else {
          setError(data.message || 'Failed to create status');
        }
      }
    } catch (err) {
      setError('Failed to save status');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (status: Status) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      key: status.key,
      color: status.color || '#808080',
      description: status.description || '',
      isStart: status.isStart,
      isDone: status.isDone,
      wipLimit: status.wipLimit?.toString() || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (statusId: string) => {
    if (!confirm('Are you sure you want to delete this status? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        `/api/boards/${boardId}/statuses/${statusId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      const data = await response.json();
      if (data.success) {
        await fetchStatuses();
        onStatusesUpdated?.();
      } else {
        setError(data.message || 'Failed to delete status');
      }
    } catch (err) {
      setError('Failed to delete status');
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleToggleVisibility = async (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    if (!status) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/boards/${boardId}/statuses/${statusId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ hidden: !status.hidden })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        await fetchStatuses();
        onStatusesUpdated?.();
      }
    } catch (err) {
      setError('Failed to toggle status visibility');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = statuses.findIndex((s) => s.id === active.id);
    const newIndex = statuses.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const items = Array.from(statuses);
    const [reorderedItem] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, reorderedItem);

    // Update order values
    const updatedStatuses = items.map((status, index) => ({
      ...status,
      order: index + 1
    }));

    setStatuses(updatedStatuses);

    // Update order on server
    try {
      await Promise.all(
        updatedStatuses.map((status, index) =>
          fetch(`/api/boards/${boardId}/statuses/${status.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ order: index + 1 })
          })
        )
      );
      onStatusesUpdated?.();
    } catch (err) {
      console.error('Failed to update order:', err);
      await fetchStatuses(); // Revert on error
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      key: '',
      color: '#808080',
      description: '',
      isStart: false,
      isDone: false,
      wipLimit: ''
    });
    setEditingStatus(null);
    setError('');
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    resetForm();
  };

  // StatusItem component for drag and drop
  const StatusItem = ({ 
    status, 
    onEdit, 
    onDelete,
    onToggleVisibility
  }: { 
    status: Status; 
    onEdit: (status: Status) => void; 
    onDelete: (id: string) => void;
    onToggleVisibility: (id: string) => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: status.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <Card ref={setNodeRef} style={style} className={isDragging ? 'shadow-lg' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div
              {...attributes}
              {...listeners}
              className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{
                backgroundColor: status.color || '#808080'
              }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">
                  {status.name}
                </h4>
                {status.isStart && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Start
                  </Badge>
                )}
                {status.isDone && (
                  <Badge variant="outline" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                )}
                {status.wipLimit && (
                  <Badge variant="secondary" className="text-xs">
                    WIP: {status.wipLimit}
                  </Badge>
                )}
              </div>
              {status.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {status.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Key: <code className="bg-muted px-1 rounded">{status.key}</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-2">
                <Label htmlFor={`visible-${status.id}`} className="text-xs text-muted-foreground">
                  Visible
                </Label>
                <Switch
                  id={`visible-${status.id}`}
                  checked={!status.hidden}
                  onCheckedChange={() => onToggleVisibility(status.id)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(status)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(status.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Board Configuration
            </DialogTitle>
            <DialogDescription>
              Manage statuses for your board. Drag and drop to reorder.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {statuses.length} status{statuses.length !== 1 ? 'es' : ''} configured
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(true);
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Status
              </Button>
            </div>

            {loading && statuses.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : statuses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No statuses configured. Click "Add Status" to create one.
                </CardContent>
              </Card>
            ) : (
              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={statuses.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {statuses.map((status) => (
                      <StatusItem
                        key={status.id}
                        status={status}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleVisibility={handleToggleVisibility}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Status Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'Edit Status' : 'Add New Status'}
            </DialogTitle>
            <DialogDescription>
              {editingStatus
                ? 'Update the status details below.'
                : 'Create a new status for your board.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., In Progress"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Key *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                  })
                }
                placeholder="e.g., in-progress"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (lowercase, hyphenated)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-16 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="#808080"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wipLimit">WIP Limit (Optional)</Label>
              <Input
                id="wipLimit"
                type="number"
                min="1"
                value={formData.wipLimit}
                onChange={(e) =>
                  setFormData({ ...formData, wipLimit: e.target.value })
                }
                placeholder="e.g., 5"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of tasks allowed in this status
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isStart">Start Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Mark this as the initial status for new tasks
                  </p>
                </div>
                <Switch
                  id="isStart"
                  checked={formData.isStart}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isStart: checked, isDone: checked ? false : formData.isDone })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isDone">Done Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Mark this as the completion status
                  </p>
                </div>
                <Switch
                  id="isDone"
                  checked={formData.isDone}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDone: checked, isStart: checked ? false : formData.isStart })
                  }
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingStatus ? (
                'Update Status'
              ) : (
                'Create Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

