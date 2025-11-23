import { useState } from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import {
  Plus,
  Search,
  Zap,
  MoreVertical,
  Copy,
  Pencil,
  Trash2,
  Settings,
} from "lucide-react";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner@2.0.3";

interface Automation {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: string;
  conditions: number;
  actions: number;
  lastExecuted?: Date;
  createdAt: Date;
}

interface AutomationsListProps {
  onCreateNew: () => void;
  onEdit: (automation: Automation) => void;
}

export function AutomationsList({ onCreateNew, onEdit }: AutomationsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);

  // Mock data
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: "1",
      name: "High Priority Alert",
      description: "When task is set to high priority, notify team leads via Slack",
      isActive: true,
      trigger: "Task Updated",
      conditions: 2,
      actions: 2,
      lastExecuted: new Date(Date.now() - 1000 * 60 * 30),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
    {
      id: "2",
      name: "Auto-assign by Label",
      description: "When task has 'frontend' label, assign to frontend team",
      isActive: true,
      trigger: "Task Created",
      conditions: 1,
      actions: 1,
      lastExecuted: new Date(Date.now() - 1000 * 60 * 60 * 2),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      id: "3",
      name: "Overdue Task Reminder",
      description: "When task is 2 days overdue, send email reminder to assignee",
      isActive: false,
      trigger: "After Due Date",
      conditions: 1,
      actions: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      id: "4",
      name: "Sprint Start Actions",
      description: "When sprint starts, notify team and update task statuses",
      isActive: true,
      trigger: "Sprint Started",
      conditions: 0,
      actions: 3,
      lastExecuted: new Date(Date.now() - 1000 * 60 * 60 * 24),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    },
    {
      id: "5",
      name: "AI Task Categorization",
      description: "When task is created without template, AI categorizes and assigns template",
      isActive: true,
      trigger: "Task Created",
      conditions: 1,
      actions: 2,
      lastExecuted: new Date(Date.now() - 1000 * 60 * 10),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
  ]);

  const filteredAutomations = automations.filter(
    (automation) =>
      automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      automation.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (id: string) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === id ? { ...auto, isActive: !auto.isActive } : auto
      )
    );
    const automation = automations.find((a) => a.id === id);
    toast.success(
      `Automation ${automation?.isActive ? "deactivated" : "activated"}`
    );
  };

  const handleDuplicate = (automation: Automation) => {
    const newAutomation = {
      ...automation,
      id: String(Date.now()),
      name: `${automation.name} (Copy)`,
      isActive: false,
      createdAt: new Date(),
    };
    setAutomations((prev) => [newAutomation, ...prev]);
    toast.success("Automation duplicated");
  };

  const handleDelete = () => {
    if (selectedAutomation) {
      setAutomations((prev) => prev.filter((a) => a.id !== selectedAutomation.id));
      toast.success("Automation deleted");
      setDeleteDialogOpen(false);
      setSelectedAutomation(null);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)]">
      {/* Search Bar */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
          />
        </div>
      </div>

      {/* Automations List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
          {filteredAutomations.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
              <h3 className="text-[var(--foreground)] mb-2">No automations found</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first automation to get started"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={onCreateNew}
                  className="bg-[#5B5FED] hover:bg-[#4B4FDD] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Automation
                </Button>
              )}
            </div>
          ) : (
            filteredAutomations.map((automation) => (
              <div
                key={automation.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--muted-foreground)]/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Status Indicator */}
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        automation.isActive
                          ? "bg-green-500 shadow-lg shadow-green-500/50"
                          : "bg-gray-500"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[var(--foreground)] mb-1">
                          {automation.name}
                        </h3>
                        <p className="text-sm text-[var(--muted-foreground)] mb-3">
                          {automation.description}
                        </p>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>{automation.trigger}</span>
                          </div>
                          {automation.conditions > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Settings className="w-3 h-3" />
                              <span>
                                {automation.conditions}{" "}
                                {automation.conditions === 1
                                  ? "condition"
                                  : "conditions"}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3" />
                            <span>
                              {automation.actions}{" "}
                              {automation.actions === 1 ? "action" : "actions"}
                            </span>
                          </div>
                          {automation.lastExecuted && (
                            <div className="flex items-center gap-1.5 text-green-500">
                              <span>Last run: {formatTimeAgo(automation.lastExecuted)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch
                          checked={automation.isActive}
                          onCheckedChange={() => handleToggle(automation.id)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[var(--card)] border-[var(--border)]"
                          >
                            <DropdownMenuItem
                              onClick={() => onEdit(automation)}
                              className="text-[var(--foreground)] cursor-pointer"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(automation)}
                              className="text-[var(--foreground)] cursor-pointer"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAutomation(automation);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[var(--card)] border-[var(--border)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--foreground)]">
              Delete Automation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--muted-foreground)]">
              Are you sure you want to delete "{selectedAutomation?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}