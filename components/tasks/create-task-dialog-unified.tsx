'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, Calendar as CalendarIcon, X } from 'lucide-react';
import Calendar from 'react-calendar';
import { ReminderSetter } from '@/components/ai/reminder-setter';
import { AITextEditor } from '@/components/ai/ai-text-editor';
import { useToastHelpers } from '@/components/toast';
import { DynamicFormGrid } from './dynamic-form-grid';
import type { GridCell } from './dynamic-form-grid';
import type { Template, TemplateField } from '@/components/templates/templates-manager';
import { TemplateFieldRenderer } from '@/components/templates/template-field-renderer';
import {
  TemplateMetadata,
  TemplateDefinition,
  templateToDefinition,
  normalizeTemplateFieldValue,
  buildTemplateMetadata,
  applyTemplateMetadata,
  isTemplateFieldValueEmpty
} from '@/lib/template-metadata';

export interface Space {
  id: string;
  name: string;
  slug: string;
  ticker: string;
}

export interface Status {
  id: string;
  name: string;
  key: string;
  color?: string;
  isStart?: boolean;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

export interface CustomField {
  id: string;
  name: string;
  key: string;
  type: string;
  required: boolean;
  options?: any;
}

export interface CreateTaskDialogUnifiedProps {
  // Mode: 'board' | 'global' | 'inline'
  mode?: 'board' | 'global' | 'inline';
  
  // Required for board/inline modes
  spaceSlug?: string;
  statuses?: Status[];
  
  // Required for global mode
  spaces?: Space[];
  
  // Optional: pre-select status
  statusId?: string;
  
  // Optional: trigger button
  trigger?: React.ReactNode;
  
  // Controlled open state
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  
  // Callbacks
  onTaskCreated?: (task: any) => void;
  
