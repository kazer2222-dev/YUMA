'use client';

import { useState, useEffect, useRef, useMemo, Suspense, lazy, useCallback, type ComponentType } from 'react';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  ArrowLeft,
  Settings,
  BarChart3,
  Calendar,
  CheckSquare,
  TrendingUp,
  Zap,
  LayoutGrid,
  ChevronDown,
  Plus,
  List,
  PackageOpen,
  X,
  GripVertical,
  FileText,
} from 'lucide-react';
import { ClickUpAppShell } from '@/components/layout/clickup-app-shell';
import { Loading, Skeleton, CardSkeleton, TableSkeleton } from '@/components/loading';
import { CreateBoardDialog } from '@/components/board/create-board-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser, useSpaces, useSpace, useBoards, useRefreshSpaces, useRefreshSpace } from '@/lib/hooks/use-spaces';
import { TemplatesManager } from '@/components/templates/templates-manager';
import { WorkflowsManager } from '@/components/workflows/workflows-manager';
import { useQueryClient } from '@tanstack/react-query';
import { SpaceOverviewContent } from '@/components/spaces/space-overview-content';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TabDefinition = {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  color?: string | null;
  deletable: boolean;
};

const SPACE_TABS: TabDefinition[] = [
  { id: 'overview', label: 'Overview', deletable: false },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, color: '#10B981', deletable: true },
  { id: 'board', label: 'Board', icon: LayoutGrid, color: '#3B82F6', deletable: false },
  { id: 'documents', label: 'Documents', icon: FileText, color: '#8B5CF6', deletable: true },
  { id: 'calendar', label: 'Calendar', icon: Calendar, color: '#F59E0B', deletable: true },
  { id: 'roadmap', label: 'Roadmap', icon: TrendingUp, color: '#EF4444', deletable: true },
  { id: 'reports', label: 'Reports', icon: BarChart3, color: '#F59E0B', deletable: true },
  { id: 'integrations', label: 'Integrations', icon: Zap, color: '#06B6D4', deletable: true },
  { id: 'backlog', label: 'Backlog', icon: List, color: '#8B5CF6', deletable: true },
  { id: 'sprints', label: 'Sprints', icon: Zap, color: '#84CC16', deletable: true },
  { id: 'releases', label: 'Releases', icon: PackageOpen, color: '#EC4899', deletable: true },
];

const INITIAL_VISIBLE_TAB_IDS: string[] = [
  'overview',
  'tasks',
  'board',
  'calendar',
  'roadmap',
  'reports',
];

interface SortableTabProps {
  tab: TabDefinition;
  isActive: boolean;
  onClick: () => void;
  onRemove?: () => void;
  onHover?: () => void;
  selectedBoardId?: string | null;
  boards?: Array<{ id: string; name: string; color?: string | null }>;
  onBoardSelect?: (boardId: string) => void;
}

