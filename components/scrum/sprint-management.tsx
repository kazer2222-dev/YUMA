'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/loading';
import { BoardConfiguration } from '@/components/board/board-configuration';
import { formatDateDDMMYYYY } from '@/lib/utils';
import { SprintBoard, SprintBoardColumn } from './sprint-board';

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  state: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
    completionPercentage: number;
  };
  tasks?: any[];
}

interface SprintManagementProps {
  boardId: string;
  spaceSlug: string;
}

interface BoardStatus {
  id: string;
  name: string;
  key: string;
  color?: string;
  order: number;
  isStart: boolean;
  isDone: boolean;
  hidden?: boolean;
}

const FALLBACK_COLORS = ['#6B7280', '#F59E0B', '#4353FF', '#8B5CF6', '#10B981', '#EC4899'];

function getInitials(name?: string, email?: string) {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}

function mapPriority(priority?: string) {
  if (!priority) return undefined;
  const normalized = priority.toUpperCase();
  switch (normalized) {
    case 'HIGHEST':
      return 'urgent';
    case 'HIGH':
      return 'high';
    case 'LOW':
    case 'LOWEST':
      return 'low';
    default:
      return 'medium';
  }
}

function parseTags(tags: any) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags
      .filter((tag) => !!tag)
      .map((tag) =>
        typeof tag === 'string'
          ? { label: tag, color: 'default' }
          : { label: tag.label ?? String(tag), color: tag.color ?? 'default' },
      );
  }

  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return parseTags(parsed);
    } catch {
      return [];
    }
  }

  return [];
}

export function SprintManagement({ boardId, spaceSlug }: SprintManagementProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [statuses, setStatuses] = useState<BoardStatus[]>([]);

  useEffect(() => {
    fetchSprints();
    fetchStatuses();
  }, [boardId]);

  const fetchStatuses = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}/statuses`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setStatuses(data.statuses || []);
      }
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    }
  };

  const fetchSprints = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/boards/${boardId}/sprints`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setSprints(data.sprints);
        // Auto-select active sprint if exists
        const activeSprint = data.sprints.find((s: Sprint) => s.state === 'ACTIVE');
        if (activeSprint) {
          setSelectedSprintId(activeSprint.id);
        } else if (data.sprints.length > 0) {
          // Select first sprint if no active sprint
          setSelectedSprintId(data.sprints[0].id);
        } else {
          setSelectedSprintId(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSprintAction = async (sprintId: string, action: 'start' | 'end' | 'reopen') => {
    try {
      const response = await fetch(`/api/boards/${boardId}/sprints/${sprintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (data.success) {
        fetchSprints();
        if (action === 'start') {
          setSelectedSprintId(sprintId);
        }
      }
    } catch (error) {
      console.error('Failed to update sprint:', error);
    }
  };

  const activeSprint = useMemo(() => sprints.find((s) => s.state === 'ACTIVE'), [sprints]);
  const selectedSprint = useMemo(
    () => sprints.find((s) => s.id === selectedSprintId) || activeSprint,
    [sprints, selectedSprintId, activeSprint],
  );

  // Build columns from statuses and tasks
  const columns = useMemo(() => {
    if (!statuses.length || !selectedSprint) {
      return [];
    }

    const visibleStatuses = [...statuses]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .filter((status) => !status.hidden);

    const columnMap = new Map<string, SprintBoardColumn>();
    const baseColumns = visibleStatuses.map((status, index) => {
      const column: SprintBoardColumn = {
        id: status.id,
        title: status.name,
        color: status.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        tasks: [],
        key: status.key,
        isStart: status.isStart,
        isDone: status.isDone,
        visible: true,
      };
      columnMap.set(status.id, column);
      return column;
    });

    const fallbackColumn = baseColumns[0];
    const tasks = Array.isArray(selectedSprint.tasks) ? selectedSprint.tasks : [];

    tasks.forEach((task: any) => {
      const targetColumn = columnMap.get(task.status?.id) || fallbackColumn;
      if (!targetColumn) return;
      targetColumn.tasks.push({
        id: task.id,
        title: task.summary || 'Untitled task',
        subtitle: task.status?.name || '',
        dueDate: task.dueDate ? formatDateDDMMYYYY(task.dueDate) : undefined,
        assignee: getInitials(task.assignee?.name, task.assignee?.email),
        priority: mapPriority(task.priority),
        tags: parseTags(task.tags),
        columnColor: targetColumn.color,
      });
    });

    return baseColumns;
  }, [selectedSprint, statuses]);

  const handleTaskDropPersist = async ({
    taskId,
    fromColumnId,
    toColumnId,
  }: {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
  }) => {
    if (!selectedSprint) return;
    if (fromColumnId === toColumnId) return;

    try {
      // Use requestIdleCallback or setTimeout to avoid blocking UI
      const updateTask = async () => {
        const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            statusId: toColumnId,
            sprintId: selectedSprint.id,
          }),
        });
        
        if (response.ok) {
          // Debounce the refresh to avoid multiple rapid calls
          // Only refresh after a delay to ensure drag operation is complete
          setTimeout(() => {
            fetchSprints();
          }, 500);
        }
      };

      // Defer the API call to avoid blocking the UI
      // Use a longer delay to ensure drag operation completes
      setTimeout(updateTask, 300);
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Only refresh on error after a delay
      setTimeout(() => {
        fetchSprints();
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Board Configuration Dialog */}
      <BoardConfiguration
        boardId={boardId}
        open={configOpen}
        onOpenChange={setConfigOpen}
        onStatusesUpdated={() => {
          fetchStatuses();
          fetchSprints();
        }}
      />

      {/* Sprint Board */}
      {selectedSprint ? (
        <div className="flex-1 min-h-0">
          <SprintBoard
            columns={columns}
            loading={loading}
            sprintName={selectedSprint.name}
            onCompleteSprint={
              selectedSprint.state === 'ACTIVE'
                ? () => handleSprintAction(selectedSprint.id, 'end')
                : undefined
            }
            onOpenBoardConfig={() => setConfigOpen(true)}
            onTaskDrop={handleTaskDropPersist}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-[var(--muted-foreground)]">
            {sprints.length === 0
              ? 'No sprints created yet. Create your first sprint to get started.'
              : 'Select a sprint to view its board.'}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
