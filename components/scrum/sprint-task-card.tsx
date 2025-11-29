'use client';

import { KanbanTaskCard } from '@/components/kanban/kanban-task-card';

export type SprintTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SprintTaskTag {
  label: string;
  color: string;
}

export interface SprintTaskCardProps {
  id: string;
  title: string;
  subtitle?: string;
  dueDate?: string;
  assignee?: string;
  priority?: SprintTaskPriority;
  tags?: SprintTaskTag[];
  columnColor?: string;
}

const priorityConfig: Record<
  SprintTaskPriority,
  { color: string; label: string }
> = {
  low: { color: '#6B7280', label: 'Low' },
  medium: { color: '#F59E0B', label: 'Medium' },
  high: { color: '#FF9800', label: 'High' },
  urgent: { color: '#EF4444', label: 'Urgent' },
};

export function SprintTaskCard({
  id,
  title,
  subtitle,
  dueDate,
  assignee,
  priority,
  tags = [],
  columnColor = '#4353FF',
}: SprintTaskCardProps) {
  const isOverdue =
    dueDate &&
    new Date(dueDate.split('/').reverse().join('-')) < new Date();

  const priorityMeta = priority ? priorityConfig[priority] : undefined;

  return (
    <KanbanTaskCard
      ticker={id}
      title={title}
      subtitle={subtitle}
      tags={tags}
      dueDateLabel={dueDate}
      isOverdue={Boolean(isOverdue)}
      assignee={assignee ? { initials: assignee } : undefined}
      priority={priorityMeta}
      columnColor={columnColor}
    />
  );
}

