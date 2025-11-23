import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  User,
  Calendar as CalendarIcon,
  Tag,
  Clock,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  GripVertical,
  FileDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";
import { Checkbox } from "./ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface Task {
  id: string;
  key: string;
  summary: string;
  status: "To Do" | "In Progress" | "Done" | "Blocked";
  assignee?: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  dueDate?: string;
  tags?: string[];
  estimate?: string;
  created: string;
}

const sampleTasks: Task[] = [
  {
    id: "1",
    key: "MINE-2",
    summary: "Check the Argentina group and align with work",
    status: "To Do",
    assignee: undefined,
    priority: "Normal",
    dueDate: undefined,
    tags: [],
    estimate: undefined,
    created: "06/11/2025",
  },
  {
    id: "2",
    key: "MINE-1",
    summary:
      "To check the Slack channel braiz-products and return back",
    status: "To Do",
    assignee: undefined,
    priority: "Normal",
    dueDate: "07/11/2025",
    tags: [],
    estimate: undefined,
    created: "06/11/2025",
  },
  {
    id: "3",
    key: "YUMA-15",
    summary: "Implement AI-powered task prioritization",
    status: "In Progress",
    assignee: "Sarah Chen",
    priority: "High",
    dueDate: "08/11/2025",
    tags: ["AI", "Feature"],
    estimate: "8h",
    created: "05/11/2025",
  },
  {
    id: "4",
    key: "YUMA-14",
    summary: "Design new dashboard layout",
    status: "Done",
    assignee: "Mike Johnson",
    priority: "Normal",
    dueDate: "05/11/2025",
    tags: ["Design", "UI"],
    estimate: "4h",
    created: "04/11/2025",
  },
  {
    id: "5",
    key: "YUMA-13",
    summary: "Fix critical bug in authentication flow",
    status: "Blocked",
    assignee: "Emily Davis",
    priority: "Urgent",
    dueDate: "06/11/2025",
    tags: ["Bug", "Security"],
    estimate: "2h",
    created: "03/11/2025",
  },
  {
    id: "6",
    key: "YUMA-12",
    summary: "Update documentation for API endpoints",
    status: "To Do",
    assignee: "Alex Williams",
    priority: "Low",
    dueDate: "10/11/2025",
    tags: ["Documentation"],
    estimate: "3h",
    created: "02/11/2025",
  },
];

const statusColors = {
  "To Do": "#7D8089",
  "In Progress": "#4353FF",
  Done: "#10B981",
  Blocked: "#EF4444",
};

const priorityColors = {
  Low: "#7D8089",
  Normal: "#4353FF",
  High: "#F59E0B",
  Urgent: "#EF4444",
};

interface Column {
  id: string;
  label: string;
  width: number;
  minWidth: number;
}

interface DraggableColumnHeaderProps {
  column: Column;
  index: number;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
  onResize: (id: string, width: number) => void;
}

const DraggableColumnHeader = ({
  column,
  index,
  moveColumn,
  onResize,
}: DraggableColumnHeaderProps) => {
  const ref = useRef<HTMLTableCellElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: "COLUMN",
    item: { index, id: column.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: "COLUMN",
    hover: (item: { index: number; id: string }, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect =
        ref.current?.getBoundingClientRect();
      const hoverMiddleX =
        (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientX =
        clientOffset!.x - hoverBoundingRect.left;

      if (
        dragIndex < hoverIndex &&
        hoverClientX < hoverMiddleX
      ) {
        return;
      }
      if (
        dragIndex > hoverIndex &&
        hoverClientX > hoverMiddleX
      ) {
        return;
      }

      moveColumn(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const newWidth = Math.max(
        column.minWidth,
        e.clientX - rect.left,
      );
      onResize(column.id, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener(
        "mousemove",
        handleMouseMove,
      );
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, column.id, column.minWidth, onResize]);

  drag(drop(ref));

  return (
    <th
      ref={ref}
      className={`text-left px-4 py-3 text-xs tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer group relative ${
        isOver ? "bg-[var(--primary)]/10" : ""
      }`}
      style={{
        width: column.width,
        minWidth: column.minWidth,
        maxWidth: column.width,
        opacity: isDragging ? 0.5 : 1,
        userSelect: isResizing ? "none" : "auto",
      }}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing" />
        <span>{column.label}</span>
        <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Resize handle */}
      <div
        ref={resizeRef}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsResizing(true);
        }}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--primary)] transition-colors group-hover:bg-[var(--border)]"
        style={{
          background: isResizing ? "var(--primary)" : undefined,
        }}
      />
    </th>
  );
};

