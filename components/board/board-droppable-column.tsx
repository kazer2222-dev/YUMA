'use client';

import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Status, Task } from './board-types';
import { getStatusColor } from './utils';
import { BoardDraggableCard } from './board-draggable-card';

interface BoardDroppableColumnProps {
  status: Status;
  tasks: Task[];
  moveTask: (taskId: string, fromColumn: string, toColumn: string, toIndex: number) => void;
  onTaskClick?: (taskId: string, isTaskNumberClick?: boolean) => void;
  onCreateTask?: (statusId: string) => void;
  onEditStatus?: (status: Status) => void;
  onTaskDrop?: (payload: { taskId: string; fromColumnId: string; toColumnId: string }) => void;
  spaceTicker?: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function BoardDroppableColumn({
  status,
  tasks,
  moveTask,
  onTaskClick,
  onCreateTask,
  onEditStatus,
  onTaskDrop,
  spaceTicker,
  onDragStart,
  onDragEnd,
}: BoardDroppableColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const columnColor = getStatusColor(status);

  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: "TASK_CARD",
    drop: (item: { id: string; columnId: string; index: number; task: Task }, monitor) => {
      const fromColumnId = item.columnId;
      const toColumnId = status.id;
      
      if (monitor.didDrop()) {
        return;
      }
      
      moveTask(item.id, fromColumnId, toColumnId, tasks.length);
      
      if (onTaskDrop && fromColumnId !== toColumnId) {
        setTimeout(() => {
          onTaskDrop({
            taskId: item.id,
            fromColumnId,
            toColumnId,
          });
        }, 100);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem(),
    }),
  });

  drop(ref);

  const showPlaceholder = isOver && canDrop && draggedItem && (draggedItem as any).columnId !== status.id;

  return (
    <div className="flex-shrink-0 w-72 sm:w-80 group">
      <div
        ref={ref}
        className={`flex flex-col bg-gradient-to-b from-[var(--card)] to-[var(--card)]/80 dark:from-[var(--card)] dark:to-[var(--background)] rounded-xl border backdrop-blur-sm h-full relative z-10 ${
          showPlaceholder ? 'border-2 shadow-2xl transition-all duration-150' : 'border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-300'
        }`}
        style={
          showPlaceholder
            ? {
                borderColor: columnColor,
                boxShadow: `0 0 20px ${columnColor}40, 0 8px 32px rgba(0,0,0,0.12)`,
                backgroundColor: `${columnColor}05`,
              }
            : undefined
        }
      >
        <div className="relative">
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
            style={{
              background: `linear-gradient(90deg, ${columnColor}, ${columnColor}80)`,
              boxShadow: `0 0 10px ${columnColor}40`,
            }}
          />
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] mt-1">
            <div className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: columnColor,
                  boxShadow: `0 0 8px ${columnColor}80`,
                }}
              />
              <span className="text-[var(--foreground)]">{status.name}</span>
              <span
                className="text-xs px-2 py-1 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: `${columnColor}15`,
                  color: columnColor,
                  border: `1px solid ${columnColor}30`,
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

        <div className="flex-1 p-3 space-y-3 min-h-[200px] relative z-20">
          {showPlaceholder && (
            <div className="absolute inset-0 rounded-xl pointer-events-none z-10 animate-in fade-in duration-150">
              <div
                className="absolute inset-0 rounded-xl border-2 border-dashed animate-pulse"
                style={{
                  borderColor: columnColor,
                  backgroundColor: `${columnColor}08`
                }}
              />
            </div>
          )}

          {tasks.length > 0 ? (
            tasks.map((task, taskIndex) => (
              <div
                key={task.id}
                style={{
                  animation: `slideIn 0.3s ease-out ${taskIndex * 0.05}s both`
                }}
              >
                <BoardDraggableCard
                  task={task}
                  columnId={status.id}
                  index={taskIndex}
                  moveTask={moveTask}
                  columnColor={columnColor}
                  spaceTicker={spaceTicker}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onTaskClick={onTaskClick}
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-[var(--muted-foreground)] rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/30 transition-all duration-300 cursor-pointer group/empty min-h-[200px] px-4 py-8">
              <div
                className="w-16 h-16 mb-4 rounded-full flex items-center justify-center transition-all duration-300 group-hover/empty:scale-110 flex-shrink-0"
                style={{
                  backgroundColor: `${columnColor}10`,
                  border: `2px dashed ${columnColor}30`,
                }}
              >
                <Plus className="w-8 h-8 opacity-30 group-hover/empty:opacity-60 transition-opacity" />
              </div>
              <p className="text-sm font-medium text-center">Drop tasks here</p>
              <p className="text-xs mt-1.5 opacity-60 text-center">or click to add</p>
            </div>
          )}
        </div>

        <div className="p-3 pt-0 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 hover:bg-[var(--muted)] rounded-lg transition-all duration-200 opacity-60 hover:opacity-100"
            style={{
              borderTop: `1px solid ${columnColor}10`,
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












