'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  X,
  CheckSquare,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateDDMMYYYY } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';
import { RoadmapTaskEditor } from '@/components/roadmap/roadmap-task-editor';
import { CreateTaskDialogInline } from './create-task-dialog-inline';

interface Task {
  id: string;
  number: number;
  summary: string;
  description?: string;
  priority: string;
  tags: string[];
  dueDate?: string;
  estimate?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  status: {
    id: string;
    name: string;
    key: string;
    color?: string;
  };
  customFieldValues: Array<{
    id: string;
    value: any;
    customField: {
      id: string;
      name: string;
      key: string;
      type: string;
    };
  }>;
  commentCount: number;
  attachmentCount: number;
}

interface Status {
  id: string;
  name: string;
  key: string;
  color?: string;
}

interface CustomField {
  id: string;
  name: string;
  key: string;
  type: string;
  options?: any;
  required: boolean;
}

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

interface TasksTableProps {
  spaceSlug: string;
}

interface Column {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  key: string;
  visible: boolean;
}

type GroupByOption = 'none' | 'assignee' | 'status' | 'priority';

interface FilterCondition {
  field: string;
  operator: string;
  value: any;
  value2?: any; // For "between" operator
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'key', label: 'Key', width: 120, minWidth: 80, key: 'key', visible: true },
  { id: 'summary', label: 'Summary', width: 300, minWidth: 200, key: 'summary', visible: true },
  { id: 'status', label: 'Status', width: 140, minWidth: 100, key: 'status', visible: true },
  { id: 'assignee', label: 'Assignee', width: 180, minWidth: 120, key: 'assignee', visible: true },
  { id: 'priority', label: 'Priority', width: 120, minWidth: 100, key: 'priority', visible: true },
  { id: 'dueDate', label: 'Due Date', width: 140, minWidth: 120, key: 'dueDate', visible: true },
  { id: 'tags', label: 'Tags', width: 150, minWidth: 100, key: 'tags', visible: true },
  { id: 'estimate', label: 'Estimate', width: 120, minWidth: 100, key: 'estimate', visible: true },
  { id: 'created', label: 'Created', width: 120, minWidth: 100, key: 'createdAt', visible: true },
];

const statusColors: Record<string, string> = {
  'To Do': '#7D8089',
  'In Progress': '#4353FF',
  'Done': '#10B981',
  'Blocked': '#EF4444',
};

const priorityColors: Record<string, string> = {
  'Low': '#7D8089',
  'Normal': '#4353FF',
  'High': '#F59E0B',
  'Urgent': '#EF4444',
  'Highest': '#EF4444',
  'Lowest': '#7D8089',
};

interface DraggableColumnHeaderProps {
  column: Column;
  onResize: (id: string, width: number) => void;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (columnId: string) => void;
}

function DraggableColumnHeader({ column, onResize, sortColumn, sortDirection, onSort }: DraggableColumnHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const headerRef = useRef<HTMLTableCellElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !headerRef.current) return;
      const rect = headerRef.current.getBoundingClientRect();
      const newWidth = Math.max(column.minWidth, e.clientX - rect.left);
      onResize(column.id, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, column.id, column.minWidth, onResize]);

  return (
    <th
      ref={headerRef}
      className="text-left px-4 py-3 text-xs tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer group relative bg-[var(--card)]"
      style={{
        ...style,
        width: column.width,
        minWidth: column.minWidth,
        maxWidth: column.width,
        userSelect: isResizing ? 'none' : 'auto',
      }}
    >
      <div ref={setNodeRef} className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </div>
        <span className="flex-1">{column.label}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSort?.(column.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-100"
        >
          {sortColumn === column.id ? (
            sortDirection === 'asc' ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )
          ) : (
            <ChevronDown className="w-3 h-3 opacity-50" />
          )}
        </button>
      </div>
      <div
        ref={resizeRef}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsResizing(true);
        }}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--primary)] transition-colors group-hover:bg-[var(--border)]"
        style={{
          background: isResizing ? 'var(--primary)' : undefined,
        }}
      />
    </th>
  );
}

