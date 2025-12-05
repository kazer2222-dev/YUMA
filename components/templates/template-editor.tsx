'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Plus, Trash2, X, Save, Clock, GitBranch, Copy, Unlink, Loader2, AlertCircle } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';
import type { Template, TemplateField, TemplateAccessRule } from './template-types';
import { TemplateAccessSection } from './template-access-section';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { WorkflowDetail, WorkflowSummary } from '@/lib/workflows/types';
import { WorkflowDesignerDialog } from './workflow-designer-dialog';
import ReactFlow, {
  Background as FlowBackground,
  Controls as FlowControls,
  MarkerType,
  ReactFlowProvider,
  type Edge as FlowEdge,
  type Node as FlowNode,
} from 'reactflow';

interface TemplateEditorProps {
  spaceSlug: string;
  template: Template | null;
  open: boolean;
  onOpenChange: (saved: boolean) => void;
}

const FIELD_TYPES = [
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date Picker' },
  { value: 'datetime', label: 'Date-Time Picker' },
  { value: 'labels', label: 'Labels' },
  { value: 'number', label: 'Number Field' },
  { value: 'paragraph', label: 'Paragraph (Multi-line Text)' },
  { value: 'radio', label: 'Radio Button' },
  { value: 'select', label: 'Select List (Single Choice)' },
  { value: 'multiselect', label: 'Select List (Multiple Choice)' },
  { value: 'url', label: 'URL Field' },
  { value: 'user', label: 'User Picker Field' },
];

const NO_DEFAULT_OPTION = '__no_default__';
const NO_TIME_OPTION = '__no_time__';

interface SpaceCustomField {
  id: string;
  name: string;
  key: string;
  type: string;
  options?: string[] | null;
  required?: boolean;
  helpText?: string | null;
  defaultValue?: any;
  inlineLabel?: string | null;
}

const TEMPLATE_TO_CUSTOM_FIELD_TYPES: Record<TemplateField['type'], string[]> = {
  checkbox: ['BOOLEAN', 'MULTI_SELECT'],
  date: ['DATE'],
  datetime: ['DATETIME'],
  labels: ['LABELS', 'MULTI_SELECT'],
  number: ['NUMBER'],
  paragraph: ['TEXT'],
  radio: ['SINGLE_SELECT'],
  select: ['SINGLE_SELECT'],
  multiselect: ['MULTI_SELECT'],
  url: ['URL', 'TEXT'],
  user: ['USER'],
};

type AiWorkflowSuggestion = {
  name: string;
  description: string;
  statuses: Array<{
    key: string;
    name: string;
    category: string;
    color?: string;
    isInitial: boolean;
    isFinal: boolean;
    order: number;
  }>;
  transitions: Array<{
    name: string;
    fromKey: string;
    toKey: string;
    uiTrigger: string;
    order: number;
    assigneeOnly?: boolean;
    adminOnly?: boolean;
    requirePriority?: boolean;
    preventOpenSubtasks?: boolean;
  }>;
  recommendations?: string[];
  warnings?: string[];
  validations?: {
    warnings?: string[];
    issues?: string[];
  };
};

const deriveCustomFieldType = (field: TemplateField): string => {
  const candidates = TEMPLATE_TO_CUSTOM_FIELD_TYPES[field.type] || ['TEXT'];

  if (field.type === 'checkbox') {
    const hasOptions = Array.isArray(field.options) && field.options.length > 0;
    return hasOptions ? 'MULTI_SELECT' : 'BOOLEAN';
  }

  if (field.type === 'labels') {
    return 'MULTI_SELECT';
  }

  if (field.type === 'url') {
    return 'URL';
  }

  return candidates[0];
};

const isCompatibleCustomFieldType = (
  templateField: TemplateField,
  customFieldType: string
): boolean => {
  const allowed = TEMPLATE_TO_CUSTOM_FIELD_TYPES[templateField.type] || [];
  if (templateField.type === 'checkbox') {
    const hasOptions = Array.isArray(templateField.options) && templateField.options.length > 0;
    if (hasOptions) {
      return customFieldType === 'MULTI_SELECT';
    }
    return customFieldType === 'BOOLEAN';
  }
  if (templateField.type === 'labels') {
    return customFieldType === 'MULTI_SELECT';
  }
  if (templateField.type === 'url') {
    return customFieldType === 'URL' || customFieldType === 'TEXT';
  }
  return allowed.includes(customFieldType);
};

const normalizeCustomFieldOptions = (field: TemplateField): string[] | undefined => {
  if (Array.isArray(field.options) && field.options.length > 0) {
    return field.options;
  }
  if (field.type === 'checkbox' && Array.isArray(field.options)) {
    return field.options;
  }
  return undefined;
};

const slugify = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

