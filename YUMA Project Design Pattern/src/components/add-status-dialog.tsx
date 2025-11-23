import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";

interface AddStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (status: StatusFormData) => void;
  editStatus?: StatusFormData | null;
}

export interface StatusFormData {
  id?: string;
  name: string;
  key: string;
  color: string;
  wipLimit?: number;
  isDone: boolean;
}

const PRESET_COLORS = [
  "#6B7280", // Gray
  "#3B82F6", // Blue
  "#22C55E", // Green
];

export function AddStatusDialog({
  open,
  onOpenChange,
  onSave,
  editStatus,
}: AddStatusDialogProps) {
  const [formData, setFormData] = useState<StatusFormData>({
    name: "",
    key: "",
    color: "#6B7280",
    wipLimit: undefined,
    isDone: false,
  });

  const [customColor, setCustomColor] = useState("");

  // Reset form when dialog opens/closes or when editStatus changes
  useEffect(() => {
    if (open && editStatus) {
      setFormData(editStatus);
      setCustomColor(editStatus.color);
    } else if (open && !editStatus) {
      setFormData({
        name: "",
        key: "",
        color: "#8B5CF6",
        wipLimit: undefined,
        isDone: false,
      });
      setCustomColor("");
    }
  }, [open, editStatus]);

  // Auto-generate key from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate key if it hasn't been manually edited
      key: prev.key === "" || prev.key === prev.name.toLowerCase().replace(/\s+/g, "-")
        ? name.toLowerCase().replace(/\s+/g, "-")
        : prev.key,
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      return;
    }

    onSave({
      ...formData,
      color: customColor || formData.color,
    });

    // Reset form
    setFormData({
      name: "",
      key: "",
      color: "#8B5CF6",
      wipLimit: undefined,
      isDone: false,
    });
    setCustomColor("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      key: "",
      color: "#8B5CF6",
      wipLimit: undefined,
      isDone: false,
    });
    setCustomColor("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[var(--background)] border-[var(--border)] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[var(--border)]">
          <DialogTitle className="text-lg text-[var(--foreground)]">
            {editStatus ? "Edit Status" : "Add New Status"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--muted-foreground)] mt-1">
            Create a new status for your board.
          </DialogDescription>
        </DialogHeader>

        {/* Form Content */}
        <div className="px-6 py-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="status-name" className="text-sm text-[var(--foreground)]">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="status-name"
              placeholder="e.g. In Progress"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="bg-[var(--muted)]/30 border-[var(--border)]"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="text-sm text-[var(--foreground)]">Color</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg transition-all hover:scale-110 flex-shrink-0 ${
                      (customColor || formData.color) === color
                        ? "ring-2 ring-offset-2 ring-[var(--primary)] ring-offset-[var(--background)]"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, color }));
                      setCustomColor("");
                    }}
                  />
                ))}
              </div>
              <div className="h-6 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={customColor || formData.color}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setFormData((prev) => ({ ...prev, color: e.target.value }));
                  }}
                  className="w-12 h-8 p-1 cursor-pointer flex-shrink-0"
                />
                <Input
                  type="text"
                  value={customColor || formData.color}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setFormData((prev) => ({ ...prev, color: e.target.value }));
                  }}
                  placeholder="#000000"
                  className="bg-[var(--muted)]/30 border-[var(--border)] w-24 h-8"
                />
              </div>
            </div>
          </div>

          {/* WIP Limit */}
          <div className="space-y-2">
            <Label htmlFor="wip-limit" className="text-sm text-[var(--foreground)]">
              WIP Limit (Optional)
            </Label>
            <Input
              id="wip-limit"
              type="number"
              placeholder="e.g. 5"
              value={formData.wipLimit ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  wipLimit: e.target.value ? parseInt(e.target.value) : undefined,
                }))
              }
              className="bg-[var(--muted)]/30 border-[var(--border)]"
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              Maximum number of tasks allowed in this status
            </p>
          </div>

          {/* Done Status */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="done-status"
              checked={formData.isDone}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isDone: checked as boolean,
                }))
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="done-status"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Done Status
              </Label>
              <p className="text-xs text-[var(--muted-foreground)]">
                Mark this as a completion status
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-[var(--border)] flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-[var(--border)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
          >
            {editStatus ? "Update Status" : "Create Status"}
          </Button>
        </DialogFooter>

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
    </Dialog>
  );
}
