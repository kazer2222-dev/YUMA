'use client';

import { Plus, MoreHorizontal, Search, Filter, SlidersHorizontal, Sparkles, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { SprintTaskCard, SprintTaskCardProps } from './sprint-task-card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export interface SprintBoardColumn {
  id: string;
  title: string;
  tasks: SprintTaskCardProps[];
  color: string;
  key?: string;
  isStart?: boolean;
  isDone?: boolean;
  visible?: boolean;
}

export interface SprintBoardProps {
  columns: SprintBoardColumn[];
  loading?: boolean;
  sprintName?: string;
  onCompleteSprint?: () => void;
  onOpenBoardConfig?: () => void;
  onTaskDrop?: (payload: { taskId: string; fromColumnId: string; toColumnId: string }) => void;
}

interface Task extends SprintTaskCardProps {}

// Draggable Task Card Component
interface DraggableTaskCardProps {
  task: Task;
  columnId: string;
  index: number;
  moveTask: (taskId: string, fromColumn: string, toColumn: string, toIndex: number, fromSwimlane?: string, toSwimlane?: string) => void;
  columnColor: string;
  swimlane?: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const DraggableTaskCard = ({ task, columnId, index, moveTask, columnColor, swimlane, onDragStart, onDragEnd }: DraggableTaskCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showDropIndicator, setShowDropIndicator] = useState<'top' | 'bottom' | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "TASK_CARD",
    item: () => {
      // Prevent any default behaviors when starting drag
      document.body.style.cursor = 'grabbing';
      if (onDragStart) {
        onDragStart();
      }
      return { id: task.id, columnId, index, task, swimlane };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      document.body.style.cursor = '';
      // Reset dragging flag after a delay to allow drop to complete
      setTimeout(() => {
        if (onDragEnd) {
          onDragEnd();
        }
      }, 200);
    },
  });

  const [{ isOver, draggedItem }, drop] = useDrop({
    accept: "TASK_CARD",
    hover: (item: { id: string; columnId: string; index: number; task: Task; swimlane?: string }, monitor) => {
      if (!ref.current) return;
      
      const dragColumnId = item.columnId;
      const hoverColumnId = columnId;
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragColumnId === hoverColumnId && dragIndex === hoverIndex) {
        setShowDropIndicator(null);
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Show drop indicator
      if (hoverClientY < hoverMiddleY) {
        setShowDropIndicator('top');
      } else {
        setShowDropIndicator('bottom');
      }

      // Only perform the move when the mouse has crossed half of the item's height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Only update visual position during hover, don't call API
      moveTask(item.id, dragColumnId, hoverColumnId, hoverIndex, item.swimlane, swimlane);
      item.columnId = hoverColumnId;
      item.index = hoverIndex;
      item.swimlane = swimlane;
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
            <SprintTaskCard {...(draggedItem as any).task} columnColor={columnColor} />
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
        }}
        className={`transition-all duration-200 ${
          isDragging ? 'scale-105 shadow-2xl' : ''
        }`}
        onMouseDown={(e) => {
          // Prevent default to avoid any navigation or form submission
          if (e.button === 0) {
            e.stopPropagation();
          }
        }}
      >
        <SprintTaskCard {...task} columnColor={columnColor} />
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
            <SprintTaskCard {...(draggedItem as any).task} columnColor={columnColor} />
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

// Droppable Column Wrapper
interface DroppableColumnProps {
  columnId: string;
  children: React.ReactNode;
  moveTask: (taskId: string, fromColumn: string, toColumn: string, toIndex: number, fromSwimlane?: string, toSwimlane?: string) => void;
  taskCount: number;
  columnColor: string;
  swimlane?: string;
}

const DroppableColumn = ({ columnId, children, moveTask, taskCount, columnColor, swimlane, onTaskDrop }: DroppableColumnProps & { onTaskDrop?: (payload: { taskId: string; fromColumnId: string; toColumnId: string }) => void }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: "TASK_CARD",
    drop: (item: { id: string; columnId: string; index: number; swimlane?: string }, monitor) => {
      // Only handle drops in empty space (not on specific tasks)
      if (!monitor.didDrop()) {
        const fromColumnId = item.columnId;
        const toColumnId = columnId;
        
        // Drop at the end of the column
        moveTask(item.id, fromColumnId, toColumnId, taskCount, item.swimlane, swimlane);
        
        // Call onTaskDrop callback after state update (async to avoid blocking)
        if (onTaskDrop && fromColumnId !== toColumnId) {
          // Use setTimeout to ensure state update happens first
          setTimeout(() => {
            onTaskDrop({
              taskId: item.id,
              fromColumnId,
              toColumnId,
            });
          }, 0);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem(),
    }),
  });

  drop(ref);

  const showPlaceholder = isOver && canDrop && draggedItem && (draggedItem as any).columnId !== columnId;

  return (
    <div 
      ref={ref} 
      className="h-full relative"
    >
      {children}
      {/* Show placeholder indicator when dragging over from another column */}
      {showPlaceholder && (
        <div className="absolute inset-0 rounded-xl pointer-events-none z-10">
          <div 
            className="absolute inset-0 rounded-xl border-2 border-dashed animate-pulse"
            style={{
              borderColor: columnColor,
              backgroundColor: `${columnColor}08`
            }}
          />
        </div>
      )}
    </div>
  );
};

