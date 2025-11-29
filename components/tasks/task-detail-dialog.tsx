'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AITextEditor } from '@/components/ai/ai-text-editor';
import { TaskBreadcrumb } from '@/components/tasks/task-breadcrumb';
import { TemplateFieldRenderer } from '@/components/templates/template-field-renderer';
import { TemplateField, Template } from '@/components/templates/template-types';
import type { WorkflowDetail } from '@/lib/workflows/types';
import {
  applyTemplateMetadata,
  buildTemplateMetadata,
  extractTemplateMetadata,
  metadataToTemplateValues,
  normalizeTemplateFieldValue,
  templateToDefinition,
  TemplateDefinition,
  TemplateMetadata,
  isTemplateFieldValueEmpty,
} from '@/lib/template-metadata';
import Calendar from 'react-calendar';
import {
  ArrowRight,
  Calendar as CalendarIcon,
  GitBranch,
  Loader2,
  Save,
  Trash,
  X,
} from 'lucide-react';
import { formatDateDDMMYYYY } from '@/lib/utils';

const MIN_AI_TRANSITION_CONFIDENCE = 0.6;

export interface TaskDetailDialogStatus {
  id: string;
  name: string;
  key: string;
  color?: string;
  order?: number;
  isStart?: boolean;
  isDone?: boolean;
  hidden?: boolean;
}

interface TaskDetailDialogProps {
  open: boolean;
  taskId: string | null;
  spaceSlug: string;
  statuses: TaskDetailDialogStatus[];
  onClose: () => void;
  onTaskUpdated?: () => void;
  spaceTicker?: string;
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

interface SpaceUser {
  id: string;
  name?: string;
  email: string;
}

function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    HIGHEST: 'Highest',
    HIGH: 'High',
    NORMAL: 'Normal',
    LOW: 'Low',
    LOWEST: 'Lowest',
  };
  return priorityMap[priority] || priority;
}