export function TasksTable({ spaceSlug }: TasksTableProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [spaceTicker, setSpaceTicker] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState('AI is analyzing');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const { success, error: showError } = useToastHelpers();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, [spaceSlug]);

  const fetchData = async () => {
    try {
      const [tasksRes, statusesRes, customFieldsRes, membersRes, spaceRes] = await Promise.all([
        fetch(`/api/spaces/${spaceSlug}/tasks`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}/statuses`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}/custom-fields`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}/members`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}`, { credentials: 'include' }),
      ]);

      const [tasksData, statusesData, customFieldsData, membersData, spaceData] = await Promise.all([
        tasksRes.json(),
        statusesRes.json(),
        customFieldsRes.json(),
        membersRes.json(),
        spaceRes.json(),
      ]);

      if (tasksData.success) setTasks(tasksData.tasks);
      if (statusesData.success) setStatuses(statusesData.statuses);
      if (spaceData.success) setSpaceTicker(spaceData.space.ticker || '');
      if (customFieldsData.success) setCustomFields(customFieldsData.customFields || []);
      if (membersData.success) setUsers(membersData.members?.map((m: any) => m.user) || []);
    } catch (err) {
      setError('Failed to fetch data');
      showError('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleResize = useCallback((id: string, width: number) => {
    setColumns((prev) => prev.map((col) => (col.id === id ? { ...col, width } : col)));
  }, []);

  const formatPriority = (priority: string) => {
    const map: Record<string, string> = {
      HIGHEST: 'Highest',
      HIGH: 'High',
      NORMAL: 'Normal',
      LOW: 'Low',
      LOWEST: 'Lowest',
    };
    return map[priority] || priority;
  };


  const applyFilters = useCallback(
    (tasksToFilter: Task[]): Task[] => {
      let filtered = tasksToFilter;

      // Apply search query (only when explicitly triggered)
      if (activeSearchQuery.trim()) {
        const query = activeSearchQuery.toLowerCase();
        filtered = filtered.filter((task) => {
          const searchableFields = [
            task.summary,
            task.description,
            spaceTicker && task.number ? `${spaceTicker}-${task.number}` : '',
            task.status?.name,
            task.assignee?.name || task.assignee?.email,
            formatPriority(task.priority || 'NORMAL'),
            ...(task.tags || []),
          ];
          return searchableFields.some((field) => String(field).toLowerCase().includes(query));
        });
      }

      // Apply filters
      filters.forEach((filter) => {
        filtered = filtered.filter((task) => {
          let value = getTaskValue(task, filter.field);
          
          // Handle assignee special case
          if (filter.field === 'assignee') {
            if (filter.value === 'unassigned') {
              value = task.assignee ? null : 'unassigned';
      } else {
              value = task.assignee?.id || null;
            }
          }
          
          // Handle status special case (filter by id but compare with name)
          if (filter.field === 'status') {
            value = task.status?.id || null;
          }
          
          switch (filter.operator) {
            case 'contains':
              return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'not_equals':
              return value !== filter.value && String(value).toLowerCase() !== String(filter.value).toLowerCase();
            case 'is_empty':
              return !value || value === 'unassigned' || (Array.isArray(value) && value.length === 0);
            case 'is_not_empty':
              return value && value !== 'unassigned' && (!Array.isArray(value) || value.length > 0);
            case 'greater_than':
              return Number(value) > Number(filter.value);
            case 'less_than':
              return Number(value) < Number(filter.value);
            case 'before':
              // "before" includes the date itself (till today = before or equal to today)
              if (!value || !filter.value) return false;
              const taskDateBefore = new Date(value);
              taskDateBefore.setHours(0, 0, 0, 0);
              const beforeDate = new Date(filter.value);
              beforeDate.setHours(23, 59, 59, 999); // Include the entire day
              return taskDateBefore <= beforeDate;
            case 'after':
              // "after" excludes the date itself
              if (!value || !filter.value) return false;
              const taskDateAfter = new Date(value);
              taskDateAfter.setHours(0, 0, 0, 0);
              const afterDate = new Date(filter.value);
              afterDate.setHours(0, 0, 0, 0); // Start of the day
              return taskDateAfter > afterDate;
            case 'equals':
              // For date fields, compare dates without time
              if (['dueDate', 'createdAt'].includes(filter.field)) {
                if (!value || !filter.value) return false;
                const taskDateEquals = new Date(value);
                taskDateEquals.setHours(0, 0, 0, 0);
                const equalsDate = new Date(filter.value);
                equalsDate.setHours(0, 0, 0, 0);
                return taskDateEquals.getTime() === equalsDate.getTime();
              }
              return value === filter.value || String(value).toLowerCase() === String(filter.value).toLowerCase();
            case 'between':
              if (!value || !filter.value || !filter.value2) return false;
              const taskDateBetween = new Date(value);
              taskDateBetween.setHours(0, 0, 0, 0);
              const startDate = new Date(filter.value);
              startDate.setHours(0, 0, 0, 0);
              const endDate = new Date(filter.value2);
              endDate.setHours(23, 59, 59, 999);
              return taskDateBetween >= startDate && taskDateBetween <= endDate;
            default:
              return true;
          }
        });
      });

      return filtered;
    },
    [activeSearchQuery, filters, spaceTicker]
  );

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns]);

  const getTaskValue = useCallback((task: Task, field: string): any => {
    switch (field) {
      case 'key':
        return spaceTicker && task.number ? `${spaceTicker}-${task.number}` : '';
      case 'summary':
        return task.summary || '';
      case 'status':
        return task.status?.name || '';
      case 'assignee':
        return task.assignee?.id || null;
      case 'priority':
        return formatPriority(task.priority || 'NORMAL');
      case 'dueDate':
        return task.dueDate || null;
      case 'tags':
        return task.tags || [];
      case 'estimate':
        return task.estimate || '';
      case 'createdAt':
        return task.createdAt || '';
      default:
        if (field.startsWith('custom_')) {
          const customFieldId = field.replace('custom_', '');
          const customValue = task.customFieldValues?.find((cfv) => cfv.customField.id === customFieldId);
          return customValue?.value || null;
        }
        return null;
    }
  }, [spaceTicker]);

  const filteredTasks = useMemo(() => {
    let filtered = applyFilters(tasks);
    
    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = getTaskValue(a, sortColumn);
        const bValue = getTaskValue(b, sortColumn);
        
        // Handle null/undefined values
        if (!aValue && !bValue) return 0;
        if (!aValue) return 1;
        if (!bValue) return -1;
        
        // Handle dates
        if (['dueDate', 'createdAt'].includes(sortColumn)) {
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          return sortDirection === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
        }
        
        // Handle numbers
        if (typeof aValue === 'number' || typeof bValue === 'number') {
          const aNum = Number(aValue);
          const bNum = Number(bValue);
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // Handle strings
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }
    
    return filtered;
  }, [tasks, applyFilters, sortColumn, sortDirection, getTaskValue]);

  const handleSort = useCallback((columnId: string) => {
    if (sortColumn === columnId) {
      // Toggle direction: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTasks.slice(startIndex, endIndex);
  }, [filteredTasks, currentPage, pageSize]);

  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { '': paginatedTasks };
    }

    const groups: Record<string, Task[]> = {};
    paginatedTasks.forEach((task) => {
      let groupKey = '';
      switch (groupBy) {
        case 'assignee':
          groupKey = task.assignee?.id || 'Unassigned';
          break;
        case 'status':
          groupKey = task.status?.id || 'No Status';
          break;
        case 'priority':
          groupKey = formatPriority(task.priority || 'NORMAL');
          break;
      }
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(task);
    });

    return groups;
  }, [paginatedTasks, groupBy]);

  const totalPages = Math.ceil(filteredTasks.length / pageSize);
  const allTasksSelected = paginatedTasks.length > 0 && paginatedTasks.every((task) => selectedTasks.has(task.id));
  const someTasksSelected = paginatedTasks.some((task) => selectedTasks.has(task.id));

  // Generate page numbers to display with ellipsis
  const getPageNumbers = useCallback(() => {
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
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedTasks);
      paginatedTasks.forEach((task) => newSelected.add(task.id));
      setSelectedTasks(newSelected);
    } else {
      const newSelected = new Set(selectedTasks);
      paginatedTasks.forEach((task) => newSelected.delete(task.id));
      setSelectedTasks(newSelected);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [activeSearchQuery, filters, groupBy]);

  // Handle indeterminate state for select all checkbox
  const selectAllCheckboxRef = useRef<React.ElementRef<typeof Checkbox>>(null);
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const input = (selectAllCheckboxRef.current as any).querySelector?.('input[type="checkbox"]') as HTMLInputElement;
      if (input) {
        input.indeterminate = someTasksSelected && !allTasksSelected;
      }
    }
  }, [someTasksSelected, allTasksSelected]);

  const handleSearch = () => {
    setActiveSearchQuery(searchInput);
  };

  const handleAIFilter = async () => {
    if (!searchInput.trim()) return;
    
    setIsGenerating(true);
    setGeneratingText('AI is analyzing');
    
    try {
      const response = await fetch('/api/ai/parse-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: searchInput, fields: columns.map((c) => ({ key: c.key, label: c.label })) }),
      });

          const data = await response.json();
      if (data.success && data.filters) {
        setFilters(data.filters);
        setActiveSearchQuery('');
        setSearchInput('');
          } else {
        // Fallback to regular search
        setActiveSearchQuery(searchInput);
          }
        } catch (err) {
      console.error('AI filter error:', err);
      // Fallback to regular search
      setActiveSearchQuery(searchInput);
    } finally {
      setTimeout(() => setIsGenerating(false), 1000);
    }
  };

  const handleExportExcel = () => {
    if (filteredTasks.length === 0) return;
    const exportCols = visibleColumns;
    const rows = filteredTasks.map((task) => {
      const row: Record<string, string> = {};
      exportCols.forEach((col) => {
        row[col.label] = getExportValue(task, col.id);
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    XLSX.writeFile(workbook, `tasks-export-${timestamp}.xlsx`);
  };

  const handleExportPDF = () => {
    if (filteredTasks.length === 0) return;
    const exportCols = visibleColumns;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });
    autoTable(doc, {
      head: [exportCols.map((col) => col.label)],
      body: filteredTasks.map((task) => exportCols.map((col) => getExportValue(task, col.id))),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [91, 95, 237] },
    });
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    doc.save(`tasks-export-${timestamp}.pdf`);
  };

  const renderCell = (task: Task, columnId: string) => {
    switch (columnId) {
      case 'key':
        const keyValue = spaceTicker && task.number ? `${spaceTicker}-${task.number}` : '';
      return (
          <span
            className="text-sm px-2 py-1 rounded-md transition-all whitespace-nowrap overflow-hidden text-ellipsis block cursor-pointer hover:underline"
            style={{
              backgroundColor: `${statusColors[task.status?.name || 'To Do'] || '#7D8089'}15`,
              color: statusColors[task.status?.name || 'To Do'] || '#7D8089',
              fontFamily: 'monospace',
              maxWidth: '100%',
            }}
            title={keyValue}
            onClick={() => {
              setEditorOpen(true);
              setSelectedTask(task);
            }}
            >
              {keyValue}
          </span>
        );
      case 'summary':
        return (
          <div className="text-[var(--foreground)] group-hover/row:text-[var(--primary)] transition-colors group-hover/cell:bg-[var(--muted)]/30 -mx-2 px-2 py-1 rounded">
            {task.summary}
        </div>
      );
      case 'status':
        const statusColor = task.status?.color || statusColors[task.status?.name || 'To Do'] || '#7D8089';
      return (
          <Badge
            variant="outline"
            className="px-2.5 py-1"
            style={{
              backgroundColor: `${statusColor}10`,
              borderColor: `${statusColor}30`,
              color: statusColor,
            }}
          >
            {task.status?.name || 'No Status'}
          </Badge>
        );
      case 'assignee':
        return task.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-[var(--primary)] text-white text-xs">
                {(task.assignee.name || task.assignee.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{task.assignee.name || task.assignee.email}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <User className="w-4 h-4" />
            <span className="text-sm">Unassigned</span>
        </div>
      );
      case 'priority':
        const priorityName = formatPriority(task.priority || 'NORMAL');
        const priorityColor = priorityColors[priorityName] || '#7D8089';
      return (
          <Badge
            variant="outline"
            className="px-2.5 py-1"
            style={{
              backgroundColor: `${priorityColor}10`,
              borderColor: `${priorityColor}30`,
              color: priorityColor,
            }}
          >
            {priorityName}
          </Badge>
        );
      case 'dueDate':
        return task.dueDate ? (
          <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
            <CalendarIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span>{formatDateDDMMYYYY(task.dueDate)}</span>
          </div>
        ) : (
          <span className="text-sm text-[var(--muted-foreground)]">-</span>
        );
      case 'tags':
        return task.tags && task.tags.length > 0 ? (
          <div className="flex gap-1">
            {task.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-[var(--muted-foreground)]">-</span>
        );
      case 'estimate':
        return task.estimate ? (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span>{task.estimate}</span>
        </div>
        ) : (
          <span className="text-sm text-[var(--muted-foreground)]">-</span>
      );
      case 'createdAt':
    return (
          <span className="text-sm text-[var(--muted-foreground)]">
            {task.createdAt ? formatDateDDMMYYYY(task.createdAt) : '-'}
          </span>
        );
      default:
        return null;
    }
  };

  const getExportValue = (task: Task, columnId: string): string => {
    switch (columnId) {
      case 'key':
        return spaceTicker && task.number ? `${spaceTicker}-${task.number}` : '';
      case 'summary':
        return task.summary || '';
      case 'status':
        return task.status?.name || '';
      case 'assignee':
        return task.assignee?.name || task.assignee?.email || 'Unassigned';
      case 'priority':
        return formatPriority(task.priority || 'NORMAL');
      case 'dueDate':
        return task.dueDate ? formatDateDDMMYYYY(task.dueDate) : '';
      case 'tags':
        return task.tags?.join(', ') || '';
      case 'estimate':
        return task.estimate || '';
      case 'createdAt':
        return task.createdAt ? formatDateDDMMYYYY(task.createdAt) : '';
      default:
        if (columnId.startsWith('custom_')) {
          const customFieldId = columnId.replace('custom_', '');
          const customValue = task.customFieldValues?.find((cfv) => cfv.customField.id === customFieldId);
          if (Array.isArray(customValue?.value)) {
            return customValue?.value.join(', ');
          }
          return customValue?.value ? String(customValue.value) : '';
        }
        return '';
    }
  };

  const getFieldType = (field: string): 'text' | 'date' | 'select' => {
    if (['dueDate', 'createdAt'].includes(field)) return 'date';
    if (['status', 'assignee', 'priority'].includes(field)) return 'select';
    return 'text';
  };

  const getOperatorsForField = (field: string) => {
    const type = getFieldType(field);
    if (type === 'date') {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'before', label: 'Before' },
        { value: 'after', label: 'After' },
        { value: 'between', label: 'Between' },
        { value: 'is_empty', label: 'Is Empty' },
        { value: 'is_not_empty', label: 'Is Not Empty' },
      ];
    }
    if (type === 'select') {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'not_equals', label: 'Not Equals' },
        { value: 'is_empty', label: 'Is Empty' },
        { value: 'is_not_empty', label: 'Is Not Empty' },
      ];
    }
    return [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'is_empty', label: 'Is Empty' },
      { value: 'is_not_empty', label: 'Is Not Empty' },
    ];
  };

  const getSelectOptions = (field: string) => {
    if (field === 'status') {
      return statuses.map((s) => ({ value: s.id, label: s.name }));
    }
    if (field === 'assignee') {
      return [
        { value: 'unassigned', label: 'Unassigned' },
        ...users.map((u) => ({ value: u.id, label: u.name || u.email })),
      ];
    }
    if (field === 'priority') {
      return [
        { value: 'Highest', label: 'Highest' },
        { value: 'High', label: 'High' },
        { value: 'Normal', label: 'Normal' },
        { value: 'Low', label: 'Low' },
        { value: 'Lowest', label: 'Lowest' },
      ];
    }
    return [];
  };

  useEffect(() => {
    if (!isGenerating) return;
    const texts = ['AI is analyzing', 'AI is analyzing.', 'AI is analyzing..', 'AI is analyzing...'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setGeneratingText(texts[index]);
    }, 400);
    return () => clearInterval(interval);
  }, [isGenerating]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--muted)]/20 relative">
      <div className="px-6 py-5 border-b border-[var(--border)]">
        <div className="flex items-start justify-between mb-4">
        <div>
            <h1 className="text-2xl mb-1">Tasks</h1>
            <p className="text-[var(--muted-foreground)]">Manage and track your work in a spreadsheet-like view</p>
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
                  className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)]"
                  disabled={filteredTasks.length === 0}
          >
                  <Download className="w-4 h-4" />
                  Export
          </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold">Export</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleExportExcel}
                  className="gap-2"
                  disabled={filteredTasks.length === 0}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportPDF}
                  className="gap-2"
                  disabled={filteredTasks.length === 0}
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu open={columnsMenuOpen} onOpenChange={setColumnsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)]">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h4M2 8h4M2 12h4M10 4h4M10 8h4M10 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
            Columns
          </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold">Show/Hide Columns</div>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.visible}
                    onCheckedChange={(checked) => {
                      setColumns((prev) =>
                        prev.map((col) => (col.id === column.id ? { ...col, visible: checked as boolean } : col))
                      );
                    }}
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={isGenerating ? generatingText : 'Search tasks or ask AI to filter...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  handleSearch();
                }
              }}
              disabled={isGenerating}
              className={`w-full px-4 py-2 bg-[var(--background)] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm ${
                isGenerating
                  ? 'border-purple-500/50 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5 cursor-not-allowed'
                  : 'border-[var(--border)]'
              }`}
            />
            {isGenerating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="bg-[var(--background)] hover:bg-[var(--muted)]"
            disabled={isGenerating}
            onClick={handleSearch}
          >
            <Search className="w-4 h-4" />
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAIFilter}
                  disabled={isGenerating || !searchInput.trim()}
                  className={`bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30 hover:from-purple-500/20 hover:to-blue-500/20 text-purple-600 dark:text-purple-400 transition-all hover:scale-105 ${
                    isGenerating ? 'animate-pulse cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <Sparkles
                    className="w-4 h-4"
                    style={isGenerating ? {
                      animation: 'twinkle 1.5s ease-in-out infinite'
                    } : {}}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isGenerating ? 'Generating...' : 'Click to generate with AI'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Popover open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)]">
                <Filter className="w-4 h-4" />
                Filter
                {filters.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Filters</div>
                  {filters.length > 0 && (
                    <Button
                      variant="ghost"
            size="sm"
                      onClick={() => setFilters([])}
                      className="text-xs"
          >
                      Clear All
          </Button>
                  )}
        </div>
                <div className="space-y-3">
                  {filters.map((filter, index) => (
                    <div key={index} className="p-3 border border-[var(--border)] rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Select
                          value={filter.field}
                          onValueChange={(value) => {
                            const newFilters = [...filters];
                            const fieldType = getFieldType(value);
                            const defaultOperator = fieldType === 'date' ? 'equals' : fieldType === 'select' ? 'equals' : 'contains';
                            newFilters[index] = { ...newFilters[index], field: value, operator: defaultOperator, value: '', value2: undefined };
                            setFilters(newFilters);
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map((col) => (
                              <SelectItem key={col.id} value={col.key}>
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
          <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setFilters(filters.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="h-4 w-4" />
          </Button>
      </div>
                      <Select
                        value={filter.operator}
                        onValueChange={(value) => {
                          const newFilters = [...filters];
                          // Clear value2 when switching away from "between"
                          if (value !== 'between') {
                            newFilters[index] = { ...newFilters[index], operator: value, value2: undefined };
                          } else {
                            newFilters[index] = { ...newFilters[index], operator: value };
                          }
                          setFilters(newFilters);
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorsForField(filter.field).map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                        <div>
                          {getFieldType(filter.field) === 'date' ? (
                            filter.operator === 'between' ? (
                              <div className="space-y-2">
                                <Popover
                                  open={datePickerOpen[`${index}-start`] || false}
                                  onOpenChange={(open) => setDatePickerOpen({ ...datePickerOpen, [`${index}-start`]: open })}
                                >
                                  <PopoverTrigger asChild>
                                    <Input
                                      type="text"
                                      placeholder="MM/DD/YYYY"
                                      value={filter.value ? (() => {
                                        const date = new Date(filter.value);
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        const year = date.getFullYear();
                                        return `${month}/${day}/${year}`;
                                      })() : ''}
                                      readOnly
                                      onClick={() => setDatePickerOpen({ ...datePickerOpen, [`${index}-start`]: true })}
                                      className="h-8 text-sm cursor-pointer"
                                    />
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      onChange={(value: any) => {
                                        if (value instanceof Date) {
                                          const y = value.getFullYear();
                                          const m = String(value.getMonth() + 1).padStart(2, '0');
                                          const d = String(value.getDate()).padStart(2, '0');
                                          const newFilters = [...filters];
                                          newFilters[index] = { ...newFilters[index], value: `${y}-${m}-${d}` };
                                          setFilters(newFilters);
                                          setDatePickerOpen({ ...datePickerOpen, [`${index}-start`]: false });
                                        }
                                      }}
                                      value={filter.value ? (() => {
                                        const [y, m, d] = filter.value.split('-').map(Number);
                                        return new Date(y, m - 1, d);
                                      })() : null}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <Popover
                                  open={datePickerOpen[`${index}-end`] || false}
                                  onOpenChange={(open) => setDatePickerOpen({ ...datePickerOpen, [`${index}-end`]: open })}
                                >
                                  <PopoverTrigger asChild>
                                    <Input
                                      type="text"
                                      placeholder="MM/DD/YYYY"
                                      value={filter.value2 ? (() => {
                                        const date = new Date(filter.value2);
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        const year = date.getFullYear();
                                        return `${month}/${day}/${year}`;
                                      })() : ''}
                                      readOnly
                                      onClick={() => setDatePickerOpen({ ...datePickerOpen, [`${index}-end`]: true })}
                                      className="h-8 text-sm cursor-pointer"
                                    />
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      onChange={(value: any) => {
                                        if (value instanceof Date) {
                                          const y = value.getFullYear();
                                          const m = String(value.getMonth() + 1).padStart(2, '0');
                                          const d = String(value.getDate()).padStart(2, '0');
                                          const newFilters = [...filters];
                                          newFilters[index] = { ...newFilters[index], value2: `${y}-${m}-${d}` };
                                          setFilters(newFilters);
                                          setDatePickerOpen({ ...datePickerOpen, [`${index}-end`]: false });
                                        }
                                      }}
                                      value={filter.value2 ? (() => {
                                        const [y, m, d] = filter.value2.split('-').map(Number);
                                        return new Date(y, m - 1, d);
                                      })() : null}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            ) : (
                              <Popover
                                open={datePickerOpen[`${index}`] || false}
                                onOpenChange={(open) => setDatePickerOpen({ ...datePickerOpen, [`${index}`]: open })}
                              >
                                <PopoverTrigger asChild>
                                  <Input
                                    type="text"
                                    placeholder="MM/DD/YYYY"
                                    value={filter.value ? (() => {
                                      const date = new Date(filter.value);
                                      const month = String(date.getMonth() + 1).padStart(2, '0');
                                      const day = String(date.getDate()).padStart(2, '0');
                                      const year = date.getFullYear();
                                      return `${month}/${day}/${year}`;
                                    })() : ''}
                                    readOnly
                                    onClick={() => setDatePickerOpen({ ...datePickerOpen, [`${index}`]: true })}
                                    className="h-8 text-sm cursor-pointer"
                                  />
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    onChange={(value: any) => {
                                      if (value instanceof Date) {
                                        const y = value.getFullYear();
                                        const m = String(value.getMonth() + 1).padStart(2, '0');
                                        const d = String(value.getDate()).padStart(2, '0');
                                        const newFilters = [...filters];
                                        newFilters[index] = { ...newFilters[index], value: `${y}-${m}-${d}` };
                                        setFilters(newFilters);
                                        setDatePickerOpen({ ...datePickerOpen, [`${index}`]: false });
                                      }
                                    }}
                                    value={filter.value ? (() => {
                                      const [y, m, d] = filter.value.split('-').map(Number);
                                      return new Date(y, m - 1, d);
                                    })() : null}
                                  />
                                </PopoverContent>
                              </Popover>
                            )
                          ) : getFieldType(filter.field) === 'select' ? (
                            <Select
                              value={filter.value || ''}
                              onValueChange={(value) => {
                                const newFilters = [...filters];
                                newFilters[index] = { ...newFilters[index], value };
                                setFilters(newFilters);
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Select value" />
                              </SelectTrigger>
                              <SelectContent>
                                {getSelectOptions(filter.field).map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type="text"
                              value={filter.value || ''}
                              onChange={(e) => {
                                const newFilters = [...filters];
                                newFilters[index] = { ...newFilters[index], value: e.target.value };
                                setFilters(newFilters);
                              }}
                              placeholder="Enter value"
                              className="h-8 text-sm"
                            />
                          )}
        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setFilters([...filters, { field: columns[0]?.key || 'summary', operator: 'contains', value: '' }]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Filter
          </Button>
        </div>
            </PopoverContent>
          </Popover>
          <Popover open={groupMenuOpen} onOpenChange={setGroupMenuOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-[var(--background)] hover:bg-[var(--muted)]">
                <SlidersHorizontal className="w-4 h-4" />
                Group
                {groupBy !== 'none' && <ChevronDown className="w-4 h-4" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-1">
                <button
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)]"
                  onClick={() => {
                    setGroupBy('none');
                    setGroupMenuOpen(false);
                  }}
                >
                  No Grouping
                </button>
                <button
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)]"
                  onClick={() => {
                    setGroupBy('assignee');
                    setGroupMenuOpen(false);
                  }}
                >
                  Group by Assignee
                </button>
                <button
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)]"
                  onClick={() => {
                    setGroupBy('status');
                    setGroupMenuOpen(false);
                  }}
                >
                  Group by Status
                </button>
                <button
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)]"
                  onClick={() => {
                    setGroupBy('priority');
                    setGroupMenuOpen(false);
                  }}
                >
                  Group by Priority
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead className="sticky top-0 z-10 bg-[var(--card)] border-b border-[var(--border)] backdrop-blur-sm shadow-sm">
              <tr>
                <th className="text-left px-4 py-3 w-12" style={{ width: 48, minWidth: 48, maxWidth: 48 }}>
                  <Checkbox
                    ref={selectAllCheckboxRef}
                    checked={allTasksSelected}
                    onCheckedChange={handleSelectAll}
                  />
                    </th>
                <SortableContext items={visibleColumns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                  {visibleColumns.map((column) => (
                    <DraggableColumnHeader
                      key={column.id}
                      column={column}
                      onResize={handleResize}
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  ))}
                </SortableContext>
                <th className="w-12" style={{ width: 48, minWidth: 48, maxWidth: 48 }}></th>
                </tr>
              </thead>
              <tbody>
              {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => {
                const groupLabel =
                  groupBy === 'assignee'
                    ? users.find((u) => u.id === groupKey)?.name || 'Unassigned'
                    : groupBy === 'status'
                      ? statuses.find((s) => s.id === groupKey)?.name || 'No Status'
                      : groupBy === 'priority'
                        ? groupKey
                        : '';
                return (
                  <React.Fragment key={groupKey}>
                    {groupBy !== 'none' && (
                      <tr className="bg-[var(--muted)]/30">
                        <td colSpan={columns.length + 2} className="px-4 py-2 font-semibold text-sm">
                          {groupLabel} ({groupTasks.length})
                        </td>
                      </tr>
                    )}
                    {groupTasks.map((task, index) => (
                  <tr
                    key={task.id}
                        className="border-b border-[var(--border)] hover:bg-[var(--muted)]/50 transition-all duration-150 cursor-pointer group/row"
                      >
                        <td className="px-4 py-4" style={{ width: 48, minWidth: 48, maxWidth: 48 }}>
                          <Checkbox
                            checked={selectedTasks.has(task.id)}
                            onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                    {visibleColumns.map((column) => (
                      <td
                            key={`${task.id}-${column.id}`}
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
                        <td className="px-4 py-4" style={{ width: 48, minWidth: 48, maxWidth: 48 }}>
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
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Duplicate</DropdownMenuItem>
                              <DropdownMenuItem>Archive</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </td>
                  </tr>
                ))}
                  </React.Fragment>
                );
              })}
              </tbody>
            </table>
          {Object.values(groupedTasks).flat().length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
                <CheckSquare className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
              <h3 className="text-lg mb-2">No tasks found</h3>
              <p className="text-[var(--muted-foreground)] mb-4">Try adjusting your filters or create a new task</p>
              <Button className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
        </div>
      )}
          {Object.values(groupedTasks).flat().length > 0 && (
            <div className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 transition-colors">
              <button
                className="w-full px-4 py-3 flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-left group"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Add task</span>
              </button>
            </div>
          )}
        </DndContext>
      </div>

      {/* Pagination */}
      {filteredTasks.length > 0 && (
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
                    {pageSize}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-20">
                  {[5, 10, 25, 50, 100].map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      className="cursor-pointer justify-center"
                    >
                      {size}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <span>of {filteredTasks.length} tasks</span>
            </div>

            {/* Page info and navigation */}
            <div className="flex items-center gap-2">
              {/* Page range info */}
              <span className="text-sm text-[var(--muted-foreground)] mr-2">
                {Math.min((currentPage - 1) * pageSize + 1, filteredTasks.length)}-
                {Math.min(currentPage * pageSize, filteredTasks.length)} of{' '}
                {filteredTasks.length}
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
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((page, index) =>
                  page === '...' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-[var(--muted-foreground)]"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        currentPage === page
                          ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90'
                          : 'bg-[var(--background)] hover:bg-[var(--muted)]'
                      }`}
                      onClick={() => setCurrentPage(page as number)}
                    >
                      {page}
                    </Button>
                  )
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
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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

      <CreateTaskDialogInline
        spaceSlug={spaceSlug}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTaskCreated={() => {
          fetchData();
          setCreateDialogOpen(false);
        }}
        statuses={statuses}
        customFields={customFields}
        users={users}
      />

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
          fetchData();
        }}
      />
    </div>
  );
}