export function SprintBoard({
  columns,
  loading,
  sprintName,
  onCompleteSprint,
  onOpenBoardConfig,
  onTaskDrop,
}: SprintBoardProps) {
  const [kanbanData, setKanbanData] = useState<SprintBoardColumn[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showOverdue, setShowOverdue] = useState(false);
  const [maxColumnHeight, setMaxColumnHeight] = useState<number>(0);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [groupBy, setGroupBy] = useState<'none' | 'assignee' | 'template' | 'priority'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const isDraggingRef = useRef(false);
  const pendingUpdateRef = useRef(false);

  // Update kanbanData when columns prop changes, but only if not dragging
  useEffect(() => {
    if (!isDraggingRef.current && !pendingUpdateRef.current) {
      setKanbanData(columns);
    }
  }, [columns]);

  // Filter tasks based on search and filters
  const filterTasks = (tasks: Task[]) => {
    return tasks.filter(task => {
      // Search filter (case insensitive)
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          (!task.subtitle || !task.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false;
      }

      // Priority filter
      if (selectedPriorities.length > 0 && task.priority && !selectedPriorities.includes(task.priority)) {
        return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        if (!task.tags || !task.tags.some(tag => selectedTags.includes(tag.label))) {
          return false;
        }
      }

      // Overdue filter
      if (showOverdue && task.dueDate) {
        const dueDate = new Date(task.dueDate.split('/').reverse().join('-'));
        const today = new Date();
        if (dueDate >= today) {
          return false;
        }
      }

      return true;
    });
  };

  // Get swimlane groups based on selected grouping
  const getSwimlanes = () => {
    if (groupBy === 'none') {
      return null;
    }

    // Get all tasks from all columns
    const allTasks = kanbanData.flatMap(column => 
      column.tasks.map(task => ({ ...task, status: column.id }))
    );
    const filtered = filterTasks(allTasks);

    if (groupBy === 'assignee') {
      const assigneeSet = new Set<string>();
      filtered.forEach(task => {
        assigneeSet.add(task.assignee || 'Unassigned');
      });
      return Array.from(assigneeSet).sort();
    }

    if (groupBy === 'template') {
      const templateSet = new Set<string>();
      filtered.forEach(task => {
        const template = task.tags && task.tags.length > 0 ? task.tags[0].label : 'No Template';
        templateSet.add(template);
      });
      return Array.from(templateSet).sort();
    }

    if (groupBy === 'priority') {
      const priorityOrder = ['urgent', 'high', 'medium', 'low', 'none'];
      const prioritySet = new Set<string>();
      filtered.forEach(task => {
        prioritySet.add(task.priority || 'none');
      });
      return priorityOrder.filter(p => prioritySet.has(p));
    }

    return null;
  };

  // Get tasks for a specific swimlane and column
  const getTasksForSwimlaneAndColumn = (swimlane: string, columnId: string): Task[] => {
    const column = kanbanData.find(col => col.id === columnId);
    if (!column) return [];

    const filtered = filterTasks(column.tasks);

    if (groupBy === 'assignee') {
      return filtered.filter(task => (task.assignee || 'Unassigned') === swimlane);
    }

    if (groupBy === 'template') {
      return filtered.filter(task => {
        const template = task.tags && task.tags.length > 0 ? task.tags[0].label : 'No Template';
        return template === swimlane;
      });
    }

    if (groupBy === 'priority') {
      return filtered.filter(task => (task.priority || 'none') === swimlane);
    }

    return [];
  };

  const filteredKanbanData = kanbanData.map(column => ({
    ...column,
    tasks: filterTasks(column.tasks)
  }));

  const swimlanes = getSwimlanes();

  const handleGenerateWithAI = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 3000);
  };

  const activeFiltersCount = selectedPriorities.length + selectedTags.length + (showOverdue ? 1 : 0);

  // Calculate max column height
  useEffect(() => {
    const calculateMaxHeight = () => {
      const heights = columnRefs.current
        .filter(ref => ref !== null)
        .map(ref => ref!.scrollHeight);
      
      if (heights.length > 0) {
        setMaxColumnHeight(Math.max(...heights));
      }
    };

    calculateMaxHeight();
    const timer = setTimeout(calculateMaxHeight, 100);
    return () => clearTimeout(timer);
  }, [filteredKanbanData]);

  // Move task function for drag and drop (optimistic update)
  const moveTask = (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number, fromSwimlane?: string, toSwimlane?: string) => {
    pendingUpdateRef.current = true;
    setKanbanData((prevData) => {
      const newData = prevData.map(col => ({
        ...col,
        tasks: [...col.tasks]
      }));

      // Find the source and destination columns
      const fromColumn = newData.find(col => col.id === fromColumnId);
      const toColumn = newData.find(col => col.id === toColumnId);

      if (!fromColumn || !toColumn) {
        pendingUpdateRef.current = false;
        return prevData;
      }

      // Find and remove the task from source column
      const taskIndex = fromColumn.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        pendingUpdateRef.current = false;
        return prevData;
      }

      const [movedTask] = fromColumn.tasks.splice(taskIndex, 1);

      // Update task properties based on the target swimlane (if grouping is active)
      if (toSwimlane && fromSwimlane !== toSwimlane) {
        if (groupBy === 'assignee') {
          movedTask.assignee = toSwimlane === 'Unassigned' ? undefined : toSwimlane;
        } else if (groupBy === 'priority') {
          movedTask.priority = toSwimlane === 'none' ? undefined : toSwimlane as 'low' | 'medium' | 'high' | 'urgent';
        } else if (groupBy === 'template') {
          // Update the first tag to match the new template
          if (toSwimlane === 'No Template') {
            movedTask.tags = [];
          } else {
            const newTag = { label: toSwimlane, color: movedTask.tags?.[0]?.color || '#8B5CF6' };
            movedTask.tags = [newTag, ...(movedTask.tags?.slice(1) || [])];
          }
        }
      }

      // Insert task at the target position in destination column
      toColumn.tasks.splice(toIndex, 0, movedTask);

      // Reset pending flag after a short delay to allow state to settle
      setTimeout(() => {
        pendingUpdateRef.current = false;
      }, 100);

      return newData;
    });
  };

  if (loading) {
    return (
      <div className="flex gap-3 sm:gap-4 p-3 sm:p-6 items-start overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 flex-1 animate-pulse rounded-xl border border-dashed border-[var(--border)]"
          />
        ))}
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--muted)]/30 relative">
        {/* Sprint Header and Search Bar Combined */}
        <div className="px-3 sm:px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
            {/* Sprint Name */}
            <div className="flex items-center gap-2.5">
              <div 
                className="w-2.5 h-2.5 rounded-full bg-purple-500" 
                style={{
                  boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
              <span className="text-sm">{sprintName || 'Sprint'}</span>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />

            {/* Search and Filter Controls */}
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <div className="w-full sm:w-80 relative">
                <input
                  type="text"
                  placeholder={isGenerating ? "AI is analyzing..." : "Search tasks..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isGenerating}
                  className={`w-full px-4 py-1.5 bg-[var(--background)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm ${
                    isGenerating 
                      ? "border-purple-500/50 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5 cursor-not-allowed" 
                      : "border-[var(--border)]"
                  }`}
                />
                {searchQuery && !isGenerating && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isGenerating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Sparkles 
                      className="w-4 h-4 text-purple-500" 
                      style={{
                        animation: "spin 1s linear infinite"
                      }}
                    />
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                className="bg-[var(--background)] hover:bg-[var(--muted)] h-8 w-8 hidden sm:flex"
                disabled={isGenerating}
              >
                <Search className="w-4 h-4" />
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleGenerateWithAI}
                      disabled={isGenerating}
                      className={`bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30 hover:from-purple-500/20 hover:to-blue-500/20 text-purple-600 dark:text-purple-400 transition-all hover:scale-105 h-8 w-8 ${
                        isGenerating ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isGenerating ? "Generating..." : "Generate with AI"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)] relative h-8 flex-shrink-0">
                    <Filter className="w-4 h-4" />
                    <span className="hidden lg:inline">Filter by</span>
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--primary)] text-white rounded-full text-xs flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={selectedPriorities.includes("urgent")}
                    onCheckedChange={(checked) => {
                      setSelectedPriorities(prev => 
                        checked ? [...prev, "urgent"] : prev.filter(p => p !== "urgent")
                      );
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Urgent
                    </span>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedPriorities.includes("high")}
                    onCheckedChange={(checked) => {
                      setSelectedPriorities(prev => 
                        checked ? [...prev, "high"] : prev.filter(p => p !== "high")
                      );
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      High
                    </span>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedPriorities.includes("medium")}
                    onCheckedChange={(checked) => {
                      setSelectedPriorities(prev => 
                        checked ? [...prev, "medium"] : prev.filter(p => p !== "medium")
                      );
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Medium
                    </span>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedPriorities.includes("low")}
                    onCheckedChange={(checked) => {
                      setSelectedPriorities(prev => 
                        checked ? [...prev, "low"] : prev.filter(p => p !== "low")
                      );
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                      Low
                    </span>
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuCheckboxItem
                    checked={showOverdue}
                    onCheckedChange={setShowOverdue}
                  >
                    Show Overdue Only
                  </DropdownMenuCheckboxItem>

                  {activeFiltersCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedPriorities([]);
                          setSelectedTags([]);
                          setShowOverdue(false);
                        }}
                        className="text-red-500"
                      >
                        Clear All Filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)] h-8">
                    <SlidersHorizontal className="w-4 h-4" />
                    Group by
                    {groupBy !== "none" && (
                      <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                        ({groupBy.charAt(0).toUpperCase() + groupBy.slice(1)})
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setGroupBy("assignee")}>
                    <span className="flex items-center gap-2">
                      {groupBy === "assignee" && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                      Assignee
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGroupBy("template")}>
                    <span className="flex items-center gap-2">
                      {groupBy === "template" && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                      Template
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGroupBy("priority")}>
                    <span className="flex items-center gap-2">
                      {groupBy === "priority" && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                      Priority
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setGroupBy("none")}>
                    <span className="flex items-center gap-2">
                      {groupBy === "none" && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                      None
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Complete Sprint Button */}
              {onCompleteSprint && (
                <Button 
                  className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white h-8 px-4 gap-2 ml-auto"
                  onClick={onCompleteSprint}
                >
                  <span className="text-sm">Complete Sprint</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Board Container */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
          
          <div className="relative z-10">
            {swimlanes ? (
              // Swimlane View (JIRA-style with collapsible groups)
              <div className="flex flex-col p-3 sm:p-6">
                {swimlanes.map((swimlane, swimlaneIndex) => {
                  const isCollapsed = collapsedGroups.has(swimlane);
                  const totalTasksInGroup = kanbanData.reduce((sum, column) => {
                    return sum + getTasksForSwimlaneAndColumn(swimlane, column.id).length;
                  }, 0);

                  return (
                    <div key={swimlane} className="mb-6">
                      {/* Group Header - Collapsible */}
                      <div 
                        className="flex items-center gap-2 px-3 py-2 mb-3 bg-[var(--muted)]/30 rounded-lg cursor-pointer hover:bg-[var(--muted)]/50 transition-colors border border-[var(--border)]"
                        onClick={() => {
                          const newCollapsed = new Set(collapsedGroups);
                          if (isCollapsed) {
                            newCollapsed.delete(swimlane);
                          } else {
                            newCollapsed.add(swimlane);
                          }
                          setCollapsedGroups(newCollapsed);
                        }}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                        )}
                        <span className="uppercase text-xs text-[var(--muted-foreground)] mr-2">
                          {groupBy}:
                        </span>
                        <span className="text-sm text-[var(--foreground)]">
                          {swimlane}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 ml-2">
                          {totalTasksInGroup}
                        </span>
                      </div>

                      {/* Group Content - Columns */}
                      {!isCollapsed && (
                        <div className="flex gap-3 sm:gap-4 items-start overflow-x-auto pb-2">
                          {filteredKanbanData.filter(col => col.visible !== false).map((column, index) => {
                            const tasks = getTasksForSwimlaneAndColumn(swimlane, column.id);
                            return (
                              <div 
                                key={column.id} 
                                className="flex-shrink-0 w-80 group"
                                style={{ 
                                  animation: `fadeIn 0.4s ease-out ${index * 0.1}s both`
                                }}
                              >
                                <DroppableColumn 
                                  columnId={column.id} 
                                  moveTask={moveTask}
                                  taskCount={tasks.length}
                                  columnColor={column.color}
                                  swimlane={swimlane}
                                  onTaskDrop={onTaskDrop}
                                >
                                  <div 
                                    className="flex flex-col bg-gradient-to-b from-[var(--card)] to-[var(--card)]/80 dark:from-[var(--card)] dark:to-[var(--background)] rounded-xl border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                                  >
                                    {/* Column Header with Gradient Bar */}
                                    <div className="relative">
                                      <div 
                                        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                                        style={{ 
                                          background: `linear-gradient(90deg, ${column.color}, ${column.color}80)`,
                                          boxShadow: `0 0 10px ${column.color}40`
                                        }}
                                      />
                                      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] mt-1">
                                        <div className="flex items-center gap-2.5">
                                          <div 
                                            className="w-2.5 h-2.5 rounded-full animate-pulse"
                                            style={{ 
                                              backgroundColor: column.color,
                                              boxShadow: `0 0 8px ${column.color}80`
                                            }}
                                          />
                                          <span className="text-[var(--foreground)]">{column.title}</span>
                                          <span 
                                            className="text-xs px-2 py-1 rounded-full transition-all duration-200"
                                            style={{
                                              backgroundColor: `${column.color}15`,
                                              color: column.color,
                                              border: `1px solid ${column.color}30`
                                            }}
                                          >
                                            {tasks.length}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 hover:bg-[var(--muted)] rounded-lg transition-all hover:scale-110"
                                          >
                                            <Plus className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Tasks Container */}
                                    <div className="flex-1 p-3 space-y-3 min-h-[200px]">
                                      {tasks.length > 0 ? (
                                        tasks.map((task, taskIndex) => (
                                          <div
                                            key={task.id}
                                            style={{
                                              animation: `slideIn 0.3s ease-out ${taskIndex * 0.05}s both`
                                            }}
                                          >
                                            <DraggableTaskCard 
                                              task={task} 
                                              columnId={column.id}
                                              index={taskIndex}
                                              moveTask={moveTask}
                                              columnColor={column.color}
                                              swimlane={swimlane}
                                              onDragStart={() => { isDraggingRef.current = true; }}
                                              onDragEnd={() => { isDraggingRef.current = false; }}
                                            />
                                          </div>
                                        ))
                                      ) : (
                                        <div className="flex items-center justify-center h-20 text-center text-[var(--muted-foreground)] rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--primary)]/30 transition-all duration-300 cursor-pointer opacity-50">
                                          <Plus className="w-4 h-4 opacity-30" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </DroppableColumn>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Default Column View
              <div className="flex gap-3 sm:gap-4 p-3 sm:p-6 items-start overflow-x-auto pb-2">
                {filteredKanbanData.filter(col => col.visible !== false).map((column, index) => (
                  <div 
                    key={column.id} 
                    className="flex-shrink-0 w-72 sm:w-80 group"
                    style={{ 
                      animation: `fadeIn 0.4s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <DroppableColumn 
                      columnId={column.id} 
                      moveTask={moveTask}
                      taskCount={column.tasks.length}
                      columnColor={column.color}
                      onTaskDrop={onTaskDrop}
                    >
                      <div 
                        ref={(el: HTMLDivElement | null) => {
                          columnRefs.current[index] = el;
                        }}
                        className="flex flex-col bg-gradient-to-b from-[var(--card)] to-[var(--card)]/80 dark:from-[var(--card)] dark:to-[var(--background)] rounded-xl border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                        style={{
                          minHeight: maxColumnHeight > 0 ? `${maxColumnHeight}px` : 'auto'
                        }}
                      >
                        {/* Column Header with Gradient Bar */}
                        <div className="relative">
                          <div 
                            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                            style={{ 
                              background: `linear-gradient(90deg, ${column.color}, ${column.color}80)`,
                              boxShadow: `0 0 10px ${column.color}40`
                            }}
                          />
                          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] mt-1">
                            <div className="flex items-center gap-2.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full animate-pulse"
                                style={{ 
                                  backgroundColor: column.color,
                                  boxShadow: `0 0 8px ${column.color}80`
                                }}
                              />
                              <span className="text-[var(--foreground)]">{column.title}</span>
                              <span 
                                className="text-xs px-2 py-1 rounded-full transition-all duration-200"
                                style={{
                                  backgroundColor: `${column.color}15`,
                                  color: column.color,
                                  border: `1px solid ${column.color}30`
                                }}
                              >
                                {column.tasks.length}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-[var(--muted)] rounded-lg transition-all hover:scale-110"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              {onOpenBoardConfig && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-[var(--muted)] rounded-lg transition-all hover:scale-110"
                                  onClick={onOpenBoardConfig}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tasks Container */}
                        <div className="flex-1 p-3 space-y-3 min-h-[200px]">
                          {column.tasks.length > 0 ? (
                            column.tasks.map((task, taskIndex) => (
                              <div
                                key={task.id}
                                style={{
                                  animation: `slideIn 0.3s ease-out ${taskIndex * 0.05}s both`
                                }}
                              >
                                <DraggableTaskCard 
                                  task={task} 
                                  columnId={column.id}
                                  index={taskIndex}
                                  moveTask={moveTask}
                                  columnColor={column.color}
                                  onDragStart={() => { isDraggingRef.current = true; }}
                                  onDragEnd={() => { isDraggingRef.current = false; }}
                                />
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-[var(--muted-foreground)] rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/30 transition-all duration-300 cursor-pointer group/empty">
                              <div 
                                className="w-16 h-16 mb-3 rounded-full flex items-center justify-center transition-all duration-300 group-hover/empty:scale-110"
                                style={{
                                  backgroundColor: `${column.color}10`,
                                  border: `2px dashed ${column.color}30`
                                }}
                              >
                                <Plus className="w-8 h-8 opacity-30 group-hover/empty:opacity-60 transition-opacity" />
                              </div>
                              <p className="text-sm">Drop tasks here</p>
                              <p className="text-xs mt-1 opacity-60">or click to add</p>
                            </div>
                          )}
                        </div>

                        {/* Add Task Button at Bottom */}
                        <div className="p-3 pt-0 mt-auto">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 hover:bg-[var(--muted)] rounded-lg transition-all duration-200 opacity-60 hover:opacity-100"
                            style={{
                              borderTop: `1px solid ${column.color}10`
                            }}
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">Add Task</span>
                          </Button>
                        </div>
                      </div>
                    </DroppableColumn>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 3px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.3);
            border-radius: 3px;
            transition: background 0.2s ease;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.5);
          }

          .custom-scrollbar::-webkit-scrollbar-corner {
            background: transparent;
          }

          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
          }
        `}</style>
      </div>
    </DndProvider>
  );
}

