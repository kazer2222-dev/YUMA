'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AITextEditor } from '@/components/ai/ai-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Plus, Loader2, Calendar as CalendarIcon, Save, X, Trash, Edit2, GitBranch, AlertCircle, Search, Filter, SlidersHorizontal, Sparkles, ChevronDown, ChevronRight, Flag, GripVertical, MoreHorizontal } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BoardConfiguration } from './board-configuration';
import { CreateTaskDialogUnified } from '@/components/tasks/create-task-dialog-unified';
import { useServerSentEvents } from '@/lib/realtime';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Calendar from 'react-calendar';
import { TaskBreadcrumb } from '@/components/tasks/task-breadcrumb';
import {
  extractTemplateMetadata,
  applyTemplateMetadata,
  TemplateMetadata,
  templateToDefinition,
  TemplateDefinition,
  metadataToTemplateValues,
  normalizeTemplateFieldValue,
  buildTemplateMetadata,
  formatTemplateFieldValue,
  TemplateFieldMetadata,
  isTemplateFieldValueEmpty
} from '@/lib/template-metadata';
import { TemplateFieldRenderer } from '@/components/templates/template-field-renderer';
import { TemplateField, Template } from '@/components/templates/template-types';
import type { WorkflowDetail } from '@/lib/workflows/types';
import { useToastHelpers } from '@/components/toast';

const MIN_AI_TRANSITION_CONFIDENCE = 0.6;

interface Task {
  id: string;
  number: number;
  summary: string;
  description?: string;
  priority: string;
  tags: string[];
  dueDate?: string;
  estimate?: string;
  createdAt: string;
  updatedAt: string;
  sprintId?: string | null;
  assignee?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  workflowId?: string | null;
  workflowStatusId?: string | null;
  workflowStatus?: {
    id: string;
    key: string;
    name: string;
    category: string;
    color?: string | null;
    statusRefId?: string | null;
  } | null;
  status: {
    id: string;
    name: string;
    key: string;
    color?: string;
  };
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

interface BoardViewProps {
  boardId: string;
  spaceSlug: string;
  sprintFilter?: string;
  hideBacklog?: boolean;
  hideHeader?: boolean;
}

// Helper function to format date as DD/MM/YYYY
function formatDateDDMMYYYY(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper function to format priority for display
function formatPriority(priority: string): string {
  const priorityMap: { [key: string]: string } = {
    'HIGHEST': 'Highest',
    'HIGH': 'High',
    'NORMAL': 'Normal',
    'LOW': 'Low',
    'LOWEST': 'Lowest'
  };
  return priorityMap[priority] || priority;
}

export function BoardView({ boardId, spaceSlug, sprintFilter, hideBacklog = false, hideHeader = false }: BoardViewProps) {
  const [boardName, setBoardName] = useState<string>('');
  const [spaceTicker, setSpaceTicker] = useState<string>('');
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [ssePaused, setSsePaused] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeTaskColumnId, setActiveTaskColumnId] = useState<string | null>(null);
  const [cardWidth, setCardWidth] = useState<number>(320); // Default to w-80 (320px)
  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverTaskIndex, setDragOverTaskIndex] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [templateMetadata, setTemplateMetadata] = useState<TemplateMetadata | null>(null);
  const [templateDefinition, setTemplateDefinition] = useState<TemplateDefinition | null>(null);
  const [templateFieldsConfig, setTemplateFieldsConfig] = useState<TemplateField[]>([]);
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [aiMenusOpen, setAiMenusOpen] = useState(false);
  const [spaceUsers, setSpaceUsers] = useState<any[]>([]);
  const [calendarOpen, setCalendarOpen] = useState<'start' | 'due' | null>(null);
  const [sprints, setSprints] = useState<any[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [createTaskStatusId, setCreateTaskStatusId] = useState<string | null>(null);
  const [workflowDetail, setWorkflowDetail] = useState<WorkflowDetail | null>(null);
  const [workflowTransitions, setWorkflowTransitions] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState('');
  const [aiTransitionSuggestion, setAiTransitionSuggestion] = useState<{ transitionId: string; transitionKey?: string; confidence: number; rationale: string[] } | null>(null);
  const [aiTransitionLoading, setAiTransitionLoading] = useState(false);
  const [aiTransitionError, setAiTransitionError] = useState('');
  const [dropPosition, setDropPosition] = useState<{ columnId: string; index: number } | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState('AI is analyzing');
  const [groupBy, setGroupBy] = useState<'none' | 'assignee' | 'template' | 'priority'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<{
    priorities: string[];
    tags: string[];
    showOverdue: boolean;
  }>({
    priorities: [],
    tags: [],
    showOverdue: false,
  });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const { error: showToastError } = useToastHelpers();
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const optimisticTasksRef = useRef<Map<string, Task>>(new Map());
  const isUpdatingRef = useRef<boolean>(false);
  const ssePausedRef = useRef<boolean>(false);
  const migratingRef = useRef<boolean>(false);
  const columnRefsRef = useRef<Map<string, HTMLElement>>(new Map());
  const workflowCacheRef = useRef<Map<string, WorkflowDetail>>(new Map());
  const isFetchingRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragOverStatusIdRef = useRef<string | null>(null);
  const dragOverTaskIdRef = useRef<string | null>(null);
  const dragOverTaskIndexRef = useRef<number | null>(null);
  const dropPositionRef = useRef<{ columnId: string; index: number } | null>(null);
  const dragOverUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const getWorkflowDetailCached = useCallback(
    async (workflowId: string): Promise<WorkflowDetail | null> => {
      if (!workflowId || !spaceId) {
        return null;
      }

      const cached = workflowCacheRef.current.get(workflowId);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(`/api/workflows/${workflowId}?spaceId=${spaceId}`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok && data.success && data.workflow) {
          workflowCacheRef.current.set(workflowId, data.workflow as WorkflowDetail);
          return data.workflow as WorkflowDetail;
        }
      } catch (err) {
        console.error('Failed to load workflow for drag validation:', err);
      }

      return null;
    },
    [spaceId],
  );

  const resolveWorkflowTransition = useCallback(
    async (task: Task, targetStatus: Status) => {
      if (!task.workflowId) {
        return { allowed: true, targetWorkflowStatus: null as WorkflowStatusDetail | null };
      }

      const workflow = await getWorkflowDetailCached(task.workflowId);
      if (!workflow) {
        showToastError('Workflow unavailable', 'Unable to verify workflow transitions right now. Please try again.');
        return { allowed: false, targetWorkflowStatus: null as WorkflowStatusDetail | null };
      }

      const findStatus = (matcher: (status: WorkflowStatusDetail) => boolean) =>
        workflow.statuses.find((status) => matcher(status)) ?? null;

      const currentWorkflowStatus =
        (task.workflowStatusId ? findStatus((status) => status.id === task.workflowStatusId) : null) ??
        (task.workflowStatus?.id ? findStatus((status) => status.id === task.workflowStatus!.id) : null) ??
        (task.workflowStatus?.key ? findStatus((status) => status.key === task.workflowStatus!.key) : null) ??
        findStatus((status) => status.statusRefId === task.status.id) ??
        findStatus((status) => status.key === task.status.key);

      if (!currentWorkflowStatus) {
        showToastError('Workflow mismatch', 'The current task status is not linked to its workflow.');
        return { allowed: false, targetWorkflowStatus: null as WorkflowStatusDetail | null };
      }

      const destinationWorkflowStatus =
        findStatus((status) => status.statusRefId === targetStatus.id) ??
        findStatus((status) => status.key === targetStatus.key);

      if (!destinationWorkflowStatus) {
        showToastError('Workflow mismatch', 'The target column is not part of this workflow.');
        return { allowed: false, targetWorkflowStatus: null as WorkflowStatusDetail | null };
      }

      if (destinationWorkflowStatus.id === currentWorkflowStatus.id) {
        return { allowed: true, targetWorkflowStatus: destinationWorkflowStatus };
      }

      const hasTransition = workflow.transitions.some(
        (transition) => transition.fromId === currentWorkflowStatus.id && transition.toId === destinationWorkflowStatus.id,
      );

      if (!hasTransition) {
        showToastError(
          'Transition not allowed',
          `No workflow transition exists from ${currentWorkflowStatus.name} to ${destinationWorkflowStatus.name}.`,
        );
        return { allowed: false, targetWorkflowStatus: null as WorkflowStatusDetail | null };
      }

      return { allowed: true, targetWorkflowStatus: destinationWorkflowStatus };
    },
    [getWorkflowDetailCached, showToastError],
  );

