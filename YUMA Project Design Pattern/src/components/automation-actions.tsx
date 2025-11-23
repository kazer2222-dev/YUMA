import { useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Edit3,
  User,
  Bell,
  Mail,
  MessageSquare,
  Webhook,
  Sparkles,
  GitBranch,
  PlayCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface Action {
  id: string;
  type: string;
  config: any;
}

interface AutomationActionsProps {
  actions: Action[];
  onActionsChange: (actions: Action[]) => void;
}

const ACTION_CATEGORIES = {
  task: {
    label: "Task Actions",
    icon: Edit3,
    actions: [
      { type: "update_field", label: "Update Field Value", icon: Edit3 },
      { type: "assign_user", label: "Assign User", icon: User },
      { type: "unassign_user", label: "Unassign User", icon: User },
      { type: "add_comment", label: "Add Comment", icon: MessageSquare },
      { type: "add_checklist_item", label: "Add Checklist Item", icon: Edit3 },
      { type: "move_template", label: "Move to Template", icon: GitBranch },
      { type: "duplicate_task", label: "Duplicate Task", icon: Edit3 },
      { type: "delete_task", label: "Delete Task", icon: Trash2 },
    ],
  },
  notification: {
    label: "Notification Actions",
    icon: Bell,
    actions: [
      { type: "send_notification", label: "Send In-App Notification", icon: Bell },
      { type: "send_email", label: "Send Email", icon: Mail },
      { type: "send_slack", label: "Send Slack Message", icon: MessageSquare },
      { type: "send_webhook", label: "Send Webhook", icon: Webhook },
    ],
  },
  ai: {
    label: "AI Actions",
    icon: Sparkles,
    actions: [
      { type: "ai_generate_summary", label: "Auto-Generate Summary", icon: Sparkles },
      { type: "ai_improve_description", label: "Improve Description", icon: Sparkles },
      { type: "ai_categorize", label: "Categorize into Template", icon: Sparkles },
      { type: "ai_predict_transition", label: "Predict Next Transition", icon: Sparkles },
      { type: "ai_auto_assign", label: "Auto-Assign by Workload", icon: Sparkles },
      { type: "ai_reminder", label: "AI-Generated Reminder", icon: Sparkles },
    ],
  },
  workflow: {
    label: "Workflow/Sprint Actions",
    icon: GitBranch,
    actions: [
      { type: "transition_status", label: "Transition Task Status", icon: GitBranch },
      { type: "add_to_sprint", label: "Add Task to Sprint", icon: PlayCircle },
      { type: "remove_from_sprint", label: "Remove from Sprint", icon: PlayCircle },
      { type: "start_sprint", label: "Start Sprint", icon: PlayCircle },
      { type: "complete_sprint", label: "Complete Sprint", icon: PlayCircle },
    ],
  },
};

const TASK_FIELDS = [
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "labels", label: "Labels" },
  { value: "due_date", label: "Due Date" },
  { value: "time_estimate", label: "Time Estimate" },
  { value: "custom_field", label: "Custom Field" },
];

