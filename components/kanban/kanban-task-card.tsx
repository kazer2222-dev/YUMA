'use client';

import React from 'react';
import { Calendar as CalendarIcon, Flag, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

export interface KanbanTaskTag {
  label: string;
  color?: string;
}

export interface KanbanTaskCardPriority {
  label: string;
  color: string;
}

export interface KanbanTaskCardAssignee {
  avatar?: string | null;
  name?: string | null;
  email?: string | null;
  initials?: string | null;
}

export interface KanbanTaskCardProps {
  ticker?: string;
  title: string;
  subtitle?: string;
  descriptionHtml?: string;
  tags?: KanbanTaskTag[];
  dueDateLabel?: string;
  isOverdue?: boolean;
  priority?: KanbanTaskCardPriority;
  assignee?: KanbanTaskCardAssignee;
  columnColor?: string;
  showCheckbox?: boolean;
  onTickerClick?: (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void;
  checkboxProps?: React.ComponentProps<typeof Checkbox>;
  dragHandleVisible?: boolean;
  isHighlighted?: boolean;
}

export function KanbanTaskCard({
  ticker,
  title,
  subtitle,
  descriptionHtml,
  tags = [],
  dueDateLabel,
  isOverdue = false,
  priority,
  assignee,
  columnColor = '#4353FF',
  showCheckbox = true,
  onTickerClick,
  checkboxProps,
  dragHandleVisible = true,
  isHighlighted = false,
}: KanbanTaskCardProps) {
  const displayTags = tags.slice(0, 3);
  const remainingTags = tags.length > 3 ? tags.length - 3 : 0;

  const assigneeInitial =
    assignee?.initials ||
    assignee?.name?.charAt(0)?.toUpperCase() ||
    assignee?.email?.charAt(0)?.toUpperCase() ||
    '';

  return (
    <div
      className={`group/card relative bg-gradient-to-br from-[var(--background)] to-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:shadow-xl hover:border-[var(--primary)]/40 cursor-pointer overflow-hidden ${
        isHighlighted ? 'ring-4 ring-primary ring-offset-2 shadow-xl bg-primary/10' : ''
      }`}
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
      }}
      onMouseDown={(e) => {
        if (e.button === 0) {
          e.stopPropagation();
        }
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover/card:w-1.5"
        style={{
          background: `linear-gradient(180deg, ${columnColor}, ${columnColor}60)`,
        }}
      />

      {dragHandleVisible && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/card:opacity-30 transition-opacity cursor-grab active:cursor-grabbing z-10">
          <GripVertical className="w-4 h-4 text-[var(--muted-foreground)]" />
        </div>
      )}

      <div className="space-y-3 pl-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {showCheckbox && (
              <Checkbox
                className="shrink-0 mt-0.5"
                {...checkboxProps}
                onClick={(e) => {
                  checkboxProps?.onClick?.(e);
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
            )}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {ticker && (
                  <span
                    data-task-number
                    onClick={(e) => {
                      e.stopPropagation();
                      onTickerClick?.(e);
                    }}
                    className="text-xs px-2 py-0.5 rounded-md transition-all cursor-pointer hover:underline"
                    style={{
                      backgroundColor: `${columnColor}15`,
                      color: columnColor,
                      fontFamily: 'monospace',
                    }}
                  >
                    {ticker}
                  </span>
                )}
                {priority && (
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
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-[var(--foreground)] leading-snug group-hover/card:text-[var(--primary)] transition-colors">
            {title}
          </h4>
          {descriptionHtml ? (
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
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : subtitle ? (
            <p className="text-sm text-[var(--muted-foreground)] line-clamp-3">{subtitle}</p>
          ) : null}
        </div>

        {displayTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {displayTags.map((tag, index) => (
              <Badge
                key={`${tag.label}-${index}`}
                variant="outline"
                className="px-2.5 py-0.5 text-xs rounded-full hover:scale-105 transition-transform"
                style={
                  tag.color
                    ? {
                        borderColor: `${tag.color}40`,
                        color: tag.color,
                        backgroundColor: `${tag.color}10`,
                      }
                    : undefined
                }
              >
                {tag.label}
              </Badge>
            ))}
            {remainingTags > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingTags}
              </Badge>
            )}
          </div>
        )}

        {(dueDateLabel || assignee) && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]/50">
            {dueDateLabel ? (
              <div
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all ${
                  isOverdue ? 'bg-red-500/10 text-red-500' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{dueDateLabel}</span>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {assignee && (
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 border-2 border-[var(--background)] shadow-sm hover:scale-110 transition-transform">
                  {assignee.avatar ? (
                    <AvatarImage src={assignee.avatar} alt={assignee.name || assignee.email || 'Assignee'} />
                  ) : (
                    <AvatarFallback
                      className="text-xs text-white"
                      style={{
                        background: `linear-gradient(135deg, ${columnColor}, ${columnColor}cc)`,
                      }}
                    >
                      {assigneeInitial}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
        style={{
          background: `radial-gradient(circle at top left, ${columnColor}08, transparent 70%)`,
        }}
      />
    </div>
  );
}

