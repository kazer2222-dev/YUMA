'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AITextEditor } from '@/components/ai/ai-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Save, Loader2, Calendar as CalendarIcon, Trash, Plus } from 'lucide-react';
import Calendar from 'react-calendar';
import { Badge } from '@/components/ui/badge';
import { TaskBreadcrumb } from '@/components/tasks/task-breadcrumb';
import { TemplateFieldRenderer } from '@/components/templates/template-field-renderer';
import type { TemplateField, Template } from '@/components/templates/template-types';
import {
  applyTemplateMetadata,
  extractTemplateMetadata,
  TemplateMetadata,
  templateToDefinition,
  TemplateDefinition,
  metadataToTemplateValues,
  normalizeTemplateFieldValue,
  buildTemplateMetadata,
  isTemplateFieldValueEmpty
} from '@/lib/template-metadata';

export interface RoadmapTask {
  id: string;
  number?: number;
  summary: string;
  description?: string;
  startDate?: string | Date;
  dueDate?: string | Date;
  status?: {
    id: string;
    name: string;
    color?: string;
  };
  assignee?: {
    id: string;
    name?: string;
    email: string;
  };
  priority: string;
  space?: {
    ticker: string;
    name?: string;
  };
  sprint?: {
    id: string;
    name: string;
    state?: string;
  } | null;
  sprints?: Array<{
    id: string;
    name: string;
    state?: string;
  }> | null;
  customFieldValues?: Array<{
    customField: {
      id: string;
      name: string;
    };
    value: any;
  }>;
}

interface RoadmapTaskEditorProps {
  task: RoadmapTask | null;
  spaceSlug: string;
  statuses: Array<{ id: string; name: string; color?: string }>;
  users: Array<{ id: string; name?: string; email: string }>;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onNavigateToFullPage: () => void;
}