export function AutomationActions({
  actions,
  onActionsChange,
}: AutomationActionsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("task");
  const [editingAction, setEditingAction] = useState<string | null>(null);

  const addAction = (actionType: any) => {
    const newAction: Action = {
      id: `action-${Date.now()}`,
      type: actionType.type,
      config: {},
    };
    onActionsChange([...actions, newAction]);
    setEditingAction(newAction.id);
  };

  const removeAction = (actionId: string) => {
    onActionsChange(actions.filter((a) => a.id !== actionId));
  };

  const updateActionConfig = (actionId: string, field: string, value: any) => {
    onActionsChange(
      actions.map((action) =>
        action.id === actionId
          ? { ...action, config: { ...action.config, [field]: value } }
          : action
      )
    );
  };

  const moveAction = (actionId: string, direction: "up" | "down") => {
    const index = actions.findIndex((a) => a.id === actionId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === actions.length - 1)
    ) {
      return;
    }

    const newActions = [...actions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newActions[index], newActions[targetIndex]] = [
      newActions[targetIndex],
      newActions[index],
    ];
    onActionsChange(newActions);
  };

  const getActionLabel = (actionType: string) => {
    for (const category of Object.values(ACTION_CATEGORIES)) {
      const action = category.actions.find((a) => a.type === actionType);
      if (action) return action.label;
    }
    return actionType;
  };

  const renderActionConfig = (action: Action) => {
    const isEditing = editingAction === action.id;
    if (!isEditing) return null;

    switch (action.type) {
      case "update_field":
        return (
          <div className="space-y-3 mt-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Field to Update
              </Label>
              <Select
                value={action.config.field || ""}
                onValueChange={(value) =>
                  updateActionConfig(action.id, "field", value)
                }
              >
                <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  {TASK_FIELDS.map((field) => (
                    <SelectItem
                      key={field.value}
                      value={field.value}
                      className="text-[var(--foreground)]"
                    >
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                New Value
              </Label>
              <Input
                value={action.config.value || ""}
                onChange={(e) =>
                  updateActionConfig(action.id, "value", e.target.value)
                }
                placeholder="Enter new value"
                className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]"
              />
            </div>
          </div>
        );

      case "assign_user":
        return (
          <div className="space-y-3 mt-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Assign To
              </Label>
              <Select
                value={action.config.userId || ""}
                onValueChange={(value) =>
                  updateActionConfig(action.id, "userId", value)
                }
              >
                <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  <SelectItem value="auto" className="text-[var(--foreground)]">
                    Auto-assign (Round Robin)
                  </SelectItem>
                  <SelectItem value="creator" className="text-[var(--foreground)]">
                    Task Creator
                  </SelectItem>
                  <SelectItem value="user1" className="text-[var(--foreground)]">
                    John Doe
                  </SelectItem>
                  <SelectItem value="user2" className="text-[var(--foreground)]">
                    Jane Smith
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "add_comment":
        return (
          <div className="space-y-3 mt-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Comment Text
              </Label>
              <Textarea
                value={action.config.comment || ""}
                onChange={(e) =>
                  updateActionConfig(action.id, "comment", e.target.value)
                }
                placeholder="Enter comment text..."
                className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] min-h-[80px]"
              />
            </div>
          </div>
        );

      case "add_checklist_item":
        return (
          <div className="space-y-3 mt-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Checklist Item
              </Label>
              <Input
                value={action.config.item || ""}
                onChange={(e) =>
                  updateActionConfig(action.id, "item", e.target.value)
                }
                placeholder="Enter checklist item"
                className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]"
              />
            </div>
          </div>
        );

      case "move_template":
        return (
          <div className="space-y-3 mt-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Target Template
              </Label>
              <Select
                value={action.config.template || ""}
                onValueChange={(value) =>
                  updateActionConfig(action.id, "template", value)
                }
              >
                <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  <SelectItem value="bug" className="text-[var(--foreground)]">
                    🐛 Bug
                  </SelectItem>
                  <SelectItem value="feature" className="text-[var(--foreground)]">
                    ✨ Feature
                  </SelectItem>
                  <SelectItem value="story" className="text-[var(--foreground)]">
                    📖 User Story
                  </SelectItem>
                  <SelectItem value="epic" className="text-[var(--foreground)]">
                    🎯 Epic
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "send_notification":
      case "send_email":
        return (
          <div className="space-y-3 mt-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Recipients
              </Label>
              <Select
                value={action.config.recipients || ""}
                onValueChange={(value) =>
                  updateActionConfig(action.id, "recipients", value)
                }
              >
                <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                  <SelectValue placeholder="Select recipients" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  <SelectItem value="assignee" className="text-[var(--foreground)]">
                    Task Assignee
                  </SelectItem>
                  <SelectItem value="creator" className="text-[var(--foreground)]">
                    Task Creator
                  </SelectItem>
                  <SelectItem value="team_leads" className="text-[var(--foreground)]">
                    Team Leads
                  </SelectItem>
                  <SelectItem value="all" className="text-[var(--foreground)]">
                    All Team Members
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Message
              </Label>
              <Textarea
                value={action.config.message || ""}
                onChange={(e) =>
                  updateActionConfig(action.id, "message", e.target.value)
                }
                placeholder="Enter message..."
                className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] min-h-[80px]"
              />
            </div>
          </div>
        );

      case "send_slack":
        return (
          <div className="space-y-3 mt-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Slack Channel
              </Label>
              <Input
                value={action.config.channel || ""}
                onChange={(e) =>
                  updateActionConfig(action.id, "channel", e.target.value)
                }
                placeholder="#general"
                className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]"
              />
            </div>
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Message
              </Label>
              <Textarea
                value={action.config.message || ""}
                onChange={(e) =>
                  updateActionConfig(action.id, "message", e.target.value)
                }
                placeholder="Enter message..."
                className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] min-h-[80px]"
              />
            </div>
          </div>
        );

      case "send_webhook":
        return (
          <div className="space-y-3 mt-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Webhook URL
              </Label>
              <Input
                value={action.config.url || ""}
                onChange={(e) =>
                  updateActionConfig(action.id, "url", e.target.value)
                }
                placeholder="https://..."
                className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]"
              />
            </div>
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Payload (JSON)
              </Label>
              <Textarea
                value={action.config.payload || ""}
                onChange={(e) =>
                  updateActionConfig(action.id, "payload", e.target.value)
                }
                placeholder='{"key": "value"}'
                className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] min-h-[80px] font-mono text-xs"
              />
            </div>
          </div>
        );

      case "transition_status":
        return (
          <div className="space-y-3 mt-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                New Status
              </Label>
              <Select
                value={action.config.status || ""}
                onValueChange={(value) =>
                  updateActionConfig(action.id, "status", value)
                }
              >
                <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  <SelectItem value="to-do" className="text-[var(--foreground)]">
                    To Do
                  </SelectItem>
                  <SelectItem value="in-progress" className="text-[var(--foreground)]">
                    In Progress
                  </SelectItem>
                  <SelectItem value="review" className="text-[var(--foreground)]">
                    Review
                  </SelectItem>
                  <SelectItem value="done" className="text-[var(--foreground)]">
                    Done
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "add_to_sprint":
        return (
          <div className="space-y-3 mt-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div>
              <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                Sprint
              </Label>
              <Select
                value={action.config.sprint || ""}
                onValueChange={(value) =>
                  updateActionConfig(action.id, "sprint", value)
                }
              >
                <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  <SelectItem value="current" className="text-[var(--foreground)]">
                    Current Sprint
                  </SelectItem>
                  <SelectItem value="next" className="text-[var(--foreground)]">
                    Next Sprint
                  </SelectItem>
                  <SelectItem value="sprint1" className="text-[var(--foreground)]">
                    Sprint 1
                  </SelectItem>
                  <SelectItem value="sprint2" className="text-[var(--foreground)]">
                    Sprint 2
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl text-[var(--foreground)] mb-2">Add Actions</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Define what happens when the trigger fires and conditions match
        </p>
      </div>

      {/* Added Actions */}
      {actions.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-sm text-[var(--foreground)] mb-3">
            Actions to Perform ({actions.length})
          </h3>
          {actions.map((action, index) => (
            <div
              key={action.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    onClick={() => moveAction(action.id, "up")}
                    disabled={index === 0}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4 rotate-180" />
                  </button>
                  <GripVertical className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <button
                    onClick={() => moveAction(action.id, "down")}
                    disabled={index === actions.length - 1}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        Step {index + 1}
                      </span>
                      <span className="text-sm text-[var(--foreground)]">
                        {getActionLabel(action.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditingAction(
                            editingAction === action.id ? null : action.id
                          )
                        }
                        className="h-7 px-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        {editingAction === action.id ? "Close" : "Configure"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(action.id)}
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {renderActionConfig(action)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Categories */}
      <div className="space-y-3">
        <h3 className="text-sm text-[var(--foreground)]">Available Actions</h3>
        {Object.entries(ACTION_CATEGORIES).map(([categoryKey, category]) => (
          <div
            key={categoryKey}
            className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden"
          >
            {/* Category Header */}
            <button
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === categoryKey ? null : categoryKey
                )
              }
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--muted)]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <category.icon className="w-5 h-5 text-[var(--muted-foreground)]" />
                <span className="text-[var(--foreground)]">{category.label}</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {category.actions.length} actions
                </span>
              </div>
              {expandedCategory === categoryKey ? (
                <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
              )}
            </button>

            {/* Category Content */}
            {expandedCategory === categoryKey && (
              <div className="border-t border-[var(--border)] p-4 grid grid-cols-2 gap-2">
                {category.actions.map((actionType: any) => (
                  <button
                    key={actionType.type}
                    onClick={() => addAction(actionType)}
                    className="flex items-center gap-2 p-3 rounded-lg border border-[var(--border)] hover:border-[#5B5FED] hover:bg-[#5B5FED]/5 transition-colors text-left"
                  >
                    <actionType.icon className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                    <span className="text-sm text-[var(--foreground)]">
                      {actionType.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
