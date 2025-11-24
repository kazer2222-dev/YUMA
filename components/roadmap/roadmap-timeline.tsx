'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { RoadmapTaskEditor, type RoadmapTask as EditorTask } from './roadmap-task-editor';

type Task = EditorTask & {
  progress?: number;
  parentId?: string;
  space?: EditorTask['space'] & {
    name?: string;
  };
  color?: string;
};

interface RoadmapTimelineProps {
  tasks: Task[];
  spaceSlug: string;
  statuses?: Array<{ id: string; name: string; color?: string }>;
  users?: Array<{ id: string; name?: string; email: string }>;
  onTaskUpdate?: (taskId: string, updates: { startDate?: Date; dueDate?: Date }) => Promise<void>;
  onTasksChange?: () => void;
}

type ViewType = 'day' | 'week' | 'month' | 'quarter';
type GroupBy = 'none' | 'status' | 'assignee' | 'space';

export function RoadmapTimeline({ tasks, spaceSlug, statuses = [], users = [], onTaskUpdate, onTasksChange }: RoadmapTimelineProps) {
  const router = useRouter();
  const [viewType, setViewType] = useState<ViewType>('month');
  const [showCompleted, setShowCompleted] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [sidebarWidth, setSidebarWidth] = useState(224);
  const [isResizing, setIsResizing] = useState(false);
  const [roadmapTasks, setRoadmapTasks] = useState<Task[]>(tasks);
  const [resizingTask, setResizingTask] = useState<{ taskId: string; edge: 'left' | 'right' } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const resizeStartX = useRef<number>(0);
  const resizeStartDate = useRef<Date | null>(null);
  const resizeEndDate = useRef<Date | null>(null);
  const resizeStartLeft = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);
  const resizeStartStyle = useRef<{ left: string; width: string } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const pendingTaskUpdate = useRef<{ taskId: string; startDate?: string; dueDate?: string } | null>(null);
  const isScrollingSync = useRef<boolean>(false);
  const taskBarRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const resizeHandleRefs = useRef<Map<string, { left: HTMLDivElement | null; right: HTMLDivElement | null }>>(new Map());
  const isMouseUpHandled = useRef<boolean>(false);
  const resizingTaskRef = useRef<{ taskId: string; edge: 'left' | 'right' } | null>(null);

  // Sync roadmapTasks with tasks prop
  useEffect(() => {
    setRoadmapTasks(tasks);
  }, [tasks]);

  // Add styles to hide scrollbar and optimize performance
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }
      /* Optimize rendering performance */
      .timeline-container {
        contain: layout style paint;
      }
      .task-bar {
        backface-visibility: hidden;
        perspective: 1000px;
        contain: layout style paint;
        isolation: isolate;
      }
      /* Disable transitions during resize to prevent blinking */
      .task-bar-resizing {
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Refs for scroll sync
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

    const today = new Date();
    
  // Generate days for the timeline (±2 years from today)
  const generateDays = () => {
    const days = [];
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 2);
    startDate.setDate(1);
    
    for (let i = 0; i < 1460; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // Generate weeks for the timeline
  const generateWeeks = () => {
    const weeks = [];
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 2);
    startDate.setMonth(0, 1);
    
    for (let i = 0; i < 209; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));
      weeks.push(weekStart);
    }
    
    return weeks;
  };

  // Check if a week contains today
  const weekContainsToday = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return today >= weekStart && today <= weekEnd;
  };

  // Generate months for the timeline
  const generateMonths = () => {
    const months = [];
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 2);
    startDate.setMonth(0, 1);
    
    for (let i = 0; i < 48; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      months.push(monthDate);
    }
    
    return months;
  };

  // Generate quarters for the timeline
  const generateQuarters = () => {
    const quarters = [];
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 2);
    startDate.setMonth(0, 1); // Start of year
    
    // Generate ~4 years worth of quarters (from -2 years to +2 years)
    // Each quarter starts at the beginning of Q1, Q2, Q3, or Q4
    for (let i = 0; i < 16; i++) {
      const quarterDate = new Date(startDate.getFullYear(), i * 3, 1);
      quarters.push(quarterDate);
    }
    
    return quarters;
  };

  const days = generateDays();
  const weeks = generateWeeks();
  const months = generateMonths();
  const quarters = generateQuarters();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Calculate total timeline width
  const getTimelineWidth = () => {
    if (viewType === "day") return days.length * 120;
    if (viewType === "week") return weeks.length * 150;
    if (viewType === "month") return months.length * 180;
    return quarters.length * 240;
  };

  const timelineWidth = getTimelineWidth();

  // Calculate position and width of task bar
  const getTaskBarStyle = (task: Task) => {
    let timelineStart: Date;
    let timelineEnd: Date;
    
    if (viewType === "day") {
      timelineStart = days[0];
      timelineEnd = days[days.length - 1];
    } else if (viewType === "week") {
      timelineStart = weeks[0];
      const lastWeek = weeks[weeks.length - 1];
      timelineEnd = new Date(lastWeek);
      timelineEnd.setDate(lastWeek.getDate() + 6);
    } else if (viewType === "month") {
      timelineStart = months[0];
      timelineEnd = new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 0);
      } else {
      timelineStart = quarters[0];
      const lastQuarter = quarters[quarters.length - 1];
      timelineEnd = new Date(lastQuarter.getFullYear(), lastQuarter.getMonth() + 3, 0);
    }
    
    const startDate = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : today);
    const endDate = task.dueDate ? new Date(task.dueDate) : (task.startDate ? new Date(task.startDate) : today);
    
    const totalDays = Math.floor((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const startDays = Math.floor((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const leftPercent = (startDays / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;
    
    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.min(widthPercent, 100 - leftPercent)}%`,
    };
  };

  // Handle sidebar resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Use requestAnimationFrame for smooth updates
    animationFrameRef.current = requestAnimationFrame(() => {
      const newWidth = e.clientX;
      if (newWidth >= 150 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    });
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Handle task bar resize - CRITICAL: This MUST prevent page refresh
  const handleTaskResizeStart = (
    e: React.MouseEvent,
    taskId: string,
    edge: 'left' | 'right',
    task: Task
  ) => {
    // CRITICAL: Stop ALL event propagation FIRST - before anything else
    e.preventDefault();
    e.stopPropagation();
    if ((e as any).stopImmediatePropagation) {
      (e as any).stopImmediatePropagation();
    }
    
    const nativeEvent = e.nativeEvent;
    if (nativeEvent) {
      if (nativeEvent.preventDefault) nativeEvent.preventDefault();
      if (nativeEvent.stopPropagation) nativeEvent.stopPropagation();
      if ((nativeEvent as any).stopImmediatePropagation) {
        (nativeEvent as any).stopImmediatePropagation();
      }
    }
    
    // Prevent any form submissions or link clicks
    const target = e.target as HTMLElement;
    if (target) {
      // Find any parent form, button, or link
      let element: HTMLElement | null = target;
      while (element && element !== document.body) {
        if (element.tagName === 'FORM' || 
            (element.tagName === 'BUTTON' && (element as HTMLButtonElement).type === 'submit') ||
            element.tagName === 'A') {
          e.preventDefault();
          e.stopPropagation();
          if ((e as any).stopImmediatePropagation) {
            (e as any).stopImmediatePropagation();
          }
          break;
        }
        element = element.parentElement;
      }
    }
    
    isMouseUpHandled.current = false;
    resizingTaskRef.current = { taskId, edge };
    
    // Get initial position and size from DOM to preserve during resize
    const taskBarElement = taskBarRefs.current.get(taskId);
    if (taskBarElement) {
      // Capture current computed styles to preserve them
      const computedStyle = window.getComputedStyle(taskBarElement);
      resizeStartStyle.current = {
        left: computedStyle.left || taskBarElement.style.left || '0%',
        width: computedStyle.width || taskBarElement.style.width || '0%'
      };
      
      // Ensure element has valid styles before resize starts
      if (!taskBarElement.style.left || !taskBarElement.style.width) {
        // Calculate initial style if not set
        const initialStyle = getTaskBarStyle(task);
        taskBarElement.style.left = initialStyle.left;
        taskBarElement.style.width = initialStyle.width;
        resizeStartStyle.current = {
          left: initialStyle.left,
          width: initialStyle.width
        };
      }
      
      // Disable transitions immediately
      taskBarElement.style.transition = 'none';
      taskBarElement.style.willChange = 'left, width';
    }
    
    // Set state AFTER capturing styles to trigger re-render
    setResizingTask({ taskId, edge }); // Keep for UI feedback
    
    resizeStartX.current = e.clientX;
    resizeStartDate.current = task.startDate ? new Date(task.startDate) : new Date();
    resizeEndDate.current = task.dueDate ? new Date(task.dueDate) : new Date();
    
    // Return false as final safeguard
    return false;
  };

  const handleTaskResizeMove = (e: MouseEvent) => {
    if (!resizingTaskRef.current) {
      return;
    }
    
    if (!contentScrollRef.current) {
      return;
    }
    
    // CRITICAL: Prevent default to avoid any page navigation or refresh
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }

    const deltaX = e.clientX - resizeStartX.current;
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Use requestAnimationFrame for smooth 60fps updates
    animationFrameRef.current = requestAnimationFrame(() => {
      const currentResizingTask = resizingTaskRef.current;
      if (!currentResizingTask) return;
      
      // Get the task bar element directly to update styles without React re-render
      const taskBarElement = taskBarRefs.current.get(currentResizingTask.taskId);
      if (!taskBarElement) return;
      
      // Get parent container for relative positioning
      const parentElement = taskBarElement.parentElement;
      if (!parentElement) return;
      
      let pixelsPerDay: number;
      
      if (viewType === 'day') {
        pixelsPerDay = 120;
      } else if (viewType === 'week') {
        pixelsPerDay = 150 / 7;
      } else if (viewType === 'month') {
        pixelsPerDay = 180 / 30;
      } else {
        pixelsPerDay = 240 / 90;
      }
      
      const daysChange = deltaX / pixelsPerDay;
      
      // Calculate new dates
      let newStartDate: Date;
      let newEndDate: Date;
      
      if (currentResizingTask.edge === 'left') {
        newStartDate = new Date(resizeStartDate.current!);
        newStartDate.setTime(newStartDate.getTime() + daysChange * 24 * 60 * 60 * 1000);
        
        const oneDayBeforeEnd = new Date(resizeEndDate.current!);
        oneDayBeforeEnd.setDate(oneDayBeforeEnd.getDate() - 1);
        
        if (newStartDate >= oneDayBeforeEnd) {
          newStartDate = oneDayBeforeEnd;
        }
        newEndDate = new Date(resizeEndDate.current!);
      } else {
        newEndDate = new Date(resizeEndDate.current!);
        newEndDate.setTime(newEndDate.getTime() + daysChange * 24 * 60 * 60 * 1000);
        
        const oneDayAfterStart = new Date(resizeStartDate.current!);
        oneDayAfterStart.setDate(oneDayAfterStart.getDate() + 1);
        
        if (newEndDate <= oneDayAfterStart) {
          newEndDate = oneDayAfterStart;
        }
        newStartDate = new Date(resizeStartDate.current!);
      }
      
      // Calculate timeline bounds
      let timelineStart: Date;
      let timelineEnd: Date;
      
      if (viewType === "day") {
        timelineStart = days[0];
        timelineEnd = days[days.length - 1];
      } else if (viewType === "week") {
        timelineStart = weeks[0];
        const lastWeek = weeks[weeks.length - 1];
        timelineEnd = new Date(lastWeek);
        timelineEnd.setDate(lastWeek.getDate() + 6);
      } else if (viewType === "month") {
        timelineStart = months[0];
        timelineEnd = new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 0);
      } else {
        timelineStart = quarters[0];
        const lastQuarter = quarters[quarters.length - 1];
        timelineEnd = new Date(lastQuarter.getFullYear(), lastQuarter.getMonth() + 3, 0);
      }
      
      // Calculate position and width percentages with high precision to prevent shaking
      const totalDays = (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
      const startDays = (newStartDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
      const duration = (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Calculate percentages with high precision
      const leftPercent = Math.max(0, Math.min((startDays / totalDays) * 100, 100));
      const endPercent = Math.max(0, Math.min((newEndDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100, 100));
      
      // Calculate width based on the difference between end and start positions
      // This ensures the right edge stays stable when resizing from the left
      const widthPercent = Math.max(0.1, Math.min(endPercent - leftPercent, 100 - leftPercent));
      
      // Round to 4 decimal places to prevent sub-pixel rendering issues that cause shaking
      const roundedLeftPercent = Math.round(leftPercent * 10000) / 10000;
      const roundedWidthPercent = Math.round(widthPercent * 10000) / 10000;
      
      // Update DOM directly for smooth updates
      // Use rounded values to prevent sub-pixel rendering issues
      taskBarElement.style.left = `${roundedLeftPercent}%`;
      taskBarElement.style.width = `${roundedWidthPercent}%`;
      taskBarElement.style.transition = 'none';
      taskBarElement.style.willChange = 'left, width';
      
      // CRITICAL: Update the preserved style immediately to prevent React from overwriting
      // This must match the DOM values exactly to prevent shaking
      if (resizeStartStyle.current) {
        resizeStartStyle.current.left = `${roundedLeftPercent}%`;
        resizeStartStyle.current.width = `${roundedWidthPercent}%`;
      }
      
      // Store pending update for when resize ends
      if (currentResizingTask.edge === 'left') {
        pendingTaskUpdate.current = { 
          taskId: currentResizingTask.taskId, 
          startDate: newStartDate.toISOString().split('T')[0] 
        };
      } else {
        pendingTaskUpdate.current = { 
          taskId: currentResizingTask.taskId, 
          dueDate: newEndDate.toISOString().split('T')[0] 
        };
      }
    });
  };

  const handleTaskResizeEnd = async (e?: MouseEvent) => {
    console.log('[RESIZE END] Called:', {
      isMouseUpHandled: isMouseUpHandled.current,
      resizingTask,
      event: e ? {
        type: e.type,
        target: (e.target as HTMLElement)?.tagName,
        defaultPrevented: e.defaultPrevented
      } : null
    });
    
    // Prevent multiple calls
    if (isMouseUpHandled.current) {
      console.log('[RESIZE END] Already handled, returning');
      if (e) {
        e.stopPropagation();
      e.preventDefault();
      }
      return;
    }
    
    // Store current resizing task before nulling
    const currentResizingTask = resizingTaskRef.current;
    if (!currentResizingTask) {
      console.log('[RESIZE END] No resizing task, returning');
      if (e) {
        e.stopPropagation();
      e.preventDefault();
      }
      return;
    }
    
    isMouseUpHandled.current = true;
    console.log('[RESIZE END] Setting isMouseUpHandled to true');
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Re-enable transitions on the task bar element and restore will-change
    const taskBarElement = taskBarRefs.current.get(currentResizingTask.taskId);
    if (taskBarElement) {
      // Ensure final styles are set before restoring transitions
      const currentLeft = taskBarElement.style.left;
      const currentWidth = taskBarElement.style.width;
      if (currentLeft && currentWidth) {
        // Keep the final resize position
        taskBarElement.style.left = currentLeft;
        taskBarElement.style.width = currentWidth;
      }
      taskBarElement.style.transition = ''; // Restore default transitions
      taskBarElement.style.willChange = ''; // Remove will-change
    }
    
    // Clear resizing refs
    resizingTaskRef.current = null;
    resizeStartStyle.current = null; // Clear preserved style
    
    // Update UI state (triggers re-render to update class names)
    setResizingTask(null);
    
    // Use pending update if available, otherwise use current task state
    const task = roadmapTasks.find(t => t.id === currentResizingTask.taskId);
    const update = pendingTaskUpdate.current || (task ? {
      taskId: task.id,
      startDate: task.startDate,
      dueDate: task.dueDate
    } : null);
    
    if (update && onTaskUpdate) {
      try {
        // Update local state to match the visual changes made during resize
        // This ensures the UI stays in sync without waiting for API response
        setRoadmapTasks(prevTasks => 
          prevTasks.map(t => {
            if (t.id !== update.taskId) return t;
            return {
              ...t,
              startDate: update.startDate || t.startDate,
              dueDate: update.dueDate || t.dueDate,
            };
          })
        );
        
        // Call onTaskUpdate which handles optimistic updates in the parent
        // The parent component already updates its state optimistically, so no refetch needed
        await onTaskUpdate(update.taskId, {
          startDate: update.startDate ? new Date(update.startDate) : undefined,
          dueDate: update.dueDate ? new Date(update.dueDate) : undefined,
        });
        // No need to call onTasksChange - parent component handles state updates optimistically
        // This prevents the full page refresh/flash
      } catch (error) {
        console.error('Failed to update task:', error);
        // On error, trigger a refetch to sync with server state
        if (onTasksChange) {
          onTasksChange();
        }
      }
    }
    
    pendingTaskUpdate.current = null;
    
    // Reset body styles immediately
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.pointerEvents = '';
    if (contentScrollRef.current) {
      contentScrollRef.current.style.pointerEvents = '';
    }
    
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // Scroll sync handler - optimized with requestAnimationFrame
  const handleScroll = (source: 'header' | 'content') => (e: React.UIEvent<HTMLDivElement>) => {
    // Prevent infinite scroll loops
    if (isScrollingSync.current) return;
    
    // Cancel any pending scroll animation frame
    if (scrollAnimationFrameRef.current) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
    }
    
    // Use requestAnimationFrame for smooth 60fps scroll sync
    scrollAnimationFrameRef.current = requestAnimationFrame(() => {
      const target = e.currentTarget;
      
      // Check if refs are still available (component might have unmounted)
      if (!target || !headerScrollRef.current || !contentScrollRef.current) {
        isScrollingSync.current = false;
        return;
      }
      
      isScrollingSync.current = true;
      
      if (source === 'header' && contentScrollRef.current) {
        // Avoid triggering scroll events on the target we're syncing to
        if (Math.abs(contentScrollRef.current.scrollLeft - target.scrollLeft) > 1) {
          contentScrollRef.current.scrollLeft = target.scrollLeft;
        }
      } else if (source === 'content' && headerScrollRef.current) {
        // Avoid triggering scroll events on the target we're syncing to
        if (Math.abs(headerScrollRef.current.scrollLeft - target.scrollLeft) > 1) {
          headerScrollRef.current.scrollLeft = target.scrollLeft;
        }
      }
      
      // Reset sync flag after a small delay
      requestAnimationFrame(() => {
        isScrollingSync.current = false;
      });
    });
  };

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (scrollAnimationFrameRef.current) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
    };
  }, []);

  // Add/remove event listeners for sidebar resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
      if (contentScrollRef.current) {
        contentScrollRef.current.style.pointerEvents = 'auto';
      }
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      if (contentScrollRef.current) {
        contentScrollRef.current.style.pointerEvents = '';
      }
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isResizing]);

  // Add/remove event listeners for task resizing
  useEffect(() => {
    if (!resizingTask) {
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    console.log('Setting up resize listeners for:', resizingTask); // Debug log
    isMouseUpHandled.current = false;
    
    // CRITICAL: Prevent ALL form submissions globally during resize
    const globalSubmitHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ('stopImmediatePropagation' in e && typeof (e as any).stopImmediatePropagation === 'function') {
        (e as any).stopImmediatePropagation();
      }
      console.warn('Form submit prevented during resize');
      return false;
    };
    
    // CRITICAL: Prevent ALL clicks on buttons and links during resize
    const globalClickHandler = (e: MouseEvent) => {
      // If we're resizing, prevent ALL clicks globally
      if (resizingTaskRef.current) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) {
          e.stopImmediatePropagation();
        }
        return false;
      }
      
      const target = e.target as HTMLElement;
      if (target.closest('[data-resize-handle]') || 
          target.closest('.task-bar[data-resizing]')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) {
          e.stopImmediatePropagation();
        }
        return false;
      }
    };
    
    // Use capture phase to catch mouseup early, but don't use once: true
    const mouseMoveHandler = (e: MouseEvent) => {
      // Only handle if we're actually resizing
      if (!resizingTaskRef.current) {
          return;
        }
        
      // CRITICAL: Prevent default to stop page refresh
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }
      
      // Also prevent form submission
      const target = e.target as HTMLElement;
      if (target) {
        if (target.closest('form')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
      
      handleTaskResizeMove(e);
      return false;
    };
    
    const mouseUpHandler = (e: MouseEvent) => {
      // CRITICAL: Prevent default FIRST - before any other logic
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }
      
      // Prevent any form submissions or link navigations
      const target = e.target as HTMLElement;
      if (target) {
        // Check if clicking on a form, button, or link
        let element: HTMLElement | null = target;
        while (element && element !== document.body) {
          if (element.tagName === 'FORM' || 
              element.tagName === 'BUTTON' ||
              element.tagName === 'A' ||
              element.hasAttribute('type') && (element as HTMLButtonElement).type === 'submit') {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) {
              e.stopImmediatePropagation();
            }
            break;
          }
          element = element.parentElement;
        }
      }
      
      // Call resize end handler
      handleTaskResizeEnd(e);
      return false;
    };
    
    // Separate handler for mouseleave - only fire if mouse actually leaves window
    const mouseLeaveHandler = (e: MouseEvent) => {
      // Only handle mouseleave if mouse actually left the window (relatedTarget is null)
      // Don't handle mouseleave if it's just from pointerEvents changes
      if (e.relatedTarget !== null) {
        console.log('[MOUSE LEAVE] Ignoring mouseleave - relatedTarget exists:', e.relatedTarget);
        return;
      }
      
      console.log('[MOUSE LEAVE] Mouse left window during resize, ending resize');
      
      // CRITICAL: Prevent default to stop page refresh
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }
      
      handleTaskResizeEnd(e);
      return false;
    };
    
    // Also prevent selectstart to prevent text selection during drag
    const selectStartHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      // stopImmediatePropagation exists on Event, but TypeScript might not have it in types
      if ('stopImmediatePropagation' in e && typeof (e as any).stopImmediatePropagation === 'function') {
        (e as any).stopImmediatePropagation();
      }
      return false;
    };
    
    // Use capture phase to catch events early, but not passive for mousemove
    // IMPORTANT: passive: false allows preventDefault to work
    // CRITICAL: Use capture: true to catch events BEFORE they bubble
    console.log('[SETUP LISTENERS] Adding event listeners');
    // Throttle mousemove with RAF for better performance
    document.addEventListener('mousemove', mouseMoveHandler, { passive: false, capture: true });
    document.addEventListener('mouseup', mouseUpHandler, { passive: false, capture: true });
    // Use separate mouseleave handler that checks relatedTarget
    document.addEventListener('mouseleave', mouseLeaveHandler, { passive: false, capture: true });
    // Also listen on window for actual window leave
    window.addEventListener('mouseleave', mouseLeaveHandler, { passive: false, capture: true });
    document.addEventListener('selectstart', selectStartHandler, { passive: false, capture: true });
    document.addEventListener('dragstart', selectStartHandler, { passive: false, capture: true });
    
    // CRITICAL: Global handlers to prevent ANY form submissions or link clicks
    document.addEventListener('submit', globalSubmitHandler, { passive: false, capture: true });
    document.addEventListener('click', globalClickHandler, { passive: false, capture: true });
    
    // Also prevent context menu during resize
    const contextMenuHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      return false;
    };
    document.addEventListener('contextmenu', contextMenuHandler, { passive: false, capture: true });
    
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
    if (contentScrollRef.current) {
      contentScrollRef.current.style.pointerEvents = 'auto';
    }
    
    return () => {
      console.log('[CLEANUP] Cleaning up resize listeners');
      document.removeEventListener('mousemove', mouseMoveHandler, { capture: true });
      document.removeEventListener('mouseup', mouseUpHandler, { capture: true });
      document.removeEventListener('mouseleave', mouseLeaveHandler, { capture: true });
      window.removeEventListener('mouseleave', mouseLeaveHandler, { capture: true });
      document.removeEventListener('selectstart', selectStartHandler, { capture: true });
      document.removeEventListener('dragstart', selectStartHandler, { capture: true });
      document.removeEventListener('submit', globalSubmitHandler, { capture: true });
      document.removeEventListener('click', globalClickHandler, { capture: true });
      document.removeEventListener('contextmenu', contextMenuHandler, { capture: true });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      if (contentScrollRef.current) {
        contentScrollRef.current.style.pointerEvents = '';
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Ensure resize ends
      if (!isMouseUpHandled.current) {
        handleTaskResizeEnd();
      }
    };
  }, [resizingTask]);

  // Auto-scroll to today's position on mount or view change
  useEffect(() => {
    const scrollToToday = () => {
      if (!headerScrollRef.current || !contentScrollRef.current) return;
      
      let scrollPosition = 0;
      
      if (viewType === "day") {
        const todayIndex = days.findIndex(day => 
          day.toDateString() === today.toDateString()
        );
        if (todayIndex !== -1) {
          scrollPosition = Math.max(0, (todayIndex - 9) * 120);
        }
      } else if (viewType === "week") {
        const todayWeekIndex = weeks.findIndex(week => weekContainsToday(week));
        if (todayWeekIndex !== -1) {
          scrollPosition = Math.max(0, (todayWeekIndex - 5) * 150);
        }
      } else if (viewType === "month") {
        const todayMonthIndex = months.findIndex(month => 
          month.getFullYear() === today.getFullYear() && 
          month.getMonth() === today.getMonth()
        );
        if (todayMonthIndex !== -1) {
          scrollPosition = Math.max(0, (todayMonthIndex - 3) * 180);
        }
      } else if (viewType === "quarter") {
        const todayQuarter = Math.floor(today.getMonth() / 3);
        const todayQuarterIndex = quarters.findIndex(quarter => {
          const quarterNum = Math.floor(quarter.getMonth() / 3);
          return quarter.getFullYear() === today.getFullYear() && quarterNum === todayQuarter;
        });
        if (todayQuarterIndex !== -1) {
          scrollPosition = Math.max(0, (todayQuarterIndex - 2) * 240);
        }
      }
      
      // Double-check refs are still available before accessing
      if (headerScrollRef.current && contentScrollRef.current) {
        headerScrollRef.current.scrollLeft = scrollPosition;
        contentScrollRef.current.scrollLeft = scrollPosition;
      }
    };
    
    // Use a timeout to ensure DOM is ready, and check if component is still mounted
    const timeoutId = setTimeout(() => {
      if (headerScrollRef.current && contentScrollRef.current) {
        scrollToToday();
      }
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [viewType]);

  // Calculate today line position
  const getTodayLinePosition = () => {
    let timelineStart: Date;
    let timelineEnd: Date;
    
    if (viewType === "day") {
      timelineStart = days[0];
      timelineEnd = days[days.length - 1];
    } else if (viewType === "week") {
      timelineStart = weeks[0];
      const lastWeek = weeks[weeks.length - 1];
      timelineEnd = new Date(lastWeek);
      timelineEnd.setDate(lastWeek.getDate() + 6);
    } else if (viewType === "month") {
      timelineStart = months[0];
      timelineEnd = new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 0);
      } else {
      timelineStart = quarters[0];
      const lastQuarter = quarters[quarters.length - 1];
      timelineEnd = new Date(lastQuarter.getFullYear(), lastQuarter.getMonth() + 3, 0);
    }
    
    const totalDays = Math.floor((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const todayDays = Math.floor((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    
    return (todayDays / totalDays) * 100;
  };

  const todayPosition = getTodayLinePosition();

  // Get task color - prioritize status color from statuses array
  const getTaskColor = (task: Task) => {
    // First, check if status has a color directly
    if (task.status?.color) return task.status.color;
    
    // If not, look up the color from the statuses array
    if (task.status?.id || task.status?.name) {
      const statusFromArray = statuses.find(s => 
        s.id === task.status?.id || s.name === task.status?.name
      );
      if (statusFromArray?.color) return statusFromArray.color;
    }
    
    // Fallback to task.color if no status color found
    if (task.color) return task.color;
    
    // Last resort: default colors based on status name
    const statusName = task.status?.name?.toLowerCase() || '';
    if (statusName.includes('done') || statusName.includes('complete')) return '#10B981';
    if (statusName.includes('progress')) return '#4353FF';
    if (statusName.includes('review')) return '#9333EA';
    
    return '#8B5CF6';
  };

  // Toggle group collapse/expand
  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
        } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  // Group tasks based on groupBy selection
  const groupedTasks = (() => {
    const filteredTasks = showCompleted 
      ? roadmapTasks 
      : roadmapTasks.filter(task => {
          const statusName = task.status?.name?.toLowerCase() || '';
          return !statusName.includes('done') && !statusName.includes('complete');
        });

    if (groupBy === "none") {
      return { "All Tasks": filteredTasks };
    } else if (groupBy === "status") {
      return filteredTasks.reduce((acc, task) => {
        const status = task.status?.name || "No Status";
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(task);
        return acc;
      }, {} as Record<string, Task[]>);
    } else if (groupBy === "assignee") {
      return filteredTasks.reduce((acc, task) => {
        const assignee = task.assignee?.name || task.assignee?.email || "Unassigned";
        if (!acc[assignee]) {
          acc[assignee] = [];
        }
        acc[assignee].push(task);
        return acc;
      }, {} as Record<string, Task[]>);
      } else {
      return filteredTasks.reduce((acc, task) => {
        const space = task.space?.name || "No Space";
        if (!acc[space]) {
          acc[space] = [];
        }
        acc[space].push(task);
        return acc;
      }, {} as Record<string, Task[]>);
    }
  })();

  // Handle task click
  const handleTaskClick = async (task: Task) => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${task.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.task) {
          // Ensure the task has all required RoadmapTask fields
          const editorTask: EditorTask = {
            id: data.task.id,
            number: data.task.number,
            summary: data.task.summary || task.summary,
            description: data.task.description,
            startDate: data.task.startDate,
            dueDate: data.task.dueDate,
            status: data.task.status,
            assignee: data.task.assignee,
            priority: data.task.priority || task.priority || 'NORMAL',
            space: data.task.space || task.space,
            sprint: data.task.sprint,
            sprints: data.task.sprints,
            customFieldValues: data.task.customFieldValues,
          };
          setSelectedTask(editorTask as Task);
          setEditorOpen(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch task details:', error);
      // Ensure the task has all required RoadmapTask fields when using fallback
      const editorTask: EditorTask = {
        ...task,
        priority: task.priority || 'NORMAL',
        summary: task.summary || '',
      };
      setSelectedTask(editorTask as Task);
      setEditorOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)] text-[var(--foreground)]">
      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
                className="border-[var(--border)] text-[var(--foreground)] gap-2"
            >
                {groupBy === "none" ? "No grouping" : `Group by ${groupBy === "status" ? "Status" : groupBy === "assignee" ? "Assignee" : "Space"}`}
                <ChevronDown className="w-3.5 h-3.5" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setGroupBy("none")}>
                No grouping
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("status")}>
                Group by Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("assignee")}>
                Group by Assignee
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("space")}>
                Group by Space
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center gap-1 bg-[var(--muted)]/30 rounded-lg p-0.5">
            <button
              onClick={() => setViewType("day")}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                viewType === "day"
                  ? "bg-[#4353FF] text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewType("week")}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                viewType === "week"
                  ? "bg-[#4353FF] text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewType("month")}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                viewType === "month"
                  ? "bg-[#4353FF] text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewType("quarter")}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                viewType === "quarter"
                  ? "bg-[#4353FF] text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Quarter
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="show-completed"
              checked={showCompleted}
            onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
            />
          <label
            htmlFor="show-completed"
            className="text-sm cursor-pointer select-none"
          >
            Show Completed
          </label>
        </div>
      </div>

      {/* Roadmap Timeline */}
      <div className={`flex-1 overflow-auto ${isResizing ? 'select-none' : ''}`}>
        <div className="flex min-h-full">
          {/* Left Sidebar - Task List */}
          <div 
            className="border-r border-[var(--border)] bg-[var(--card)] flex-shrink-0 relative"
            style={{ width: `${sidebarWidth}px` }}
          >
            {/* Column Headers */}
            <div className="h-14 px-4 flex items-center gap-2 text-sm sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Tasks</span>
                </div>

            {/* Task List */}
            <div>
              {Object.entries(groupedTasks).map(([status, statusTasks]) => {
                const isCollapsed = collapsedGroups.has(status);
                
                return (
                  <div key={status}>
                    {/* Group Header */}
                    <div 
                      className="h-10 px-4 bg-gradient-to-r from-[var(--muted)]/30 to-[var(--muted)]/10 border-b border-[var(--border)] flex items-center gap-2 sticky top-14 z-10 backdrop-blur-sm overflow-hidden cursor-pointer hover:from-[var(--muted)]/40 hover:to-[var(--muted)]/20 transition-all"
                      onClick={() => toggleGroup(status)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                      )}
                      <span className="text-sm text-[var(--foreground)] truncate flex-1 min-w-0">{status}</span>
                      <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full flex-shrink-0">
                        {statusTasks.length}
                            </span>
                          </div>

                    {/* Tasks */}
                    {!isCollapsed && statusTasks.map((task) => {
                    const taskKey = task.space?.ticker && task.number 
                      ? `${task.space.ticker}-${task.number}`
                      : task.id.slice(0, 8);
                    const color = getTaskColor(task);
                    
                    return (
                      <div
                        key={task.id}
                        className="h-10 px-4 border-b border-[var(--border)] hover:bg-[var(--muted)]/20 cursor-pointer transition-all duration-200 group flex items-center overflow-hidden"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="text-sm flex items-center gap-2 min-w-0 flex-1">
                          <div 
                            className="w-1.5 h-1.5 rounded-full transition-all flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors flex-shrink-0">{taskKey}</span>
                          <span className="ml-1 text-[var(--foreground)]/80 group-hover:text-[var(--foreground)] transition-colors truncate min-w-0">{task.summary}</span>
                        </div>
                          </div>
                        );
                      })}
                </div>
              );
            })}
          </div>
            
            {/* Resize Handle */}
            <div
              className={`absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--primary)] transition-colors z-30 group ${
                isResizing ? 'bg-[var(--primary)]' : ''
              }`}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute top-0 right-0 bottom-0 w-1.5 -translate-x-0.5" />
          </div>
        </div>

          {/* Timeline Grid */}
          <div className="flex-1 relative min-w-0 flex flex-col">
            {/* Timeline Headers - Scrollable */}
            <div 
              ref={headerScrollRef}
              onScroll={handleScroll('header')}
              className="hide-scrollbar sticky top-0 z-20 bg-gradient-to-b from-[var(--card)] to-[var(--card)]/95 border-b border-[var(--border)] backdrop-blur-sm overflow-x-auto relative"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                willChange: 'scroll-position',
                transform: 'translateZ(0)', // Force hardware acceleration
              }}
            >
              {/* Vertical Division Lines Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="flex h-full" style={{ width: `${timelineWidth}px` }}>
                  {viewType === "day" ? (
                    days.map((_, index) => (
                      <div
                        key={index}
                        className="border-r border-[var(--border)] w-[120px] h-full"
                      />
                    ))
                  ) : viewType === "week" ? (
                    weeks.map((_, index) => (
                      <div
                        key={index}
                        className="border-r border-[var(--border)] w-[150px] h-full"
                      />
                    ))
                  ) : viewType === "month" ? (
                    months.map((_, index) => (
                      <div
                        key={index}
                        className="border-r border-[var(--border)] w-[180px] h-full"
                      />
                    ))
                  ) : (
                    quarters.map((_, index) => (
                      <div
                        key={index}
                        className="border-r border-[var(--border)] w-[240px] h-full"
                      />
                    ))
                  )}
                </div>
              </div>
              <div className="flex min-w-max relative z-0">
                {viewType === "day" ? (
                  days.map((day, index) => (
                    <div
                      key={index}
                      className="h-14 px-2 flex flex-col justify-center items-center border-r border-[var(--border)] last:border-r-0 hover:bg-[var(--muted)]/20 transition-colors w-[120px]"
                    >
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {dayNames[day.getDay()]}
                      </div>
                      <div className="text-sm text-[var(--foreground)]">
                        {day.getMonth() + 1}/{day.getDate()}
                      </div>
                    </div>
                  ))
                ) : viewType === "week" ? (
                  weeks.map((week, index) => {
                    const weekEnd = new Date(week);
                    weekEnd.setDate(week.getDate() + 6);
                    const isToday = weekContainsToday(week);
                return (
                  <div
                        key={index}
                        className="h-14 px-3 flex flex-col justify-center items-center border-r border-[var(--border)] last:border-r-0 hover:bg-[var(--muted)]/20 transition-colors w-[150px] relative"
                      >
                        {isToday && (
                          <div 
                            className="absolute -top-2 left-1/2 -translate-x-1/2 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap z-30"
                    style={{
                              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                            }}
                          >
                            TODAY
                      </div>
                    )}
                        <div className="text-sm text-[var(--foreground)]">
                          {week.getMonth() + 1}/{week.getDate()}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {weekEnd.getMonth() + 1}/{weekEnd.getDate()}
                      </div>
                  </div>
                );
                  })
                ) : viewType === "month" ? (
                  months.map((month, index) => (
                    <div
                      key={index}
                      className="h-14 px-4 flex flex-col justify-center border-r border-[var(--border)] last:border-r-0 hover:bg-[var(--muted)]/20 transition-colors w-[180px]"
                    >
                      <div className="text-sm text-[var(--foreground)]">
                        {monthNames[month.getMonth()]}
                  </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {month.getFullYear()}
                </div>
            </div>
                  ))
                ) : (
                  quarters.map((quarter, index) => {
                    // Calculate quarter number (Q1, Q2, Q3, Q4) from month (0-11)
                    const quarterNum = Math.floor(quarter.getMonth() / 3) + 1;
                    return (
                      <div
                        key={index}
                        className="h-14 px-4 flex flex-col justify-center items-center border-r border-[var(--border)] last:border-r-0 hover:bg-[var(--muted)]/20 transition-colors w-[240px]"
                      >
                        <div className="text-sm text-[var(--foreground)]">
                          Q{quarterNum}
                </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {quarter.getFullYear()}
                </div>
                </div>
                    );
                  })
              )}
            </div>
          </div>

            {/* Timeline Rows - Scrollable */}
              <div
              ref={contentScrollRef}
              onScroll={handleScroll('content')}
              className="hide-scrollbar flex-1 overflow-x-auto overflow-y-visible"
                style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                willChange: 'scroll-position',
                transform: 'translateZ(0)', // Force hardware acceleration
              }}
            >
              <div className="relative" style={{ minWidth: `${timelineWidth}px` }}>
                {/* Grid Lines */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  <div className="flex h-full" style={{ width: `${timelineWidth}px` }}>
                    {viewType === "day" ? (
                      days.map((_, index) => (
                        <div
                          key={index}
                          className="w-[120px] h-full"
                  style={{ 
                            borderRight: '1px solid var(--border)',
                          }}
                        />
                      ))
                    ) : viewType === "week" ? (
                      weeks.map((_, index) => (
                        <div
                          key={index}
                          className="w-[150px] h-full"
                                  style={{
                            borderRight: '1px solid var(--border)',
                          }}
                        />
                      ))
                    ) : viewType === "month" ? (
                      months.map((_, index) => (
                        <div
                          key={index}
                          className="w-[180px] h-full"
                          style={{
                            borderRight: '1px solid var(--border)',
                          }}
                        />
                      ))
                    ) : (
                      quarters.map((_, index) => (
                        <div
                          key={index}
                          className="w-[240px] h-full"
                          style={{
                            borderRight: '1px solid var(--border)',
                          }}
                        />
                      ))
                                  )}
                </div>
                </div>

                {/* Today Line - Only show in day and month views */}
                {viewType !== "week" && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
              style={{ 
                      left: `${todayPosition}%`,
                      background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)',
                      zIndex: 25,
                    }}
                  >
                    {/* TODAY Label */}
                    <div 
                      className="absolute -top-6 left-1/2 -translate-x-1/2 text-white text-xs px-3 py-1 rounded-md whitespace-nowrap shadow-lg animate-pulse"
                  style={{ 
                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)',
                        zIndex: 30,
                      }}
                    >
                      TODAY
                      </div>
                  </div>
                )}

                {/* Task Bars */}
                <div className="relative" style={{ width: `${timelineWidth}px` }}>
                  {Object.entries(groupedTasks).map(([status, statusTasks]) => {
                    const isCollapsed = collapsedGroups.has(status);
                    
                  return (
                      <div key={status}>
                        {/* Group Header Row */}
                        <div className="h-10 bg-gradient-to-r from-[var(--muted)]/30 to-[var(--muted)]/10 border-b border-[var(--border)] backdrop-blur-sm relative z-0" style={{ width: `${timelineWidth}px` }} />

                        {/* Task Rows */}
                        {!isCollapsed && statusTasks.map((task, index) => {
                        const color = getTaskColor(task);
                        const isResizingThisTask = resizingTask?.taskId === task.id;
                        // Calculate style, but don't apply it during resize (we'll use DOM manipulation)
                        const calculatedStyle = getTaskBarStyle(task);

                        return (
                          <div
                            key={task.id}
                            className="relative h-10 border-b border-[var(--border)] hover:bg-[var(--muted)]/10 transition-colors z-[5]"
                            style={{ width: `${timelineWidth}px` }}
                          >
                            {/* Task Bar */}
                            <div
                              ref={(el) => {
                                if (el) {
                                  taskBarRefs.current.set(task.id, el);
                                  
                                  // During resize, preserve DOM styles and prevent React from overwriting
                                  if (isResizingThisTask && resizingTaskRef.current?.taskId === task.id) {
                                    // During resize, always use the preserved style from resize handler
                                    // This prevents React from overwriting with stale calculated styles
                                    if (resizeStartStyle.current) {
                                      // Use the latest preserved style to prevent shaking
                                      el.style.left = resizeStartStyle.current.left;
                                      el.style.width = resizeStartStyle.current.width;
                                      el.style.transition = 'none';
                                    } else {
                                      // Fallback to current DOM style if preserved style not available
                                      const currentLeft = el.style.left;
                                      const currentWidth = el.style.width;
                                      if (currentLeft && currentWidth && 
                                          currentLeft !== '0%' && currentWidth !== '0%' &&
                                          currentWidth !== '0px') {
                                        el.style.transition = 'none';
                                      } else {
                                        // Last resort: use calculated style
                                        el.style.left = calculatedStyle.left;
                                        el.style.width = calculatedStyle.width;
                                        el.style.transition = 'none';
                                      }
                                    }
                                    
                                    // Preserve styles after React tries to update (double-check)
                                    requestAnimationFrame(() => {
                                      if (resizingTaskRef.current?.taskId === task.id && resizeStartStyle.current) {
                                        // Always use the preserved style during resize to prevent shaking
                                        el.style.left = resizeStartStyle.current.left;
                                        el.style.width = resizeStartStyle.current.width;
                                        el.style.transition = 'none';
                                      }
                                    });
                                  } else {
                                    // When not resizing, let React control the styles
                                    el.style.transition = '';
                                  }
                                } else {
                                  taskBarRefs.current.delete(task.id);
                                }
                              }}
                              className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-lg px-3 flex items-center cursor-pointer group ${
                                isResizingThisTask
                                  ? 'task-bar-resizing' 
                                  : 'transition-all hover:shadow-xl hover:scale-[1.03]'
                                  }`}
                                  style={{
                                    // CRITICAL: During resize, use preserved style to prevent disappearing
                                    // This ensures the task bar always has valid position/size
                                    ...(isResizingThisTask ? {
                                      // Use preserved style or calculated style as fallback
                                      left: resizeStartStyle.current?.left || calculatedStyle.left,
                                      width: resizeStartStyle.current?.width || calculatedStyle.width,
                                    } : calculatedStyle),
                                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                                boxShadow: `0 2px 8px ${color}40, 0 0 0 1px ${color}20`,
                                willChange: isResizingThisTask ? 'left, width' : 'auto',
                                transform: 'translateZ(0)', // Force hardware acceleration
                                zIndex: isResizingThisTask ? 15 : 5, // Ensure resizing task is always on top
                                contain: 'layout style paint', // Isolate rendering
                                // Preserve inline styles set by DOM manipulation
                                ...(isResizingThisTask ? {
                                  pointerEvents: 'auto' as const,
                                } : {})
                              }}
                              onClick={(e) => {
                                // CRITICAL: Don't trigger click if resizing or clicking on resize handle
                                const target = e.target as HTMLElement;
                                
                                // Check if clicking on any resize handle first (before other checks)
                                if (target.closest('[data-resize-handle]')) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if ((e as any).stopImmediatePropagation) {
                                    (e as any).stopImmediatePropagation();
                                  }
                                  const nativeEvent = e.nativeEvent;
                                  if (nativeEvent) {
                                    if (nativeEvent.preventDefault) nativeEvent.preventDefault();
                                    if (nativeEvent.stopPropagation) nativeEvent.stopPropagation();
                                    if ((nativeEvent as any).stopImmediatePropagation) {
                                      (nativeEvent as any).stopImmediatePropagation();
                                    }
                                  }
                                  return false;
                                }
                                
                                if (resizingTask || resizingTaskRef.current) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if ((e as any).stopImmediatePropagation) {
                                    (e as any).stopImmediatePropagation();
                                  }
                                  const nativeEvent = e.nativeEvent;
                                  if (nativeEvent) {
                                    if (nativeEvent.preventDefault) nativeEvent.preventDefault();
                                    if (nativeEvent.stopPropagation) nativeEvent.stopPropagation();
                                    if ((nativeEvent as any).stopImmediatePropagation) {
                                      (nativeEvent as any).stopImmediatePropagation();
                                    }
                                  }
                                  return false;
                                }
                                
                                handleTaskClick(task);
                              }}
                              onMouseUp={(e) => {
                                // Prevent any default behavior on mouse up if we were resizing
                                if (resizingTask) {
                                    e.stopPropagation();
                                      e.preventDefault();
                                  const nativeEvent = e.nativeEvent;
                                  if (nativeEvent.preventDefault) nativeEvent.preventDefault();
                                  if (nativeEvent.stopPropagation) nativeEvent.stopPropagation();
                                }
                              }}
                            >
                              {/* Left Resize Handle */}
                              <div
                                data-resize-handle="left"
                                className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize z-20 flex items-center justify-center pointer-events-auto"
                                onMouseDown={(e: React.MouseEvent) => {
                                  // CRITICAL: Prevent everything immediately - FIRST THING
                                      e.preventDefault();
                                  e.stopPropagation();
                                  if ((e as any).stopImmediatePropagation) {
                                    (e as any).stopImmediatePropagation();
                                  }
                                  
                                  const nativeEvent = e.nativeEvent;
                                  if (nativeEvent) {
                                    if (nativeEvent.preventDefault) nativeEvent.preventDefault();
                                    if (nativeEvent.stopPropagation) nativeEvent.stopPropagation();
                                    if ((nativeEvent as any).stopImmediatePropagation) {
                                      (nativeEvent as any).stopImmediatePropagation();
                                    }
                                  }
                                  
                                  // Call handler
                                  handleTaskResizeStart(e, task.id, 'left', task);
                                  return false;
                                }}
                                onClick={(e: React.MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  const nativeEvent = e.nativeEvent;
                                  if (nativeEvent.preventDefault) nativeEvent.preventDefault();
                                  if (nativeEvent.stopPropagation) nativeEvent.stopPropagation();
                                  if ('stopImmediatePropagation' in nativeEvent && typeof (nativeEvent as any).stopImmediatePropagation === 'function') {
                                    (nativeEvent as any).stopImmediatePropagation();
                                  }
                                  return false;
                                }}
                                onContextMenu={(e: React.MouseEvent) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return false;
                                }}
                      style={{
                                  background: 'transparent',
                                  opacity: 0.7,
                                  transition: 'opacity 0.2s',
                                  touchAction: 'none',
                                  WebkitUserSelect: 'none',
                                  userSelect: 'none',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '0.7';
                                }}
                              >
                                <div className="w-1 h-4 bg-white/80 rounded-full shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                              
                              <span className="text-xs text-white font-medium truncate drop-shadow-sm pointer-events-none mr-3">
                                  {task.summary}
                                </span>
                              
                              {/* Right Resize Handle */}
                              <div
                                data-resize-handle="right"
                                className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize z-30 flex items-center justify-center pointer-events-auto"
                                style={{
                                  background: 'transparent',
                                  opacity: 0.7,
                                  transition: 'opacity 0.2s',
                                  touchAction: 'none',
                                  WebkitUserSelect: 'none',
                                  userSelect: 'none',
                                }}
                                onMouseDown={(e: React.MouseEvent) => {
                                  // CRITICAL: Prevent everything immediately - FIRST THING
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if ((e as any).stopImmediatePropagation) {
                                    (e as any).stopImmediatePropagation();
                                  }
                                  
                                  const nativeEvent = e.nativeEvent;
                                  if (nativeEvent) {
                                    if (nativeEvent.preventDefault) nativeEvent.preventDefault();
                                    if (nativeEvent.stopPropagation) nativeEvent.stopPropagation();
                                    if ((nativeEvent as any).stopImmediatePropagation) {
                                      (nativeEvent as any).stopImmediatePropagation();
                                    }
                                  }
                                  
                                  // Call handler with right edge
                                  handleTaskResizeStart(e, task.id, 'right', task);
                                  return false;
                                }}
                                onClick={(e: React.MouseEvent) => {
                                    e.preventDefault();
                                  e.stopPropagation();
                                  if ((e as any).stopImmediatePropagation) {
                                    (e as any).stopImmediatePropagation();
                                  }
                                  const nativeEvent = e.nativeEvent;
                                  if (nativeEvent) {
                                    if (nativeEvent.preventDefault) nativeEvent.preventDefault();
                                    if (nativeEvent.stopPropagation) nativeEvent.stopPropagation();
                                    if ((nativeEvent as any).stopImmediatePropagation) {
                                      (nativeEvent as any).stopImmediatePropagation();
                                    }
                                  }
                                  return false;
                                }}
                                onContextMenu={(e: React.MouseEvent) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return false;
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '0.7';
                                }}
                              >
                                <div className="w-1 h-4 bg-white/80 rounded-full shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              
                              {/* Shine effect */}
                              <div 
                                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{
                                  background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)`,
                                }}
                              />
                              </div>
                          </div>
                      );
                    })}
                  </div>
                );
              })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Editor */}
      <RoadmapTaskEditor
        task={selectedTask}
        spaceSlug={spaceSlug}
        statuses={statuses}
        users={users}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setSelectedTask(null);
        }}
        onSave={() => {
          // Don't refetch on save - let the parent handle optimistic updates
          // Only refetch if explicitly needed (e.g., after creating new tasks)
        }}
        onNavigateToFullPage={() => {
          if (selectedTask) {
            setEditorOpen(false);
            router.push(`/spaces/${spaceSlug}/tasks/${selectedTask.id}`);
          }
        }}
      />
    </div>
  );
}