  const fetchData = useCallback(async (force = false) => {
    // NEVER fetch during active drag - causes infinite loops with dnd-kit measureRects
    if (isDraggingRef.current) {
      return;
    }
    
    // BLOCK all fetches during drag/update operations unless force is true
    if (!force && (isUpdatingRef.current || ssePausedRef.current || pendingUpdatesRef.current.size > 0)) {
      return;
    }
    
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;

    try {
      const [tasksRes, statusesRes, sprintsRes, boardRes, spaceRes] = await Promise.all([
        fetch(`/api/spaces/${spaceSlug}/tasks`, { credentials: 'include' }),
        fetch(`/api/boards/${boardId}/statuses`, { credentials: 'include' }),
        fetch(`/api/boards/${boardId}/sprints`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}/boards/${boardId}`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}`, { credentials: 'include' })
      ]);

      const [tasksData, statusesData, sprintsData, boardData, spaceData] = await Promise.all([
        tasksRes.json(),
        statusesRes.json(),
        sprintsRes.json(),
        boardRes.json(),
        spaceRes.json()
      ]);

      if (boardData.success) {
        setBoardName(boardData.board.name || 'Board');
      }

      if (spaceData.success) {
        setSpaceTicker(spaceData.space.ticker || '');
        setSpaceId(spaceData.space.id || null);
      }

      if (statusesData.success) {
        setStatuses(statusesData.statuses || []);
      }

      if (tasksData.success) {
        const fetchedTasks = tasksData.tasks || [];
        
        // NEVER update tasks during active drag operations - this causes infinite loops
        if (isDraggingRef.current) {
          return;
        }
        
        // Only update if we're not in the middle of an update
        if (!isUpdatingRef.current && !ssePausedRef.current && pendingUpdatesRef.current.size === 0) {
          setTasks(fetchedTasks);
        } else {
          // Merge fetched tasks with optimistic updates - ALWAYS preserve ALL optimistic state
          console.log('[FetchData] Merging with optimistic updates. Pending:', Array.from(pendingUpdatesRef.current));
          setTasks(prevTasks => {
            const newTasks = [...fetchedTasks];
            
            // For tasks that are pending updates, ALWAYS use the optimistic version from ref
            // This ensures multiple pending updates don't overwrite each other
            optimisticTasksRef.current.forEach((optimisticTask, taskId) => {
              const index = newTasks.findIndex(t => t.id === taskId);
              if (index >= 0) {
                // Replace with optimistic version from ref
                console.log('[FetchData] Preserving optimistic task:', taskId, 'Status:', optimisticTask.status?.name);
                newTasks[index] = optimisticTask;
              } else {
                // Add optimistic task if not in fetched results
                console.log('[FetchData] Adding optimistic task not in fetched results:', taskId);
                newTasks.push(optimisticTask);
              }
            });
            
            return newTasks;
          });
        }
      }
      if (sprintsData?.success) {
        setSprints(sprintsData.sprints || []);
        const active = (sprintsData.sprints || []).find((s: any) => s.state === 'ACTIVE');
        setSelectedSprintId(active?.id || (sprintsData.sprints?.[0]?.id ?? null));
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [spaceSlug, boardId]);

  const handleTaskCreated = useCallback((createdTask: Task | null | undefined) => {
    if (createdTask) {
      setTasks((prevTasks) => {
        const withoutCreated = prevTasks.filter((task) => task.id !== createdTask.id);
        return [createdTask, ...withoutCreated];
      });
    }
    fetchData(true);
  }, [fetchData]);

  const fetchWorkflowDetail = useCallback(
     async (workflowId: string | null, workflowStatusId: string | null) => {
       if (!workflowId || !spaceId) {
         setWorkflowDetail(null);
         setWorkflowTransitions([]);
         setAiTransitionSuggestion(null);
         return;
       }
 
       setWorkflowLoading(true);
       setWorkflowError('');
       setAiTransitionSuggestion(null);
       try {
         const response = await fetch(`/api/workflows/${workflowId}?spaceId=${spaceId}`, {
           credentials: 'include',
         });
         const data = await response.json();
         if (response.ok && data.success) {
           const workflow: WorkflowDetail = data.workflow;
           workflowCacheRef.current.set(workflowId, workflow);
           setWorkflowDetail(workflow);
           if (workflowStatusId) {
             const transitions = (workflow.transitions || []).filter(
               (transition) => transition.fromId === workflowStatusId,
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
           workflowCacheRef.current.delete(workflowId);
         }
       } catch (err) {
         console.error('Failed to load workflow detail:', err);
         setWorkflowError('Failed to load workflow');
         setWorkflowDetail(null);
         setWorkflowTransitions([]);
         workflowCacheRef.current.delete(workflowId);
       } finally {
         setWorkflowLoading(false);
       }
     },
     [spaceId],
   );

  const fetchTransitionSuggestion = useCallback(
    async (task: any, transitions: any[]) => {
      if (!task?.workflowId || transitions.length === 0) {
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
            taskId: task.id,
            summary: task.summary,
            currentStatusKey: task.workflowStatus?.key ?? task.status?.key,
            workflowId: task.workflowId,
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
            tags: task.tags,
            priority: task.priority,
          }),
        });
        const data = await response.json();
        if (response.ok && data.success && data.suggestion) {
          const suggestion = data.suggestion;
          const matchedTransition = transitions.find(
            (transition: any) => transition.id === suggestion.transitionId,
          );

          if (!matchedTransition) {
            console.warn('AI transition suggestion rejected: missing transition in context.', {
              suggestion,
            });
            setAiTransitionError('AI suggestion skipped because transition is unavailable.');
            setAiTransitionSuggestion(null);
            return;
          }

          if (typeof suggestion.confidence === 'number' && suggestion.confidence < MIN_AI_TRANSITION_CONFIDENCE) {
            console.warn('AI transition suggestion rejected: confidence below threshold.', {
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
            console.warn('AI transition suggestion rejected: role-restricted transition.', {
              suggestion,
              roleRequirements,
            });
            setAiTransitionError('AI suggestion skipped because it requires elevated permissions.');
            setAiTransitionSuggestion(null);
            return;
          }

          if (matchedTransition.disabled || matchedTransition.isDisabled === true) {
            console.warn('AI transition suggestion rejected: transition disabled.', {
              suggestion,
            });
            setAiTransitionError('AI suggestion skipped because transition is disabled.');
            setAiTransitionSuggestion(null);
            return;
          }

          setAiTransitionSuggestion({
            ...suggestion,
            transitionKey: suggestion.transitionKey ?? `${matchedTransition.fromKey}::${matchedTransition.toKey}`,
          });
          setAiTransitionError('');
        } else {
          const message = data.message || 'Failed to fetch AI suggestion';
          setAiTransitionError(message);
          setAiTransitionSuggestion(null);
        }
      } catch (err) {
        console.error('Failed to fetch AI transition suggestion:', err);
        setAiTransitionError('Failed to fetch AI suggestion');
        setAiTransitionSuggestion(null);
      } finally {
        setAiTransitionLoading(false);
      }
    },
    [],
  );


  useEffect(() => {
    // Reset board-scoped state when switching boards to avoid visual leaks
    setLoading(true);
    setStatuses([]);
    setSprints([]);
    fetchData();
  }, [fetchData, boardId]);

  // Handle tasks with statuses from other boards
  useEffect(() => {
    // Only migrate if we have both tasks and statuses loaded
    if (tasks.length === 0 || statuses.length === 0 || loading || migratingRef.current) {
      return;
    }

    // Check for orphaned tasks
    const validStatusIds = new Set(statuses.map(s => s.id));
    const orphanedTasks = tasks.filter(task => !validStatusIds.has(task.status.id));

    if (orphanedTasks.length > 0) {
      // Find the start status or first status on this board
      const startStatus = statuses.find(s => s.isStart) || statuses[0];
      
      if (startStatus) {
        migratingRef.current = true;
        // Update orphaned tasks to use the start status
        Promise.all(orphanedTasks.map(async (task) => {
          try {
            await fetch(`/api/spaces/${spaceSlug}/tasks/${task.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ statusId: startStatus.id }),
            });
          } catch (err) {
            console.error(`Failed to migrate task ${task.id}:`, err);
          }
        })).then(() => {
          migratingRef.current = false;
          fetchData();
        });
      }
    }
  }, [tasks, statuses, spaceSlug, loading, fetchData]);

  // Sync column heights - make all columns equal to the tallest
  const syncColumnHeights = useCallback(() => {
    const columnRefs = columnRefsRef.current;
    if (columnRefs.size === 0) return;

    // First, remove height constraints to let columns measure naturally
    columnRefs.forEach((element) => {
      element.style.height = 'auto';
    });

    // Use requestAnimationFrame to wait for layout recalculation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        let maxHeight = 0;
        
        // Find the maximum height among all columns
        columnRefs.forEach((element) => {
          // Measure the Card's scrollHeight which includes all content
          const cardElement = element.querySelector('[class*="bg-muted/10"]') as HTMLElement;
          if (cardElement) {
            const height = cardElement.scrollHeight;
            if (height > maxHeight) {
              maxHeight = height;
            }
          }
        });

        // Apply the maximum height to all columns (rounded to avoid subpixel issues)
        if (maxHeight > 0) {
          const roundedHeight = Math.ceil(maxHeight);
          columnRefs.forEach((element) => {
            // Always set to ensure all columns are equal
            element.style.height = `${roundedHeight}px`;
          });
        }
      });
    });
  }, []);

  // Sync heights when tasks or statuses change
  useEffect(() => {
    if (tasks.length === 0 || statuses.length === 0) return;

    const entries = Array.from(columnRefsRef.current.values());
    if (entries.length === 0) return;

    // Initial sync after DOM update
    const timer = setTimeout(() => {
      syncColumnHeights();
    }, 50);

    // Also sync on window resize
    const handleWindowResize = () => {
      setTimeout(() => {
        syncColumnHeights();
      }, 100);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [tasks.length, statuses.length, syncColumnHeights]);

  // Real-time updates via SSE - disabled during drag operations
  useServerSentEvents({
    enabled: !ssePaused && !isDragging,
    spaceId: spaceSlug,
    channel: 'tasks',
    onMessage: useCallback((data: any) => {
      // If SSE is paused or dragging, ignore completely
      if (ssePausedRef.current || isDraggingRef.current) {
        return;
      }
      
      // Only process task updates
      if (data.type === 'task.created' || data.type === 'task.updated' || data.type === 'task:updated') {
        const updatedTaskId = data.payload?.id || data.taskId || data.id;
        
        if (!updatedTaskId) {
          return;
        }
        
        // If this is an update for a task we optimistically updated, update from SSE payload
        if (pendingUpdatesRef.current.has(updatedTaskId)) {
          console.log('[SSE] Received confirmation for optimistically updated task:', updatedTaskId);
          
          // Clear any pending timeout for this task
          if (activeDragTimeoutRef.current) {
            clearTimeout(activeDragTimeoutRef.current);
            activeDragTimeoutRef.current = null;
          }
          
          // Update the task from SSE payload first - this is the source of truth
          const sseTask = data.payload || data;
          if (sseTask && sseTask.id === updatedTaskId) {
            console.log('[SSE] Updating confirmed task from SSE:', sseTask.id, 'Status:', sseTask.status?.name);
            
            // Update the task in state from SSE payload
            setTasks(prevTasks => {
              const updated = prevTasks.map(t => {
                if (t.id === updatedTaskId) {
                  // Use the task from SSE payload - it should have the updated status
                  return sseTask as Task;
                }
                // For other tasks, preserve optimistic state if they're still pending
                if (optimisticTasksRef.current.has(t.id)) {
                  return optimisticTasksRef.current.get(t.id)!;
                }
                return t;
              });
              return updated;
            });
            
            // Now clean up optimistic refs for this task
          pendingUpdatesRef.current.delete(updatedTaskId);
          optimisticTasksRef.current.delete(updatedTaskId);
            
            // Only fetch if there are no other pending updates and we're not dragging
            // This ensures we don't overwrite other optimistic updates
            if (pendingUpdatesRef.current.size === 0 && !isDraggingRef.current) {
              console.log('[SSE] No more pending updates, will fetch fresh data after delay');
              // Delay fetch to ensure server has processed the update
              setTimeout(() => {
                if (!isDraggingRef.current && !isUpdatingRef.current) {
                  fetchData(true);
                }
              }, 500);
            } else {
              console.log('[SSE] Still have pending updates or dragging, skipping fetch to preserve optimistic state');
            }
          } else {
            // If SSE payload doesn't have the task, keep optimistic state
            console.log('[SSE] SSE payload missing task data, keeping optimistic state');
          }
          return;
        }
        
        // Regular task update - only fetch if not currently updating or dragging
        // And only if there are no pending optimistic updates
        if (!isUpdatingRef.current && !ssePausedRef.current && !isDraggingRef.current && pendingUpdatesRef.current.size === 0) {
          setTimeout(() => {
            if (!isDraggingRef.current) {
              fetchData(true);
            }
          }, 100);
        }
      }
    }, [fetchData]),
    onError: useCallback((err: Event) => {
      console.error('SSE error:', err);
    }, []),
  });

  // Centralized cleanup function for drag state
  const cleanupDragState = useCallback(() => {
    console.log('[Cleanup] Resetting drag state');
    setIsDragging(false);
    isDraggingRef.current = false;
    setActiveTask(null);
    setActiveTaskColumnId(null);
    setDragOverStatusId(null);
    setDragOverTaskId(null);
    setDragOverTaskIndex(null);
    setDropPosition(null);
    
    // Clear refs
    dragOverStatusIdRef.current = null;
    dragOverTaskIdRef.current = null;
    dragOverTaskIndexRef.current = null;
    dropPositionRef.current = null;
    
    // Clear timeouts
    if (dragOverUpdateTimeoutRef.current) {
      clearTimeout(dragOverUpdateTimeoutRef.current);
      dragOverUpdateTimeoutRef.current = null;
    }
    if (activeDragTimeoutRef.current) {
      clearTimeout(activeDragTimeoutRef.current);
      activeDragTimeoutRef.current = null;
    }
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    console.log('[Drag Start] Event:', event);
    
    // Ensure we're starting from a clean state
    if (isDraggingRef.current) {
      console.warn('[Drag Start] Previous drag not cleaned up, cleaning now');
      cleanupDragState();
    }
    
    setIsDragging(true);
    isDraggingRef.current = true;
    const taskId = event.active.id as string;
    const activeData = event.active.data.current;
    console.log('[Drag Start] Task ID:', taskId);
    console.log('[Drag Start] Active Data:', activeData);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      console.log('[Drag Start] Task found:', task);
      console.log('[Drag Start] Current status:', task.status);
      setActiveTask(task);
      setActiveTaskColumnId(task.status.id);
      // Get the actual card width from the DOM
      const cardElement = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
      if (cardElement) {
        setCardWidth(cardElement.offsetWidth);
      }
    } else {
      console.error('[Drag Start] Task not found for ID:', taskId);
      cleanupDragState();
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;
    
    // Clear any pending updates to throttle state changes
    if (dragOverUpdateTimeoutRef.current) {
      clearTimeout(dragOverUpdateTimeoutRef.current);
      dragOverUpdateTimeoutRef.current = null;
    }
    
    // Use refs during drag to avoid triggering measureRects loops
    // Only update React state if absolutely necessary for visual feedback
    if (!over) {
      // Update refs immediately
      dragOverStatusIdRef.current = null;
      dragOverTaskIdRef.current = null;
      dragOverTaskIndexRef.current = null;
      dropPositionRef.current = null;
      
      // Only update React state if values are different to prevent unnecessary re-renders
      if (dragOverStatusId !== null || dragOverTaskId !== null || dropPosition !== null) {
        // Throttle state updates to prevent shaking
        dragOverUpdateTimeoutRef.current = setTimeout(() => {
          if (!isDraggingRef.current) return;
      setDragOverStatusId(null);
      setDragOverTaskId(null);
      setDropPosition(null);
          dragOverUpdateTimeoutRef.current = null;
        }, 16); // ~60fps throttling
      }
      return;
    }

    // Check if over is a status or a task
    const overData = over.data.current;
    console.log('[Drag Over] Over ID:', over.id);
    console.log('[Drag Over] Over Data:', overData);
    console.log('[Drag Over] Available statuses:', statuses.map(s => ({ id: s.id, name: s.name })));
    
    const status = statuses.find(s => s.id === over.id) || 
                   (overData?.type === 'status' ? statuses.find(s => s.id === overData?.statusId) : null);
    const task = tasks.find(t => t.id === over.id);

    console.log('[Drag Over] Found status:', status);
    console.log('[Drag Over] Found task:', task);

    if (status) {
      // Dragging over a status column (empty area)
      // Update refs immediately
      dragOverStatusIdRef.current = status.id;
      dragOverTaskIdRef.current = null;
      dragOverTaskIndexRef.current = null;
      dropPositionRef.current = null;
      
      // Only update React state if the status has changed
      if (dragOverStatusId !== status.id || dragOverTaskId !== null || dropPosition !== null) {
        console.log('[Drag Over] Dragging over status column:', status.id, status.name);
        // Update immediately for status columns to show hover effect without delay
        // The isOver from useDroppable already provides immediate feedback, but we update state for consistency
        if (!isDraggingRef.current) return;
      setDragOverStatusId(status.id);
      setDragOverTaskId(null);
      setDropPosition(null);
      }
    } else if (task) {
      // Dragging over a task - also means we're over the column containing that task
      // Update column hover state immediately - CRITICAL for border detection
      const taskStatusId = task.status.id;
      
      // Update refs immediately
      dragOverStatusIdRef.current = taskStatusId;
      
      // ALWAYS update column hover state immediately (no throttling, no conditions)
      // This ensures the hover effect shows immediately when crossing column borders
      // Works in both directions (left-to-right and right-to-left)
      if (!isDraggingRef.current) return;
      setDragOverStatusId(taskStatusId);
      
      // Calculate drop position
      const statusTasks = getTasksForStatus(task.status.id);
      const taskIndex = statusTasks.findIndex(t => t.id === task.id);
      
      // Get the bounding rect and pointer position
      const rect = over.rect;
      
      // Try to get pointer position from various event properties
      let pointerY: number;
      if ('delta' in event && (event as any).delta && 'y' in (event as any).delta) {
        // If delta is available, use it to determine direction
        const delta = (event as any).delta;
        pointerY = delta.y < 0 ? rect.top : rect.top + rect.height;
      } else if ('activatorEvent' in event && (event as any).activatorEvent) {
        pointerY = (event as any).activatorEvent.clientY;
      } else {
        // Default to middle of task
        pointerY = rect.top + rect.height / 2;
      }
      
      // Determine if we should insert before or after
      const middle = rect.top + rect.height / 2;
      const shouldInsertBefore = pointerY < middle;
      
      const dropIndex = shouldInsertBefore ? taskIndex : taskIndex + 1;
      
      // Update refs immediately
      dragOverTaskIdRef.current = null;
      dragOverTaskIndexRef.current = dropIndex;
      dropPositionRef.current = { columnId: task.status.id, index: dropIndex };
      
      // Only update if values have changed
      const newDropPosition = { columnId: task.status.id, index: dropIndex };
      const positionChanged = !dropPosition || 
        dropPosition.columnId !== newDropPosition.columnId || 
        dropPosition.index !== newDropPosition.index;
      
      if (dragOverTaskIndex !== dropIndex || positionChanged) {
        // Throttle state updates to prevent shaking
        dragOverUpdateTimeoutRef.current = setTimeout(() => {
          if (!isDraggingRef.current) return;
      setDragOverTaskId(null); // Don't highlight the task itself
          setDragOverTaskIndex(dropIndex);
          setDropPosition(newDropPosition);
          dragOverUpdateTimeoutRef.current = null;
        }, 16); // ~60fps throttling
      }
    } else if (over.id === 'backlog') {
      // Update refs immediately
      dragOverStatusIdRef.current = 'backlog';
      dragOverTaskIdRef.current = null;
      dragOverTaskIndexRef.current = null;
      dropPositionRef.current = null;
      
      // Dragging over backlog - only update if not already set to backlog
      if (dragOverStatusId !== 'backlog' || dragOverTaskId !== null || dropPosition !== null) {
        // Throttle state updates to prevent shaking
        dragOverUpdateTimeoutRef.current = setTimeout(() => {
          if (!isDraggingRef.current) return;
      setDragOverStatusId('backlog');
      setDragOverTaskId(null);
      setDropPosition(null);
          dragOverUpdateTimeoutRef.current = null;
        }, 16); // ~60fps throttling
      }
    } else {
      // Update refs immediately
      dragOverStatusIdRef.current = null;
      dragOverTaskIdRef.current = null;
      dragOverTaskIndexRef.current = null;
      dropPositionRef.current = null;
      
      // Only update if values are different
      if (dragOverStatusId !== null || dragOverTaskId !== null || dropPosition !== null) {
        // Throttle state updates to prevent shaking
        dragOverUpdateTimeoutRef.current = setTimeout(() => {
          if (!isDraggingRef.current) return;
    setDragOverStatusId(null);
    setDragOverTaskId(null);
    setDropPosition(null);
          dragOverUpdateTimeoutRef.current = null;
        }, 16); // ~60fps throttling
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    console.log('[Drag End] ========== DRAG END EVENT ==========');
    console.log('[Drag End] Event:', event);
    const { active, over } = event;
    console.log('[Drag End] Active ID:', active.id);
    console.log('[Drag End] Active Data:', active.data.current);
    console.log('[Drag End] Over:', over ? { id: over.id, data: over.data.current } : null);

    // Use try/finally to ensure cleanup always happens
    try {
      // Clear any pending drag-over updates immediately
      if (dragOverUpdateTimeoutRef.current) {
        clearTimeout(dragOverUpdateTimeoutRef.current);
        dragOverUpdateTimeoutRef.current = null;
      }

      if (!over) {
        console.log('[Drag End] No over target, aborting');
        return;
      }

      if (active.id === over.id) {
        console.log('[Drag End] Active and over are the same, aborting');
        return;
      }

    const taskId = active.id as string;
    const newStatusId = over.id as string;
      const overData = over.data.current;

      console.log('[Drag End] Task ID:', taskId);
      console.log('[Drag End] Over ID:', newStatusId);
      console.log('[Drag End] Over Data:', overData);

    // Find the task and current status
    const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        console.error('[Drag End] Task not found for ID:', taskId);
        return;
      }

      console.log('[Drag End] Task found:', task);
      console.log('[Drag End] Current task status:', task.status);
      console.log('[Drag End] Available statuses:', statuses.map(s => ({ id: s.id, name: s.name })));

    // Handle backlog drop - remove from sprint
    if (newStatusId === 'backlog') {
      if (!task.sprintId) return; // Already in backlog
      
      // Save the original task state for potential revert
      const originalTasks = [...tasks];

        try {
      // CRITICAL: Set updating flag FIRST to block all fetches
      isUpdatingRef.current = true;
      
      // STEP 1: Pause SSE - blocks all real-time updates
      ssePausedRef.current = true;
      setSsePaused(true);
      
      // STEP 2: Create optimistic task state without sprintId
      const optimisticTask: Task = {
        ...task,
        sprintId: null,
      };
      
      // STEP 3: Store optimistic task in ref BEFORE state update
      optimisticTasksRef.current.set(taskId, optimisticTask);
      
      // STEP 4: Add to pending updates synchronously
      const newPendingUpdates = new Set(pendingUpdatesRef.current);
      newPendingUpdates.add(taskId);
      pendingUpdatesRef.current = newPendingUpdates;

      // STEP 5: Update sprint status immediately
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map((t) =>
          t.id === taskId ? optimisticTask : t
        );
        return updatedTasks;
      });

      // STEP 6: Make API call in background
          const response = await fetch(`/api/tasks/${taskId}/assign-sprint`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sprintId: null }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update task');
          }
          
          // Clear pending updates since we got server confirmation
          pendingUpdatesRef.current.delete(taskId);
          optimisticTasksRef.current.delete(taskId);
          isUpdatingRef.current = false;
          ssePausedRef.current = false;
          setSsePaused(false);
        } catch (err) {
          console.error('Failed to update task:', err);
          setTasks(originalTasks);
          pendingUpdatesRef.current.delete(taskId);
          optimisticTasksRef.current.delete(taskId);
          isUpdatingRef.current = false;
          ssePausedRef.current = false;
          setSsePaused(false);
        }
        
        return;
      }
      
      // Check if over.id is a status ID or if over.data indicates a status
      const status = statuses.find((s) => s.id === newStatusId) || 
                     (overData?.type === 'status' ? statuses.find((s) => s.id === overData?.statusId) : null);
      
      console.log('[Drag End] Resolved status:', status);
      
      // If dropping directly on a status column (empty area)
      if (status) {
        console.log('[Drag End] Dropping on status column:', status.id, status.name);
        // Different status - move task to new column
        if (task.status.id !== status.id) {
          console.log('[Drag End] Status change detected:', task.status.id, '->', status.id);
          const transitionResult = await resolveWorkflowTransition(task, status);
          console.log('[Drag End] Transition result:', transitionResult);
          if (!transitionResult.allowed) {
            console.log('[Drag End] Transition not allowed, aborting');
          return;
        }
          const targetWorkflowStatus = transitionResult.targetWorkflowStatus;
        
        // Save the original task state for potential revert
        const originalTasks = [...tasks];

          try {
        // CRITICAL: Set updating flag FIRST to block all fetches
        isUpdatingRef.current = true;
        
        // STEP 1: Pause SSE - blocks all real-time updates
        ssePausedRef.current = true;
        setSsePaused(true);
        
        // STEP 2: Create optimistic task state with new status
        const optimisticTask: Task = {
          ...task,
          status: {
                id: status.id,
                name: status.name,
                key: status.key,
                color: status.color,
              },
              workflowId: task.workflowId ?? null,
              workflowStatusId:
                targetWorkflowStatus?.id ?? task.workflowStatusId ?? task.workflowStatus?.id ?? null,
              workflowStatus: targetWorkflowStatus ? mapWorkflowStatus(targetWorkflowStatus) : task.workflowStatus ?? null,
        };
        
        // STEP 3: Store optimistic task in ref BEFORE state update
        optimisticTasksRef.current.set(taskId, optimisticTask);
        
        // STEP 4: Add to pending updates synchronously
        const newPendingUpdates = new Set(pendingUpdatesRef.current);
        newPendingUpdates.add(taskId);
        pendingUpdatesRef.current = newPendingUpdates;

            // STEP 5: Update status immediately - update synchronously to ensure immediate visual feedback
            // This ensures the task appears in the new column immediately and is removed from the old column
            // Update state synchronously - no await, no delay, immediate update
            // Also use dropPosition to insert at the correct position if available
            const finalDropPosition = dropPositionRef.current || dropPosition;
        setTasks(prevTasks => {
              // Remove the task from its current position
              const tasksWithoutMoved = prevTasks.filter(t => t.id !== taskId);
              
              // If we have a drop position for this column, insert at that position
              if (finalDropPosition && finalDropPosition.columnId === status.id) {
                const targetColumnTasks = tasksWithoutMoved.filter(t => t.status.id === status.id);
                const otherTasks = tasksWithoutMoved.filter(t => t.status.id !== status.id);
                
                const insertIndex = Math.min(Math.max(0, finalDropPosition.index), targetColumnTasks.length);
                const reorderedTargetTasks = [
                  ...targetColumnTasks.slice(0, insertIndex),
                  optimisticTask,
                  ...targetColumnTasks.slice(insertIndex)
                ];
                
                return [...otherTasks, ...reorderedTargetTasks];
              } else {
                // Otherwise, just add to the end of the target column
                const targetColumnTasks = tasksWithoutMoved.filter(t => t.status.id === status.id);
                const otherTasks = tasksWithoutMoved.filter(t => t.status.id !== status.id);
                
                return [...otherTasks, ...targetColumnTasks, optimisticTask];
              }
            });
            
            // Immediately reset updating flags so the task appears normally (not in pending state)
            // This makes the drop smooth and immediate
            isUpdatingRef.current = false;
            ssePausedRef.current = false;
            setSsePaused(false);

        // STEP 6: Make API call in background
            console.log('[Drag End] Making API call to update task status:', status.id);
            const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
              body: JSON.stringify({ statusId: status.id }),
            });
            
            console.log('[Drag End] API response status:', response.status);
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('[Drag End] API error response:', errorData);
              if (response.status === 401) {
                throw new Error('Authentication required. Please refresh the page and try again.');
              }
              throw new Error(errorData.message || 'Failed to update task');
            }
            
            console.log('[Drag End] Task status updated successfully');
            // Success - task is already in the new position via optimistic update
            // Keep optimistic state and let SSE handle the confirmation
            // Flags are already reset above for immediate smooth appearance
            
            // Fallback: if SSE doesn't come through within 3 seconds, fetch manually
            // But keep optimistic state during fetch so merge logic preserves it
            activeDragTimeoutRef.current = setTimeout(() => {
              if (pendingUpdatesRef.current.has(taskId)) {
                console.log('[Drag End] SSE timeout - fetching manually (keeping optimistic state)');
                // Don't clean up optimistic state before fetch - let merge logic handle it
                fetchData(true).then(() => {
                  // Only clean up after fetch confirms the update
                  if (pendingUpdatesRef.current.has(taskId)) {
            pendingUpdatesRef.current.delete(taskId);
            optimisticTasksRef.current.delete(taskId);
                  }
                  activeDragTimeoutRef.current = null;
                });
              } else {
                activeDragTimeoutRef.current = null;
              }
            }, 3000);
          } catch (err: any) {
            console.error('[Drag End] Failed to update task:', err);
            // Revert optimistic update on error
            setTasks(originalTasks);
            pendingUpdatesRef.current.delete(taskId);
            optimisticTasksRef.current.delete(taskId);
            isUpdatingRef.current = false;
            ssePausedRef.current = false;
            setSsePaused(false);
            // Show user-friendly error message
            if (err.message?.includes('Authentication')) {
              alert('Your session has expired. Please refresh the page and try again.');
            }
          }
        } else {
          console.log('[Drag End] Same status, no change needed');
        }
        return;
      }
    
    // If not a status, it might be a task-to-task reorder within the same status
    if (!status) {
      console.log('[Drag End] Not a status, checking if it is a task');
      // Check if over.id is a task ID (reorder within same column or cross-column drop)
      const overTask = tasks.find((t) => t.id === newStatusId);
      if (!overTask) {
        console.log('[Drag End] Not a status and not a valid task, aborting');
        return;
      }
      
      // Get the actual status of the overTask (accounting for optimistic updates)
      let overTaskStatus = overTask.status;
      if (pendingUpdatesRef.current.has(overTask.id)) {
        const optimisticOverTask = optimisticTasksRef.current.get(overTask.id);
        if (optimisticOverTask) {
          overTaskStatus = optimisticOverTask.status;
        }
      }
      
      // Get the actual status of the dragged task (accounting for optimistic updates)
      let currentTaskStatus = task.status;
      if (pendingUpdatesRef.current.has(task.id)) {
        const optimisticCurrentTask = optimisticTasksRef.current.get(task.id);
        if (optimisticCurrentTask) {
          currentTaskStatus = optimisticCurrentTask.status;
        }
      }
      
      console.log('[Drag End] Over task found:', overTask);
      console.log('[Drag End] Over task status:', overTaskStatus);
      console.log('[Drag End] Current task status:', currentTaskStatus);
      
      if (overTaskStatus.id === currentTaskStatus.id) {
        console.log('[Drag End] Same status - reordering within column');
        // Same status - this is a reorder, handle it client-side
        // Use dropPosition to determine the exact insertion point
        const finalDropPosition = dropPositionRef.current || dropPosition;
        
        if (finalDropPosition && finalDropPosition.columnId === currentTaskStatus.id) {
          // Reorder within the same column using the calculated drop position
          setTasks(prevTasks => {
            const statusTasks = prevTasks.filter(t => t.status.id === currentTaskStatus.id);
            const otherTasks = prevTasks.filter(t => t.status.id !== currentTaskStatus.id);
            
            // Find the task to move
            const taskToMove = statusTasks.find(t => t.id === taskId);
            if (!taskToMove) return prevTasks;
            
            // Remove the task from its current position
            const tasksWithoutMoved = statusTasks.filter(t => t.id !== taskId);
            
            // Insert at the calculated position (clamp to valid range)
            const insertIndex = Math.min(Math.max(0, finalDropPosition.index), tasksWithoutMoved.length);
            const reorderedTasks = [
              ...tasksWithoutMoved.slice(0, insertIndex),
              taskToMove,
              ...tasksWithoutMoved.slice(insertIndex)
            ];
            
            // Combine with tasks from other columns
            return [...otherTasks, ...reorderedTasks];
          });
        } else {
          // Fallback: use arrayMove if dropPosition is not available
          setTasks(prevTasks => {
            const oldIndex = prevTasks.findIndex(t => t.id === taskId);
            const newIndex = prevTasks.findIndex(t => t.id === newStatusId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
              return arrayMove(prevTasks, oldIndex, newIndex);
            }
            
            return prevTasks;
          });
        }
        return;
      } else {
        // Different status - drop on task in different column
        console.log('[Drag End] Different status - dropping on task in different column');
        // Find the status of the target task (use the actual status, accounting for optimistic updates)
        const targetStatus = statuses.find(s => s.id === overTaskStatus.id);
        if (!targetStatus) {
          console.error('[Drag End] Target status not found for task status:', overTask.status.id);
        return;
      }
        
        console.log('[Drag End] Target status:', targetStatus);
        const transitionResult = await resolveWorkflowTransition(task, targetStatus);
        console.log('[Drag End] Transition result:', transitionResult);
        if (!transitionResult.allowed) {
          console.log('[Drag End] Transition not allowed, aborting');
          return;
        }
        const targetWorkflowStatus = transitionResult.targetWorkflowStatus;

    // Save the original task state for potential revert
    const originalTasks = [...tasks];
    const oldStatusId = task.status.id;

    // CRITICAL: Set updating flag FIRST to block all fetches
    isUpdatingRef.current = true;
    
    // STEP 1: Pause SSE - blocks all real-time updates
    ssePausedRef.current = true;
    setSsePaused(true);
    
        // STEP 2: Create optimistic task state with new status
    const optimisticTask: Task = {
      ...task,
      status: {
            id: targetStatus.id,
            name: targetStatus.name,
            key: targetStatus.key,
            color: targetStatus.color,
          },
          workflowId: task.workflowId ?? null,
          workflowStatusId:
            targetWorkflowStatus?.id ?? task.workflowStatusId ?? task.workflowStatus?.id ?? null,
          workflowStatus: targetWorkflowStatus ? mapWorkflowStatus(targetWorkflowStatus) : task.workflowStatus ?? null,
    };
    
    // STEP 3: Store optimistic task in ref BEFORE state update
    optimisticTasksRef.current.set(taskId, optimisticTask);
    
    // STEP 4: Add to pending updates synchronously
    const newPendingUpdates = new Set(pendingUpdatesRef.current);
    newPendingUpdates.add(taskId);
    pendingUpdatesRef.current = newPendingUpdates;

        // STEP 5: Update status immediately - update synchronously to ensure immediate visual feedback
        // This ensures the task appears in the new column immediately and is removed from the old column
        // Also use dropPosition to insert at the correct position if available
        const finalDropPosition = dropPositionRef.current || dropPosition;
    setTasks(prevTasks => {
          // Remove the task from its current position
          const tasksWithoutMoved = prevTasks.filter(t => t.id !== taskId);
          
          // If we have a drop position for this column, insert at that position
          if (finalDropPosition && finalDropPosition.columnId === targetStatus.id) {
            const targetColumnTasks = tasksWithoutMoved.filter(t => t.status.id === targetStatus.id);
            const otherTasks = tasksWithoutMoved.filter(t => t.status.id !== targetStatus.id);
            
            const insertIndex = Math.min(Math.max(0, finalDropPosition.index), targetColumnTasks.length);
            const reorderedTargetTasks = [
              ...targetColumnTasks.slice(0, insertIndex),
              optimisticTask,
              ...targetColumnTasks.slice(insertIndex)
            ];
            
            return [...otherTasks, ...reorderedTargetTasks];
          } else {
            // Otherwise, just add to the end of the target column
            const targetColumnTasks = tasksWithoutMoved.filter(t => t.status.id === targetStatus.id);
            const otherTasks = tasksWithoutMoved.filter(t => t.status.id !== targetStatus.id);
            
            return [...otherTasks, ...targetColumnTasks, optimisticTask];
          }
        });
        
        // Immediately reset updating flags so the task appears normally (not in pending state)
        // This makes the drop smooth and immediate
        isUpdatingRef.current = false;
        ssePausedRef.current = false;
        setSsePaused(false);

        // STEP 6: Make API call in background
        try {
          console.log('[Drag End] Making API call to update task status (cross-column):', targetStatus.id);
          const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
            body: JSON.stringify({ statusId: targetStatus.id }),
          });
          
          console.log('[Drag End] API response status (cross-column):', response.status);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Drag End] API error response (cross-column):', errorData);
            if (response.status === 401) {
              throw new Error('Authentication required. Please refresh the page and try again.');
            }
            throw new Error(errorData.message || 'Failed to update task');
          }
          
          console.log('[Drag End] Task status updated successfully (cross-column)');
          // Success - task is already in the new position via optimistic update
          // Keep optimistic state and let SSE handle the confirmation
          // Flags are already reset above for immediate smooth appearance
          
          // Fallback: if SSE doesn't come through within 3 seconds, fetch manually
          // But keep optimistic state during fetch so merge logic preserves it
          activeDragTimeoutRef.current = setTimeout(() => {
            if (pendingUpdatesRef.current.has(taskId)) {
              console.log('[Drag End] SSE timeout - fetching manually (cross-column, keeping optimistic state)');
              // Don't clean up optimistic state before fetch - let merge logic handle it
              fetchData(true).then(() => {
                // Only clean up after fetch confirms the update
                if (pendingUpdatesRef.current.has(taskId)) {
        pendingUpdatesRef.current.delete(taskId);
        optimisticTasksRef.current.delete(taskId);
                }
                activeDragTimeoutRef.current = null;
              });
            } else {
              activeDragTimeoutRef.current = null;
            }
          }, 3000);
        } catch (err: any) {
          console.error('[Drag End] Failed to update task (cross-column):', err);
        // Revert optimistic update on error
        setTasks(originalTasks);
        pendingUpdatesRef.current.delete(taskId);
        optimisticTasksRef.current.delete(taskId);
        isUpdatingRef.current = false;
        ssePausedRef.current = false;
        setSsePaused(false);
          // Show user-friendly error message
          if (err.message?.includes('Authentication')) {
            alert('Your session has expired. Please refresh the page and try again.');
          }
        }
        
        return;
      }
    }
    } catch (err: any) {
      // Catch any unexpected errors
      console.error('[Drag End] Unexpected error:', err);
    } finally {
      // Always cleanup drag state, even if errors occurred
      // Set dropping flag to prevent reverse animation - keep it true longer
      setIsDropping(true);
      // Use a longer delay to ensure the optimistic update is fully rendered and stable
      // This prevents the reverse animation by keeping transitions disabled until the task is settled
      setTimeout(() => {
        setIsDropping(false);
        // Cleanup drag state after transitions are re-enabled
        setTimeout(() => {
          cleanupDragState();
        }, 50); // Small delay to ensure cleanup happens after transition re-enable
      }, 300); // Keep isDropping true for 300ms to prevent reverse animation
    }
  };

  const handleStatusesUpdated = () => {
    workflowCacheRef.current.clear();
    fetchData();
  };

  const handleColumnRef = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      columnRefsRef.current.set(id, element);
    } else {
      columnRefsRef.current.delete(id);
    }
  }, []);


  const handleTaskClick = async (taskId: string, _isTaskNumberClick = false) => {
    // Don't open dialog if we're dragging
    if (isDragging) return;
    
    setSelectedTaskId(taskId);
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
        fetch(`/api/spaces/${spaceSlug}/members`, { credentials: 'include' })
      ]);
      
      if (taskResponse.ok) {
        const taskData = await taskResponse.json();
        if (taskData.success) {
          const { description: cleanedDescription, metadata } = extractTemplateMetadata(taskData.task.description || '');
          setTemplateMetadata(metadata);
          setTaskDetail({
            ...taskData.task,
            description: cleanedDescription,
            tags: Array.isArray(taskData.task.tags) ? taskData.task.tags : typeof taskData.task.tags === 'string' ? JSON.parse(taskData.task.tags) : [],
            startDate: taskData.task.startDate,
            dueDate: taskData.task.dueDate
          });
          if (metadata?.templateId) {
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
                  const customValues = Array.isArray(taskData.task.customFieldValues) ? taskData.task.customFieldValues : [];
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
          } else {
            setTemplateDefinition(null);
            setTemplateFieldsConfig([]);
            setTemplateFieldValues({});
            if (taskData.task.workflowId) {
              fetchWorkflowDetail(taskData.task.workflowId, taskData.task.workflowStatus?.id ?? taskData.task.workflowStatusId ?? null);
            } else {
              setWorkflowDetail(null);
              setWorkflowTransitions([]);
            }
          }
          setEditFormData({
            summary: taskData.task.summary || '',
            description: cleanedDescription || '',
            priority: taskData.task.priority || 'NORMAL',
            tags: Array.isArray(taskData.task.tags) ? taskData.task.tags.join(', ') : '',
            startDate: taskData.task.startDate ? new Date(taskData.task.startDate).toISOString().split('T')[0] : '',
            dueDate: taskData.task.dueDate ? new Date(taskData.task.dueDate).toISOString().split('T')[0] : '',
            estimate: taskData.task.estimate || '',
            assigneeId: taskData.task.assignee?.id || '',
            statusId: taskData.task.status?.id || ''
          });
        }
      }
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.success) {
          setSpaceUsers(usersData.members.map((m: any) => m.user));
        }
      }
    } catch (err) {
      console.error('Failed to fetch task details:', err);
    } finally {
      setLoadingTaskDetail(false);
    }
  };

  useEffect(() => {
    if (!selectedTaskId || !taskDetail) {
      setAiTransitionSuggestion(null);
      return;
    }
    if (workflowTransitions.length === 0) {
      setAiTransitionSuggestion(null);
      return;
    }
    fetchTransitionSuggestion(taskDetail, workflowTransitions);
  }, [selectedTaskId, taskDetail, workflowTransitions, fetchTransitionSuggestion]);

  const handlePerformTransition = useCallback(
    async (transitionId: string, transitionKey?: string) => {
      if (!selectedTaskId) return;
      setWorkflowError('');
      setWorkflowLoading(true);
      setAiTransitionSuggestion(null);
      try {
        const response = await fetch(`/api/tasks/${selectedTaskId}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ transitionId, transitionKey }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          await handleTaskClick(selectedTaskId);
          fetchData(true);
        } else {
          const message = data.message || 'Failed to transition task';
          setWorkflowError(message);
        }
      } catch (err) {
        console.error('Failed to perform transition:', err);
        setWorkflowError('Failed to perform transition');
      } finally {
        setWorkflowLoading(false);
      }
    },
    [selectedTaskId, handleTaskClick, fetchData],
  );

  const handleSave = async () => {
    if (!selectedTaskId || !editFormData) return;
    
    setSaving(true);
    try {
      const tagsArray = editFormData.tags 
        ? editFormData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
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
          users: spaceUsers
        });
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
            summary: editFormData.summary,
        description,
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
        `/api/spaces/${spaceSlug}/tasks/${selectedTaskId}`,
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
          // Refresh board
          await fetchData();
          // Close the dialog
          setSelectedTaskId(null);
          setTaskDetail(null);
          setTemplateMetadata(null);
          setTemplateDefinition(null);
          setTemplateFieldsConfig([]);
          setTemplateFieldValues({});
          setEditFormData(null);
          setCalendarOpen(null);
          setAiMenusOpen(false);
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
    if (!selectedTaskId) return;
    
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/tasks/${selectedTaskId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        // Refresh board
        await fetchData();
        // Close the dialog
        setSelectedTaskId(null);
        setTaskDetail(null);
        setTemplateMetadata(null);
        setTemplateDefinition(null);
        setTemplateFieldsConfig([]);
        setTemplateFieldValues({});
        setEditFormData(null);
        setCalendarOpen(null);
        setAiMenusOpen(false);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditStatus = (status: Status) => {
    setConfigOpen(true);
    // TODO: Set status to edit in configuration
  };

  // Filter tasks based on search and filters
  const filterTasks = useCallback((tasksToFilter: Task[]): Task[] => {
    let filtered = tasksToFilter;

    // Apply search query
    if (activeSearchQuery.trim()) {
      const query = activeSearchQuery.toLowerCase();
      filtered = filtered.filter((task) => {
        const searchableFields = [
          task.summary,
          task.description,
          spaceTicker && task.number ? `${spaceTicker}-${task.number}` : '',
          task.status?.name,
          task.assignee?.name || task.assignee?.email,
          formatPriority(task.priority || 'NORMAL'),
          ...(task.tags || []),
        ];
        return searchableFields.some((field) => String(field).toLowerCase().includes(query));
      });
    }

    // Apply priority filter
    if (filters.priorities.length > 0) {
      filtered = filtered.filter((task) => {
        const priority = formatPriority(task.priority || 'NORMAL').toLowerCase();
        return filters.priorities.some((p) => priority === p.toLowerCase());
      });
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((task) => {
        return task.tags && task.tags.some((tag) => filters.tags.includes(tag));
      });
    }

    // Apply overdue filter
    if (filters.showOverdue) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });
    }

    return filtered;
  }, [activeSearchQuery, filters, spaceTicker]);

  // Get swimlanes based on grouping
  const getSwimlanes = useCallback((): string[] | null => {
    if (groupBy === 'none') {
      return null;
    }

    const allTasks = tasks;
    const filtered = filterTasks(allTasks);

    if (groupBy === 'assignee') {
      const assigneeSet = new Set<string>();
      filtered.forEach((task) => {
        assigneeSet.add(task.assignee?.id || 'Unassigned');
      });
      return Array.from(assigneeSet).sort();
    }

    if (groupBy === 'template') {
      const templateSet = new Set<string>();
      filtered.forEach((task) => {
        const template = task.tags && task.tags.length > 0 ? task.tags[0] : 'No Template';
        templateSet.add(template);
      });
      return Array.from(templateSet).sort();
    }

    if (groupBy === 'priority') {
      const priorityOrder = ['HIGHEST', 'HIGH', 'NORMAL', 'LOW', 'LOWEST'];
      const prioritySet = new Set<string>();
      filtered.forEach((task) => {
        prioritySet.add(task.priority || 'NORMAL');
      });
      return priorityOrder.filter((p) => prioritySet.has(p));
    }

    return null;
  }, [groupBy, tasks, filterTasks]);

  const getTasksForStatus = (statusId: string) => {
    // Filter tasks for this status
    // For pending updates, show task ONLY in NEW position, NOT in old position
    const filteredTasks = tasks.filter((task) => {
      // If this task is being updated, ONLY use the optimistic status
      // This ensures the task appears ONLY in the new column, not the old one
      if (pendingUpdatesRef.current.has(task.id)) {
        const optimisticTask = optimisticTasksRef.current.get(task.id);
        if (optimisticTask) {
          // Only show in the new status column
          return optimisticTask.status.id === statusId;
        }
        // If optimistic task not found, don't show in any column
        return false;
      }
      // Normal filtering - but exclude tasks that are being updated (they should use optimistic status above)
      return task.status.id === statusId;
    });
    
    // Remove duplicates (in case task appears in both old and new columns during transition)
    const seen = new Set<string>();
    return filteredTasks.filter(task => {
      if (seen.has(task.id)) {
        return false;
      }
      seen.add(task.id);
      return true;
    });
  };

  // Get tasks for a specific swimlane and column
  const getTasksForSwimlaneAndColumn = useCallback((swimlane: string, statusId: string): Task[] => {
    let filtered = getTasksForStatus(statusId);
    filtered = filterTasks(filtered);

    if (groupBy === 'assignee') {
      return filtered.filter((task) => (task.assignee?.id || 'Unassigned') === swimlane);
    }

    if (groupBy === 'template') {
      return filtered.filter((task) => {
        const template = task.tags && task.tags.length > 0 ? task.tags[0] : 'No Template';
        return template === swimlane;
      });
    }

    if (groupBy === 'priority') {
      return filtered.filter((task) => (task.priority || 'NORMAL') === swimlane);
    }

    return [];
  }, [groupBy, filterTasks]);

  const filteredTasksForStatus = useCallback((statusId: string) => {
    const statusTasks = getTasksForStatus(statusId);
    return filterTasks(statusTasks);
  }, [filterTasks]);

  const handleSearch = useCallback(() => {
    setActiveSearchQuery(searchInput);
  }, [searchInput]);

  const handleAIFilter = useCallback(async () => {
    if (!searchInput.trim()) return;
    
    setIsGenerating(true);
    setGeneratingText('AI is analyzing');
    
    try {
      const response = await fetch('/api/ai/parse-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          query: searchInput, 
          fields: [
            { key: 'summary', label: 'Summary' },
            { key: 'status', label: 'Status' },
            { key: 'assignee', label: 'Assignee' },
            { key: 'priority', label: 'Priority' },
            { key: 'dueDate', label: 'Due Date' },
            { key: 'tags', label: 'Tags' },
          ]
        }),
      });

      const data = await response.json();
      if (data.success && data.filters) {
        // Apply AI filters
        const newFilters = { ...filters };
        data.filters.forEach((filter: any) => {
          if (filter.field === 'priority') {
            const priorityMap: Record<string, string> = {
              'Highest': 'HIGHEST',
              'High': 'HIGH',
              'Normal': 'NORMAL',
              'Low': 'LOW',
              'Lowest': 'LOWEST',
            };
            const mappedPriority = priorityMap[filter.value] || filter.value.toUpperCase();
            if (!newFilters.priorities.includes(mappedPriority)) {
              newFilters.priorities.push(mappedPriority);
            }
          } else if (filter.field === 'tags') {
            if (!newFilters.tags.includes(filter.value)) {
              newFilters.tags.push(filter.value);
            }
          }
        });
        setFilters(newFilters);
        setActiveSearchQuery('');
        setSearchInput('');
      } else {
        // Fallback to regular search
        setActiveSearchQuery(searchInput);
      }
    } catch (err) {
      console.error('AI filter error:', err);
      // Fallback to regular search
      setActiveSearchQuery(searchInput);
    } finally {
      setTimeout(() => setIsGenerating(false), 1000);
    }
  }, [searchInput, filters]);

  useEffect(() => {
    if (!isGenerating) return;
    const texts = ['AI is analyzing', 'AI is analyzing.', 'AI is analyzing..', 'AI is analyzing...'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setGeneratingText(texts[index]);
    }, 400);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const activeFiltersCount = filters.priorities.length + filters.tags.length + (filters.showOverdue ? 1 : 0);
  const swimlanes = getSwimlanes();

  // Get all unique tags from tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.tags) {
        task.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--muted)]/30 relative">
      {/* Search and Filter Bar */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={isGenerating ? generatingText : 'Search tasks...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  handleSearch();
                }
              }}
              disabled={isGenerating}
              className={`w-full px-4 py-2 bg-[var(--background)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm ${
                isGenerating
                  ? 'border-purple-500/50 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5 cursor-not-allowed'
                  : 'border-[var(--border)]'
              }`}
            />
            {searchInput && !isGenerating && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setActiveSearchQuery('');
                }}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isGenerating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Sparkles
                  className="w-4 h-4 text-purple-500"
                  style={{
                    animation: 'sparkle 1.2s ease-in-out infinite'
                  }}
                />
              </div>
            )}
          </div>
            <Button
              variant="outline"
            size="icon"
            className="bg-[var(--background)] hover:bg-[var(--muted)]"
            disabled={isGenerating}
            onClick={handleSearch}
          >
            <Search className="w-4 h-4" />
            </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAIFilter}
                  disabled={isGenerating || !searchInput.trim()}
                  className={`bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30 hover:from-purple-500/20 hover:to-blue-500/20 text-purple-600 dark:text-purple-400 transition-all hover:scale-105 ${
                    isGenerating ? 'animate-pulse cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <Sparkles
                    className="w-4 h-4"
                    style={isGenerating ? {
                      animation: 'twinkle 1.5s ease-in-out infinite'
                    } : {}}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isGenerating ? 'Generating...' : 'Generate with AI'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)] relative">
                <Filter className="w-4 h-4" />
                Filter
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--primary)] text-white rounded-full text-xs flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.priorities.includes('HIGHEST')}
                onCheckedChange={(checked) => {
                  setFilters((prev) => ({
                    ...prev,
                    priorities: checked
                      ? [...prev.priorities, 'HIGHEST']
                      : prev.priorities.filter((p) => p !== 'HIGHEST'),
                  }));
                }}
              >
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Highest
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.priorities.includes('HIGH')}
                onCheckedChange={(checked) => {
                  setFilters((prev) => ({
                    ...prev,
                    priorities: checked
                      ? [...prev.priorities, 'HIGH']
                      : prev.priorities.filter((p) => p !== 'HIGH'),
                  }));
                }}
              >
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  High
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.priorities.includes('NORMAL')}
                onCheckedChange={(checked) => {
                  setFilters((prev) => ({
                    ...prev,
                    priorities: checked
                      ? [...prev.priorities, 'NORMAL']
                      : prev.priorities.filter((p) => p !== 'NORMAL'),
                  }));
                }}
              >
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Normal
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.priorities.includes('LOW')}
                onCheckedChange={(checked) => {
                  setFilters((prev) => ({
                    ...prev,
                    priorities: checked
                      ? [...prev.priorities, 'LOW']
                      : prev.priorities.filter((p) => p !== 'LOW'),
                  }));
                }}
              >
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  Low
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.priorities.includes('LOWEST')}
                onCheckedChange={(checked) => {
                  setFilters((prev) => ({
                    ...prev,
                    priorities: checked
                      ? [...prev.priorities, 'LOWEST']
                      : prev.priorities.filter((p) => p !== 'LOWEST'),
                  }));
                }}
              >
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  Lowest
                </span>
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />

              <DropdownMenuCheckboxItem
                checked={filters.showOverdue}
                onCheckedChange={setFilters.bind(null, (prev) => ({ ...prev, showOverdue: !prev.showOverdue }))}
              >
                Show Overdue Only
              </DropdownMenuCheckboxItem>

              {activeFiltersCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setFilters({
                        priorities: [],
                        tags: [],
                        showOverdue: false,
                      });
                    }}
                    className="text-red-500"
                  >
                    Clear All Filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={groupMenuOpen} onOpenChange={setGroupMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)] h-8">
                <SlidersHorizontal className="w-4 h-4" />
                Group by
                {groupBy !== 'none' && (
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                    ({groupBy.charAt(0).toUpperCase() + groupBy.slice(1)})
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setGroupBy('assignee')}>
                <span className="flex items-center gap-2">
                  {groupBy === 'assignee' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                  Assignee
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('template')}>
                <span className="flex items-center gap-2">
                  {groupBy === 'template' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                  Template
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('priority')}>
                <span className="flex items-center gap-2">
                  {groupBy === 'priority' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                  Priority
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setGroupBy('none')}>
                <span className="flex items-center gap-2">
                  {groupBy === 'none' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                  None
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          // Custom collision detection that prioritizes columns (status droppables) over tasks
          // This ensures column detection works even when tasks are present, especially for middle columns
          const collisions = closestCorners(args);
          
          // If we have collisions, check if any of them are status columns
          // Prioritize status columns over tasks
          if (collisions && collisions.length > 0) {
            const statusCollision = collisions.find(collision => {
              const droppable = args.droppableContainers.find(container => container.id === collision.id);
              return droppable?.data.current?.type === 'status';
            });
            
            // If we found a status collision, return it first
            if (statusCollision) {
              return [statusCollision, ...collisions.filter(c => c.id !== statusCollision.id)];
            }
          }
          
          return collisions;
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >

        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
          
          <div className="relative z-10">
            {swimlanes ? (
              // Swimlane View (JIRA-style with collapsible groups)
              <div className="flex flex-col p-6">
                {swimlanes.map((swimlane, swimlaneIndex) => {
                  const isCollapsed = collapsedGroups.has(swimlane);
                  const totalTasksInGroup = statuses
                    .filter(status => !status.hidden)
                    .reduce((sum, status) => {
                      return sum + getTasksForSwimlaneAndColumn(swimlane, status.id).length;
                    }, 0);

                  // Get display name for swimlane
                  let displayName = swimlane;
                  if (groupBy === 'assignee') {
                    const assignee = spaceUsers.find(u => u.id === swimlane);
                    displayName = assignee ? (assignee.name || assignee.email) : 'Unassigned';
                  } else if (groupBy === 'priority') {
                    displayName = formatPriority(swimlane);
                  }

                  return (
                    <div key={swimlane} className="mb-6">
                      {/* Group Header - Collapsible */}
                      <div
                        className="flex items-center gap-2 px-3 py-2 mb-3 bg-[var(--muted)]/30 rounded-lg cursor-pointer hover:bg-[var(--muted)]/50 transition-colors border border-[var(--border)]"
                        onClick={() => {
                          const newCollapsed = new Set(collapsedGroups);
                          if (isCollapsed) {
                            newCollapsed.delete(swimlane);
                          } else {
                            newCollapsed.add(swimlane);
                          }
                          setCollapsedGroups(newCollapsed);
                        }}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                        )}
                        <span className="uppercase text-xs text-[var(--muted-foreground)] mr-2">
                          {groupBy}:
                        </span>
                        <span className="text-sm text-[var(--foreground)]">
                          {displayName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 ml-2">
                          {totalTasksInGroup}
                        </span>
                      </div>

                      {/* Group Content - Columns */}
                      {!isCollapsed && (
                        <div className="flex gap-4 items-start overflow-x-auto pb-4">
                          {statuses
                            .filter(status => !status.hidden)
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map((status, index) => {
                              const tasks = getTasksForSwimlaneAndColumn(swimlane, status.id);
                              return (
                    <StatusColumn
                      key={`${swimlane}-${status.id}`}
                      status={status}
                      tasks={tasks}
                      isDragging={isDragging}
                      isDropping={isDropping}
                      onTaskClick={handleTaskClick}
                      onCreateTask={(statusId) => setCreateTaskStatusId(statusId)}
                      onEditStatus={handleEditStatus}
                      onColumnRef={handleColumnRef}
                      dragOverStatusId={dragOverStatusId}
                      dragOverTaskId={dragOverTaskId}
                      dropPosition={dropPosition?.columnId === status.id ? dropPosition.index : null}
                      spaceTicker={spaceTicker}
                      activeTask={activeTask}
                      activeTaskColumnId={activeTaskColumnId}
                    />
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Regular Board View (no grouping)
              <div className="flex gap-4 overflow-x-auto overflow-y-auto p-6 min-h-[calc(100vh-180px)]">
          {statuses
            .filter(status => !status.hidden)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((status) => (
              <StatusColumn
                key={status.id}
                status={status}
                      tasks={filteredTasksForStatus(status.id)}
                isDragging={isDragging}
                      isDropping={isDropping}
                onTaskClick={handleTaskClick}
                onCreateTask={(statusId) => setCreateTaskStatusId(statusId)}
                onEditStatus={handleEditStatus}
                onColumnRef={handleColumnRef}
                dragOverStatusId={dragOverStatusId}
                dragOverTaskId={dragOverTaskId}
                dropPosition={dropPosition?.columnId === status.id ? dropPosition.index : null}
                spaceTicker={spaceTicker}
                      activeTask={activeTask}
                      activeTaskColumnId={activeTaskColumnId}
              />
            ))}
        </div>
            )}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <TaskCardOverlay task={activeTask} width={cardWidth} spaceTicker={spaceTicker} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Configuration Dialog */}
      <BoardConfiguration
        boardId={boardId}
        open={configOpen}
        onOpenChange={setConfigOpen}
        onStatusesUpdated={handleStatusesUpdated}
      />

      {/* Task Detail Dialog */}
      <Dialog open={selectedTaskId !== null} onOpenChange={(open) => {
        // Don't allow closing if AI menus are open
        if (!open && aiMenusOpen) {
          return;
        }
        if (!open) {
          setSelectedTaskId(null);
          setTaskDetail(null);
          setTemplateMetadata(null);
          setTemplateDefinition(null);
          setTemplateFieldsConfig([]);
          setTemplateFieldValues({});
          setEditFormData(null);
          setCalendarOpen(null);
          setAiMenusOpen(false);
          setAiTransitionSuggestion(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {loadingTaskDetail ? (
            <>
              <DialogHeader>
                <DialogTitle>Loading Task</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </>
          ) : taskDetail && editFormData ? (
            <>
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
              {taskDetail.space && selectedTaskId && (
                      <div className="mb-4">
                <TaskBreadcrumb
                  spaceName={taskDetail.space.name || 'Space'}
                  spaceSlug={spaceSlug}
                  taskKey={spaceTicker && taskDetail.number ? `${spaceTicker}-${taskDetail.number}` : selectedTaskId.slice(0, 8)}
                  taskId={selectedTaskId}
                        />
                      </div>
                    )}
                  </div>
                  {spaceTicker && taskDetail.number && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {`${spaceTicker}-${taskDetail.number}`}
                    </span>
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

                  {(taskDetail?.sprint || (taskDetail?.sprints && taskDetail.sprints.length > 0)) && (
                      <div className="space-y-2 md:col-span-2">
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

                    <div className="space-y-2 md:col-span-2">
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
                  <div className="task-description-editor">
                    <AITextEditor
                      value={editFormData.description || ''}
                      onChange={(value: string) => setEditFormData({ ...editFormData, description: value })}
                      placeholder="Add more details... Type / to activate AI"
                      rows={4}
                      onMenuStateChange={setAiMenusOpen}
                    />
                  </div>
                </div>
                )}
              </div>

              {workflowDetail && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Workflow</span>
                    </div>
                    {workflowLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{workflowDetail.name}</span>
                      <span className="text-xs text-muted-foreground">Version {workflowDetail.version}</span>
                      {workflowDetail.isDefault && (
                        <span className="text-xs rounded border px-2 py-0.5">Default</span>
                      )}
                    </div>
                    {workflowError && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {workflowError}
                      </div>
                    )}
                    {aiTransitionError && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {aiTransitionError}
                      </div>
                    )}
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Available Transitions</p>
                      {aiTransitionSuggestion && (
                        <div className="rounded-md border border-primary/40 bg-primary/5 p-3 space-y-2">
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span>AI Recommended Transition</span>
                            <span className="text-xs text-muted-foreground">
                              Confidence {(aiTransitionSuggestion.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="justify-start"
                            onClick={() =>
                              handlePerformTransition(
                                aiTransitionSuggestion.transitionId,
                                aiTransitionSuggestion.transitionKey,
                              )
                            }
                            disabled={workflowLoading || aiTransitionLoading}
                          >
                            {aiTransitionLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Apply recommended transition
                          </Button>
                          <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                            {aiTransitionSuggestion.rationale.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {workflowTransitions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No transitions available from the current status.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {workflowTransitions.map((transition) => {
                            const isSuggested = aiTransitionSuggestion?.transitionId === transition.id;
                            return (
                            <Button
                              key={transition.id}
                              variant={isSuggested ? 'default' : 'outline'}
                              size="sm"
                              className="justify-start"
                              onClick={() => handlePerformTransition(transition.id, transition.key)}
                              disabled={workflowLoading || aiTransitionLoading}
                            >
                              <div className="flex flex-col items-start">
                                <span>{transition.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {transition.fromKey} → {transition.toKey}
                                </span>
                              </div>
                            </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="mt-6">
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
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog for Specific Status */}
      <CreateTaskDialogUnified
        mode="board"
        spaceSlug={spaceSlug}
        statuses={statuses}
        onTaskCreated={(task) => {
          handleTaskCreated(task as Task);
          setCreateTaskStatusId(null);
        }}
        statusId={createTaskStatusId || undefined}
        open={createTaskStatusId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateTaskStatusId(null);
          }
        }}
      />
    </div>
  );
}

interface BacklogColumnProps {
  sprints: any[];
  selectedSprintId: string | null;
  setSelectedSprintId: (id: string | null) => void;
  boardId: string;
  tasks: Task[];
  fetchData: () => void;
}

function BacklogColumn({ sprints, selectedSprintId, setSelectedSprintId, boardId, tasks, fetchData }: BacklogColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'backlog',
  });

  return (
    <div ref={setNodeRef} className="space-y-3 flex-shrink-0 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Backlog</h3>
          <p className="text-xs text-muted-foreground">Unplanned items. Drag into a sprint or assign via action.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSprintId || ''} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} {s.state === 'ACTIVE' ? '(Active)' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const name = `Sprint ${sprints.length + 1}`;
                const res = await fetch(`/api/boards/${boardId}/sprints`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name }) });
                const data = await res.json();
                if (data.success) {
                  fetchData();
                }
              } catch {}
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Create Sprint
          </Button>
        </div>
      </div>
      <Card className={isOver ? 'bg-muted/20' : ''}>
        <CardContent className="p-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {tasks.filter((t) => !t.sprintId).map((t) => (
              <div key={t.id} className="flex items-center justify-between border rounded-md p-2">
                <div className="truncate pr-2 text-sm">{t.summary}</div>
                <Badge variant="outline" className="text-xs">{formatPriority(t.priority)}</Badge>
              </div>
            ))}
            {tasks.filter((t) => !t.sprintId).length === 0 && (
              <div className="text-sm text-muted-foreground">Backlog is empty</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatusColumnProps {
  status: Status;
  tasks: Task[];
  isDragging: boolean;
  isDropping?: boolean;
  onTaskClick?: (taskId: string, isTaskNumberClick?: boolean) => void;
  onCreateTask?: (statusId: string) => void;
  onEditStatus?: (status: Status) => void;
  onColumnRef?: (id: string, element: HTMLElement | null) => void;
  dragOverStatusId?: string | null;
  dragOverTaskId?: string | null;
  dropPosition?: number | null;
  spaceTicker?: string;
  activeTask?: Task | null;
  activeTaskColumnId?: string | null;
}

function StatusColumn({ status, tasks, isDragging, isDropping = false, onTaskClick, onCreateTask, onEditStatus, onColumnRef, dragOverStatusId, dragOverTaskId, dropPosition, spaceTicker, activeTask, activeTaskColumnId }: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: {
      type: 'status',
      statusId: status.id,
    },
  });

  useEffect(() => {
    return () => {
      if (onColumnRef) {
        onColumnRef(status.id, null);
      }
    };
  }, [status.id, onColumnRef]);

  const getColumnColor = (statusName: string) => {
    const name = statusName.toLowerCase();
    if (name.includes('new')) return '#7D8089';
    if (name.includes('backlog')) return '#F59E0B';
    if (name.includes('to do') || name.includes('todo')) return '#4353FF';
    if (name.includes('in progress') || name.includes('progress')) return '#8B5CF6';
    if (name.includes('review')) return '#10B981';
    return status.color || '#7D8089';
  };

  const columnColor = getColumnColor(status.name);
  
  // Show drop indicator when drag enters column boundary (using isOver from useDroppable)
  // Show visual feedback whenever dragging over the column
  // Prioritize isOver from useDroppable for immediate feedback when crossing column border
  // This works in both directions (left-to-right and right-to-left) because isOver detects
  // when the drag enters the column's bounding box from any direction
  const isDraggingFromDifferentColumn = activeTask && activeTaskColumnId && activeTaskColumnId !== status.id;
  // Use isOver first (immediate, works in both directions) and dragOverStatusId as fallback
  // isOver is the most reliable for border detection as it uses rectIntersection internally
  const isDragOverColumn = isOver || dragOverStatusId === status.id;
  const showColumnDropIndicator = isDragOverColumn && isDraggingFromDifferentColumn;
  // Show hover effect immediately when isOver is true (border crossed), or when dragOverStatusId matches
  // This ensures the effect shows as soon as the drag crosses the column border in any direction
  const showColumnHover = (isOver || dragOverStatusId === status.id) && activeTask;

  return (
    <div
      className="flex-shrink-0 w-80 group"
    >
    <div
      ref={(node) => {
          // Set both droppable ref and column ref on the same element
          // The custom collision detection will prioritize this column over tasks
        if (setNodeRef) setNodeRef(node);
          if (node && onColumnRef) {
            onColumnRef(status.id, node);
          }
        }}
        className={`flex flex-col bg-gradient-to-b from-[var(--card)] to-[var(--card)]/80 dark:from-[var(--card)] dark:to-[var(--background)] rounded-xl border backdrop-blur-sm h-full relative z-10 ${
          showColumnHover 
            ? `border-2 shadow-2xl transition-all duration-150` 
            : `border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-300`
        }`}
        style={showColumnHover ? {
          borderColor: columnColor,
          boxShadow: `0 0 20px ${columnColor}40, 0 8px 32px rgba(0,0,0,0.12)`,
          backgroundColor: `${columnColor}05`
        } : {}}
      >
        {/* Column Header with Gradient Bar */}
        <div className="relative">
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ 
              background: `linear-gradient(90deg, ${columnColor}, ${columnColor}80)`,
              boxShadow: `0 0 10px ${columnColor}40`
        }}
          />
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] mt-1">
            <div className="flex items-center gap-2.5">
        <div 
                className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ 
                  backgroundColor: columnColor,
                  boxShadow: `0 0 8px ${columnColor}80`
                }}
              />
              <span className="text-[var(--foreground)]">{status.name}</span>
              <span
                className="text-xs px-2 py-1 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: `${columnColor}15`,
                  color: columnColor,
                  border: `1px solid ${columnColor}30`
                }}
              >
                {tasks.length}
                {status.wipLimit && ` / ${status.wipLimit}`}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {onCreateTask && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[var(--muted)] rounded-lg transition-all hover:scale-110"
                  onClick={() => onCreateTask(status.id)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
              {onEditStatus && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[var(--muted)] rounded-lg transition-all hover:scale-110"
                  onClick={() => onEditStatus(status)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tasks Container */}
        <div 
          className="flex-1 p-3 space-y-3 min-h-[200px] relative z-20"
        >
          {/* Column Drop Indicator - appears immediately when crossing column border */}
          {showColumnDropIndicator && (
            <div className="absolute inset-0 rounded-xl pointer-events-none z-10 animate-in fade-in duration-150">
              <div
                className="absolute inset-0 rounded-xl border-2 border-dashed"
                style={{
                  borderColor: columnColor,
                  backgroundColor: `${columnColor}10`,
                  animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
            </div>
          )}
          
          {/* Empty space droppable indicator - helps with detection when column is empty or dragging over empty area */}
          {isDragging && tasks.length === 0 && (
            <div className="absolute inset-0 pointer-events-none" />
          )}
          
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.length > 0 ? (
              tasks.map((task, taskIndex) => {
                // Calculate drop position indicators based on design pattern
                // Show ghost placeholder when dragging from different column and hovering over this position
                // dropPosition is the index where the task should be inserted (passed from parent)
                const isDropPositionTop = dropPosition !== null && dropPosition === taskIndex;
                const isDropPositionBottom = dropPosition !== null && dropPosition === taskIndex + 1;
                
                // Show ghost placeholder when dragging from different column
                const showGhostPlaceholderTop = activeTask && activeTask.id !== task.id && 
                  isDraggingFromDifferentColumn && 
                  dragOverStatusId === status.id && 
                  isDropPositionTop;
                const showGhostPlaceholderBottom = activeTask && activeTask.id !== task.id && 
                  isDraggingFromDifferentColumn && 
                  dragOverStatusId === status.id && 
                  isDropPositionBottom;
                
                // Show drop indicator line when hovering (but not showing ghost placeholder)
                const showDropIndicatorTop = isDropPositionTop && !showGhostPlaceholderTop;
                const showDropIndicatorBottom = isDropPositionBottom && !showGhostPlaceholderBottom;

                return (
                <Fragment key={`task-wrapper-${task.id}`}>
                    {/* Ghost Placeholder - Top (matches design pattern) */}
                    {showGhostPlaceholderTop && activeTask && (
                      <div
                        className="mb-3 opacity-40 scale-[0.98] pointer-events-none"
                        style={{
                          animation: 'fadeIn 0.2s ease-out',
                          filter: 'blur(0.5px) grayscale(0.3)'
                        }}
                      >
                        <div
                          className="border-2 border-dashed rounded-xl overflow-hidden relative"
                          style={{
                            borderColor: columnColor,
                            backgroundColor: `${columnColor}15`
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 z-10" />
                          <TaskCard
                            task={activeTask}
                            isDragging={false}
                            onTaskClick={undefined}
                            isDragOver={false}
                            showDropIndicatorAbove={false}
                            spaceTicker={spaceTicker}
                            columnColor={columnColor}
                            isGhost={true}
                          />
                        </div>
                      </div>
                    )}

                    {/* Drop Indicator - Top (matches design pattern) */}
                    {showDropIndicatorTop && (
                      <div
                        className="absolute -top-1 left-0 right-0 h-0.5 z-50 rounded-full pointer-events-none"
                        style={{
                          backgroundColor: columnColor,
                          boxShadow: `0 0 8px ${columnColor}`
                        }}
                      />
                    )}

                    <div
                      style={{
                        animation: `slideIn 0.3s ease-out ${taskIndex * 0.05}s both`
                      }}
                      className="relative"
                    >
                      {/* Placeholder border when task is being dragged */}
                      {activeTask?.id === task.id && (
                        <div className="absolute inset-0 border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--muted)]/20 pointer-events-none" />
                  )}
                  <TaskCard 
                    task={task} 
                        isDragging={isDragging || isDropping}
                    onTaskClick={onTaskClick}
                        isDragOver={dragOverStatusId === status.id && dragOverTaskId === task.id}
                        showDropIndicatorAbove={false}
                        spaceTicker={spaceTicker}
                        columnColor={columnColor}
                        isActiveDragging={activeTask?.id === task.id}
                        isDropping={isDropping && activeTask?.id === task.id}
                      />
                    </div>

                    {/* Ghost Placeholder - Bottom (matches design pattern) */}
                    {showGhostPlaceholderBottom && activeTask && (
                      <div
                        className="mt-3 opacity-40 scale-[0.98] pointer-events-none"
                        style={{
                          animation: 'fadeIn 0.2s ease-out',
                          filter: 'blur(0.5px) grayscale(0.3)'
                        }}
                      >
                        <div
                          className="border-2 border-dashed rounded-xl overflow-hidden relative"
                          style={{
                            borderColor: columnColor,
                            backgroundColor: `${columnColor}15`
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 z-10" />
                          <TaskCard
                            task={activeTask}
                            isDragging={false}
                            onTaskClick={undefined}
                    isDragOver={false}
                    showDropIndicatorAbove={false}
                    spaceTicker={spaceTicker}
                            columnColor={columnColor}
                            isGhost={true}
                          />
                        </div>
                      </div>
                    )}

                    {/* Drop Indicator - Bottom (matches design pattern) */}
                    {showDropIndicatorBottom && (
                      <div
                        className="absolute -bottom-1 left-0 right-0 h-0.5 z-50 rounded-full pointer-events-none"
                style={{ 
                          backgroundColor: columnColor,
                          boxShadow: `0 0 8px ${columnColor}`
                        }}
                      />
                    )}
                  </Fragment>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-[var(--muted-foreground)] rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/30 transition-all duration-300 cursor-pointer group/empty min-h-[200px]">
                <div
                  className="w-16 h-16 mb-3 rounded-full flex items-center justify-center transition-all duration-300 group-hover/empty:scale-110"
                  style={{
                    backgroundColor: `${columnColor}10`,
                    border: `2px dashed ${columnColor}30`
                  }}
                >
                  <Plus className="w-8 h-8 opacity-30 group-hover/empty:opacity-60 transition-opacity" />
                </div>
                <p className="text-sm">Drop tasks here</p>
                <p className="text-xs mt-1 opacity-60">or click to add</p>
              </div>
            )}
          </SortableContext>
          </div>

        {/* Add Task Button at Bottom */}
        <div className="p-3 pt-0 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 hover:bg-[var(--muted)] rounded-lg transition-all duration-200 opacity-60 hover:opacity-100"
            style={{
              borderTop: `1px solid ${columnColor}10`
            }}
            onClick={() => onCreateTask?.(status.id)}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Task</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

const getTaskPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'HIGHEST':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'LOWEST':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const allowedDescriptionTags = new Set([
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'BR',
  'UL',
  'OL',
  'LI',
  'P',
  'SPAN',
  'CODE',
  'PRE',
  'BLOCKQUOTE',
  'H1',
  'H2',
  'H3',
  'H4',
  'A',
  'LABEL',
  'INPUT',
  'DIV',
]);

const allowedDescriptionAttributes: Record<string, Set<string>> = {
  A: new Set(['href', 'title', 'target', 'rel']),
  UL: new Set(['data-type', 'class']),
  LI: new Set(['data-type', 'data-checked', 'class']),
  LABEL: new Set(['class', 'contenteditable']),
  INPUT: new Set(['type', 'checked', 'disabled', 'contenteditable']),
  SPAN: new Set(['class', 'style']),
  P: new Set(['class']),
  DIV: new Set(['class']),
};

const globalAllowedAttributes = new Set<string>(['data-type', 'data-checked', 'class']);

const sanitizeDescriptionHtml = (html: string | null | undefined): string => {
  if (!html) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const sanitizeNode = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (!allowedDescriptionTags.has(el.tagName)) {
          sanitizeNode(el);
          const fragment = document.createDocumentFragment();
          while (el.firstChild) {
            fragment.appendChild(el.firstChild);
          }
          el.replaceWith(fragment);
          return;
        }

        const allowedAttrs =
          allowedDescriptionAttributes[el.tagName] || globalAllowedAttributes;

        Array.from(el.attributes).forEach((attr) => {
          const attrName = attr.name.toLowerCase();
          // Allow data-* attributes for TipTap task lists
          if (attrName.startsWith('data-') || allowedAttrs.has(attrName) || globalAllowedAttributes.has(attrName)) {
            // Keep the attribute
          } else {
            el.removeAttribute(attr.name);
          }
        });

        if (el.tagName === 'A') {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noreferrer noopener');
        }

        // Handle task list checkboxes - ensure they're disabled and non-interactive
        if (el.tagName === 'INPUT' && el.getAttribute('type') === 'checkbox') {
          el.setAttribute('disabled', 'true');
          el.setAttribute('readonly', 'true');
        }

        sanitizeNode(el);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      }
    });
  };

  sanitizeNode(doc.body);
  return doc.body.innerHTML.trim();
};

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  onTaskClick?: (taskId: string, isTaskNumberClick?: boolean) => void;
  isDragOver?: boolean;
  showDropIndicatorAbove?: boolean;
  spaceTicker?: string;
  columnColor?: string;
  isActiveDragging?: boolean;
  isGhost?: boolean;
  isDropping?: boolean;
}

function TaskCard({ task, isDragging, onTaskClick, isDragOver = false, showDropIndicatorAbove = false, spaceTicker, columnColor = '#4353FF', isActiveDragging = false, isGhost = false, isDropping = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isCardDragging } = useSortable({
    id: task.id,
    data: { 
      type: 'task',
      taskId: task.id,
      statusId: task.status.id,
    },
    disabled: isDragging,
    // Disable default layout animation when dropping to prevent reverse animation
    animateLayoutChanges: (args) => {
      const { isSorting, wasDragging } = args;
      if (isSorting || wasDragging) {
        return false;
      }
      return true;
    },
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('[data-task-number]')) {
      return;
    }
    if (!isCardDragging && !isDragging && onTaskClick) {
      e.stopPropagation();
      onTaskClick(task.id, false);
    }
  };

  const priorityConfig: Record<string, { color: string; label: string }> = {
    'HIGHEST': { color: '#EF4444', label: 'Urgent' },
    'HIGH': { color: '#FF9800', label: 'High' },
    'NORMAL': { color: '#F59E0B', label: 'Medium' },
    'LOW': { color: '#6B7280', label: 'Low' },
    'LOWEST': { color: '#6B7280', label: 'Low' },
  };

  const priority = priorityConfig[task.priority] || priorityConfig['NORMAL'];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  // Extract template metadata first to get cleaned description (removes **Field**: value formatting)
  const cleanedDescription = useMemo(() => {
    if (!task.description) return '';
    const { description: cleaned } = extractTemplateMetadata(task.description);
    return cleaned;
  }, [task.description]);
  const sanitizedDescription = useMemo(() => sanitizeDescriptionHtml(cleanedDescription), [cleanedDescription]);

  return (
    <>
      {showDropIndicatorAbove && <div className="h-0.5 bg-primary rounded-full my-1" />}
      <div
        ref={setNodeRef}
        data-task-id={task.id}
        className={`group/card relative bg-gradient-to-br from-[var(--background)] to-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:shadow-xl hover:border-[var(--primary)]/40 cursor-pointer overflow-hidden ${
          isActiveDragging ? 'opacity-40 cursor-grabbing scale-105' : ''
        } ${
          isCardDragging ? 'shadow-2xl scale-105' : ''
        } ${
          isDragOver ? 'ring-4 ring-primary ring-offset-2 shadow-xl bg-primary/10' : ''
        }`}
        style={{
          ...style,
          boxShadow: isActiveDragging ? '0 8px 24px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
          transform: isActiveDragging ? `${style.transform || ''} rotate(3deg) scale(1.05)` : style.transform,
          cursor: isActiveDragging ? 'grabbing' : 'grab',
          // Match design pattern: no transition when dragging or dropping
          // This prevents reverse animation when dropping - keep transitions disabled during drop
          transition: (isActiveDragging || isDragging || isDropping) ? 'none' : 'all 0.2s ease',
          opacity: isActiveDragging ? 0.4 : 1
        }}
        onClick={handleClick}
        {...(!isCardDragging ? attributes : {})}
        {...(!isCardDragging ? listeners : {})}
      >
        {/* Accent Border on Left */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover/card:w-1.5"
          style={{
            background: `linear-gradient(180deg, ${columnColor}, ${columnColor}60)`,
          }}
        />

        {/* Drag Handle - appears on hover */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/card:opacity-30 transition-opacity cursor-grab active:cursor-grabbing z-10">
          <GripVertical className="w-4 h-4 text-[var(--muted-foreground)]" />
        </div>

        <div className="space-y-3 pl-2">
          {/* Header: ID, Checkbox, Priority */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Checkbox className="shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
              {spaceTicker && task.number && (
                    <span
                  data-task-number
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTaskClick) {
                      onTaskClick(task.id, true);
                    }
                  }}
                      className="text-xs px-2 py-0.5 rounded-md transition-all cursor-pointer hover:underline"
                      style={{
                        backgroundColor: `${columnColor}15`,
                        color: columnColor,
                        fontFamily: 'monospace'
                      }}
                >
                  {spaceTicker}-{task.number}
                    </span>
                  )}
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs transition-all"
                    style={{
                      backgroundColor: `${priority.color}15`,
                      color: priority.color
                    }}
                  >
                    <Flag
                      className="w-3 h-3"
                      fill={priority.color}
                    />
                    <span>{priority.label}</span>
                </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-1.5">
            <h4 className="text-[var(--foreground)] leading-snug group-hover/card:text-[var(--primary)] transition-colors">
              {task.summary}
            </h4>
            {sanitizedDescription && (
              <div
                className="text-sm text-[var(--muted-foreground)] line-clamp-3 prose prose-sm max-w-none 
                  prose-p:my-1 prose-p:text-sm prose-p:text-[var(--muted-foreground)]
                  prose-ul:my-1 prose-ul:pl-4 prose-ul:list-disc
                  prose-ol:my-1 prose-ol:pl-4 prose-ol:list-decimal
                  prose-li:my-0 prose-li:text-sm prose-li:text-[var(--muted-foreground)]
                  prose-strong:font-semibold prose-strong:text-[var(--foreground)]
                  prose-code:text-xs prose-code:bg-[var(--muted)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-a:text-[var(--primary)] prose-a:underline hover:prose-a:no-underline
                  prose-blockquote:border-l-2 prose-blockquote:border-[var(--border)] prose-blockquote:pl-3 prose-blockquote:my-1
                  [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']]:space-y-1
                  [&_li[data-type='taskItem']]:flex [&_li[data-type='taskItem']]:items-start [&_li[data-type='taskItem']]:gap-2 [&_li[data-type='taskItem']]:list-none
                  [&_li[data-type='taskItem']_label]:flex [&_li[data-type='taskItem']_label]:items-start [&_li[data-type='taskItem']_label]:gap-2 [&_li[data-type='taskItem']_label]:cursor-default
                  [&_li[data-type='taskItem']_input[type='checkbox']]:mt-0.5 [&_li[data-type='taskItem']_input[type='checkbox']]:shrink-0 [&_li[data-type='taskItem']_input[type='checkbox']]:cursor-default
                  [&_li[data-type='taskItem']_input[type='checkbox']:checked+*]:line-through [&_li[data-type='taskItem']_input[type='checkbox']:checked+*]:opacity-60"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            )}
            </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {task.tags.slice(0, 3).map((tag: string, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="px-2.5 py-0.5 text-xs rounded-full hover:scale-105 transition-transform"
                >
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">+{task.tags.length - 3}</Badge>
              )}
          </div>
          )}

          {/* Footer: Date and Assignee */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]/50">
            {task.dueDate ? (
              <div
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all ${
                  isOverdue
                    ? 'bg-red-500/10 text-red-500'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{formatDateDDMMYYYY(task.dueDate)}</span>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            <div className="flex items-center gap-2">
              {task.assignee && (
                <Avatar className="h-7 w-7 border-2 border-[var(--background)] shadow-sm hover:scale-110 transition-transform">
                  <div
                    className="w-full h-full flex items-center justify-center text-xs text-white"
                    style={{ 
                      background: `linear-gradient(135deg, ${columnColor}, ${columnColor}cc)`
                    }}
                  >
                    {task.assignee.name ? task.assignee.name.charAt(0).toUpperCase() : task.assignee.email.charAt(0).toUpperCase()}
              </div>
                </Avatar>
            )}
          </div>
        </div>
        </div>

        {/* Hover Glow Effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle at top left, ${columnColor}08, transparent 70%)`
          }}
        />

        {/* Placeholder when dragging */}
        {isActiveDragging && (
          <div className="absolute inset-0 border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--muted)]/20 pointer-events-none" />
        )}
      </div>
    </>
  );
}