interface ClickUpTasksTableProps {
  tasks?: Task[];
}

export function ClickUpTasksTable({
  tasks = sampleTasks,
}: ClickUpTasksTableProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState(
    "AI is analyzing",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [columns, setColumns] = useState<Column[]>([
    { id: "key", label: "Key", width: 120, minWidth: 80 },
    {
      id: "summary",
      label: "Summary",
      width: 300,
      minWidth: 200,
    },
    {
      id: "status",
      label: "Status",
      width: 140,
      minWidth: 100,
    },
    {
      id: "assignee",
      label: "Assignee",
      width: 180,
      minWidth: 120,
    },
    {
      id: "priority",
      label: "Priority",
      width: 120,
      minWidth: 100,
    },
    {
      id: "dueDate",
      label: "Due Date",
      width: 140,
      minWidth: 120,
    },
    { id: "tags", label: "Tags", width: 150, minWidth: 100 },
    {
      id: "estimate",
      label: "Estimate",
      width: 120,
      minWidth: 100,
    },
    {
      id: "created",
      label: "Created",
      width: 120,
      minWidth: 100,
    },
  ]);

  // Calculate stats
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "To Do").length,
    inProgress: tasks.filter((t) => t.status === "In Progress")
      .length,
    done: tasks.filter((t) => t.status === "Done").length,
    blocked: tasks.filter((t) => t.status === "Blocked").length,
  };

  // Pagination calculations
  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = tasks.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (
    newItemsPerPage: number,
  ) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Animated dots for generating text
  useEffect(() => {
    if (!isGenerating) return;

    const texts = [
      "AI is analyzing",
      "AI is analyzing.",
      "AI is analyzing..",
      "AI is analyzing...",
    ];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setGeneratingText(texts[index]);
    }, 400);

    // Simulate generation completion after 3 seconds
    const timeout = setTimeout(() => {
      setIsGenerating(false);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isGenerating]);

  const handleGenerateWithAI = () => {
    setIsGenerating(true);
  };

  const exportToExcel = async () => {
    try {
      // Dynamic import of xlsx library
      const XLSX = await import("xlsx");

      // Prepare data for export
      const exportData = tasks.map((task) => ({
        Key: task.key,
        Summary: task.summary,
        Status: task.status,
        Assignee: task.assignee || "Unassigned",
        Priority: task.priority,
        "Due Date": task.dueDate || "-",
        Tags: task.tags?.join(", ") || "-",
        Estimate: task.estimate || "-",
        Created: task.created,
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Key
        { wch: 40 }, // Summary
        { wch: 15 }, // Status
        { wch: 20 }, // Assignee
        { wch: 12 }, // Priority
        { wch: 12 }, // Due Date
        { wch: 20 }, // Tags
        { wch: 10 }, // Estimate
        { wch: 12 }, // Created
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Tasks");

      // Generate file and download
      XLSX.writeFile(
        wb,
        `tasks-export-${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    }
  };

  const exportToPDF = async () => {
    try {
      // Dynamic import of jsPDF and autoTable
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable"))
        .default;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Add title
      doc.setFontSize(18);
      doc.text("Tasks Export", 14, 15);

      // Add date
      doc.setFontSize(10);
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        14,
        22,
      );

      // Prepare table data
      const tableData = tasks.map((task) => [
        task.key,
        task.summary,
        task.status,
        task.assignee || "Unassigned",
        task.priority,
        task.dueDate || "-",
        task.tags?.join(", ") || "-",
        task.estimate || "-",
        task.created,
      ]);

      // Add table using autoTable
      (doc as any).autoTable({
        head: [
          [
            "Key",
            "Summary",
            "Status",
            "Assignee",
            "Priority",
            "Due Date",
            "Tags",
            "Estimate",
            "Created",
          ],
        ],
        body: tableData,
        startY: 28,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [91, 95, 237],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250],
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Key
          1: { cellWidth: 60 }, // Summary
          2: { cellWidth: 25 }, // Status
          3: { cellWidth: 30 }, // Assignee
          4: { cellWidth: 20 }, // Priority
          5: { cellWidth: 22 }, // Due Date
          6: { cellWidth: 30 }, // Tags
          7: { cellWidth: 18 }, // Estimate
          8: { cellWidth: 22 }, // Created
        },
      });

      // Save PDF
      doc.save(
        `tasks-export-${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    }
  };

  const moveColumn = (
    dragIndex: number,
    hoverIndex: number,
  ) => {
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];
      const dragColumn = newColumns[dragIndex];
      newColumns.splice(dragIndex, 1);
      newColumns.splice(hoverIndex, 0, dragColumn);
      return newColumns;
    });
  };

  const handleResize = (id: string, width: number) => {
    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.id === id ? { ...col, width } : col,
      ),
    );
  };

  const renderCell = (task: Task, columnId: string) => {
    switch (columnId) {
      case "key":
        return (
          <span
            className="text-sm px-2 py-1 rounded-md transition-all whitespace-nowrap overflow-hidden text-ellipsis block"
            style={{
              backgroundColor: `${statusColors[task.status]}15`,
              color: statusColors[task.status],
              fontFamily: "monospace",
              maxWidth: "100%",
            }}
            title={task.key}
          >
            {task.key}
          </span>
        );
      case "summary":
        return (
          <div className="text-[var(--foreground)] group-hover/row:text-[var(--primary)] transition-colors group-hover/cell:bg-[var(--muted)]/30 -mx-2 px-2 py-1 rounded">
            {task.summary}
          </div>
        );
      case "status":
        return (
          <Badge
            variant="outline"
            className="px-2.5 py-1"
            style={{
              backgroundColor: `${statusColors[task.status]}10`,
              borderColor: `${statusColors[task.status]}30`,
              color: statusColors[task.status],
            }}
          >
            {task.status}
          </Badge>
        );
      case "assignee":
        return task.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <div className="w-full h-full bg-[var(--primary)] flex items-center justify-center text-xs text-white">
                {task.assignee.charAt(0)}
              </div>
            </Avatar>
            <span className="text-sm">{task.assignee}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <User className="w-4 h-4" />
            <span className="text-sm">Unassigned</span>
          </div>
        );
      case "priority":
        return (
          <Badge
            variant="outline"
            className="px-2.5 py-1"
            style={{
              backgroundColor: `${priorityColors[task.priority]}10`,
              borderColor: `${priorityColors[task.priority]}30`,
              color: priorityColors[task.priority],
            }}
          >
            {task.priority}
          </Badge>
        );
      case "dueDate":
        return task.dueDate ? (
          <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
            <CalendarIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span>{task.dueDate}</span>
          </div>
        ) : (
          <span className="text-sm text-[var(--muted-foreground)]">
            -
          </span>
        );
      case "tags":
        return task.tags && task.tags.length > 0 ? (
          <div className="flex gap-1">
            {task.tags.map((tag, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-[var(--muted-foreground)]">
            -
          </span>
        );
      case "estimate":
        return task.estimate ? (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span>{task.estimate}</span>
          </div>
        ) : (
          <span className="text-sm text-[var(--muted-foreground)]">
            -
          </span>
        );
      case "created":
        return (
          <span className="text-sm text-[var(--muted-foreground)]">
            {task.created}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--muted)]/20 relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl mb-1">Tasks</h1>
              <p className="text-[var(--muted-foreground)]">
                Manage and track your work in a spreadsheet-like
                view
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)]"
                  >
                    <FileDown className="w-4 h-4" />
                    Export
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40"
                >
                  <DropdownMenuItem
                    onClick={exportToExcel}
                    className="cursor-pointer gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"
                        fill="#10B981"
                        opacity="0.2"
                      />
                      <path
                        d="M2 4h12M2 8h12M6 2v12"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Export to Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={exportToPDF}
                    className="cursor-pointer gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 2h10v12H3z"
                        fill="#EF4444"
                        opacity="0.2"
                      />
                      <path
                        d="M3 2h7l3 3v9H3V2z"
                        stroke="#EF4444"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 2v3h3"
                        stroke="#EF4444"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Export to PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)]"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M2 4h4M2 8h4M2 12h4M10 4h4M10 8h4M10 12h4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Columns
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={
                  isGenerating
                    ? generatingText
                    : "Search tasks..."
                }
                disabled={isGenerating}
                className={`w-full px-4 py-2 bg-[var(--background)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm ${
                  isGenerating
                    ? "border-purple-500/50 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5 bg-[length:200%_100%] animate-shimmer cursor-not-allowed"
                    : "border-[var(--border)]"
                }`}
                style={
                  isGenerating
                    ? {
                        animation: "shimmer 2s infinite linear",
                      }
                    : {}
                }
              />
              {isGenerating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Sparkles
                    className="w-4 h-4 text-purple-500"
                    style={{
                      animation:
                        "sparkle 1.2s ease-in-out infinite",
                    }}
                  />
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="bg-[var(--background)] hover:bg-[var(--muted)]"
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
                    className={`bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30 hover:from-purple-500/20 hover:to-blue-500/20 text-purple-600 dark:text-purple-400 transition-all hover:scale-105 ${
                      isGenerating
                        ? "animate-pulse cursor-not-allowed opacity-50"
                        : ""
                    }`}
                  >
                    <Sparkles
                      className="w-4 h-4"
                      style={
                        isGenerating
                          ? {
                              animation:
                                "twinkle 1.5s ease-in-out infinite",
                            }
                          : {}
                      }
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isGenerating
                      ? "Generating..."
                      : "Click to generate with AI"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)]"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)]"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Group
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table
            className="w-full border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <thead className="sticky top-0 z-10 bg-[var(--card)] border-b border-[var(--border)] backdrop-blur-sm shadow-sm">
              <tr>
                <th
                  className="text-left px-4 py-3 w-12"
                  style={{
                    width: 48,
                    minWidth: 48,
                    maxWidth: 48,
                  }}
                >
                  <Checkbox />
                </th>
                {columns.map((column, index) => (
                  <DraggableColumnHeader
                    key={`${column.id}-${index}`}
                    column={column}
                    index={index}
                    moveColumn={moveColumn}
                    onResize={handleResize}
                  />
                ))}
                <th
                  className="w-12"
                  style={{
                    width: 48,
                    minWidth: 48,
                    maxWidth: 48,
                  }}
                ></th>
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.map((task, index) => (
                <tr
                  key={task.id}
                  className="border-b border-[var(--border)] hover:bg-[var(--muted)]/50 transition-all duration-150 cursor-pointer group/row"
                  style={{
                    animation: `fadeInRow 0.3s ease-out ${index * 0.05}s both`,
                  }}
                >
                  <td
                    className="px-4 py-4"
                    style={{
                      width: 48,
                      minWidth: 48,
                      maxWidth: 48,
                    }}
                  >
                    <Checkbox />
                  </td>
                  {columns.map((column, colIndex) => (
                    <td
                      key={`${task.id}-${column.id}-${colIndex}`}
                      className="px-4 py-4 group/cell overflow-hidden"
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.width,
                      }}
                    >
                      {renderCell(task, column.id)}
                    </td>
                  ))}
                  <td
                    className="px-4 py-4"
                    style={{
                      width: 48,
                      minWidth: 48,
                      maxWidth: 48,
                    }}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover/row:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Row Button */}
          {tasks.length > 0 && (
            <div className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 transition-colors">
              <button className="w-full px-4 py-3 flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-left group">
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Add task</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-[var(--muted-foreground)]"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-lg mb-2">No tasks yet</h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                Create your first task to get started
              </p>
              <Button className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {tasks.length > 0 && (
          <div className="border-t border-[var(--border)] bg-[var(--card)] px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <span>Show</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-16 px-2 bg-[var(--background)] hover:bg-[var(--muted)]"
                    >
                      {itemsPerPage}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-20"
                  >
                    {[5, 10, 25, 50, 100].map((size) => (
                      <DropdownMenuItem
                        key={size}
                        onClick={() =>
                          handleItemsPerPageChange(size)
                        }
                        className="cursor-pointer justify-center"
                      >
                        {size}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span>of {tasks.length} tasks</span>
              </div>

              {/* Page info and navigation */}
              <div className="flex items-center gap-2">
                {/* Page range info */}
                <span className="text-sm text-[var(--muted-foreground)] mr-2">
                  {startIndex + 1}-
                  {Math.min(endIndex, tasks.length)} of{" "}
                  {tasks.length}
                </span>

                {/* First page button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-[var(--background)] hover:bg-[var(--muted)]"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>

                {/* Previous page button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-[var(--background)] hover:bg-[var(--muted)]"
                  onClick={() =>
                    setCurrentPage(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page numbers */}
                <div className="hidden sm:flex items-center gap-1">
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-[var(--muted-foreground)]"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={
                          currentPage === page
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className={`h-8 w-8 p-0 ${
                          currentPage === page
                            ? "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                            : "bg-[var(--background)] hover:bg-[var(--muted)]"
                        }`}
                        onClick={() =>
                          setCurrentPage(page as number)
                        }
                      >
                        {page}
                      </Button>
                    ),
                  )}
                </div>

                {/* Mobile: Current page indicator */}
                <div className="sm:hidden flex items-center gap-2 text-sm">
                  <span className="text-[var(--foreground)]">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                {/* Next page button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-[var(--background)] hover:bg-[var(--muted)]"
                  onClick={() =>
                    setCurrentPage(currentPage + 1)
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Last page button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-[var(--background)] hover:bg-[var(--muted)]"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <style>{`
        @keyframes fadeInRow {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      </div>
    </DndProvider>
  );
}