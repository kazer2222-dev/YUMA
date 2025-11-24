import React, { Fragment, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Status, Task } from './board-types';
import { BoardCard } from './board-card';

interface BoardColumnProps {
  status: Status;
  tasks: Task[];
  isDragging: boolean;
  isDropping?: boolean;
  onTaskClick?: (taskId: string, isTaskNumberClick?: boolean) => void;
  onCreateTask?: (statusId: string) => void;
  onEditStatus?: (status: Status) => void;
  onColumnRef?: (id: string, element: HTMLElement | null) => void;
  dragOverStatusId?: string | null;
  dragOverTaskId?: string | null;
  dropPosition?: number | null;
  spaceTicker?: string;
  activeTask?: Task | null;
  activeTaskColumnId?: string | null;
}

const deriveColumnColor = (status: Status) => {
  const name = status.name.toLowerCase();
  if (name.includes('new')) return '#7D8089';
  if (name.includes('backlog')) return '#F59E0B';
  if (name.includes('to do') || name.includes('todo')) return '#4353FF';
  if (name.includes('in progress') || name.includes('progress')) return '#8B5CF6';
  if (name.includes('review')) return '#10B981';
  return status.color || '#7D8089';
};

export function BoardColumn({
  status,
  tasks,
  isDragging,
  isDropping = false,
  onTaskClick,
  onCreateTask,
  onEditStatus,
  onColumnRef,
  dragOverStatusId,
  dragOverTaskId,
  dropPosition,
  spaceTicker,
  activeTask,
  activeTaskColumnId,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: {
      type: 'status',
      statusId: status.id,
    },
  });

  useEffect(() => {
    return () => {
      if (onColumnRef) {
        onColumnRef(status.id, null);
      }
    };
  }, [onColumnRef, status.id]);

  const columnColor = deriveColumnColor(status);
  const isDraggingFromDifferentColumn = Boolean(activeTask && activeTaskColumnId && activeTaskColumnId !== status.id);
  const isDragOverColumn = isOver || dragOverStatusId === status.id;
  const showColumnDropIndicator = isDragOverColumn && isDraggingFromDifferentColumn;
  const showColumnHover = (isOver || dragOverStatusId === status.id) && Boolean(activeTask);

  return (
    <div className="flex-shrink-0 w-72 sm:w-80 group">
      <div
        ref={(node) => {
          if (setNodeRef) {
            setNodeRef(node);
          }
          if (onColumnRef) {
            onColumnRef(status.id, node);
          }
        }}
        className={`flex flex-col bg-gradient-to-b from-[var(--card)] to-[var(--card)]/80 dark:from-[var(--card)] dark:to-[var(--background)] rounded-xl border backdrop-blur-sm h-full relative z-10 ${
          showColumnHover ? 'border-2 shadow-2xl transition-all duration-150' : 'border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-300'
        }`}
        style={
          showColumnHover
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
          {showColumnDropIndicator && (
            <div className="absolute inset-0 rounded-xl pointer-events-none z-10 animate-in fade-in duration-150">
              <div
                className="absolute inset-0 rounded-xl border-2 border-dashed"
                style={{
                  borderColor: columnColor,
                  backgroundColor: `${columnColor}10`,
                  animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            </div>
          )}

          {isDragging && tasks.length === 0 && <div className="absolute inset-0 pointer-events-none" />}

          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.length > 0 ? (
              tasks.map((task, taskIndex) => {
                const isDropPositionTop = dropPosition !== null && dropPosition === taskIndex;
                const isDropPositionBottom = dropPosition !== null && dropPosition === taskIndex + 1;
                const showGhostPlaceholderTop =
                  activeTask &&
                  activeTask.id !== task.id &&
                  isDraggingFromDifferentColumn &&
                  dragOverStatusId === status.id &&
                  isDropPositionTop;
                const showGhostPlaceholderBottom =
                  activeTask &&
                  activeTask.id !== task.id &&
                  isDraggingFromDifferentColumn &&
                  dragOverStatusId === status.id &&
                  isDropPositionBottom;
                const showDropIndicatorTop = isDropPositionTop && !showGhostPlaceholderTop;
                const showDropIndicatorBottom = isDropPositionBottom && !showGhostPlaceholderBottom;

                return (
                  <Fragment key={`task-wrapper-${task.id}`}>
                    {showGhostPlaceholderTop && activeTask && (
                      <div
                        className="mb-3 opacity-40 scale-[0.98] pointer-events-none"
                        style={{
                          animation: 'fadeIn 0.2s ease-out',
                          filter: 'blur(0.5px) grayscale(0.3)',
                        }}
                      >
                        <div
                          className="border-2 border-dashed rounded-xl overflow-hidden relative"
                          style={{
                            borderColor: columnColor,
                            backgroundColor: `${columnColor}15`,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 z-10" />
                          <BoardCard
                            task={activeTask}
                            isDragging={false}
                            onTaskClick={undefined}
                            isDragOver={false}
                            showDropIndicatorAbove={false}
                            spaceTicker={spaceTicker}
                            columnColor={columnColor}
                            isGhost
                          />
                        </div>
                      </div>
                    )}

                    {showDropIndicatorTop && (
                      <div
                        className="absolute -top-1 left-0 right-0 h-0.5 z-50 rounded-full pointer-events-none"
                        style={{
                          backgroundColor: columnColor,
                          boxShadow: `0 0 8px ${columnColor}`,
                        }}
                      />
                    )}

                    <div
                      style={{
                        animation: `slideIn 0.3s ease-out ${taskIndex * 0.05}s both`,
                      }}
                      className="relative"
                    >
                      <BoardCard
                        task={task}
                        isDragging={isDragging || isDropping}
                        onTaskClick={onTaskClick}
                        isDragOver={dragOverStatusId === status.id && dragOverTaskId === task.id}
                        showDropIndicatorAbove={false}
                        spaceTicker={spaceTicker}
                        columnColor={columnColor}
                        isActiveDragging={activeTask?.id === task.id}
                        isDropping={isDropping && activeTask?.id === task.id}
                      />
                    </div>

                    {showGhostPlaceholderBottom && activeTask && (
                      <div
                        className="mt-3 opacity-40 scale-[0.98] pointer-events-none"
                        style={{
                          animation: 'fadeIn 0.2s ease-out',
                          filter: 'blur(0.5px) grayscale(0.3)',
                        }}
                      >
                        <div
                          className="border-2 border-dashed rounded-xl overflow-hidden relative"
                          style={{
                            borderColor: columnColor,
                            backgroundColor: `${columnColor}15`,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 z-10" />
                          <BoardCard
                            task={activeTask}
                            isDragging={false}
                            onTaskClick={undefined}
                            isDragOver={false}
                            showDropIndicatorAbove={false}
                            spaceTicker={spaceTicker}
                            columnColor={columnColor}
                            isGhost
                          />
                        </div>
                      </div>
                    )}

                    {showDropIndicatorBottom && (
                      <div
                        className="absolute -bottom-1 left-0 right-0 h-0.5 z-50 rounded-full pointer-events-none"
                        style={{
                          backgroundColor: columnColor,
                          boxShadow: `0 0 8px ${columnColor}`,
                        }}
                      />
                    )}
                  </Fragment>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-[var(--muted-foreground)] rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/30 transition-all duration-300 cursor-pointer group/empty min-h-[200px]">
                <div
                  className="w-16 h-16 mb-3 rounded-full flex items-center justify-center transition-all duration-300 group-hover/empty:scale-110"
                  style={{
                    backgroundColor: `${columnColor}10`,
                    border: `2px dashed ${columnColor}30`,
                  }}
                >
                  <Plus className="w-8 h-8 opacity-30 group-hover/empty:opacity-60 transition-opacity" />
                </div>
                <p className="text-sm">Drop tasks here</p>
                <p className="text-xs mt-1 opacity-60">or click to add</p>
              </div>
            )}
          </SortableContext>
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
