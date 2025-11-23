import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { 
  GripVertical, 
  Plus, 
  Pencil, 
  Trash2,
  X 
} from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { AddStatusDialog, StatusFormData } from "./add-status-dialog";

interface Column {
  id: string;
  title: string;
  color: string;
  visible: boolean;
  key: string;
  isStart?: boolean;
  isDone?: boolean;
}

interface BoardConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
}

interface DraggableStatusRowProps {
  column: Column;
  index: number;
  moveStatus: (dragIndex: number, hoverIndex: number) => void;
  onToggleVisible: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const DraggableStatusRow = ({
  column,
  index,
  moveStatus,
  onToggleVisible,
  onEdit,
  onDelete,
}: DraggableStatusRowProps) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: "STATUS_ROW",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: "STATUS_ROW",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveStatus(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={(node) => preview(drop(node))}
      className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] transition-all ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${isOver ? "bg-[var(--muted)]/50" : "hover:bg-[var(--muted)]/30"}`}
    >
      {/* Drag Handle */}
      <div
        ref={drag}
        className="cursor-grab active:cursor-grabbing text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Status Indicator */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: column.color }}
      />

      {/* Status Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[var(--foreground)]">{column.title}</span>
          {column.isStart && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Start
            </span>
          )}
          {column.isDone && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              Done
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Visible Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">Visible</span>
          <Switch
            checked={column.visible}
            onCheckedChange={() => onToggleVisible(column.id)}
          />
        </div>

        {/* Edit Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-[var(--muted)]"
          onClick={() => onEdit(column.id)}
        >
          <Pencil className="w-4 h-4 text-[var(--muted-foreground)]" />
        </Button>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-red-500/10"
          onClick={() => onDelete(column.id)}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
};

export function BoardConfigurationDialog({
  open,
  onOpenChange,
  columns: initialColumns,
  onColumnsChange,
}: BoardConfigurationDialogProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [showAddStatusDialog, setShowAddStatusDialog] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusFormData | null>(null);

  // Update columns when initialColumns changes
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const moveStatus = (dragIndex: number, hoverIndex: number) => {
    const newColumns = [...columns];
    const [removed] = newColumns.splice(dragIndex, 1);
    newColumns.splice(hoverIndex, 0, removed);
    setColumns(newColumns);
    onColumnsChange(newColumns);
  };

  const handleToggleVisible = (id: string) => {
    const newColumns = columns.map((col) =>
      col.id === id ? { ...col, visible: !col.visible } : col
    );
    setColumns(newColumns);
    onColumnsChange(newColumns);
  };

  const handleEdit = (id: string) => {
    const column = columns.find((col) => col.id === id);
    if (column) {
      setEditingStatus({
        id: column.id,
        name: column.title,
        key: column.key,
        color: column.color,
        isStart: column.isStart || false,
        isDone: column.isDone || false,
      });
      setShowAddStatusDialog(true);
    }
  };

  const handleDelete = (id: string) => {
    const newColumns = columns.filter((col) => col.id !== id);
    setColumns(newColumns);
    onColumnsChange(newColumns);
  };

  const handleAddStatus = () => {
    setEditingStatus(null);
    setShowAddStatusDialog(true);
  };

  const handleSaveStatus = (statusData: StatusFormData) => {
    if (statusData.id) {
      // Update existing status
      const newColumns = columns.map((col) =>
        col.id === statusData.id
          ? {
              ...col,
              title: statusData.name,
              key: statusData.key,
              color: statusData.color,
              isStart: statusData.isStart,
              isDone: statusData.isDone,
            }
          : col
      );
      setColumns(newColumns);
      onColumnsChange(newColumns);
    } else {
      // Add new status
      const newStatus: Column = {
        id: statusData.key,
        title: statusData.name,
        key: statusData.key,
        color: statusData.color,
        visible: true,
        isStart: statusData.isStart,
        isDone: statusData.isDone,
      };
      const newColumns = [...columns, newStatus];
      setColumns(newColumns);
      onColumnsChange(newColumns);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[var(--background)] border-[var(--border)] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg text-[var(--foreground)]">
                Board Configuration
              </DialogTitle>
              <DialogDescription className="text-sm text-[var(--muted-foreground)] mt-1">
                Manage statuses for your board. Drag and drop to reorder.
              </DialogDescription>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                {columns.length} statuses configured
              </p>
            </div>
            <Button
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white gap-2"
              onClick={handleAddStatus}
            >
              <Plus className="w-4 h-4" />
              Add Status
            </Button>
          </div>
        </DialogHeader>

        {/* Status List */}
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
          <DndProvider backend={HTML5Backend}>
            {columns.map((column, index) => (
              <DraggableStatusRow
                key={column.id}
                column={column}
                index={index}
                moveStatus={moveStatus}
                onToggleVisible={handleToggleVisible}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </DndProvider>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: var(--muted-foreground);
            border-radius: 3px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: var(--foreground);
          }
        `}</style>
      </DialogContent>

      {/* Add Status Dialog */}
      <AddStatusDialog
        open={showAddStatusDialog}
        onOpenChange={setShowAddStatusDialog}
        onSave={handleSaveStatus}
        editStatus={editingStatus}
      />
    </Dialog>
  );
}
