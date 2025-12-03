'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  Download,
  Upload,
  MoreHorizontal,
  Copy,
  Scissors,
  Clipboard,
  X,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';

// Types
interface CellData {
  value: string;
  formula?: string;
  style?: CellStyle;
}

interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  textColor?: string;
}

interface Sheet {
  id: string;
  name: string;
  data: Record<string, CellData>;
  columnWidths?: Record<number, number>;
  rowHeights?: Record<number, number>;
}

interface SpreadsheetData {
  sheets: Sheet[];
  activeSheetId?: string;
}

interface SpreadsheetEditorProps {
  documentId?: string;
  spaceSlug: string;
  initialData?: SpreadsheetData;
  title?: string;
  onTitleChange?: (title: string) => void;
  onSave?: (data: SpreadsheetData) => Promise<void>;
}

// Constants
const DEFAULT_COLS = 26; // A-Z
const DEFAULT_ROWS = 100;
const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 28;
const MIN_COL_WIDTH = 50;
const MIN_ROW_HEIGHT = 24;

// Utility functions
const getColumnLabel = (index: number): string => {
  let label = '';
  while (index >= 0) {
    label = String.fromCharCode(65 + (index % 26)) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
};

const getCellId = (row: number, col: number): string => {
  return `${getColumnLabel(col)}${row + 1}`;
};

const parseCellId = (cellId: string): { row: number; col: number } | null => {
  const match = cellId.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  let col = 0;
  for (let i = 0; i < match[1].length; i++) {
    col = col * 26 + (match[1].charCodeAt(i) - 64);
  }
  col -= 1;
  
  const row = parseInt(match[2], 10) - 1;
  return { row, col };
};

export function SpreadsheetEditor({
  documentId,
  spaceSlug,
  initialData,
  title = 'Untitled Spreadsheet',
  onTitleChange,
  onSave,
}: SpreadsheetEditorProps) {
  const { success: showSuccess, error: showError } = useToastHelpers();
  
  // State
  const [sheets, setSheets] = useState<Sheet[]>(
    initialData?.sheets || [{ id: 'sheet-1', name: 'Sheet 1', data: {} }]
  );
  const [activeSheetId, setActiveSheetId] = useState(
    initialData?.activeSheetId || sheets[0]?.id || 'sheet-1'
  );
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selection, setSelection] = useState<{ start: string; end: string } | null>(null);
  const [clipboard, setClipboard] = useState<Record<string, CellData> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [docTitle, setDocTitle] = useState(title);
  
  // Refs
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellInputRef = useRef<HTMLInputElement>(null);

  // Get active sheet
  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];

  // Cell operations
  const getCellData = useCallback((cellId: string): CellData | undefined => {
    return activeSheet?.data[cellId];
  }, [activeSheet]);

  const setCellData = useCallback((cellId: string, data: Partial<CellData>) => {
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      return {
        ...sheet,
        data: {
          ...sheet.data,
          [cellId]: { ...sheet.data[cellId], ...data },
        },
      };
    }));
    setHasChanges(true);
  }, [activeSheetId]);

  const deleteCellData = useCallback((cellId: string) => {
    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;
      const newData = { ...sheet.data };
      delete newData[cellId];
      return { ...sheet, data: newData };
    }));
    setHasChanges(true);
  }, [activeSheetId]);

  // Sheet operations
  const addSheet = () => {
    const newSheet: Sheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet ${sheets.length + 1}`,
      data: {},
    };
    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
    setHasChanges(true);
  };

  const deleteSheet = (sheetId: string) => {
    if (sheets.length <= 1) {
      showError('Error', 'Cannot delete the last sheet');
      return;
    }
    
    setSheets(prev => prev.filter(s => s.id !== sheetId));
    if (activeSheetId === sheetId) {
      setActiveSheetId(sheets[0]?.id || '');
    }
    setHasChanges(true);
  };

  const renameSheet = (sheetId: string, newName: string) => {
    setSheets(prev => prev.map(s => 
      s.id === sheetId ? { ...s, name: newName } : s
    ));
    setHasChanges(true);
  };

  // Selection handling
  const handleCellClick = (cellId: string, e: React.MouseEvent) => {
    if (e.shiftKey && selectedCell) {
      setSelection({ start: selectedCell, end: cellId });
    } else {
      setSelectedCell(cellId);
      setSelection(null);
    }
  };

  const handleCellDoubleClick = (cellId: string) => {
    setEditingCell(cellId);
    setEditValue(getCellData(cellId)?.value || '');
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;

    const parsed = parseCellId(selectedCell);
    if (!parsed) return;

    let newRow = parsed.row;
    let newCol = parsed.col;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, newRow - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(DEFAULT_ROWS - 1, newRow + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(0, newCol - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newCol = Math.min(DEFAULT_COLS - 1, newCol + 1);
        break;
      case 'Tab':
        e.preventDefault();
        newCol = e.shiftKey 
          ? Math.max(0, newCol - 1)
          : Math.min(DEFAULT_COLS - 1, newCol + 1);
        break;
      case 'Enter':
        if (!editingCell) {
          e.preventDefault();
          handleCellDoubleClick(selectedCell);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (!editingCell) {
          e.preventDefault();
          deleteCellData(selectedCell);
        }
        break;
      case 'Escape':
        if (editingCell) {
          setEditingCell(null);
          setEditValue('');
        }
        break;
      default:
        // Start editing if typing
        if (!editingCell && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          handleCellDoubleClick(selectedCell);
          setEditValue(e.key);
        }
        return;
    }

    const newCellId = getCellId(newRow, newCol);
    setSelectedCell(newCellId);
  };

  const handleEditSubmit = () => {
    if (editingCell) {
      if (editValue.trim()) {
        setCellData(editingCell, { value: editValue });
      } else {
        deleteCellData(editingCell);
      }
      setEditingCell(null);
      setEditValue('');
      
      // Move to next cell
      const parsed = parseCellId(editingCell);
      if (parsed) {
        const newCellId = getCellId(Math.min(DEFAULT_ROWS - 1, parsed.row + 1), parsed.col);
        setSelectedCell(newCellId);
      }
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleEditSubmit();
      
      const parsed = parseCellId(editingCell!);
      if (parsed) {
        const newCol = e.shiftKey 
          ? Math.max(0, parsed.col - 1)
          : Math.min(DEFAULT_COLS - 1, parsed.col + 1);
        const newCellId = getCellId(parsed.row, newCol);
        setSelectedCell(newCellId);
        handleCellDoubleClick(newCellId);
      }
    }
  };

  // Copy/Paste
  const handleCopy = () => {
    if (!selectedCell) return;
    const data = getCellData(selectedCell);
    if (data) {
      setClipboard({ [selectedCell]: data });
      navigator.clipboard?.writeText(data.value || '');
    }
  };

  const handlePaste = async () => {
    if (!selectedCell) return;
    
    try {
      const text = await navigator.clipboard?.readText();
      if (text) {
        setCellData(selectedCell, { value: text });
      }
    } catch {
      // Fallback to internal clipboard
      if (clipboard) {
        const firstKey = Object.keys(clipboard)[0];
        if (firstKey && clipboard[firstKey]) {
          setCellData(selectedCell, { ...clipboard[firstKey] });
        }
      }
    }
  };

  // Save
  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave({ sheets, activeSheetId });
      setHasChanges(false);
      showSuccess('Saved', 'Spreadsheet saved successfully');
    } catch (error) {
      showError('Error', 'Failed to save spreadsheet');
    } finally {
      setIsSaving(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!activeSheet) return;
    
    let maxRow = 0;
    let maxCol = 0;
    
    Object.keys(activeSheet.data).forEach(cellId => {
      const parsed = parseCellId(cellId);
      if (parsed) {
        maxRow = Math.max(maxRow, parsed.row);
        maxCol = Math.max(maxCol, parsed.col);
      }
    });
    
    const rows: string[][] = [];
    for (let r = 0; r <= maxRow; r++) {
      const row: string[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cellId = getCellId(r, c);
        const value = activeSheet.data[cellId]?.value || '';
        row.push(value.includes(',') ? `"${value}"` : value);
      }
      rows.push(row);
    }
    
    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle || 'spreadsheet'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Focus input when editing
  useEffect(() => {
    if (editingCell && cellInputRef.current) {
      cellInputRef.current.focus();
      cellInputRef.current.select();
    }
  }, [editingCell]);

  // Auto-save
  useEffect(() => {
    if (hasChanges && onSave) {
      const timeout = setTimeout(() => {
        handleSave();
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [hasChanges]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <Input
              value={docTitle}
              onChange={(e) => {
                setDocTitle(e.target.value);
                onTitleChange?.(e.target.value);
                setHasChanges(true);
              }}
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent w-[200px]"
              placeholder="Untitled Spreadsheet"
            />
          </div>
          {hasChanges && !isSaving && (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background">
        <div className="w-16 text-center font-mono text-sm text-muted-foreground border-r pr-2">
          {selectedCell || '-'}
        </div>
        <Input
          ref={inputRef}
          value={editingCell ? editValue : (selectedCell ? getCellData(selectedCell)?.value || '' : '')}
          onChange={(e) => {
            if (editingCell) {
              setEditValue(e.target.value);
            } else if (selectedCell) {
              handleCellDoubleClick(selectedCell);
              setEditValue(e.target.value);
            }
          }}
          onKeyDown={handleEditKeyDown}
          className="flex-1 font-mono text-sm"
          placeholder="Enter value or formula..."
        />
      </div>

      {/* Grid */}
      <div 
        ref={gridRef}
        className="flex-1 overflow-auto"
        tabIndex={0}
        onKeyDown={handleCellKeyDown}
      >
        <div className="inline-block min-w-full">
          {/* Header row */}
          <div className="flex sticky top-0 z-10 bg-muted border-b">
            <div className="w-12 h-7 border-r bg-muted flex items-center justify-center sticky left-0 z-20">
              {/* Corner cell */}
            </div>
            {Array.from({ length: DEFAULT_COLS }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-7 border-r bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground"
                style={{ width: activeSheet?.columnWidths?.[colIndex] || DEFAULT_COL_WIDTH }}
              >
                {getColumnLabel(colIndex)}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {Array.from({ length: DEFAULT_ROWS }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex">
              {/* Row header */}
              <div 
                className="w-12 border-r border-b bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground sticky left-0 z-10"
                style={{ height: activeSheet?.rowHeights?.[rowIndex] || DEFAULT_ROW_HEIGHT }}
              >
                {rowIndex + 1}
              </div>
              
              {/* Cells */}
              {Array.from({ length: DEFAULT_COLS }).map((_, colIndex) => {
                const cellId = getCellId(rowIndex, colIndex);
                const cellData = getCellData(cellId);
                const isSelected = selectedCell === cellId;
                const isEditing = editingCell === cellId;
                
                return (
                  <ContextMenu key={cellId}>
                    <ContextMenuTrigger asChild>
                      <div
                        className={cn(
                          "border-r border-b relative cursor-cell",
                          isSelected && "ring-2 ring-blue-500 ring-inset z-10",
                          isEditing && "ring-2 ring-green-500 ring-inset z-10"
                        )}
                        style={{
                          width: activeSheet?.columnWidths?.[colIndex] || DEFAULT_COL_WIDTH,
                          height: activeSheet?.rowHeights?.[rowIndex] || DEFAULT_ROW_HEIGHT,
                          backgroundColor: cellData?.style?.backgroundColor,
                        }}
                        onClick={(e) => handleCellClick(cellId, e)}
                        onDoubleClick={() => handleCellDoubleClick(cellId)}
                      >
                        {isEditing ? (
                          <input
                            ref={cellInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            onBlur={handleEditSubmit}
                            className="absolute inset-0 w-full h-full px-1 text-sm outline-none border-none"
                            style={{
                              fontWeight: cellData?.style?.bold ? 'bold' : 'normal',
                              fontStyle: cellData?.style?.italic ? 'italic' : 'normal',
                              textAlign: cellData?.style?.align || 'left',
                              color: cellData?.style?.textColor,
                            }}
                          />
                        ) : (
                          <div
                            className="absolute inset-0 px-1 text-sm truncate flex items-center"
                            style={{
                              fontWeight: cellData?.style?.bold ? 'bold' : 'normal',
                              fontStyle: cellData?.style?.italic ? 'italic' : 'normal',
                              textAlign: cellData?.style?.align || 'left',
                              justifyContent: cellData?.style?.align === 'center' ? 'center' : cellData?.style?.align === 'right' ? 'flex-end' : 'flex-start',
                              color: cellData?.style?.textColor,
                            }}
                          >
                            {cellData?.value || ''}
                          </div>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </ContextMenuItem>
                      <ContextMenuItem onClick={handlePaste}>
                        <Clipboard className="w-4 h-4 mr-2" />
                        Paste
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => deleteCellData(cellId)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Cell
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-1 px-2 py-1 border-t bg-muted/50 overflow-x-auto">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            className={cn(
              "group flex items-center gap-1 px-3 py-1.5 rounded-t-md cursor-pointer text-sm transition-colors",
              sheet.id === activeSheetId
                ? "bg-background border-t border-x"
                : "hover:bg-muted"
            )}
            onClick={() => setActiveSheetId(sheet.id)}
          >
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => renameSheet(sheet.id, e.currentTarget.textContent || 'Sheet')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className="outline-none min-w-[40px]"
            >
              {sheet.name}
            </span>
            {sheets.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSheet(sheet.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={addSheet}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

