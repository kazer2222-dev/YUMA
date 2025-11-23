import { useState, useRef } from "react";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  CheckCircle2,
  GripVertical,
  Sparkles,
  Calendar as CalendarIcon,
  PlayCircle,
  X,
} from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  status: string;
  assignee: string;
}

interface Sprint {
  id: string;
  name: string;
  status: "active" | "planned" | "completed";
  startDate: string;
  endDate: string;
  goal?: string;
  tasks: Task[];
}

interface DraggableTaskProps {
  task: Task;
  index: number;
  sprintId: string | null;
  moveTask: (dragIndex: number, hoverIndex: number, dragSprintId: string | null, hoverSprintId: string | null) => void;
}

const DraggableTask = ({ task, index, sprintId, moveTask }: DraggableTaskProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: { index, id: task.id, sprintId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: "TASK",
    hover: (item: { index: number; id: string; sprintId: string | null }, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragSprintId = item.sprintId;
      const hoverSprintId = sprintId;

      if (dragIndex === hoverIndex && dragSprintId === hoverSprintId) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveTask(dragIndex, hoverIndex, dragSprintId, hoverSprintId);
      item.index = hoverIndex;
      item.sprintId = hoverSprintId;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-lg bg-[var(--card)] hover:bg-[var(--primary)]/10 transition-all duration-200 group/task cursor-move border border-[var(--border)]/30 hover:border-[var(--primary)]/40 hover:shadow-md ${
        isOver ? "border-[var(--primary)] bg-[var(--primary)]/15" : ""
      }`}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <GripVertical className="w-4 h-4 text-[var(--muted-foreground)] opacity-50 sm:group-hover/task:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
      <div className="relative">
        <span className="text-[var(--foreground)] font-semibold text-sm w-16 sm:w-20 flex-shrink-0 font-mono px-2.5 py-1.5 rounded-md bg-[var(--muted)]/50 border border-[var(--border)]/30 shadow-sm">
          {task.id}
        </span>
      </div>
      <span className="flex-1 text-[var(--foreground)] text-sm truncate font-medium">
        {task.title}
      </span>
      {task.status && (
        <Badge
          variant="outline"
          className={`text-xs px-2 py-0.5 flex-shrink-0 font-medium ${
            task.status === "Backlog"
              ? "border-[#EF4444]/50 text-[#EF4444] bg-[#EF4444]/10"
              : task.status === "In Progress"
              ? "border-[#3B82F6]/50 text-[#3B82F6] bg-[#3B82F6]/10"
              : task.status === "Done"
              ? "border-[#10B981]/50 text-[#10B981] bg-[#10B981]/10"
              : "border-[var(--border)] text-[var(--muted-foreground)] bg-[var(--muted)]/10"
          }`}
        >
          {task.status}
        </Badge>
      )}
      <span className="text-[var(--muted-foreground)] text-xs sm:text-sm w-20 sm:w-24 text-right hidden sm:inline">
        {task.assignee}
      </span>
    </div>
  );
};

export function ClickUpBacklog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all-priorities");
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [moveUnfinishedTo, setMoveUnfinishedTo] = useState("Backlog");
  
  // Create Sprint Dialog State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createSprintName, setCreateSprintName] = useState("");
  const [createSprintGoal, setCreateSprintGoal] = useState("");
  const [createStartDate, setCreateStartDate] = useState<Date | undefined>(undefined);
  const [createEndDate, setCreateEndDate] = useState<Date | undefined>(undefined);
  
  // Edit Sprint Dialog State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
  const [editSprintName, setEditSprintName] = useState("");
  const [editSprintGoal, setEditSprintGoal] = useState("");
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);

  // Mock data - sprints
  const [sprints, setSprints] = useState<Sprint[]>([
    {
      id: "sprint-1",
      name: "Sprint 1",
      status: "active",
      startDate: "07/11/2025",
      endDate: "21/11/2025",
      tasks: [
        { id: "TIT-9", title: "azaza", status: "Done", assignee: "Unassigned" },
        { id: "TIT-8", title: "cdcd", status: "In Progress", assignee: "Unassigned" },
        { id: "TIT-6", title: "bfbfb", status: "Backlog", assignee: "Unassigned" },
      ],
    },
  ]);

  // Mock data - backlog tasks
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([
    { id: "TIT-10", title: "bgbghbh", status: "Done", assignee: "Unassigned" },
    { id: "TIT-7", title: "ddddd", status: "In Progress", assignee: "Unassigned" },
    { id: "TIT-5", title: "created from backlog", status: "Backlog", assignee: "Unassigned" },
    {
      id: "TIT-4",
      title: "RMD-15 — Smooth, Front-End-Only Task Upda...",
      status: "In Progress",
      assignee: "Unassigned",
    },
    { id: "TIT-3", title: "RMD-14", status: "Done", assignee: "Unassigned" },
    { id: "TIT-2", title: "summary", status: "Backlog", assignee: "Unassigned" },
    { id: "TIT-1", title: "Test", status: "In Progress", assignee: "Unassigned" },
  ]);

  const handleCreateSprint = () => {
    if (!createSprintName.trim()) return;

    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name: createSprintName,
      status: "planned",
      startDate: createStartDate ? format(createStartDate, "dd/MM/yyyy") : "",
      endDate: createEndDate ? format(createEndDate, "dd/MM/yyyy") : "",
      goal: createSprintGoal,
      tasks: [],
    };

    setSprints((prev) => [...prev, newSprint]);

    // Reset and close
    setShowCreateDialog(false);
    setCreateSprintName("");
    setCreateSprintGoal("");
    setCreateStartDate(undefined);
    setCreateEndDate(undefined);
  };

  const handleEditSprint = (sprintId: string) => {
    const sprint = sprints.find((s) => s.id === sprintId);
    if (!sprint) return;

    setEditingSprintId(sprintId);
    setEditSprintName(sprint.name);
    setEditSprintGoal(sprint.goal || "");
    
    // Parse dates from string format "DD/MM/YYYY"
    const [startDay, startMonth, startYear] = sprint.startDate.split("/");
    const [endDay, endMonth, endYear] = sprint.endDate.split("/");
    
    setEditStartDate(new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay)));
    setEditEndDate(new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay)));
    
    setShowEditDialog(true);
  };

  const handleUpdateSprint = () => {
    if (!editingSprintId || !editSprintName.trim()) return;

    setSprints((prev) =>
      prev.map((sprint) => {
        if (sprint.id === editingSprintId) {
          return {
            ...sprint,
            name: editSprintName,
            goal: editSprintGoal,
            startDate: editStartDate ? format(editStartDate, "dd/MM/yyyy") : sprint.startDate,
            endDate: editEndDate ? format(editEndDate, "dd/MM/yyyy") : sprint.endDate,
          };
        }
        return sprint;
      })
    );

    // Reset and close
    setShowEditDialog(false);
    setEditingSprintId(null);
    setEditSprintName("");
    setEditSprintGoal("");
    setEditStartDate(undefined);
    setEditEndDate(undefined);
  };

  const handleCompleteSprint = (sprintId: string) => {
    const sprint = sprints.find((s) => s.id === sprintId);
    if (!sprint) return;

    // Check if all tasks are done
    const unfinishedTasks = sprint.tasks.filter((task) => task.status !== "Done");
    
    if (unfinishedTasks.length > 0) {
      // Show dialog if there are unfinished tasks
      setSelectedSprintId(sprintId);
      setShowCompleteDialog(true);
    } else {
      // Complete sprint directly if all tasks are done
      completeSprint(sprintId);
    }
  };

  const completeSprint = (sprintId: string) => {
    const sprint = sprints.find((s) => s.id === sprintId);
    if (!sprint) return;

    const unfinishedTasks = sprint.tasks.filter((task) => task.status !== "Done");

    if (unfinishedTasks.length > 0) {
      // Move unfinished tasks based on selection
      if (moveUnfinishedTo === "Backlog") {
        setBacklogTasks((prev) => [...unfinishedTasks, ...prev]);
      } else if (moveUnfinishedTo === "Next sprint") {
        // For now, just move to backlog since we don't have a "next sprint" yet
        // In a real app, you'd create or find the next sprint
        setBacklogTasks((prev) => [...unfinishedTasks, ...prev]);
      }
    }

    // Remove the sprint
    setSprints((prev) => prev.filter((s) => s.id !== sprintId));
    
    // Close dialog and reset
    setShowCompleteDialog(false);
    setSelectedSprintId(null);
    setMoveUnfinishedTo("Backlog");
  };

  const moveTask = (
    dragIndex: number,
    hoverIndex: number,
    dragSprintId: string | null,
    hoverSprintId: string | null
  ) => {
    // Moving within the same container
    if (dragSprintId === hoverSprintId) {
      if (dragSprintId === null) {
        // Moving within backlog
        setBacklogTasks((prevTasks) => {
          const newTasks = [...prevTasks];
          const dragTask = newTasks[dragIndex];
          newTasks.splice(dragIndex, 1);
          newTasks.splice(hoverIndex, 0, dragTask);
          return newTasks;
        });
      } else {
        // Moving within sprint
        setSprints((prevSprints) =>
          prevSprints.map((sprint) => {
            if (sprint.id === dragSprintId) {
              const newTasks = [...sprint.tasks];
              const dragTask = newTasks[dragIndex];
              newTasks.splice(dragIndex, 1);
              newTasks.splice(hoverIndex, 0, dragTask);
              return { ...sprint, tasks: newTasks };
            }
            return sprint;
          })
        );
      }
    } else {
      // Moving between containers
      let dragTask: Task | null = null;

      // Get the task being dragged
      if (dragSprintId === null) {
        dragTask = backlogTasks[dragIndex];
        setBacklogTasks((prev) => prev.filter((_, i) => i !== dragIndex));
      } else {
        const sourceSprint = sprints.find((s) => s.id === dragSprintId);
        if (sourceSprint) {
          dragTask = sourceSprint.tasks[dragIndex];
          setSprints((prev) =>
            prev.map((sprint) => {
              if (sprint.id === dragSprintId) {
                return {
                  ...sprint,
                  tasks: sprint.tasks.filter((_, i) => i !== dragIndex),
                };
              }
              return sprint;
            })
          );
        }
      }

      // Add to destination
      if (dragTask) {
        if (hoverSprintId === null) {
          setBacklogTasks((prev) => {
            const newTasks = [...prev];
            newTasks.splice(hoverIndex, 0, dragTask!);
            return newTasks;
          });
        } else {
          setSprints((prev) =>
            prev.map((sprint) => {
              if (sprint.id === hoverSprintId) {
                const newTasks = [...sprint.tasks];
                newTasks.splice(hoverIndex, 0, dragTask!);
                return { ...sprint, tasks: newTasks };
              }
              return sprint;
            })
          );
        }
      }
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--muted)]/20 relative">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#4353FF]/10 to-transparent rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F59E0B]/10 to-transparent rounded-full blur-3xl animate-pulse-slow-delayed pointer-events-none" />
      
      {/* Top Bar */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl overflow-x-auto relative z-10 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-xs min-w-[120px] group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[var(--background)]/80 backdrop-blur-sm border-[var(--border)] h-8 text-sm placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 hover:shadow-md transition-all"
          />
        </div>

        {/* Filter Icon */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] hover:scale-110 transition-all flex-shrink-0"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filter tasks</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[120px] sm:w-[140px] h-8 border-[var(--border)] bg-[var(--background)] text-sm flex-shrink-0">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-priorities">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 min-w-[20px]" />

        {/* Action Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="h-8 gap-1 sm:gap-2 border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm hover:bg-[var(--muted)] hover:scale-105 hover:shadow-md transition-all text-sm flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Create Sprint</span>
        </Button>

        <Button
          size="sm"
          className="h-8 gap-2 bg-gradient-to-r from-[#4353FF] to-[#5B5FED] hover:from-[#3343EF] hover:to-[#4B4FDD] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm flex-shrink-0 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
          <Plus className="w-3.5 h-3.5 relative z-10" />
          <span className="hidden sm:inline relative z-10">Create Task</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-3 sm:px-6 py-4 sm:py-6 relative">
        {/* Decorative Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        
        <div className="relative z-10 space-y-4 sm:space-y-6">
        {/* Sprints */}
        {sprints.map((sprint, index) => (
          <div 
            key={sprint.id} 
            className="bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--card)]/60 border border-[var(--border)]/50 rounded-2xl shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(67,83,255,0.3)] transition-all duration-500 overflow-hidden group/sprint backdrop-blur-sm relative"
            style={{
              animation: `fadeInScale 0.4s ease-out ${index * 0.1}s both`,
            }}
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            {/* Sprint Header with Enhanced Gradient Bar */}
            <div className="relative">
              <div 
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl overflow-hidden"
              >
                <div 
                  className="h-full w-full animate-gradient-x"
                  style={{ 
                    background: `linear-gradient(90deg, #4353FF, #8B5CF6, #4353FF, #8B5CF6)`,
                    backgroundSize: '200% 100%',
                    boxShadow: `0 0 20px #4353FF60, 0 0 40px #4353FF30`
                  }}
                />
              </div>
              <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 border-b border-[var(--border)]/30 mt-1.5 bg-gradient-to-b from-[var(--muted)]/30 to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="relative flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full relative"
                      style={{ 
                        backgroundColor: '#4353FF',
                      }}
                    >
                      <div 
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{ 
                          backgroundColor: '#4353FF',
                        }}
                      />
                    </div>
                    <PlayCircle className="w-4 h-4 text-[#4353FF] animate-pulse" />
                  </div>
                  <h3 className="text-[var(--foreground)] text-sm sm:text-base font-semibold">{sprint.name}</h3>
                  <Badge className="bg-gradient-to-r from-[#4353FF] to-[#5B5FED] text-white hover:from-[#3343EF] hover:to-[#4B4FDD] text-xs px-2.5 py-0.5 shadow-lg border-0">
                    <Sparkles className="w-3 h-3 mr-1 inline" />
                    Active
                  </Badge>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{sprint.startDate} - {sprint.endDate}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--muted-foreground)]/50" />
                    <span className="font-medium">{sprint.tasks.length} tasks</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => handleCompleteSprint(sprint.id)}
                          className="h-7 sm:h-8 gap-1 sm:gap-2 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 text-xs sm:text-sm px-2 sm:px-3 border-0"
                        >
                          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Complete</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Complete this sprint</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 rounded-lg transition-all hover:scale-110 hover:rotate-90"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="backdrop-blur-xl bg-[var(--card)]/95 border-[var(--border)]/50">
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => handleEditSprint(sprint.id)}
                      >
                        Edit Sprint
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-[var(--destructive)]">
                        Delete Sprint
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Mobile Sprint Info */}
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] px-3 sm:px-4 py-2.5 border-b border-[var(--border)]/30 bg-gradient-to-r from-[var(--muted)]/20 to-transparent sm:hidden">
                <CalendarIcon className="w-3 h-3" />
                <span>{sprint.startDate} - {sprint.endDate}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--muted-foreground)]/50" />
                <span className="font-medium">{sprint.tasks.length} tasks</span>
              </div>
            </div>

            {/* Sprint Tasks Container */}
            <div className="p-3 sm:p-4 relative">
              <div className="space-y-2">
                {sprint.tasks.map((task, taskIndex) => (
                  <div
                    key={task.id}
                    style={{
                      animation: `slideIn 0.3s ease-out ${taskIndex * 0.05}s both`,
                    }}
                  >
                    <DraggableTask
                      task={task}
                      index={taskIndex}
                      sprintId={sprint.id}
                      moveTask={moveTask}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Backlog Section */}
        <div 
          className="bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--card)]/60 border border-[var(--border)]/50 rounded-2xl shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(245,158,11,0.3)] transition-all duration-500 overflow-hidden group/backlog backdrop-blur-sm relative"
          style={{
            animation: `fadeInScale 0.4s ease-out ${sprints.length * 0.1}s both`,
          }}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          {/* Backlog Header with Enhanced Gradient Bar */}
          <div className="relative">
            <div 
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl overflow-hidden"
            >
              <div 
                className="h-full w-full animate-gradient-x"
                style={{ 
                  background: `linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B, #FBBF24)`,
                  backgroundSize: '200% 100%',
                  boxShadow: `0 0 20px #F59E0B60, 0 0 40px #F59E0B30`
                }}
              />
            </div>
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 border-b border-[var(--border)]/30 mt-1.5 bg-gradient-to-b from-[var(--muted)]/30 to-transparent backdrop-blur-sm">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="relative flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full relative"
                    style={{ 
                      backgroundColor: '#F59E0B',
                    }}
                  >
                    <div 
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ 
                        backgroundColor: '#F59E0B',
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-[var(--foreground)] text-sm sm:text-base font-semibold">Backlog</h3>
                <div 
                  className="text-xs px-2.5 py-1 rounded-full font-medium shadow-lg flex items-center gap-1.5"
                  style={{
                    background: `linear-gradient(135deg, #F59E0B15, #FBBF2415)`,
                    color: '#F59E0B',
                    border: `1px solid #F59E0B30`
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                  {backlogTasks.length} tasks
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover/backlog:opacity-100 transition-all duration-300">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-[var(--muted)]/50 rounded-lg transition-all hover:scale-110 hover:rotate-90"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Quick add task</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-[var(--muted)]/50 rounded-lg transition-all hover:scale-110 hover:rotate-90"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Backlog Tasks Container */}
          <div className="p-3 sm:p-4 relative">
            <div className="space-y-2">
              {backlogTasks.map((task, taskIndex) => (
                <div
                  key={task.id}
                  style={{
                    animation: `slideIn 0.3s ease-out ${taskIndex * 0.05}s both`,
                  }}
                >
                  <DraggableTask
                    task={task}
                    index={taskIndex}
                    sprintId={null}
                    moveTask={moveTask}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Create Sprint Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-gradient-to-br from-[var(--card)] to-[var(--card)]/95 backdrop-blur-xl border-[var(--border)]/50 max-w-lg p-0 shadow-2xl overflow-hidden [&>button]:flex">
          <DialogDescription className="sr-only">
            Create a new sprint with name, goal, and dates
          </DialogDescription>
          
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#4353FF]/10 via-transparent to-[#8B5CF6]/10 pointer-events-none" />
          
          {/* Custom Header */}
          <div className="relative flex items-center justify-between px-6 py-5 border-b border-[var(--border)]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4353FF]/20 to-[#8B5CF6]/20 flex items-center justify-center backdrop-blur-sm border border-[#4353FF]/30">
                <PlayCircle className="w-5 h-5 text-[#4353FF]" />
              </div>
              <div>
                <DialogTitle className="text-[var(--foreground)] text-lg">Create Sprint</DialogTitle>
                <p className="text-xs text-[var(--muted-foreground)]">Plan your next sprint</p>
              </div>
            </div>
          </div>

          <div className="relative px-6 py-5 space-y-5">
            {/* Sprint Name */}
            <div className="space-y-2">
              <Label htmlFor="create-sprint-name" className="text-[var(--foreground)] text-sm flex items-center gap-2">
                Sprint Name <span className="text-[#4353FF]">*</span>
              </Label>
              <Input
                id="create-sprint-name"
                value={createSprintName}
                onChange={(e) => setCreateSprintName(e.target.value)}
                className="bg-[var(--background)]/50 border-[var(--border)]/50 text-[var(--foreground)] focus:border-[#4353FF]/50 focus:ring-[#4353FF]/20 transition-all h-10 rounded-lg"
                placeholder="e.g., Sprint 1"
              />
            </div>

            {/* Sprint Goal */}
            <div className="space-y-2">
              <Label htmlFor="create-sprint-goal" className="text-[var(--foreground)] text-sm">
                Sprint Goal
              </Label>
              <Textarea
                id="create-sprint-goal"
                value={createSprintGoal}
                onChange={(e) => setCreateSprintGoal(e.target.value)}
                className="bg-[var(--background)]/50 border-[var(--border)]/50 text-[var(--foreground)] focus:border-[#4353FF]/50 focus:ring-[#4353FF]/20 resize-none min-h-[90px] rounded-lg transition-all"
                placeholder="What do you want to achieve in this sprint?"
              />
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-[var(--foreground)] text-sm">
                  Start Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left bg-[var(--background)]/50 border-[var(--border)]/50 text-[var(--foreground)] hover:bg-[var(--muted)]/50 hover:border-[#4353FF]/30 transition-all h-10 rounded-lg"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#4353FF]/70" />
                      <span className="text-sm">
                        {createStartDate ? format(createStartDate, "MMM d, yyyy") : "Select start date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[var(--card)]/95 backdrop-blur-xl border-[var(--border)]/50 shadow-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={createStartDate}
                      onSelect={setCreateStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-[var(--foreground)] text-sm">
                  End Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left bg-[var(--background)]/50 border-[var(--border)]/50 text-[var(--foreground)] hover:bg-[var(--muted)]/50 hover:border-[#8B5CF6]/30 transition-all h-10 rounded-lg"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#8B5CF6]/70" />
                      <span className="text-sm">
                        {createEndDate ? format(createEndDate, "MMM d, yyyy") : "Select end date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[var(--card)]/95 backdrop-blur-xl border-[var(--border)]/50 shadow-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={createEndDate}
                      onSelect={setCreateEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]/50 bg-gradient-to-t from-[var(--muted)]/20 to-transparent">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-[var(--border)]/50 text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-all rounded-lg h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSprint}
              disabled={!createSprintName.trim()}
              className="bg-gradient-to-r from-[#4353FF] to-[#5B5FED] hover:from-[#3343EF] hover:to-[#4B4FDD] text-white shadow-lg hover:shadow-xl hover:shadow-[#4353FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg h-9 px-4 relative overflow-hidden group"
            >
              <span className="relative z-10">Create Sprint</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sprint Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gradient-to-br from-[var(--card)] to-[var(--card)]/95 backdrop-blur-xl border-[var(--border)]/50 max-w-lg p-0 shadow-2xl overflow-hidden [&>button]:flex">
          <DialogDescription className="sr-only">
            Edit sprint details including name, goal, and dates
          </DialogDescription>
          
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#4353FF]/10 via-transparent to-[#8B5CF6]/10 pointer-events-none" />
          
          {/* Custom Header */}
          <div className="relative flex items-center justify-between px-6 py-5 border-b border-[var(--border)]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4353FF]/20 to-[#8B5CF6]/20 flex items-center justify-center backdrop-blur-sm border border-[#4353FF]/30">
                <PlayCircle className="w-5 h-5 text-[#4353FF]" />
              </div>
              <div>
                <DialogTitle className="text-[var(--foreground)] text-lg">Edit Sprint</DialogTitle>
                <p className="text-xs text-[var(--muted-foreground)]">Customize your sprint details</p>
              </div>
            </div>
          </div>

          <div className="relative px-6 py-5 space-y-5">
            {/* Sprint Name */}
            <div className="space-y-2">
              <Label htmlFor="sprint-name" className="text-[var(--foreground)] text-sm flex items-center gap-2">
                Sprint Name <span className="text-[#4353FF]">*</span>
              </Label>
              <Input
                id="sprint-name"
                value={editSprintName}
                onChange={(e) => setEditSprintName(e.target.value)}
                className="bg-[var(--background)]/50 border-[var(--border)]/50 text-[var(--foreground)] focus:border-[#4353FF]/50 focus:ring-[#4353FF]/20 transition-all h-10 rounded-lg"
                placeholder="e.g., Sprint 1"
              />
            </div>

            {/* Sprint Goal */}
            <div className="space-y-2">
              <Label htmlFor="sprint-goal" className="text-[var(--foreground)] text-sm">
                Sprint Goal
              </Label>
              <Textarea
                id="sprint-goal"
                value={editSprintGoal}
                onChange={(e) => setEditSprintGoal(e.target.value)}
                className="bg-[var(--background)]/50 border-[var(--border)]/50 text-[var(--foreground)] focus:border-[#4353FF]/50 focus:ring-[#4353FF]/20 resize-none min-h-[90px] rounded-lg transition-all"
                placeholder="What do you want to achieve in this sprint?"
              />
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-[var(--foreground)] text-sm">
                  Start Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left bg-[var(--background)]/50 border-[var(--border)]/50 text-[var(--foreground)] hover:bg-[var(--muted)]/50 hover:border-[#4353FF]/30 transition-all h-10 rounded-lg"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#4353FF]/70" />
                      <span className="text-sm">
                        {editStartDate ? format(editStartDate, "MMM d, yyyy") : "Select date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[var(--card)]/95 backdrop-blur-xl border-[var(--border)]/50 shadow-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={editStartDate}
                      onSelect={setEditStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-[var(--foreground)] text-sm">
                  End Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left bg-[var(--background)]/50 border-[var(--border)]/50 text-[var(--foreground)] hover:bg-[var(--muted)]/50 hover:border-[#8B5CF6]/30 transition-all h-10 rounded-lg"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#8B5CF6]/70" />
                      <span className="text-sm">
                        {editEndDate ? format(editEndDate, "MMM d, yyyy") : "Select end date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[var(--card)]/95 backdrop-blur-xl border-[var(--border)]/50 shadow-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={editEndDate}
                      onSelect={setEditEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]/50 bg-gradient-to-t from-[var(--muted)]/20 to-transparent">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="border-[var(--border)]/50 text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-all rounded-lg h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSprint}
              disabled={!editSprintName.trim()}
              className="bg-gradient-to-r from-[#4353FF] to-[#5B5FED] hover:from-[#3343EF] hover:to-[#4B4FDD] text-white shadow-lg hover:shadow-xl hover:shadow-[#4353FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg h-9 px-4 relative overflow-hidden group"
            >
              <span className="relative z-10">Update Sprint</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Sprint Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)]">
              Complete Sprint with Unfinished Tasks
            </DialogTitle>
            <DialogDescription className="text-[var(--muted-foreground)] pt-2">
              {selectedSprintId && 
                (() => {
                  const sprint = sprints.find((s) => s.id === selectedSprintId);
                  const unfinishedCount = sprint?.tasks.filter((t) => t.status !== "Done").length || 0;
                  return `${unfinishedCount} task${unfinishedCount !== 1 ? 's' : ''} in this sprint ${unfinishedCount !== 1 ? 'are' : 'is'} not finished. What would you like to do with ${unfinishedCount !== 1 ? 'them' : 'it'}?`;
                })()
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-sm text-[var(--foreground)] mb-2 block">
              Move tasks to:
            </label>
            <Select value={moveUnfinishedTo} onValueChange={setMoveUnfinishedTo}>
              <SelectTrigger className="w-full bg-[var(--background)] border-[var(--primary)] border-2 text-[var(--foreground)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                <SelectItem value="Backlog" className="text-[var(--foreground)]">Backlog</SelectItem>
                <SelectItem value="Next sprint" className="text-[var(--foreground)]">Next sprint</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCompleteDialog(false);
                setSelectedSprintId(null);
                setMoveUnfinishedTo("Backlog");
              }}
              className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedSprintId && completeSprint(selectedSprintId)}
              className="bg-gradient-to-r from-[#4353FF] to-[#5B5FED] hover:from-[#3343EF] hover:to-[#4B4FDD] text-white shadow-lg hover:shadow-xl"
            >
              Complete Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Animations */}
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
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

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes pulse-slow-delayed {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.08);
          }
        }

        .animate-gradient-x {
          animation: gradient-x 8s ease infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .animate-pulse-slow-delayed {
          animation: pulse-slow-delayed 10s ease-in-out infinite;
        }
      `}</style>
    </div>
    </DndProvider>
  );
}
