import { useState, useRef } from "react";
import {
  Plus,
  Settings,
  Users,
  FileText,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Award,
  TrendingUp as TrendingUpIcon,
  TrendingUp,
  ArrowRight,
  CheckSquare,
  LayoutGrid,
  Calendar,
  BarChart3,
  List,
  Zap,
  PackageOpen,
  GripVertical,
  X,
  ChevronDown,
  Workflow,
} from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDrag, useDrop } from "react-dnd";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useIsMobile } from "./ui/use-mobile";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ClickUpKanbanBoard } from "./clickup-kanban-board";
import { ClickUpTasksTable } from "./clickup-tasks-table";
import { ClickUpCalendar } from "./clickup-calendar";
import { ClickUpRoadmap } from "./clickup-roadmap";
import { ClickUpBacklog } from "./clickup-backlog";
import { ClickUpSprints } from "./clickup-sprints";
import { ClickUpReleases } from "./clickup-releases";
import { ClickUpTemplates } from "./clickup-templates";
import { ClickUpWorkflows } from "./clickup-workflows";
import { WorkflowPage } from "./workflow-page";
import { AutomationsPage } from "./automations-page";
import { SpaceMembers } from "./space-members";
import { getBoardsForSpace, findSpaceById } from "../lib/navigation-data";

interface SpaceOverviewProps {
  spaceName: string;
  spaceId: string;
  boardId?: string | null;
  onBoardChange?: (boardId: string) => void;
}

interface Tab {
  id: string;
  label: string;
  icon: any;
  color: string | null;
  active: boolean;
  deletable: boolean;
}

interface DraggableTabProps {
  tab: Tab;
  index: number;
  activeTab: string;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
  setActiveTab: (tabId: string) => void;
  deleteTab: (tabId: string) => void;
  selectedBoard?: string;
  boards?: Array<{ id: string; name: string; color: string }>;
  onBoardChange?: (boardId: string) => void;
}

