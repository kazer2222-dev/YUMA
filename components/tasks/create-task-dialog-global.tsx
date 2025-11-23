'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AITextEditor } from '@/components/ai/ai-text-editor';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToastHelpers } from '@/components/toast';
import { Loader2, Plus } from 'lucide-react';

interface Space {
  id: string;
  name: string;
  slug: string;
  ticker: string;
}

interface Status {
  id: string;
  name: string;
  key: string;
  isStart: boolean;
}

interface CreateTaskDialogGlobalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
  spaces: Space[];
}

export function CreateTaskDialogGlobal({
  open,
  onOpenChange,
  onTaskCreated,
  spaces
}: CreateTaskDialogGlobalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSpaceSlug, setSelectedSpaceSlug] = useState<string>('');
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [aiMenusOpen, setAiMenusOpen] = useState(false);
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    priority: 'NORMAL',
    tags: '',
    startDate: '',
    dueDate: '',
    estimate: '',
    assigneeId: '',
    statusId: '',
  });
  const { success, error: showError } = useToastHelpers();

  // Fetch statuses when space is selected
  useEffect(() => {
    if (selectedSpaceSlug) {
      fetch(`/api/spaces/${selectedSpaceSlug}/statuses`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStatuses(data.statuses);
            // Set default status
            const defaultStatus = data.statuses.find((s: Status) => s.isStart) || data.statuses[0];
            if (defaultStatus) {
              setFormData(prev => ({ ...prev, statusId: defaultStatus.id }));
            }
          }
        })
        .catch(err => {
          console.error('Failed to fetch statuses:', err);
        });
    } else {
      setStatuses([]);
      setFormData(prev => ({ ...prev, statusId: '' }));
    }
  }, [selectedSpaceSlug]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedSpaceSlug('');
      setFormData({
        summary: '',
        description: '',
        priority: 'NORMAL',
        tags: '',
        startDate: '',
        dueDate: '',
        estimate: '',
        assigneeId: '',
        statusId: '',
      });
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!selectedSpaceSlug) {
      setError('Please select a space');
      setLoading(false);
      return;
    }

    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await fetch(`/api/spaces/${selectedSpaceSlug}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          tags,
          assigneeId: formData.assigneeId || null,
          startDate: formData.startDate || null,
          dueDate: formData.dueDate || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        success('Task created successfully', `"${formData.summary}" has been created`);
        onTaskCreated();
        onOpenChange(false);
      } else {
        const errorMessage = data.message || 'Failed to create task';
        setError(errorMessage);
        showError('Failed to create task', errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Failed to create task';
      setError(errorMessage);
      showError('Network Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Don't allow closing if AI menus are open
      if (!newOpen && aiMenusOpen) {
        return;
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Space Selection */}
          <div className="space-y-2">
            <Label htmlFor="space">Workspace *</Label>
            <Select
              value={selectedSpaceSlug}
              onValueChange={setSelectedSpaceSlug}
              disabled={loading}
              required
            >
              <SelectTrigger className="notion-input h-11">
                <SelectValue placeholder="Select a workspace" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.slug}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <div className="task-description-editor">
              <AITextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Add more details... Type / to activate AI"
                rows={3}
                onMenuStateChange={setAiMenusOpen}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                disabled={loading}
              >
                <SelectTrigger className="notion-input h-11">
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.statusId || ""}
                onValueChange={(value) => setFormData({ ...formData, statusId: value })}
                disabled={loading || !selectedSpaceSlug || statuses.length === 0}
              >
                <SelectTrigger className="notion-input h-11">
                  <SelectValue placeholder={selectedSpaceSlug ? "Select status" : "Select workspace first"} />
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
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                disabled={loading}
                className="notion-input h-11"
              />
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="notion-button-ghost"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedSpaceSlug} className="notion-button-primary">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}