interface TaskCardOverlayProps {
  task: Task;
  width: number;
  spaceTicker?: string;
}

function TaskCardOverlay({ task, width, spaceTicker }: TaskCardOverlayProps) {
  const getColumnColor = (statusName: string) => {
    const name = statusName.toLowerCase();
    if (name.includes('new')) return '#7D8089';
    if (name.includes('backlog')) return '#F59E0B';
    if (name.includes('to do') || name.includes('todo')) return '#4353FF';
    if (name.includes('in progress') || name.includes('progress')) return '#8B5CF6';
    if (name.includes('review')) return '#10B981';
    return task.status?.color || '#7D8089';
  };

  const columnColor = getColumnColor(task.status?.name || '');

  return (
    <div
      className="cursor-grabbing bg-gradient-to-br from-[var(--background)] to-[var(--card)] border-2 rounded-xl shadow-2xl opacity-95 rotate-3 scale-105"
      style={{
        width: `${width}px`,
        maxWidth: `${width}px`,
        minWidth: `${width}px`,
        borderColor: columnColor,
        boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2), 0 0 20px ${columnColor}40`,
      }}
    >
      <div className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {spaceTicker && task.number && (
                <div className="text-xs font-bold text-foreground mb-0.5" title={`Task Key: ${spaceTicker}-${task.number}`}>
                  {spaceTicker}-{task.number}
                </div>
              )}
              <h4 className="font-medium text-sm line-clamp-2">{task.summary}</h4>
            </div>
            <Badge variant="outline" className={`text-xs border ${getTaskPriorityClasses(task.priority)}`}>
                  {formatPriority(task.priority)}
                </Badge>
          </div>

          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3" />
              <span>{formatDateDDMMYYYY(task.dueDate)}</span>
            </div>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-wide">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
              </div>
            </div>
        </div>
  );
}

type WorkflowStatusDetail = WorkflowDetail['statuses'][number];

function mapWorkflowStatus(status: WorkflowStatusDetail | null | undefined): Task['workflowStatus'] {
  if (!status) {
    return null;
  }

  return {
    id: status.id,
    key: status.key,
    name: status.name,
    category: status.category,
    color: status.color ?? null,
    statusRefId: status.statusRefId ?? null,
  };
}