export function TaskDetailDialog({
  open,
  taskId,
  spaceSlug,
  statuses,
  onClose,
  onTaskUpdated,
  spaceTicker,
}: TaskDetailDialogProps) {
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [templateMetadata, setTemplateMetadata] = useState<TemplateMetadata | null>(null);
  const [templateDefinition, setTemplateDefinition] = useState<TemplateDefinition | null>(null);
  const [templateFieldsConfig, setTemplateFieldsConfig] = useState<TemplateField[]>([]);
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, any>>({});
  const [spaceUsers, setSpaceUsers] = useState<SpaceUser[]>([]);
  const [calendarOpen, setCalendarOpen] = useState<'start' | 'due' | null>(null);
  const [aiMenusOpen, setAiMenusOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workflowDetail, setWorkflowDetail] = useState<WorkflowDetail | null>(null);
  const [workflowTransitions, setWorkflowTransitions] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState('');
  const [aiTransitionSuggestion, setAiTransitionSuggestion] = useState<{
    transitionId: string;
    transitionKey?: string;
    confidence: number;
    rationale: string[];
    name?: string;
  } | null>(null);
  const [aiTransitionLoading, setAiTransitionLoading] = useState(false);
  const [aiTransitionError, setAiTransitionError] = useState('');
  const [taskSpaceId, setTaskSpaceId] = useState<string | null>(null);
  const workflowCacheRef = useRef<Map<string, WorkflowDetail>>(new Map());

  const resetState = useCallback(() => {
    setTaskDetail(null);
    setTemplateMetadata(null);
    setTemplateDefinition(null);
    setTemplateFieldsConfig([]);
    setTemplateFieldValues({});
    setEditFormData(null);
    setCalendarOpen(null);
    setAiMenusOpen(false);
    setSpaceUsers([]);
    setWorkflowDetail(null);
    setWorkflowTransitions([]);
    setWorkflowLoading(false);
    setWorkflowError('');
    setAiTransitionSuggestion(null);
    setAiTransitionLoading(false);
    setAiTransitionError('');
    workflowCacheRef.current.clear();
    setTaskSpaceId(null);
  }, []);

  const handleDialogClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const fetchWorkflowDetail = useCallback(
    async (workflowId: string | null, workflowStatusId: string | null, incomingSpaceId?: string | null) => {
      const resolvedSpaceId = incomingSpaceId ?? taskSpaceId;
      if (!workflowId || !resolvedSpaceId) {
        setWorkflowDetail(null);
        setWorkflowTransitions([]);
        setAiTransitionSuggestion(null);
        return;
      }

      setWorkflowLoading(true);
      setWorkflowError('');
      setAiTransitionSuggestion(null);

      try {
        const cacheKey = `${workflowId}:${resolvedSpaceId}`;
        if (workflowCacheRef.current.has(cacheKey)) {
          const cached = workflowCacheRef.current.get(cacheKey);
          setWorkflowDetail(cached || null);
          if (cached && workflowStatusId) {
            const transitions = (cached.transitions || []).filter(
              (transition: any) => transition.fromId === workflowStatusId,
            );
            setWorkflowTransitions(transitions);
          } else {
            setWorkflowTransitions([]);
          }
          setWorkflowLoading(false);
          return;
        }

        const response = await fetch(`/api/workflows/${workflowId}?spaceId=${resolvedSpaceId}`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok && data.success && data.workflow) {
          const workflow: WorkflowDetail = data.workflow;
          workflowCacheRef.current.set(cacheKey, workflow);
          setWorkflowDetail(workflow);
          if (workflowStatusId) {
            const transitions = (workflow.transitions || []).filter(
              (transition: any) => transition.fromId === workflowStatusId,
            );
            setWorkflowTransitions(transitions);
          } else {
            setWorkflowTransitions([]);
          }
        } else {
          const message = data.message || 'Failed to load workflow';
          setWorkflowError(message);
          setWorkflowDetail(null);
          setWorkflowTransitions([]);
        }
      } catch (error) {
        console.error('Failed to load workflow detail:', error);
        setWorkflowError('Failed to load workflow');
        setWorkflowDetail(null);
        setWorkflowTransitions([]);
      } finally {
        setWorkflowLoading(false);
      }
    },
    [taskSpaceId],
  );

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
            taskId: taskData.id,
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
            setAiTransitionError('AI suggestion unavailable for this workflow.');
            setAiTransitionSuggestion(null);
            return;
          }

          if (
            typeof suggestion.confidence === 'number' &&
            suggestion.confidence < MIN_AI_TRANSITION_CONFIDENCE
          ) {
            setAiTransitionError('AI suggestion skipped due to low confidence.');
            setAiTransitionSuggestion(null);
            return;
          }

          const roleRequirements = Array.isArray(matchedTransition.conditions?.roles)
            ? matchedTransition.conditions?.roles
            : [];
          if (roleRequirements.length > 0 || matchedTransition.disabled || matchedTransition.isDisabled === true) {
            setAiTransitionError('AI suggestion unavailable for restricted transitions.');
            setAiTransitionSuggestion(null);
            return;
          }

          setAiTransitionSuggestion({
            transitionId: suggestion.transitionId,
            transitionKey: suggestion.transitionKey,
            confidence: suggestion.confidence ?? 0.6,
            rationale: suggestion.rationale ?? [],
            name: matchedTransition.name ?? 'Suggested transition',
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
    [],
  );

  useEffect(() => {
    if (!taskDetail || workflowTransitions.length === 0) {
      setAiTransitionSuggestion(null);
      return;
    }
    fetchTransitionSuggestion(taskDetail, workflowTransitions);
  }, [taskDetail, workflowTransitions, fetchTransitionSuggestion]);

  const fetchTemplateDefinition = useCallback(
    async (metadata: TemplateMetadata, taskSource: any, incomingSpaceId?: string | null) => {
      const spaceId = incomingSpaceId ?? taskSpaceId;
      if (!metadata?.templateId || !spaceId) {
        setTemplateDefinition(null);
        setTemplateFieldsConfig([]);
        setTemplateFieldValues({});
        return;
      }

      try {
        const response = await fetch(`/api/spaces/${spaceSlug}/templates/${metadata.templateId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.template) {
            const template: Template = data.template;
            setTemplateFieldsConfig(template.fieldConfig || []);
            const definition = templateToDefinition(template);
            setTemplateDefinition(definition);
            const initialValues = metadataToTemplateValues(metadata, definition);
            const customValueSource = taskSource?.customFieldValues || [];
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
              fetchWorkflowDetail(
                template.workflowId,
                taskSource?.workflowStatus?.id ?? taskSource?.workflowStatusId ?? null,
                spaceId,
              );
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
      }
    },
    [fetchWorkflowDetail, spaceSlug, taskSpaceId],
  );

  const fetchTaskDetail = useCallback(async () => {
    if (!open || !taskId) {
      return;
    }

    setLoadingTaskDetail(true);
    setTaskDetail(null);
    setEditFormData(null);
    setTemplateMetadata(null);
    setTemplateDefinition(null);
    setTemplateFieldsConfig([]);
    setTemplateFieldValues({});
    setCalendarOpen(null);
    setAiMenusOpen(false);

    try {
      const [taskResponse, usersResponse] = await Promise.all([
        fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}/members`, { credentials: 'include' }),
      ]);

      if (taskResponse.ok) {
        const taskData = await taskResponse.json();
        if (taskData.success) {
          const task = taskData.task;
          const { description: cleanedDescription, metadata } = extractTemplateMetadata(task.description || '');
          const normalizedTask = {
            ...task,
            description: cleanedDescription,
            tags: Array.isArray(task.tags)
              ? task.tags
              : typeof task.tags === 'string'
                ? JSON.parse(task.tags)
                : [],
          };

          setTaskDetail(normalizedTask);
          const spaceId = normalizedTask.space?.id ?? null;
          setTaskSpaceId(spaceId);

          setEditFormData({
            summary: normalizedTask.summary || '',
            description: cleanedDescription || '',
            priority: normalizedTask.priority || 'NORMAL',
            tags: Array.isArray(normalizedTask.tags) ? normalizedTask.tags.join(', ') : '',
            startDate: normalizedTask.startDate ? new Date(normalizedTask.startDate).toISOString().split('T')[0] : '',
            dueDate: normalizedTask.dueDate ? new Date(normalizedTask.dueDate).toISOString().split('T')[0] : '',
            estimate: normalizedTask.estimate || '',
            assigneeId: normalizedTask.assignee?.id || '',
            statusId: normalizedTask.status?.id || '',
          });

          if (metadata?.templateId) {
            await fetchTemplateDefinition(metadata, normalizedTask, spaceId);
          } else {
            setTemplateDefinition(null);
            setTemplateFieldsConfig([]);
            setTemplateFieldValues({});
            await fetchWorkflowDetail(
              normalizedTask.workflowId,
              normalizedTask.workflowStatus?.id ?? normalizedTask.workflowStatusId ?? null,
              spaceId,
            );
          }
        }
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.success) {
          setSpaceUsers(usersData.members.map((member: any) => member.user));
        }
      }
    } catch (error) {
      console.error('Failed to fetch task details:', error);
    } finally {
      setLoadingTaskDetail(false);
    }
  }, [fetchTemplateDefinition, fetchWorkflowDetail, open, spaceSlug, taskId]);

  useEffect(() => {
    if (open && taskId) {
      fetchTaskDetail();
    } else {
      resetState();
    }
  }, [open, taskId, fetchTaskDetail, resetState]);

  const handlePerformTransition = useCallback(
    async (transitionId: string, transitionKey?: string) => {
      if (!taskId) return;
      setWorkflowError('');
      setWorkflowLoading(true);
      setAiTransitionSuggestion(null);
      try {
        const response = await fetch(`/api/tasks/${taskId}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ transitionId, transitionKey }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          await fetchTaskDetail();
          onTaskUpdated?.();
        } else {
          const message = data.message || 'Failed to transition task';
          setWorkflowError(message);
        }
      } catch (error) {
        console.error('Failed to perform transition:', error);
        setWorkflowError('Failed to perform transition');
      } finally {
        setWorkflowLoading(false);
      }
    },
    [fetchTaskDetail, onTaskUpdated, taskId],
  );

  const handleSave = useCallback(async () => {
    if (!taskId || !editFormData) return;

    setSaving(true);
    try {
      const tagsArray = editFormData.tags
        ? editFormData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
        : [];

      const customFieldValueMap = new Map<string, any>();
      const existingCustomFieldValues = Array.isArray(taskDetail?.customFieldValues)
        ? taskDetail.customFieldValues
        : [];

      existingCustomFieldValues.forEach((cfv: any) => {
        if (cfv?.customField?.id) {
          customFieldValueMap.set(cfv.customField.id, cfv.value);
        }
      });

      let description = editFormData.description || '';
      if (templateDefinition) {
        const metadata = buildTemplateMetadata(templateDefinition, templateFieldValues, {
          users: spaceUsers,
        });
        description = applyTemplateMetadata(description, metadata);

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
        description = applyTemplateMetadata(description, templateMetadata);
      }

      const shouldIncludeCustomFieldValues =
        templateDefinition !== null ||
        existingCustomFieldValues.length > 0 ||
        customFieldValueMap.size > 0;

      const payload: any = {
        summary: editFormData.summary,
        description,
        priority: editFormData.priority,
        tags: tagsArray,
        startDate: editFormData.startDate || null,
        dueDate: editFormData.dueDate || null,
        estimate: editFormData.estimate || null,
        assigneeId: editFormData.assigneeId || null,
        statusId: editFormData.statusId,
      };

      if (shouldIncludeCustomFieldValues) {
        payload.customFieldValues = Array.from(customFieldValueMap.entries()).map(([customFieldId, value]) => ({
          customFieldId,
          value,
        }));
      }

      const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onTaskUpdated?.();
          handleDialogClose();
        }
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setSaving(false);
    }
  }, [
    editFormData,
    handleDialogClose,
    onTaskUpdated,
    spaceSlug,
    spaceUsers,
    taskDetail?.customFieldValues,
    taskId,
    templateDefinition,
    templateFieldValues,
    templateMetadata,
  ]);

  const handleDiscard = useCallback(() => {
    if (!taskDetail) return;

    setEditFormData({
      summary: taskDetail.summary || '',
      description: taskDetail.description || '',
      priority: taskDetail.priority || 'NORMAL',
      tags: Array.isArray(taskDetail.tags) ? taskDetail.tags.join(', ') : '',
      startDate: taskDetail.startDate ? new Date(taskDetail.startDate).toISOString().split('T')[0] : '',
      dueDate: taskDetail.dueDate ? new Date(taskDetail.dueDate).toISOString().split('T')[0] : '',
      estimate: taskDetail.estimate || '',
      assigneeId: taskDetail.assignee?.id || '',
      statusId: taskDetail.status?.id || '',
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
  }, [taskDetail, templateDefinition, templateMetadata]);

  const handleDelete = useCallback(async () => {
    if (!taskId) return;
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        onTaskUpdated?.();
        handleDialogClose();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setSaving(false);
    }
  }, [handleDialogClose, onTaskUpdated, spaceSlug, taskId]);

  const dialogTitle = useMemo(() => {
    if (loadingTaskDetail) {
      return 'Loading Task';
    }
    if (taskDetail?.summary) {
      return taskDetail.summary;
    }
    return 'Task Details';
  }, [loadingTaskDetail, taskDetail]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (aiMenusOpen) {
            return;
          }
          handleDialogClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        </DialogHeader>

        {loadingTaskDetail ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : taskDetail && editFormData ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {taskDetail.space && taskId && (
                  <div className="mb-4">
                    <TaskBreadcrumb
                      spaceName={taskDetail.space.name || 'Space'}
                      spaceSlug={spaceSlug}
                      taskKey={
                        spaceTicker && taskDetail.number
                          ? `${spaceTicker}-${taskDetail.number}`
                          : taskId.slice(0, 8)
                      }
                      taskId={taskId}
                    />
                  </div>
                )}
              </div>
              {spaceTicker && taskDetail.number && (
                <span className="text-sm font-medium text-muted-foreground">{`${spaceTicker}-${taskDetail.number}`}</span>
              )}
            </div>

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
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Popover open={calendarOpen === 'start'} onOpenChange={(openPopover) => setCalendarOpen(openPopover ? 'start' : null)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          disabled={saving}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFormData.startDate ? formatDateDDMMYYYY(editFormData.startDate) : 'Select date'}
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
                            value={
                              editFormData.startDate
                                ? (() => {
                                    const [year, month, day] = editFormData.startDate.split('-').map(Number);
                                    return new Date(year, month - 1, day);
                                  })()
                                : null
                            }
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
                    <Popover open={calendarOpen === 'due'} onOpenChange={(openPopover) => setCalendarOpen(openPopover ? 'due' : null)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          disabled={saving}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFormData.dueDate ? formatDateDDMMYYYY(editFormData.dueDate) : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[100] date-picker-popover shadow-lg" align="start">
                        <div className="date-picker-calendar-wrapper">
                          <Calendar
                            onChange={(value: any) => {
                              if (value instanceof Date) {
                                const year = value.getFullYear();
                                const month = String(value.getMonth() + 1).padStart(2, '0');
                                const day = String(value.getDate()).toString().padStart(2, '0');
                                const dateStr = `${year}-${month}-${day}`;
                                setEditFormData({ ...editFormData, dueDate: dateStr });
                                setCalendarOpen(null);
                              }
                            }}
                            value={
                              editFormData.dueDate
                                ? (() => {
                                    const [year, month, day] = editFormData.dueDate.split('-').map(Number);
                                    return new Date(year, month - 1, day);
                                  })()
                                : null
                            }
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
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, assigneeId: value === 'none' ? '' : value })
                    }
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
                  <p className="text-xs text-destructive flex items-center gap-1">{workflowError}</p>
                )}
                {aiTransitionError && (
                  <p className="text-xs text-destructive flex items-center gap-1">{aiTransitionError}</p>
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
                    </div>
                  )}
                  {workflowTransitions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No transitions available from the current status.</p>
                  ) : (
                    <div className="space-y-2">
                      {workflowTransitions.map((transition) => (
                        <div
                          key={transition.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">{transition.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {transition.fromKey}
                              <ArrowRight className="h-3 w-3" />
                              {transition.toKey}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePerformTransition(transition.id, transition.transitionKey)}
                            disabled={workflowLoading}
                          >
                            Apply
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={handleDiscard} disabled={saving}>
                  <X className="mr-2 h-4 w-4" />
                  Discard
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            {taskId ? 'Unable to load task details.' : 'Select a task to view details.'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}






