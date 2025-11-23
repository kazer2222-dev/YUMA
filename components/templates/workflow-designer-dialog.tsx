'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  NodeToolbar,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
  Handle,
  Position,
  type OnConnectStartParams,
} from 'reactflow';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type {
  WorkflowCategory,
  WorkflowDetail,
  WorkflowStatusInput,
  WorkflowTransitionInput,
} from '@/lib/workflows/types';

const TRIGGER_OPTIONS = [
  { value: 'BUTTON', label: 'Button' },
  { value: 'MENU', label: 'Menu' },
  { value: 'AI', label: 'AI Suggested' },
];

const STATUS_ACTIVE_COLOR = '#1d4ed8';
const STATUS_FINAL_COLOR = '#047857';

type StatusNodeData = {
  tempId: string;
  key: string;
  name: string;
  category: WorkflowCategory;
  color?: string;
  isInitial: boolean;
  isFinal: boolean;
  lockedKey: boolean;
  visibilityRules?: Record<string, any> | null;
  fieldLockRules?: Record<string, any> | null;
  outgoingCount?: number;
};

type TransitionEdgeData = {
  tempId: string;
  name: string;
  uiTrigger: string;
  assigneeOnly: boolean;
  adminOnly: boolean;
  requirePriority: boolean;
  preventOpenSubtasks: boolean;
  kind?: 'start' | 'transition';
};

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const makeTempId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
};

const START_NODE_ID = 'workflow-start-node';
const START_EDGE_ID = 'edge-workflow-start';

type StartNodeData = Record<string, never>;

const createStartNode = (position: { x: number; y: number }): Node<StartNodeData> => ({
  id: START_NODE_ID,
  type: 'start',
  position,
  data: {},
});

const createStartEdge = (
  target: string,
  options?: { targetHandle?: string | null },
): Edge<TransitionEdgeData> =>
  createTransitionEdge(
    START_NODE_ID,
    target,
    {
      tempId: 'start',
      name: 'Start',
      uiTrigger: 'BUTTON',
      assigneeOnly: false,
      adminOnly: false,
      requirePriority: false,
      preventOpenSubtasks: false,
      kind: 'start',
    },
    { sourceHandle: 'start-source', targetHandle: options?.targetHandle ?? null },
  );

const getDefaultPosition = (index: number) => ({
  x: (index % 4) * 220,
  y: Math.floor(index / 4) * 160,
});

const mergeVisibilityPosition = (
  visibility: Record<string, any> | null | undefined,
  position: { x: number; y: number },
) => {
  const next = visibility ? { ...visibility } : {};
  const designer = next.designer ? { ...next.designer } : {};
  designer.position = { x: position.x, y: position.y };
  next.designer = designer;
  return next;
};

const extractPosition = (visibility: Record<string, any> | null | undefined, index: number) => {
  const candidate = visibility?.designer?.position;
  if (candidate && typeof candidate.x === 'number' && typeof candidate.y === 'number') {
    return { x: candidate.x, y: candidate.y };
  }
  return getDefaultPosition(index);
};

const applyStatusAttributes = (data: StatusNodeData, overrides: Partial<StatusNodeData> = {}) => {
  const next = { ...data, ...overrides };
  const isInitial = Boolean(next.isInitial);
  const isFinal = Boolean(next.isFinal);
  next.isInitial = isInitial;
  next.isFinal = isFinal;
  next.category = isFinal ? 'DONE' : isInitial ? 'TODO' : 'IN_PROGRESS';
  next.color = isFinal ? STATUS_FINAL_COLOR : STATUS_ACTIVE_COLOR;
  return next;
};

const createStatusNode = (
  data: StatusNodeData,
  position: { x: number; y: number },
): Node<StatusNodeData> => {
  const normalized = applyStatusAttributes({ outgoingCount: 0, ...data });
  return {
    id: normalized.tempId,
    type: 'status',
    position,
    data: normalized,
  };
};

const createTransitionEdge = (
  source: string,
  target: string,
  data: TransitionEdgeData,
  options?: { sourceHandle?: string | null; targetHandle?: string | null },
): Edge<TransitionEdgeData> => {
  const edgeData: TransitionEdgeData = {
    ...data,
    kind: data.kind ?? 'transition',
  };

  return {
    id: data.kind === 'start' ? START_EDGE_ID : `edge-${data.tempId}`,
    source,
    target,
    sourceHandle: options?.sourceHandle ?? null,
    targetHandle: options?.targetHandle ?? null,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: edgeData,
    label: edgeData.kind === 'start' ? '' : edgeData.name,
    style: { strokeWidth: 2 },
    labelBgPadding: [6, 4],
    labelBgBorderRadius: 4,
  };
};