const DraggableTab = ({ tab, index, activeTab, moveTab, setActiveTab, deleteTab, selectedBoard, boards, onBoardChange }: DraggableTabProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "TAB",
    item: { index, id: tab.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: "TAB",
    hover: (item: { index: number; id: string }, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientX = clientOffset!.x - hoverBoundingRect.left;

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return;
      }

      moveTab(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  // If this is the Board tab, render as a dropdown
  if (tab.id === "board" && boards && boards.length > 0 && onBoardChange) {
    const currentBoard = boards.find(b => b.id === selectedBoard);
    
    return (
      <div
        ref={ref}
        className="relative group"
        style={{
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              } ${isOver ? "ring-2 ring-[var(--primary)]/50" : ""}`}
            >
              <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity -ml-1" />
              {tab.icon && (
                <tab.icon
                  className="w-4 h-4"
                  style={{
                    color: activeTab === tab.id
                      ? "white"
                      : tab.color || "currentColor",
                  }}
                />
              )}
              {tab.label}
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {boards.map((board) => (
              <DropdownMenuItem
                key={board.id}
                onClick={() => {
                  onBoardChange(board.id);
                  setActiveTab(tab.id);
                }}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: board.color }}
                  />
                  <span>{board.name}</span>
                  {selectedBoard === board.id && (
                    <CheckSquare className="w-3.5 h-3.5 ml-auto" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative group"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <button
        onClick={() => setActiveTab(tab.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded transition-all whitespace-nowrap ${
          activeTab === tab.id
            ? "bg-[var(--primary)] text-white"
            : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        } ${isOver ? "ring-2 ring-[var(--primary)]/50" : ""}`}
      >
        <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity -ml-1" />
        {tab.icon && (
          <tab.icon
            className="w-4 h-4"
            style={{
              color: activeTab === tab.id
                ? "white"
                : tab.color || "currentColor",
            }}
          />
        )}
        {tab.label}
      </button>
      {tab.deletable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTab(tab.id);
          }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--destructive)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--destructive)]/80 z-10"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export function SpaceOverview({
  spaceName,
  spaceId,
  boardId,
  onBoardChange,
}: SpaceOverviewProps) {
  const isMobile = useIsMobile();
  
  // Get boards from navigation data for this space
  const navigationBoards = getBoardsForSpace(spaceId);
  const boards = navigationBoards.map(board => ({
    id: board.id,
    name: board.label,
    color: board.color || "#3B82F6",
  }));
  
  // Board selection state - use the passed boardId or first board if available
  const defaultBoard = boardId || (boards.length > 0 ? boards[0].id : null);
  const [selectedBoard, setSelectedBoard] = useState(defaultBoard);
  
  // If boardId is provided, default to board view
  const [activeTab, setActiveTab] = useState(boardId ? "board" : "overview");
  
  // Handler to update board selection both locally and in parent
  const handleBoardChange = (newBoardId: string) => {
    setSelectedBoard(newBoardId);
    if (onBoardChange) {
      onBoardChange(newBoardId);
    }
  };
  
  const allTabs: Tab[] = [
    {
      id: "overview",
      label: "Overview",
      icon: null,
      color: null,
      active: true,
      deletable: false,
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: CheckSquare,
      color: "#10B981",
      active: false,
      deletable: false,
    },
    {
      id: "board",
      label: "Board",
      icon: LayoutGrid,
      color: "#3B82F6",
      active: false,
      deletable: false,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      color: "#F59E0B",
      active: false,
      deletable: true,
    },
    {
      id: "roadmap",
      label: "Roadmap",
      icon: TrendingUp,
      color: "#EF4444",
      active: false,
      deletable: true,
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      color: "#F59E0B",
      active: false,
      deletable: true,
    },
    {
      id: "backlog",
      label: "Backlog",
      icon: List,
      color: "#8B5CF6",
      active: false,
      deletable: true,
    },
    {
      id: "sprints",
      label: "Sprints",
      icon: Zap,
      color: "#84CC16",
      active: false,
      deletable: true,
    },
    {
      id: "releases",
      label: "Releases",
      icon: PackageOpen,
      color: "#EC4899",
      active: false,
      deletable: true,
    },
    {
      id: "people",
      label: "People",
      icon: Users,
      color: "#6366F1",
      active: false,
      deletable: true,
    },
  ];

  const [visibleTabs, setVisibleTabs] =
    useState<Tab[]>(allTabs);
  
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [showWorkflowsDialog, setShowWorkflowsDialog] = useState(false);
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [showTemplatesPage, setShowTemplatesPage] = useState(false);
  const [showAutomationsPage, setShowAutomationsPage] = useState(false);
  const [showPeoplePage, setShowPeoplePage] = useState(false);

  const teamMembers = [
    {
      id: 1,
      name: "admin",
      email: "admin@yuma.com",
      role: "OWNER",
      color: "#8B5CF6",
      initial: "A",
    },
    {
      id: 2,
      name: "Sarah Chen",
      email: "sarah.chen@yuma.com",
      role: "ADMIN",
      color: "#3B82F6",
      initial: "SC",
    },
    {
      id: 3,
      name: "Mike Rodriguez",
      email: "mike.rodriguez@yuma.com",
      role: "MEMBER",
      color: "#10B981",
      initial: "MR",
    },
    {
      id: 4,
      name: "Emily Watson",
      email: "emily.watson@yuma.com",
      role: "MEMBER",
      color: "#F59E0B",
      initial: "EW",
    },
    {
      id: 5,
      name: "David Kim",
      email: "david.kim@yuma.com",
      role: "MEMBER",
      color: "#EF4444",
      initial: "DK",
    },
    {
      id: 6,
      name: "Lisa Anderson",
      email: "lisa.anderson@yuma.com",
      role: "GUEST",
      color: "#EC4899",
      initial: "LA",
    },
    {
      id: 7,
      name: "James Wilson",
      email: "james.wilson@yuma.com",
      role: "MEMBER",
      color: "#06B6D4",
      initial: "JW",
    },
  ];

  const displayedMembers = teamMembers.slice(0, 3);

  const deleteTab = (tabId: string) => {
    setVisibleTabs((prev) =>
      prev.filter((tab) => tab.id !== tabId),
    );
  };

  const addTab = (tabId: string) => {
    const tabToAdd = allTabs.find((tab) => tab.id === tabId);
    if (
      tabToAdd &&
      !visibleTabs.find((tab) => tab.id === tabId)
    ) {
      setVisibleTabs((prev) => {
        // Find the original position to insert at
        const originalIndex = allTabs.findIndex(
          (tab) => tab.id === tabId,
        );
        const newTabs = [...prev];

        // Find where to insert based on original order
        let insertIndex = newTabs.length;
        for (let i = 0; i < newTabs.length; i++) {
          const currentTabOriginalIndex = allTabs.findIndex(
            (tab) => tab.id === newTabs[i].id,
          );
          if (currentTabOriginalIndex > originalIndex) {
            insertIndex = i;
            break;
          }
        }

        newTabs.splice(insertIndex, 0, tabToAdd);
        return newTabs;
      });
    }
  };

  const deletedTabs = allTabs.filter(
    (tab) => !visibleTabs.find((v) => v.id === tab.id),
  );

  const moveTab = (dragIndex: number, hoverIndex: number) => {
    setVisibleTabs((prevTabs) => {
      const newTabs = [...prevTabs];
      const dragTab = newTabs[dragIndex];
      newTabs.splice(dragIndex, 1);
      newTabs.splice(hoverIndex, 0, dragTab);
      return newTabs;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
    {showWorkflowEditor ? (
      <WorkflowPage onBack={() => setShowWorkflowEditor(false)} />
    ) : (
    <div className={`flex-1 flex flex-col ${showAutomationsPage ? 'overflow-hidden' : 'overflow-auto'}`}>
      {/* Navigation Tabs */}
      <div className="border-b border-[var(--border)] bg-[var(--background)] px-4 md:px-6 py-2">
        {isMobile ? (
          /* Mobile Tab Menu */
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-[140px] border-[var(--border)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">
                    <div className="flex items-center gap-2">
                      <span>Overview</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="tasks">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" style={{ color: "#10B981" }} />
                      <span>Tasks</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="board">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4" style={{ color: "#3B82F6" }} />
                      <span>Board</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="calendar">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" style={{ color: "#F59E0B" }} />
                      <span>Calendar</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="roadmap">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" style={{ color: "#EF4444" }} />
                      <span>Roadmap</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Board Selector - shown when board view is active */}
              {activeTab === "board" && boards.length > 0 && selectedBoard && (
                <Select value={selectedBoard} onValueChange={handleBoardChange}>
                  <SelectTrigger className="flex-1 border-[var(--border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map((board) => (
                      <SelectItem key={board.id} value={board.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: board.color }}
                          />
                          <span>{board.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Create Task Button - shown on board view */}
              {activeTab === "board" && (
                <Button size="sm" className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white flex-shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Desktop Tab Menu */
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              {visibleTabs.map((tab, index) => (
                <DraggableTab
                  key={tab.id}
                  tab={tab}
                  index={index}
                  activeTab={activeTab}
                  moveTab={moveTab}
                  setActiveTab={setActiveTab}
                  deleteTab={deleteTab}
                  selectedBoard={selectedBoard}
                  boards={boards}
                  onBoardChange={handleBoardChange}
                />
              ))}

              {/* Add Tab Dropdown */}
              {deletedTabs.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 ml-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-48"
                  >
                    {deletedTabs.map((tab) => (
                      <DropdownMenuItem
                        key={tab.id}
                        onClick={() => addTab(tab.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {tab.icon && (
                            <tab.icon
                              className="w-4 h-4"
                              style={{
                                color: tab.color || "currentColor",
                              }}
                            />
                          )}
                          <span>{tab.label}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* Create Task Button - shown on board view */}
            {activeTab === "board" && (
              <Button className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      {showAutomationsPage ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <AutomationsPage />
        </div>
      ) : activeTab === "board" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedBoard ? (
            <ClickUpKanbanBoard boardId={selectedBoard} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--muted-foreground)]">
              <p>No boards available for this space</p>
            </div>
          )}
        </div>
      ) : activeTab === "tasks" ? (
        <ClickUpTasksTable />
      ) : activeTab === "calendar" ? (
        <ClickUpCalendar />
      ) : activeTab === "roadmap" ? (
        <ClickUpRoadmap />
      ) : activeTab === "backlog" ? (
        <ClickUpBacklog />
      ) : activeTab === "sprints" ? (
        <ClickUpSprints />
      ) : activeTab === "releases" ? (
        <ClickUpReleases />
      ) : activeTab === "people" ? (
        <SpaceMembers spaceId={spaceId} spaceName={spaceName} />
      ) : activeTab === "templates" ? (
        <div className="flex-1 overflow-hidden">
          <ClickUpTemplates 
            standalone={true}
            onSuccess={() => {
              // Always ensure we have a board selected
              const boardToSelect = selectedBoard || (boards.length > 0 ? boards[0].id : null);
              if (boardToSelect) {
                handleBoardChange(boardToSelect);
              }
              setActiveTab("board");
            }}
          />
        </div>
      ) : (
      <div className="flex-1 overflow-auto">
        {showPeoplePage ? (
          /* People Page View within Overview */
          <div className="flex-1 flex flex-col">
            <div className="border-b border-[var(--border)] p-4 md:p-6">
              <Button
                variant="ghost"
                onClick={() => setShowPeoplePage(false)}
                className="mb-4 gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Overview
              </Button>
            </div>
            <SpaceMembers spaceId={spaceId} spaceName={spaceName} />
          </div>
        ) : (
          /* Regular Overview Content */
          <>
        {/* AI Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 pb-4">
          {/* AI Summary Card */}
          <div 
            className="bg-gradient-to-br from-[#8B5CF6]/5 to-[#8B5CF6]/10 dark:from-[#8B5CF6]/10 dark:to-[#1a1625] border border-[#8B5CF6]/50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-[#8B5CF6] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            style={{ boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
              <div className="text-3xl text-[var(--foreground)]">2</div>
            </div>
            <div className="text-[var(--muted-foreground)] text-sm">
              Total tasks currently tracked across every board.
            </div>
          </div>

          {/* Risk Alert Card */}
          <div 
            className="bg-gradient-to-br from-[#EF4444]/5 to-[#EF4444]/10 dark:from-[#EF4444]/10 dark:to-[#1f1715] border border-[#EF4444]/50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-[#EF4444] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              <div className="text-3xl text-[var(--foreground)]">1 boards</div>
            </div>
            <div className="text-[var(--muted-foreground)] text-sm">
              Monitor board progress and catch risks early.
            </div>
          </div>

          {/* Focus Suggestion Card */}
          <div 
            className="bg-gradient-to-br from-[#F59E0B]/5 to-[#F59E0B]/10 dark:from-[#F59E0B]/10 dark:to-[#1f1c15] border border-[#F59E0B]/50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-[#F59E0B] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            style={{ boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb className="w-5 h-5 text-[#F59E0B]" />
              <div className="text-3xl text-[var(--foreground)]">0%</div>
            </div>
            <div className="text-[var(--muted-foreground)] text-sm">
              Workflow stages marked complete. Review remaining 0% in progress.
            </div>
          </div>

          {/* Motivation Card */}
          <div 
            className="bg-gradient-to-br from-[#10B981]/5 to-[#10B981]/10 dark:from-[#10B981]/10 dark:to-[#15211f] border border-[#10B981]/50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-[#10B981] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-5 h-5 text-[#10B981]" />
              <div className="text-3xl text-[var(--foreground)]">1 people</div>
            </div>
            <div className="text-[var(--muted-foreground)] text-sm">
              Keep your team aligned with shared dashboards and automations.
            </div>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6 pt-2">
          {/* Team Insights Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
            <div className="mb-2">
              <h2 className="flex items-center gap-2">
                <span>👥</span> Team Insights
              </h2>
            </div>
            <p className="text-[var(--muted-foreground)] mb-6">
              Here's how your team is performing this week
            </p>

            <div className="space-y-4">
              {/* Top Contributor Card */}
              <div className="p-4 bg-gradient-to-br from-[#10B981]/10 to-[#10B981]/5 rounded-lg border border-[#10B981]/30">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[var(--muted-foreground)] mb-1">
                      Top Contributor
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-white">
                        SC
                      </div>
                      <span className="text-[var(--foreground)]">
                        Sarah Chen
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-[#10B981]">
                      12
                    </div>
                    <div className="text-[var(--muted-foreground)]">
                      tasks
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#10B981]">
                  <TrendingUpIcon className="w-4 h-4" />
                  <span>+23% from last week</span>
                </div>
              </div>

              {/* Least Active Member Card */}
              <div className="p-4 bg-gradient-to-br from-[#F59E0B]/10 to-[#F59E0B]/5 rounded-lg border border-[#F59E0B]/30">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[var(--muted-foreground)] mb-1">
                      Needs Support
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#EC4899] flex items-center justify-center text-white">
                        LA
                      </div>
                      <span className="text-[var(--foreground)]">
                        Lisa Anderson
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-[#F59E0B]">
                      1
                    </div>
                    <div className="text-[var(--muted-foreground)]">
                      task
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#F59E0B]">
                  <Lightbulb className="w-4 h-4" />
                  <span>Consider reassigning workload</span>
                </div>
              </div>

              {/* Workload Summary Card */}
              <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                <div className="text-[var(--muted-foreground)] mb-3">
                  Workload Distribution
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "In Progress",
                              value: 8,
                              color: "#3B82F6",
                            },
                            {
                              name: "To Do",
                              value: 12,
                              color: "#8B5CF6",
                            },
                            {
                              name: "Done",
                              value: 15,
                              color: "#10B981",
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={40}
                          dataKey="value"
                        >
                          <Cell fill="#3B82F6" />
                          <Cell fill="#8B5CF6" />
                          <Cell fill="#10B981" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                        <span className="text-[var(--muted-foreground)]">
                          Done
                        </span>
                      </div>
                      <span className="text-[var(--foreground)]">
                        15
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div>
                        <span className="text-[var(--muted-foreground)]">
                          In Progress
                        </span>
                      </div>
                      <span className="text-[var(--foreground)]">
                        8
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8B5CF6]"></div>
                        <span className="text-[var(--muted-foreground)]">
                          To Do
                        </span>
                      </div>
                      <span className="text-[var(--foreground)]">
                        12
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View All Members Button */}
              <button
                onClick={() => {
                  setShowPeoplePage(true);
                }}
                className="group w-full flex items-center justify-center gap-3 p-4 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-all duration-200 cursor-pointer text-white"
              >
                <Users className="w-5 h-5" />
                <span>View All Members</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>

          {/* Space Settings Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
            <h2 className="mb-1">Space Settings</h2>
            <p className="text-[var(--muted-foreground)] mb-6">
              Configuration and permissions
            </p>

            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab("templates")}
                className="group w-full flex items-center gap-4 p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/5 transition-all duration-200 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center group-hover:bg-[#8B5CF6]/20 transition-colors duration-200">
                  <FileText className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[var(--foreground)] group-hover:text-[var(--foreground)] transition-colors">
                    Templates
                  </div>
                  <div className="text-[var(--muted-foreground)]">
                    Manage task templates
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setShowWorkflowEditor(true)}
                className="group w-full flex items-center gap-4 p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[#10B981] hover:bg-[#10B981]/5 transition-all duration-200 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center group-hover:bg-[#10B981]/20 transition-colors duration-200">
                  <Workflow className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[var(--foreground)] group-hover:text-[var(--foreground)] transition-colors">
                    Workflows
                  </div>
                  <div className="text-[var(--muted-foreground)]">
                    Customize workflows of templates
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setShowAutomationsPage(true)}
                className="group w-full flex items-center gap-4 p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all duration-200 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center group-hover:bg-[#3B82F6]/20 transition-colors duration-200">
                  <Zap className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[var(--foreground)] group-hover:text-[var(--foreground)] transition-colors">
                    Automations
                  </div>
                  <div className="text-[var(--muted-foreground)]">
                    Automation and rules
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setShowPeoplePage(true)}
                className="group w-full flex items-center gap-4 p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[#F59E0B] hover:bg-[#F59E0B]/5 transition-all duration-200 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center group-hover:bg-[#F59E0B]/20 transition-colors duration-200">
                  <Users className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[var(--foreground)] group-hover:text-[var(--foreground)] transition-colors">
                    User management
                  </div>
                  <div className="text-[var(--muted-foreground)]">
                    Permissions and roles
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
      )}
      
      {/* Templates Dialog */}
      <ClickUpTemplates 
        open={showTemplatesDialog} 
        onOpenChange={setShowTemplatesDialog}
        onSuccess={() => {
          // Always ensure we have a board selected
          const boardToSelect = selectedBoard || (boards.length > 0 ? boards[0].id : null);
          if (boardToSelect) {
            handleBoardChange(boardToSelect);
          }
          setActiveTab("board");
        }}
      />
      
      {/* Workflows Dialog */}
      <ClickUpWorkflows 
        open={showWorkflowsDialog} 
        onOpenChange={setShowWorkflowsDialog} 
      />
    </div>
    )}
    </DndProvider>
  );
}