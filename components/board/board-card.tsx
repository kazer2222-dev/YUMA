import React, { useMemo } from 'react';
import { extractTemplateMetadata } from '@/lib/template-metadata';
import { KanbanTaskCard } from '@/components/kanban/kanban-task-card';
import { Task } from './board-types';
import { formatDateDDMMYYYY, getDescriptionExcerpt, sanitizeDescriptionHtml } from './utils';

interface BoardCardProps {
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

const priorityConfig: Record<string, { color: string; label: string }> = {
  HIGHEST: { color: '#EF4444', label: 'Urgent' },
  HIGH: { color: '#FF9800', label: 'High' },
  NORMAL: { color: '#F59E0B', label: 'Medium' },
  LOW: { color: '#6B7280', label: 'Low' },
  LOWEST: { color: '#6B7280', label: 'Low' },
};

interface BoardCardPreviewProps {
  task: Task;
  width: number;
  spaceTicker?: string;
  columnColor?: string;
}

export function BoardCard({
  task,
  isDragging,
  onTaskClick,
  isDragOver = false,
  showDropIndicatorAbove = false,
  spaceTicker,
  columnColor = '#4353FF',
  isActiveDragging = false,
  isGhost = false,
  isDropping = false,
}: BoardCardProps) {
  const {
    ticker,
    descriptionHtml,
    subtitle,
    tags,
    dueDateLabel,
    isOverdue,
    assignee,
    priorityMeta,
  } = useBoardTaskContent(task, spaceTicker);

  const canInteract = Boolean(onTaskClick) && !isDragging;
  const interactive = !isGhost && canInteract;

  const handleCardClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    onTaskClick?.(task.id, false);
  };

  const handleTaskNumberClick = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    onTaskClick?.(task.id, true);
  };

  return (
    <>
      {showDropIndicatorAbove && <div className="h-0.5 bg-primary rounded-full my-1" />}
      <div
        style={{
          opacity: isActiveDragging ? 0.4 : isGhost ? 0.6 : 1,
          cursor: isActiveDragging ? 'grabbing' : 'grab',
          transform: isActiveDragging ? 'rotate(3deg)' : 'none',
        }}
        className={`relative transition-all duration-200 ${
          isActiveDragging ? 'scale-105 shadow-2xl' : ''
        } ${isGhost ? 'pointer-events-none' : ''}`}
      >
        {isActiveDragging && (
          <div className="absolute inset-0 border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--muted)]/20 pointer-events-none z-0" />
        )}
        <div
          data-task-id={task.id}
          onClick={interactive ? handleCardClick : undefined}
        >
          <KanbanTaskCard
            ticker={ticker}
            title={task.summary}
            descriptionHtml={descriptionHtml}
            subtitle={subtitle}
            tags={tags}
            dueDateLabel={dueDateLabel}
            isOverdue={isOverdue}
            assignee={assignee}
            priority={priorityMeta}
            columnColor={columnColor}
            showCheckbox
            onTickerClick={handleTaskNumberClick}
            isHighlighted={isDragOver}
          />
        </div>
      </div>
    </>
  );
}

export function BoardCardPreview({
  task,
  width,
  spaceTicker,
  columnColor = '#4353FF',
}: BoardCardPreviewProps) {
  const {
    ticker,
    descriptionHtml,
    subtitle,
    tags,
    dueDateLabel,
    isOverdue,
    assignee,
    priorityMeta,
  } = useBoardTaskContent(task, spaceTicker);

  return (
    <div
      className="cursor-grabbing bg-gradient-to-br from-[var(--background)] to-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl opacity-95 rotate-3 scale-105"
      style={{
        width: `${width}px`,
        maxWidth: `${width}px`,
        minWidth: `${width}px`,
      }}
    >
      <KanbanTaskCard
        ticker={ticker}
        title={task.summary}
        descriptionHtml={descriptionHtml}
        subtitle={subtitle}
        tags={tags}
        dueDateLabel={dueDateLabel}
        isOverdue={isOverdue}
        assignee={assignee}
        priority={priorityMeta}
        columnColor={columnColor}
        showCheckbox
        dragHandleVisible={false}
      />
    </div>
  );
}

function useBoardTaskContent(task: Task, spaceTicker?: string) {
  const cleanedDescription = useMemo(() => {
    if (!task.description) return '';
    const { description: cleaned } = extractTemplateMetadata(task.description);
    return cleaned;
  }, [task.description]);

  const descriptionExcerpt = useMemo(() => getDescriptionExcerpt(cleanedDescription), [cleanedDescription]);
  const sanitizedDescription = useMemo(
    () => sanitizeDescriptionHtml(cleanedDescription),
    [cleanedDescription],
  );

  const ticker = useMemo(() => {
    if (!spaceTicker || !task.number) return undefined;
    return `${spaceTicker}-${task.number}`;
  }, [spaceTicker, task.number]);

  const tags = useMemo(() => {
    return (task.tags || []).map((tag) => ({ label: tag }));
  }, [task.tags]);

  const dueDateLabel = task.dueDate ? formatDateDDMMYYYY(task.dueDate) : undefined;
  const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;
  const priorityMeta = priorityConfig[task.priority] || priorityConfig['NORMAL'];

  const assignee = task.assignee
    ? {
        avatar: task.assignee.avatar,
        name: task.assignee.name,
        email: task.assignee.email,
      }
    : undefined;

  return {
    ticker,
    descriptionHtml: sanitizedDescription || undefined,
    subtitle: sanitizedDescription ? undefined : descriptionExcerpt,
    tags,
    dueDateLabel,
    isOverdue,
    assignee,
    priorityMeta,
  };
}