function StatusNode({ data, selected }: { data: StatusNodeData; selected?: boolean }) {
  const isFinal = data.isFinal;
  const outgoingCount = data.outgoingCount ?? 0;
  const hasMultipleOutgoing = outgoingCount >= 2;
  const nodeClasses = isFinal
    ? 'border-emerald-700 bg-emerald-600 text-white'
    : 'border-blue-700 bg-blue-600 text-white';
  const handleClass = isFinal ? '!bg-emerald-600' : '!bg-blue-600';
  return (
    <div
      className={`status-node relative min-w-[220px] overflow-visible ${
        hasMultipleOutgoing ? 'status-node--diamond' : 'status-node--rect'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id={`${data.tempId}-target-left`}
        className={`!h-3 !w-3 ${handleClass}`}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${data.tempId}-source-right`}
        className={`!h-3 !w-3 ${handleClass}`}
      />
      <Handle
        type="target"
        position={Position.Top}
        id={`${data.tempId}-target-top`}
        className={`!h-3 !w-3 ${handleClass}`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${data.tempId}-source-bottom`}
        className={`!h-3 !w-3 ${handleClass}`}
      />
      <div className={`status-node-content ${nodeClasses}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-base font-semibold">{data.name || 'Status'}</span>
        </div>
        <div className="status-node-meta mt-2 flex flex-wrap gap-2 text-[10px] uppercase text-white/80">
          {data.isInitial && <span className="rounded border border-white/40 px-2 py-0.5">Initial</span>}
          {data.isFinal && <span className="rounded border border-white/40 px-2 py-0.5">Final</span>}
          {hasMultipleOutgoing && <span className="rounded border border-white/40 px-2 py-0.5">Split</span>}
        </div>
      </div>
      <NodeToolbar
        isVisible={Boolean(selected)}
        position="top"
        align="center"
        className="z-20 min-w-[180px] max-w-[220px] rounded-md border bg-popover px-3 py-2 text-xs shadow-lg"
      >
        <p className="font-semibold">{data.name || 'Status'}</p>
        <p className="text-muted-foreground">
          {data.isFinal ? 'Final stage' : data.isInitial ? 'Initial stage' : 'Intermediate stage'}
        </p>
        {hasMultipleOutgoing ? (
          <p className="text-muted-foreground">Multiple transitions leave this status.</p>
        ) : null}
      </NodeToolbar>
    </div>
  );
}

function StartNode() {
  return (
    <div className="relative flex items-center justify-center rounded-full border border-primary bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
      <Handle type="source" position={Position.Right} id="start-source" className="!h-3 !w-3 !bg-primary" />
      Start
    </div>
  );
}

interface WorkflowDesignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string | null;
  workflowId?: string | null;
  initialWorkflow?: WorkflowDetail;
  draftWorkflow?: WorkflowDetail;
  assignOnSave?: boolean;
  onSaved: (workflow: WorkflowDetail, options?: { assign?: boolean }) => void;
}

