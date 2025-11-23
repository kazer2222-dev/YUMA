'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GridCell {
  id: string;
  row: number;
  col: number;
  content?: React.ReactNode;
  data?: any;
}

interface DynamicFormGridProps {
  columns: number;
  rows: number;
  onColumnsChange: (columns: number) => void;
  onRowsChange: (rows: number) => void;
  cells: GridCell[];
  onCellsChange: (cells: GridCell[]) => void;
  renderCell: (cell: GridCell, row: number, col: number) => React.ReactNode;
  minColumns?: number;
  maxColumns?: number;
  minRows?: number;
  maxRows?: number;
  className?: string;
}

export function DynamicFormGrid({
  columns,
  rows,
  onColumnsChange,
  onRowsChange,
  cells,
  onCellsChange,
  renderCell,
  minColumns = 1,
  maxColumns = 10,
  minRows = 1,
  maxRows = 10,
  className
}: DynamicFormGridProps) {
  const [localColumns, setLocalColumns] = useState(columns);
  const [localRows, setLocalRows] = useState(rows);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ type: 'columns' | 'rows'; newValue: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Sync local state with props
  useEffect(() => {
    setLocalColumns(columns);
    setLocalRows(rows);
  }, [columns, rows]);

  // Check if cells in columns/rows being removed have data
  const hasDataInColumns = useCallback((colsToRemove: number[]) => {
    return cells.some(cell => 
      colsToRemove.includes(cell.col) && 
      (cell.data !== undefined && cell.data !== null && cell.data !== '')
    );
  }, [cells]);

  const hasDataInRows = useCallback((rowsToRemove: number[]) => {
    return cells.some(cell => 
      rowsToRemove.includes(cell.row) && 
      (cell.data !== undefined && cell.data !== null && cell.data !== '')
    );
  }, [cells]);

  const updateColumns = useCallback((newColumns: number) => {
    if (newColumns < minColumns || newColumns > maxColumns) return;
    
    if (newColumns < localColumns) {
      // Removing columns - check for data
      const colsToRemove: number[] = [];
      for (let i = newColumns; i < localColumns; i++) {
        colsToRemove.push(i);
      }
      
      if (hasDataInColumns(colsToRemove)) {
        setPendingChange({ type: 'columns', newValue: newColumns });
        setShowWarning(true);
        return;
      }
    }

    // Safe to update immediately
    setLocalColumns(newColumns);
    onColumnsChange(newColumns);
    
    // Remove cells from deleted columns
    if (newColumns < localColumns) {
      const filteredCells = cells.filter(cell => cell.col < newColumns);
      onCellsChange(filteredCells);
    } else {
      // Add new empty cells for new columns
      const newCells: GridCell[] = [];
      for (let row = 0; row < localRows; row++) {
        for (let col = localColumns; col < newColumns; col++) {
          newCells.push({
            id: `cell-${row}-${col}`,
            row,
            col,
            data: null
          });
        }
      }
      onCellsChange([...cells, ...newCells]);
    }
  }, [localColumns, localRows, minColumns, maxColumns, cells, hasDataInColumns, onColumnsChange, onCellsChange]);

  const updateRows = useCallback((newRows: number) => {
    if (newRows < minRows || newRows > maxRows) return;
    
    if (newRows < localRows) {
      // Removing rows - check for data
      const rowsToRemove: number[] = [];
      for (let i = newRows; i < localRows; i++) {
        rowsToRemove.push(i);
      }
      
      if (hasDataInRows(rowsToRemove)) {
        setPendingChange({ type: 'rows', newValue: newRows });
        setShowWarning(true);
        return;
      }
    }

    // Safe to update immediately
    setLocalRows(newRows);
    onRowsChange(newRows);
    
    // Remove cells from deleted rows
    if (newRows < localRows) {
      const filteredCells = cells.filter(cell => cell.row < newRows);
      onCellsChange(filteredCells);
    } else {
      // Add new empty cells for new rows
      const newCells: GridCell[] = [];
      for (let row = localRows; row < newRows; row++) {
        for (let col = 0; col < localColumns; col++) {
          newCells.push({
            id: `cell-${row}-${col}`,
            row,
            col,
            data: null
          });
        }
      }
      onCellsChange([...cells, ...newCells]);
    }
  }, [localColumns, localRows, minRows, maxRows, cells, hasDataInRows, onRowsChange, onCellsChange]);

  const handleColumnsInputChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      updateColumns(num);
    }
  };

  const handleRowsInputChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      updateRows(num);
    }
  };

  const handleIncrementColumns = () => updateColumns(localColumns + 1);
  const handleDecrementColumns = () => updateColumns(localColumns - 1);
  const handleIncrementRows = () => updateRows(localRows + 1);
  const handleDecrementRows = () => updateRows(localRows - 1);

  const handleWarningConfirm = () => {
    if (!pendingChange) return;
    
    if (pendingChange.type === 'columns') {
      const colsToRemove: number[] = [];
      for (let i = pendingChange.newValue; i < localColumns; i++) {
        colsToRemove.push(i);
      }
      const filteredCells = cells.filter(cell => !colsToRemove.includes(cell.col));
      onCellsChange(filteredCells);
      setLocalColumns(pendingChange.newValue);
      onColumnsChange(pendingChange.newValue);
    } else {
      const rowsToRemove: number[] = [];
      for (let i = pendingChange.newValue; i < localRows; i++) {
        rowsToRemove.push(i);
      }
      const filteredCells = cells.filter(cell => !rowsToRemove.includes(cell.row));
      onCellsChange(filteredCells);
      setLocalRows(pendingChange.newValue);
      onRowsChange(pendingChange.newValue);
    }
    
    setShowWarning(false);
    setPendingChange(null);
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
    setPendingChange(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only work when grid or its inputs are focused
      if (!gridRef.current?.contains(document.activeElement)) return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowRight':
            e.preventDefault();
            handleIncrementColumns();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            handleDecrementColumns();
            break;
          case 'ArrowDown':
            e.preventDefault();
            handleIncrementRows();
            break;
          case 'ArrowUp':
            e.preventDefault();
            handleDecrementRows();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localColumns, localRows]);

  // Generate grid cells if missing
  useEffect(() => {
    const allCells: GridCell[] = [];
    for (let row = 0; row < localRows; row++) {
      for (let col = 0; col < localColumns; col++) {
        const existing = cells.find(c => c.row === row && c.col === col);
        if (existing) {
          allCells.push(existing);
        } else {
          allCells.push({
            id: `cell-${row}-${col}`,
            row,
            col,
            data: null
          });
        }
      }
    }
    if (allCells.length !== cells.length || allCells.some((cell, idx) => cell.id !== cells[idx]?.id)) {
      onCellsChange(allCells);
    }
  }, [localColumns, localRows, cells, onCellsChange]);

  const getCellForPosition = (row: number, col: number): GridCell => {
    return cells.find(c => c.row === row && c.col === col) || {
      id: `cell-${row}-${col}`,
      row,
      col,
      data: null
    };
  };

  return (
    <div ref={gridRef} className={cn("space-y-4", className)}>
      {/* Grid Controls */}
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border border-border">
        <Label className="text-sm font-medium text-foreground">Layout Grid:</Label>
        
        {/* Columns Control */}
        <div className="flex items-center gap-2">
          <Label htmlFor="columns-input" className="text-xs text-muted-foreground whitespace-nowrap">
            Columns (X):
          </Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleDecrementColumns}
              disabled={localColumns <= minColumns}
              title="Decrease columns (Ctrl + ←)"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Input
              id="columns-input"
              type="number"
              min={minColumns}
              max={maxColumns}
              value={localColumns}
              onChange={(e) => handleColumnsInputChange(e.target.value)}
              className="w-16 h-7 text-center text-sm"
              title="Column count (1-10)"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleIncrementColumns}
              disabled={localColumns >= maxColumns}
              title="Increase columns (Ctrl + →)"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Rows Control */}
        <div className="flex items-center gap-2">
          <Label htmlFor="rows-input" className="text-xs text-muted-foreground whitespace-nowrap">
            Rows (Y):
          </Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleDecrementRows}
              disabled={localRows <= minRows}
              title="Decrease rows (Ctrl + ↑)"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Input
              id="rows-input"
              type="number"
              min={minRows}
              max={maxRows}
              value={localRows}
              onChange={(e) => handleRowsInputChange(e.target.value)}
              className="w-16 h-7 text-center text-sm"
              title="Row count (1-10)"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleIncrementRows}
              disabled={localRows >= maxRows}
              title="Increase rows (Ctrl + ↓)"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground ml-auto">
          <span className="hidden sm:inline">Use Ctrl+Arrow keys for shortcuts</span>
        </div>
      </div>

      {/* Dynamic Grid */}
      <div
        className="grid gap-4 transition-all duration-200 ease-out"
        style={{
          gridTemplateColumns: `repeat(${localColumns}, 1fr)`,
          gridTemplateRows: `repeat(${localRows}, auto)`
        }}
      >
        {Array.from({ length: localRows * localColumns }).map((_, index) => {
          const row = Math.floor(index / localColumns);
          const col = index % localColumns;
          const cell = getCellForPosition(row, col);
          
          return (
            <div
              key={cell.id}
              className="min-h-[80px] border border-border rounded-md p-3 bg-background transition-all duration-200 ease-out"
            >
              {renderCell(cell, row, col)}
            </div>
          );
        })}
      </div>

      {/* Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Layout Change</DialogTitle>
            <DialogDescription>
              {pendingChange?.type === 'columns' 
                ? `You are about to remove ${localColumns - (pendingChange?.newValue || 0)} column(s) that contain data. This will permanently delete the data in those columns. Do you want to continue?`
                : `You are about to remove ${localRows - (pendingChange?.newValue || 0)} row(s) that contain data. This will permanently delete the data in those rows. Do you want to continue?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleWarningCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleWarningConfirm}
            >
              Continue & Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