const generateCustomFieldKey = (label: string, existingKeys: Set<string>): string => {
  let base = slugify(label);
  if (!base) {
    base = `field-${Date.now()}`;
  }

  let candidate = base;
  let counter = 1;
  while (existingKeys.has(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
};

const findCustomFieldByName = (fields: SpaceCustomField[], name: string): SpaceCustomField | undefined => {
  const target = name.trim().toLowerCase();
  return fields.find((field) => field.name.trim().toLowerCase() === target);
};

type WorkflowStatusSuggestion = {
  id: string;
  key: string;
  name: string;
  category: 'TODO' | 'IN_PROGRESS' | 'DONE';
  color?: string | null;
  isInitial: boolean;
  isFinal: boolean;
  order: number;
  visibilityRules?: Record<string, any> | null;
  fieldLockRules?: Record<string, any> | null;
  statusRefId?: string | null;
};

function convertSuggestionToWorkflowDetail(suggestion: any, spaceId?: string | null): WorkflowDetail {
  const now = new Date();
  const statuses = Array.isArray(suggestion.statuses)
    ? suggestion.statuses.map((status: any, index: number) => ({
      id: `ai-status-${index}-${Date.now()}`,
      key: status.key,
      name: status.name,
      category: status.category,
      color: status.color ?? null,
      isInitial: Boolean(status.isInitial),
      isFinal: Boolean(status.isFinal),
      order: status.order ?? index,
      visibilityRules: undefined,
      fieldLockRules: undefined,
      statusRefId: undefined,
    }))
    : [];

  const statusKeyToId = new Map<string, string>(
    statuses.map((status: WorkflowStatusSuggestion) => [status.key, status.id]),
  );
  const defaultFromId = statuses[0]?.id ?? '';
  const defaultToId = statuses[statuses.length - 1]?.id ?? defaultFromId;

  const transitions = Array.isArray(suggestion.transitions)
    ? suggestion.transitions.map((transition: any, index: number) => {
      const conditions: Record<string, any> = {};
      if (transition.assigneeOnly) {
        conditions.roles = ['ASSIGNEE'];
      }
      if (transition.adminOnly) {
        conditions.roles = [...(conditions.roles || []), 'OWNER', 'ADMIN'];
      }
      if (transition.requirePriority) {
        conditions.requiredFields = ['priority'];
      }

      const validators: Record<string, any> = {};
      if (transition.preventOpenSubtasks) {
        validators.preventOpenSubtasks = true;
      }

      return {
        id: `ai-transition-${index}-${Date.now()}`,
        key: `${transition.fromKey}-${transition.toKey}`,
        name: transition.name,
        fromId: statusKeyToId.get(transition.fromKey) ?? defaultFromId,
        toId: statusKeyToId.get(transition.toKey) ?? defaultToId,
        fromKey: transition.fromKey,
        toKey: transition.toKey,
        conditions: Object.keys(conditions).length ? conditions : undefined,
        validators: Object.keys(validators).length ? validators : undefined,
        postFunctions: undefined,
        uiTrigger: transition.uiTrigger ?? 'BUTTON',
        order: transition.order ?? index,
      };
    })
    : [];

  return {
    id: `ai-suggestion-${Date.now()}`,
    spaceId: spaceId ?? '',
    name: suggestion.name ?? 'Suggested Workflow',
    description: suggestion.description ?? '',
    isDefault: false,
    aiOptimized: true,
    version: 1,
    linkedTemplates: [],
    createdAt: now,
    updatedAt: now,
    statuses,
    transitions,
  };
}

export function TemplateEditor({ spaceSlug, template, open, onOpenChange }: TemplateEditorProps) {
  const { success, error: showError } = useToastHelpers();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [customFields, setCustomFields] = useState<SpaceCustomField[]>([]);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState<Array<{ id: string; name?: string; email: string }>>([]);
  const [activeTab, setActiveTab] = useState<'fields' | 'workflow' | 'access'>('fields');
  // Access control state
  const [restrictAccess, setRestrictAccess] = useState<boolean>(template?.restrictAccess ?? false);
  const [accessRules, setAccessRules] = useState<TemplateAccessRule[]>(template?.accessRules ?? []);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(template?.workflowId ?? null);
  const [pendingWorkflowId, setPendingWorkflowId] = useState<string | null>(template?.workflowId ?? null);
  const [workflowDetail, setWorkflowDetail] = useState<WorkflowDetail | null>(null);
  const [workflowDesignerOpen, setWorkflowDesignerOpen] = useState(false);
  const [designerWorkflowId, setDesignerWorkflowId] = useState<string | null>(null);
  const [designerSeedWorkflow, setDesignerSeedWorkflow] = useState<WorkflowDetail | null>(null);
  const [assignOnDesignerSave, setAssignOnDesignerSave] = useState(false);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false);
  const [aiSuggestionError, setAiSuggestionError] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [aiSuggestionWarnings, setAiSuggestionWarnings] = useState<string[]>([]);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [aiReviewSuggestion, setAiReviewSuggestion] = useState<AiWorkflowSuggestion | null>(null);
  const [aiSuggestionIssues, setAiSuggestionIssues] = useState<string[]>([]);

  const loadWorkflows = useCallback(async () => {
    if (!spaceId) {
      return;
    }
    setWorkflowsLoading(true);
    setWorkflowError('');
    try {
      const response = await fetch(`/api/workflows?spaceId=${spaceId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setWorkflows(Array.isArray(data.workflows) ? data.workflows : []);
      } else {
        const message = data.message || 'Failed to load workflows';
        setWorkflowError(message);
        showError(message);
      }
    } catch (err) {
      console.error('Failed to load workflows:', err);
      const message = 'Failed to load workflows';
      setWorkflowError(message);
      showError(message);
    } finally {
      setWorkflowsLoading(false);
    }
  }, [spaceId, showError]);

  const loadWorkflowDetail = useCallback(async (workflowId: string | null) => {
    if (!spaceId || !workflowId) {
      if (!workflowId) {
        setWorkflowDetail(null);
      }
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}?spaceId=${spaceId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setWorkflowDetail(data.workflow ?? null);
      } else {
        const message = data.message || 'Failed to load workflow';
        setWorkflowError(message);
        showError(message);
      }
    } catch (err) {
      console.error('Failed to load workflow detail:', err);
      const message = 'Failed to load workflow';
      setWorkflowError(message);
      showError(message);
    }
  }, [spaceId, showError]);

  const assignWorkflow = useCallback(
    async (workflowId: string | null, templateIdOverride?: string) => {
      const targetTemplateId = templateIdOverride ?? template?.id ?? null;

      if (!spaceId || !targetTemplateId) {
        setPendingWorkflowId(workflowId);
        setSelectedWorkflowId(workflowId);
        await loadWorkflowDetail(workflowId ?? null);
        return;
      }

      setWorkflowSaving(true);
      setWorkflowError('');
      try {
        const response = await fetch(`/api/templates/${targetTemplateId}/workflow`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ workflowId }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setSelectedWorkflowId(workflowId);
          setPendingWorkflowId(workflowId);
          await loadWorkflowDetail(workflowId ?? null);
          success(workflowId ? 'Workflow linked to template.' : 'Workflow unlinked from template.');
        } else {
          const message = data.message || 'Failed to update workflow assignment';
          setWorkflowError(message);
          showError(message);
        }
      } catch (err) {
        console.error('Failed to assign workflow:', err);
        const message = 'Failed to update workflow assignment';
        setWorkflowError(message);
        showError(message);
      } finally {
        setWorkflowSaving(false);
      }
    },
    [spaceId, template?.id, loadWorkflowDetail, success, showError]
  );

  const handleWorkflowSelect = useCallback(
    async (value: string) => {
      if (value === '__none__') {
        await assignWorkflow(null);
      } else {
        await assignWorkflow(value);
      }
    },
    [assignWorkflow]
  );

  const handleDuplicateWorkflow = useCallback(async () => {
    if (!spaceId || !selectedWorkflowId) {
      return;
    }

    setWorkflowSaving(true);
    try {
      const response = await fetch(`/api/workflows/${selectedWorkflowId}/duplicate?spaceId=${spaceId}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success && data.workflow) {
        success(`Workflow '${data.workflow.name}' duplicated.`);
        await loadWorkflows();
        setSelectedWorkflowId(data.workflow.id);
        setPendingWorkflowId(data.workflow.id);
        await loadWorkflowDetail(data.workflow.id);
      } else {
        const message = data.message || 'Failed to duplicate workflow';
        showError(message);
      }
    } catch (err) {
      console.error('Failed to duplicate workflow:', err);
      showError('Failed to duplicate workflow');
    } finally {
      setWorkflowSaving(false);
    }
  }, [spaceId, selectedWorkflowId, success, showError, loadWorkflows, loadWorkflowDetail]);

  const handleOpenWorkflowDesigner = (
    workflowId?: string | null,
    assignOnSave = false,
    seedWorkflow?: WorkflowDetail | null,
  ) => {
    setDesignerWorkflowId(workflowId ?? null);
    setDesignerSeedWorkflow(seedWorkflow ?? null);
    setAssignOnDesignerSave(assignOnSave);
    setWorkflowDesignerOpen(true);
  };

  const handleAISuggestWorkflow = useCallback(async () => {
    setAiSuggestionLoading(true);
    setAiSuggestionError('');
    setAiRecommendations([]);
    setAiSuggestionWarnings([]);
    setAiSuggestionIssues([]);
    setAiReviewSuggestion(null);
    setAiReviewOpen(false);
    try {
      const response = await fetch('/api/ai/workflows/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          templateId: template?.id,
          templateName: title,
          spaceId,
          fields: fields.map((field) => ({
            id: field.id,
            type: field.type,
            label: field.label,
            required: field.required,
          })),
        }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.suggestion) {
        const suggestion: AiWorkflowSuggestion = {
          ...data.suggestion,
          recommendations: Array.isArray(data.suggestion.recommendations)
            ? data.suggestion.recommendations
            : [],
          warnings: Array.isArray(data.suggestion.warnings) ? data.suggestion.warnings : [],
          validations: data.suggestion.validations,
        };

        const validationWarnings = Array.isArray(suggestion.validations?.warnings)
          ? suggestion.validations?.warnings
          : [];
        const combinedWarnings = new Set<string>([
          ...(suggestion.warnings ?? []),
          ...validationWarnings,
        ]);

        const combinedIssues = Array.isArray(data.issues)
          ? data.issues
          : Array.isArray(suggestion.validations?.issues)
            ? suggestion.validations?.issues ?? []
            : [];

        setAiRecommendations(suggestion.recommendations ?? []);
        setAiSuggestionWarnings(Array.from(combinedWarnings));
        setAiSuggestionIssues(combinedIssues);
        setAiReviewSuggestion(suggestion);
        setAiReviewOpen(true);
      } else {
        const message = data.message || 'Failed to generate AI suggestion';
        if (Array.isArray(data.issues) && data.issues.length > 0) {
          setAiSuggestionIssues(data.issues);
        }
        setAiSuggestionError(message);
        showError(message);
      }
    } catch (err) {
      console.error('Failed to generate AI workflow suggestion:', err);
      const message = 'Failed to generate AI suggestion';
      setAiSuggestionError(message);
      showError(message);
    } finally {
      setAiSuggestionLoading(false);
    }
  }, [fields, template?.id, title, spaceId, showError]);

  const handleConfirmAISuggestion = useCallback(() => {
    if (!aiReviewSuggestion || aiSuggestionIssues.length > 0) {
      return;
    }
    const suggestionWorkflow = convertSuggestionToWorkflowDetail(aiReviewSuggestion, spaceId);
    handleOpenWorkflowDesigner(null, true, suggestionWorkflow);
    setAiReviewOpen(false);
    setAiReviewSuggestion(null);
    setAiSuggestionIssues([]);
  }, [aiReviewSuggestion, aiSuggestionIssues.length, spaceId, handleOpenWorkflowDesigner]);

  const handleDismissAISuggestion = useCallback(() => {
    setAiReviewOpen(false);
    setAiReviewSuggestion(null);
    setAiSuggestionIssues([]);
  }, []);

  const handleDesignerSaved = useCallback(
    async (detail: WorkflowDetail, options?: { assign?: boolean }) => {
      setWorkflowDesignerOpen(false);
      setDesignerWorkflowId(null);
      setAssignOnDesignerSave(false);

      await loadWorkflows();

      if (options?.assign) {
        await assignWorkflow(detail.id);
      } else {
        setSelectedWorkflowId(detail.id);
        setPendingWorkflowId(detail.id);
        await loadWorkflowDetail(detail.id);
      }
    },
    [assignWorkflow, loadWorkflows, loadWorkflowDetail]
  );

  useEffect(() => {
    if (open) {
      if (template) {
        setTitle(template.title);
        setFields(template.fieldConfig || []);
        setRestrictAccess(template.restrictAccess ?? false);
        setAccessRules(template.accessRules ?? []);
      } else {
        setTitle('');
        // Summary field is always present and required
        setFields([
          {
            id: 'summary',
            type: 'paragraph',
            label: 'Task Summary',
            required: true,
            order: 0,
          },
        ]);
        setRestrictAccess(false);
        setAccessRules([]);
      }
      setError('');
    }
  }, [open, template]);

  useEffect(() => {
    if (!open) {
      setActiveTab('fields');
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const currentWorkflowId = template?.workflowId ?? null;
    setSelectedWorkflowId(currentWorkflowId);
    setPendingWorkflowId(currentWorkflowId);
  }, [open, template?.workflowId]);

  // Load access rules from API when editing existing template
  useEffect(() => {
    if (!open || !template?.id) {
      return;
    }

    let isCancelled = false;

    const fetchAccessRules = async () => {
      try {
        const response = await fetch(
          `/api/spaces/${spaceSlug}/templates/${template.id}/access`,
          { credentials: 'include' }
        );
        const data = await response.json();
        if (!isCancelled && data.success) {
          setRestrictAccess(data.restrictAccess ?? false);
          setAccessRules(data.accessRules ?? []);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch access rules:', err);
        }
      }
    };

    fetchAccessRules();

    return () => {
      isCancelled = true;
    };
  }, [open, template?.id, spaceSlug]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCancelled = false;

    fetch(`/api/spaces/${spaceSlug}/custom-fields`, {
      credentials: 'include'
    })
      .then((response) => response.json())
      .then((data) => {
        if (isCancelled) return;

        if (data.success) {
          const resolved: SpaceCustomField[] = Array.isArray(data.customFields)
            ? data.customFields.map((field: any) => {
              let parsedOptions: string[] | null = null;
              if (Array.isArray(field.options)) {
                parsedOptions = field.options;
              } else if (typeof field.options === 'string') {
                try {
                  const json = JSON.parse(field.options);
                  if (Array.isArray(json)) {
                    parsedOptions = json;
                  } else if (json && typeof json === 'object') {
                    parsedOptions = Object.values(json).map((value: any) => String(value));
                  }
                } catch {
                  parsedOptions = null;
                }
              } else if (field.options && typeof field.options === 'object') {
                parsedOptions = Object.values(field.options).map((value: any) => String(value));
              }

              return {
                id: field.id,
                name: field.name,
                key: field.key,
                type: field.type,
                options: parsedOptions,
                required: field.required,
                helpText: field.helpText ?? null,
                defaultValue: field.defaultValue,
                inlineLabel: field.inlineLabel ?? null,
              } satisfies SpaceCustomField;
            })
            : [];
          setCustomFields(resolved);
        } else if (data.message) {
          showError(data.message);
          setCustomFields([]);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to fetch custom fields for templates:', err);
          showError('Failed to fetch custom fields');
          setCustomFields([]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [open, spaceSlug, showError]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCancelled = false;

    fetch(`/api/spaces/${spaceSlug}/members`, {
      credentials: 'include'
    })
      .then((response) => response.json())
      .then((data) => {
        if (isCancelled) return;

        if (data.success) {
          const resolvedMembers = Array.isArray(data.members)
            ? data.members
              .map((member: any) => member?.user)
              .filter((user: any) => user && typeof user.id === 'string')
              .map((user: any) => ({
                id: user.id,
                name: user.name || undefined,
                email: user.email
              }))
            : [];

          setMembers(resolvedMembers);
        } else if (data.message) {
          showError(data.message);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to fetch space members for templates:', err);
          showError('Failed to fetch space members for templates');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [open, spaceSlug, showError]);

  useEffect(() => {
    if (!open || spaceId) {
      return;
    }

    let cancelled = false;

    const fetchSpaceContext = async () => {
      try {
        const response = await fetch(`/api/spaces/${spaceSlug}`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (!cancelled && response.ok && data.success && data.space?.id) {
          setSpaceId(data.space.id);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load space context:', err);
        }
      }
    };

    fetchSpaceContext();

    return () => {
      cancelled = true;
    };
  }, [open, spaceSlug, spaceId]);

  useEffect(() => {
    if (!open || !spaceId) {
      return;
    }
    loadWorkflows();
  }, [open, spaceId, loadWorkflows]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!selectedWorkflowId) {
      setWorkflowDetail(null);
      return;
    }

    loadWorkflowDetail(selectedWorkflowId);
  }, [open, selectedWorkflowId, spaceId, loadWorkflowDetail]);

  const handleAddField = () => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      type: 'paragraph',
      label: '',
      required: false,
      order: fields.length,
    };
    setEditingField(newField);
    setFieldDialogOpen(true);
  };

  const handleEditField = (field: TemplateField) => {
    // Don't allow editing the summary field
    if (field.id === 'summary') return;
    setEditingField({ ...field });
    setFieldDialogOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    // Don't allow deleting the summary field
    if (fieldId === 'summary') return;
    setFields(fields.filter(f => f.id !== fieldId).map((f, idx) => ({ ...f, order: idx })));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    newFields.forEach((f, idx) => { f.order = idx; });
    setFields(newFields);
  };

  const ensureCustomFieldsForTemplate = async (inputFields: TemplateField[]): Promise<TemplateField[]> => {
    const existingKeys = new Set(customFields.map((cf) => cf.key));
    const newCustomFields: SpaceCustomField[] = [];
    const updatedFields: TemplateField[] = [];

    for (const field of inputFields) {
      if (field.id === 'summary') {
        updatedFields.push(field);
        continue;
      }

      const trimmedLabel = field.label?.trim();
      if (!trimmedLabel) {
        updatedFields.push(field);
        continue;
      }

      if (field.customFieldId) {
        const matched = customFields.find((cf) => cf.id === field.customFieldId) || newCustomFields.find((cf) => cf.id === field.customFieldId);
        if (matched) {
          updatedFields.push({
            ...field,
            customFieldKey: matched.key,
            customFieldType: matched.type,
          });
          continue;
        }
        // Fall through to recreate if the referenced custom field no longer exists
      }

      const existingByName = findCustomFieldByName(customFields, trimmedLabel) || findCustomFieldByName(newCustomFields, trimmedLabel);

      if (existingByName) {
        if (!isCompatibleCustomFieldType(field, existingByName.type)) {
          throw new Error(`Field "${trimmedLabel}" already exists as a ${existingByName.type.toLowerCase()} field. Choose a different name.`);
        }

        updatedFields.push({
          ...field,
          customFieldId: existingByName.id,
          customFieldKey: existingByName.key,
          customFieldType: existingByName.type,
          options: field.options,
        });
        continue;
      }

      const customFieldType = deriveCustomFieldType(field);
      const customFieldOptions = normalizeCustomFieldOptions(field);
      const payload: any = {
        name: trimmedLabel,
        key: generateCustomFieldKey(trimmedLabel, existingKeys),
        type: customFieldType,
        required: Boolean(field.required),
      };

      if (customFieldOptions && customFieldOptions.length > 0) {
        payload.options = customFieldOptions;
      }

      const response = await fetch(`/api/spaces/${spaceSlug}/custom-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create custom field');
      }

      const created: SpaceCustomField = {
        id: data.customField.id,
        name: data.customField.name,
        key: data.customField.key,
        type: data.customField.type,
        options: Array.isArray(data.customField.options) ? data.customField.options : null,
        required: data.customField.required,
        helpText: data.customField.helpText || null,
        defaultValue: data.customField.defaultValue || null,
        inlineLabel: data.customField.inlineLabel || null,
      };

      existingKeys.add(created.key);
      newCustomFields.push(created);

      updatedFields.push({
        ...field,
        customFieldId: created.id,
        customFieldKey: created.key,
        customFieldType: created.type,
      });
    }

    if (newCustomFields.length > 0) {
      setCustomFields((prev) => [...prev, ...newCustomFields]);
    }

    return updatedFields;
  };

  const getTransitionRules = useCallback((transition: WorkflowDetail['transitions'][number]) => {
    const rules: string[] = [];
    const roles = Array.isArray(transition.conditions?.roles) ? transition.conditions?.roles : [];
    if (roles.includes('ASSIGNEE')) {
      rules.push('Assignee only');
    }
    if (roles.includes('OWNER') || roles.includes('ADMIN')) {
      rules.push('Admin or owner');
    }
    const requiredFields = Array.isArray(transition.conditions?.requiredFields) ? transition.conditions?.requiredFields : [];
    if (requiredFields.includes('priority')) {
      rules.push('Priority required');
    }
    const templateFields = Array.isArray(transition.conditions?.templateFields) ? transition.conditions?.templateFields : [];
    if (templateFields.length > 0) {
      rules.push(`Requires fields: ${templateFields.join(', ')}`);
    }
    if (transition.validators?.preventOpenSubtasks) {
      rules.push('No open subtasks');
    }
    return rules;
  }, []);

  const workflowTabContent = (
    <div className="space-y-4">
      {workflowError && (
        <Alert variant="destructive">
          <AlertDescription>{workflowError}</AlertDescription>
        </Alert>
      )}

      {!spaceId ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Loading space context...
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Linked Workflow</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAISuggestWorkflow}
                  disabled={workflowSaving || aiSuggestionLoading || fields.length === 0}
                >
                  {aiSuggestionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GitBranch className="h-4 w-4 mr-2" />
                  )}
                  AI Suggest Workflow
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenWorkflowDesigner(null, true)}
                  disabled={workflowSaving}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
                {selectedWorkflowId && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenWorkflowDesigner(selectedWorkflowId, false)}
                      disabled={workflowSaving}
                    >
                      Edit Workflow
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleDuplicateWorkflow}
                      disabled={workflowSaving}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => assignWorkflow(null)}
                      disabled={workflowSaving}
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Unlink
                    </Button>
                  </>
                )}
              </div>
            </div>

            {workflowsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading workflows...
              </div>
            ) : workflows.length > 0 ? (
              <Select value={selectedWorkflowId ?? '__none__'} onValueChange={handleWorkflowSelect} disabled={workflowSaving}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workflow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No workflow</SelectItem>
                  {workflows.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                      {workflow.isDefault ? ' (Default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No workflows available yet. Create one to define the task lifecycle.
              </div>
            )}
            {!template?.id && pendingWorkflowId && (
              <p className="text-xs text-muted-foreground">
                The selected workflow will be linked after you save this template.
              </p>
            )}
            {aiSuggestionError && (
              <Alert variant="destructive">
                <AlertDescription>{aiSuggestionError}</AlertDescription>
              </Alert>
            )}
            {aiRecommendations.length > 0 && (
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">AI Recommendations</p>
                <ul className="list-disc pl-5 space-y-1">
                  {aiRecommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiSuggestionWarnings.length > 0 && (
              <div className="rounded-md border border-amber-300/70 bg-amber-500/10 p-3 text-xs text-amber-900 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-100">
                <p className="font-medium">AI Warnings</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {aiSuggestionWarnings.map((warning, idx) => (
                    <li key={`warning-${idx}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiSuggestionIssues.length > 0 && (
              <Alert variant="destructive">
                <div className="space-y-2">
                  <p className="text-sm font-medium">AI validation blockers</p>
                  <ul className="list-disc space-y-1 pl-5 text-xs">
                    {aiSuggestionIssues.map((issue, idx) => (
                      <li key={`issue-${idx}`}>{issue}</li>
                    ))}
                  </ul>
                </div>
              </Alert>
            )}
          </div>

          {workflowDetail ? (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{workflowDetail.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Version {workflowDetail.version}
                    {workflowDetail.isDefault ? ' · Default workflow' : ''}
                    {workflowDetail.aiOptimized ? ' · AI optimized' : ''}
                  </p>
                  {workflowDetail.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{workflowDetail.description}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Linked templates: {workflowDetail.linkedTemplates.length}
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">Statuses</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {workflowDetail.statuses.map((status) => (
                        <div key={status.key} className="rounded border p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{status.name}</span>
                            <Badge variant="outline">{status.category.replace('_', ' ')}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="uppercase tracking-wide">{status.key}</span>
                            {status.isInitial && <span className="rounded border px-2 py-0.5">Initial</span>}
                            {status.isFinal && <span className="rounded border px-2 py-0.5">Final</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Transitions</p>
                    <div className="mt-2 space-y-2">
                      {workflowDetail.transitions.map((transition) => (
                        <div key={`${transition.fromKey}-${transition.toKey}`} className="rounded border p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{transition.name}</span>
                            <Badge variant="secondary">{transition.uiTrigger || 'Manual'}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {transition.fromKey} → {transition.toKey}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No workflow linked yet. Create or link a workflow to define task status transitions.
            </div>
          )}
        </>
      )}
    </div>
  );

  const handleSaveField = (field: TemplateField) => {
    if (!field.label.trim()) {
      setError('Field label is required');
      return;
    }

    if (['radio', 'select', 'multiselect'].includes(field.type) && (!field.options || field.options.length === 0)) {
      setError('Options are required for this field type');
      return;
    }

    setError('');
    const existingIndex = fields.findIndex(f => f.id === field.id);

    if (existingIndex >= 0) {
      const newFields = [...fields];
      newFields[existingIndex] = field;
      setFields(newFields);
    } else {
      setFields([...fields, field].map((f, idx) => ({ ...f, order: idx })));
    }

    setFieldDialogOpen(false);
    setEditingField(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Template title is required');
      return;
    }

    // Validate summary field exists
    const summaryField = fields.find(f => f.id === 'summary');
    if (!summaryField || !summaryField.label.trim()) {
      setError('Summary field is required');
      return;
    }

    // Validate all fields have labels
    for (const field of fields) {
      if (!field.label.trim()) {
        setError(`Field "${field.type}" must have a label`);
        return;
      }
      if (['radio', 'select', 'multiselect'].includes(field.type) && (!field.options || field.options.length === 0)) {
        setError(`Field "${field.label}" requires options`);
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      const preparedFields = await ensureCustomFieldsForTemplate(fields);
      setFields(preparedFields);

      const url = template
        ? `/api/spaces/${spaceSlug}/templates/${template.id}`
        : `/api/spaces/${spaceSlug}/templates`;

      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          fieldConfig: preparedFields.map(f => ({
            ...f,
            options: f.options || undefined,
            defaultValue: f.defaultValue || undefined,
            helpText: f.helpText || undefined,
            inlineLabel: f.inlineLabel || undefined,
            customFieldId: f.customFieldId,
            customFieldKey: f.customFieldKey,
            customFieldType: f.customFieldType,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const savedTemplateId = data.template?.id || template?.id;

        // Save access rules if the template was saved successfully
        if (savedTemplateId) {
          try {
            await fetch(`/api/spaces/${spaceSlug}/templates/${savedTemplateId}/access`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                restrictAccess,
                accessRules: accessRules.map(rule => ({
                  permission: rule.permission,
                  entityType: rule.entityType,
                  entityId: rule.entityId,
                })),
              }),
            });
          } catch (accessError) {
            console.error('Error saving access rules:', accessError);
            // Don't fail the save if access rules fail - they can be updated later
          }
        }

        if (!template && data.template?.id && pendingWorkflowId !== null) {
          await assignWorkflow(pendingWorkflowId, data.template.id);
        }

        success(data.message || `Template '${title}' ${template ? 'updated' : 'created'} successfully.`);
        onOpenChange(true);
      } else {
        setError(data.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      if (error instanceof Error && error.message) {
        setError(error.message);
      } else {
        setError('Failed to save template');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onOpenChange(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{template ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            <DialogDescription>
              Configure the form layout for task creation. The summary field is always present and required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Template Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Template Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Bug Report, Feature Request"
                disabled={loading}
              />
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'fields' | 'workflow' | 'access')} className="w-full">
              <TabsList>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="access">Access</TabsTrigger>
              </TabsList>
              <TabsContent value="fields" className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Fields</Label>
                  <Button type="button" onClick={handleAddField} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                <div className="space-y-2 border rounded-lg p-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.label || 'Unnamed Field'}</span>
                          {field.required && (
                            <span className="text-xs text-muted-foreground">(Required)</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            ({FIELD_TYPES.find(t => t.value === field.type)?.label || field.type})
                          </span>
                        </div>
                        {field.helpText && (
                          <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveField(index, 'up')}
                            disabled={field.id === 'summary'}
                          >
                            ↑
                          </Button>
                        )}
                        {index < fields.length - 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveField(index, 'down')}
                          >
                            ↓
                          </Button>
                        )}
                        {field.id !== 'summary' && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditField(field)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteField(field.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="workflow" className="pt-4">
                {workflowTabContent}
              </TabsContent>
              <TabsContent value="access" className="pt-4">
                <TemplateAccessSection
                  spaceSlug={spaceSlug}
                  templateId={template?.id}
                  restrictAccess={restrictAccess}
                  accessRules={accessRules}
                  onRestrictAccessChange={setRestrictAccess}
                  onAccessRulesChange={setAccessRules}
                  disabled={loading}
                />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Configuration Dialog */}
      {editingField && (
        <FieldConfigDialog
          field={editingField}
          open={fieldDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setFieldDialogOpen(false);
              setEditingField(null);
              setError('');
            }
          }}
          onSave={handleSaveField}
          members={members}
          customFields={customFields}
        />
      )}

      {workflowDesignerOpen ? (
        <WorkflowDesignerDialog
          open={workflowDesignerOpen}
          onOpenChange={(open) => {
            setWorkflowDesignerOpen(open);
            if (!open) {
              setDesignerWorkflowId(null);
              setDesignerSeedWorkflow(null);
              setAssignOnDesignerSave(false);
            }
          }}
          spaceId={spaceId}
          workflowId={designerWorkflowId}
          initialWorkflow={
            designerWorkflowId && workflowDetail && designerWorkflowId === workflowDetail.id
              ? workflowDetail
              : undefined
          }
          draftWorkflow={designerSeedWorkflow ?? undefined}
          assignOnSave={assignOnDesignerSave}
          onSaved={handleDesignerSaved}
        />
      ) : null}

      <AlertDialog
        open={aiReviewOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            handleDismissAISuggestion();
          } else {
            setAiReviewOpen(true);
          }
        }}
      >
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Review AI-generated workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Inspect the proposed statuses and transitions before opening them in the designer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {aiSuggestionIssues.length > 0 && (
              <Alert variant="destructive">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Validation blockers detected</p>
                  <p className="text-xs text-muted-foreground">
                    Resolve these issues with your template configuration or fields and request a new AI draft.
                  </p>
                </div>
              </Alert>
            )}
            {aiSuggestionWarnings.length > 0 && aiSuggestionIssues.length === 0 && (
              <Alert>
                <AlertDescription>
                  Review the warnings below and adjust if necessary before applying the AI draft.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="mt-4 max-h-[420px] overflow-y-auto pr-4">
            {aiReviewSuggestion ? (
              <div className="space-y-6">
                <div className="rounded border p-3 text-sm">
                  <p className="font-semibold text-foreground">{aiReviewSuggestion.name}</p>
                  {aiReviewSuggestion.description && (
                    <p className="mt-1 text-muted-foreground">{aiReviewSuggestion.description}</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <GitBranch className="h-4 w-4" /> Statuses
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {aiReviewSuggestion.statuses.map((status) => (
                      <div key={status.key} className="rounded border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{status.name}</span>
                          <Badge variant="outline">{status.category.replace('_', ' ')}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="uppercase tracking-wide">{status.key}</span>
                          {status.isInitial && <span className="rounded border px-2 py-0.5">Initial</span>}
                          {status.isFinal && <span className="rounded border px-2 py-0.5">Final</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transitions</p>
                  <div className="mt-2 space-y-2">
                    {aiReviewSuggestion.transitions.map((transition) => (
                      <div key={`${transition.fromKey}-${transition.toKey}`} className="rounded border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{transition.name}</span>
                          <Badge variant="secondary">{transition.uiTrigger || 'Manual'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {transition.fromKey} → {transition.toKey}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {(aiSuggestionWarnings.length > 0 || aiSuggestionIssues.length > 0) && (
                  <div className="space-y-3">
                    {aiSuggestionWarnings.length > 0 && (
                      <div className="rounded border border-amber-300/70 bg-amber-500/10 p-3 text-xs text-amber-900 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-100">
                        <p className="text-sm font-medium">Warnings</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {aiSuggestionWarnings.map((warning, idx) => (
                            <li key={`modal-warning-${idx}`}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiSuggestionIssues.length > 0 && (
                      <div className="rounded border border-destructive/70 bg-destructive/10 p-3 text-xs text-destructive">
                        <p className="text-sm font-medium">Validation blockers</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {aiSuggestionIssues.map((issue, idx) => (
                            <li key={`modal-issue-${idx}`}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {aiReviewSuggestion.recommendations && aiReviewSuggestion.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">AI Recommendations</p>
                    <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {aiReviewSuggestion.recommendations.map((rec, idx) => (
                        <li key={`modal-rec-${idx}`}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No AI suggestion to review.</p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDismissAISuggestion}>Dismiss</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAISuggestion} disabled={aiSuggestionIssues.length > 0}>
              Open in designer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface FieldConfigDialogProps {
  field: TemplateField;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: TemplateField) => void;
  members: Array<{ id: string; name?: string; email: string }>;
  customFields: SpaceCustomField[];
}

function FieldConfigDialog({ field, open, onOpenChange, onSave, members, customFields }: FieldConfigDialogProps) {
  const typeRequiresOptions = (type: TemplateField['type']) => ['radio', 'select', 'multiselect'].includes(type);
  const typeSupportsOptions = (type: TemplateField['type']) => type === 'checkbox' || typeRequiresOptions(type);

  const normalizeField = (input: TemplateField): TemplateField => {
    const next: TemplateField = {
      ...input,
    };

    if (typeRequiresOptions(next.type)) {
      next.options = Array.isArray(next.options) ? [...next.options] : [];
    } else if (next.type === 'checkbox') {
      next.options = Array.isArray(next.options) ? [...next.options] : undefined;
    } else {
      next.options = undefined;
    }

    switch (next.type) {
      case 'checkbox': {
        const hasOptions = Array.isArray(next.options) && next.options.length > 0;
        if (hasOptions) {
          if (Array.isArray(next.defaultValue)) {
            next.defaultValue = next.defaultValue.filter((option) => typeof option === 'string');
          } else if (typeof next.defaultValue === 'string' && next.defaultValue) {
            next.defaultValue = [next.defaultValue];
          } else {
            next.defaultValue = [];
          }
        } else {
          next.defaultValue = typeof next.defaultValue === 'boolean' ? next.defaultValue : false;
        }
        next.inlineLabel = typeof next.inlineLabel === 'string' ? next.inlineLabel : '';
        break;
      }
      case 'date': {
        next.defaultValue = typeof next.defaultValue === 'string' ? next.defaultValue : '';
        break;
      }
      case 'datetime': {
        if (typeof next.defaultValue === 'string') {
          const [date, time] = next.defaultValue.split('T');
          next.defaultValue = { date: date || '', time: time || '' };
        } else if (next.defaultValue && typeof next.defaultValue === 'object') {
          const date = typeof (next.defaultValue as any).date === 'string' ? (next.defaultValue as any).date : '';
          const time = typeof (next.defaultValue as any).time === 'string' ? (next.defaultValue as any).time : '';
          next.defaultValue = { date, time };
        } else {
          next.defaultValue = { date: '', time: '' };
        }
        break;
      }
      case 'number': {
        if (next.defaultValue === undefined || next.defaultValue === null) {
          next.defaultValue = '';
        } else {
          next.defaultValue = String(next.defaultValue);
        }
        break;
      }
      case 'labels': {
        if (Array.isArray(next.defaultValue)) {
          next.defaultValue = next.defaultValue;
        } else if (typeof next.defaultValue === 'string') {
          next.defaultValue = next.defaultValue
            .split(/[ ,\n\t]+/)
            .map((label) => label.trim())
            .filter(Boolean);
        } else {
          next.defaultValue = [];
        }
        break;
      }
      case 'multiselect': {
        if (Array.isArray(next.defaultValue)) {
          next.defaultValue = next.defaultValue;
        } else if (typeof next.defaultValue === 'string' && next.defaultValue) {
          next.defaultValue = [next.defaultValue];
        } else {
          next.defaultValue = [];
        }
        break;
      }
      case 'paragraph':
      case 'radio':
      case 'select':
      case 'url':
      case 'user':
      default: {
        next.defaultValue = typeof next.defaultValue === 'string' ? next.defaultValue : '';
        break;
      }
    }

    return next;
  };

  const prepareFieldForSave = (input: TemplateField): TemplateField => {
    const normalized = normalizeField(input);
    const prepared: TemplateField = {
      ...normalized,
      options: typeRequiresOptions(normalized.type) ? normalized.options : undefined,
    };

    switch (normalized.type) {
      case 'checkbox': {
        const hasOptions = Array.isArray(normalized.options) && normalized.options.length > 0;
        if (hasOptions) {
          const arrayValue = Array.isArray(normalized.defaultValue)
            ? normalized.defaultValue
            : typeof normalized.defaultValue === 'string' && normalized.defaultValue
              ? [normalized.defaultValue]
              : [];
          prepared.defaultValue = arrayValue.filter((option) => typeof option === 'string' && option.trim());
        } else {
          prepared.defaultValue = Boolean(normalized.defaultValue);
        }
        const inline = normalized.inlineLabel?.trim();
        prepared.inlineLabel = inline ? inline : undefined;
        break;
      }
      case 'number': {
        if (normalized.defaultValue === '' || normalized.defaultValue === undefined || normalized.defaultValue === null) {
          prepared.defaultValue = undefined;
        } else {
          const parsed = Number(normalized.defaultValue);
          prepared.defaultValue = Number.isNaN(parsed) ? undefined : parsed;
        }
        break;
      }
      case 'date':
      case 'paragraph':
      case 'radio':
      case 'select':
      case 'url':
      case 'user': {
        if (typeof normalized.defaultValue === 'string' && normalized.defaultValue.trim() === '') {
          prepared.defaultValue = undefined;
        } else {
          prepared.defaultValue = normalized.defaultValue;
        }
        break;
      }
      case 'datetime': {
        if (
          normalized.defaultValue &&
          typeof normalized.defaultValue === 'object' &&
          ('date' in normalized.defaultValue || 'time' in normalized.defaultValue)
        ) {
          const { date = '', time = '' } = normalized.defaultValue as any;
          prepared.defaultValue = {
            date: typeof date === 'string' ? date : '',
            time: typeof time === 'string' ? time : ''
          };
        } else {
          prepared.defaultValue = { date: '', time: '' };
        }
        break;
      }
      case 'labels':
      case 'multiselect': {
        prepared.defaultValue = Array.isArray(normalized.defaultValue)
          ? normalized.defaultValue.filter((item) => typeof item === 'string' && item.trim())
          : [];
        break;
      }
      default:
        break;
    }

    return prepared;
  };

  const [localField, setLocalField] = useState<TemplateField>(() => normalizeField(field));
  const [newOption, setNewOption] = useState('');
  const [labelDraft, setLabelDraft] = useState('');
  const [autoLinkedFieldId, setAutoLinkedFieldId] = useState<string | null>(field.customFieldId ?? null);
  const [fieldError, setFieldError] = useState('');

  const trimmedLabel = useMemo(() => (localField.label || '').trim(), [localField.label]);
  const matchedCustomField = useMemo(() => {
    if (!trimmedLabel) return undefined;
    return findCustomFieldByName(customFields, trimmedLabel) || undefined;
  }, [customFields, trimmedLabel]);
  const isTypeCompatible = matchedCustomField ? isCompatibleCustomFieldType(localField, matchedCustomField.type) : true;
  const isAutoLinked = Boolean(autoLinkedFieldId && matchedCustomField && matchedCustomField.id === autoLinkedFieldId && isTypeCompatible);

  useEffect(() => {
    if (open) {
      const normalizedField = normalizeField(field);
      setLocalField(normalizedField);
      setNewOption('');
      setLabelDraft('');
      setAutoLinkedFieldId(field.customFieldId ?? null);
      setFieldError('');
    }
  }, [open, field]);

  useEffect(() => {
    if (!open) return;

    if (!trimmedLabel) {
      if (autoLinkedFieldId !== null || localField.customFieldId) {
        setAutoLinkedFieldId(null);
        setLocalField((prev) =>
          prev.customFieldId
            ? normalizeField({
              ...prev,
              customFieldId: undefined,
              customFieldKey: undefined,
              customFieldType: undefined,
            })
            : prev
        );
      }
      setFieldError('');
      return;
    }

    if (!matchedCustomField) {
      if (autoLinkedFieldId !== null || localField.customFieldId) {
        setAutoLinkedFieldId(null);
        setLocalField((prev) =>
          prev.customFieldId
            ? normalizeField({
              ...prev,
              customFieldId: undefined,
              customFieldKey: undefined,
              customFieldType: undefined,
            })
            : prev
        );
      }
      setFieldError('');
      return;
    }

    if (!isTypeCompatible) {
      setAutoLinkedFieldId(null);
      setFieldError(
        `Field "${trimmedLabel}" already exists with a different type (${matchedCustomField.type}). Choose another name or adjust the field type.`
      );
      setLocalField((prev) =>
        prev.customFieldId
          ? normalizeField({
            ...prev,
            customFieldId: undefined,
            customFieldKey: undefined,
            customFieldType: undefined,
          })
          : prev
      );
      return;
    }

    setFieldError('');

    if (autoLinkedFieldId === matchedCustomField.id) {
      return;
    }

    setAutoLinkedFieldId(matchedCustomField.id);
    setLocalField((prev) => {
      const next: TemplateField = {
        ...prev,
        label: matchedCustomField.name,
        customFieldId: matchedCustomField.id,
        customFieldKey: matchedCustomField.key,
        customFieldType: matchedCustomField.type,
        required: matchedCustomField.required ?? prev.required,
        options: Array.isArray(matchedCustomField.options) ? [...matchedCustomField.options] : prev.options,
        helpText: matchedCustomField.helpText ?? prev.helpText,
        defaultValue:
          matchedCustomField.defaultValue !== undefined ? matchedCustomField.defaultValue : prev.defaultValue,
        inlineLabel: matchedCustomField.inlineLabel ?? prev.inlineLabel,
      };
      return normalizeField(next);
    });
  }, [
    open,
    trimmedLabel,
    matchedCustomField,
    isTypeCompatible,
    autoLinkedFieldId,
    customFields,
    localField.customFieldId,
  ]);

  const handleFieldTypeChange = (value: TemplateField['type']) => {
    setLocalField((prev) => {
      const base: TemplateField = {
        ...prev,
        type: value,
        options: typeRequiresOptions(value)
          ? (Array.isArray(prev.options) ? [...prev.options] : [])
          : value === 'checkbox'
            ? (Array.isArray(prev.options) ? [...prev.options] : [])
            : undefined,
        inlineLabel: value === 'checkbox' ? prev.inlineLabel || '' : undefined,
        customFieldId: undefined,
        customFieldKey: undefined,
        customFieldType: undefined,
      };
      return normalizeField(base);
    });
    setNewOption('');
    setLabelDraft('');
    setAutoLinkedFieldId(null);
    setFieldError('');
  };

  const needsOptions = typeRequiresOptions(localField.type);
  const supportsOptions = typeSupportsOptions(localField.type);

  const handleAddOption = () => {
    if (isAutoLinked) return;
    if (!supportsOptions) return;
    const option = newOption.trim();
    if (!option) return;
    setLocalField((prev) => {
      const options = Array.isArray(prev.options) ? prev.options : [];
      if (options.includes(option)) {
        return prev;
      }
      return {
        ...prev,
        options: [...options, option]
      };
    });
    setNewOption('');
  };

  const handleRemoveOption = (option: string) => {
    if (isAutoLinked) return;
    setLocalField((prev) => {
      const options = Array.isArray(prev.options) ? prev.options : [];
      return {
        ...prev,
        options: options.filter((o) => o !== option)
      };
    });
  };

  const toggleMultiselectValue = (option: string, checked: boolean) => {
    setLocalField((prev) => {
      const current = Array.isArray(prev.defaultValue) ? prev.defaultValue : [];
      if (checked && !current.includes(option)) {
        return { ...prev, defaultValue: [...current, option] };
      }
      if (!checked) {
        return { ...prev, defaultValue: current.filter((value) => value !== option) };
      }
      return prev;
    });
  };

  const commitLabel = (label: string) => {
    const value = label.trim();
    if (!value) return;
    setLocalField((prev) => {
      const current = Array.isArray(prev.defaultValue) ? prev.defaultValue : [];
      if (current.includes(value)) {
        return prev;
      }
      return { ...prev, defaultValue: [...current, value] };
    });
  };

  const removeLabel = (label: string) => {
    setLocalField((prev) => {
      const current = Array.isArray(prev.defaultValue) ? prev.defaultValue : [];
      return { ...prev, defaultValue: current.filter((value) => value !== label) };
    });
  };

  const handleSaveClick = () => {
    if (!trimmedLabel) {
      setFieldError('Field label is required');
      return;
    }

    if (needsOptions && (!localField.options || localField.options.length === 0)) {
      setFieldError('At least one option is required for this field type.');
      return;
    }

    if (matchedCustomField && !isTypeCompatible) {
      setFieldError(
        `Field "${trimmedLabel}" already exists with a different type (${matchedCustomField.type}). Choose another name or adjust the field type.`
      );
      return;
    }

    setFieldError('');

    const preparedField = prepareFieldForSave({
      ...localField,
      label: trimmedLabel,
      customFieldId: isAutoLinked && matchedCustomField ? matchedCustomField.id : undefined,
      customFieldKey: isAutoLinked && matchedCustomField ? matchedCustomField.key : undefined,
      customFieldType: isAutoLinked && matchedCustomField ? matchedCustomField.type : undefined,
    });

    onSave(preparedField);
  };

  const renderDefaultValueControl = () => {
    switch (localField.type) {
      case 'checkbox': {
        const inlineLabel = typeof localField.inlineLabel === 'string' ? localField.inlineLabel : '';
        const hasOptions = Array.isArray(localField.options) && localField.options.length > 0;
        if (hasOptions) {
          const selectedValues = Array.isArray(localField.defaultValue) ? localField.defaultValue : [];
          return (
            <div className="space-y-2">
              <div className="border rounded-md divide-y">
                {localField.options?.map((option, idx) => {
                  const checked = selectedValues.includes(option);
                  return (
                    <label key={idx} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleMultiselectValue(option, Boolean(value))}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
              {selectedValues.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedValues.map((value) => (
                    <span key={value} className="px-2 py-1 text-xs bg-secondary rounded-md flex items-center gap-1">
                      {value}
                      <button
                        type="button"
                        onClick={() => toggleMultiselectValue(value, false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch
                id="field-default-checkbox"
                checked={Boolean(localField.defaultValue)}
                onCheckedChange={(checked) => setLocalField((prev) => ({ ...prev, defaultValue: checked }))}
              />
              <span className="text-sm text-muted-foreground">
                {Boolean(localField.defaultValue) ? 'Checked by default' : 'Unchecked by default'}
              </span>
            </div>
            <div className="space-y-1">
              <Label htmlFor="checkbox-inline-label">Checkbox text</Label>
              <Input
                id="checkbox-inline-label"
                value={inlineLabel}
                onChange={(e) => setLocalField((prev) => ({ ...prev, inlineLabel: e.target.value }))}
                placeholder="Shown next to the checkbox, e.g. Enable feature"
              />
            </div>
          </div>
        );
      }
      case 'number': {
        return (
          <Input
            id="field-default-number"
            type="number"
            value={typeof localField.defaultValue === 'string' ? localField.defaultValue : ''}
            onChange={(e) => setLocalField((prev) => ({ ...prev, defaultValue: e.target.value }))}
            placeholder="Optional default value"
          />
        );
      }
      case 'date': {
        return (
          <Input
            id="field-default-date"
            type="date"
            value={typeof localField.defaultValue === 'string' ? localField.defaultValue : ''}
            onChange={(e) => setLocalField((prev) => ({ ...prev, defaultValue: e.target.value }))}
          />
        );
      }
      case 'datetime': {
        const current = (localField.defaultValue as any) || { date: '', time: '' };
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              id="field-default-datetime-date"
              type="date"
              value={typeof current.date === 'string' ? current.date : ''}
              onChange={(e) => setLocalField((prev) => ({
                ...prev,
                defaultValue: {
                  ...(typeof prev.defaultValue === 'object' && prev.defaultValue !== null ? prev.defaultValue : {}),
                  date: e.target.value
                }
              }))}
            />
            <Select
              value={typeof current.time === 'string' && current.time ? current.time : NO_TIME_OPTION}
              onValueChange={(value) => {
                const nextTime = value === NO_TIME_OPTION ? '' : value;
                setLocalField((prev) => ({
                  ...prev,
                  defaultValue: {
                    ...(typeof prev.defaultValue === 'object' && prev.defaultValue !== null ? prev.defaultValue : {}),
                    time: nextTime
                  }
                }));
              }}
            >
              <SelectTrigger className="justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select time" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value={NO_TIME_OPTION}>No default</SelectItem>
                {Array.from({ length: 24 * 2 }).map((_, index) => {
                  const hours = Math.floor(index / 2);
                  const minutes = index % 2 === 0 ? '00' : '30';
                  const value = `${hours.toString().padStart(2, '0')}:${minutes}`;
                  return (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        );
      }
      case 'user': {
        const currentValue = typeof localField.defaultValue === 'string' && localField.defaultValue
          ? localField.defaultValue
          : NO_DEFAULT_OPTION;
        return (
          <Select
            value={currentValue}
            onValueChange={(value) => setLocalField((prev) => ({
              ...prev,
              defaultValue: value === NO_DEFAULT_OPTION ? '' : value
            }))}
            disabled={members.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={members.length === 0 ? 'No members available' : 'Select default user (optional)'} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value={NO_DEFAULT_OPTION}>No default</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name || member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case 'select':
      case 'radio': {
        const currentValue = typeof localField.defaultValue === 'string' ? localField.defaultValue : '';
        const selectValue = currentValue || NO_DEFAULT_OPTION;
        return (
          <Select
            value={selectValue}
            onValueChange={(value) => setLocalField((prev) => ({
              ...prev,
              defaultValue: value === NO_DEFAULT_OPTION ? '' : value
            }))}
            disabled={!localField.options || localField.options.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose default option (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_DEFAULT_OPTION}>No default</SelectItem>
              {localField.options?.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case 'multiselect': {
        const selectedValues = Array.isArray(localField.defaultValue) ? localField.defaultValue : [];
        if (!localField.options || localField.options.length === 0) {
          return <p className="text-sm text-muted-foreground">Add options before choosing defaults.</p>;
        }
        return (
          <div className="space-y-2">
            <div className="border rounded-md divide-y">
              {localField.options.map((option, idx) => {
                const checked = selectedValues.includes(option);
                return (
                  <label key={idx} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => toggleMultiselectValue(option, Boolean(value))}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedValues.map((value) => (
                  <span key={value} className="px-2 py-1 text-xs bg-secondary rounded-md flex items-center gap-1">
                    {value}
                    <button
                      type="button"
                      onClick={() => toggleMultiselectValue(value, false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'labels': {
        const labels = Array.isArray(localField.defaultValue) ? localField.defaultValue : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <span key={label} className="px-2 py-1 text-xs bg-secondary rounded-md flex items-center gap-1">
                  {label}
                  <button
                    type="button"
                    onClick={() => removeLabel(label)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${label}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <Input
              id="field-default-labels"
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              placeholder="Type a label and press Space or Enter"
              onKeyDown={(e) => {
                if (['Enter', 'Tab', ' ', 'Spacebar', ','].includes(e.key)) {
                  e.preventDefault();
                  commitLabel(labelDraft);
                  setLabelDraft('');
                } else if (e.key === 'Backspace' && labelDraft === '' && labels.length > 0) {
                  removeLabel(labels[labels.length - 1]);
                }
              }}
              onBlur={() => {
                if (labelDraft.trim()) {
                  commitLabel(labelDraft);
                  setLabelDraft('');
                }
              }}
            />
          </div>
        );
      }
      case 'paragraph': {
        return (
          <Textarea
            id="field-default-text"
            value={typeof localField.defaultValue === 'string' ? localField.defaultValue : ''}
            onChange={(e) => setLocalField((prev) => ({ ...prev, defaultValue: e.target.value }))}
            placeholder="Optional default value"
            rows={3}
          />
        );
      }
      default: {
        return (
          <Input
            id="field-default-generic"
            value={typeof localField.defaultValue === 'string' ? localField.defaultValue : ''}
            onChange={(e) => setLocalField((prev) => ({ ...prev, defaultValue: e.target.value }))}
            placeholder="Optional default value"
          />
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Field</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field-type">Field Type</Label>
            <Select
              value={localField.type}
              onValueChange={handleFieldTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAutoLinked && matchedCustomField && !fieldError && (
            <Alert className="bg-muted text-muted-foreground">
              <AlertDescription>
                Automatically linked to existing field "{matchedCustomField.name}". Tooltip, default value, and options were imported.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="field-label">Field Label *</Label>
            <Input
              id="field-label"
              value={localField.label}
              onChange={(e) => setLocalField({ ...localField, label: e.target.value })}
              placeholder="Enter field name"
            />
          </div>

          {fieldError && (
            <Alert variant="destructive">
              <AlertDescription>{fieldError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="field-required"
              checked={localField.required}
              onCheckedChange={(checked) => setLocalField({ ...localField, required: checked })}
            />
            <Label htmlFor="field-required">Required field</Label>
          </div>

          {supportsOptions && (
            <div className="space-y-2">
              <Label>
                Options{needsOptions ? ' *' : ' (optional)'}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Enter option"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  disabled={isAutoLinked}
                />
                <Button type="button" onClick={handleAddOption} size="sm"
                  disabled={isAutoLinked || !newOption.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {localField.options?.map((option, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                  >
                    <span>{option}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => handleRemoveOption(option)}
                      disabled={isAutoLinked}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Default Value</Label>
            {renderDefaultValueControl()}
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-help">Help Text / Tooltip</Label>
            <Textarea
              id="field-help"
              value={localField.helpText || ''}
              onChange={(e) => setLocalField({ ...localField, helpText: e.target.value })}
              placeholder="Optional help text for users"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveClick}>
            Save Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const PREVIEW_START_NODE_ID = 'workflow-preview-start';
const PREVIEW_START_EDGE_ID = 'workflow-preview-start-edge';


