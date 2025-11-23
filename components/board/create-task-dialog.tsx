'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Calendar from 'react-calendar';
import { ReminderSetter } from '@/components/ai/reminder-setter';
import { AITextEditor } from '@/components/ai/ai-text-editor';

interface CreateTaskDialogProps {
  spaceSlug: string;
  statuses: Array<{
    id: string;
    name: string;
    key: string;
    color?: string;
    isStart?: boolean;
  }>;
  onTaskCreated?: () => void;
  statusId?: string; // Optional: pre-select a specific status
  trigger?: React.ReactNode; // Optional: custom trigger element
  open?: boolean; // Optional: controlled open state
  onOpenChange?: (open: boolean) => void; // Optional: controlled onOpenChange
}

export function CreateTaskDialog({ spaceSlug, statuses, onTaskCreated, statusId, trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: CreateTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [dueCalendarOpen, setDueCalendarOpen] = useState(false);
  const [aiMenusOpen, setAiMenusOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    priority: 'NORMAL',
    statusId: statusId || statuses.find(s => s.isStart)?.id || statuses[0]?.id || '',
    startDate: '',
    dueDate: '',
    estimate: '',
    tags: '',
  });

  // Reset form when dialog opens or statusId changes
  useEffect(() => {
    if (open) {
      setError('');
      setFormData({
        summary: '',
        description: '',
        priority: 'NORMAL',
        statusId: statusId || statuses.find(s => s.isStart)?.id || statuses[0]?.id || '',
        startDate: '',
        dueDate: '',
        estimate: '',
        tags: '',
      });
    }
  }, [open, statusId, statuses]);

  const formatDateDDMMYYYY = (dateString: string): string => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate that we have a statusId
      if (!formData.statusId) {
        setError('Please select a status for this task');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/spaces/${spaceSlug}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setOpen(false);
        setFormData({
          summary: '',
          description: '',
          priority: 'NORMAL',
          statusId: statuses.find(s => s.isStart)?.id || statuses[0]?.id || '',
          startDate: '',
          dueDate: '',
          estimate: '',
          tags: '',
        });
        onTaskCreated?.();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      setError('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Don't allow closing if AI menus are open
    if (!newOpen && aiMenusOpen) {
      return;
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Input
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Task title..."
                className="text-3xl font-bold border-none shadow-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <AITextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Add more details... Type / to activate AI"
                rows={3}
                onMenuStateChange={setAiMenusOpen}
              />
            </div>
            
            {formData.dueDate && (
              <div className="grid gap-2">
                <Label>Set Reminder</Label>
                <ReminderSetter
                  taskTitle={formData.summary}
                  dueDate={formData.dueDate}
                  onReminderSet={(reminder) => {
                    console.log('Reminder set:', reminder);
                    // You can implement reminder logic here
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOWEST">Lowest</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="HIGHEST">Highest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.statusId}
                  onValueChange={(value) => setFormData({ ...formData, statusId: value })}
                  disabled={statuses.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={statuses.length > 0 ? "Select status" : "No statuses"} />
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
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal relative"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="flex-1">{formData.startDate ? formatDateDDMMYYYY(formData.startDate) : 'Select date'}</span>
                      {formData.startDate && (
                        <X
                          className="h-4 w-4 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, startDate: '' });
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100] date-picker-popover shadow-lg" align="start">
                    <div className="date-picker-calendar-wrapper">
                      <Calendar
                        onChange={(value: any) => {
                          if (value instanceof Date) {
                            const y = value.getFullYear();
                            const m = String(value.getMonth() + 1).padStart(2, '0');
                            const d = String(value.getDate()).padStart(2, '0');
                            setFormData({ ...formData, startDate: `${y}-${m}-${d}` });
                            setStartCalendarOpen(false);
                          }
                        }}
                        value={formData.startDate ? (() => { const [y,m,d] = formData.startDate.split('-').map(Number); return new Date(y, (m as number)-1, d); })() : null}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover open={dueCalendarOpen} onOpenChange={setDueCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal relative"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="flex-1">{formData.dueDate ? formatDateDDMMYYYY(formData.dueDate) : 'Select date'}</span>
                      {formData.dueDate && (
                        <X
                          className="h-4 w-4 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, dueDate: '' });
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100] date-picker-popover shadow-lg" align="start">
                    <div className="date-picker-calendar-wrapper">
                      <Calendar
                        onChange={(value: any) => {
                          if (value instanceof Date) {
                            const y = value.getFullYear();
                            const m = String(value.getMonth() + 1).padStart(2, '0');
                            const d = String(value.getDate()).padStart(2, '0');
                            setFormData({ ...formData, dueDate: `${y}-${m}-${d}` });
                            setDueCalendarOpen(false);
                          }
                        }}
                        value={formData.dueDate ? (() => { const [y,m,d] = formData.dueDate.split('-').map(Number); return new Date(y, (m as number)-1, d); })() : null}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="estimate">Estimate</Label>
                <Input
                  id="estimate"
                  value={formData.estimate}
                  onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
                  placeholder="e.g., 2h, 1d"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
