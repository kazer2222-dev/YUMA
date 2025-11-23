'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Package, PackageCheck, CheckCircle2, Trash2, GripVertical, Filter, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/loading';
import { formatDateDDMMYYYY } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';
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
  useDroppable,
  useDraggable,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Release {
  id: string;
  name: string;
  version: string;
  releaseDate?: string;
  description?: string;
  status: 'PENDING' | 'RELEASED';
  tasks?: Task[];
  taskCountsByStatus?: Record<string, number>;
}

interface Task {
  id: string;
  number: number;
  summary: string;
  status?: {
    id: string;
    name: string;
    color?: string;
  };
  assignee?: {
    id: string;
    name?: string;
    email?: string;
  };
  releaseVersion?: string;
}

interface ReleaseManagementProps {
  boardId: string;
  spaceSlug: string;
}

const getStatusTint = (color?: string, alpha = 0.18) => {
  if (!color || typeof color !== 'string') return 'transparent';
  if (!color.startsWith('#')) {
    return 'transparent';
  }
  let hex = color.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  if (hex.length !== 6) return 'transparent';
  const intVal = parseInt(hex, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function ReleaseManagement({ boardId, spaceSlug }: ReleaseManagementProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'released'>('pending');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { success, error: showError } = useToastHelpers();
  const [createFormData, setCreateFormData] = useState({
    version: '',
    description: '',
    releaseDate: '',
  });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [spaceTicker, setSpaceTicker] = useState<string>('');
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [releasesRes, tasksRes, statusesRes, spaceRes] = await Promise.all([
        fetch(`/api/boards/${boardId}/releases`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}/tasks`, { credentials: 'include' }),
        fetch(`/api/boards/${boardId}/statuses`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}`, { credentials: 'include' }),
      ]);

      const [releasesData, tasksData, statusesData, spaceData] = await Promise.all([
        releasesRes.json(),
        tasksRes.json(),
        statusesRes.json(),
        spaceRes.json(),
      ]);

      if (releasesData.success) {
        // Calculate task counts by status for each release - optimized
        const tasksByRelease = new Map<string, Task[]>();
        if (tasksData.success) {
          tasksData.tasks.forEach((t: Task) => {
            if (t.releaseVersion) {
              const existing = tasksByRelease.get(t.releaseVersion) || [];
              tasksByRelease.set(t.releaseVersion, [...existing, t]);
            }
          });
        }

        const releasesWithTasks = releasesData.releases.map((release: Release) => {
          const releaseTasks = tasksByRelease.get(release.version) || [];
          
          // Count tasks by status - optimized
          const taskCountsByStatus: Record<string, number> = {};
          releaseTasks.forEach((task: Task) => {
            const statusId = task.status?.id || 'unknown';
            taskCountsByStatus[statusId] = (taskCountsByStatus[statusId] || 0) + 1;
          });

          return {
            ...release,
            tasks: releaseTasks,
            taskCountsByStatus,
          };
        });
        setReleases(releasesWithTasks);
      }

      if (tasksData.success) {
        setAllTasks(tasksData.tasks);
      }

      if (statusesData.success) {
        setStatuses(statusesData.statuses || []);
      }

      if (spaceData.success) {
        setSpaceTicker(spaceData.space.ticker || '');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [boardId, spaceSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRelease = async () => {
    if (!createFormData.version.trim()) {
      showError('Validation Error', 'Release version is required');
      return;
    }

    try {
      const response = await fetch(`/api/boards/${boardId}/releases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `Release ${createFormData.version}`,
          version: createFormData.version.trim(),
          description: createFormData.description.trim() || null,
          releaseDate: createFormData.releaseDate || null,
          status: 'PENDING',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateForm(false);
        setCreateFormData({ version: '', description: '', releaseDate: '' });
        success('Release Created', 'Release has been created successfully');
        fetchData();
      } else {
        showError('Failed to Create Release', data.message || data.error || 'An error occurred while creating the release');
      }
    } catch (error: any) {
      console.error('Failed to create release:', error);
      showError('Failed to Create Release', error.message || 'An error occurred while creating the release');
    }
  };

  const handleReleaseStatus = async (releaseId: string, status: 'PENDING' | 'RELEASED') => {
    try {
      const response = await fetch(`/api/boards/${boardId}/releases/${releaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        success('Release Updated', 'Release status has been updated successfully');
        fetchData();
      } else {
        showError('Failed to Update Release', data.message || data.error || 'An error occurred while updating the release');
      }
    } catch (error: any) {
      console.error('Failed to update release:', error);
      showError('Failed to Update Release', error.message || 'An error occurred while updating the release');
    }
  };

  const handleDeleteRelease = async (releaseId: string) => {
    try {
      // First, remove release version from all tasks
      const release = releases.find(r => r.id === releaseId);
      if (release) {
        const tasksToUpdate = allTasks.filter(t => t.releaseVersion === release.version);
        await Promise.all(
          tasksToUpdate.map(task =>
            fetch(`/api/spaces/${spaceSlug}/tasks/${task.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ releaseVersion: null }),
            })
          )
        );
      }

      const response = await fetch(`/api/boards/${boardId}/releases/${releaseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        success('Release Deleted', 'Release has been deleted successfully');
        fetchData();
      } else {
        showError('Failed to Delete Release', data.message || data.error || 'An error occurred while deleting the release');
      }
    } catch (error: any) {
      console.error('Failed to delete release:', error);
      showError('Failed to Delete Release', error.message || 'An error occurred while deleting the release');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    setActiveTaskId(taskId);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback can be added here if needed
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    const overId = over.id as string;
    
    // Store original state for potential revert
    const originalTasks = [...allTasks];
    const originalReleases = [...releases];
    
    // Find source release (if task is currently in a release)
    const sourceRelease = releases.find(r => r.tasks?.some(t => t.id === taskId));
    const taskSourceReleaseId = sourceRelease?.id;
    
    // Check if dropping on a release
    if (overId.startsWith('release-')) {
      const releaseId = overId.replace('release-', '');
      const targetRelease = releases.find(r => r.id === releaseId);
      
      if (targetRelease) {
        // Check if moving task from one release to another release
        if (taskSourceReleaseId && taskSourceReleaseId !== releaseId) {
          // Moving between releases
          const taskToMove = { ...task, releaseVersion: targetRelease.version };
          
          // Optimistic update: Remove task from source release immediately
          setReleases(prevReleases => prevReleases.map(r => {
            if (r.id === taskSourceReleaseId) {
              const updatedTasks = (r.tasks || []).filter(t => t.id !== taskId);
              const taskCountsByStatus = updateTaskCounts(r.taskCountsByStatus || {}, task.status?.id, -1);
              return {
                ...r,
                tasks: updatedTasks,
                taskCountsByStatus,
              };
            }
            return r;
          }));

          // Optimistic update: Add task to target release immediately
          setReleases(prevReleases => prevReleases.map(r => {
            if (r.id === releaseId) {
              return {
                ...r,
                tasks: [...(r.tasks || []), taskToMove],
                taskCountsByStatus: updateTaskCounts(r.taskCountsByStatus || {}, task.status?.id, 1),
              };
            }
            return r;
          }));

          // Update task's release version in allTasks
          setAllTasks(prevTasks => 
            prevTasks.map(t => 
              t.id === taskId 
                ? { ...t, releaseVersion: targetRelease.version }
                : t
            )
          );

          // Call API in the background (non-blocking)
          setTimeout(async () => {
            try {
              const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ releaseVersion: targetRelease.version }),
              });

              const data = await response.json();
              if (!data.success) {
                // Revert on error
                setAllTasks(originalTasks);
                setReleases(originalReleases);
                showError('Failed to Update Task', data.message || data.error || 'An error occurred while updating the task');
              }
            } catch (error: any) {
              console.error('Failed to update task:', error);
              // Revert on error
              setAllTasks(originalTasks);
              setReleases(originalReleases);
              showError('Failed to Update Task', error.message || 'An error occurred while updating the task');
            }
          }, 0);
        } else {
          // Moving from pending tasks to release
          const taskToMove = { ...task, releaseVersion: targetRelease.version };
          
          // Optimistic update: Add task to release immediately
          setReleases(prevReleases => prevReleases.map(r => {
            if (r.id === releaseId) {
              return {
                ...r,
                tasks: [...(r.tasks || []), taskToMove],
                taskCountsByStatus: updateTaskCounts(r.taskCountsByStatus || {}, task.status?.id, 1),
              };
            }
            return r;
          }));

          // Update task's release version in allTasks
          setAllTasks(prevTasks => 
            prevTasks.map(t => 
              t.id === taskId 
                ? { ...t, releaseVersion: targetRelease.version }
                : t
            )
          );

          // Call API in the background (non-blocking)
          setTimeout(async () => {
            try {
              const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ releaseVersion: targetRelease.version }),
              });

              const data = await response.json();
              if (!data.success) {
                // Revert on error
                setAllTasks(originalTasks);
                setReleases(originalReleases);
                showError('Failed to Update Task', data.message || data.error || 'An error occurred while updating the task');
              }
            } catch (error: any) {
              console.error('Failed to update task:', error);
              // Revert on error
              setAllTasks(originalTasks);
              setReleases(originalReleases);
              showError('Failed to Update Task', error.message || 'An error occurred while updating the task');
            }
          }, 0);
        }
      }
    } else if (overId === 'pending-tasks') {
      // Dropping on pending tasks area - remove from release
      if (taskSourceReleaseId) {
        const taskToMove = { ...task, releaseVersion: null };
        
        // Optimistic update: Remove task from source release immediately
        setReleases(prevReleases => prevReleases.map(r => {
          if (r.id === taskSourceReleaseId) {
            return {
              ...r,
              tasks: (r.tasks || []).filter(t => t.id !== taskId),
              taskCountsByStatus: updateTaskCounts(r.taskCountsByStatus || {}, task.status?.id, -1),
            };
          }
          return r;
        }));

        // Update task's release version in allTasks
        setAllTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === taskId 
              ? { ...t, releaseVersion: null }
              : t
          )
        );

        // Call API in the background (non-blocking)
        setTimeout(async () => {
          try {
            const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ releaseVersion: null }),
            });

            const data = await response.json();
            if (!data.success) {
              // Revert on error
              setAllTasks(originalTasks);
              setReleases(originalReleases);
              showError('Failed to Update Task', data.message || data.error || 'An error occurred while updating the task');
            }
          } catch (error: any) {
            console.error('Failed to update task:', error);
            // Revert on error
            setAllTasks(originalTasks);
            setReleases(originalReleases);
            showError('Failed to Update Task', error.message || 'An error occurred while updating the task');
          }
        }, 0);
      }
    }
  };

  // Helper function to update task counts by status
  const updateTaskCounts = (counts: Record<string, number>, statusId: string | undefined, delta: number): Record<string, number> => {
    if (!statusId) return counts;
    const newCounts = { ...counts };
    newCounts[statusId] = (newCounts[statusId] || 0) + delta;
    if (newCounts[statusId] <= 0) {
      delete newCounts[statusId];
    }
    return newCounts;
  };

  const pendingReleases = releases.filter((r) => r.status === 'PENDING');
  const releasedReleases = releases.filter((r) => r.status === 'RELEASED');
  
  // Filter tasks by status
  const filterTasksByStatus = (tasks: Task[]) => {
    if (selectedStatusFilters.length === 0) return tasks;
    return tasks.filter(task => task.status?.id && selectedStatusFilters.includes(task.status.id));
  };
  
  // Toggle status filter
  const toggleStatusFilter = (statusId: string) => {
    setSelectedStatusFilters(prev => 
      prev.includes(statusId) 
        ? prev.filter(id => id !== statusId)
        : [...prev, statusId]
    );
  };
  
  // Filter releases to show only tasks matching status filter (but keep all releases visible)
  const filterReleases = (releases: Release[]) => {
    return releases.map(release => ({
      ...release,
      tasks: filterTasksByStatus(release.tasks || [])
    }));
  };
  
  const pendingTasks = filterTasksByStatus(allTasks.filter((t) => !t.releaseVersion));
  const filteredPendingReleases = filterReleases(pendingReleases);
  const filteredReleasedReleases = filterReleases(releasedReleases);
  
  // Check if the active drag is from a release (external drag)
  const isExternalDrag = activeTaskId && !allTasks.filter(t => !t.releaseVersion).some(t => t.id === activeTaskId);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const statusMeta = useMemo(() => {
    return statuses.reduce(
      (acc: Record<string, { name: string; color?: string }>, status: any) => {
        acc[status.id] = { name: status.name, color: status.color };
        return acc;
      },
      {},
    );
  }, [statuses]);

  const filterLabel = useMemo(() => {
    if (selectedStatusFilters.length === 0) return 'Filter by status';
    if (selectedStatusFilters.length === 1) {
      return statuses.find((s) => s.id === selectedStatusFilters[0])?.name || '1 status';
    }
    return `${selectedStatusFilters.length} statuses`;
  }, [selectedStatusFilters, statuses]);

  const accent = activeTab === 'pending'
    ? { from: '#EC4899', to: '#DB2777' }
    : { from: '#10B981', to: '#059669' };

  return (
    <div className="relative min-h-full overflow-hidden rounded-3xl border border-[var(--border)]/40 bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--muted)]/20 p-3 sm:p-6">
      <div className="pointer-events-none absolute top-[-120px] right-[-60px] h-72 w-72 rounded-full bg-[#EC4899]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-140px] left-[-60px] h-72 w-72 rounded-full bg-[#5B5FED]/15 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col gap-6">
        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)]/40 bg-[var(--card)]/80 px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex flex-1 min-w-[260px] flex-wrap items-center gap-3 sm:flex-nowrap">
            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border)]/40 bg-[var(--muted)]/40 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                  activeTab === 'pending'
                    ? 'bg-gradient-to-r from-[#EC4899] to-[#DB2777] text-white shadow-lg shadow-[#EC4899]/30'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Pending</span>
                <Badge
                  variant="secondary"
                  className={`text-[11px] ${activeTab === 'pending' ? 'bg-white/20 text-white' : ''}`}
                >
                  {pendingReleases.length}
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('released')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                  activeTab === 'released'
                    ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg shadow-[#10B981]/30'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <PackageCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Released</span>
                <Badge
                  variant="secondary"
                  className={`text-[11px] ${activeTab === 'released' ? 'bg-white/20 text-white' : ''}`}
                >
                  {releasedReleases.length}
                </Badge>
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex h-9 flex-shrink-0 items-center gap-2 rounded-xl border-[var(--border)]/50 bg-[var(--background)]/80 px-3 text-sm"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">{filterLabel}</span>
                  {selectedStatusFilters.length > 0 && (
                    <Badge className="h-5 px-1.5 text-[11px] font-semibold text-white" style={{ background: 'linear-gradient(90deg, #4353FF, #5B5FED)' }}>
                      {selectedStatusFilters.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 rounded-xl border-[var(--border)]/40 bg-[var(--card)]/95 backdrop-blur"
              >
                {statuses.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status.id}
                    checked={selectedStatusFilters.includes(status.id)}
                    onCheckedChange={() => toggleStatusFilter(status.id)}
                    className="capitalize"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: status.color || 'var(--primary)' }}
                      />
                      {status.name}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedStatusFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        setSelectedStatusFilters([]);
                      }}
                      className="text-red-500 focus:text-red-500"
                    >
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            onClick={() => setShowCreateForm(true)}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#4353FF] to-[#5B5FED] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#4353FF]/30 transition hover:scale-[1.01] hover:shadow-xl"
          >
            <span className="absolute inset-0 translate-x-[-100%] bg-white/20 opacity-0 transition group-hover:translate-x-[100%] group-hover:opacity-100" />
            <Plus className="mr-2 h-4 w-4" />
            Create Release
          </Button>
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === 'pending' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {filteredPendingReleases.length > 0 ? (
                <div className="space-y-4">
                  {filteredPendingReleases.map((release) => (
                    <ReleaseCard
                      key={release.id}
                      release={release}
                      spaceTicker={spaceTicker}
                      statusMeta={statusMeta}
                      onRelease={() => handleReleaseStatus(release.id, 'RELEASED')}
                      onDelete={() => handleDeleteRelease(release.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyReleasesState variant="pending" onCreate={() => setShowCreateForm(true)} />
              )}

              <div className="relative overflow-hidden rounded-3xl border border-[var(--border)]/40 bg-[var(--card)]/80 shadow-xl">
                <div
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
                    boxShadow: `0 0 30px ${accent.from}40`,
                  }}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)]/40 px-5 py-4 pt-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent.from }} />
                      All Tasks
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-full border-[var(--border)]/50 text-xs font-semibold"
                    >
                      {pendingTasks.length} task{pendingTasks.length === 1 ? '' : 's'}
                    </Badge>
                  </div>
                  {selectedStatusFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      onClick={() => setSelectedStatusFilters([])}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
                <div className="p-4 sm:p-6">
                  <PendingTasksDroppable accent={accent}>
                    <SortableContext
                      items={isExternalDrag ? [] : pendingTasks.filter((t) => t.id !== activeTaskId).map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {pendingTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            spaceTicker={spaceTicker}
                            isExternalDrag={isExternalDrag}
                          />
                        ))}
                        {pendingTasks.length === 0 && (
                          <div className="rounded-2xl border border-dashed border-[var(--border)]/60 p-8 text-center text-sm text-muted-foreground">
                            No tasks available
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </PendingTasksDroppable>
                </div>
              </div>

              <DragOverlay>
                {activeTaskId && (
                  <Card
                    className="rotate-1 border-2 border-primary/70 bg-[var(--card)]/95 shadow-2xl"
                    style={{ boxShadow: '0 25px 65px -20px rgba(67,83,255,0.45)' }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-muted-foreground">
                            {spaceTicker && allTasks.find((t) => t.id === activeTaskId)?.number
                              ? `${spaceTicker}-${allTasks.find((t) => t.id === activeTaskId)?.number}`
                              : allTasks.find((t) => t.id === activeTaskId)?.number}
                          </span>
                          <span className="font-medium">
                            {allTasks.find((t) => t.id === activeTaskId)?.summary}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </DragOverlay>
            </DndContext>
          ) : filteredReleasedReleases.length > 0 ? (
            <div className="space-y-4">
              {filteredReleasedReleases.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  spaceTicker={spaceTicker}
                  statusMeta={statusMeta}
                  onDelete={() => handleDeleteRelease(release.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyReleasesState variant="released" />
          )}
        </div>
      </div>

      {/* Create Release Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="gap-0 rounded-2xl border border-[var(--border)]/50 bg-[var(--card)]/95 p-0 shadow-2xl">
          <DialogHeader className="border-b border-[var(--border)]/40 px-6 py-4">
            <DialogTitle>Create Release</DialogTitle>
            <DialogDescription>
              Plan your next milestone with a version, date, and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="version" className="text-sm font-medium">
                Release Version <span className="text-red-500">*</span>
              </Label>
              <Input
                id="version"
                value={createFormData.version}
                onChange={(e) => setCreateFormData({ ...createFormData, version: e.target.value })}
                placeholder="e.g., 1.0.0"
                className="rounded-xl border-[var(--border)]/60 bg-[var(--background)]/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="What ships in this release?"
                rows={4}
                className="rounded-2xl border-[var(--border)]/60 bg-[var(--background)]/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="releaseDate" className="text-sm font-medium">
                Release Date
              </Label>
              <Input
                id="releaseDate"
                type="date"
                value={createFormData.releaseDate}
                onChange={(e) => setCreateFormData({ ...createFormData, releaseDate: e.target.value })}
                onClick={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target && 'showPicker' in target) {
                    (target as any).showPicker?.();
                  }
                }}
                className="cursor-pointer rounded-xl border-[var(--border)]/60 bg-[var(--background)]/80 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
              />
            </div>
          </div>
          <DialogFooter className="flex items-center justify-end gap-3 border-t border-[var(--border)]/40 px-6 py-4">
            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRelease}
              disabled={!createFormData.version.trim()}
              className="rounded-xl bg-gradient-to-r from-[#4353FF] to-[#5B5FED] text-white disabled:opacity-50"
            >
              Create Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyReleasesState({
  variant,
  onCreate,
}: {
  variant: 'pending' | 'released';
  onCreate?: () => void;
}) {
  const isPending = variant === 'pending';
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-[var(--border)]/60 bg-[var(--card)]/60 px-6 py-14 text-center shadow-inner backdrop-blur-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]/40 text-[var(--muted-foreground)]">
        {isPending ? <Package className="h-8 w-8" /> : <PackageCheck className="h-8 w-8" />}
      </div>
      <h3 className="text-xl font-semibold text-[var(--foreground)]">
        {isPending ? 'No pending releases' : 'No released versions'}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isPending
          ? 'Create a release to start grouping work by version and tracking what ships next.'
          : 'Once a release ships, mark it as released to keep a historical record.'}
      </p>
      {isPending && onCreate && (
        <Button
          onClick={onCreate}
          className="mt-6 rounded-xl bg-gradient-to-r from-[#4353FF] to-[#5B5FED] text-white shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Release
        </Button>
      )}
    </div>
  );
}

function ReleaseCard({
  release,
  spaceTicker,
  statusMeta,
  onRelease,
  onDelete,
}: {
  release: Release;
  spaceTicker: string;
  statusMeta: Record<string, { name: string; color?: string }>;
  onRelease?: () => void;
  onDelete: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `release-${release.id}`,
    data: { type: 'release', releaseId: release.id },
  });

  const releaseTasks = release.tasks || [];
  const isReleased = release.status === 'RELEASED';
  const accentFrom = isReleased ? '#10B981' : '#EC4899';
  const accentTo = isReleased ? '#059669' : '#DB2777';

  return (
    <Card
      ref={setNodeRef}
      className={`relative overflow-hidden rounded-3xl border border-[var(--border)]/50 bg-[var(--card)]/85 backdrop-blur-sm transition-all duration-300 ${
        isOver ? 'ring-4 ring-offset-2 ring-[var(--primary)]/40' : ''
      } ${isReleased ? 'shadow-[0_20px_60px_-25px_rgba(16,185,129,0.55)]' : 'shadow-[0_25px_60px_-30px_rgba(236,72,153,0.5)]'}`}
    >
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{
          backgroundImage: `linear-gradient(180deg, ${accentFrom}, ${accentTo})`,
          boxShadow: `0 0 30px ${accentFrom}44`,
        }}
      />
      <CardHeader className="pb-0 pr-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Package className="h-4 w-4" />
              {isReleased ? 'Released Version' : 'Planned Release'}
            </div>
            <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              {release.version || release.name.replace(/^Release\s+/i, '')}
            </div>
            <CardDescription className="mt-1 text-sm">
              {release.description || 'No description added yet.'}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {release.releaseDate && (
              <Badge
                variant="outline"
                className="rounded-full border-[var(--border)]/60 text-xs font-semibold"
              >
                Release · {formatDateDDMMYYYY(release.releaseDate)}
              </Badge>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {onRelease && (
                <Button
                  size="sm"
                  className="rounded-lg bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-md"
                  onClick={onRelease}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Release
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-500"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
        {release.taskCountsByStatus && Object.keys(release.taskCountsByStatus).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(release.taskCountsByStatus).map(([statusId, count]) => {
              if (!count) return null;
              const meta = statusMeta[statusId];
              return (
                <Badge
                  key={statusId}
                  variant="outline"
                  className="rounded-full border text-xs font-semibold"
                  style={{
                    borderColor: meta?.color || 'var(--border)',
                    color: meta?.color || 'var(--foreground)',
                    backgroundColor: getStatusTint(meta?.color),
                  }}
                >
                  {(meta?.name || 'Status')} · {count}
                </Badge>
              );
            })}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {releaseTasks.length > 0 ? (
          <div className="space-y-2">
            {releaseTasks.slice(0, 6).map((task) => (
              <ReleaseTaskCard key={task.id} task={task} spaceTicker={spaceTicker} releaseId={release.id} />
            ))}
            {releaseTasks.length > 6 && (
              <p className="text-xs text-muted-foreground">
                +{releaseTasks.length - 6} more task{releaseTasks.length - 6 === 1 ? '' : 's'}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)]/60 bg-[var(--muted)]/30 p-6 text-center text-sm text-muted-foreground">
            Drag tasks here to plan this release
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ReleaseTaskCard = React.memo(function ReleaseTaskCard({
  task,
  spaceTicker,
  releaseId,
}: {
  task: Task;
  spaceTicker: string;
  releaseId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      releaseId: releaseId,
      task: task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-[var(--border)]/50 bg-[var(--background)]/90 p-3 text-sm shadow-sm transition-all hover:border-[var(--primary)]/40 hover:shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-move flex-shrink-0 rounded-full bg-[var(--muted)]/60 p-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <span className="rounded-md bg-[var(--muted)]/40 px-2 py-0.5 font-mono text-xs">
              {spaceTicker && task.number ? `${spaceTicker}-${task.number}` : task.number}
            </span>
            <span className="font-medium">{task.summary}</span>
          </div>
          {task.status && (
            <Badge
              variant="outline"
              className="mt-1 rounded-full text-[11px]"
              style={{
                borderColor: task.status.color || 'var(--border)',
                color: task.status.color || 'var(--foreground)',
                backgroundColor: getStatusTint(task.status.color),
              }}
            >
              {task.status.name}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});

ReleaseTaskCard.displayName = 'ReleaseTaskCard';

function PendingTasksDroppable({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: { from: string; to: string };
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'pending-tasks',
    data: { type: 'pending-tasks' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border border-dashed border-[var(--border)]/60 bg-[var(--background)]/80 p-2 transition-all duration-300 ${
        isOver ? 'shadow-[0_20px_60px_-25px_rgba(91,95,237,0.5)]' : ''
      }`}
      style={
        isOver
          ? {
              boxShadow: `0 25px 65px -30px ${accent.from}70`,
              borderColor: accent.from,
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

const TaskCard = React.memo(function TaskCard({ task, spaceTicker, isExternalDrag = false }: { task: Task; spaceTicker: string; isExternalDrag?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: isExternalDrag
  });

  // When external drag, render static card without sortable refs/attributes
  if (isExternalDrag) {
    return (
      <div className="pointer-events-none rounded-2xl border border-[var(--border)]/60 bg-[var(--card)]/70 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[var(--muted)]/50 p-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">
                {spaceTicker && task.number ? `${spaceTicker}-${task.number}` : task.number}
              </span>
              <span className="font-medium truncate">{task.summary}</span>
            </div>
            {task.status && (
              <Badge
                variant="outline"
                className="mt-1 rounded-full text-[11px]"
                style={{
                  borderColor: task.status.color || 'var(--border)',
                  color: task.status.color || 'var(--foreground)',
                  backgroundColor: getStatusTint(task.status.color),
                }}
              >
                {task.status.name}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-pointer rounded-2xl border border-[var(--border)]/60 bg-[var(--card)]/80 p-4 shadow-sm transition-all hover:border-[var(--primary)]/40 hover:shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move rounded-full bg-[var(--muted)]/50 p-2 text-muted-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              {spaceTicker && task.number ? `${spaceTicker}-${task.number}` : task.number}
            </span>
            <span className="font-medium truncate">{task.summary}</span>
          </div>
          {task.status && (
            <Badge
              variant="outline"
              className="mt-1 rounded-full text-[11px]"
              style={{
                borderColor: task.status.color || 'var(--border)',
                color: task.status.color || 'var(--foreground)',
                backgroundColor: getStatusTint(task.status.color),
              }}
            >
              {task.status.name}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';
