import React, { Fragment, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanColumnShell } from '@/components/kanban/kanban-column-shell';
import { Status, Task } from './board-types';
import { BoardCard } from './board-card';
import { getStatusColor } from './utils';

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

  const columnColor = getStatusColor(status);
  const isDraggingFromDifferentColumn = Boolean(activeTask && activeTaskColumnId && activeTaskColumnId !== status.id);
  const isDragOverColumn = isOver || dragOverStatusId === status.id;
  const showColumnDropIndicator = isDragOverColumn && isDraggingFromDifferentColumn;
  const showColumnHover = (isOver || dragOverStatusId === status.id) && Boolean(activeTask);
  const headerActions =
    onCreateTask || onEditStatus ? (
      <>
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
      </>
    ) : undefined;

  return (
    <KanbanColumnShell
      ref={(node) => {
        if (setNodeRef) {
          setNodeRef(node);
        }
        if (onColumnRef) {
          onColumnRef(status.id, node);
        }
      }}
      title={status.name}
      countLabel={`${tasks.length}${status.wipLimit ? ` / ${status.wipLimit}` : ''}`}
      columnColor={columnColor}
      headerActions={headerActions}
      footerContent={
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
      }
      showDropOverlay={showColumnDropIndicator}
      highlight={showColumnHover}
    >
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
      </SortableContext>
    </KanbanColumnShell>
  );
}