// Helper function to format date as DD/MM/YYYY
function formatDateDDMMYYYY(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatPriority(priority: string): string {
  const priorityMap: { [key: string]: string } = {
    HIGHEST: 'Highest',
    HIGH: 'High',
    NORMAL: 'Normal',
    LOW: 'Low',
    LOWEST: 'Lowest'
  };
  return priorityMap[priority] || priority;
}

export function RoadmapTaskEditor({
  task,
  spaceSlug,
  statuses,
  users,
  open,
  onClose,
  onSave,
  onNavigateToFullPage
}: RoadmapTaskEditorProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    priority: 'NORMAL',
    tags: [] as string[],
    dueDate: '',
    startDate: '',
    estimate: '',
    assigneeId: '',
    statusId: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState<'start' | 'due' | null>(null);
  const [aiMenusOpen, setAiMenusOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [templateMetadata, setTemplateMetadata] = useState<TemplateMetadata | null>(null);
  const [templateDefinition, setTemplateDefinition] = useState<TemplateDefinition | null>(null);
  const [templateFieldsConfig, setTemplateFieldsConfig] = useState<TemplateField[]>([]);
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (task) {
      const taskTags = Array.isArray((task as any).tags) 
        ? (task as any).tags 
        : (task as any).tags 
          ? String((task as any).tags).split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
          : [];
      const { description: cleanedDescription, metadata } = extractTemplateMetadata(task.description || '');
      setTemplateMetadata(metadata);

      if (metadata?.templateId) {
        (async () => {
          try {
            const templateResponse = await fetch(
              `/api/spaces/${spaceSlug}/templates/${metadata.templateId}`,
              { credentials: 'include' }
            );
            if (templateResponse.ok) {
              const templateData = await templateResponse.json();
              if (templateData.success && templateData.template) {
                const template: Template = templateData.template;
                setTemplateFieldsConfig(template.fieldConfig || []);
                const definition = templateToDefinition(template);
                setTemplateDefinition(definition);
                const initialValues = metadataToTemplateValues(metadata, definition);
                const customValues = Array.isArray(task.customFieldValues) ? task.customFieldValues : [];
                const customValueMap = new Map<string, any>();

                customValues.forEach((cfv: any) => {
                  if (cfv?.customField?.id) {
                    customValueMap.set(cfv.customField.id, cfv.value);
                  }
                });

                definition.fields.forEach((definitionField) => {
                  if (!definitionField.customFieldId) return;
                  if (!customValueMap.has(definitionField.customFieldId)) return;
                  const normalized = normalizeTemplateFieldValue(definitionField, customValueMap.get(definitionField.customFieldId));
                  if (isTemplateFieldValueEmpty(definitionField, normalized)) {
                    delete initialValues[definitionField.id];
                    return;
                  }
                  initialValues[definitionField.id] = normalized;
                });
 
                template.fieldConfig.forEach((field: TemplateField) => {
                  if (field.id === 'summary') return;
                  if (!(field.id in initialValues)) {
                    const definitionField = definition.fields.find((def) => def.id === field.id);
                    if (definitionField) {
                      const normalized = normalizeTemplateFieldValue(definitionField, field.defaultValue);
                      if (normalized !== undefined) {
                        initialValues[field.id] = normalized;
                      }
                    }
                  }
                });
                setTemplateFieldValues(initialValues);
              } else {
                setTemplateDefinition(null);
                setTemplateFieldsConfig([]);
                setTemplateFieldValues({});
              }
            }
          } catch (error) {
            console.error('Failed to fetch template definition:', error);
            setTemplateDefinition(null);
            setTemplateFieldsConfig([]);
            setTemplateFieldValues({});
          }
        })();
      } else {
        setTemplateDefinition(null);
        setTemplateFieldsConfig([]);
        setTemplateFieldValues({});
      }

      setFormData({
        summary: task.summary || '',
        description: cleanedDescription || '',
        priority: task.priority || 'NORMAL',
        tags: taskTags,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
        estimate: '',
        assigneeId: task.assignee?.id || '',
        statusId: task.status?.id || ''
      });
      setTagInput('');
    }
  }, [task, spaceSlug]);

  // Handle ESC key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !formData.tags.includes(tag)) {
        setFormData({ ...formData, tags: [...formData.tags, tag] });
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && tagInput === '' && formData.tags.length > 0) {
      // Remove last tag when backspace on empty input
      setFormData({ ...formData, tags: formData.tags.slice(0, -1) });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  const handleSave = async () => {
    if (!task) return;

    setSaving(true);
    try {
      const customFieldValueMap = new Map<string, any>();
      const existingCustomFieldValues = Array.isArray(task.customFieldValues) ? task.customFieldValues : [];

      existingCustomFieldValues.forEach((cfv: any) => {
        if (cfv?.customField?.id) {
          customFieldValueMap.set(cfv.customField.id, cfv.value);
        }
      });

      let description = formData.description || '';
      if (templateDefinition) {
        const metadata = buildTemplateMetadata(templateDefinition, templateFieldValues, { users });
        description = applyTemplateMetadata(description, metadata);

        templateDefinition.fields
          .filter((definitionField) => definitionField.id !== 'summary' && definitionField.customFieldId)
          .forEach((definitionField) => {
            if (!definitionField.customFieldId) return;
            customFieldValueMap.delete(definitionField.customFieldId);
            const normalized = normalizeTemplateFieldValue(definitionField, templateFieldValues[definitionField.id]);
            if (!isTemplateFieldValueEmpty(definitionField, normalized)) {
              customFieldValueMap.set(definitionField.customFieldId, normalized);
            }
          });
      } else {
        description = applyTemplateMetadata(description, templateMetadata);
      }

      const shouldIncludeCustomFieldValues =
        templateDefinition !== null || existingCustomFieldValues.length > 0 || customFieldValueMap.size > 0;

      const payload: any = {
        summary: formData.summary,
        description,
        priority: formData.priority,
        tags: formData.tags,
        dueDate: formData.dueDate || null,
        startDate: formData.startDate || null,
        estimate: formData.estimate || null,
        assigneeId: formData.assigneeId || null,
        statusId: formData.statusId
      };

      if (shouldIncludeCustomFieldValues) {
        payload.customFieldValues = Array.from(customFieldValueMap.entries()).map(([customFieldId, value]) => ({
          customFieldId,
          value,
        }));
      }

      const response = await fetch(
        `/api/spaces/${spaceSlug}/tasks/${task.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onSave();
          onClose();
        }
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/tasks/${task.id}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setSaving(false);
    }
  };

  const panelRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Don't close if clicking on AI menus, popovers, or Select dropdowns
        const target = event.target as HTMLElement;
        
        // Check for various overlay/portal elements that should not close the dialog
        const isOverlayClick = 
          target.closest('[data-ai-menu="true"]') ||
          target.closest('.popover-content') ||
          target.closest('[data-radix-portal]') ||
          target.closest('[data-radix-select-content]') ||
          target.closest('[data-radix-select-viewport]') ||
          target.closest('[data-radix-popper-content-wrapper]') ||
          target.closest('[role="listbox"]') ||
          target.closest('[role="option"]') ||
          target.closest('[data-state="open"]') ||
          selectOpen ||
          aiMenusOpen;
        
        if (isOverlayClick) {
          return;
        }
        onClose();
      }
    };

    // Delay to prevent immediate close when opening
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose, aiMenusOpen, selectOpen]);

  // Focus first input when panel opens
  useEffect(() => {
    if (open && panelRef.current) {
      const firstInput = panelRef.current.querySelector('input, textarea, select') as HTMLElement;
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 150);
      }
    }
  }, [open]);

  if (!task || !open) return null;

  const taskKey = task.space?.ticker && task.number 
    ? `${task.space.ticker}-${task.number}`
    : task.id.slice(0, 8);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity duration-200"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Side Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-panel-title"
        className="fixed top-0 right-0 h-full w-full md:w-[45%] lg:w-[40%] bg-background border-l border-border shadow-xl z-50 transform transition-transform duration-200 ease-out overflow-hidden flex flex-col"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-muted/30">
          {/* Breadcrumb */}
          {task.space && (
            <div className="px-6 pt-4">
              <TaskBreadcrumb
                spaceName={task.space.name || 'Space'}
                spaceSlug={spaceSlug}
                taskKey={taskKey}
                taskId={task.id}
                className="mb-2"
              />
            </div>
          )}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 id="task-panel-title" className="text-xl font-bold truncate text-foreground">
                  {task.summary}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="ml-4 flex-shrink-0"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Input
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Task title..."
                disabled={saving}
                className="mt-1"
              />
            </div>

            {templateFieldsConfig.length > 0 && (
              <div className="space-y-4 rounded-md border border-border p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Template Fields</h3>
                  {templateDefinition?.title && (
                    <p className="text-xs text-muted-foreground">{templateDefinition.title}</p>
                  )}
                </div>
                <div className="space-y-4">
                  {templateFieldsConfig
                    .filter((field) => field.id !== 'summary')
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <TemplateFieldRenderer
                        key={field.id}
                        field={field}
                        value={templateFieldValues[field.id]}
                        onChange={(value: any) =>
                          setTemplateFieldValues((prev) => ({ ...prev, [field.id]: value }))
                        }
                        disabled={saving}
                        users={users}
                      />
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.statusId}
                  onValueChange={(value) => setFormData({ ...formData, statusId: value })}
                  onOpenChange={(open) => setSelectOpen(open)}
                  disabled={saving}
                >
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  onOpenChange={(open) => setSelectOpen(open)}
                  disabled={saving}
                >
                  <SelectTrigger id="priority" className="mt-1">
                    <SelectValue>
                      {formData.priority ? formatPriority(formData.priority) : 'Select priority'}
                    </SelectValue>
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

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Popover open={calendarOpen === 'start'} onOpenChange={(open) => setCalendarOpen(open ? 'start' : null)}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1"
                      disabled={saving}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate
                        ? formatDateDDMMYYYY(formData.startDate)
                        : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]">
                    <Calendar
                      onChange={(value: any) => {
                        if (value instanceof Date) {
                          const year = value.getFullYear();
                          const month = String(value.getMonth() + 1).padStart(2, '0');
                          const day = String(value.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          setFormData({ ...formData, startDate: dateStr });
                          setCalendarOpen(null);
                        }
                      }}
                      value={formData.startDate ? (() => {
                        const [year, month, day] = formData.startDate.split('-').map(Number);
                        return new Date(year, month - 1, day);
                      })() : null}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover open={calendarOpen === 'due'} onOpenChange={(open) => setCalendarOpen(open ? 'due' : null)}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1"
                      disabled={saving}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate
                        ? formatDateDDMMYYYY(formData.dueDate)
                        : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]">
                    <Calendar
                      onChange={(value: any) => {
                        if (value instanceof Date) {
                          const year = value.getFullYear();
                          const month = String(value.getMonth() + 1).padStart(2, '0');
                          const day = String(value.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          setFormData({ ...formData, dueDate: dateStr });
                          setCalendarOpen(null);
                        }
                      }}
                      value={formData.dueDate ? (() => {
                        const [year, month, day] = formData.dueDate.split('-').map(Number);
                        return new Date(year, month - 1, day);
                      })() : null}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="assignee">Assignee</Label>
                <Select
                  value={formData.assigneeId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, assigneeId: value === 'none' ? '' : value })}
                  onOpenChange={(open) => setSelectOpen(open)}
                  disabled={saving}
                >
                  <SelectTrigger id="assignee" className="mt-1">
                    <SelectValue />
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

              <div>
                <Label htmlFor="estimate">Estimate</Label>
                <Input
                  id="estimate"
                  value={formData.estimate}
                  onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
                  placeholder="e.g., 2h, 1d"
                  disabled={saving}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Sprints field - Read-only */}
            {(task?.sprint || (task?.sprints && task.sprints.length > 0)) && (
              <div>
                <Label htmlFor="sprints">Sprints</Label>
                <Input
                  id="sprints"
                  value={
                    task?.sprints && task.sprints.length > 0
                      ? task.sprints.map(s => s.name).join(', ')
                      : task?.sprint?.name || ''
                  }
                  readOnly
                  disabled
                  className="mt-1 bg-muted cursor-not-allowed"
                  placeholder="No sprints assigned"
                />
              </div>
            )}

            <div>
              <Label htmlFor="description">Description</Label>
              <div className="task-description-editor">
                {templateFieldsConfig.length === 0 ? (
                  <AITextEditor
                    value={formData.description || ''}
                    onChange={(value: string) => setFormData({ ...formData, description: value })}
                    placeholder="Add more details... Type / to activate AI"
                    rows={4}
                    onMenuStateChange={setAiMenusOpen}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Description is managed via template fields.</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="mt-1 min-h-[42px] border border-input rounded-md px-3 py-2 flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder={formData.tags.length === 0 ? "Type and press space to add tags" : ""}
                  disabled={saving}
                  className="flex-1 min-w-[150px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
              size="sm"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

