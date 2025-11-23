'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus } from 'lucide-react';

interface Status {
  id: string;
  name: string;
  key: string;
  color?: string;
  isStart?: boolean;
}

interface CustomField {
  id: string;
  name: string;
  key: string;
  type: string;
  options?: any;
  required: boolean;
}

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

interface CreateTaskDialogInlineProps {
  spaceSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
  statuses: Status[];
  customFields: CustomField[];
  users: User[];
}

export function CreateTaskDialogInline({
  spaceSlug,
  open,
  onOpenChange,
  onTaskCreated,
  statuses,
  customFields,
  users
}: CreateTaskDialogInlineProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    priority: 'NORMAL',
    tags: '',
    dueDate: '',
    estimate: '',
    assigneeId: '',
    statusId: '',
    customFieldValues: [] as any[]
  });

  useEffect(() => {
    if (open && statuses.length > 0 && !formData.statusId) {
      const defaultStatus = statuses.find(s => s.isStart) || statuses[0];
      setFormData(prev => ({ ...prev, statusId: defaultStatus.id }));
    }
  }, [open, statuses]);

  useEffect(() => {
    if (!open) {
      setFormData({
        summary: '',
        description: '',
        priority: 'NORMAL',
        tags: '',
        dueDate: '',
        estimate: '',
        assigneeId: '',
        statusId: '',
        customFieldValues: []
      });
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.summary) {
      setError('Task summary is required');
      setLoading(false);
      return;
    }

    if (!formData.statusId) {
      setError('Task status is required');
      setLoading(false);
      return;
    }

    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await fetch(`/api/spaces/${spaceSlug}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          summary: formData.summary,
          description: formData.description,
          priority: formData.priority,
          tags,
          assigneeId: formData.assigneeId || null,
          dueDate: formData.dueDate || null,
          estimate: formData.estimate,
          statusId: formData.statusId,
          customFieldValues: formData.customFieldValues
        }),
      });

      const data = await response.json();

      if (data.success) {
        onTaskCreated();
        onOpenChange(false);
      } else {
        setError(data.message || 'Failed to create task');
      }
    } catch (err) {
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="notion-heading-2">Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary">Task Summary *</Label>
            <Input
              id="summary"
              placeholder="What needs to be done?"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              required
              disabled={loading}
              className="notion-input h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide more details about this task..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              className="notion-input min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGHEST">Highest</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="LOWEST">Lowest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.statusId || ""}
                onValueChange={(value) => setFormData({ ...formData, statusId: value })}
                disabled={loading || statuses.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.length > 0 ? (
                    statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No statuses available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={formData.assigneeId || "none"}
                onValueChange={(value) => setFormData({ ...formData, assigneeId: value === "none" ? "" : value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                disabled={loading}
                className="notion-input h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="tag1, tag2, tag3"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                disabled={loading}
                className="notion-input h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimate">Estimate</Label>
              <Input
                id="estimate"
                placeholder="2h, 1d, 5 points"
                value={formData.estimate}
                onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
                disabled={loading}
                className="notion-input h-11"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="notion-button-ghost">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.summary || !formData.statusId} className="notion-button-primary">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}















