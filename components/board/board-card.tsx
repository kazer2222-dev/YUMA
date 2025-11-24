import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Flag, Calendar as CalendarIcon, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { extractTemplateMetadata } from '@/lib/template-metadata';
import { Task } from './board-types';
import { formatDateDDMMYYYY, sanitizeDescriptionHtml } from './utils';

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isCardDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      taskId: task.id,
      statusId: task.status.id,
    },
    disabled: isDragging,
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

  const priority = priorityConfig[task.priority] || priorityConfig['NORMAL'];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
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
        style={{
          opacity: isActiveDragging ? 0.4 : 1,
          cursor: 'grab',
          transform: isActiveDragging ? 'rotate(3deg)' : 'none',
        }}
        className={`relative transition-all duration-200 ${
          isActiveDragging ? 'scale-105 shadow-2xl' : ''
        }`}
        onMouseDown={(e) => {
          // Prevent default to avoid any navigation or form submission
          if (e.button === 0) {
            e.stopPropagation();
          }
        }}
        {...(!isCardDragging ? attributes : {})}
        {...(!isCardDragging ? listeners : {})}
      >
        {/* Placeholder when dragging */}
        {isActiveDragging && (
          <div className="absolute inset-0 border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--muted)]/20 pointer-events-none z-0" />
        )}
        <div
          data-task-id={task.id}
          className={`group/card relative bg-gradient-to-br from-[var(--background)] to-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:shadow-xl hover:border-[var(--primary)]/40 cursor-pointer overflow-hidden ${
            isDragOver ? 'ring-4 ring-primary ring-offset-2 shadow-xl bg-primary/10' : ''
          }`}
          style={{
            ...style,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: isActiveDragging || isDragging || isDropping ? 'none' : 'all 0.2s ease',
          }}
          onClick={handleClick}
        >
        <div
          className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover/card:w-1.5"
          style={{
            background: `linear-gradient(180deg, ${columnColor}, ${columnColor}60)`
          }}
        />

        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/card:opacity-30 transition-opacity cursor-grab active:cursor-grabbing z-10">
          <GripVertical className="w-4 h-4 text-[var(--muted-foreground)]" />
        </div>

        <div className="space-y-3 pl-2">
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
                        fontFamily: 'monospace',
                      }}
                    >
                      {spaceTicker}-{task.number}
                    </span>
                  )}
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs transition-all"
                    style={{
                      backgroundColor: `${priority.color}15`,
                      color: priority.color,
                    }}
                  >
                    <Flag className="w-3 h-3" fill={priority.color} />
                    <span>{priority.label}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          {task.tags && task.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {task.tags.slice(0, 3).map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="px-2.5 py-0.5 text-xs rounded-full hover:scale-105 transition-transform">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">+{task.tags.length - 3}</Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]/50">
            {task.dueDate ? (
              <div
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all ${
                  isOverdue ? 'bg-red-500/10 text-red-500' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
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
                  {task.assignee.avatar ? (
                    <AvatarImage src={task.assignee.avatar} alt={task.assignee.name || task.assignee.email} />
                  ) : (
                    <AvatarFallback
                      className="text-xs text-white"
                      style={{
                        background: `linear-gradient(135deg, ${columnColor}, ${columnColor}cc)`,
                      }}
                    >
                      {task.assignee.name ? task.assignee.name.charAt(0).toUpperCase() : task.assignee.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              )}
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle at top left, ${columnColor}08, transparent 70%)`,
          }}
        />
        </div>
      </div>
    </>
  );
}
