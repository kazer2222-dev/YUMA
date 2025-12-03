'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  Calendar as CalendarIcon,
  User,
  Flag,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, addDays, startOfDay } from 'date-fns';

// Types
interface TodoItem {
  id: string;
  content: string;
  checked: boolean;
  indent: number;
  assignee?: { id: string; name: string; avatar?: string };
  dueDate?: string;
  priority?: 'none' | 'low' | 'medium' | 'high' | 'urgent';
}

// Priority config
const priorityConfig: Record<string, { color: string; icon: string | null; label: string }> = {
  none: { color: '', icon: null, label: 'None' },
  low: { color: 'text-blue-500', icon: '🔵', label: 'Low' },
  medium: { color: 'text-yellow-500', icon: '🟡', label: 'Medium' },
  high: { color: 'text-orange-500', icon: '🟠', label: 'High' },
  urgent: { color: 'text-red-500', icon: '🔴', label: 'Urgent' },
};

// Single Item Row
const ItemRow: React.FC<{
  item: TodoItem;
  index: number;
  onUpdate: (updates: Partial<TodoItem>) => void;
  onDelete: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}> = ({ item, index, onUpdate, onDelete, onKeyDown, autoFocus, onDragStart, onDragOver, onDragEnd, isDragging, isDragOver }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showProps, setShowProps] = useState(false);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const dueDate = item.dueDate ? new Date(item.dueDate) : undefined;
  const isOverdue = dueDate && isPast(dueDate) && !item.checked;
  const isDueToday = dueDate && isToday(dueDate);
  const isDueTomorrow = dueDate && isTomorrow(dueDate);

  return (
    <div 
      className={cn(
        "group flex items-start gap-2 py-1 rounded transition-colors hover:bg-muted/30",
        item.checked && "opacity-50",
        isDragging && "opacity-50 bg-muted/50",
        isDragOver && "border-t-2 border-primary"
      )}
      style={{ paddingLeft: `${item.indent * 20}px` }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
    >
      {/* Drag handle */}
      <div className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground flex-shrink-0 mt-0.5">
        <GripVertical className="h-3 w-3" />
      </div>

      {/* Checkbox */}
      <button
        onClick={() => onUpdate({ checked: !item.checked })}
        className={cn(
          "flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all mt-0.5",
          item.checked
            ? "bg-primary border-primary text-primary-foreground"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {item.checked && <Check className="h-2.5 w-2.5" />}
      </button>

      {/* Content input */}
      <input
        ref={inputRef}
        type="text"
        value={item.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        onKeyDown={onKeyDown}
        placeholder="Type a task..."
        className={cn(
          "flex-1 min-w-0 bg-transparent border-none outline-none leading-normal",
          item.checked && "line-through text-muted-foreground"
        )}
        style={{ fontSize: '15px' }}
      />

      {/* Badges */}
      {dueDate && (
        <Badge
          variant="outline"
          className={cn(
            "px-1.5 py-0 h-5 flex-shrink-0",
            isOverdue && "border-red-500 text-red-500",
            isDueToday && !isOverdue && "border-orange-500 text-orange-500",
            isDueTomorrow && "border-blue-500 text-blue-500"
          )}
          style={{ fontSize: '13px' }}
        >
          {isOverdue ? 'Overdue' : isDueToday ? 'Today' : isDueTomorrow ? 'Tomorrow' : format(dueDate, 'MMM d')}
        </Badge>
      )}

      {item.priority && item.priority !== 'none' && (
        <span className="flex-shrink-0" style={{ fontSize: '14px' }}>{priorityConfig[item.priority].icon}</span>
      )}

      {/* Actions popover */}
      <Popover open={showProps} onOpenChange={setShowProps}>
        <PopoverTrigger asChild>
          <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded flex-shrink-0 ml-1">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="end" sideOffset={4}>
          {/* Due date */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted">
                <CalendarIcon className="h-4 w-4" />
                {dueDate ? format(dueDate, 'MMM d') : 'Due date'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" side="left">
              <div className="p-2 border-b space-y-1">
                <button 
                  className="w-full text-left text-sm hover:bg-muted px-2 py-1 rounded flex items-center gap-2"
                  onClick={() => onUpdate({ dueDate: startOfDay(new Date()).toISOString() })}
                >
                  <span className="text-orange-500">📅</span> Today
                </button>
                <button 
                  className="w-full text-left text-sm hover:bg-muted px-2 py-1 rounded flex items-center gap-2"
                  onClick={() => onUpdate({ dueDate: startOfDay(addDays(new Date(), 1)).toISOString() })}
                >
                  <span className="text-blue-500">📅</span> Tomorrow
                </button>
                <button 
                  className="w-full text-left text-sm hover:bg-muted px-2 py-1 rounded flex items-center gap-2"
                  onClick={() => onUpdate({ dueDate: startOfDay(addDays(new Date(), 7)).toISOString() })}
                >
                  <span className="text-purple-500">📅</span> Next week
                </button>
                {dueDate && (
                  <button 
                    className="w-full text-left text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
                    onClick={() => onUpdate({ dueDate: undefined })}
                  >
                    ✕ Clear due date
                  </button>
                )}
              </div>
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={(date) => onUpdate({ dueDate: date?.toISOString() })}
              />
            </PopoverContent>
          </Popover>

          {/* Priority */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted">
                <Flag className="h-4 w-4" />
                <span>Priority: {priorityConfig[item.priority || 'none'].label}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left">
              {Object.entries(priorityConfig).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onUpdate({ priority: key as TodoItem['priority'] })}
                >
                  {config.icon} {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="border-t my-1" />

          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
            onClick={() => {
              onDelete();
              setShowProps(false);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Main NodeView Component
export const TodoBlockView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [localItems, setLocalItems] = useState<TodoItem[]>(() => {
    try {
      const parsed = JSON.parse(node.attrs.items || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const initializedRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync from node attrs when they change externally
  useEffect(() => {
    try {
      const parsed = JSON.parse(node.attrs.items || '[]');
      if (Array.isArray(parsed)) {
        setLocalItems(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, [node.attrs.items]);

  // Debounced save to node attributes
  const saveItems = useCallback((newItems: TodoItem[]) => {
    setLocalItems(newItems);
    
    // Debounce the attribute update to avoid flushSync issues
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      updateAttributes({ items: JSON.stringify(newItems) });
    }, 100);
  }, [updateAttributes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Generate ID
  const genId = () => `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Add item
  const addItem = useCallback((afterIdx?: number, indent = 0) => {
    const newItem: TodoItem = {
      id: genId(),
      content: '',
      checked: false,
      indent,
      priority: 'none',
    };

    setLocalItems(prev => {
      const newItems = afterIdx !== undefined 
        ? [...prev.slice(0, afterIdx + 1), newItem, ...prev.slice(afterIdx + 1)]
        : [...prev, newItem];
      
      // Schedule attribute update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        updateAttributes({ items: JSON.stringify(newItems) });
      }, 100);
      
      return newItems;
    });
    
    setFocusIndex(afterIdx !== undefined ? afterIdx + 1 : localItems.length);
  }, [localItems.length, updateAttributes]);

  // Update item
  const updateItem = useCallback((idx: number, updates: Partial<TodoItem>) => {
    setLocalItems(prev => {
      const newItems = [...prev];
      newItems[idx] = { ...newItems[idx], ...updates };
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        updateAttributes({ items: JSON.stringify(newItems) });
      }, 100);
      
      return newItems;
    });
  }, [updateAttributes]);

  // Delete item
  const deleteItem = useCallback((idx: number) => {
    setLocalItems(prev => {
      const newItems = prev.filter((_, i) => i !== idx);
      
      if (newItems.length === 0) {
        setTimeout(() => deleteNode(), 0);
        return prev;
      }
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        updateAttributes({ items: JSON.stringify(newItems) });
      }, 100);
      
      return newItems;
    });
  }, [updateAttributes, deleteNode]);

  // Keyboard handler
  const handleKeyDown = useCallback((idx: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(idx, localItems[idx]?.indent || 0);
    } else if (e.key === 'Backspace' && localItems[idx]?.content === '') {
      e.preventDefault();
      if (localItems.length > 1) {
        deleteItem(idx);
        setFocusIndex(Math.max(0, idx - 1));
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      if (idx > 0 && (localItems[idx]?.indent || 0) < 3) {
        updateItem(idx, { indent: (localItems[idx]?.indent || 0) + 1 });
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      if ((localItems[idx]?.indent || 0) > 0) {
        updateItem(idx, { indent: (localItems[idx]?.indent || 0) - 1 });
      }
    } else if (e.key === 'ArrowUp' && idx > 0) {
      // Move to previous item if at start of input
      const input = e.target as HTMLInputElement;
      if (input.selectionStart === 0 && input.selectionEnd === 0) {
        e.preventDefault();
        setFocusIndex(idx - 1);
      }
    } else if (e.key === 'ArrowDown' && idx < localItems.length - 1) {
      // Move to next item if at end of input
      const input = e.target as HTMLInputElement;
      if (input.selectionStart === input.value.length) {
        e.preventDefault();
        setFocusIndex(idx + 1);
      }
    }
  }, [addItem, deleteItem, updateItem, localItems]);

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index);
    }
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      setLocalItems(prev => {
        const newItems = [...prev];
        const [draggedItem] = newItems.splice(dragIndex, 1);
        newItems.splice(dragOverIndex, 0, draggedItem);
        
        // Schedule attribute update
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(() => {
          updateAttributes({ items: JSON.stringify(newItems) });
        }, 100);
        
        return newItems;
      });
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex, updateAttributes]);

  // Init with one item on mount
  useEffect(() => {
    if (!initializedRef.current && localItems.length === 0) {
      initializedRef.current = true;
      // Use requestAnimationFrame to avoid flushSync during render
      requestAnimationFrame(() => {
        addItem();
      });
    }
  }, []);

  const items = localItems;

  // Progress - only count items with content (non-empty text)
  const filledItems = items.filter(i => i.content.trim() !== '');
  const completed = filledItems.filter(i => i.checked).length;
  const total = filledItems.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <NodeViewWrapper className="todo-block-wrapper my-2">
      <div className="border rounded-lg bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <span className="font-medium flex-1" style={{ fontSize: '15px' }}>To-do List</span>

          {total > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground" style={{ fontSize: '14px' }}>{completed}/{total}</span>
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        {!isCollapsed && (
          <div 
            className="px-2 py-1"
            onDragOver={(e) => e.preventDefault()}
          >
            {items.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                index={idx}
                onUpdate={(updates) => updateItem(idx, updates)}
                onDelete={() => deleteItem(idx)}
                onKeyDown={handleKeyDown(idx)}
                autoFocus={focusIndex === idx}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                isDragging={dragIndex === idx}
                isDragOver={dragOverIndex === idx}
              />
            ))}

            <button
              onClick={() => addItem()}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded"
              style={{ fontSize: '15px' }}
            >
              <Plus className="h-4 w-4" />
              Add task
            </button>
          </div>
        )}

        {/* Collapsed preview - only show filled items */}
        {isCollapsed && filledItems.length > 0 && (
          <div className="px-3 py-2 text-muted-foreground" style={{ fontSize: '15px' }}>
            {filledItems.slice(0, 2).map((item) => (
              <div key={item.id} className="truncate">
                <span className={item.checked ? 'line-through' : ''}>{item.content}</span>
              </div>
            ))}
            {filledItems.length > 2 && <span style={{ fontSize: '13px' }}>+{filledItems.length - 2} more</span>}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

