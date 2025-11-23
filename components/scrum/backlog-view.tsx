'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GripVertical, Plus, Filter, Search, User, MoreVertical, CheckCircle2, Calendar as CalendarIcon, Sparkles, PlayCircle } from 'lucide-react';
import Calendar from 'react-calendar';
import { Skeleton } from '@/components/loading';
import { CreateTaskDialogUnified } from '@/components/tasks/create-task-dialog-unified';
import { RoadmapTaskEditor } from '@/components/roadmap/roadmap-task-editor';
import { formatDateDDMMYYYY } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  rectIntersection,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  number: number;
  summary: string;
  description?: string;
  priority: string;
  storyPoints?: number;
  backlogOrder?: number | null;
  createdAt?: string;
  sprintId?: string;
  assignee?: {
    id: string;
    name?: string;
    email: string;
  };
  status: {
    id: string;
    name: string;
    key: string;
    isDone?: boolean;
    color?: string;
  };
  tags?: string[];
}

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  state: string; // PLANNED, ACTIVE, COMPLETED
  order: number;
  boardId?: string;
  tasks?: Task[];
}

interface BacklogViewProps {
  spaceSlug: string;
  boardId?: string;
}

const FALLBACK_STATUS_COLORS: Record<string, string> = {
  backlog: '#F59E0B',
  todo: '#F59E0B',
  'in progress': '#3B82F6',
  progress: '#3B82F6',
  review: '#8B5CF6',
  done: '#10B981',
  completed: '#10B981',
};

