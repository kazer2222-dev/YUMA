'use client';

import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { BoardCard } from './board-card';
import { Task } from './board-types';
import { getStatusColor } from './utils';

interface BoardDraggableCardProps {
  task: Task;
  columnId: string;
  index: number;
  moveTask: (taskId: string, fromColumn: string, toColumn: string, toIndex: number) => void;
  columnColor: string;
  spaceTicker?: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onTaskClick?: (taskId: string, isTaskNumberClick?: boolean) => void;
}

export const BoardDraggableCard = ({
  task,
  columnId,
  index,
  moveTask,
  columnColor,
  spaceTicker,
  onDragStart,
  onDragEnd,
  onTaskClick,
}: BoardDraggableCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showDropIndicator, setShowDropIndicator] = useState<'top' | 'bottom' | null>(null);
  const justDraggedRef = useRef(false);
  const dragStartTimeRef = useRef<number>(0);

  const [{ isDragging }, drag] = useDrag({
    type: "TASK_CARD",
    item: () => {
      document.body.style.cursor = 'grabbing';
      dragStartTimeRef.current = Date.now();
      justDraggedRef.current = false;
      if (onDragStart) {
        onDragStart();
      }
      return { id: task.id, columnId, index, task };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      document.body.style.cursor = '';
      if (monitor.didDrop()) {
        justDraggedRef.current = true;
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 300);
      }
      setTimeout(() => {
        if (onDragEnd) {
          onDragEnd();
        }
      }, 200);
    },
  });

  const [{ isOver, draggedItem }, drop] = useDrop({
    accept: "TASK_CARD",
    hover: (item: { id: string; columnId: string; index: number; task: Task }, monitor) => {
      if (!ref.current) return;
      
      const dragColumnId = item.columnId;
      const hoverColumnId = columnId;
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragColumnId === hoverColumnId && dragIndex === hoverIndex) {
        setShowDropIndicator(null);
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (hoverClientY < hoverMiddleY) {
        setShowDropIndicator('top');
      } else {
        setShowDropIndicator('bottom');
      }

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveTask(item.id, dragColumnId, hoverColumnId, hoverIndex);
      item.columnId = hoverColumnId;
      item.index = hoverIndex;
    },
    drop: () => {
      setShowDropIndicator(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      draggedItem: monitor.getItem(),
    }),
  });

  drag(drop(ref));

  const showPlaceholder = isOver && draggedItem && (draggedItem as any).columnId !== columnId && showDropIndicator;

  return (
    <div className="relative">
      {/* Ghost placeholder - top */}
      {showPlaceholder && showDropIndicator === 'top' && (draggedItem as any)?.task && (
        <div 
          className="mb-3 opacity-40 scale-[0.98] pointer-events-none"
          style={{
            animation: 'fadeIn 0.2s ease-out',
            filter: 'blur(0.5px) grayscale(0.3)'
          }}
        >
          <div 
            className="border-2 border-dashed rounded-xl overflow-hidden relative"
            style={{
              borderColor: columnColor,
              backgroundColor: `${columnColor}15`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 z-10" />
            <BoardCard
              task={(draggedItem as any).task}
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

      {/* Drop indicator - top */}
      {isOver && showDropIndicator === 'top' && !showPlaceholder && (
        <div 
          className="absolute -top-1 left-0 right-0 h-0.5 z-50 rounded-full"
          style={{ 
            backgroundColor: columnColor,
            boxShadow: `0 0 8px ${columnColor}`
          }}
        />
      )}
      
      <div
        ref={ref}
        style={{
          opacity: isDragging ? 0.4 : 1,
          cursor: 'grab',
          transform: isDragging ? 'rotate(3deg)' : 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        className={`transition-all duration-200 ${
          isDragging ? 'scale-105 shadow-2xl' : ''
        }`}
        onClick={(e) => {
          if (justDraggedRef.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          const timeSinceDragStart = Date.now() - dragStartTimeRef.current;
          if (timeSinceDragStart < 200) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          onTaskClick?.(task.id, false);
        }}
      >
        <BoardCard
          task={task}
          isDragging={isDragging}
          onTaskClick={onTaskClick}
          isDragOver={false}
          showDropIndicatorAbove={false}
          spaceTicker={spaceTicker}
          columnColor={columnColor}
          isActiveDragging={isDragging}
        />
      </div>

      {/* Ghost placeholder - bottom */}
      {showPlaceholder && showDropIndicator === 'bottom' && (draggedItem as any)?.task && (
        <div 
          className="mt-3 opacity-40 scale-[0.98] pointer-events-none"
          style={{
            animation: 'fadeIn 0.2s ease-out',
            filter: 'blur(0.5px) grayscale(0.3)'
          }}
        >
          <div 
            className="border-2 border-dashed rounded-xl overflow-hidden relative"
            style={{
              borderColor: columnColor,
              backgroundColor: `${columnColor}15`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 z-10" />
            <BoardCard
              task={(draggedItem as any).task}
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

      {/* Drop indicator - bottom */}
      {isOver && showDropIndicator === 'bottom' && !showPlaceholder && (
        <div 
          className="absolute -bottom-1 left-0 right-0 h-0.5 z-50 rounded-full"
          style={{ 
            backgroundColor: columnColor,
            boxShadow: `0 0 8px ${columnColor}`
          }}
        />
      )}
      
      {/* Placeholder when dragging */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--muted)]/20" />
      )}
    </div>
  );
};