  // Optional: additional data for inline mode
  users?: User[];
  customFields?: CustomField[];
}

export function CreateTaskDialogUnified({
  mode = 'board',
  spaceSlug,
  statuses: providedStatuses = [],
  spaces = [],
  statusId: initialStatusId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onTaskCreated,
  users = [],
  customFields = []
}: CreateTaskDialogUnifiedProps) {
  const { success, error: showError } = useToastHelpers();
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [dueCalendarOpen, setDueCalendarOpen] = useState(false);
  const [aiMenusOpen, setAiMenusOpen] = useState(false);
  
  // For global mode: space selection
  const [selectedSpaceSlug, setSelectedSpaceSlug] = useState<string>(spaceSlug || '');
  const [fetchedStatuses, setFetchedStatuses] = useState<Status[]>([]);
  
  // Template state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [currentTemplateDefinition, setCurrentTemplateDefinition] = useState<TemplateDefinition | null>(null);
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, any>>({});
  const [labelSuggestions, setLabelSuggestions] = useState<string[]>([]);

  // Use provided statuses or fetched statuses
  const statuses = mode === 'global' ? fetchedStatuses : providedStatuses;
  const effectiveSpaceSlug = mode === 'global' ? selectedSpaceSlug : spaceSlug;
  
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    priority: 'NORMAL',
    statusId: '',
    startDate: '',
    dueDate: '',
    estimate: '',
    tags: '',
    assigneeId: '',
    customFieldValues: [] as Array<{ customFieldId: string; value: any }>
  });

  // Dynamic grid layout state (for custom fields or layout blocks)
  const [gridColumns, setGridColumns] = useState(2);
  const [gridRows, setGridRows] = useState(1);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);

  // Fetch templates when dialog opens or when space is selected (for global mode)
  useEffect(() => {
    if (open && effectiveSpaceSlug) {
      console.log('[CreateTaskDialog] Fetching templates for space:', effectiveSpaceSlug);
      fetch(`/api/spaces/${effectiveSpaceSlug}/templates`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          console.log('[CreateTaskDialog] Templates response:', data);
          if (data.success) {
            setTemplates(data.templates || []);
            console.log('[CreateTaskDialog] Templates loaded:', data.templates?.length || 0);
          } else {
            console.error('[CreateTaskDialog] Failed to fetch templates:', data.message);
            setTemplates([]);
          }
        })
        .catch(err => {
          console.error('[CreateTaskDialog] Error fetching templates:', err);
          setTemplates([]);
        });
    } else {
      // Clear templates if no space is selected
      if (open && !effectiveSpaceSlug) {
        setTemplates([]);
      }
      console.log('[CreateTaskDialog] Not fetching templates - open:', open, 'effectiveSpaceSlug:', effectiveSpaceSlug);
    }
  }, [open, effectiveSpaceSlug, selectedSpaceSlug]); // Added selectedSpaceSlug to dependencies for global mode

  // Fetch tag suggestions for labels fields
  useEffect(() => {
    if (open && effectiveSpaceSlug) {
      fetch(`/api/spaces/${effectiveSpaceSlug}/tags`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setLabelSuggestions(Array.isArray(data.tags) ? data.tags : []);
          } else {
            console.error('[CreateTaskDialog] Failed to fetch label suggestions:', data.message);
            setLabelSuggestions([]);
          }
        })
        .catch((err) => {
          console.error('[CreateTaskDialog] Error fetching label suggestions:', err);
          setLabelSuggestions([]);
        });
    } else if (!effectiveSpaceSlug) {
      setLabelSuggestions([]);
    }
  }, [open, effectiveSpaceSlug]);

  // Fetch statuses for global mode when space is selected
  useEffect(() => {
    if (mode === 'global' && selectedSpaceSlug) {
      fetch(`/api/spaces/${selectedSpaceSlug}/statuses`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFetchedStatuses(data.statuses);
            // Only set default status if no status is currently selected
            setFormData(prev => {
              if (!prev.statusId) {
                const defaultStatus = data.statuses.find((s: Status) => s.isStart) || data.statuses[0];
                return defaultStatus ? { ...prev, statusId: defaultStatus.id } : prev;
              }
              return prev;
            });
          }
        })
        .catch(err => {
          console.error('Failed to fetch statuses:', err);
        });
    } else if (mode === 'global' && !selectedSpaceSlug) {
      // Only clear statuses if space is actually cleared, not on initial render
      setFetchedStatuses([]);
      setFormData(prev => ({ ...prev, statusId: '' }));
    }
  }, [mode, selectedSpaceSlug]);

  // Handle template selection
  useEffect(() => {
    if (selectedTemplate) {
      const definition = templateToDefinition({
        id: selectedTemplate.id,
        title: selectedTemplate.title,
        fieldConfig: selectedTemplate.fieldConfig
      });

      const initialValues: Record<string, any> = {};
      selectedTemplate.fieldConfig.forEach(field => {
        if (field.id === 'summary') return;
        const definitionField = definition.fields.find((def) => def.id === field.id);
        if (!definitionField) return;
        const normalized = normalizeTemplateFieldValue(definitionField, field.defaultValue);
        if (normalized !== undefined) {
          initialValues[field.id] = normalized;
        }
      });

      setCurrentTemplateDefinition(definition);
      setTemplateFieldValues(initialValues);
      
      // Find summary field and set it
      const summaryField = selectedTemplate.fieldConfig.find(f => f.id === 'summary');
      if (summaryField && summaryField.defaultValue) {
        setFormData(prev => ({ ...prev, summary: summaryField.defaultValue }));
      }
    } else {
      setCurrentTemplateDefinition(null);
      setTemplateFieldValues({});
    }
  }, [selectedTemplate]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedTemplate(null);
      setCurrentTemplateDefinition(null);
      setTemplateFieldValues({});
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setError('');
      // Only reset form data when dialog first opens, not when statuses change
      const defaultStatus = statuses.find((s) => s.isStart) || statuses[0];
      const defaultStatusId = initialStatusId || (defaultStatus ? defaultStatus.id : '');

      setFormData({
        summary: '',
        description: '',
        priority: 'NORMAL',
        statusId: defaultStatusId || '',
        startDate: '',
        dueDate: '',
        estimate: '',
        tags: '',
        assigneeId: '',
        customFieldValues: []
      });
      
      // Only reset space selection if opening fresh (not already set)
      if (mode === 'global' && !selectedSpaceSlug) {
        setSelectedSpaceSlug(spaceSlug || '');
      }
    }
    // Note: Removed 'statuses' from dependencies to prevent form reset when statuses are fetched
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialStatusId, mode, spaceSlug]);

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
      // Validation
      if (!formData.summary?.trim()) {
        setError('Task summary is required');
        setLoading(false);
        return;
      }

      const defaultStatus = statuses.find((s) => s.isStart) || statuses[0];
      const effectiveStatusId = formData.statusId || defaultStatus?.id || '';

      const customFieldValueMap = new Map<string, any>();

      // Validate template required fields
      if (selectedTemplate) {
        for (const field of selectedTemplate.fieldConfig) {
          if (field.required) {
            const value = field.id === 'summary' 
              ? formData.summary 
              : templateFieldValues[field.id];
            
            const isEmptyObject = value && typeof value === 'object' && !Array.isArray(value)
              ? Object.values(value).every((v) => !v || (typeof v === 'string' && !v.trim()))
              : false;

            const isEmptyArray = Array.isArray(value) && value.length === 0;
            const isUncheckedBoolean = typeof value === 'boolean' && value === false;

            if (
              value === undefined ||
              value === null ||
              (typeof value === 'string' && !value.trim()) ||
              isEmptyArray ||
              isEmptyObject ||
              isUncheckedBoolean
            ) {
              setError(`${field.label} is required`);
              setLoading(false);
              return;
            }
          }
        }
      }

      if (mode === 'global' && !effectiveSpaceSlug) {
        setError('Please select a workspace');
        setLoading(false);
        return;
      }

      // Prepare tags
      const tagsArray = formData.tags
        ? formData.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      // Prepare request body
      const requestBody: any = {
        summary: formData.summary.trim(),
        description: formData.description || null,
        priority: formData.priority,
        tags: tagsArray,
        statusId: effectiveStatusId,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
        estimate: formData.estimate || null,
        assigneeId: formData.assigneeId || null
      };

      // Add template field values if template is selected
      if (selectedTemplate && currentTemplateDefinition) {
        const metadata = buildTemplateMetadata(currentTemplateDefinition, templateFieldValues, {
          users
        });
        requestBody.description = applyTemplateMetadata(requestBody.description || '', metadata);

        currentTemplateDefinition.fields
          .filter((definitionField) => definitionField.id !== 'summary' && definitionField.customFieldId)
          .forEach((definitionField) => {
            const rawValue = templateFieldValues[definitionField.id];
            const normalizedValue = normalizeTemplateFieldValue(definitionField, rawValue);
            if (isTemplateFieldValueEmpty(definitionField, normalizedValue)) {
              return;
            }
            if (definitionField.customFieldId) {
              customFieldValueMap.set(definitionField.customFieldId, normalizedValue);
            }
          });
      }

      // Add custom field values if in inline mode
      if (mode === 'inline' && formData.customFieldValues.length > 0) {
        formData.customFieldValues.forEach(({ customFieldId, value }) => {
          if (customFieldId) {
            customFieldValueMap.set(customFieldId, value);
          }
        });
      }

      if (customFieldValueMap.size > 0) {
        requestBody.customFieldValues = Array.from(customFieldValueMap.entries()).map(([customFieldId, value]) => ({
          customFieldId,
          value,
        }));
      }

      const response = await fetch(`/api/spaces/${effectiveSpaceSlug}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
 
       if (response.ok && data.success) {
        const createdTask = data.task;
        const taskSpaceSlug = effectiveSpaceSlug || spaceSlug || spaces[0]?.slug || '';
        const taskSpace = spaces.find((space) => space.slug === taskSpaceSlug);
        const taskKey = createdTask?.number !== undefined
          ? taskSpace?.ticker
            ? `${taskSpace.ticker}-${createdTask.number}`
            : `Task #${createdTask.number}`
          : formData.summary;

        success(
          'Task created',
          taskKey ? `${taskKey} has been created.` : `"${formData.summary}" has been created.`,
          taskSpaceSlug && createdTask?.id
            ? {
                action: {
                  label: 'View task',
                  onClick: () => {
                    router.push(`/spaces/${taskSpaceSlug}/tasks/${createdTask.id}`);
                  }
                }
              }
            : undefined
        );
        setOpen(false);
        onTaskCreated?.(createdTask);
      } else {
        const errorMessage = data.message || 'Failed to create task';
        setError(errorMessage);
        showError('Failed to create task', errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Failed to create task';
      setError(errorMessage);
      showError('Network Error', errorMessage);
      console.error('Failed to create task:', err);
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

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Create Task
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Space Selection (Global Mode) */}
          {mode === 'global' && (
            <div className="space-y-2">
              <Label htmlFor="space">Workspace *</Label>
              <Select
                value={selectedSpaceSlug}
                onValueChange={(value) => {
                  // Update space selection without affecting other form fields
                  setSelectedSpaceSlug(value);
                }}
                disabled={loading}
                required
              >
                <SelectTrigger className="h-11">
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
          )}

          {/* Template Selector */}
          {effectiveSpaceSlug && (
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select
                value={selectedTemplate?.id || 'blank'}
                onValueChange={(value) => {
                  if (value === 'blank') {
                    setSelectedTemplate(null);
                    setCurrentTemplateDefinition(null);
                    setTemplateFieldValues({});
                  } else {
                    const template = templates.find(t => t.id === value);
                    setSelectedTemplate(template || null);
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Blank Template</SelectItem>
                  {templates.length > 0 ? (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-templates" disabled>
                      No templates available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {templates.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No templates found. Create one in Space Settings → Templates.
                </p>
              )}
            </div>
          )}

          {/* Summary Field - Always shown, but styled differently if template has summary config */}
          {selectedTemplate ? (
            (() => {
              const summaryField = selectedTemplate.fieldConfig.find(f => f.id === 'summary');
              return (
                <div className="space-y-2">
                  <Label htmlFor="summary">Task Summary *</Label>
                  <Input
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder={summaryField?.helpText || "What needs to be done?"}
                    disabled={loading}
                    required
                    className="text-3xl font-bold border-none shadow-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto text-foreground"
                  />
                  {summaryField?.helpText && (
                    <p className="text-xs text-muted-foreground">{summaryField.helpText}</p>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="space-y-2">
              <Label htmlFor="summary">Task Summary *</Label>
              <Input
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="What needs to be done?"
                disabled={loading}
                className="text-3xl font-bold border-none shadow-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto text-foreground"
              />
            </div>
          )}

          {/* Template Fields - Render based on selected template (excluding summary) */}
          {selectedTemplate && (
            <div className="space-y-4 border-t pt-4">
              {selectedTemplate.fieldConfig
                .filter(field => field.id !== 'summary') // Exclude summary from template fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <TemplateFieldRenderer
                    key={field.id}
                    field={field}
                    value={templateFieldValues[field.id]}
                    onChange={(value) => {
                      setTemplateFieldValues(prev => ({ ...prev, [field.id]: value }));
                    }}
                    disabled={loading}
                    users={users}
                    labelSuggestions={labelSuggestions}
                  />
                ))}
            </div>
          )}

          {/* Default Fields - Only show when NO template is selected */}
          {!selectedTemplate && (
            <>
              {/* Reminder (if due date is set) */}
              {formData.dueDate && (
                <div className="space-y-2">
                  <Label>Set Reminder</Label>
                  <ReminderSetter
                    taskTitle={formData.summary}
                    dueDate={formData.dueDate}
                    onReminderSet={(reminder) => {
                      console.log('Reminder set:', reminder);
                    }}
                  />
                </div>
              )}

              {/* Priority and Status */}
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
                      <SelectItem value="LOWEST">Lowest</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="HIGHEST">Highest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.statusId || ''}
                    onValueChange={(value) => {
                      // Only update statusId, preserve all other form data and space selection
                      setFormData(prev => ({ ...prev, statusId: value }));
                    }}
                    disabled={loading || (mode === 'global' && !selectedSpaceSlug) || statuses.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        mode === 'global' && !selectedSpaceSlug 
                          ? "Select workspace first" 
                          : statuses.length > 0 
                            ? "Select status" 
                            : "No statuses"
                      } />
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

              {/* Start Date and Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal relative"
                        disabled={loading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="flex-1">
                          {formData.startDate ? formatDateDDMMYYYY(formData.startDate) : 'Select date'}
                        </span>
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
                          value={formData.startDate ? (() => {
                            const [y, m, d] = formData.startDate.split('-').map(Number);
                            return new Date(y, m - 1, d);
                          })() : null}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Popover open={dueCalendarOpen} onOpenChange={setDueCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal relative"
                        disabled={loading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="flex-1">
                          {formData.dueDate ? formatDateDDMMYYYY(formData.dueDate) : 'Select date'}
                        </span>
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
                          value={formData.dueDate ? (() => {
                            const [y, m, d] = formData.dueDate.split('-').map(Number);
                            return new Date(y, m - 1, d);
                          })() : null}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Estimate and Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimate">Estimate</Label>
                  <Input
                    id="estimate"
                    value={formData.estimate}
                    onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
                    placeholder="e.g., 2h, 1d"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Assignee (Inline Mode) */}
              {mode === 'inline' && users.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select
                    value={formData.assigneeId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, assigneeId: value === 'none' ? '' : value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
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
              )}

              {/* Description */}
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
            </>
          )}

          {/* Custom Fields with Dynamic Grid Layout (Inline Mode) */}
          {mode === 'inline' && customFields.length > 0 && (
            <DynamicFormGrid
              columns={gridColumns}
              rows={gridRows}
              onColumnsChange={setGridColumns}
              onRowsChange={setGridRows}
              cells={gridCells}
              onCellsChange={setGridCells}
              renderCell={(cell, row, col) => {
                // Map custom fields to grid cells
                const fieldIndex = row * gridColumns + col;
                const field = customFields[fieldIndex];
                
                if (!field) {
                  return (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Empty cell
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-2">
                    <Label htmlFor={`custom-${field.id}`}>
                      {field.name}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.type === 'TEXT' && (
                      <Input
                        id={`custom-${field.id}`}
                        value={formData.customFieldValues.find(cfv => cfv.customFieldId === field.id)?.value || ''}
                        onChange={(e) => {
                          const existing = formData.customFieldValues.find(cfv => cfv.customFieldId === field.id);
                          const newValues = existing
                            ? formData.customFieldValues.map(cfv =>
                                cfv.customFieldId === field.id ? { ...cfv, value: e.target.value } : cfv
                              )
                            : [...formData.customFieldValues, { customFieldId: field.id, value: e.target.value }];
                          setFormData({ ...formData, customFieldValues: newValues });
                          
                          // Update cell data
                          const cellIndex = gridCells.findIndex(c => c.row === row && c.col === col);
                          if (cellIndex >= 0) {
                            const updatedCells = [...gridCells];
                            updatedCells[cellIndex] = { ...updatedCells[cellIndex], data: e.target.value };
                            setGridCells(updatedCells);
                          }
                        }}
                        disabled={loading}
                        required={field.required}
                      />
                    )}
                    {/* Add more field types as needed */}
                  </div>
                );
              }}
              minColumns={1}
              maxColumns={10}
              minRows={1}
              maxRows={10}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
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

