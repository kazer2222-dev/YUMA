import { Calendar, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface RoadmapTask {
  id: string;
  title: string;
  status: string;
  assignee?: string;
  space?: string;
  startDate: Date;
  endDate: Date;
  color?: string;
}

const sampleTasks: RoadmapTask[] = [
  {
    id: "RMD-14",
    title: "RMD-14",
    status: "Backlog",
    assignee: "John Doe",
    space: "Engineering",
    startDate: new Date(2025, 8, 15), // Sep 15, 2025
    endDate: new Date(2025, 9, 30), // Oct 30, 2025
    color: "#8B5CF6", // Purple
  },
  {
    id: "TTF-2",
    title: "summary",
    status: "Backlog",
    assignee: "Jane Smith",
    space: "Design",
    startDate: new Date(2025, 8, 20), // Sep 20, 2025
    endDate: new Date(2025, 10, 10), // Nov 10, 2025
    color: "#3B82F6", // Blue
  },
  {
    id: "TTF-1",
    title: "Test",
    status: "Backlog",
    assignee: "John Doe",
    space: "Engineering",
    startDate: new Date(2025, 9, 1), // Oct 1, 2025
    endDate: new Date(2026, 0, 31), // Jan 31, 2026
    color: "#10B981", // Green
  },
  {
    id: "TTF-4",
    title: "RMD-15 — Smooth, Front-End-Only...",
    status: "Backlog",
    assignee: "Mike Johnson",
    space: "Product",
    startDate: new Date(2025, 9, 10), // Oct 10, 2025
    endDate: new Date(2025, 10, 5), // Nov 5, 2025
    color: "#F59E0B", // Amber
  },
  {
    id: "TTF-5",
    title: "created from backlog",
    status: "Backlog",
    assignee: "Jane Smith",
    space: "Design",
    startDate: new Date(2025, 10, 1), // Nov 1, 2025
    endDate: new Date(2025, 10, 20), // Nov 20, 2025
    color: "#EF4444", // Red
  },
  {
    id: "TTF-6",
    title: "bitch",
    status: "Backlog",
    assignee: "John Doe",
    space: "Engineering",
    startDate: new Date(2025, 10, 5), // Nov 5, 2025
    endDate: new Date(2025, 11, 1), // Dec 1, 2025
    color: "#EC4899", // Pink
  },
  {
    id: "TTF-7",
    title: "sddssd",
    status: "Backlog",
    assignee: "Mike Johnson",
    space: "Product",
    startDate: new Date(2025, 10, 10), // Nov 10, 2025
    endDate: new Date(2025, 11, 5), // Dec 5, 2025
    color: "#06B6D4", // Cyan
  },
  {
    id: "TTF-8",
    title: "sdsri",
    status: "Backlog",
    assignee: "Jane Smith",
    space: "Design",
    startDate: new Date(2025, 10, 15), // Nov 15, 2025
    endDate: new Date(2025, 11, 10), // Dec 10, 2025
    color: "#14B8A6", // Teal
  },
  {
    id: "TTF-9",
    title: "scaza",
    status: "Backlog",
    assignee: "Unassigned",
    space: "Marketing",
    startDate: new Date(2025, 10, 20), // Nov 20, 2025
    endDate: new Date(2025, 11, 15), // Dec 15, 2025
    color: "#A855F7", // Violet
  },
];

interface ClickUpRoadmapProps {
  tasks?: RoadmapTask[];
}

export function ClickUpRoadmap({ tasks = sampleTasks }: ClickUpRoadmapProps) {
  const [viewType, setViewType] = useState<"day" | "week" | "month" | "quarter">("month");
  const [showCompleted, setShowCompleted] = useState(false);
  const [groupBy, setGroupBy] = useState<"none" | "status" | "assignee" | "space">("status");
  const [sidebarWidth, setSidebarWidth] = useState(224); // 224px = w-56
  const [isResizing, setIsResizing] = useState(false);
  const [roadmapTasks, setRoadmapTasks] = useState<RoadmapTask[]>(tasks);
  const [resizingTask, setResizingTask] = useState<{ taskId: string; edge: 'left' | 'right' } | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartDate = useRef<Date | null>(null);
  const resizeEndDate = useRef<Date | null>(null);

  // Add styles to hide scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Refs for scroll sync
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const today = new Date(2025, 10, 5); // Nov 5, 2025 (matching the week view image)

  // Generate days for the timeline (±2 years from today - ~730 days each direction)
  const generateDays = () => {
    const days = [];
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 2);
    startDate.setDate(1); // Start of month
    
    // Generate ~4 years worth of days (from -2 years to +2 years)
    for (let i = 0; i < 1460; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // Generate weeks for the timeline (±2 years from today - ~104 weeks each direction)
  const generateWeeks = () => {
    const weeks = [];
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 2);
    startDate.setMonth(0, 1); // Start of year
    
    // Generate ~4 years worth of weeks (from -2 years to +2 years)
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

  // Generate months for the timeline (±2 years from today - 24 months each direction)
  const generateMonths = () => {
    const months = [];
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 2);
    startDate.setMonth(0, 1); // Start of year
    
    // Generate 4 years worth of months (from -2 years to +2 years)
    for (let i = 0; i < 48; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      months.push(monthDate);
    }
    
    return months;
  };

  // Generate quarters for the timeline (±2 years from today - 8 quarters each direction)
  const generateQuarters = () => {
    const quarters = [];
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 2);
    startDate.setMonth(0, 1); // Start of year
    
    // Generate ~4 years worth of quarters (from -2 years to +2 years)
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
  const getTaskBarStyle = (task: RoadmapTask) => {
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
      // quarter
      timelineStart = quarters[0];
      const lastQuarter = quarters[quarters.length - 1];
      timelineEnd = new Date(lastQuarter.getFullYear(), lastQuarter.getMonth() + 3, 0);
    }
    
    const totalDays = Math.floor((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const startDays = Math.floor((task.startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
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
    
    const newWidth = e.clientX;
    if (newWidth >= 150 && newWidth <= 500) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Handle task bar resize
  const handleTaskResizeStart = (
    e: React.MouseEvent,
    taskId: string,
    edge: 'left' | 'right',
    task: RoadmapTask
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
    setResizingTask({ taskId, edge });
    resizeStartX.current = e.clientX;
    resizeStartDate.current = new Date(task.startDate);
    resizeEndDate.current = new Date(task.endDate);
  };

  const handleTaskResizeMove = (e: MouseEvent) => {
    if (!resizingTask || !contentScrollRef.current) return;

    const deltaX = e.clientX - resizeStartX.current;
    
    // Calculate how many days the delta represents (using fractional days for smooth resizing)
    let pixelsPerDay: number;
    
    if (viewType === 'day') {
      pixelsPerDay = 120; // 120px per day
    } else if (viewType === 'week') {
      pixelsPerDay = 150 / 7; // 150px per week = ~21.43px per day
    } else if (viewType === 'month') {
      pixelsPerDay = 180 / 30; // 180px per month = 6px per day (assuming 30 days)
    } else {
      // quarter
      pixelsPerDay = 240 / 90; // 240px per quarter = ~2.67px per day (assuming 90 days)
    }
    
    // Calculate fractional days moved (no rounding for smooth resizing)
    const daysChange = deltaX / pixelsPerDay;
    
    setRoadmapTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id !== resizingTask.taskId) return task;
        
        const newTask = { ...task };
        
        if (resizingTask.edge === 'left') {
          // Resize from the start
          const newStartDate = new Date(resizeStartDate.current!);
          // Add fractional days as milliseconds
          newStartDate.setTime(newStartDate.getTime() + daysChange * 24 * 60 * 60 * 1000);
          
          // Don't allow start date to be after end date (leave at least 1 day)
          const oneDayBeforeEnd = new Date(task.endDate);
          oneDayBeforeEnd.setDate(oneDayBeforeEnd.getDate() - 1);
          
          if (newStartDate < oneDayBeforeEnd) {
            newTask.startDate = newStartDate;
          } else {
            newTask.startDate = oneDayBeforeEnd;
          }
        } else {
          // Resize from the end
          const newEndDate = new Date(resizeEndDate.current!);
          // Add fractional days as milliseconds
          newEndDate.setTime(newEndDate.getTime() + daysChange * 24 * 60 * 60 * 1000);
          
          // Don't allow end date to be before start date (leave at least 1 day)
          const oneDayAfterStart = new Date(task.startDate);
          oneDayAfterStart.setDate(oneDayAfterStart.getDate() + 1);
          
          if (newEndDate > oneDayAfterStart) {
            newTask.endDate = newEndDate;
          } else {
            newTask.endDate = oneDayAfterStart;
          }
        }
        
        return newTask;
      })
    );
  };

  const handleTaskResizeEnd = () => {
    setResizingTask(null);
  };

  // Scroll sync handler
  const handleScroll = (source: 'header' | 'content') => (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (source === 'header' && contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = target.scrollLeft;
    } else if (source === 'content' && headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = target.scrollLeft;
    }
  };

  // Add/remove event listeners for sidebar resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Add/remove event listeners for task resizing
  useEffect(() => {
    if (resizingTask) {
      document.addEventListener('mousemove', handleTaskResizeMove);
      document.addEventListener('mouseup', handleTaskResizeEnd);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleTaskResizeMove);
      document.removeEventListener('mouseup', handleTaskResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleTaskResizeMove);
      document.removeEventListener('mouseup', handleTaskResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
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
          scrollPosition = Math.max(0, (todayIndex - 9) * 120); // Center today, 120px per day
        }
      } else if (viewType === "week") {
        const todayWeekIndex = weeks.findIndex(week => weekContainsToday(week));
        if (todayWeekIndex !== -1) {
          scrollPosition = Math.max(0, (todayWeekIndex - 5) * 150); // Center today, 150px per week
        }
      } else if (viewType === "month") {
        const todayMonthIndex = months.findIndex(month => 
          month.getFullYear() === today.getFullYear() && 
          month.getMonth() === today.getMonth()
        );
        if (todayMonthIndex !== -1) {
          scrollPosition = Math.max(0, (todayMonthIndex - 3) * 180); // Center today, 180px per month
        }
      } else if (viewType === "quarter") {
        const todayQuarter = Math.floor(today.getMonth() / 3);
        const todayQuarterIndex = quarters.findIndex(quarter => {
          const quarterNum = Math.floor(quarter.getMonth() / 3);
          return quarter.getFullYear() === today.getFullYear() && quarterNum === todayQuarter;
        });
        if (todayQuarterIndex !== -1) {
          scrollPosition = Math.max(0, (todayQuarterIndex - 2) * 240); // Center today, 240px per quarter
        }
      }
      
      headerScrollRef.current.scrollLeft = scrollPosition;
      contentScrollRef.current.scrollLeft = scrollPosition;
    };
    
    // Small delay to ensure DOM is ready
    setTimeout(scrollToToday, 100);
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
      // quarter
      timelineStart = quarters[0];
      const lastQuarter = quarters[quarters.length - 1];
      timelineEnd = new Date(lastQuarter.getFullYear(), lastQuarter.getMonth() + 3, 0);
    }
    
    const totalDays = Math.floor((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const todayDays = Math.floor((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    
    return (todayDays / totalDays) * 100;
  };

  const todayPosition = getTodayLinePosition();

  // Group tasks based on groupBy selection
  const groupedTasks = (() => {
    if (groupBy === "none") {
      return { "All Tasks": roadmapTasks };
    } else if (groupBy === "status") {
      return roadmapTasks.reduce((acc, task) => {
        if (!acc[task.status]) {
          acc[task.status] = [];
        }
        acc[task.status].push(task);
        return acc;
      }, {} as Record<string, RoadmapTask[]>);
    } else if (groupBy === "assignee") {
      return roadmapTasks.reduce((acc, task) => {
        const assignee = task.assignee || "Unassigned";
        if (!acc[assignee]) {
          acc[assignee] = [];
        }
        acc[assignee].push(task);
        return acc;
      }, {} as Record<string, RoadmapTask[]>);
    } else {
      // groupBy === "space"
      return roadmapTasks.reduce((acc, task) => {
        const space = task.space || "No Space";
        if (!acc[space]) {
          acc[space] = [];
        }
        acc[space].push(task);
        return acc;
      }, {} as Record<string, RoadmapTask[]>);
    }
  })();

  return (
    <div className="flex flex-col h-full bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl mb-1">Roadmap</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Project roadmap for this space</p>
        </div>
      </div>

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
              {Object.entries(groupedTasks).map(([status, statusTasks]) => (
                <div key={status}>
                  {/* Group Header */}
                  <div className="h-10 px-4 bg-gradient-to-r from-[var(--muted)]/30 to-[var(--muted)]/10 border-b border-[var(--border)] flex items-center gap-2 sticky top-14 z-10 backdrop-blur-sm overflow-hidden">
                    <ChevronDown className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                    <span className="text-sm text-[var(--foreground)] truncate flex-1 min-w-0">{status}</span>
                    <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full flex-shrink-0">
                      {statusTasks.length}
                    </span>
                  </div>

                  {/* Tasks */}
                  {statusTasks.map((task) => (
                    <div
                      key={task.id}
                      className="h-10 px-4 border-b border-[var(--border)] hover:bg-[var(--muted)]/20 cursor-pointer transition-all duration-200 group flex items-center overflow-hidden"
                    >
                      <div className="text-sm flex items-center gap-2 min-w-0 flex-1">
                        <div 
                          className="w-1.5 h-1.5 rounded-full transition-all flex-shrink-0"
                          style={{ backgroundColor: task.color }}
                        />
                        <span className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors flex-shrink-0">{task.id}</span>
                        <span className="ml-1 text-[var(--foreground)]/80 group-hover:text-[var(--foreground)] transition-colors truncate min-w-0">{task.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
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
                        style={{
                          borderRightWidth: '1px',
                          borderRightColor: 'var(--border)',
                        }}
                      />
                    ))
                  ) : viewType === "week" ? (
                    weeks.map((_, index) => (
                      <div
                        key={index}
                        className="border-r border-[var(--border)] w-[150px] h-full"
                        style={{
                          borderRightWidth: '1px',
                          borderRightColor: 'var(--border)',
                        }}
                      />
                    ))
                  ) : viewType === "month" ? (
                    months.map((_, index) => (
                      <div
                        key={index}
                        className="border-r border-[var(--border)] w-[180px] h-full"
                        style={{
                          borderRightWidth: '1px',
                          borderRightColor: 'var(--border)',
                        }}
                      />
                    ))
                  ) : (
                    quarters.map((_, index) => (
                      <div
                        key={index}
                        className="border-r border-[var(--border)] w-[240px] h-full"
                        style={{
                          borderRightWidth: '1px',
                          borderRightColor: 'var(--border)',
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
              <div className="flex min-w-max relative z-0">
                {viewType === "day" ? (
                  // Day Headers
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
                  // Week Headers
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
                  // Month Headers
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
                  // Quarter Headers
                  quarters.map((quarter, index) => (
                    <div
                      key={index}
                      className="h-14 px-4 flex flex-col justify-center items-center border-r border-[var(--border)] last:border-r-0 hover:bg-[var(--muted)]/20 transition-colors w-[240px]"
                    >
                      <div className="text-sm text-[var(--foreground)]">
                        Q{index + 1}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {quarter.getFullYear()}
                      </div>
                    </div>
                  ))
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
                  {Object.entries(groupedTasks).map(([status, statusTasks]) => (
                    <div key={status}>
                      {/* Group Header Row */}
                      <div className="h-10 bg-gradient-to-r from-[var(--muted)]/30 to-[var(--muted)]/10 border-b border-[var(--border)] backdrop-blur-sm" style={{ width: `${timelineWidth}px` }} />

                      {/* Task Rows */}
                      {statusTasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="relative h-10 border-b border-[var(--border)] hover:bg-[var(--muted)]/10 transition-colors"
                          style={{ width: `${timelineWidth}px` }}
                        >
                          {/* Task Bar */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-7 rounded-lg px-3 flex items-center cursor-pointer transition-all hover:shadow-xl hover:scale-[1.03] hover:z-10 group"
                            style={{
                              ...getTaskBarStyle(task),
                              background: `linear-gradient(135deg, ${task.color || "#8B5CF6"} 0%, ${task.color || "#8B5CF6"}dd 100%)`,
                              boxShadow: `0 2px 8px ${task.color || "#8B5CF6"}40, 0 0 0 1px ${task.color || "#8B5CF6"}20`,
                            }}
                          >
                            {/* Left Resize Handle */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center"
                              onMouseDown={(e) => handleTaskResizeStart(e, task.id, 'left', task)}
                            >
                              <div className="w-1 h-4 bg-white/80 rounded-full shadow-sm" />
                            </div>
                            
                            <span className="text-xs text-white font-medium truncate drop-shadow-sm">
                              {task.title}
                            </span>
                            
                            {/* Right Resize Handle */}
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center"
                              onMouseDown={(e) => handleTaskResizeStart(e, task.id, 'right', task)}
                            >
                              <div className="w-1 h-4 bg-white/80 rounded-full shadow-sm" />
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
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