function hexToRgba(hex: string, alpha = 0.15) {
  if (!hex.startsWith('#')) {
    return hex;
  }
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return hex;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getStatusAccent(status?: { id: string; name: string; key: string; isDone?: boolean; color?: string }) {
  const normalized = (status?.key || status?.name || '').toLowerCase();
  const matchedKey = Object.keys(FALLBACK_STATUS_COLORS).find((key) =>
    normalized.includes(key)
  );
  const color = status?.color || (matchedKey ? FALLBACK_STATUS_COLORS[matchedKey] : '#94A3B8');
  return {
    color,
    borderColor: color,
    backgroundColor: hexToRgba(color, 0.12),
  };
}

type SprintAccentIcon = 'sparkles' | 'play' | 'check' | null;

interface SprintAccentMeta {
  gradient: string;
  glow: string;
  dotColor: string;
  ringColor: string;
  badgeClass: string;
  badgeLabel: string;
  icon: SprintAccentIcon;
  ping: boolean;
}

function getSprintAccent(state?: string): SprintAccentMeta {
  const normalized = state?.toUpperCase?.() || 'PLANNED';
  switch (normalized) {
    case 'ACTIVE':
      return {
        gradient: 'linear-gradient(90deg, #4353FF, #8B5CF6, #4353FF, #8B5CF6)',
        glow: '0 0 20px #4353FF60, 0 0 40px #4353FF30',
        dotColor: '#4353FF',
        ringColor: '#4353FF',
        badgeClass: 'bg-gradient-to-r from-[#4353FF] to-[#5B5FED] text-white border-0 shadow-lg text-xs px-2.5 py-0.5',
        badgeLabel: 'Active',
        icon: 'sparkles',
        ping: true,
      };
    case 'PLANNED':
      return {
        gradient: 'linear-gradient(90deg, #F97316, #FBBF24, #F97316, #FBBF24)',
        glow: '0 0 20px #F59E0B60, 0 0 40px #F59E0B30',
        dotColor: '#F59E0B',
        ringColor: '#F59E0B',
        badgeClass: 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white border-0 shadow-lg text-xs px-2.5 py-0.5',
        badgeLabel: 'Planned',
        icon: 'play',
        ping: false,
      };
    case 'COMPLETED':
    case 'CLOSED':
      return {
        gradient: 'linear-gradient(90deg, #10B981, #059669, #10B981)',
        glow: '0 0 20px #10B98160, 0 0 40px #10B98130',
        dotColor: '#10B981',
        ringColor: '#10B981',
        badgeClass: 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-0 shadow-lg text-xs px-2.5 py-0.5',
        badgeLabel: 'Completed',
        icon: 'check',
        ping: false,
      };
    default:
      return {
        gradient: 'linear-gradient(90deg, #94A3B8, #CBD5F5, #94A3B8)',
        glow: '0 0 20px #94A3B860, 0 0 40px #94A3B830',
        dotColor: '#94A3B8',
        ringColor: '#94A3B8',
        badgeClass: 'bg-muted text-muted-foreground border-0 text-xs px-2.5 py-0.5',
        badgeLabel: normalized.toLowerCase(),
        icon: null,
        ping: false,
      };
  }
}

export function BacklogView({ spaceSlug, boardId }: BacklogViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [editSprintOpen, setEditSprintOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [spaceName, setSpaceName] = useState<string>('');
  const [spaceTicker, setSpaceTicker] = useState<string>('');
  const [createTaskStatusId, setCreateTaskStatusId] = useState<string | null>(null);
  const [deleteSprintDialogOpen, setDeleteSprintDialogOpen] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState<string | null>(null);
  const [isDeletingSprint, setIsDeletingSprint] = useState(false);
  const [draggedFromSprint, setDraggedFromSprint] = useState<string | null>(null);
  const [isOverBacklog, setIsOverBacklog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [completeSprintDialogOpen, setCompleteSprintDialogOpen] = useState(false);
  const [sprintToComplete, setSprintToComplete] = useState<Sprint | null>(null);
  const [unfinishedTasksCount, setUnfinishedTasksCount] = useState(0);
  const [taskMovementChoice, setTaskMovementChoice] = useState<'next-sprint' | 'backlog'>('backlog');
  const [selectedTargetSprintId, setSelectedTargetSprintId] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchSpaceName();
    fetchStatuses();
    fetchUsers();
    fetchData(); // Fetch tasks immediately
  }, [spaceSlug]);

  // Cleanup: Remove any lingering AlertDialog overlays after deletion
  useEffect(() => {
    if (!isDeletingSprint && !deleteSprintDialogOpen) {
      // Small delay to ensure React has processed the unmount
      const timer = setTimeout(() => {
        console.log('[Cleanup] Checking for lingering overlays...');
        
        // Find and remove any lingering AlertDialog overlays (Radix UI uses data attributes)
        const overlays = document.querySelectorAll('[data-radix-portal], [data-radix-alert-dialog-overlay], [role="alertdialog"]');
        console.log('[Cleanup] Found overlays:', overlays.length);
        overlays.forEach(overlay => {
          const element = overlay as HTMLElement;
          const state = element.getAttribute('data-state');
          const isVisible = window.getComputedStyle(element).opacity !== '0' && 
                           window.getComputedStyle(element).pointerEvents !== 'none';
          
          // Remove if closed or if it's blocking interactions
          if (state === 'closed' || (!state && !isVisible)) {
            console.log('[Cleanup] Removing lingering AlertDialog overlay:', element);
            element.remove();
          }
        });
        
        // Also check for any fixed positioned elements with high z-index that might be blocking
        const allElements = Array.from(document.querySelectorAll('*')) as HTMLElement[];
        allElements.forEach(el => {
          const style = window.getComputedStyle(el);
          const zIndex = parseInt(style.zIndex || '0');
          const position = style.position;
          
          if (position === 'fixed' && zIndex >= 50) {
            const state = el.getAttribute('data-state');
            const opacity = parseFloat(style.opacity || '1');
            
            // If it's marked as closed or has very low opacity, it might be a lingering overlay
            if (state === 'closed' && opacity < 0.1) {
              console.log('[Cleanup] Found closed fixed element with high z-index, removing:', el);
              el.remove();
            }
          }
        });
        
        console.log('[Cleanup] Cleanup completed');
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isDeletingSprint, deleteSprintDialogOpen]);

  const fetchSpaceName = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}`, { credentials: 'include' });
      const data = await response.json();
      if (data.success && data.space) {
        setSpaceName(data.space.name || '');
        setSpaceTicker(data.space.ticker || '');
      }
    } catch (error) {
      console.error('Failed to fetch space name:', error);
    }
  };

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Fetch tasks and sprints in parallel
      const [tasksResponse, sprintsResponse] = await Promise.all([
        fetch(`/api/spaces/${spaceSlug}/tasks`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}/sprints`, { credentials: 'include' })
      ]);
      
      const tasksData = await tasksResponse.json();
      const sprintsData = await sprintsResponse.json();
      
      let allSprints: Sprint[] = [];
      if (sprintsData.success) {
        allSprints = sprintsData.sprints || [];
        // Filter out CLOSED/COMPLETED sprints for display - they should not be shown in the backlog view
        const visibleSprints = allSprints.filter((s: Sprint) => s.state !== 'CLOSED' && s.state !== 'COMPLETED');
        setSprints(visibleSprints);
      } else {
        setSprints([]);
      }
      
      if (tasksData.success) {
        const allTasks = tasksData.tasks || [];
        console.log('[Fetch Data] Total tasks fetched:', allTasks.length);
        if (allTasks.length > 0) {
          console.log('[Fetch Data] Sample task structure:', {
            id: allTasks[0].id,
            number: allTasks[0].number,
            summary: allTasks[0].summary,
            sprintId: allTasks[0].sprintId,
            status: allTasks[0].status,
            allKeys: Object.keys(allTasks[0])
          });
        }
        
        // Create a map of sprint IDs to their states for quick lookup
        const sprintStateMap = new Map<string, string>();
        allSprints.forEach((s: Sprint) => {
          sprintStateMap.set(s.id, s.state);
        });
        
        // Filter tasks:
        // 1. Exclude tasks that are in ACTIVE or PLANNED sprints (they'll be shown in sprint cards)
        //    BUT include tasks in CLOSED/COMPLETED sprints (they should appear in backlog)
        // 2. Exclude tasks in done status (check task.status.isDone)
        const availableTasks = allTasks.filter((task: any) => {
          console.log('[Fetch Data] Processing task:', {
            id: task.id,
            number: task.number,
            summary: task.summary,
            sprintId: task.sprintId,
            statusName: task.status?.name,
            statusKey: task.status?.key,
            statusIsDone: task.status?.isDone,
          });
          
          // Check if task is in a sprint - only exclude if sprint is ACTIVE or PLANNED
          // If task has no sprintId (null, undefined, or empty), it should be in backlog
          const taskSprintId = task.sprintId || null;
          if (taskSprintId) {
            const sprintState = sprintStateMap.get(taskSprintId);
            console.log('[Fetch Data] Task has sprintId:', taskSprintId, 'sprint state:', sprintState);
            if (sprintState === 'ACTIVE' || sprintState === 'PLANNED') {
              // Task is in visible sprint - exclude from backlog
              console.log('[Fetch Data] Filtering out task: in visible sprint', taskSprintId, 'state:', sprintState);
              return false;
            }
            // Task is in CLOSED/COMPLETED sprint or sprint not found - continue to check status
          } else {
            console.log('[Fetch Data] Task has no sprintId - will check status');
          }
          
          // Exclude tasks in done status
          // Check both status and workflowStatus objects
          const status = task.status || task.workflowStatus;
          
          // Only filter out if explicitly marked as done
          // Check isDone property first (most reliable)
          if (status?.isDone === true) {
            console.log('[Fetch Data] Filtering out done task (isDone=true):', task.id, task.summary, 'status:', status?.name);
            return false;
          }
          
          // Also check status key/name/category for "done" or "completed" (exact match only)
          const statusName = (status?.name || '').toLowerCase().trim();
          const statusKey = (status?.key || '').toLowerCase().trim();
          const statusCategory = (status?.category || '').toLowerCase().trim();
          
          // Only filter if status is exactly "done" or "completed" (not just containing the word)
          const isExplicitlyDone = statusKey === 'done' || 
                                   statusKey === 'completed' ||
                                   statusCategory === 'done' ||
                                   statusCategory === 'completed' ||
                                   statusName === 'done' || 
                                   statusName === 'completed';
          
          if (isExplicitlyDone) {
            console.log('[Fetch Data] Filtering out done task (status match):', task.id, task.summary, 'status:', status?.name, 'statusKey:', status?.key, 'category:', status?.category);
            return false;
          }
          
          console.log('[Fetch Data] Task passed filter - will show in backlog:', task.id, task.summary);
          return true;
        });
        console.log('[Fetch Data] Available tasks (not in active/planned sprint, not done):', availableTasks.length);
        
        // Sort by backlogOrder if available, otherwise by createdAt
        const sortedTasks = availableTasks.sort((a: any, b: any) => {
          if (a.backlogOrder !== null && b.backlogOrder !== null) {
            return a.backlogOrder - b.backlogOrder;
          }
          if (a.backlogOrder !== null) return -1;
          if (b.backlogOrder !== null) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        console.log('[Fetch Data] Setting tasks state, count:', sortedTasks.length);
        setTasks(sortedTasks.map((item: any) => ({
          ...item,
          tags: item.tags ? (typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags) : [],
        })));
        console.log('[Fetch Data] Tasks state updated');
      } else {
        console.error('[Fetch Data] ❌ Failed to fetch tasks:', tasksData.message);
        setTasks([]);
      }
    } catch (error) {
      console.error('[Fetch Data] ❌ Exception during fetch:', error);
      if (error instanceof Error) {
        console.error('[Fetch Data] Error details:', error.message, error.stack);
      }
      setTasks([]);
      setSprints([]);
    } finally {
      if (showLoading) {
        console.log('[Fetch Data] Setting loading state to false');
        setLoading(false);
      }
      console.log('[Fetch Data] Fetch completed');
    }
  }, [spaceSlug]);

  const fetchStatuses = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/statuses`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        const fetchedStatuses = data.statuses || [];
        setStatuses(fetchedStatuses);
        
        // Set default status for new tasks (backlog status or first status)
        if (!createTaskStatusId && fetchedStatuses.length > 0) {
          const backlogStatus = fetchedStatuses.find((s: any) => s.key === 'backlog');
          setCreateTaskStatusId(backlogStatus?.id || fetchedStatuses[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/members`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setUsers(data.members?.map((m: any) => m.user) || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateSprint = async (formData: any) => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setCreateSprintOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create sprint:', error);
    }
  };

  const handleEditSprint = async (formData: any) => {
    if (!editingSprint) return;
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/sprints/${editingSprint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setEditSprintOpen(false);
        setEditingSprint(null);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update sprint:', error);
    }
  };

  const handleDeleteSprint = (sprintId: string) => {
    console.log('[Handle Delete Sprint] Called with sprintId:', sprintId);
    
    // Check if sprint is active - prevent deletion
    const sprint = sprints.find(s => s.id === sprintId);
    if (sprint && sprint.state === 'ACTIVE') {
      alert('Cannot delete an active sprint. Please complete the sprint before deleting it.');
      return;
    }
    
    setSprintToDelete(sprintId);
    setDeleteSprintDialogOpen(true);
    console.log('[Handle Delete Sprint] Dialog should be open now');
  };

  const confirmDeleteSprint = async () => {
    console.log('[Delete Sprint] ====================');
    console.log('[Delete Sprint] Starting delete process');
    console.log('[Delete Sprint] boardId:', boardId);
    console.log('[Delete Sprint] sprintToDelete:', sprintToDelete);
    
    if (!sprintToDelete || isDeletingSprint) {
      console.log('[Delete Sprint] ❌ Early return - missing sprintToDelete, or already deleting');
      return;
    }
    
    const sprintIdToDelete = sprintToDelete;
    console.log('[Delete Sprint] Sprint ID to delete:', sprintIdToDelete);
    
    // Set deleting flag and close dialog
    setIsDeletingSprint(true);
    console.log('[Delete Sprint] Setting isDeletingSprint to true');
    
    // Close dialog and clear state
    console.log('[Delete Sprint] Closing dialog...');
    setDeleteSprintDialogOpen(false);
    setSprintToDelete(null);
    console.log('[Delete Sprint] Dialog closed, state cleared');
    
    // Immediate cleanup of overlays - don't wait for React
    setTimeout(() => {
      console.log('[Delete Sprint] Immediate overlay cleanup...');
      // Remove all fixed overlays with high z-index immediately
      const allFixed = Array.from(document.querySelectorAll('*')) as HTMLElement[];
      allFixed.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' && parseInt(style.zIndex || '0') >= 50) {
          const rect = el.getBoundingClientRect();
          const coversScreen = rect.width >= window.innerWidth * 0.8 && 
                               rect.height >= window.innerHeight * 0.8;
          const state = el.getAttribute('data-state');
          
          // If it's an overlay covering the screen and marked as closed, remove it immediately
          if (coversScreen && state === 'closed') {
            console.log('[Delete Sprint] Immediate removal of closed overlay:', el);
            el.style.pointerEvents = 'none';
            el.style.display = 'none';
            el.remove();
          }
        }
      });
      
      // Remove all Radix portals with alertdialog
      const portals = document.querySelectorAll('[data-radix-portal]');
      portals.forEach(portal => {
        if (portal.querySelector('[role="alertdialog"]')) {
          console.log('[Delete Sprint] Immediate removal of alertdialog portal:', portal);
          portal.remove();
        }
      });
      
      // Reset pointer events
      document.body.style.pointerEvents = '';
      document.documentElement.style.pointerEvents = '';
    }, 50);
    
    // Use requestAnimationFrame to ensure state updates are processed
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));
    console.log('[Delete Sprint] Animation frames completed, dialog should be unmounted');
    
    try {
      console.log('[Delete Sprint] Making API call...');
      // Find the boardId from the sprint
      const sprint = sprints.find(s => s.id === sprintIdToDelete);
      if (!sprint || !sprint.boardId) {
        console.error('[Delete Sprint] Sprint not found or missing boardId');
        return;
      }
      const url = `/api/boards/${sprint.boardId}/sprints/${sprintIdToDelete}`;
      console.log('[Delete Sprint] URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      console.log('[Delete Sprint] Response status:', response.status);
      const data = await response.json();
      console.log('[Delete Sprint] Response data:', data);
      
      if (data.success) {
        console.log('[Delete Sprint] ✅ Delete successful, refreshing data...');
        // Refresh data in background without showing loading state
        try {
          await fetchData(false); // Don't show loading state - smooth background update
          console.log('[Delete Sprint] ✅ Data refresh completed');
        } catch (err) {
          console.error('[Delete Sprint] ❌ Failed to refresh data after sprint deletion:', err);
        } finally {
          // Ensure dialog is closed and cleanup
          setDeleteSprintDialogOpen(false);
          setSprintToDelete(null);
          
          // Force cleanup of any lingering overlays - very aggressive approach
          setTimeout(() => {
            console.log('[Delete Sprint] Cleaning up lingering overlays...');
            
            // Remove ALL Radix UI portals that contain alertdialog
            const portals = document.querySelectorAll('[data-radix-portal]');
            console.log('[Delete Sprint] Found portals:', portals.length);
            portals.forEach(portal => {
              const element = portal as HTMLElement;
              const hasAlertDialog = element.querySelector('[role="alertdialog"]');
              const state = element.getAttribute('data-state');
              
              if (hasAlertDialog || state === 'closed') {
                console.log('[Delete Sprint] Removing portal:', element, { hasAlertDialog, state });
                element.remove();
              }
            });
            
            // Remove all fixed position overlays with high z-index that cover the screen
            const allElements = Array.from(document.querySelectorAll('*')) as HTMLElement[];
            let removedCount = 0;
            
            allElements.forEach(element => {
              const computedStyle = window.getComputedStyle(element);
              const zIndex = parseInt(computedStyle.zIndex || '0');
              const position = computedStyle.position;
              const pointerEvents = computedStyle.pointerEvents;
              const opacity = parseFloat(computedStyle.opacity || '1');
              
              // Check if it's a fixed overlay that might be blocking
              if (position === 'fixed' && zIndex >= 50 && pointerEvents === 'auto') {
                const rect = element.getBoundingClientRect();
                const coversScreen = rect.width >= window.innerWidth * 0.8 && 
                                     rect.height >= window.innerHeight * 0.8 &&
                                     rect.top <= 0 && rect.left <= 0;
                
                const state = element.getAttribute('data-state');
                const isClosed = state === 'closed';
                const isLowOpacity = opacity < 0.5;
                
                // Remove if it covers screen and is closed or has low opacity
                if (coversScreen && (isClosed || isLowOpacity)) {
                  console.log('[Delete Sprint] Removing blocking overlay:', element, {
                    zIndex,
                    position,
                    pointerEvents,
                    opacity,
                    state,
                    coversScreen: { width: rect.width, height: rect.height, top: rect.top, left: rect.left }
                  });
                  element.style.pointerEvents = 'none';
                  element.style.display = 'none';
                  element.remove();
                  removedCount++;
                }
              }
            });
            
            // Remove all alertdialog elements
            const alertDialogs = document.querySelectorAll('[role="alertdialog"]');
            console.log('[Delete Sprint] Found alertdialogs:', alertDialogs.length);
            alertDialogs.forEach(dialog => {
              const element = dialog as HTMLElement;
              const state = element.getAttribute('data-state');
              if (state === 'closed' || !state) {
                console.log('[Delete Sprint] Removing alertdialog:', element);
                // Remove parent portal if it exists
                const portal = element.closest('[data-radix-portal]');
                if (portal) {
                  portal.remove();
                } else {
                  element.remove();
                }
              }
            });
            
            // Remove any elements with bg-black/80 class (AlertDialog overlay)
            const blackOverlays = document.querySelectorAll('[class*="bg-black/80"], [class*="bg-black/80"]');
            console.log('[Delete Sprint] Found bg-black/80 overlays:', blackOverlays.length);
            blackOverlays.forEach(overlay => {
              const element = overlay as HTMLElement;
              const computedStyle = window.getComputedStyle(element);
              const position = computedStyle.position;
              
              if (position === 'fixed') {
                const state = element.getAttribute('data-state');
                if (state === 'closed' || parseFloat(computedStyle.opacity || '1') < 0.1) {
                  console.log('[Delete Sprint] Removing bg-black/80 overlay:', element);
                  element.remove();
                  removedCount++;
                }
              }
            });
            
            console.log('[Delete Sprint] Cleanup completed, removed', removedCount, 'blocking elements');
            
            // Ensure body and html pointer-events are enabled
            document.body.style.pointerEvents = '';
            document.documentElement.style.pointerEvents = '';
            console.log('[Delete Sprint] Reset body and html pointer-events');
          }, 200);
          
          setIsDeletingSprint(false);
          console.log('[Delete Sprint] Setting isDeletingSprint to false');
        }
      } else {
        console.error('[Delete Sprint] ❌ Delete failed:', data.message);
        setIsDeletingSprint(false);
        console.log('[Delete Sprint] Setting isDeletingSprint to false (delete failed)');
        // Optionally show error toast here
      }
    } catch (error) {
      console.error('[Delete Sprint] ❌ Exception during delete:', error);
      if (error instanceof Error) {
        console.error('[Delete Sprint] Error details:', error.message, error.stack);
      }
      setIsDeletingSprint(false);
      console.log('[Delete Sprint] Setting isDeletingSprint to false (exception)');
      // Optionally show error toast here
    }
    
    console.log('[Delete Sprint] Function completed');
  };

  const handleStartSprint = async (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint || !sprint.boardId) {
      console.error('[Start Sprint] Sprint not found or missing boardId');
      return;
    }
    try {
      const response = await fetch(`/api/boards/${sprint.boardId}/sprints/${sprintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'start' }),
      });
      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        // Show error message if validation fails
        console.error('Failed to start sprint:', data.message);
        alert(data.message || 'Failed to start sprint. Please try again.');
      }
    } catch (error) {
      console.error('Failed to start sprint:', error);
      alert('Failed to start sprint. Please try again.');
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    // Find the sprint to check for unfinished tasks
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) {
      console.error('[Complete Sprint] Sprint not found:', sprintId);
      return;
    }
    
    console.log('[Complete Sprint] Checking sprint for unfinished tasks:', {
      sprintId,
      sprintName: sprint.name,
      tasksCount: sprint.tasks?.length || 0,
      tasks: sprint.tasks?.map((t: Task) => ({
        id: t.id,
        summary: t.summary,
        statusId: t.status?.id,
        statusName: t.status?.name,
        isDone: t.status?.isDone,
      })),
    });
    
    // Check if sprint has unfinished tasks (not in done status)
    // Make sure we check both the status object and the isDone property
    const unfinishedTasks = (sprint.tasks || []).filter((task: Task) => {
      // Check if task has status and if status.isDone is explicitly false or undefined
      const isDone = task.status?.isDone;
      console.log('[Complete Sprint] Task status check:', {
        taskId: task.id,
        hasStatus: !!task.status,
        isDone,
        result: !isDone,
      });
      return !isDone; // Task is unfinished if isDone is false, null, or undefined
    });
    const unfinishedCount = unfinishedTasks.length;
    
    console.log('[Complete Sprint] Unfinished tasks count:', unfinishedCount, 'out of', sprint.tasks?.length || 0);
    
    // ALWAYS show dialog if there are unfinished tasks (at least one task not in done status)
    // This dialog must always open if at least one task is not in done category
    if (unfinishedCount > 0) {
      // Show dialog to choose what to do with unfinished tasks
      setUnfinishedTasksCount(unfinishedCount);
      setSprintToComplete(sprint);
      
      console.log('[Complete Sprint] Opening dialog with unfinished count:', unfinishedCount);
      
      // Auto-select oldest pending sprint if available, otherwise default to backlog
      const availableSprints = sprints.filter(s => s.id !== sprintId && s.state === 'PLANNED');
      if (availableSprints.length > 0) {
        const oldestSprint = availableSprints.sort((a, b) => a.order - b.order)[0];
        setTaskMovementChoice('next-sprint'); // Default to next sprint if available
        setSelectedTargetSprintId(oldestSprint.id);
      } else {
        setTaskMovementChoice('backlog'); // Default to backlog if no pending sprints
        setSelectedTargetSprintId('');
      }
      setCompleteSprintDialogOpen(true);
    } else {
      // All tasks are done, complete sprint directly (no tasks to move)
      console.log('[Complete Sprint] All tasks are done, completing without dialog');
      await completeSprintWithTasks(sprintId, undefined, []);
    }
  };

  const completeSprintWithTasks = async (
    sprintId: string, 
    movementChoice: 'next-sprint' | 'backlog' | undefined,
    taskIds: string[],
    targetSprintId?: string
  ) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint || !sprint.boardId) {
      console.error('[Complete Sprint] Sprint not found or missing boardId');
      return;
    }
    
    try {
      const requestBody: any = {
        action: 'complete',
      };
      
      // Only include task movement params if there are tasks to move
      if (movementChoice && taskIds && taskIds.length > 0) {
        requestBody.moveTasks = movementChoice;
        requestBody.taskIds = taskIds;
        if (targetSprintId) {
          requestBody.targetSprintId = targetSprintId;
        }
      }
      
      const response = await fetch(`/api/boards/${sprint.boardId}/sprints/${sprintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (data.success) {
        setCompleteSprintDialogOpen(false);
        setSprintToComplete(null);
        setUnfinishedTasksCount(0);
        setSelectedTargetSprintId('');
        await fetchData(false);
      } else {
        console.error('Failed to complete sprint:', data.message);
        console.error('Error details:', data.error);
        console.error('Error code:', data.errorCode);
        // Show user-friendly error message
        alert(`Failed to complete sprint: ${data.message}${data.error ? `\n\nDetails: ${data.error}` : ''}`);
      }
    } catch (error) {
      console.error('Failed to complete sprint:', error);
    }
  };

  const handleConfirmCompleteSprint = async () => {
    if (!sprintToComplete) return;
    
    const sprint = sprints.find(s => s.id === sprintToComplete.id);
    if (!sprint || !sprint.boardId) {
      console.error('[Complete Sprint] Sprint not found or missing boardId');
      return;
    }
    
    const unfinishedTasks = (sprintToComplete.tasks || []).filter((task: Task) => !task.status?.isDone);
    const unfinishedTaskIds = unfinishedTasks.map(t => t.id);
    
    let targetSprintId = selectedTargetSprintId;
    
    // If "Next Sprint" is selected but no sprint is available, create a new one
    if (taskMovementChoice === 'next-sprint' && !targetSprintId) {
      // Get available sprints (excluding the current one being completed)
      const availableSprints = sprints.filter(s => s.id !== sprintToComplete.id && s.state === 'PLANNED');
      
      if (availableSprints.length === 0) {
        // Create a new sprint with format "{Space ticker} Sprint {number}"
        try {
          // Fetch all sprints from the space to determine the next number
          const sprintsResponse = await fetch(`/api/spaces/${spaceSlug}/sprints`, {
            credentials: 'include',
          });
          const sprintsData = await sprintsResponse.json();
          const allBoardSprints = sprintsData.success ? sprintsData.sprints || [] : [];
          
          // Extract sprint numbers from names matching "{Ticker} Sprint {number}" pattern
          const sprintNumbers = allBoardSprints
            .map((s: any) => {
              // Match pattern like "TIT Sprint 1", "TIT Sprint 2", etc.
              const match = s.name.match(new RegExp(`^${spaceTicker}\\s+Sprint\\s+(\\d+)$`, 'i'));
              return match ? parseInt(match[1]) : 0;
            })
            .filter((n: number) => n > 0);
          
          const nextSprintNumber = sprintNumbers.length > 0 ? Math.max(...sprintNumbers) + 1 : 1;
          const newSprintName = `${spaceTicker} Sprint ${nextSprintNumber}`;
          
          console.log('[Complete Sprint] Creating new sprint:', newSprintName, 'next number:', nextSprintNumber);
          
          // Get the boardId from the sprint being completed (sprintToComplete is already set in the outer scope)
          if (!sprintToComplete || !sprintToComplete.boardId) {
            console.error('[Complete Sprint] Sprint not found or missing boardId');
            alert('Cannot create new sprint: Unable to determine board. Please try again.');
            return;
          }
          
          const createResponse = await fetch(`/api/boards/${sprintToComplete.boardId}/sprints`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              name: newSprintName,
            }),
          });
          
          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('[Complete Sprint] Failed to create new sprint - HTTP error:', createResponse.status, errorText);
            alert(`Failed to create new sprint: ${createResponse.status === 405 ? 'Method not allowed' : `HTTP ${createResponse.status}`}`);
            return;
          }
          
          let createData;
          try {
            createData = await createResponse.json();
          } catch (jsonError) {
            console.error('[Complete Sprint] Failed to parse JSON response:', jsonError);
            alert('Failed to create new sprint: Invalid response from server.');
            return;
          }
          
          if (createData.success && createData.sprint) {
            targetSprintId = createData.sprint.id;
            console.log('[Complete Sprint] New sprint created:', targetSprintId, newSprintName);
            // Refresh sprints data to include the new sprint
            await fetchData(false);
          } else {
            console.error('[Complete Sprint] Failed to create new sprint:', createData.message);
            alert(`Failed to create new sprint: ${createData.message || 'Unknown error'}`);
            return;
          }
        } catch (error) {
          console.error('[Complete Sprint] Error creating new sprint:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          alert(`Failed to create new sprint: ${errorMessage}`);
          return;
        }
      }
    }
    
    await completeSprintWithTasks(
      sprintToComplete.id, 
      taskMovementChoice, 
      unfinishedTaskIds,
      taskMovementChoice === 'next-sprint' ? targetSprintId : undefined
    );
  };

  const handleTaskClick = async (taskId: string) => {
    // Don't open dialog if we're dragging
    if (activeTaskId) return;
    
    // If task is already open in side view, navigate to full page instead
    if (selectedTask && selectedTask.id === taskId && editorOpen) {
      window.location.href = `/spaces/${spaceSlug}/tasks/${taskId}?from=backlog`;
      return;
    }
    
    setEditorOpen(true);
    
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.task) {
          setSelectedTask(data.task);
        }
      }
    } catch (error) {
      console.error('Failed to fetch task details:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const activeData = event.active.data.current;
    const task = tasks.find(t => t.id === taskId) || 
                 sprints.flatMap(s => s.tasks || []).find(t => t.id === taskId);
    
    console.log('[Drag Start] ====================');
    console.log('[Drag Start] Task ID:', taskId);
    console.log('[Drag Start] Task:', task);
    console.log('[Drag Start] Active data:', activeData);
    
    // Check if task is coming from a sprint
    if (activeData?.sprintId) {
      setDraggedFromSprint(activeData.sprintId);
      console.log('[Drag Start] Task is from sprint:', activeData.sprintId);
    } else {
      setDraggedFromSprint(null);
      console.log('[Drag Start] Task is from backlog');
    }
    
    setActiveTaskId(taskId);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;
    const activeData = active.data.current;
    const taskSourceSprintId = activeData?.sprintId || draggedFromSprint;
    
    if (over) {
      console.log('[Drag Over] ====================');
      console.log('[Drag Over] Active ID:', active.id);
      console.log('[Drag Over] Over ID:', over.id);
      console.log('[Drag Over] Over ID type:', typeof over.id);
      console.log('[Drag Over] Over data:', over.data.current);
      console.log('[Drag Over] Is sprint (by ID)?', String(over.id).startsWith('sprint-'));
      console.log('[Drag Over] Is sprint (by data)?', over.data.current?.type === 'sprint');
      
      // Check if dragging sprint task over backlog area
      if (taskSourceSprintId) {
        const isBacklogDropzone = String(over.id).startsWith('backlog-') || over.data.current?.type === 'backlog';
        const isDroppingOnBacklogTask = filteredTasks.some(t => t.id === over.id);
        setIsOverBacklog(isBacklogDropzone || isDroppingOnBacklogTask);
      } else {
        setIsOverBacklog(false);
      }
    } else {
      setIsOverBacklog(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('[Drag End] ====================');
    console.log('[Drag End] Active ID:', active.id);
    console.log('[Drag End] Active data:', active.data.current);
    console.log('[Drag End] Over:', over ? { id: over.id, data: over.data.current } : null);
    setActiveTaskId(null);
    setDraggedFromSprint(null);
    setIsOverBacklog(false);

    if (!over) {
      console.log('[Drag End] ❌ Early return - no over');
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current;
    const activeData = active.data.current;
    const taskSourceSprintId = activeData?.sprintId || draggedFromSprint;
    
    console.log('[Drag End] Task ID:', taskId);
    console.log('[Drag End] Over ID (string):', overId);
    console.log('[Drag End] Over ID (type):', typeof overId);
    console.log('[Drag End] Over data:', overData);
    console.log('[Drag End] Active data:', activeData);
    console.log('[Drag End] Task source sprint:', taskSourceSprintId);
    console.log('[Drag End] Checking drop target...');
    console.log('[Drag End] Starts with "sprint-"?', String(overId).startsWith('sprint-'));
    console.log('[Drag End] Starts with "backlog-"?', String(overId).startsWith('backlog-'));
    console.log('[Drag End] Over data type === "sprint"?', overData?.type === 'sprint');
    console.log('[Drag End] Over data type === "backlog"?', overData?.type === 'backlog');
    console.log('[Drag End] Over data sprintId:', overData?.sprintId);

    // Check if dropping on backlog
    // Can drop on: the backlog dropzone, or any task in the backlog (since tasks are in the backlog)
    const isBacklogDropzone = String(overId).startsWith('backlog-') || overData?.type === 'backlog';
    const isDroppingOnBacklogTask = filteredTasks.some(t => t.id === overId);
    const isBacklogDrop = isBacklogDropzone || (isDroppingOnBacklogTask && taskSourceSprintId);

    // Check if reordering within the same sprint
    // This happens when dragging a task from a sprint and dropping it on another task in the same sprint
    // OR dropping on the sprint area itself (when overData.type === 'sprint' and sprintId matches)
    const isSameSprintReorder = taskSourceSprintId && (
      (overData?.sprintId === taskSourceSprintId && overData?.type === 'task') ||
      (overData?.sprintId === taskSourceSprintId && overData?.type === 'sprint') ||
      (String(overId).startsWith('sprint-') && String(overId).replace('sprint-', '') === taskSourceSprintId)
    );

    console.log('[Drag End] Checking same sprint reorder:', {
      taskSourceSprintId,
      overId,
      overData,
      isSameSprintReorder,
      overIdStartsWithSprint: String(overId).startsWith('sprint-'),
      extractedSprintId: String(overId).startsWith('sprint-') ? String(overId).replace('sprint-', '') : null,
    });

    if (isSameSprintReorder) {
      // Reordering within the same sprint
      console.log('[Drag End] ✅ Reordering within sprint:', taskSourceSprintId);
      console.log('[Drag End] Over details:', { overId, overData, overIdString: String(overId) });
      
      const sprint = sprints.find(s => s.id === taskSourceSprintId);
      if (!sprint || !sprint.tasks || sprint.tasks.length < 2) {
        console.log('[Drag End] ❌ Sprint not found or insufficient tasks:', {
          sprintFound: !!sprint,
          tasksCount: sprint?.tasks?.length || 0,
        });
        return;
      }

      const sprintTasks = [...sprint.tasks];
      const oldIndex = sprintTasks.findIndex(t => t.id === taskId);
      
      // If dropping on another task, use that task's index
      // If dropping on the sprint area itself, append to end or use a sensible default
      let newIndex: number;
      if (overData?.type === 'task' && overData?.sprintId === taskSourceSprintId) {
        // Dropping on another task
        newIndex = sprintTasks.findIndex(t => t.id === overId);
        console.log('[Drag End] Dropping on task, newIndex:', newIndex);
      } else {
        // Dropping on sprint area itself - append to end
        newIndex = sprintTasks.length;
        console.log('[Drag End] Dropping on sprint area, appending to end, newIndex:', newIndex);
      }

      console.log('[Drag End] Sprint task indices:', { 
        oldIndex, 
        newIndex, 
        taskId, 
        overId,
        sprintTasksCount: sprintTasks.length,
        sprintTaskIds: sprintTasks.map(t => t.id),
      });

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Save original state
        const originalSprints = [...sprints];
        
        // Reorder tasks within sprint
        const newSprintTasks = arrayMove(sprintTasks, oldIndex, newIndex);
        
        // Update sprints state
        setSprints(prevSprints => prevSprints.map(s => {
          if (s.id === taskSourceSprintId) {
            return {
              ...s,
              tasks: newSprintTasks,
            };
          }
          return s;
        }));

        // Update order on server in the background
        setTimeout(async () => {
          try {
            const payload = {
              items: newSprintTasks.map((task, index) => ({
                id: task.id,
                order: index,
              })),
            };
            console.log('[Drag End] Calling reorder API with payload:', payload);
            
            const sourceSprint = sprints.find(s => s.id === taskSourceSprintId);
            if (!sourceSprint || !sourceSprint.boardId) {
              console.error('[Drag End] Source sprint not found or missing boardId');
              return;
            }
            const response = await fetch(`/api/boards/${sourceSprint.boardId}/sprints/${taskSourceSprintId}/tasks/reorder`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(payload),
            });

            console.log('[Drag End] Reorder API response status:', response.status);
            const data = await response.json();
            console.log('[Drag End] Reorder API response data:', data);
            
            if (!data.success) {
              console.error('[Drag End] ❌ Failed to update sprint task order:', data.message, data.error);
              // Revert on failure
              setSprints(originalSprints);
            } else {
              // Check if migration is needed (database update didn't actually persist)
              const migrationNeeded = data.message?.includes('migration may be needed') || 
                                      data.message?.includes('migration');
              
              if (migrationNeeded) {
                console.log('[Drag End] ⚠️ Migration needed - keeping optimistic update in UI');
                // Don't refresh data - keep the optimistic update in UI state
                // The order will persist in UI until migration is run
              } else {
                console.log('[Drag End] ✅ Successfully updated sprint task order');
                // Silently refresh data in the background to ensure consistency
                fetchData(false).catch(err => console.error('[Drag End] Error refreshing data:', err));
              }
            }
          } catch (error) {
            console.error('[Drag End] ❌ Exception updating sprint task order:', error);
            if (error instanceof Error) {
              console.error('[Drag End] Error details:', error.message, error.stack);
            }
            // Revert on error
            setSprints(originalSprints);
          }
        }, 0);
      } else {
        console.log('[Drag End] ❌ Reordering conditions not met:', {
          oldIndex,
          newIndex,
          oldIndexValid: oldIndex !== -1,
          newIndexValid: newIndex !== -1,
          indicesDifferent: oldIndex !== newIndex,
        });
      }

      return; // Exit early, don't process as other drag types
    }

    // Check if dropping on a sprint (by ID or data)
    let actualSprintId: string | null = null;
    if (String(overId).startsWith('sprint-')) {
      actualSprintId = String(overId).replace('sprint-', '');
      console.log('[Drag End] ✅ Found sprint by ID prefix:', actualSprintId);
    } else if (overData?.type === 'sprint' && overData?.sprintId) {
      actualSprintId = overData.sprintId;
      console.log('[Drag End] ✅ Found sprint by data:', actualSprintId);
    } else if (overData?.type === 'task' && overData?.sprintId) {
      // Dropping on a task that's in a sprint - use that sprint
      actualSprintId = overData.sprintId;
      console.log('[Drag End] ✅ Found sprint from task data:', actualSprintId);
    }

    // Check if moving task from one sprint to another sprint
    if (taskSourceSprintId && actualSprintId && taskSourceSprintId !== actualSprintId) {
      console.log('[Drag End] ✅ Moving task between sprints');
      console.log('[Drag End] From sprint:', taskSourceSprintId);
      console.log('[Drag End] To sprint:', actualSprintId);
      console.log('[Drag End] Task ID:', taskId);
      
      // Find the task in the source sprint
      const sourceSprint = sprints.find(s => s.id === taskSourceSprintId);
      const taskToMove = sourceSprint?.tasks?.find(t => t.id === taskId);
      
      if (!taskToMove) {
        console.error('[Drag End] ❌ Task not found');
        return;
      }
      
      const sourceSprintForMove = sprints.find(s => s.id === taskSourceSprintId);
      const targetSprintForMove = sprints.find(s => s.id === actualSprintId);
      if (!sourceSprintForMove || !sourceSprintForMove.boardId || !targetSprintForMove || !targetSprintForMove.boardId) {
        console.error('[Drag End] ❌ Source or target sprint not found or missing boardId');
        return;
      }

      // Optimistic update: Remove task from source sprint immediately
      setSprints(prevSprints => prevSprints.map(s => {
        if (s.id === taskSourceSprintId) {
          return {
            ...s,
            tasks: (s.tasks || []).filter(t => t.id !== taskId),
          };
        }
        return s;
      }));

      // Optimistic update: Add task to target sprint immediately
      setSprints(prevSprints => prevSprints.map(sprint => {
        if (sprint.id === actualSprintId) {
          return {
            ...sprint,
            tasks: [...(sprint.tasks || []), taskToMove],
          };
        }
        return sprint;
      }));

      // Call API in the background (non-blocking)
      setTimeout(async () => {
        try {
          // First remove from source sprint
          const removeUrl = `/api/boards/${sourceSprintForMove.boardId}/sprints/${taskSourceSprintId}/tasks`;
          console.log('[Drag End] Removing task from source sprint:', removeUrl);
          const removeResponse = await fetch(removeUrl, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ taskIds: [taskId] }),
          });
          const removeData = await removeResponse.json();
          console.log('[Drag End] Remove from sprint response:', removeData);

          if (!removeData.success) {
            throw new Error(removeData.message || 'Failed to remove task from source sprint');
          }

          // Then add to target sprint
          const addUrl = `/api/boards/${targetSprintForMove.boardId}/sprints/${actualSprintId}/tasks`;
          console.log('[Drag End] Adding task to target sprint:', addUrl);
          const addResponse = await fetch(addUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ taskIds: [taskId] }),
          });
          const addData = await addResponse.json();
          console.log('[Drag End] Add to sprint response:', addData);

          if (addData.success) {
            console.log('[Drag End] ✅ Successfully moved task between sprints');
            // Silently refresh data in the background
            fetchData(false).catch(err => console.error('[Drag End] Error refreshing data:', err));
          } else {
            throw new Error(addData.message || 'Failed to add task to target sprint');
          }
        } catch (error) {
          console.error('[Drag End] ❌ Exception moving task between sprints:', error);
          // Revert optimistic update on error
          setSprints(prevSprints => prevSprints.map(s => {
            if (s.id === taskSourceSprintId) {
              // Restore task to source sprint
              const taskExists = (s.tasks || []).find(t => t.id === taskId);
              if (!taskExists) {
                return {
                  ...s,
                  tasks: [...(s.tasks || []), taskToMove],
                };
              }
            }
            if (s.id === actualSprintId) {
              // Remove task from target sprint
              return {
                ...s,
                tasks: (s.tasks || []).filter(t => t.id !== taskId),
              };
            }
            return s;
          }));
        }
      }, 0);

      return; // Exit early, don't process as other drag types
    }

    if (actualSprintId) {
      console.log('[Drag End] ✅ Processing sprint drop for sprint:', actualSprintId);
      console.log('[Drag End] Task ID to add:', taskId);
      
      // Find the task being moved (from backlog)
      const taskToMove = tasks.find(t => t.id === taskId);
      if (!taskToMove) {
        console.error('[Drag End] ❌ Task not found:', taskId);
        return;
      }
      
      const targetSprint = sprints.find(s => s.id === actualSprintId);
      if (!targetSprint || !targetSprint.boardId) {
        console.error('[Drag End] ❌ Target sprint not found or missing boardId');
        return;
      }

      // Optimistic update: Remove task from backlog list immediately
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));

      // Optimistic update: Add task to sprint immediately
      setSprints(prevSprints => prevSprints.map(sprint => {
        if (sprint.id === actualSprintId) {
          return {
            ...sprint,
            tasks: [...(sprint.tasks || []), taskToMove],
          };
        }
        return sprint;
      }));

      // Call API in the background (non-blocking)
      setTimeout(async () => {
        try {
          const url = `/api/boards/${targetSprint.boardId}/sprints/${actualSprintId}/tasks`;
          console.log('[Drag End] Making background request to:', url);
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ taskIds: [taskId] }),
          });
          const data = await response.json();
          console.log('[Drag End] API response:', data);
          if (data.success) {
            console.log('[Drag End] ✅ Successfully added task to sprint');
            // Silently refresh data in the background to ensure consistency
            // Don't show loading state
            fetchData(false).catch(err => {
              console.error('[Drag End] Error refreshing data:', err);
              // If refresh fails, revert optimistic update
              setTasks(prevTasks => {
                const taskExists = prevTasks.find(t => t.id === taskId);
                if (!taskExists) {
                  return [...prevTasks, taskToMove].sort((a, b) => {
                    if (a.backlogOrder !== null && a.backlogOrder !== undefined && b.backlogOrder !== null && b.backlogOrder !== undefined) {
                      return a.backlogOrder - b.backlogOrder;
                    }
                    if (a.backlogOrder !== null && a.backlogOrder !== undefined) return -1;
                    if (b.backlogOrder !== null && b.backlogOrder !== undefined) return 1;
                    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return bDate - aDate;
                  });
                }
                return prevTasks;
              });
              setSprints(prevSprints => prevSprints.map(sprint => {
                if (sprint.id === actualSprintId) {
                  return {
                    ...sprint,
                    tasks: (sprint.tasks || []).filter(t => t.id !== taskId),
                  };
                }
                return sprint;
              }));
            });
          } else {
            console.error('[Drag End] ❌ Failed to add task to sprint:', data.message);
            // Revert optimistic update on failure
            setTasks(prevTasks => {
              const taskExists = prevTasks.find(t => t.id === taskId);
              if (!taskExists) {
                return [...prevTasks, taskToMove].sort((a, b) => {
                  if (a.backlogOrder !== null && a.backlogOrder !== undefined && b.backlogOrder !== null && b.backlogOrder !== undefined) {
                    return a.backlogOrder - b.backlogOrder;
                  }
                  if (a.backlogOrder !== null && a.backlogOrder !== undefined) return -1;
                  if (b.backlogOrder !== null && b.backlogOrder !== undefined) return 1;
                  const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return bDate - aDate;
                });
              }
              return prevTasks;
            });
            setSprints(prevSprints => prevSprints.map(sprint => {
              if (sprint.id === actualSprintId) {
                return {
                  ...sprint,
                  tasks: (sprint.tasks || []).filter(t => t.id !== taskId),
                };
              }
              return sprint;
            }));
          }
        } catch (error) {
          console.error('[Drag End] ❌ Exception adding task to sprint:', error);
          // Revert optimistic update on error
          setTasks(prevTasks => {
            const taskExists = prevTasks.find(t => t.id === taskId);
            if (!taskExists) {
              return [...prevTasks, taskToMove].sort((a, b) => {
                if (a.backlogOrder !== null && a.backlogOrder !== undefined && b.backlogOrder !== null && b.backlogOrder !== undefined) {
                  return a.backlogOrder - b.backlogOrder;
                }
                if (a.backlogOrder !== null && a.backlogOrder !== undefined) return -1;
                if (b.backlogOrder !== null && b.backlogOrder !== undefined) return 1;
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
              });
            }
            return prevTasks;
          });
          setSprints(prevSprints => prevSprints.map(sprint => {
            if (sprint.id === actualSprintId) {
              return {
                ...sprint,
                tasks: (sprint.tasks || []).filter(t => t.id !== taskId),
              };
            }
            return sprint;
          }));
        }
      }, 0);

      return; // Exit early, don't process as reordering
    } else if (isBacklogDrop && taskSourceSprintId) {
      // Moving task from sprint back to backlog
      // This handles both: dropping on backlog dropzone AND dropping on backlog tasks
      console.log('[Drag End] ✅ Moving task from sprint to backlog');
      console.log('[Drag End] Sprint ID:', taskSourceSprintId);
      console.log('[Drag End] Task ID:', taskId);
      console.log('[Drag End] Drop target:', { isBacklogDropzone, isDroppingOnBacklogTask, overId });
      
      // Find the task in the sprint
      const sprint = sprints.find(s => s.id === taskSourceSprintId);
      const taskToMove = sprint?.tasks?.find(t => t.id === taskId);
      
      if (!taskToMove) {
        console.error('[Drag End] ❌ Task not found');
        return;
      }
      
      if (!sprint || !sprint.boardId) {
        console.error('[Drag End] ❌ Sprint not found or missing boardId');
        return;
      }

      // Optimistic update: Remove task from sprint immediately
      setSprints(prevSprints => prevSprints.map(s => {
        if (s.id === taskSourceSprintId) {
          return {
            ...s,
            tasks: (s.tasks || []).filter(t => t.id !== taskId),
          };
        }
        return s;
      }));

      // Optimistic update: Add task to backlog list immediately (at the end)
      setTasks(prevTasks => {
        const taskExists = prevTasks.find(t => t.id === taskId);
        if (!taskExists) {
          // Find max backlogOrder to append at the end
          const maxOrder = prevTasks.reduce((max, t) => 
            Math.max(max, t.backlogOrder ?? -1), -1
          );
          return [...prevTasks, { ...taskToMove, backlogOrder: maxOrder + 1 }];
        }
        return prevTasks;
      });

      // Call API in the background (non-blocking)
      setTimeout(async () => {
        try {
          const url = `/api/boards/${sprint.boardId}/sprints/${taskSourceSprintId}/tasks`;
          console.log('[Drag End] Making background DELETE request to:', url);
          const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ taskIds: [taskId] }),
          });
          const data = await response.json();
          console.log('[Drag End] API response:', data);
          if (data.success) {
            console.log('[Drag End] ✅ Successfully removed task from sprint');
            // Silently refresh data in the background to ensure consistency
            fetchData(false).catch(err => {
              console.error('[Drag End] Error refreshing data:', err);
              // If refresh fails, revert optimistic update
              setSprints(prevSprints => prevSprints.map(s => {
                if (s.id === taskSourceSprintId) {
                  return {
                    ...s,
                    tasks: [...(s.tasks || []), taskToMove],
                  };
                }
                return s;
              }));
              setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
            });
          } else {
            console.error('[Drag End] ❌ Failed to remove task from sprint:', data.message);
            // Revert optimistic update on failure
            setSprints(prevSprints => prevSprints.map(s => {
              if (s.id === taskSourceSprintId) {
                return {
                  ...s,
                  tasks: [...(s.tasks || []), taskToMove],
                };
              }
              return s;
            }));
            setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
          }
        } catch (error) {
          console.error('[Drag End] ❌ Exception removing task from sprint:', error);
          // Revert optimistic update on error
          setSprints(prevSprints => prevSprints.map(s => {
            if (s.id === taskSourceSprintId) {
              return {
                ...s,
                tasks: [...(s.tasks || []), taskToMove],
              };
            }
            return s;
          }));
          setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
        }
      }, 0);

      return; // Exit early
    } else if (!taskSourceSprintId) {
      // Reordering within the backlog (only when dragging backlog tasks, not sprint tasks)
      console.log('[Drag End] Reordering within backlog');
      console.log('[Drag End] Current tasks count:', tasks.length);
      
      // Calculate filteredTasks here to get current state
      const currentFilteredTasks = tasks.filter((task) => {
        if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
        if (searchQuery && !task.summary.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
      
      console.log('[Drag End] Filtered tasks count:', currentFilteredTasks.length);
      console.log('[Drag End] Filtered task IDs:', currentFilteredTasks.map(t => t.id));
      console.log('[Drag End] Over ID:', overId);
      console.log('[Drag End] Over data:', overData);

      const oldIndex = currentFilteredTasks.findIndex((t) => t.id === taskId);
      // Check if dropping on another task or on the backlog dropzone
      let newIndex = currentFilteredTasks.findIndex((t) => t.id === overId);
      
      // If not dropping on a task, check if dropping on backlog dropzone
      if (newIndex === -1 && (String(overId).startsWith('backlog-') || overData?.type === 'backlog')) {
        // Dropping on backlog dropzone - append to end
        newIndex = currentFilteredTasks.length;
        console.log('[Drag End] Dropping on backlog dropzone, appending to end');
      }
      
      console.log('[Drag End] Indices:', { oldIndex, newIndex, taskId, overId });

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log('[Drag End] ✓ Conditions met, reordering...');
        // Save original state for potential revert
        const originalTasks = [...tasks];
        console.log('[Drag End] Original tasks order:', originalTasks.map(t => t.id));
        
        // Reorder filtered tasks
        const newFilteredTasks = arrayMove(currentFilteredTasks, oldIndex, newIndex);
        console.log('[Drag End] New filtered tasks order:', newFilteredTasks.map(t => t.id));
        
        // Create a map of task IDs to their new positions in filtered list
        const taskIdToNewIndex = new Map(newFilteredTasks.map((task, index) => [task.id, index]));
        console.log('[Drag End] Task ID to index map:', Array.from(taskIdToNewIndex.entries()));
        
        // Update the full tasks array: reorder filtered tasks, keep others in place
        const newTasks = [...tasks].sort((a, b) => {
          const aIndex = taskIdToNewIndex.get(a.id);
          const bIndex = taskIdToNewIndex.get(b.id);
          
          // If both are in filteredTasks, use their new order
          if (aIndex !== undefined && bIndex !== undefined) {
            return aIndex - bIndex;
          }
          // If only one is in filteredTasks, prioritize it
          if (aIndex !== undefined) return -1;
          if (bIndex !== undefined) return 1;
          // If neither is in filteredTasks, maintain original relative order
          const aOriginalIndex = originalTasks.findIndex(t => t.id === a.id);
          const bOriginalIndex = originalTasks.findIndex(t => t.id === b.id);
          return aOriginalIndex - bOriginalIndex;
        });
        
        console.log('[Drag End] New tasks order:', newTasks.map(t => t.id));
        console.log('[Drag End] Setting new tasks state...');
        setTasks(newTasks);
        console.log('[Drag End] State updated');

        // Update order on server in the background (no loading state)
        setTimeout(async () => {
          console.log('[Drag End] Starting background API call...');
          try {
            // Only update backlogOrder for tasks that are in the backlog (not in sprints, not done)
            const backlogTasks = newTasks.filter(t => !t.sprintId && !t.status?.isDone);
            console.log('[Drag End] Backlog tasks count:', backlogTasks.length);
            const items = backlogTasks.map((task, index) => ({
              id: task.id,
              backlogOrder: index,
            }));
            console.log('[Drag End] API payload:', items);

            const response = await fetch(`/api/spaces/${spaceSlug}/backlog`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ items }),
            });

            const data = await response.json();
            console.log('[Drag End] API response:', data);
            if (!data.success) {
              // Check if error is due to missing column (migration not run)
              const isMigrationError = data.error?.includes('backlogOrder') || 
                                       data.error?.includes('Unknown argument') ||
                                       data.message?.includes('migration');
              
              if (isMigrationError) {
                // Column doesn't exist yet - keep the optimistic update
                // Order will be maintained in UI state until migration runs
                console.log('[Drag End] Migration not run yet, keeping optimistic update');
              } else {
                // Real error - revert
                console.log('[Drag End] API failed with real error, reverting...');
                setTasks(originalTasks);
                console.error('Failed to update task order:', data.message);
              }
            } else {
              console.log('[Drag End] ✓ API call successful');
            }
          } catch (error: any) {
            // Check if error is due to missing column
            const isMigrationError = error.message?.includes('backlogOrder') || 
                                     error.message?.includes('Unknown argument');
            
            if (isMigrationError) {
              // Column doesn't exist yet - keep the optimistic update
              console.log('[Drag End] Migration not run yet, keeping optimistic update');
            } else {
              // Real error - revert
              console.log('[Drag End] API error, reverting...');
              setTasks(originalTasks);
              console.error('Failed to update task order:', error);
            }
          }
        }, 0);
      } else {
        console.log('[Drag End] ✗ Conditions not met:', {
          oldIndex,
          newIndex,
          oldIndexValid: oldIndex !== -1,
          newIndexValid: newIndex !== -1,
          indicesEqual: oldIndex === newIndex,
        });
      }
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (searchQuery && !task.summary.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const priorityColors: Record<string, string> = {
    HIGHEST: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    NORMAL: 'bg-blue-100 text-blue-800',
    LOW: 'bg-gray-100 text-gray-800',
    LOWEST: 'bg-gray-100 text-gray-600',
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--muted)]/20 relative">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#4353FF]/10 to-transparent rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F59E0B]/10 to-transparent rounded-full blur-3xl animate-pulse-slow-delayed pointer-events-none" />
        
        {/* Top Bar */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl overflow-x-auto relative z-10 shadow-sm">
          {/* Search */}
          <div className="relative flex-1 max-w-xs min-w-[120px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[var(--background)]/80 backdrop-blur-sm border-[var(--border)] h-8 text-sm placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 hover:shadow-md transition-all"
            />
          </div>

          {/* Filter Icon */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] hover:scale-110 transition-all flex-shrink-0"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter tasks</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Priority Filter */}
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[120px] sm:w-[140px] h-8 border-[var(--border)] bg-[var(--background)] text-sm flex-shrink-0">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="HIGHEST">Highest</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="LOWEST">Lowest</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 min-w-[20px]" />

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateSprintOpen(true)}
            className="h-8 gap-1.5 sm:gap-2 border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm hover:bg-[var(--muted)] hover:scale-105 hover:shadow-md transition-all text-sm flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create Sprint</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateTaskOpen(true)}
            className="h-8 gap-1.5 sm:gap-2 bg-gradient-to-r from-[#4353FF] to-[#5B5FED] hover:from-[#3343EF] hover:to-[#4B4FDD] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm flex-shrink-0 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <Plus className="w-3.5 h-3.5 relative z-10" />
            <span className="hidden sm:inline relative z-10">Create Task</span>
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-3 sm:px-6 py-4 sm:py-6 relative">
          {/* Decorative Background Pattern */}
          <div
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
          
          <div className="relative z-10 space-y-4 sm:space-y-6">
            {sprints.filter((s) => s.state !== 'CLOSED' && s.state !== 'COMPLETED').length > 0 && (
              <div className="space-y-4 sm:space-y-6">
                {(() => {
                  const activeSprint = sprints.find((s) => s.state === 'ACTIVE');
                  const hasActiveSprint = !!activeSprint;

                  return sprints
                    .filter((s) => s.state !== 'CLOSED' && s.state !== 'COMPLETED')
                    .map((sprint) => (
                      <SprintCard
                        key={sprint.id}
                        sprint={sprint}
                        spaceTicker={spaceTicker}
                        hasActiveSprint={hasActiveSprint}
                        activeSprintName={activeSprint?.name}
                        onEdit={() => {
                          setEditingSprint(sprint);
                          setEditSprintOpen(true);
                        }}
                        onDelete={() => handleDeleteSprint(sprint.id)}
                        onStart={() => handleStartSprint(sprint.id)}
                        onComplete={() => handleCompleteSprint(sprint.id)}
                        onTaskClick={handleTaskClick}
                      />
                    ));
                })()}
              </div>
            )}

            {/* Backlog Section */}
            <div 
              className="bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--card)]/60 border border-[var(--border)]/50 rounded-2xl shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(245,158,11,0.3)] transition-all duration-500 overflow-hidden group/backlog backdrop-blur-sm relative"
              style={{
                animation: `fadeInScale 0.4s ease-out ${sprints.filter((s) => s.state !== 'CLOSED' && s.state !== 'COMPLETED').length * 0.1}s both`,
              }}
            >
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              {/* Backlog Header with Enhanced Gradient Bar */}
              <div className="relative">
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl overflow-hidden"
                >
                  <div 
                    className="h-full w-full animate-gradient-x"
                    style={{ 
                      background: `linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B, #FBBF24)`,
                      backgroundSize: '200% 100%',
                      boxShadow: `0 0 20px #F59E0B60, 0 0 40px #F59E0B30`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 border-b border-[var(--border)]/30 mt-1.5 bg-gradient-to-b from-[var(--muted)]/30 to-transparent backdrop-blur-sm">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <div className="relative flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full relative"
                        style={{ 
                          backgroundColor: '#F59E0B',
                        }}
                      >
                        <div 
                          className="absolute inset-0 rounded-full animate-ping"
                          style={{ 
                            backgroundColor: '#F59E0B',
                          }}
                        />
                      </div>
                    </div>
                    <h3 className="text-[var(--foreground)] text-sm sm:text-base font-semibold">Backlog</h3>
                    <div 
                      className="text-xs px-2.5 py-1 rounded-full font-medium shadow-lg flex items-center gap-1.5"
                      style={{
                        background: `linear-gradient(135deg, #F59E0B15, #FBBF2415)`,
                        color: '#F59E0B',
                        border: `1px solid #F59E0B30`
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                      {filteredTasks.length} tasks
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover/backlog:opacity-100 transition-all duration-300">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-[var(--muted)]/50 rounded-lg transition-all hover:scale-110 hover:rotate-90"
                            onClick={() => setCreateTaskOpen(true)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Quick add task</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-[var(--muted)]/50 rounded-lg transition-all hover:scale-110 hover:rotate-90"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Backlog Tasks Container */}
              <div className="p-3 sm:p-4 relative">
                <BacklogDroppable isOver={isOverBacklog}>
                  {filteredTasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border)]/60 py-10 text-center text-[var(--muted-foreground)] space-y-3 bg-[var(--background)]/40">
                      <p className="text-base font-semibold">No tasks found</p>
                      <p className="text-sm text-[var(--muted-foreground)]/80">
                        Use the Create Task action to add work into your backlog.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setCreateTaskOpen(true)}
                        className="bg-gradient-to-r from-[#4353FF] to-[#5B5FED] hover:from-[#3343EF] hover:to-[#4B4FDD] text-white shadow-md"
                      >
                        Create Task
                      </Button>
                    </div>
                  ) : (
                    <SortableContext items={filteredTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {filteredTasks.map((task, taskIndex) => (
                          <div
                            key={task.id}
                            style={{
                              animation: `slideIn 0.3s ease-out ${taskIndex * 0.05}s both`,
                            }}
                          >
                            <TaskCard
                              task={task}
                              spaceTicker={spaceTicker}
                              priorityColors={priorityColors}
                              onTaskClick={handleTaskClick}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </BacklogDroppable>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTaskId && (
          <div className="relative flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--primary)]/40 bg-[var(--background)] shadow-2xl">
            <GripVertical className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-semibold font-mono px-2 py-1 rounded-lg bg-[var(--muted)]/60 border border-[var(--border)]/60 text-[var(--foreground)]">
              {spaceTicker && tasks.find((t) => t.id === activeTaskId)?.number
                ? `${spaceTicker}-${tasks.find((t) => t.id === activeTaskId)?.number}`
                : tasks.find((t) => t.id === activeTaskId)?.number}
            </span>
            <span className="text-sm font-medium text-[var(--foreground)] truncate">
              {tasks.find((t) => t.id === activeTaskId)?.summary}
            </span>
          </div>
        )}
      </DragOverlay>

      {/* Create Task Dialog */}
      <CreateTaskDialogUnified
        mode="board"
        spaceSlug={spaceSlug}
        statuses={statuses}
        statusId={createTaskStatusId || undefined}
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onTaskCreated={() => fetchData()}
        users={users}
        customFields={[]}
      />

      {/* Create Sprint Dialog */}
      <CreateSprintDialog
        open={createSprintOpen}
        onOpenChange={setCreateSprintOpen}
        onSubmit={handleCreateSprint}
      />

      {/* Edit Sprint Dialog */}
      {editingSprint && (
        <CreateSprintDialog
          open={editSprintOpen}
          onOpenChange={(open) => {
            setEditSprintOpen(open);
            if (!open) setEditingSprint(null);
          }}
          onSubmit={handleEditSprint}
          sprint={editingSprint}
        />
      )}

      {/* Delete Sprint Confirmation Dialog */}
      {deleteSprintDialogOpen && !isDeletingSprint && (
        <AlertDialog 
          key={`delete-sprint-${sprintToDelete}`}
          open={true}
          onOpenChange={(open: boolean) => {
            console.log('[AlertDialog] onOpenChange called, open:', open);
            console.log('[AlertDialog] Current deleteSprintDialogOpen:', deleteSprintDialogOpen);
            console.log('[AlertDialog] Current isDeletingSprint:', isDeletingSprint);
            console.log('[AlertDialog] Current sprintToDelete:', sprintToDelete);
            if (!open && !isDeletingSprint) {
              setDeleteSprintDialogOpen(false);
              setSprintToDelete(null);
              console.log('[AlertDialog] Clearing sprintToDelete state');
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this sprint? This action cannot be undone. Tasks in this sprint will be moved back to the backlog.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteSprint}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Sprint
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Complete Sprint Dialog */}
      {completeSprintDialogOpen && sprintToComplete && (
        <AlertDialog open={completeSprintDialogOpen} onOpenChange={setCompleteSprintDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Sprint with Unfinished Tasks</AlertDialogTitle>
              <AlertDialogDescription>
                {unfinishedTasksCount} task{unfinishedTasksCount !== 1 ? 's' : ''} in this sprint {unfinishedTasksCount !== 1 ? 'are' : 'is'} not finished. 
                What would you like to do with {unfinishedTasksCount !== 1 ? 'them' : 'it'}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="task-movement">Move tasks to:</Label>
                <Select 
                  value={taskMovementChoice} 
                  onValueChange={(value: 'next-sprint' | 'backlog') => {
                    setTaskMovementChoice(value);
                    if (value === 'backlog') {
                      setSelectedTargetSprintId('');
                    } else if (value === 'next-sprint' && sprints.length > 0) {
                      // Auto-select oldest pending sprint if available
                      const availableSprints = sprints.filter(s => s.id !== sprintToComplete.id && s.state === 'PLANNED');
                      if (availableSprints.length > 0) {
                        const oldestSprint = availableSprints.sort((a, b) => a.order - b.order)[0];
                        setSelectedTargetSprintId(oldestSprint.id);
                      }
                    }
                  }}
                >
                  <SelectTrigger id="task-movement" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      value="next-sprint"
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Next Sprint
                    </SelectItem>
                    <SelectItem 
                      value="backlog"
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Backlog
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {taskMovementChoice === 'next-sprint' && (
                <div>
                  <Label htmlFor="target-sprint">Select Sprint:</Label>
                  <Select 
                    value={selectedTargetSprintId || undefined} 
                    onValueChange={(value) => setSelectedTargetSprintId(value)}
                  >
                    <SelectTrigger id="target-sprint" className="mt-2">
                      <SelectValue placeholder={
                        sprints.filter(s => s.id !== sprintToComplete.id && s.state === 'PLANNED').length === 0
                          ? "No pending sprints - will create new sprint"
                          : "Select a sprint"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {sprints
                        .filter(s => s.id !== sprintToComplete.id && s.state === 'PLANNED')
                        .sort((a, b) => a.order - b.order)
                        .map((sprint) => (
                          <SelectItem 
                            key={sprint.id} 
                            value={sprint.id}
                            className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            {sprint.name}
                          </SelectItem>
                        ))}
                      {sprints.filter(s => s.id !== sprintToComplete.id && s.state === 'PLANNED').length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No pending sprints available - a new sprint will be created automatically
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setCompleteSprintDialogOpen(false);
                setSprintToComplete(null);
                setUnfinishedTasksCount(0);
                setSelectedTargetSprintId('');
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmCompleteSprint}
              >
                Complete Sprint
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Task Detail Editor */}
      <RoadmapTaskEditor
        task={selectedTask}
        spaceSlug={spaceSlug}
        statuses={statuses}
        users={users}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setSelectedTask(null);
        }}
        onSave={async () => {
          // Close editor first
          setEditorOpen(false);
          setSelectedTask(null);
          
          // Force refresh with loading state to ensure data is fresh
          await fetchData(true);
          
          console.log('[Backlog View] Data refreshed after save');
        }}
        onNavigateToFullPage={() => {
          if (selectedTask) {
            setEditorOpen(false);
            window.location.href = `/spaces/${spaceSlug}/tasks/${selectedTask.id}?from=backlog`;
          }
        }}
      />

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes pulse-slow-delayed {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.08);
          }
        }

        .animate-gradient-x {
          animation: gradient-x 8s ease infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .animate-pulse-slow-delayed {
          animation: pulse-slow-delayed 10s ease-in-out infinite;
        }

        /* Calendar Dark Theme Styles */
        .date-picker-calendar {
          background: #1a1a1a !important;
          border: 1px solid #333333 !important;
          color: #e5e5e5 !important;
        }

        .date-picker-calendar .react-calendar__navigation {
          background: #242424 !important;
          border-bottom: 1px solid #333333 !important;
        }

        .date-picker-calendar .react-calendar__navigation button {
          color: #e5e5e5 !important;
        }

        .date-picker-calendar .react-calendar__navigation button:hover {
          background: #2a2a2a !important;
        }

        .date-picker-calendar .react-calendar__navigation button:enabled:hover,
        .date-picker-calendar .react-calendar__navigation button:enabled:focus {
          background: #2a2a2a !important;
        }

        .date-picker-calendar .react-calendar__month-view__weekdays {
          background: #1f1f1f !important;
          border-bottom: 1px solid #333333 !important;
        }

        .date-picker-calendar .react-calendar__month-view__weekdays__weekday {
          color: #a3a3a3 !important;
        }

        .date-picker-calendar .react-calendar__tile {
          color: #e5e5e5 !important;
          background: transparent !important;
        }

        .date-picker-calendar .react-calendar__tile:enabled:hover,
        .date-picker-calendar .react-calendar__tile:enabled:focus {
          background: #2a2a2a !important;
        }

        .date-picker-calendar .react-calendar__tile--active {
          background: #4353FF !important;
          color: white !important;
        }

        .date-picker-calendar .react-calendar__tile--active:enabled:hover,
        .date-picker-calendar .react-calendar__tile--active:enabled:focus {
          background: #3343EF !important;
        }

        .date-picker-calendar .react-calendar__tile--now {
          background: #2a2a2a !important;
          color: #4353FF !important;
        }

        .date-picker-calendar .react-calendar__tile--now:enabled:hover,
        .date-picker-calendar .react-calendar__tile--now:enabled:focus {
          background: #2f2f2f !important;
        }
      `}</style>
    </DndContext>
  );
}

// Backlog Droppable Component
function BacklogDroppable({
  children,
  isOver: externalIsOver,
}: {
  children: React.ReactNode;
  isOver?: boolean;
}) {
  const { setNodeRef, isOver: internalIsOver } = useDroppable({
    id: 'backlog-dropzone',
    data: {
      type: 'backlog',
    },
  });

  // Use external isOver if provided (from drag over tracking), otherwise use internal
  const isOver = externalIsOver !== undefined ? externalIsOver : internalIsOver;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl transition-all duration-300 border border-transparent ${
        isOver
          ? 'border-[#F59E0B]/60 bg-[#F59E0B]/5 ring-2 ring-[#F59E0B]/30 shadow-[0_12px_40px_-20px_rgba(245,158,11,0.8)]'
          : ''
      }`}
    >
      {children}
      {isOver && (
        <div className="mt-3 text-center text-sm font-medium text-[#F59E0B] py-3 border-2 border-dashed border-[#F59E0B]/60 rounded-2xl bg-[#F59E0B]/10">
          Drop task here to add to backlog
        </div>
      )}
    </div>
  );
}

// Sprint Card Component
function SprintCard({
  sprint,
  spaceTicker,
  hasActiveSprint,
  activeSprintName,
  onEdit,
  onDelete,
  onStart,
  onComplete,
  onTaskClick,
}: {
  sprint: Sprint;
  spaceTicker: string;
  hasActiveSprint: boolean;
  activeSprintName?: string;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
  onComplete: () => void;
  onTaskClick: (taskId: string) => void;
}) {
  const droppableId = `sprint-${sprint.id}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      type: 'sprint',
      sprintId: sprint.id,
    },
  });

  useEffect(() => {
    console.log('[SprintCard] Droppable registered:', { id: droppableId, sprintId: sprint.id, sprintName: sprint.name });
  }, [droppableId, sprint.id, sprint.name]);

  const isPending = sprint.state === 'PLANNED';
  const isActive = sprint.state === 'ACTIVE';
  const accent = getSprintAccent(sprint.state);

  return (
    <div
      ref={setNodeRef}
      className="bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--card)]/60 border border-[var(--border)]/50 rounded-2xl shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(67,83,255,0.3)] transition-all duration-500 overflow-hidden group/sprint backdrop-blur-sm relative"
      style={{
        borderColor: isOver ? accent.ringColor : undefined,
        boxShadow: isOver
          ? `0 20px 60px -20px ${hexToRgba(accent.ringColor, 0.6)}, 0 0 0 3px ${hexToRgba(accent.ringColor, 0.25)}`
          : undefined,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl overflow-hidden">
          <div
            className="h-full w-full animate-gradient-x"
            style={{
              background: accent.gradient,
              boxShadow: accent.glow,
            }}
          />
        </div>

        <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 border-b border-[var(--border)]/30 mt-1.5 bg-gradient-to-b from-[var(--muted)]/30 to-transparent backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="relative flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full relative"
                style={{
                  backgroundColor: accent.dotColor,
                }}
              >
                {accent.ping && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: accent.dotColor }}
                  />
                )}
              </div>
              {isActive && <PlayCircle className="w-4 h-4 text-[#4353FF] animate-pulse" />}
            </div>
            <h3 className="text-[var(--foreground)] text-sm sm:text-base font-semibold">{sprint.name}</h3>
            <Badge className={accent.badgeClass}>
              {accent.icon === 'sparkles' && <Sparkles className="w-3 h-3 mr-1 inline" />}
              {accent.icon === 'play' && <PlayCircle className="w-3 h-3 mr-1 inline" />}
              {accent.icon === 'check' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
              {accent.badgeLabel}
            </Badge>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
              {sprint.startDate && sprint.endDate && (
                <>
                  <CalendarIcon className="w-3 h-3" />
                  <span>{formatDateDDMMYYYY(sprint.startDate)} - {formatDateDDMMYYYY(sprint.endDate)}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--muted-foreground)]/50" />
                </>
              )}
              {sprint.tasks && (
                <span className="font-medium">{sprint.tasks.length} tasks</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPending && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        onClick={onStart}
                        disabled={hasActiveSprint}
                        className="h-8 gap-2 bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:from-[#EA580C] hover:to-[#F97316] text-white border-0 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Start Sprint</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {hasActiveSprint && (
                    <TooltipContent>
                      <p>
                        {activeSprintName
                          ? `Sprint "${activeSprintName}" is already active. Please complete or close it before starting a new sprint.`
                          : 'Another sprint is already active. Please complete or close it before starting a new sprint.'}
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
            {isActive && (
              <Button
                size="sm"
                onClick={onComplete}
                className="h-8 gap-2 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white border-0 shadow-lg hover:shadow-xl transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Complete</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 rounded-lg transition-all hover:scale-110"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="backdrop-blur-xl bg-[var(--card)]/95 border-[var(--border)]/50">
                <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
                  Edit Sprint
                </DropdownMenuItem>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <DropdownMenuItem
                          onClick={(e) => {
                            if (isActive) {
                              e.preventDefault();
                              return;
                            }
                            onDelete();
                          }}
                          disabled={isActive}
                          className={isActive ? 'text-destructive opacity-50 cursor-not-allowed' : 'text-destructive'}
                        >
                          Delete Sprint
                        </DropdownMenuItem>
                      </div>
                    </TooltipTrigger>
                    {isActive && (
                      <TooltipContent side="right">
                        <p>You need to complete the sprint before deleting it.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Sprint Info */}
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] px-3 sm:px-4 py-2.5 border-b border-[var(--border)]/30 bg-gradient-to-r from-[var(--muted)]/20 to-transparent sm:hidden">
          {sprint.startDate && sprint.endDate && (
            <>
              <CalendarIcon className="w-3 h-3" />
              <span>{formatDateDDMMYYYY(sprint.startDate)} - {formatDateDDMMYYYY(sprint.endDate)}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--muted-foreground)]/50" />
            </>
          )}
          {sprint.tasks && (
            <span className="font-medium">{sprint.tasks.length} tasks</span>
          )}
        </div>
      </div>

      {/* Sprint Tasks Container */}
      <div className="p-3 sm:p-4 relative">
        <div className="space-y-2">
          {sprint.tasks && sprint.tasks.length > 0 ? (
            <SortableContext items={sprint.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {sprint.tasks.map((task, taskIndex) => (
                <div
                  key={task.id}
                  style={{
                    animation: `slideIn 0.3s ease-out ${taskIndex * 0.05}s both`,
                  }}
                >
                  <SprintTaskCard task={task} sprintId={sprint.id} spaceTicker={spaceTicker} onTaskClick={onTaskClick} />
                </div>
              ))}
            </SortableContext>
          ) : (
            !isOver && (
              <div className="text-center text-sm text-[var(--muted-foreground)] py-6 border border-dashed border-[var(--border)]/60 rounded-2xl">
                Drag tasks here
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Sprint Task Card Component - Matches design pattern exactly
const SprintTaskCard = React.memo(function SprintTaskCard({
  task,
  sprintId,
  spaceTicker,
  onTaskClick,
}: {
  task: Task;
  sprintId: string;
  spaceTicker: string;
  onTaskClick: (taskId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      sprintId: sprintId,
      task: task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleTicketClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      onTaskClick(task.id);
    }
  };

  const ticketNumber = spaceTicker && task.number ? `${spaceTicker}-${task.number}` : task.number?.toString() || '';
  const statusName = task.status?.name || '';
  const statusKey = task.status?.key?.toLowerCase() || '';
  
  // Match design pattern status colors exactly
  const getStatusBadgeClass = () => {
    if (statusName === "Backlog" || statusKey === "backlog") {
      return "border-[#EF4444]/50 text-[#EF4444] bg-[#EF4444]/10";
    } else if (statusName === "In Progress" || statusKey === "in progress" || statusKey === "in-progress") {
      return "border-[#3B82F6]/50 text-[#3B82F6] bg-[#3B82F6]/10";
    } else if (statusName === "Done" || statusKey === "done" || task.status?.isDone) {
      return "border-[#10B981]/50 text-[#10B981] bg-[#10B981]/10";
    }
    return "border-[var(--border)] text-[var(--muted-foreground)] bg-[var(--muted)]/10";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleTicketClick}
      className="relative flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-lg bg-[var(--card)] hover:bg-[var(--primary)]/10 transition-all duration-200 group/task cursor-grab active:cursor-grabbing border border-[var(--border)]/30 hover:border-[var(--primary)]/40 hover:shadow-md"
    >
      <div className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-[var(--muted-foreground)] opacity-50 sm:group-hover/task:opacity-100 transition-opacity" />
      </div>
      <div className="relative">
        <span className="text-[var(--foreground)] font-semibold text-sm w-16 sm:w-20 flex-shrink-0 font-mono px-2.5 py-1.5 rounded-md bg-[var(--muted)]/50 border border-[var(--border)]/30 shadow-sm">
          {ticketNumber}
        </span>
      </div>
      <span className="flex-1 text-[var(--foreground)] text-sm truncate font-medium">
        {task.summary}
      </span>
      {statusName && (
        <Badge
          variant="outline"
          className={`text-xs px-2 py-0.5 flex-shrink-0 font-medium ${getStatusBadgeClass()}`}
        >
          {statusName}
        </Badge>
      )}
      <span className="text-[var(--muted-foreground)] text-xs sm:text-sm w-20 sm:w-24 text-right hidden sm:inline">
        {task.assignee ? (task.assignee.name || task.assignee.email) : 'Unassigned'}
      </span>
    </div>
  );
});

SprintTaskCard.displayName = 'SprintTaskCard';

// Task Card Component - Matches design pattern exactly
const TaskCard = React.memo(function TaskCard({
  task,
  spaceTicker,
  priorityColors,
  onTaskClick,
}: {
  task: Task;
  spaceTicker: string;
  priorityColors: Record<string, string>;
  onTaskClick: (taskId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task: task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      onTaskClick(task.id);
    }
  };

  const ticketNumber = spaceTicker && task.number ? `${spaceTicker}-${task.number}` : task.number?.toString() || '';
  const statusName = task.status?.name || '';
  const statusKey = task.status?.key?.toLowerCase() || '';
  
  // Match design pattern status colors exactly
  const getStatusBadgeClass = () => {
    if (statusName === "Backlog" || statusKey === "backlog") {
      return "border-[#EF4444]/50 text-[#EF4444] bg-[#EF4444]/10";
    } else if (statusName === "In Progress" || statusKey === "in progress" || statusKey === "in-progress") {
      return "border-[#3B82F6]/50 text-[#3B82F6] bg-[#3B82F6]/10";
    } else if (statusName === "Done" || statusKey === "done" || task.status?.isDone) {
      return "border-[#10B981]/50 text-[#10B981] bg-[#10B981]/10";
    }
    return "border-[var(--border)] text-[var(--muted-foreground)] bg-[var(--muted)]/10";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleRowClick}
      className="relative flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-lg bg-[var(--card)] hover:bg-[var(--primary)]/10 transition-all duration-200 group/task cursor-grab active:cursor-grabbing border border-[var(--border)]/30 hover:border-[var(--primary)]/40 hover:shadow-md"
    >
      <div className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-[var(--muted-foreground)] opacity-50 sm:group-hover/task:opacity-100 transition-opacity" />
      </div>
      <div className="relative">
        <span className="text-[var(--foreground)] font-semibold text-sm w-16 sm:w-20 flex-shrink-0 font-mono px-2.5 py-1.5 rounded-md bg-[var(--muted)]/50 border border-[var(--border)]/30 shadow-sm">
          {ticketNumber}
        </span>
      </div>
      <span className="flex-1 text-[var(--foreground)] text-sm truncate font-medium">
        {task.summary}
      </span>
      {statusName && (
        <Badge
          variant="outline"
          className={`text-xs px-2 py-0.5 flex-shrink-0 font-medium ${getStatusBadgeClass()}`}
        >
          {statusName}
        </Badge>
      )}
      <span className="text-[var(--muted-foreground)] text-xs sm:text-sm w-20 sm:w-24 text-right hidden sm:inline">
        {task.assignee ? (task.assignee.name || task.assignee.email) : 'Unassigned'}
      </span>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

// Create/Edit Sprint Dialog
function CreateSprintDialog({
  open,
  onOpenChange,
  onSubmit,
  sprint,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  sprint?: Sprint;
}) {
  const [formData, setFormData] = useState({
    name: sprint?.name || '',
    goal: sprint?.goal || '',
    startDate: sprint?.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '',
    endDate: sprint?.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '',
    duration: '2 weeks' as '1 week' | '2 weeks' | '3 weeks' | 'custom',
  });
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);

  // Calculate end date based on start date and duration
  const calculateEndDate = (startDateStr: string, duration: string, currentEndDate?: string) => {
    if (!startDateStr) return '';
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    
    if (duration === '1 week') {
      endDate.setDate(startDate.getDate() + 7);
    } else if (duration === '2 weeks') {
      endDate.setDate(startDate.getDate() + 14);
    } else if (duration === '3 weeks') {
      endDate.setDate(startDate.getDate() + 21);
    } else {
      // Custom - don't auto-calculate, return current end date if provided
      return currentEndDate || '';
    }
    
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const day = String(endDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (sprint) {
      // Calculate duration from dates if editing
      let duration: '1 week' | '2 weeks' | '3 weeks' | 'custom' = 'custom';
      if (sprint.startDate && sprint.endDate) {
        const start = new Date(sprint.startDate);
        const end = new Date(sprint.endDate);
        const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (days === 7) duration = '1 week';
        else if (days === 14) duration = '2 weeks';
        else if (days === 21) duration = '3 weeks';
      }
      
      setFormData({
        name: sprint.name || '',
        goal: sprint.goal || '',
        startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '',
        endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '',
        duration,
      });
    } else {
      setFormData({
        name: '',
        goal: '',
        startDate: '',
        endDate: '',
        duration: '2 weeks',
      });
    }
    setStartCalendarOpen(false);
    setEndCalendarOpen(false);
  }, [sprint, open]);

  // Auto-calculate end date when start date or duration changes
  useEffect(() => {
    if (formData.startDate && formData.duration !== 'custom') {
      const calculatedEndDate = calculateEndDate(formData.startDate, formData.duration, formData.endDate);
      if (calculatedEndDate) {
        setFormData(prev => ({ ...prev, endDate: calculatedEndDate }));
      }
    }
  }, [formData.startDate, formData.duration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      goal: formData.goal || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border-[#333333]/50 max-w-lg p-0 shadow-2xl overflow-hidden [&>button]:flex [&>button]:text-[#a3a3a3] [&>button]:hover:text-[#e5e5e5]">
        <DialogDescription className="sr-only">
          {sprint ? 'Edit sprint details including name, goal, and dates' : 'Create a new sprint with name, goal, and dates'}
        </DialogDescription>
        <form onSubmit={handleSubmit}>
          {/* Gradient Header */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4353FF] via-[#8B5CF6] to-[#4353FF] bg-[length:200%_100%] animate-gradient-x" />
            <div className="relative flex items-center justify-between px-6 py-5 border-b border-[#333333]/50 bg-gradient-to-b from-[#242424]/80 to-transparent backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4353FF]/20 to-[#8B5CF6]/20 flex items-center justify-center backdrop-blur-sm border border-[#4353FF]/30 shadow-lg">
                  <PlayCircle className="w-5 h-5 text-[#4353FF]" />
                </div>
                <div>
                  <DialogTitle className="text-[#e5e5e5] text-lg font-semibold">
                    {sprint ? 'Edit Sprint' : 'Create Sprint'}
                  </DialogTitle>
                  <p className="text-xs text-[#a3a3a3]">
                    {sprint ? 'Customize your sprint details' : 'Plan your next sprint'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative px-6 py-5 space-y-5 bg-gradient-to-b from-[#1a1a1a] to-[#1f1f1f]">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#e5e5e5] text-sm font-medium flex items-center gap-2">
                Sprint Name <span className="text-[#4353FF]">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-[#242424] border-[#404040] text-[#e5e5e5] placeholder:text-[#666666] focus:border-[#4353FF] focus:ring-2 focus:ring-[#4353FF]/20 transition-all h-11 rounded-lg hover:border-[#505050]"
                placeholder="e.g., Sprint 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal" className="text-[#e5e5e5] text-sm font-medium">
                Sprint Goal
              </Label>
              <Textarea
                id="goal"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder="What do you want to achieve in this sprint?"
                rows={3}
                className="bg-[#242424] border-[#404040] text-[#e5e5e5] placeholder:text-[#666666] focus:border-[#4353FF] focus:ring-2 focus:ring-[#4353FF]/20 resize-none min-h-[100px] rounded-lg transition-all hover:border-[#505050]"
              />
            </div>

            {/* Duration Section */}
            <div className="space-y-3 pt-2 border-t border-[#333333]/30">
              <Label className="text-[#e5e5e5] text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#4353FF]" />
                Duration
              </Label>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-[#a3a3a3] text-xs font-medium">Start Date</Label>
                  <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left bg-[#242424] border-[#404040] text-[#e5e5e5] hover:bg-[#2a2a2a] hover:border-[#4353FF]/50 transition-all h-11 rounded-lg"
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-[#4353FF]" />
                        <span className="text-sm">
                          {formData.startDate ? formatDate(formData.startDate) : 'Select start date'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-[#333333] shadow-2xl" align="start">
                      <Calendar
                        onChange={(value: any) => {
                          if (value instanceof Date) {
                            const year = value.getFullYear();
                            const month = String(value.getMonth() + 1).padStart(2, '0');
                            const day = String(value.getDate()).padStart(2, '0');
                            const dateStr = `${year}-${month}-${day}`;
                            setFormData(prev => ({ ...prev, startDate: dateStr }));
                            setStartCalendarOpen(false);
                          }
                        }}
                        value={
                          formData.startDate
                            ? (() => {
                                const [year, month, day] = formData.startDate.split('-').map(Number);
                                return new Date(year, month - 1, day);
                              })()
                            : null
                        }
                        formatMonthYear={(locale, date) => {
                          const monthNames = [
                            'January',
                            'February',
                            'March',
                            'April',
                            'May',
                            'June',
                            'July',
                            'August',
                            'September',
                            'October',
                            'November',
                            'December',
                          ];
                          return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                        }}
                        formatMonth={(locale, date) => {
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return monthNames[date.getMonth()];
                        }}
                        className="date-picker-calendar"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#a3a3a3] text-xs font-medium">Duration</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value: '1 week' | '2 weeks' | '3 weeks' | 'custom') => {
                      setFormData(prev => {
                        if (value !== 'custom' && prev.startDate) {
                          const calculatedEndDate = calculateEndDate(prev.startDate, value, prev.endDate);
                          return { ...prev, duration: value, endDate: calculatedEndDate || prev.endDate };
                        }
                        return { ...prev, duration: value };
                      });
                    }}
                  >
                    <SelectTrigger className="w-full bg-[#242424] border-[#404040] text-[#e5e5e5] hover:bg-[#2a2a2a] hover:border-[#4353FF]/50 transition-all h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#333333]">
                      <SelectItem value="1 week" className="text-[#e5e5e5] hover:bg-[#242424] focus:bg-[#242424]">1 week</SelectItem>
                      <SelectItem value="2 weeks" className="text-[#e5e5e5] hover:bg-[#242424] focus:bg-[#242424]">2 weeks</SelectItem>
                      <SelectItem value="3 weeks" className="text-[#e5e5e5] hover:bg-[#242424] focus:bg-[#242424]">3 weeks</SelectItem>
                      <SelectItem value="custom" className="text-[#e5e5e5] hover:bg-[#242424] focus:bg-[#242424]">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#a3a3a3] text-xs font-medium">
                    End Date
                    {formData.duration !== 'custom' && formData.startDate && (
                      <span className="ml-2 text-[#666666] text-xs">(auto-calculated)</span>
                    )}
                  </Label>
                  <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left bg-[#242424] border-[#404040] text-[#e5e5e5] hover:bg-[#2a2a2a] hover:border-[#8B5CF6]/50 transition-all h-11 rounded-lg disabled:opacity-50"
                        type="button"
                        disabled={formData.duration !== 'custom' && !formData.startDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-[#8B5CF6]" />
                        <span className="text-sm">
                          {formData.endDate ? formatDate(formData.endDate) : 'Select end date'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-[#333333] shadow-2xl" align="start">
                      <Calendar
                        onChange={(value: any) => {
                          if (value instanceof Date) {
                            const year = value.getFullYear();
                            const month = String(value.getMonth() + 1).padStart(2, '0');
                            const day = String(value.getDate()).padStart(2, '0');
                            const dateStr = `${year}-${month}-${day}`;
                            setFormData(prev => ({ ...prev, endDate: dateStr, duration: 'custom' }));
                            setEndCalendarOpen(false);
                          }
                        }}
                        value={
                          formData.endDate
                            ? (() => {
                                const [year, month, day] = formData.endDate.split('-').map(Number);
                                return new Date(year, month - 1, day);
                              })()
                            : null
                        }
                        formatMonthYear={(locale, date) => {
                          const monthNames = [
                            'January',
                            'February',
                            'March',
                            'April',
                            'May',
                            'June',
                            'July',
                            'August',
                            'September',
                            'October',
                            'November',
                            'December',
                          ];
                          return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                        }}
                        formatMonth={(locale, date) => {
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return monthNames[date.getMonth()];
                        }}
                        className="date-picker-calendar"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-end gap-3 px-6 py-4 border-t border-[#333333]/50 bg-gradient-to-t from-[#242424]/80 to-transparent">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#404040] text-[#e5e5e5] hover:bg-[#2a2a2a] hover:border-[#505050] transition-all rounded-lg h-10 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim()}
              className="bg-gradient-to-r from-[#4353FF] to-[#5B5FED] hover:from-[#3343EF] hover:to-[#4B4FDD] text-white shadow-lg hover:shadow-xl hover:shadow-[#4353FF]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg h-10 px-4 relative overflow-hidden group"
            >
              <span className="relative z-10 font-medium">{sprint ? 'Update Sprint' : 'Create Sprint'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-1000" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