function SortableTab({
  tab,
  isActive,
  onClick,
  onRemove,
  onHover,
  selectedBoardId,
  boards,
  onBoardSelect,
}: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const iconStyle = !isActive && tab.color ? { color: tab.color } : undefined;

  const content = (
    <div className={`flex items-center gap-2 whitespace-nowrap ${isDragging ? 'opacity-50' : ''}`}>
      <span
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="-ml-1"
      >
        <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </span>
      {tab.icon && (
        <tab.icon
          className={`w-4 h-4 ${isActive ? 'text-white' : ''}`}
        />
      )}
      {tab.label}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {tab.id === 'board' && boards && boards.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={onClick}
              onMouseEnter={onHover}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
              type="button"
            >
              {content}
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {boards.map((board) => (
              <DropdownMenuItem
                key={board.id}
                onClick={() => onBoardSelect?.(board.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <span>{board.name}</span>
                  {selectedBoardId === board.id && (
                    <CheckSquare className="w-3.5 h-3.5 ml-auto" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          onClick={onClick}
          onMouseEnter={onHover}
          className={`flex items-center gap-2 px-4 py-2 rounded transition-all whitespace-nowrap ${
            isActive
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
          type="button"
        >
          {content}
        </button>
      )}

      {tab.deletable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--destructive)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--destructive)]/80 z-10"
          type="button"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Lazy load all heavy tab components for better performance
const TasksTable = lazy(() => import('@/components/tasks/tasks-table').then(mod => ({ default: mod.TasksTable })));
const BoardView = lazy(() => import('@/components/board/board-view').then(mod => ({ default: mod.BoardView })));
const DocumentsPage = lazy(() => import('@/components/documents/documents-page').then(mod => ({ default: mod.DocumentsPage })));
const CalendarView = lazy(() => import('@/components/calendar/calendar-view').then(mod => ({ default: mod.CalendarView })));
const RoadmapView = lazy(() => import('@/components/roadmap/roadmap-view').then(mod => ({ default: mod.RoadmapView })));
const IntegrationsManager = lazy(() => import('@/components/integrations/integrations-manager').then(mod => ({ default: mod.IntegrationsManager })));
const ReportingDashboard = lazy(() => import('@/components/reports/reporting-dashboard').then(mod => ({ default: mod.ReportingDashboard })));
const BacklogView = lazy(() => import('@/components/scrum/backlog-view').then(mod => ({ default: mod.BacklogView })));
const SprintManagement = lazy(() => import('@/components/scrum/sprint-management').then(mod => ({ default: mod.SprintManagement })));
const ReleaseManagement = lazy(() => import('@/components/scrum/release-management').then(mod => ({ default: mod.ReleaseManagement })));

interface Space {
  id: string;
  name: string;
  description?: string;
  slug: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  taskCount: number;
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name?: string;
      email: string;
      avatar?: string;
    };
  }>;
  statuses: Array<{
    id: string;
    name: string;
    key: string;
    color?: string;
    order: number;
    isStart: boolean;
    isDone: boolean;
  }>;
  customFields: Array<{
    id: string;
    name: string;
    key: string;
    type: string;
    required: boolean;
    order: number;
  }>;
  settings: {
    id: string;
    allowCustomFields: boolean;
    allowIntegrations: boolean;
    aiAutomationsEnabled: boolean;
  };
}

export default function SpacePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const spaceSlug = params.slug as string;
  const queryClient = useQueryClient();
  
  // React Query hooks for data fetching
  const { data: user, isLoading: userLoading } = useUser();
  const { data: spaces = [] } = useSpaces();
  const { data: space, isLoading: spaceLoading, error: spaceError } = useSpace(spaceSlug, !!spaceSlug);
  const { data: boards = [] } = useBoards(spaceSlug, !!spaceSlug);
  const refreshSpaces = useRefreshSpaces();
  const refreshSpace = useRefreshSpace(spaceSlug);
  
  const viewParam = searchParams?.get('view');
  const validView = viewParam && SPACE_TABS.some((tab) => tab.id === viewParam) ? viewParam : null;

  // Load saved view state from localStorage on initial mount
  const loadSavedViewState = () => {
    if (typeof window === 'undefined') {
      return {
        activeTab: validView ?? 'overview',
        visibleTabIds: [...INITIAL_VISIBLE_TAB_IDS],
      };
    }

    const savedActiveTab = localStorage.getItem(`activeTab_${spaceSlug}`);
    const savedVisibleTabs = localStorage.getItem(`visibleTabs_${spaceSlug}`);

    let activeTabValue = validView ?? savedActiveTab ?? 'overview';
    // Validate that the saved active tab is still valid
    if (!SPACE_TABS.some((tab) => tab.id === activeTabValue)) {
      activeTabValue = 'overview';
    }

    let visibleTabIdsValue: string[] = [];
    if (savedVisibleTabs) {
      try {
        const parsed = JSON.parse(savedVisibleTabs);
        // Validate that all saved tabs are still valid
        visibleTabIdsValue = parsed.filter((id: string) =>
          SPACE_TABS.some((tab) => tab.id === id)
        );
      } catch (e) {
        console.error('Failed to parse saved visible tabs:', e);
      }
    }

    // If no valid saved tabs or saved tabs are empty, use initial tabs
    if (visibleTabIdsValue.length === 0) {
      visibleTabIdsValue = [...INITIAL_VISIBLE_TAB_IDS];
    }

    // Ensure the active tab is in the visible tabs
    if (!visibleTabIdsValue.includes(activeTabValue)) {
      visibleTabIdsValue.push(activeTabValue);
    }

    // If validView from URL is not in visible tabs, add it
    if (validView && !visibleTabIdsValue.includes(validView)) {
      visibleTabIdsValue.push(validView);
    }

    return {
      activeTab: activeTabValue,
      visibleTabIds: visibleTabIdsValue,
    };
  };

  const savedState = loadSavedViewState();
  const [activeTab, setActiveTab] = useState<string>(savedState.activeTab);
  const [visibleTabIds, setVisibleTabIds] = useState<string[]>(savedState.visibleTabIds);
  const [tabLoading, setTabLoading] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [workflowsOpen, setWorkflowsOpen] = useState(false);
  const userInitiatedTabChange = useRef<string | null>(null);
  const loadedTabs = useRef<Set<string>>(new Set(['overview']));
  const prefetchCache = useRef<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      setVisibleTabIds((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) {
          return prev;
        }
        const newTabs = arrayMove(prev, oldIndex, newIndex);
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`visibleTabs_${spaceSlug}`, JSON.stringify(newTabs));
        }
        return newTabs;
      });
    },
    [spaceSlug],
  );

  const addTabToVisible = useCallback((tabId: string) => {
    setVisibleTabIds((prev) => {
      if (prev.includes(tabId)) {
        return prev;
      }
      const next = [...prev];
      const targetIndex = SPACE_TABS.findIndex((tab) => tab.id === tabId);
      let insertIndex = next.length;
      for (let i = 0; i < next.length; i += 1) {
        const currentIndex = SPACE_TABS.findIndex((tab) => tab.id === next[i]);
        if (currentIndex > targetIndex) {
          insertIndex = i;
          break;
        }
      }
      next.splice(insertIndex, 0, tabId);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`visibleTabs_${spaceSlug}`, JSON.stringify(next));
      }
      return next;
    });
  }, [spaceSlug]);

  const handleTabSwitch = useCallback(
    (tabName: string, boardId?: string | null) => {
      userInitiatedTabChange.current = tabName;
      addTabToVisible(tabName);
      if (activeTab === tabName && (!boardId || selectedBoardId === boardId)) {
        userInitiatedTabChange.current = null;
        return; // Already on this tab
      }
      setActiveTab(tabName);
      // Save active tab to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`activeTab_${spaceSlug}`, tabName);
      }
      const url = new URL(window.location.href);
      if (tabName === 'overview') {
        url.searchParams.delete('view');
        url.searchParams.delete('boardId');
      } else {
        url.searchParams.set('view', tabName);
        // For board-related tabs, always try to preserve boardId
        if (tabName === 'board' || tabName === 'sprints' || tabName === 'releases' || tabName === 'backlog') {
          // Priority: passed boardId > selectedBoardId > URL boardId > localStorage > first board
          let finalBoardId = boardId || selectedBoardId;
          if (!finalBoardId && typeof window !== 'undefined') {
            const urlBoardId = url.searchParams.get('boardId');
            if (urlBoardId && boards.some((b: any) => b.id === urlBoardId)) {
              finalBoardId = urlBoardId;
            } else {
              const lastBoardId = localStorage.getItem(`lastBoard_${spaceSlug}`);
              if (lastBoardId && boards.some((b: any) => b.id === lastBoardId)) {
                finalBoardId = lastBoardId;
              } else if (boards.length > 0) {
                finalBoardId = boards[0].id;
              }
            }
          }
          if (finalBoardId) {
            url.searchParams.set('boardId', finalBoardId);
            // Ensure state is synced
            if (finalBoardId !== selectedBoardId) {
              setSelectedBoardId(finalBoardId);
              if (typeof window !== 'undefined') {
                localStorage.setItem(`lastBoard_${spaceSlug}`, finalBoardId);
              }
            }
          } else {
            url.searchParams.delete('boardId');
          }
        } else {
          // For non-board tabs, only set boardId if explicitly provided
          if (boardId) {
            url.searchParams.set('boardId', boardId);
          } else if (selectedBoardId && (tabName === 'board')) {
            url.searchParams.set('boardId', selectedBoardId);
          } else {
            url.searchParams.delete('boardId');
          }
        }
      }
      router.replace(url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''));
      setTimeout(() => {
        userInitiatedTabChange.current = null;
      }, 100);
    },
    [activeTab, selectedBoardId, router, addTabToVisible, spaceSlug, boards, setSelectedBoardId],
  );

  const selectBoard = useCallback(
    (boardId: string | null) => {
      setSelectedBoardId(boardId);
      if (typeof window !== 'undefined') {
        if (boardId) {
          localStorage.setItem(`lastBoard_${spaceSlug}`, boardId);
        } else {
          localStorage.removeItem(`lastBoard_${spaceSlug}`);
        }
      }
    },
    [spaceSlug],
  );

  const handleBoardSelectFromDropdown = useCallback(
    (boardId: string) => {
      selectBoard(boardId);
      handleTabSwitch('board', boardId);
    },
    [selectBoard, handleTabSwitch],
  );

  const handleTabClick = useCallback(
    (tab: TabDefinition) => {
      if (tab.id === 'board' || tab.id === 'sprints' || tab.id === 'releases' || tab.id === 'backlog') {
        let nextBoardId = selectedBoardId;
        
        // First, try to get boardId from URL if not in state
        if (!nextBoardId && typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const urlBoardId = urlParams.get('boardId');
          if (urlBoardId && boards.some((b: any) => b.id === urlBoardId)) {
            nextBoardId = urlBoardId;
          }
        }
        
        // Fallback to localStorage or first board
        if (!nextBoardId && boards.length > 0) {
          const lastBoardId =
            typeof window !== 'undefined'
              ? localStorage.getItem(`lastBoard_${spaceSlug}`)
              : null;
          if (lastBoardId && boards.some((b: any) => b.id === lastBoardId)) {
            nextBoardId = lastBoardId;
          } else {
            nextBoardId = boards[0].id;
          }
        }

        if (nextBoardId) {
          if (nextBoardId !== selectedBoardId) {
            selectBoard(nextBoardId);
          }
          handleTabSwitch(tab.id, nextBoardId);
        } else {
          handleTabSwitch(tab.id);
        }
      } else {
        handleTabSwitch(tab.id);
      }
    },
    [boards, selectedBoardId, spaceSlug, handleTabSwitch, selectBoard],
  );

  const loading = userLoading || spaceLoading;
  const error = spaceError ? 'Failed to fetch space' : '';

  const selectedBoard = useMemo(
    () => boards.find((b: any) => b.id === selectedBoardId),
    [boards, selectedBoardId],
  );

  const visibleTabs = useMemo(() => {
    return visibleTabIds
      .map((id) => SPACE_TABS.find((tab) => tab.id === id))
      .filter((tab): tab is TabDefinition => Boolean(tab));
  }, [visibleTabIds]);

  const deletedTabs = useMemo(
    () => SPACE_TABS.filter((tab) => !visibleTabIds.includes(tab.id)),
    [visibleTabIds],
  );

  const handleAddTab = useCallback(
    (tabId: string) => {
      addTabToVisible(tabId);
      handleTabSwitch(tabId);
    },
    [addTabToVisible, handleTabSwitch],
  );

  const handleRemoveTab = useCallback(
    (tabId: string) => {
      setVisibleTabIds((prev) => {
        const newTabs = prev.filter((id) => id !== tabId);
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`visibleTabs_${spaceSlug}`, JSON.stringify(newTabs));
        }
        return newTabs;
      });
      if (activeTab === tabId) {
        handleTabSwitch('overview');
      }
    },
    [activeTab, handleTabSwitch, spaceSlug],
  );
  
  // Optimized: Combined board type detection with request deduplication
  const boardCheckRef = useRef<{ boardId: string; promise: Promise<void> } | null>(null);
  
  useEffect(() => {
    if (!spaceSlug || !selectedBoardId) {
      boardCheckRef.current = null;
      return;
    }

    // Request deduplication: if same board is already being checked, skip
    if (boardCheckRef.current?.boardId === selectedBoardId) {
      return;
    }

    // Cancel previous check if board changed
    boardCheckRef.current = null;

    // Parallel fetch for board and statuses
    const checkPromise = Promise.all([
      fetch(`/api/spaces/${spaceSlug}/boards/${selectedBoardId}`, { credentials: 'include' }).then(res => res.json()),
      fetch(`/api/spaces/${spaceSlug}/statuses`, { credentials: 'include' }).then(res => res.json())
    ]).then(([boardData, statusData]) => {
      // Only process if boardId hasn't changed
      if (boardCheckRef.current?.boardId !== selectedBoardId) {
        return;
      }

      // Check board type
      if (boardData.success && boardData.board) {
        const boardType = boardData.board.type || null;
        const boardName = boardData.board.name || '';
        
        // If board name suggests SCRUM but type is missing, try to fix it
        if ((boardName.toLowerCase().includes('scrum') || boardName.toLowerCase().includes('sprint')) && !boardType) {
          fetch(`/api/spaces/${spaceSlug}/fix-scrum-board`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ boardId: selectedBoardId }),
          })
          .then(res => res.json())
          .then(fixData => {
            if (fixData.success) {
              // This state is no longer needed, but keeping it for now
            }
          })
          .catch(console.error);
        }
      }

      // Check backlog status
      if (statusData.success && statusData.statuses) {
        const backlogExists = statusData.statuses.some((s: any) => s.key === 'backlog');
        // This state is no longer needed, but keeping it for now
      }
    }).catch((err) => {
      console.error('[Scrum Detection] Failed to fetch board/statuses:', err);
      // This state is no longer needed, but keeping it for now
    });

    boardCheckRef.current = { boardId: selectedBoardId, promise: checkPromise };
  }, [spaceSlug, selectedBoardId]);
  
  // Optimized URL reading - consolidated and simplified
  const validTabs = useMemo(() => new Set(SPACE_TABS.map((tab) => tab.id)), []);
  
  useEffect(() => {
    if (!pathname || !params.slug || typeof window === 'undefined') return;
    
    // Skip if user just initiated a tab change
    if (userInitiatedTabChange.current && userInitiatedTabChange.current === activeTab) {
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlView = urlParams.get('view');
    const urlBoardId = urlParams.get('boardId');
    const createBoard = urlParams.get('createBoard');
    
    // Handle createBoard param
    if (createBoard === 'true') {
      setCreateBoardOpen(true);
      urlParams.delete('createBoard');
      window.history.replaceState({}, '', window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : ''));
    }
    
    // Skip if already on correct tab and no board change needed
    if (urlView && validTabs.has(urlView)) {
      if (activeTab !== urlView) {
        setActiveTab(urlView);
        // Save active tab to localStorage when changed from URL
        if (typeof window !== 'undefined') {
          localStorage.setItem(`activeTab_${spaceSlug}`, urlView);
        }
      }
      if ((urlView === 'board' || urlView === 'sprints' || urlView === 'releases' || urlView === 'backlog') && urlBoardId && selectedBoardId !== urlBoardId) {
        selectBoard(urlBoardId);
      } else if ((urlView === 'board' || urlView === 'sprints' || urlView === 'releases' || urlView === 'backlog') && !urlBoardId && !selectedBoardId && boards.length > 0) {
        // Auto-select board if not selected
        const lastBoardId = typeof window !== 'undefined' ? localStorage.getItem(`lastBoard_${spaceSlug}`) : null;
        const nextBoardId = (lastBoardId && boards.some((b: any) => b.id === lastBoardId)) ? lastBoardId : boards[0].id;
        if (nextBoardId) {
          selectBoard(nextBoardId);
        }
      }
      return;
    }
    
    // Extract boardId from pathname if present
    const pathParts = pathname.split('/').filter(Boolean);
    const boardsIdx = pathParts.indexOf('boards');
    const derivedBoardId = boardsIdx !== -1 && pathParts[boardsIdx + 1] ? pathParts[boardsIdx + 1] : urlBoardId;
    
    if (derivedBoardId) {
      if (selectedBoardId !== derivedBoardId) {
        selectBoard(derivedBoardId);
      }
      if (activeTab !== 'board') {
        setActiveTab('board');
        // Save active tab to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`activeTab_${spaceSlug}`, 'board');
        }
      }
    } else if (!urlView && activeTab !== 'overview' && activeTab !== 'tasks' && activeTab !== 'roadmap' && activeTab !== 'integrations' && activeTab !== 'reports' && activeTab !== 'board') {
      // Default to board on initial load if no tab is set
      setActiveTab('board');
      // Save active tab to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`activeTab_${spaceSlug}`, 'board');
      }
    }
  }, [searchParams, pathname, params.slug, activeTab, selectedBoardId, validTabs, selectBoard]);

  useEffect(() => {
    if (activeTab !== 'board' || !selectedBoardId) {
      return;
    }

    queryClient.invalidateQueries({
      queryKey: ['board-data', selectedBoardId, params.slug],
    }).catch(() => {
      /* noop */
    });
  }, [activeTab, selectedBoardId, params.slug, queryClient]);

  // Optimized: Sync URL when selectedBoardId changes (only if on board-related tabs)
  useEffect(() => {
    if (!selectedBoardId || typeof window === 'undefined') return;
    
    const current = new URL(window.location.href);
    const urlView = current.searchParams.get('view');
    const urlBoardId = current.searchParams.get('boardId');
    
    // Only update URL if on board-related tabs or no view specified
    if ((!urlView || urlView === 'board' || urlView === 'sprints' || urlView === 'releases' || urlView === 'backlog') && urlBoardId !== selectedBoardId) {
      current.searchParams.set('boardId', selectedBoardId);
      if (!urlView) current.searchParams.set('view', 'board');
      router.replace(current.pathname + '?' + current.searchParams.toString());
    }
    
    localStorage.setItem(`lastBoard_${params.slug}`, selectedBoardId);
  }, [selectedBoardId, params.slug, router]);

  // Removed redundant URL sync effect - user clicks handle URL updates directly

  // Optimized tab loading: mark as loaded immediately when component starts rendering
  useEffect(() => {
    if (loadedTabs.current.has(activeTab)) {
      setTabLoading(false);
    } else {
      // Mark tab as loaded immediately - components handle their own loading states
      loadedTabs.current.add(activeTab);
      setTabLoading(false);
    }
  }, [activeTab]);

  // Prefetch tab component on hover for faster switching
  const handleTabHover = useCallback((tabName: string) => {
    if (prefetchCache.current.has(tabName) || loadedTabs.current.has(tabName)) {
      return; // Already prefetched or loaded
    }

    // Prefetch adjacent tab components
    const tabComponents: Record<string, () => Promise<any>> = {
      tasks: () => import('@/components/tasks/tasks-table'),
      board: () => import('@/components/board/board-view'),
      calendar: () => import('@/components/calendar/calendar-view'),
      roadmap: () => import('@/components/roadmap/roadmap-view'),
      integrations: () => import('@/components/integrations/integrations-manager'),
      reports: () => import('@/components/reports/reporting-dashboard'),
      backlog: () => import('@/components/scrum/backlog-view'),
      sprints: () => import('@/components/scrum/sprint-management'),
      releases: () => import('@/components/scrum/release-management'),
    };

    const prefetchFn = tabComponents[tabName];
    if (prefetchFn) {
      prefetchCache.current.add(tabName);
      // Prefetch in background without blocking
      prefetchFn().catch(() => {
        prefetchCache.current.delete(tabName);
      });
    }
  }, []);

  // Redirect to auth if user is not authenticated
  useEffect(() => {
    if (!userLoading && !user && typeof window !== 'undefined') {
      router.push('/auth');
    }
  }, [user, userLoading, router]);

  // Optimized: Restore selected board when boards are loaded
  useEffect(() => {
    if (!boards || boards.length === 0 || selectedBoardId) return;
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlBoardId = urlParams.get('boardId');
    
    // Priority 1: Use boardId from URL
    if (urlBoardId && boards.some((b: any) => b.id === urlBoardId)) {
      selectBoard(urlBoardId);
      return;
    }
    
    // Priority 2: Restore from localStorage if on board tab
    const urlView = urlParams.get('view');
    if (activeTab === 'board' || !urlView || urlView === 'board') {
      const lastBoardId = localStorage.getItem(`lastBoard_${spaceSlug}`);
      if (lastBoardId && boards.some((b: any) => b.id === lastBoardId)) {
        selectBoard(lastBoardId);
        handleTabSwitch('board', lastBoardId);
        return;
      }
      
      // Priority 3: Auto-select first board
      if (boards.length > 0) {
        selectBoard(boards[0].id);
        handleTabSwitch('board', boards[0].id);
      }
    }
  }, [boards, spaceSlug, selectedBoardId, activeTab, handleTabSwitch, selectBoard]);

  const navigateFromOverview = useCallback(
    (tab: string, options?: { boardId?: string | null }) => {
      if (options?.boardId) {
        selectBoard(options.boardId);
      }
      addTabToVisible(tab);
      handleTabSwitch(tab, options?.boardId ?? null);
    },
    [addTabToVisible, handleTabSwitch, selectBoard],
  );

  const handleBoardCreated = async () => {
    // Invalidate and refetch boards and spaces using React Query
    refreshSpace();
    refreshSpaces();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleDeleteSpace = async () => {
    if (!space) return;
    
    if (!confirm(`Are you sure you want to delete "${space.name}"? This will delete all tasks, boards, and data in this space. This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/spaces/${params.slug}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Refresh spaces using React Query
        refreshSpaces();
        router.push('/dashboard');
      } else {
        alert(data.message || 'Failed to delete space');
      }
    } catch (error) {
      console.error('Error deleting space:', error);
      alert('Failed to delete space');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading space..." />
      </div>
    );
  }

  if (error && !space) {
    return (
      <ClickUpAppShell
        spaces={spaces}
        user={user}
        onLogout={handleLogout}
        onCreateSpace={() => {}}
        pageTitle="Space Error"
        breadcrumbs={[]}
      >
        <div className="p-8">
          <div className="space-y-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </ClickUpAppShell>
    );
  }

  if (!space) {
    return (
      <ClickUpAppShell
        spaces={spaces}
        user={user}
        onLogout={handleLogout}
        onCreateSpace={() => {}}
        pageTitle="Space Not Found"
        breadcrumbs={[]}
      >
        <div className="p-8">
          <div className="space-y-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Alert>
              <AlertDescription>Space not found</AlertDescription>
            </Alert>
          </div>
        </div>
      </ClickUpAppShell>
    );
  }

  return (
    <ClickUpAppShell
      spaces={spaces}
      user={user}
      onLogout={handleLogout}
      onCreateSpace={() => {}}
      pageTitle=""
      pageSubtitle=""
      breadcrumbs={[]}
      showSearch={true}
      onSearch={(q) => {
        // basic client-side search hook; extend later
        console.debug('Search:', q);
      }}
      onRefreshSpaces={refreshSpaces}
      actions={[]}
    >
      <div className="h-full flex flex-col">
        {/* Navigation Tabs - matches design folder */}
    <div className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-2 md:px-6">
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <Select value={activeTab} onValueChange={(value) => handleTabSwitch(value)}>
            <SelectTrigger className="w-[140px] border-[var(--border)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibleTabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  <div className="flex items-center gap-2">
                    {tab.icon && (
                      <tab.icon className="w-4 h-4" />
                    )}
                    <span>{tab.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(activeTab === 'board' || activeTab === 'sprints' || activeTab === 'releases' || activeTab === 'backlog') && boards.length > 0 && (
            <Select
              value={selectedBoardId ?? boards[0]?.id ?? undefined}
              onValueChange={handleBoardSelectFromDropdown}
            >
              <SelectTrigger className="flex-1 border-[var(--border)]">
                <SelectValue placeholder="Select board" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board: any) => (
                  <SelectItem key={board.id} value={board.id}>
                    <div className="flex items-center gap-2">
                      {board.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {activeTab === 'board' && (
            <Button size="sm" className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white flex-shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="hidden md:flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleTabs.map((tab) => tab.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex items-center gap-1">
                {visibleTabs.map((tab) => (
                  <SortableTab
                    key={tab.id}
                    tab={tab}
                    isActive={activeTab === tab.id}
                    onClick={() => handleTabClick(tab)}
                    onRemove={tab.deletable ? () => handleRemoveTab(tab.id) : undefined}
                    onHover={() => handleTabHover(tab.id)}
                    selectedBoardId={(tab.id === 'board' || tab.id === 'sprints' || tab.id === 'releases' || tab.id === 'backlog') ? selectedBoardId : undefined}
                    boards={(tab.id === 'board' || tab.id === 'sprints' || tab.id === 'releases' || tab.id === 'backlog') ? boards : undefined}
                    onBoardSelect={(tab.id === 'board' || tab.id === 'sprints' || tab.id === 'releases' || tab.id === 'backlog') ? handleBoardSelectFromDropdown : undefined}
                  />
                ))}

                {deletedTabs.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-9 px-3 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {deletedTabs.map((tab) => (
                        <DropdownMenuItem key={tab.id} onClick={() => handleAddTab(tab.id)} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            {tab.icon && (
                              <tab.icon className="h-4 w-4" />
                            )}
                            <span>{tab.label}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {activeTab === 'board' && (
          <Button
            className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('yuma:create-task'));
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>
    </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 p-8">
          {/* Show skeleton only if tab is loading AND not previously loaded */}
          {tabLoading && !loadedTabs.current.has(activeTab) ? (
            <div className="p-6 space-y-6">
              {activeTab === 'overview' && (
                <>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-4 rounded" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-8 w-16 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2].map((i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {[1, 2, 3].map((j) => (
                              <div key={j} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                  <Skeleton className="h-8 w-8 rounded-full" />
                                  <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                  </div>
                                </div>
                                <Skeleton className="h-6 w-16" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
              {activeTab === 'tasks' && (
                <TableSkeleton rows={8} />
              )}
              {activeTab === 'board' && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex-1">
                        <Skeleton className="h-8 w-24 mb-4" />
                        <div className="space-y-3">
                          {[1, 2, 3].map((j) => (
                            <Card key={j}>
                              <CardContent className="p-4">
                                <Skeleton className="h-4 w-20 mb-2" />
                                <Skeleton className="h-5 w-full mb-2" />
                                <Skeleton className="h-3 w-3/4" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'roadmap' && (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-[400px] w-full" />
                </div>
              )}
              {(activeTab === 'integrations' || activeTab === 'reports') && (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-48" />
                  {[1, 2, 3].map((i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
          {/* Only render active tab for better performance - lazy loading handles caching */}
          {activeTab === 'overview' && (
            <SpaceOverviewContent
              space={space}
              boards={boards}
              onOpenCreateBoard={() => setCreateBoardOpen(true)}
              onOpenTemplates={() => setTemplatesOpen(true)}
              onOpenWorkflows={() => setWorkflowsOpen(true)}
              onNavigateToTab={navigateFromOverview}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTable spaceSlug={space.slug} />
          )}

          {activeTab === 'board' && selectedBoardId && (
            <BoardView boardId={selectedBoardId} spaceSlug={params.slug as string} />
          )}
          {activeTab === 'board' && !selectedBoardId && boards.length === 0 && (
            <div className="p-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <LayoutGrid className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No boards available</h3>
                  <p className="text-muted-foreground mb-4">Create your first board to get started.</p>
                  <Button onClick={() => setCreateBoardOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Board
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'board' && !selectedBoardId && boards.length > 0 && !loading && (
            <div className="p-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <LayoutGrid className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a Board</h3>
                  <p className="text-muted-foreground mb-4">Choose a board from the sidebar or below to view it here.</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {boards.map((board: { id: string; name: string }) => (
                      <Button
                        key={board.id}
                        variant="outline"
                        onClick={() => {
                          selectBoard(board.id);
                          handleTabSwitch('board', board.id);
                        }}
                      >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        {board.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <Suspense fallback={
              <div className="space-y-4 p-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              </div>
            }>
              <DocumentsPage />
            </Suspense>
          )}

          {activeTab === 'calendar' && (
            <Suspense fallback={
              <div className="space-y-4 p-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            }>
              <CalendarView spaceSlug={space.slug} />
            </Suspense>
          )}

          {activeTab === 'roadmap' && (
            <Suspense fallback={
              <div className="space-y-4 p-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            }>
              <RoadmapView spaceSlug={space.slug} />
            </Suspense>
          )}


          {activeTab === 'integrations' && (
            <Suspense fallback={
              <div className="space-y-4 p-6">
                <Skeleton className="h-10 w-48" />
                {[1, 2, 3].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            }>
              <IntegrationsManager spaceSlug={space.slug} />
            </Suspense>
          )}

          {activeTab === 'reports' && (
            <Suspense fallback={
              <div className="space-y-4 p-6">
                <Skeleton className="h-10 w-48" />
                {[1, 2, 3].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            }>
              <ReportingDashboard spaceSlug={space.slug} />
            </Suspense>
          )}
          {/* Scrum Board Tabs Content */}
          {activeTab === 'backlog' && (
            <Suspense
              fallback={
                <div className="space-y-4 p-6">
                  <Skeleton className="h-10 w-48" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="mb-2 h-4 w-20" />
                          <Skeleton className="mb-2 h-5 w-full" />
                          <Skeleton className="h-3 w-3/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              }
            >
              <BacklogView spaceSlug={space.slug} boardId={selectedBoardId || undefined} />
            </Suspense>
          )}
          {activeTab === 'sprints' && (
            selectedBoardId ? (
              <Suspense
                fallback={
                  <div className="space-y-4 p-6">
                    <Skeleton className="h-10 w-48" />
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <Skeleton className="mb-2 h-6 w-32" />
                            <Skeleton className="h-4 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                }
              >
                <SprintManagement boardId={selectedBoardId} spaceSlug={space.slug} />
              </Suspense>
            ) : boards.length === 0 ? (
              <div className="p-6 text-sm text-[var(--muted-foreground)]">
                Create a board first to manage sprint planning.
              </div>
            ) : (
              <div className="p-6 text-sm text-[var(--muted-foreground)]">
                Select a board to manage sprint planning.
              </div>
            )
          )}
          {activeTab === 'releases' && (
            selectedBoardId ? (
              <Suspense
                fallback={
                  <div className="space-y-4 p-6">
                    <Skeleton className="h-10 w-48" />
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <Skeleton className="mb-2 h-6 w-32" />
                            <Skeleton className="h-4 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                }
              >
                <ReleaseManagement boardId={selectedBoardId} spaceSlug={space.slug} />
              </Suspense>
            ) : (
              <div className="p-6 text-sm text-[var(--muted-foreground)]">
                Select a board to review release timelines.
              </div>
            )
          )}
        </div>

        {/* Create Board Dialog */}
        {space && (
          <CreateBoardDialog
            spaceSlug={space.slug}
            open={createBoardOpen}
            onOpenChange={setCreateBoardOpen}
            onBoardCreated={handleBoardCreated}
          />
        )}

        {/* Templates Manager */}
        {space && (
          <TemplatesManager
            spaceSlug={space.slug}
            open={templatesOpen}
            onOpenChange={setTemplatesOpen}
          />
        )}

        {/* Workflows Manager */}
        {space && (
          <WorkflowsManager
            spaceId={space.id}
            spaceSlug={space.slug}
            open={workflowsOpen}
            onOpenChange={setWorkflowsOpen}
          />
        )}
      </div>
    </ClickUpAppShell>
  );
}