'use client';

import { Calendar, Flag, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

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
  
  return (
    <div 
      className="group/card relative bg-gradient-to-br from-[var(--background)] to-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:shadow-xl hover:border-[var(--primary)]/40 transition-all duration-300 cursor-pointer overflow-hidden"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
      onMouseDown={(e) => {
        // Prevent any default behaviors that might cause page refresh
        e.stopPropagation();
      }}
    >
      {/* Accent Border on Left */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover/card:w-1.5"
        style={{ 
          background: `linear-gradient(180deg, ${columnColor}, ${columnColor}60)`,
        }}
      />

      {/* Drag Handle - appears on hover */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/card:opacity-30 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-[var(--muted-foreground)]" />
      </div>

      <div className="space-y-3 pl-2">
        {/* Header: ID, Checkbox, Priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Checkbox 
              className="shrink-0 mt-0.5" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span 
                  className="text-xs px-2 py-0.5 rounded-md transition-all"
                  style={{
                    backgroundColor: `${columnColor}15`,
                    color: columnColor,
                    fontFamily: 'monospace'
                  }}
                >
                  {id}
                </span>
                {priority && (
                  <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs transition-all"
                    style={{
                      backgroundColor: `${priorityConfig[priority].color}15`,
                      color: priorityConfig[priority].color
                    }}
                  >
                    <Flag 
                      className="w-3 h-3" 
                      fill={priorityConfig[priority].color}
                    />
                    <span>{priorityConfig[priority].label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-1.5">
          <h4 className="text-[var(--foreground)] leading-snug group-hover/card:text-[var(--primary)] transition-colors">
            {title}
          </h4>
          {subtitle && (
            <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="px-2.5 py-0.5 text-xs rounded-full hover:scale-105 transition-transform"
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer: Date and Assignee */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]/50">
          {dueDate ? (
            <div 
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all ${
                isOverdue 
                  ? 'bg-red-500/10 text-red-500' 
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{dueDate}</span>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-2">
            {assignee && (
              <Avatar className="h-7 w-7 border-2 border-[var(--background)] shadow-sm hover:scale-110 transition-transform">
                <div 
                  className="w-full h-full flex items-center justify-center text-xs text-white"
                  style={{ 
                    background: `linear-gradient(135deg, ${columnColor}, ${columnColor}cc)` 
                  }}
                >
                  {assignee}
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
    </div>
  );
}