export function WorkflowDesignerDialog({
  open,
  onOpenChange,
  spaceId,
  workflowId,
  initialWorkflow,
  draftWorkflow,
  assignOnSave = false,
  onSaved,
}: WorkflowDesignerDialogProps) {
  const [initializing, setInitializing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [aiOptimized, setAiOptimized] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPromptError, setAiPromptError] = useState('');
  const [aiPromptMessage, setAiPromptMessage] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StatusNodeData | StartNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<TransitionEdgeData>>([]);
  const [selection, setSelection] = useState<{ type: 'status' | 'transition'; id: string } | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const connectStartRef = useRef<OnConnectStartParams | null>(null);

  const nodeTypes = useMemo(() => ({ status: StatusNode, start: StartNode }), []);

  const selectedNode = useMemo(
    () => (selection?.type === 'status' ? nodes.find((node) => node.id === selection.id) ?? null : null),
    [selection, nodes],
  );

  const selectedEdge = useMemo(
    () => (selection?.type === 'transition' ? edges.find((edge) => edge.id === selection.id) ?? null : null),
    [selection, edges],
  );

  const clearSelection = useCallback(() => setSelection(null), []);

  const setInitialStatus = useCallback(
    (targetId: string | null) => {
      setNodes((previous) =>
        previous.map((node) =>
          node.type === 'status'
            ? {
                ...node,
                data: applyStatusAttributes(node.data as StatusNodeData, { isInitial: node.id === targetId }),
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const generateUniqueKey = useCallback(
    (baseName: string, ignoreId?: string) => {
      const base = slugify(baseName) || 'status';
      let candidate = base;
      let counter = 1;
      const taken = new Set(
        nodes
          .filter((node) => node.type === 'status' && node.id !== ignoreId)
          .map((node) => node.data.key.trim())
      );
      while (taken.has(candidate)) {
        candidate = `${base}-${counter}`;
        counter += 1;
      }
      return candidate;
    },
    [nodes],
  );

  const applyDefaultLayout = useCallback(() => {
    setName('New Workflow');
    setDescription('');
    setIsDefault(false);
    setAiOptimized(false);

    const presets = [
      { name: 'To Do', category: 'TODO' as WorkflowCategory, color: '#3B82F6', isInitial: true },
      { name: 'In Progress', category: 'IN_PROGRESS' as WorkflowCategory, color: '#FACC15' },
      { name: 'Done', category: 'DONE' as WorkflowCategory, color: '#22C55E', isFinal: true },
    ];

    const statusNodes = presets.map((preset, index) => {
      const tempId = makeTempId('status');
      const data: StatusNodeData = {
        tempId,
        key: slugify(preset.name) || `status-${index + 1}`,
        name: preset.name,
        category: preset.category,
        color: preset.color,
        isInitial: index === 0,
        isFinal: Boolean(preset.isFinal),
        lockedKey: false,
        visibilityRules: undefined,
        fieldLockRules: undefined,
        outgoingCount: 0,
      };
      return createStatusNode(data, getDefaultPosition(index));
    });

    const startNode = createStartNode({ x: -220, y: 160 });
    const initialTargetId = statusNodes[0]?.id ?? null;

    const defaultEdges: Edge<TransitionEdgeData>[] = [];
    for (let index = 0; index < statusNodes.length - 1; index += 1) {
      const source = statusNodes[index];
      const target = statusNodes[index + 1];
      const edgeData: TransitionEdgeData = {
        tempId: makeTempId('transition'),
        name: `Move to ${target.data.name}`,
        uiTrigger: 'BUTTON',
        assigneeOnly: index === 0,
        adminOnly: false,
        requirePriority: target.data.category === 'DONE',
        preventOpenSubtasks: target.data.category === 'DONE',
      };
      defaultEdges.push(createTransitionEdge(source.id, target.id, edgeData));
    }

    const startEdge = initialTargetId ? createStartEdge(initialTargetId) : null;

    setNodes([startNode, ...statusNodes]);
    setEdges([...(startEdge ? [startEdge] : []), ...defaultEdges]);
    setInitialStatus(initialTargetId);
    clearSelection();
  }, [setNodes, setEdges, clearSelection, setInitialStatus]);

  const primeFromDetail = useCallback(
    (detail: WorkflowDetail, { lockExistingKeys }: { lockExistingKeys: boolean }) => {
      setName(detail.name);
      setDescription(detail.description ?? '');
      setIsDefault(Boolean(detail.isDefault));
      setAiOptimized(Boolean(detail.aiOptimized));

      const builtNodes = detail.statuses.map((status, index) => {
        const tempId = makeTempId('status');
        const lockedKey = lockExistingKeys && Boolean(status.id && !status.id.startsWith('ai-status'));
        const data: StatusNodeData = {
          tempId,
          key: status.key || slugify(status.name || `status-${index + 1}`),
          name: status.name,
          category: status.category,
          color: status.color ?? undefined,
          isInitial: Boolean(status.isInitial),
          isFinal: Boolean(status.isFinal),
          lockedKey,
          visibilityRules: status.visibilityRules ?? undefined,
          fieldLockRules: status.fieldLockRules ?? undefined,
          outgoingCount: 0,
        };
        const position = extractPosition(status.visibilityRules ?? undefined, index);
        return createStatusNode(data, position);
      });

      const keyToNodeId = new Map<string, string>();
      builtNodes.forEach((node) => keyToNodeId.set(node.data.key, node.id));

      const initialStatus = detail.statuses.find((status) => status.isInitial);
      const initialTargetId = initialStatus ? keyToNodeId.get(initialStatus.key) : builtNodes[0]?.id ?? null;

      const normalizedNodes = builtNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isInitial: node.id === initialTargetId,
        },
      }));

      const builtEdges = detail.transitions
        .map((transition) => {
          const sourceId = keyToNodeId.get(transition.fromKey);
          const targetId = keyToNodeId.get(transition.toKey);
          if (!sourceId || !targetId) {
            return null;
          }
          const roles = Array.isArray(transition.conditions?.roles) ? transition.conditions?.roles : [];
          const requiredFields = Array.isArray(transition.conditions?.requiredFields)
            ? transition.conditions?.requiredFields
            : [];
          const data: TransitionEdgeData = {
            tempId: makeTempId('transition'),
            name: transition.name,
            uiTrigger: transition.uiTrigger || 'BUTTON',
            assigneeOnly: roles.includes('ASSIGNEE'),
            adminOnly: roles.includes('OWNER') || roles.includes('ADMIN'),
            requirePriority: requiredFields.includes('priority'),
            preventOpenSubtasks: Boolean(transition.validators?.preventOpenSubtasks),
          };
          return createTransitionEdge(sourceId, targetId, data);
        })
        .filter((edge): edge is Edge<TransitionEdgeData> => Boolean(edge));

      const startNode = createStartNode({ x: -220, y: 160 });
      const startEdge = initialTargetId ? createStartEdge(initialTargetId) : null;

      setNodes([startNode, ...normalizedNodes]);
      setEdges([...(startEdge ? [startEdge] : []), ...builtEdges]);
      setInitialStatus(initialTargetId);
      clearSelection();
    },
    [setNodes, setEdges, clearSelection, setInitialStatus],
  );

  const applyAiSuggestion = useCallback(
    (suggestion: any) => {
      if (!suggestion || !Array.isArray(suggestion.statuses) || suggestion.statuses.length === 0) {
        setAiPromptError('AI suggestion did not include any statuses.');
        setAiPromptMessage('');
        return;
      }

      const statusNodes = suggestion.statuses.map((status: any, index: number) => {
        const tempId = makeTempId('status');
        const data: StatusNodeData = {
          tempId,
          key: status.key || slugify(status.name || `status-${index + 1}`),
          name: status.name || `Step ${index + 1}`,
          category: status.category || 'IN_PROGRESS',
          color: status.color ?? undefined,
          isInitial: Boolean(status.isInitial),
          isFinal: Boolean(status.isFinal),
          lockedKey: false,
          visibilityRules: undefined,
          fieldLockRules: undefined,
          outgoingCount: 0,
        };
        return createStatusNode(data, getDefaultPosition(index));
      });

      const keyToNodeId = new Map<string, string>();
      suggestion.statuses.forEach((status: any, index: number) => {
        const node = statusNodes[index];
        if (node) {
          keyToNodeId.set(node.data.key, node.id);
          if (status.key && status.key !== node.data.key) {
            keyToNodeId.set(status.key, node.id);
          }
        }
      });

      const initialKeyCandidate = suggestion.statuses.find((status: any) => status.isInitial)?.key;
      const initialTargetId = (initialKeyCandidate && keyToNodeId.get(initialKeyCandidate)) ?? statusNodes[0]?.id ?? null;

      const normalizedNodes = statusNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isInitial: node.id === initialTargetId,
        },
      }));

      const suggestionTransitions = Array.isArray(suggestion.transitions) ? suggestion.transitions : [];

      const builtEdges = suggestionTransitions
         .map((transition: any) => {
           const sourceId = keyToNodeId.get(transition.fromKey);
           const targetId = keyToNodeId.get(transition.toKey);
           if (!sourceId || !targetId) {
             return null;
           }
           const data: TransitionEdgeData = {
             tempId: makeTempId('transition'),
             name: transition.name || 'Transition',
             uiTrigger: transition.uiTrigger || 'BUTTON',
             assigneeOnly: Boolean(transition.assigneeOnly),
             adminOnly: Boolean(transition.adminOnly),
             requirePriority: Boolean(transition.requirePriority),
             preventOpenSubtasks: Boolean(transition.preventOpenSubtasks),
           };
           return createTransitionEdge(sourceId, targetId, data);
         })
         .filter((edge): edge is Edge<TransitionEdgeData> => Boolean(edge));

      const startNode = createStartNode({ x: -220, y: 160 });
      const startEdge = initialTargetId ? createStartEdge(initialTargetId) : null;

      setNodes([startNode, ...normalizedNodes]);
      setEdges([...(startEdge ? [startEdge] : []), ...builtEdges]);
      setInitialStatus(initialTargetId);
      clearSelection();

      if (suggestion.name) {
        setName(suggestion.name);
      }
      setDescription(suggestion.description ?? '');
      setAiOptimized(true);
      const warnings: string[] = Array.isArray(suggestion.warnings) ? suggestion.warnings : [];
      setAiPromptMessage(
        warnings.length > 0
          ? `Workflow generated from AI prompt. Notes: ${warnings.join(' ')}`
          : 'Workflow generated from AI prompt. Review the steps before saving.',
      );
      setAiPromptError('');
    },
    [clearSelection, setDescription, setEdges, setInitialStatus, setName, setNodes],
  );

  const handleGenerateFromPrompt = useCallback(async () => {
    if (!aiPrompt.trim()) {
      setAiPromptError('Enter a prompt describing the workflow you need.');
      setAiPromptMessage('');
      return;
    }

    setAiGenerating(true);
    setAiPromptError('');
    setAiPromptMessage('');

    try {
      const response = await fetch('/api/ai/workflows/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: aiPrompt,
          spaceId,
          fields: [],
        }),
      });
      const data = await response.json();

      if (response.ok && data.success && data.suggestion) {
        applyAiSuggestion(data.suggestion);
      } else {
        const message = data.message || 'Failed to generate workflow suggestion.';
        const issues = Array.isArray(data.issues) ? data.issues : [];
        setAiPromptError(issues.length > 0 ? `${message} ${issues.join(' ')}` : message);
      }
    } catch (err) {
      console.error('Failed to generate AI workflow suggestion from prompt:', err);
      setAiPromptError('Failed to generate workflow suggestion. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  }, [aiPrompt, applyAiSuggestion, spaceId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError('');
    clearSelection();
    setAiPrompt('');
    setAiPromptError('');
    setAiPromptMessage('');
    setAiGenerating(false);

    if (draftWorkflow) {
      primeFromDetail(draftWorkflow, { lockExistingKeys: false });
      return;
    }

    if (!spaceId) {
      applyDefaultLayout();
      return;
    }

    const initialise = async () => {
      if (workflowId) {
        if (initialWorkflow && initialWorkflow.id === workflowId) {
          primeFromDetail(initialWorkflow, { lockExistingKeys: true });
          return;
        }

        setInitializing(true);
        try {
          const response = await fetch(`/api/workflows/${workflowId}?spaceId=${spaceId}`, {
            credentials: 'include',
          });
          const data = await response.json();
          if (response.ok && data.success && data.workflow) {
            primeFromDetail(data.workflow, { lockExistingKeys: true });
          } else {
            const message = data.message || 'Failed to load workflow';
            setError(message);
            applyDefaultLayout();
          }
        } catch (err) {
          console.error('Failed to load workflow detail:', err);
          setError('Failed to load workflow');
          applyDefaultLayout();
        } finally {
          setInitializing(false);
        }
      } else {
        applyDefaultLayout();
      }
    };

    initialise();
  }, [open, spaceId, workflowId, initialWorkflow, draftWorkflow, primeFromDetail, applyDefaultLayout, clearSelection]);

  useEffect(() => {
    return undefined;
  }, [open, reactFlowInstance]);

  useEffect(() => {
    setNodes((previous) => {
      const counts = new Map<string, number>();
      for (const edge of edges) {
        if (edge.data.kind === 'start') {
          continue;
        }
        counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1);
      }

      let changed = false;
      const nextNodes = previous.map((node) => {
        if (node.type !== 'status') {
          return node;
        }
        const currentData = node.data as StatusNodeData;
        const nextCount = counts.get(node.id) ?? 0;
        if ((currentData.outgoingCount ?? 0) === nextCount) {
          return node;
        }
        changed = true;
        return {
          ...node,
          data: {
            ...currentData,
            outgoingCount: nextCount,
          },
        } as Node<StatusNodeData>;
      });

      return changed ? nextNodes : previous;
    });
  }, [edges, setNodes]);

  const handleNodesChangeInternal = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange],
  );

  const handleEdgesChangeInternal = useCallback(
    (changes: EdgeChange[]) => {
      const filtered = changes.filter(
        (change) => !(change.type === 'remove' && change.id === START_EDGE_ID),
      );
      onEdgesChange(filtered);
    },
    [onEdgesChange],
  );

  const updateNode = useCallback(
    (id: string, updater: (data: StatusNodeData) => StatusNodeData) => {
      setNodes((previous) =>
        previous.map((node) =>
          node.id === id && node.type === 'status'
            ? {
                ...node,
                data: applyStatusAttributes(updater(node.data as StatusNodeData)),
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const updateEdge = useCallback(
    (id: string, updater: (data: TransitionEdgeData) => TransitionEdgeData) => {
      setEdges((previous) =>
        previous.map((edge) =>
          edge.id === id
            ? (() => {
                const nextData = updater(edge.data);
                return {
                  ...edge,
                  data: nextData,
                  label: nextData.name,
                };
              })()
            : edge,
        ),
      );
    },
    [setEdges],
  );

  const handleRemoveStatus = useCallback(
    (id: string) => {
      setInitializing(false);
      const statusNodes = nodes.filter((node) => node.type === 'status');
      if (statusNodes.length <= 1) {
        setError('Workflow must contain at least one status.');
        return;
      }
      const startEdge = edges.find((edge) => edge.id === START_EDGE_ID);
      const removingInitial = startEdge?.target === id;

      const remainingStatuses = statusNodes.filter((node) => node.id !== id);
      const fallbackTarget = remainingStatuses[0]?.id ?? null;
      const nextInitialTarget = removingInitial ? fallbackTarget : startEdge?.target ?? null;
      const shouldSelectFallback = selection?.type === 'status' && selection.id === id;

      setNodes((prev) => {
        const filtered = prev.filter((node) => node.id !== id);
        if (!shouldSelectFallback) {
          return filtered;
        }
        return filtered.map((node) => {
          if (node.type !== 'status') {
            return node;
          }
          const nextSelected = fallbackTarget ? node.id === fallbackTarget : false;
          if (node.selected === nextSelected) {
            return node;
          }
          return { ...node, selected: nextSelected };
        });
      });
      setEdges((prev) => {
        const filtered = prev.filter((edge) => edge.source !== id && edge.target !== id && edge.id !== START_EDGE_ID);
        if (nextInitialTarget) {
          return [createStartEdge(nextInitialTarget, { targetHandle: startEdge?.targetHandle ?? null }), ...filtered];
        }
        return filtered;
      });
      setInitialStatus(nextInitialTarget ?? null);
      if (shouldSelectFallback) {
        if (fallbackTarget) {
          setSelection({ type: 'status', id: fallbackTarget });
        } else {
          clearSelection();
        }
      }
    },
    [nodes, edges, setNodes, setEdges, selection, clearSelection, setInitialStatus],
  );

  const handleToggleFinal = useCallback(
    (id: string) => {
      updateNode(id, (data) => ({
        ...data,
        isFinal: !data.isFinal,
      }));
    },
    [updateNode],
  );

  const handleRemoveTransition = useCallback(
    (id: string) => {
      setInitializing(false);
      setEdges((prev) => prev.filter((edge) => edge.id !== id || edge.data.kind === 'start'));
      if (selection?.type === 'transition' && selection.id === id) {
        clearSelection();
      }
    },
    [setEdges, selection, clearSelection],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || target.isContentEditable) {
          return;
        }
      }

      if (selection?.type === 'status') {
        event.preventDefault();
        handleRemoveStatus(selection.id);
        return;
      }

      if (selection?.type === 'transition') {
        event.preventDefault();
        handleRemoveTransition(selection.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selection, handleRemoveStatus, handleRemoveTransition]);

  const handleConnectStart = useCallback((_event: any, params: OnConnectStartParams) => {
    connectStartRef.current = params;
  }, []);

  const handleConnectEnd = useCallback(() => {
    connectStartRef.current = null;
  }, []);

  const handleConnect = useCallback(
    (connection: Connection) => {
      const start = connectStartRef.current;
      connectStartRef.current = null;

      let sourceId = connection.source ?? null;
      let targetId = connection.target ?? null;
      let sourceHandle = connection.sourceHandle ?? null;
      let targetHandle = connection.targetHandle ?? null;

      if (start?.handleType === 'target') {
        sourceId = start.nodeId ?? null;
        sourceHandle = start.handleId ?? null;

        if (connection.source && connection.source !== sourceId) {
          targetId = connection.source;
          targetHandle = connection.sourceHandle ?? null;
        } else if (connection.target && connection.target !== sourceId) {
          targetId = connection.target;
          targetHandle = connection.targetHandle ?? null;
        } else {
          return;
        }
      }

      if (!sourceId || !targetId || sourceId === targetId) {
        return;
      }

      if (sourceId === START_NODE_ID) {
        setEdges((prev) => {
          const others = prev.filter((edge) => edge.id !== START_EDGE_ID);
          return [
            createStartEdge(targetId!, { targetHandle: targetHandle ?? null }),
            ...others,
          ];
        });
        setInitialStatus(targetId);
        return;
      }

      const sourceNode = nodes.find((node) => node.id === sourceId);
      const targetNode = nodes.find((node) => node.id === targetId);
      if (!sourceNode || !targetNode) {
        return;
      }
      const edgeData: TransitionEdgeData = {
        tempId: makeTempId('transition'),
        name: `Move to ${targetNode.data.name}`,
        uiTrigger: 'BUTTON',
        assigneeOnly: false,
        adminOnly: false,
        requirePriority: targetNode.data.category === 'DONE',
        preventOpenSubtasks: targetNode.data.category === 'DONE',
      };
      const newEdge = createTransitionEdge(sourceId, targetId, edgeData, {
        sourceHandle,
        targetHandle,
      });
      setEdges((prev) => addEdge(newEdge, prev));
    },
    [nodes, setEdges, setInitialStatus],
  );

  const handleEdgeUpdate = useCallback(
    (edge: Edge<TransitionEdgeData>, connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }
      if (edge.data.kind === 'start') {
        setEdges((prev) => {
          const others = prev.filter((current) => current.id !== START_EDGE_ID);
          return [
            createStartEdge(connection.target!, { targetHandle: connection.targetHandle ?? null }),
            ...others,
          ];
        });
        setInitialStatus(connection.target);
        return;
      }

      setEdges((prev) =>
        prev.map((current) =>
          current.id === edge.id
            ? {
                ...current,
                source: connection.source!,
                target: connection.target!,
                sourceHandle: connection.sourceHandle ?? null,
                targetHandle: connection.targetHandle ?? null,
                data: {
                  ...current.data,
                  tempId: current.data.tempId,
                },
                label: current.data.name,
              }
            : current,
        ),
      );
    },
    [setEdges, setInitialStatus],
  );

  const handleEdgeUpdateEnd = useCallback((_event: any, edge: Edge<TransitionEdgeData>) => {
    setSelection({ type: 'transition', id: edge.id });
  }, []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node<StatusNodeData>) => {
    if (node.type !== 'status') {
      clearSelection();
      return;
    }
    setSelection({ type: 'status', id: node.id });
  }, [clearSelection]);

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge<TransitionEdgeData>) => {
    setSelection({ type: 'transition', id: edge.id });
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelection(null);
    clearSelection();
  }, [clearSelection]);

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2, duration: 200 });
  }, [reactFlowInstance]);

  const validateWorkflow = useCallback((): string | null => {
    if (!name.trim()) {
      return 'Workflow name is required.';
    }
    if (nodes.length === 0) {
      return 'Add at least one status to the workflow.';
    }
    const initialCount = nodes.filter((node) => node.data.isInitial).length;
    if (initialCount !== 1) {
      return 'Exactly one status must be marked as initial.';
    }
    const keys = nodes.map((node) => node.data.key.trim());
    if (keys.some((key) => !key)) {
      return 'All statuses must have an internal key.';
    }
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size !== keys.length) {
      return 'Status keys must be unique.';
    }
    if (nodes.some((node) => !node.data.name.trim())) {
      return 'All statuses must have a name.';
    }
    if (edges.length === 0) {
      return 'Add at least one transition to the workflow.';
    }
    if (edges.some((edge) => !edge.data.name.trim())) {
      return 'All transitions must have a name.';
    }
    return null;
  }, [name, nodes, edges]);

  const handleSave = useCallback(async () => {
    const validation = validateWorkflow();
    if (validation) {
      setError(validation);
      return;
    }
    if (!spaceId) {
      setError('Space context is not available.');
      return;
    }

    setError('');
    setSaving(true);

    const statusNodes = nodes.filter((node) => node.type === 'status');
    const sortedStatusNodes = [...statusNodes].sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });

    const statusPayload: WorkflowStatusInput[] = sortedStatusNodes.map((node, index) => ({
      key: node.data.key,
      name: node.data.name.trim(),
      category: node.data.category,
      color: node.data.color ?? null,
      isInitial: node.data.isInitial,
      isFinal: node.data.isFinal,
      order: index,
      visibilityRules: mergeVisibilityPosition(node.data.visibilityRules, node.position),
      fieldLockRules: node.data.fieldLockRules ?? undefined,
      statusRefId: undefined,
    }));

    const nodesById = new Map(nodes.map((node) => [node.id, node] as const));
    const transitionPayload: WorkflowTransitionInput[] = edges
      .filter((edge) => edge.data.kind !== 'start')
      .map((edge, index) => {
        const sourceNode = nodesById.get(edge.source);
        const targetNode = nodesById.get(edge.target);
        if (!sourceNode || !targetNode) {
          return null;
        }
        const roles: string[] = [];
        if (edge.data.assigneeOnly) roles.push('ASSIGNEE');
        if (edge.data.adminOnly) {
          roles.push('OWNER');
          roles.push('ADMIN');
        }
        const conditions: Record<string, any> = {};
        if (roles.length > 0) {
          conditions.roles = Array.from(new Set(roles));
        }
        if (edge.data.requirePriority) {
          conditions.requiredFields = ['priority'];
        }
        const validators: Record<string, any> = {};
        if (edge.data.preventOpenSubtasks) {
          validators.preventOpenSubtasks = true;
        }

        return {
          name: edge.data.name.trim(),
          fromKey: sourceNode.data.key,
          toKey: targetNode.data.key,
          uiTrigger: edge.data.uiTrigger || 'BUTTON',
          order: index,
          conditions: Object.keys(conditions).length ? conditions : undefined,
          validators: Object.keys(validators).length ? validators : undefined,
          postFunctions: undefined,
        };
      })
      .filter((transition): transition is WorkflowTransitionInput => Boolean(transition));

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        isDefault,
        aiOptimized,
        statuses: statusPayload,
        transitions: transitionPayload,
      };

      const response = await fetch(
        workflowId ? `/api/workflows/${workflowId}?spaceId=${spaceId}` : `/api/workflows?spaceId=${spaceId}`,
        {
          method: workflowId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(
            workflowId
              ? payload
              : {
                  ...payload,
                  spaceId,
                },
          ),
        },
      );

      const data = await response.json();

      if (response.ok && data.success && data.workflow) {
        onSaved(data.workflow, { assign: assignOnSave });
        onOpenChange(false);
      } else {
        const message = data.message || 'Failed to save workflow';
        setError(message);
      }
    } catch (err) {
      console.error('Failed to save workflow:', err);
      setError('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  }, [validateWorkflow, spaceId, nodes, edges, name, description, isDefault, aiOptimized, workflowId, assignOnSave, onSaved, onOpenChange]);

  const handleNodeNameChange = useCallback(
    (id: string, value: string) => {
      updateNode(id, (data) => {
        const next = { ...data, name: value };
        if (!data.lockedKey) {
          next.key = generateUniqueKey(value || data.key || 'status', id);
        }
        return next;
      });
    },
    [updateNode, generateUniqueKey],
  );

  const handleTransitionNameChange = useCallback(
    (id: string, value: string) => {
      const edge = edges.find((item) => item.id === id);
      if (!edge || edge.data.kind === 'start') {
        return;
      }
      updateEdge(id, (data) => ({
        ...data,
        name: value,
      }));
    },
    [edges, updateEdge],
  );

  const handleTransitionTriggerChange = useCallback(
    (id: string, value: string) => {
      const edge = edges.find((item) => item.id === id);
      if (!edge || edge.data.kind === 'start') {
        return;
      }
      updateEdge(id, (data) => ({
        ...data,
        uiTrigger: value,
      }));
    },
    [edges, updateEdge],
  );

  const handleTransitionToggle = useCallback(
    (
      id: string,
      field: keyof Pick<TransitionEdgeData, 'assigneeOnly' | 'adminOnly' | 'requirePriority' | 'preventOpenSubtasks'>,
      value: boolean,
    ) => {
      const edge = edges.find((item) => item.id === id);
      if (!edge || edge.data.kind === 'start') {
        return;
      }
      updateEdge(id, (data) => ({
        ...data,
        [field]: value,
      }));
    },
    [edges, updateEdge],
  );

  const handleChangeTransitionEndpoints = useCallback(
    (id: string, { from, to }: { from?: string; to?: string }) => {
      const edge = edges.find((item) => item.id === id);
      if (!edge) {
        return;
      }
      if (edge.data.kind === 'start') {
        const nextTarget = to ?? edge.target;
        if (!nextTarget) {
          return;
        }
        setEdges((prev) => {
          const others = prev.filter((current) => current.id !== START_EDGE_ID);
          return [createStartEdge(nextTarget, { targetHandle: edge.targetHandle ?? null }), ...others];
        });
        setInitialStatus(nextTarget);
        return;
      }

      setEdges((prev) =>
        prev.map((current) =>
          current.id === id
            ? {
                ...current,
                source: from ?? current.source,
                target: to ?? current.target,
                sourceHandle: from ? null : current.sourceHandle,
                targetHandle: to ? null : current.targetHandle,
              }
            : current,
        ),
      );
    },
    [edges, setEdges, setInitialStatus],
  );

  const handleAddStatus = useCallback(() => {
    const statusCount = nodes.filter((node) => node.type === 'status').length;
    const defaultName = `Status ${statusCount + 1}`;
    const tempId = makeTempId('status');
    const uniqueKey = generateUniqueKey(defaultName);
    const data: StatusNodeData = {
      tempId,
      key: uniqueKey,
      name: defaultName,
      category: 'TODO',
      color: '#94a3b8',
      isInitial: statusCount === 0,
      isFinal: false,
      lockedKey: false,
      visibilityRules: undefined,
      fieldLockRules: undefined,
      outgoingCount: 0,
    };
    const position = getDefaultPosition(statusCount);
    const newNode = createStatusNode(data, position);
    setNodes((prev) => [...prev, newNode]);
    setSelection({ type: 'status', id: newNode.id });
    if (statusCount === 0) {
      setInitialStatus(newNode.id);
      setEdges((prev) => {
        const otherEdges = prev.filter((edge) => edge.id !== START_EDGE_ID);
        return [createStartEdge(newNode.id), ...otherEdges];
      });
    }
  }, [nodes, generateUniqueKey, setNodes, setSelection, setInitialStatus, setEdges]);

  const sourceTargetLabels = useMemo(() => {
    if (!selectedEdge) {
      return { source: '', target: '' };
    }
    const sourceNode = nodes.find((node) => node.id === selectedEdge.source);
    const targetNode = nodes.find((node) => node.id === selectedEdge.target);
    return {
      source: sourceNode?.id === START_NODE_ID ? 'Start' : sourceNode?.data.name ?? 'Unknown',
      target: targetNode?.data.name ?? 'Unknown',
    };
  }, [selectedEdge, nodes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="workflow-designer max-w-6xl flex h-[85vh] flex-col overflow-hidden"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="space-y-4">
          <DialogTitle className="sr-only">Workflow designer</DialogTitle>
          <DialogDescription className="sr-only">
            Configure statuses and transitions for this workflow.
          </DialogDescription>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground" htmlFor="workflow-name-input">
              Workflow name
            </Label>
            <Input
              id="workflow-name-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
              placeholder="e.g. Jira-style lifecycle"
              className="h-12 text-lg font-semibold"
              required
            />
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid flex-1 gap-6 overflow-hidden pr-2 lg:grid-cols-[minmax(0,1fr)_300px]">
          <ReactFlowProvider>
            <div className="flex h-full flex-col space-y-4 overflow-hidden">
              <div className="flex flex-col gap-4">
                <div className="flex w/full max-w-4xl flex-col gap-2">
                  <Label className="text-sm font-medium" htmlFor="workflow-ai-prompt">
                    AI workflow prompt
                  </Label>
                  <Textarea
                    id="workflow-ai-prompt"
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder="Describe the workflow you want. Mention stages like design, review, QA, deployment..."
                    rows={3}
                    disabled={saving || aiGenerating}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleGenerateFromPrompt}
                      disabled={saving || aiGenerating}
                    >
                      {aiGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Generate workflow from prompt
                    </Button>
                    {aiOptimized && !aiGenerating ? (
                      <span className="text-xs font-medium text-primary">AI generated</span>
                    ) : null}
                  </div>
                  {aiPromptError ? (
                    <p className="text-xs text-destructive">{aiPromptError}</p>
                  ) : null}
                  {aiPromptMessage ? (
                    <p className="text-xs text-muted-foreground">{aiPromptMessage}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleAddStatus} disabled={saving}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Status
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={handleFitView}>
                    Fit to view
                  </Button>
                </div>
              </div>

              <div className="wf-designer-flow relative flex-1 overflow-hidden rounded-lg border bg-card">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={handleNodesChangeInternal}
                  onEdgesChange={handleEdgesChangeInternal}
                  onConnect={handleConnect}
                  onNodeClick={handleNodeClick}
                  onEdgeClick={handleEdgeClick}
                  onPaneClick={handlePaneClick}
                  onEdgeUpdate={handleEdgeUpdate}
                  onEdgeUpdateEnd={handleEdgeUpdateEnd}
                  onConnectStart={handleConnectStart}
                  onConnectEnd={handleConnectEnd}
                  connectionMode="loose"
                  nodesDraggable={!saving}
                  nodesConnectable={!saving}
                  elementsSelectable
                  selectNodesOnDrag={false}
                  selectionKeyCode={null}
                  nodeTypes={nodeTypes}
                  onInit={setReactFlowInstance}
                >
                  <Background variant="dots" gap={16} size={1} />
                  <Controls showInteractive={false} />
                </ReactFlow>
              </div>
            </div>
          </ReactFlowProvider>

          <aside className="space-y-4 overflow-y-auto rounded-lg border p-4">
            {!selectedNode && !selectedEdge && (
              <p className="text-sm text-muted-foreground">
                Select a status node or a transition edge to configure details.
              </p>
            )}

            {selectedNode && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Status</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStatus(selectedNode.id)}
                    disabled={saving}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase text-muted-foreground">Name</Label>
                  <Input
                    value={selectedNode.data.name}
                    onChange={(event) => handleNodeNameChange(selectedNode.id, event.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase text-muted-foreground">Flags</Label>
                  <div className="space-y-2 rounded-md border p-2">
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={selectedNode.data.isFinal}
                        onCheckedChange={() => handleToggleFinal(selectedNode.id)}
                        disabled={saving}
                      />
                      Final status
                    </label>
                    {selectedNode.data.isInitial && (
                      <p className="text-[11px] text-muted-foreground">Initial status is linked to the start arrow.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedEdge && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {selectedEdge.data.kind === 'start' ? 'Start Arrow' : 'Transition'}
                  </h3>
                  {selectedEdge.data.kind !== 'start' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTransition(selectedEdge.id)}
                      disabled={saving}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                {selectedEdge.data.kind !== 'start' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase text-muted-foreground">Name</Label>
                      <Input
                        value={selectedEdge.data.name}
                        onChange={(event) => handleTransitionNameChange(selectedEdge.id, event.target.value)}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase text-muted-foreground">Trigger</Label>
                      <Select
                        value={selectedEdge.data.uiTrigger}
                        onValueChange={(value) => handleTransitionTriggerChange(selectedEdge.id, value)}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="grid gap-3">
                  <div className="space-y-1 text-xs uppercase text-muted-foreground">
                    <Label>From</Label>
                    <Select
                      value={selectedEdge.source}
                      onValueChange={(value) => handleChangeTransitionEndpoints(selectedEdge.id, { from: value })}
                      disabled={saving || selectedEdge.data.kind === 'start'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {nodes
                          .filter((node) => node.type === 'status' || node.id === START_NODE_ID)
                          .map((node) => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.id === START_NODE_ID ? 'Start' : node.data.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 text-xs uppercase text-muted-foreground">
                    <Label>To</Label>
                    <Select
                      value={selectedEdge.target}
                      onValueChange={(value) => handleChangeTransitionEndpoints(selectedEdge.id, { to: value })}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {nodes
                          .filter((node) => node.type === 'status')
                          .map((node) => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.data.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedEdge.data.kind !== 'start' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase text-muted-foreground">Permissions</Label>
                      <div className="space-y-2 rounded-md border p-2">
                        <label className="flex items-center gap-2">
                          <Switch
                            checked={selectedEdge.data.assigneeOnly}
                            onCheckedChange={(checked) => handleTransitionToggle(selectedEdge.id, 'assigneeOnly', checked)}
                            disabled={saving}
                          />
                          Assignee only
                        </label>
                        <label className="flex items-center gap-2">
                          <Switch
                            checked={selectedEdge.data.adminOnly}
                            onCheckedChange={(checked) => handleTransitionToggle(selectedEdge.id, 'adminOnly', checked)}
                            disabled={saving}
                          />
                          Admin / owner only
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase text-muted-foreground">Validators</Label>
                      <div className="space-y-2 rounded-md border p-2">
                        <label className="flex items-center gap-2">
                          <Switch
                            checked={selectedEdge.data.requirePriority}
                            onCheckedChange={(checked) => handleTransitionToggle(selectedEdge.id, 'requirePriority', checked)}
                            disabled={saving}
                          />
                          Require priority
                        </label>
                        <label className="flex items-center gap-2">
                          <Switch
                            checked={selectedEdge.data.preventOpenSubtasks}
                            onCheckedChange={(checked) => handleTransitionToggle(selectedEdge.id, 'preventOpenSubtasks', checked)}
                            disabled={saving}
                          />
                          Prevent open subtasks
                        </label>
                      </div>
                    </div>
                  </>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {sourceTargetLabels.source} → {sourceTargetLabels.target}
                </p>
              </div>
            )}
          </aside>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Workflow
          </Button>
        </DialogFooter>
      </DialogContent>

      <style jsx>{`
        .wf-designer-flow :global(.react-flow__pane:focus),
        .wf-designer-flow :global(.react-flow__pane:focus-visible) {
          outline: none;
        }

        .wf-designer-flow :global(.react-flow__node.selected),
        .wf-designer-flow :global(.react-flow__node.selected *),
        .wf-designer-flow :global(.react-flow__edge.selected),
        .wf-designer-flow :global(.react-flow__edge.selected *),
        .wf-designer-flow :global(.react-flow__pane.dragging) {
          opacity: 1 !important;
          filter: none !important;
        }

        .wf-designer-flow :global(.react-flow__pane) {
          transition: none;
        }
      `}</style>
      <style jsx global>{`
        .react-flow__selection,
        .react-flow__nodesselection-rect {
          background: transparent !important;
          border: none !important;
        }

        .workflow-designer,
        .workflow-designer * {
          user-select: none;
        }

        .workflow-designer input,
        .workflow-designer textarea,
        .workflow-designer input *,
        .workflow-designer textarea * {
          user-select: text;
        }

        .workflow-designer ::selection {
          background: transparent;
          color: inherit;
        }

        .workflow-designer .status-node {
          padding: 8px;
        }

        .workflow-designer .status-node .status-node-content {
          border-radius: 14px;
          padding: 14px 18px;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
        }

        .workflow-designer .status-node--diamond .status-node-content {
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          padding: 44px 36px;
        }

        .workflow-designer .status-node--diamond .status-node-meta {
          justify-content: center;
        }

        .workflow-designer .status-node--diamond .status-node-content > div:first-child {
          justify-content: center;
        }
      `}</style>
    </Dialog>
  );
}
