'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNavigation } from '@/lib/navigation-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AITextEditor } from '@/components/ai/ai-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Loader2, Calendar as CalendarIcon, Save, X, Trash, GitBranch, ArrowRight } from 'lucide-react';
import Calendar from 'react-calendar';
import { TaskBreadcrumb } from './task-breadcrumb';
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
import { TemplateFieldRenderer } from '@/components/templates/template-field-renderer';
import type { TemplateField, Template } from '@/components/templates/template-types';
import type { WorkflowDetail } from '@/lib/workflows/types';

const MIN_AI_TRANSITION_CONFIDENCE = 0.6;

interface TaskDetailViewProps {
  taskId: string;
  spaceSlug: string;
  task: any;
}

interface EditFormData {
  summary: string;
  description: string;
  priority: string;
  tags: string;
  startDate: string;
  dueDate: string;
  estimate: string;
  assigneeId: string;
  statusId: string;
}

interface Status {
  id: string;
  name: string;
  key: string;
  color?: string;
  order: number;
  isStart: boolean;
  isDone: boolean;
  wipLimit?: number;
  hidden?: boolean;
}

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
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

export function TaskDetailView({ taskId, spaceSlug, task }: TaskDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navigation = useNavigation();
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [spaceUsers, setSpaceUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState<'start' | 'due' | null>(null);
  const [aiMenusOpen, setAiMenusOpen] = useState(false);
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [templateMetadata, setTemplateMetadata] = useState<TemplateMetadata | null>(null);
  const [templateDefinition, setTemplateDefinition] = useState<TemplateDefinition | null>(null);
  const [templateFieldsConfig, setTemplateFieldsConfig] = useState<TemplateField[]>([]);
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, any>>({});
  const [workflowDetail, setWorkflowDetail] = useState<WorkflowDetail | null>(null);
  const [workflowTransitions, setWorkflowTransitions] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState('');
  const [aiTransitionSuggestion, setAiTransitionSuggestion] = useState<{
    transitionId: string;
    name: string;
    confidence: number;
    rationale: string[];
  } | null>(null);
  const [aiTransitionError, setAiTransitionError] = useState('');
  const [aiTransitionLoading, setAiTransitionLoading] = useState(false);

  useEffect(() => {
    if (task) {
      // Use the task prop directly, but fetch fresh data if needed
      initializeFormData();
      fetchStatusesAndUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  const initializeFormData = () => {
     // Initialize form data from the task prop
     if (task) {
      const { description: cleanedDescription, metadata } = extractTemplateMetadata(task.description || '');
      setTemplateMetadata(metadata);
      const sanitizedTask = {
        ...task,
        description: cleanedDescription
      };
      setTaskDetail(sanitizedTask);
      setEditFormData({
        summary: sanitizedTask.summary || '',
        description: cleanedDescription || '',
        priority: sanitizedTask.priority || 'NORMAL',
        tags: Array.isArray(sanitizedTask.tags) ? sanitizedTask.tags.join(', ') : '',
        startDate: sanitizedTask.startDate ? new Date(sanitizedTask.startDate).toISOString().split('T')[0] : '',
        dueDate: sanitizedTask.dueDate ? new Date(sanitizedTask.dueDate).toISOString().split('T')[0] : '',
        estimate: sanitizedTask.estimate || '',
        assigneeId: sanitizedTask.assignee?.id || '',
        statusId: sanitizedTask.status?.id || ''
      });

      if (metadata?.templateId) {
        fetchTemplateDefinition(metadata, sanitizedTask);
      } else {
        setTemplateDefinition(null);
        setTemplateFieldsConfig([]);
        setTemplateFieldValues({});
      }
    }
  };

  const fetchStatusesAndUsers = async () => {
    try {
      const [statusesResponse, usersResponse] = await Promise.all([
        fetch(`/api/spaces/${spaceSlug}/statuses`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}/members`, { credentials: 'include' })
      ]);

      if (statusesResponse.ok) {
        const statusesData = await statusesResponse.json();
        if (statusesData.success) {
          setStatuses(statusesData.statuses || []);
        }
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.success) {
          setSpaceUsers(usersData.members.map((m: any) => m.user));
        }
      }
    } catch (err) {
      console.error('Failed to fetch statuses and users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateDefinition = async (metadata: TemplateMetadata, taskSource?: any) => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/templates/${metadata.templateId}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.template) {
          const template: Template = data.template;
          setTemplateFieldsConfig(template.fieldConfig || []);
          const definition = templateToDefinition(template);
          setTemplateDefinition(definition);
          const initialValues = metadataToTemplateValues(metadata, definition);
          const customValueSource = taskSource?.customFieldValues || taskDetail?.customFieldValues || [];
          const customValueMap = new Map<string, any>();

          if (Array.isArray(customValueSource)) {
            customValueSource.forEach((cfv: any) => {
              if (cfv?.customField?.id) {
                customValueMap.set(cfv.customField.id, cfv.value);
              }
            });
          }

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

          definition.fields.forEach((definitionField) => {
            if (!definitionField.customFieldId) return;
            if (!customValueMap.has(definitionField.customFieldId)) return;

            const rawValue = customValueMap.get(definitionField.customFieldId);
            const normalized = normalizeTemplateFieldValue(definitionField, rawValue);

            if (isTemplateFieldValueEmpty(definitionField, normalized)) {
              delete initialValues[definitionField.id];
              return;
            }

            initialValues[definitionField.id] = normalized;
          });

          setTemplateFieldValues(initialValues);
          if (template.workflowId) {
            fetchWorkflowDetail(template.workflowId, taskSource?.workflowStatus?.id ?? taskSource?.workflowStatusId ?? null);
          }
          setTemplateMetadata(metadata);
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
      if (taskSource?.workflowId) {
        fetchWorkflowDetail(taskSource.workflowId, taskSource.workflowStatus?.id ?? taskSource.workflowStatusId ?? null);
      }
      setTemplateMetadata(null);
    }
  };

  const fetchWorkflowDetail = async (workflowId: string | null, workflowStatusId: string | null) => {
    if (!workflowId) {
      setWorkflowDetail(null);
      setWorkflowTransitions([]);
      setAiTransitionSuggestion(null);
      return;
    }

    setWorkflowLoading(true);
    setWorkflowError('');
    setAiTransitionSuggestion(null);
    try {
      const response = await fetch(`/api/workflows/${workflowId}?spaceId=${task?.space?.id ?? ''}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const workflow: WorkflowDetail = data.workflow;
        setWorkflowDetail(workflow);
        if (workflowStatusId) {
          const transitions = workflow.transitions.filter((transition: any) => transition.fromId === workflowStatusId);
          setWorkflowTransitions(transitions);
        } else {
          setWorkflowTransitions(workflow.transitions || []);
        }
      } else {
        const message = data.message || 'Failed to load workflow';
        setWorkflowError(message);
        setWorkflowTransitions([]);
      }
    } catch (error) {
      console.error('Error fetching workflow detail:', error);
      setWorkflowError('Failed to load workflow');
      setWorkflowTransitions([]);
    } finally {
      setWorkflowLoading(false);
    }
  };

  const fetchTransitionSuggestion = useCallback(
    async (taskData: any, transitions: any[]) => {
      if (!taskData?.workflowId || transitions.length === 0) {
        setAiTransitionSuggestion(null);
        setAiTransitionLoading(false);
        return;
      }

      setAiTransitionLoading(true);
      setAiTransitionError('');
      try {
        const response = await fetch('/api/ai/workflows/transition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            taskId,
            summary: taskData.summary,
            currentStatusKey: taskData.workflowStatus?.key ?? taskData.status?.key,
            workflowId: taskData.workflowId,
            transitions: transitions.map((transition: any) => ({
              id: transition.id,
              name: transition.name,
              fromKey: transition.fromKey,
              toKey: transition.toKey,
              uiTrigger: transition.uiTrigger,
              conditions: transition.conditions ?? null,
              validators: transition.validators ?? null,
              postFunctions: transition.postFunctions ?? null,
              disabled: transition.disabled ?? transition.isDisabled ?? false,
            })),
            tags: taskData.tags,
            priority: taskData.priority,
          }),
        });
        const data = await response.json();
        if (response.ok && data.success && data.suggestion) {
          const suggestion = data.suggestion;
          const matchedTransition = transitions.find((transition: any) => transition.id === suggestion.transitionId);

          if (!matchedTransition) {
            console.warn('AI task detail suggestion rejected: missing transition in context.', {
              suggestion,
            });
            setAiTransitionError('AI suggestion skipped because transition is unavailable.');
            setAiTransitionSuggestion(null);
            return;
          }

          if (typeof suggestion.confidence === 'number' && suggestion.confidence < MIN_AI_TRANSITION_CONFIDENCE) {
            console.warn('AI task detail suggestion rejected: confidence below threshold.', {
              suggestion,
              threshold: MIN_AI_TRANSITION_CONFIDENCE,
            });
            setAiTransitionError('AI suggestion skipped due to low confidence.');
            setAiTransitionSuggestion(null);
            return;
          }

          const roleRequirements = Array.isArray(matchedTransition.conditions?.roles)
            ? matchedTransition.conditions?.roles
            : [];
          if (roleRequirements.length > 0) {
            console.warn('AI task detail suggestion rejected: role-restricted transition.', {
              suggestion,
              roleRequirements,
            });
            setAiTransitionError('AI suggestion skipped because it requires elevated permissions.');
            setAiTransitionSuggestion(null);
            return;
          }

          if (matchedTransition.disabled || matchedTransition.isDisabled === true) {
            console.warn('AI task detail suggestion rejected: transition disabled.', {
              suggestion,
            });
            setAiTransitionError('AI suggestion skipped because transition is disabled.');
            setAiTransitionSuggestion(null);
            return;
          }

          setAiTransitionSuggestion({
            transitionId: suggestion.transitionId,
            name: matchedTransition.name ?? 'Suggested transition',
            confidence: suggestion.confidence ?? 0.6,
            rationale: suggestion.rationale ?? [],
          });
          setAiTransitionError('');
        } else {
          const message = data.message || 'Failed to fetch AI suggestion';
          setAiTransitionError(message);
          setAiTransitionSuggestion(null);
        }
      } catch (error) {
        console.error('Failed to fetch AI transition suggestion:', error);
        setAiTransitionError('Failed to fetch AI suggestion');
        setAiTransitionSuggestion(null);
      } finally {
        setAiTransitionLoading(false);
      }
    },
    [taskId],
  );

  useEffect(() => {
    if (!taskDetail || workflowTransitions.length === 0) {
      setAiTransitionSuggestion(null);
      return;
    }
    fetchTransitionSuggestion(taskDetail, workflowTransitions);
  }, [taskDetail, workflowTransitions, fetchTransitionSuggestion]);

  const handleSave = async () => {
    if (!taskId || !editFormData) return;
    
    setSaving(true);
    try {
      const tagsArray = editFormData.tags 
        ? editFormData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
        : [];
      
      const customFieldValueMap = new Map<string, any>();
      const initialCustomFieldValues = Array.isArray(taskDetail?.customFieldValues)
        ? taskDetail.customFieldValues
        : [];

      initialCustomFieldValues.forEach((cfv: any) => {
        if (cfv?.customField?.id) {
          customFieldValueMap.set(cfv.customField.id, cfv.value);
        }
      });

      let requestDescription = editFormData.description || '';

      if (templateDefinition) {
        const metadata = buildTemplateMetadata(templateDefinition, templateFieldValues, { users: spaceUsers });
        requestDescription = applyTemplateMetadata(requestDescription, metadata);

        templateDefinition.fields
          .filter((definitionField) => definitionField.id !== 'summary' && definitionField.customFieldId)
          .forEach((definitionField) => {
            if (!definitionField.customFieldId) return;
            customFieldValueMap.delete(definitionField.customFieldId);
            const rawValue = templateFieldValues[definitionField.id];
            const normalizedValue = normalizeTemplateFieldValue(definitionField, rawValue);
            if (!isTemplateFieldValueEmpty(definitionField, normalizedValue)) {
              customFieldValueMap.set(definitionField.customFieldId, normalizedValue);
            }
          });
      } else {
        requestDescription = applyTemplateMetadata(requestDescription, templateMetadata);
      }

      const shouldIncludeCustomFieldValues =
        templateDefinition !== null || initialCustomFieldValues.length > 0 || customFieldValueMap.size > 0;

      const payload: any = {
        summary: editFormData.summary,
        description: requestDescription,
        priority: editFormData.priority,
        tags: tagsArray,
        startDate: editFormData.startDate || null,
        dueDate: editFormData.dueDate || null,
        estimate: editFormData.estimate || null,
        assigneeId: editFormData.assigneeId || null,
        statusId: editFormData.statusId
      };

      if (shouldIncludeCustomFieldValues) {
        payload.customFieldValues = Array.from(customFieldValueMap.entries()).map(([customFieldId, value]) => ({
          customFieldId,
          value,
        }));
      }

      const response = await fetch(
        `/api/spaces/${spaceSlug}/tasks/${taskId}`,
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
          // Navigate back to board
          router.push(`/spaces/${spaceSlug}`);
        }
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!taskDetail) return;
    
    // Reset form data to original task values
    setEditFormData({
      summary: taskDetail.summary || '',
      description: taskDetail.description || '',
      priority: taskDetail.priority || 'NORMAL',
      tags: Array.isArray(taskDetail.tags) ? taskDetail.tags.join(', ') : '',
      startDate: taskDetail.startDate ? new Date(taskDetail.startDate).toISOString().split('T')[0] : '',
      dueDate: taskDetail.dueDate ? new Date(taskDetail.dueDate).toISOString().split('T')[0] : '',
      estimate: taskDetail.estimate || '',
      assigneeId: taskDetail.assignee?.id || '',
      statusId: taskDetail.status?.id || ''
    });
    if (templateDefinition) {
      const mergedValues = metadataToTemplateValues(templateMetadata, templateDefinition);
      if (Array.isArray(taskDetail.customFieldValues)) {
        taskDetail.customFieldValues.forEach((cfv: any) => {
          const customFieldId = cfv?.customField?.id;
          if (!customFieldId) return;
          const definitionField = templateDefinition.fields.find((field) => field.customFieldId === customFieldId);
          if (!definitionField) return;
          const normalized = normalizeTemplateFieldValue(definitionField, cfv.value);
          if (!isTemplateFieldValueEmpty(definitionField, normalized)) {
            mergedValues[definitionField.id] = normalized;
          }
        });
      }
      setTemplateFieldValues(mergedValues);
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;
    
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/tasks/${taskId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        // Navigate back to board
        router.push(`/spaces/${spaceSlug}`);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !editFormData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Get space ticker and name from task
  const spaceTicker = taskDetail?.space?.ticker;
  const spaceName = taskDetail?.space?.name || 'Space';
  const taskKey = spaceTicker && taskDetail?.number ? `${spaceTicker}-${taskDetail.number}` : taskId.slice(0, 8);

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Breadcrumb */}
      {taskDetail && (
        <TaskBreadcrumb
          spaceName={spaceName}
          spaceSlug={spaceSlug}
          taskKey={taskKey}
          taskId={taskId}
          sticky={true}
          className="mb-4"
        />
      )}

      {/* Header with Back button */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => {
            const from = searchParams?.get('from') || navigation.getFromParam();
            // Construct appropriate fallback route based on 'from' parameter
            let fallbackRoute = `/spaces/${spaceSlug}`;
            if (from === 'roadmap') {
              fallbackRoute = `/spaces/${spaceSlug}?view=roadmap`;
            } else if (from === 'board') {
              fallbackRoute = `/spaces/${spaceSlug}?view=board`;
            } else if (from === 'calendar') {
              fallbackRoute = `/spaces/${spaceSlug}?view=calendar`;
            } else if (from === 'tasks') {
              fallbackRoute = `/spaces/${spaceSlug}?view=tasks`;
            }
            navigation.back(fallbackRoute);
          }}
          className="mb-4"
          title={
            searchParams?.get('from') === 'roadmap' ? 'Return to Roadmap' :
            searchParams?.get('from') === 'board' ? 'Return to Board' :
            searchParams?.get('from') === 'calendar' ? 'Return to Calendar' :
            searchParams?.get('from') === 'search' ? 'Return to Search' :
            'Go back'
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {searchParams?.get('from') === 'roadmap' ? 'Back to Roadmap' :
           searchParams?.get('from') === 'board' ? 'Back to Board' :
           searchParams?.get('from') === 'calendar' ? 'Back to Calendar' :
           searchParams?.get('from') === 'search' ? 'Back to Search' :
           'Back'}
        </Button>
      </div>

      {/* Task Form */}
      <div className="space-y-6">
        <div>
          <Input
            id="summary"
            value={editFormData.summary}
            onChange={(e) => setEditFormData({ ...editFormData, summary: e.target.value })}
            placeholder="Task title..."
            disabled={saving}
            className="text-3xl font-bold border-none shadow-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto text-foreground"
          />
        </div>

        {templateFieldsConfig.length > 0 && templateDefinition && (
          <div className="rounded-lg border bg-card">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {templateMetadata?.templateTitle || 'Template Fields'}
              </h3>
            </div>
            <div className="grid gap-4 p-4">
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
                    users={spaceUsers}
                  />
                ))}
            </div>
          </div>
        )}

        {templateFieldsConfig.length === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={editFormData.statusId}
              onValueChange={(value) => setEditFormData({ ...editFormData, statusId: value })}
              disabled={saving}
            >
              <SelectTrigger id="status">
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

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={editFormData.priority}
              onValueChange={(value) => setEditFormData({ ...editFormData, priority: value })}
              disabled={saving}
            >
              <SelectTrigger id="priority">
                <SelectValue>
                  {editFormData.priority ? formatPriority(editFormData.priority) : 'Select priority'}
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

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <div className="flex gap-2">
              <Popover open={calendarOpen === 'start'} onOpenChange={(open) => setCalendarOpen(open ? 'start' : null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={saving}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editFormData.startDate
                      ? formatDateDDMMYYYY(editFormData.startDate)
                      : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100] date-picker-popover shadow-lg" align="start">
                  <div className="date-picker-calendar-wrapper">
                    <Calendar
                      onChange={(value: any) => {
                        if (value instanceof Date) {
                          const year = value.getFullYear();
                          const month = String(value.getMonth() + 1).padStart(2, '0');
                          const day = String(value.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          setEditFormData({ ...editFormData, startDate: dateStr });
                          setCalendarOpen(null);
                        }
                      }}
                      value={editFormData.startDate ? (() => {
                        const [year, month, day] = editFormData.startDate.split('-').map(Number);
                        return new Date(year, month - 1, day);
                      })() : null}
                      formatMonthYear={(locale, date) => {
                        const monthNames = [
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ];
                        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                      }}
                      formatMonth={(locale, date) => {
                        const monthNames = [
                          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                        ];
                        return monthNames[date.getMonth()];
                      }}
                      className="date-picker-calendar"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              {editFormData.startDate && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditFormData({ ...editFormData, startDate: '' })}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <div className="flex gap-2">
              <Popover open={calendarOpen === 'due'} onOpenChange={(open) => setCalendarOpen(open ? 'due' : null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={saving}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editFormData.dueDate
                      ? formatDateDDMMYYYY(editFormData.dueDate)
                      : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100] date-picker-popover shadow-lg" align="start">
                  <div className="date-picker-calendar-wrapper">
                    <Calendar
                      onChange={(value: any) => {
                        if (value instanceof Date) {
                          const year = value.getFullYear();
                          const month = String(value.getMonth() + 1).padStart(2, '0');
                          const day = String(value.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          setEditFormData({ ...editFormData, dueDate: dateStr });
                          setCalendarOpen(null);
                        }
                      }}
                      value={editFormData.dueDate ? (() => {
                        const [year, month, day] = editFormData.dueDate.split('-').map(Number);
                        return new Date(year, month - 1, day);
                      })() : null}
                      formatMonthYear={(locale, date) => {
                        const monthNames = [
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ];
                        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                      }}
                      formatMonth={(locale, date) => {
                        const monthNames = [
                          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                        ];
                        return monthNames[date.getMonth()];
                      }}
                      className="date-picker-calendar"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              {editFormData.dueDate && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditFormData({ ...editFormData, dueDate: '' })}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimate">Estimate</Label>
            <Input
              id="estimate"
              value={editFormData.estimate}
              onChange={(e) => setEditFormData({ ...editFormData, estimate: e.target.value })}
              placeholder="e.g., 2h, 1d"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Select
              value={editFormData.assigneeId || 'none'}
              onValueChange={(value) => setEditFormData({ ...editFormData, assigneeId: value === 'none' ? '' : value })}
              disabled={saving}
            >
              <SelectTrigger id="assignee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {spaceUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sprints field - Read-only */}
          {(taskDetail?.sprint || (taskDetail?.sprints && taskDetail.sprints.length > 0)) && (
            <div className="space-y-2">
              <Label htmlFor="sprints">Sprints</Label>
              <Input
                id="sprints"
                value={
                  taskDetail?.sprints && taskDetail.sprints.length > 0
                    ? taskDetail.sprints.map((s: any) => s.name).join(', ')
                    : taskDetail?.sprint?.name || ''
                }
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
                placeholder="No sprints assigned"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={editFormData.tags}
              onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
              placeholder="tag1, tag2, tag3"
              disabled={saving}
            />
          </div>
        </div>
        )}

        {templateFieldsConfig.length === 0 && (
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <AITextEditor
              value={editFormData.description}
              onChange={(value: string) => setEditFormData({ ...editFormData, description: value })}
              placeholder="Add more details..."
              rows={4}
              onMenuStateChange={setAiMenusOpen}
            />
          </div>
        )}

        {workflowDetail && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Workflow</span>
              </div>
              {workflowLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{workflowDetail.name}</span>
              <span className="text-xs text-muted-foreground">Version {workflowDetail.version}</span>
              {workflowDetail.isDefault && <span className="text-xs rounded border px-2 py-0.5">Default</span>}
            </div>
            {workflowError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                {workflowError}
              </p>
            )}
            {aiTransitionError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                {aiTransitionError}
              </p>
            )}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Transitions</p>
              {aiTransitionSuggestion && (
                <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">AI Recommended Next Step</span>
                    <span className="text-muted-foreground">
                      Confidence {(aiTransitionSuggestion.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-foreground flex items-center gap-2">
                    {aiTransitionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {aiTransitionSuggestion.name}
                  </p>
                  {aiTransitionSuggestion.rationale.length > 0 && (
                    <ul className="mt-1 list-disc pl-4 space-y-1">
                      {aiTransitionSuggestion.rationale.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Apply transitions from the board dialog when ready.
                  </p>
                </div>
              )}
              {workflowTransitions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No transitions available from the current status.</p>
              ) : (
                <div className="space-y-2">
                  {workflowTransitions.map((transition) => (
                    <div key={transition.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{transition.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {transition.fromKey}
                          <ArrowRight className="h-3 w-3" />
                          {transition.toKey}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Workflow transitions are available on the board view.
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={saving}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={saving}
          >
            <X className="mr-2 h-4 w-4" />
            Discard
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
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
  );
}

