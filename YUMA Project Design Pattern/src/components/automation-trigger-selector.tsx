import { useState } from "react";
import {
  FileText,
  Calendar,
  GitBranch,
  Sparkles,
  Clock,
  AlertTriangle,
  PlayCircle,
  Flag,
  Tags,
  Users,
  CheckSquare,
  MessageSquare,
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
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";

interface TriggerConfig {
  type: string;
  label: string;
  description: string;
  icon: any;
  category: string;
  config?: any;
}

interface AutomationTriggerSelectorProps {
  selectedTrigger: any;
  onSelectTrigger: (trigger: any) => void;
}

const TRIGGER_CATEGORIES = {
  task: {
    label: "Task Events",
    icon: FileText,
    triggers: [
      {
        type: "task_created",
        label: "Task Created",
        description: "Fires whenever a new task is created",
        icon: FileText,
      },
      {
        type: "task_updated",
        label: "Task Updated",
        description: "Fires whenever any field of a task changes",
        icon: FileText,
        requiresConfig: true,
      },
      {
        type: "task_deleted",
        label: "Task Deleted",
        description: "Fires when a task is permanently removed",
        icon: FileText,
      },
    ],
  },
  time: {
    label: "Time-Based Triggers",
    icon: Clock,
    triggers: [
      {
        type: "scheduled_time",
        label: "Scheduled Time",
        description: "Run on a recurring schedule (daily, weekly, monthly)",
        icon: Calendar,
        requiresConfig: true,
      },
      {
        type: "before_due_date",
        label: "Before Due Date",
        description: "Run X hours/days before task due date",
        icon: Clock,
        requiresConfig: true,
      },
      {
        type: "after_due_date",
        label: "After Due Date",
        description: "Run X hours/days after task due date",
        icon: AlertTriangle,
        requiresConfig: true,
      },
      {
        type: "sla_breach",
        label: "SLA Breach",
        description: "Run when SLA is breached or about to be overdue",
        icon: AlertTriangle,
      },
    ],
  },
  workflow: {
    label: "Workflow / Sprint Events",
    icon: GitBranch,
    triggers: [
      {
        type: "workflow_transition",
        label: "Workflow Transition",
        description: "Status moved from one state to another",
        icon: GitBranch,
        requiresConfig: true,
      },
      {
        type: "sprint_started",
        label: "Sprint Started",
        description: "Fires when a sprint begins",
        icon: PlayCircle,
      },
      {
        type: "sprint_completed",
        label: "Sprint Completed",
        description: "Fires when a sprint is marked as complete",
        icon: Flag,
      },
      {
        type: "task_added_to_sprint",
        label: "Task Added to Sprint",
        description: "Fires when a task is added to a sprint",
        icon: PlayCircle,
      },
      {
        type: "task_removed_from_sprint",
        label: "Task Removed from Sprint",
        description: "Fires when a task is removed from a sprint",
        icon: PlayCircle,
      },
    ],
  },
  ai: {
    label: "AI-Based Triggers",
    icon: Sparkles,
    triggers: [
      {
        type: "ai_task_inactivity",
        label: "AI Detects Inactivity",
        description: "AI detects task has been inactive for X days",
        icon: Sparkles,
        requiresConfig: true,
      },
      {
        type: "ai_predicts_overdue",
        label: "AI Predicts Overdue",
        description: "AI predicts task will likely be overdue",
        icon: Sparkles,
      },
      {
        type: "ai_assignee_overload",
        label: "AI Detects Assignee Overload",
        description: "AI detects assignee is over capacity threshold",
        icon: Sparkles,
      },
      {
        type: "ai_missing_fields",
        label: "AI Flags Missing Fields",
        description: "AI detects required fields are missing",
        icon: Sparkles,
      },
    ],
  },
};

const TASK_FIELDS = [
  { value: "title", label: "Title" },
  { value: "description", label: "Description" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "assignee", label: "Assignee" },
  { value: "labels", label: "Labels" },
  { value: "due_date", label: "Due Date" },
  { value: "time_estimate", label: "Time Estimate" },
  { value: "checklist", label: "Checklist Items" },
  { value: "attachments", label: "Attachments" },
  { value: "comments", label: "Comments" },
  { value: "custom_fields", label: "Custom Fields" },
  { value: "template", label: "Template" },
];

export function AutomationTriggerSelector({
  selectedTrigger,
  onSelectTrigger,
}: AutomationTriggerSelectorProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("task");
  const [fieldChangeMode, setFieldChangeMode] = useState<"any" | "specific">("any");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState("daily");
  const [timeOffset, setTimeOffset] = useState("2");
  const [timeUnit, setTimeUnit] = useState("days");
  const [inactivityDays, setInactivityDays] = useState("7");
  const [transitionFrom, setTransitionFrom] = useState("");
  const [transitionTo, setTransitionTo] = useState("");

  const handleTriggerSelect = (trigger: any, category: string) => {
    const config: any = {
      ...trigger,
      category,
    };

    if (trigger.type === "task_updated") {
      config.fieldChangeMode = fieldChangeMode;
      if (fieldChangeMode === "specific") {
        config.selectedFields = selectedFields;
      }
    }

    if (trigger.type === "scheduled_time") {
      config.scheduleType = scheduleType;
    }

    if (trigger.type === "before_due_date" || trigger.type === "after_due_date") {
      config.timeOffset = timeOffset;
      config.timeUnit = timeUnit;
    }

    if (trigger.type === "ai_task_inactivity") {
      config.inactivityDays = inactivityDays;
    }

    if (trigger.type === "workflow_transition") {
      config.transitionFrom = transitionFrom;
      config.transitionTo = transitionTo;
    }

    onSelectTrigger(config);
  };

  const handleFieldToggle = (fieldValue: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldValue)
        ? prev.filter((f) => f !== fieldValue)
        : [...prev, fieldValue]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl text-[var(--foreground)] mb-2">Select a Trigger</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Choose the event that will start this automation
        </p>
      </div>

      <div className="space-y-3">
        {Object.entries(TRIGGER_CATEGORIES).map(([categoryKey, category]) => (
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
                  {category.triggers.length} triggers
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
              <div className="border-t border-[var(--border)] p-4 space-y-2">
                {category.triggers.map((trigger: any) => (
                  <div key={trigger.type}>
                    <button
                      onClick={() => handleTriggerSelect(trigger, categoryKey)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedTrigger?.type === trigger.type
                          ? "border-[#5B5FED] bg-[#5B5FED]/10"
                          : "border-[var(--border)] hover:border-[var(--muted-foreground)]/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <trigger.icon
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            selectedTrigger?.type === trigger.type
                              ? "text-[#5B5FED]"
                              : "text-[var(--muted-foreground)]"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={`mb-1 ${
                              selectedTrigger?.type === trigger.type
                                ? "text-[#5B5FED]"
                                : "text-[var(--foreground)]"
                            }`}
                          >
                            {trigger.label}
                          </div>
                          <div className="text-sm text-[var(--muted-foreground)]">
                            {trigger.description}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Task Updated Configuration */}
                    {selectedTrigger?.type === trigger.type &&
                      trigger.type === "task_updated" && (
                        <div className="mt-3 ml-8 p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg space-y-4">
                          <div>
                            <Label className="text-[var(--foreground)] mb-3 block">
                              Field Change Filter
                            </Label>
                            <div className="space-y-3">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="fieldChangeMode"
                                  value="any"
                                  checked={fieldChangeMode === "any"}
                                  onChange={(e) =>
                                    setFieldChangeMode(
                                      e.target.value as "any" | "specific"
                                    )
                                  }
                                  className="mt-0.5"
                                />
                                <div>
                                  <div className="text-sm text-[var(--foreground)]">
                                    Trigger when ANY field changes
                                  </div>
                                  <div className="text-xs text-[var(--muted-foreground)]">
                                    Any update to the task will trigger this automation
                                  </div>
                                </div>
                              </label>
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="fieldChangeMode"
                                  value="specific"
                                  checked={fieldChangeMode === "specific"}
                                  onChange={(e) =>
                                    setFieldChangeMode(
                                      e.target.value as "any" | "specific"
                                    )
                                  }
                                  className="mt-0.5"
                                />
                                <div className="flex-1">
                                  <div className="text-sm text-[var(--foreground)] mb-2">
                                    Trigger ONLY when specific fields change
                                  </div>
                                  {fieldChangeMode === "specific" && (
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                      {TASK_FIELDS.map((field) => (
                                        <label
                                          key={field.value}
                                          className="flex items-center gap-2 p-2 rounded hover:bg-[var(--muted)] cursor-pointer"
                                        >
                                          <Checkbox
                                            checked={selectedFields.includes(
                                              field.value
                                            )}
                                            onCheckedChange={() =>
                                              handleFieldToggle(field.value)
                                            }
                                          />
                                          <span className="text-sm text-[var(--foreground)]">
                                            {field.label}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Scheduled Time Configuration */}
                    {selectedTrigger?.type === trigger.type &&
                      trigger.type === "scheduled_time" && (
                        <div className="mt-3 ml-8 p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                          <Label className="text-[var(--foreground)] mb-2 block">
                            Schedule Type
                          </Label>
                          <Select value={scheduleType} onValueChange={setScheduleType}>
                            <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                              <SelectItem
                                value="daily"
                                className="text-[var(--foreground)]"
                              >
                                Daily
                              </SelectItem>
                              <SelectItem
                                value="weekly"
                                className="text-[var(--foreground)]"
                              >
                                Weekly
                              </SelectItem>
                              <SelectItem
                                value="monthly"
                                className="text-[var(--foreground)]"
                              >
                                Monthly
                              </SelectItem>
                              <SelectItem
                                value="cron"
                                className="text-[var(--foreground)]"
                              >
                                Custom (Cron)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                    {/* Before/After Due Date Configuration */}
                    {selectedTrigger?.type === trigger.type &&
                      (trigger.type === "before_due_date" ||
                        trigger.type === "after_due_date") && (
                        <div className="mt-3 ml-8 p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                          <Label className="text-[var(--foreground)] mb-2 block">
                            Time Offset
                          </Label>
                          <div className="flex gap-2">
                            <Select value={timeOffset} onValueChange={setTimeOffset}>
                              <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                {[1, 2, 3, 5, 7, 14, 30].map((num) => (
                                  <SelectItem
                                    key={num}
                                    value={String(num)}
                                    className="text-[var(--foreground)]"
                                  >
                                    {num}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={timeUnit} onValueChange={setTimeUnit}>
                              <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                <SelectItem
                                  value="hours"
                                  className="text-[var(--foreground)]"
                                >
                                  Hours
                                </SelectItem>
                                <SelectItem
                                  value="days"
                                  className="text-[var(--foreground)]"
                                >
                                  Days
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                    {/* AI Inactivity Configuration */}
                    {selectedTrigger?.type === trigger.type &&
                      trigger.type === "ai_task_inactivity" && (
                        <div className="mt-3 ml-8 p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                          <Label className="text-[var(--foreground)] mb-2 block">
                            Inactivity Period (Days)
                          </Label>
                          <Select
                            value={inactivityDays}
                            onValueChange={setInactivityDays}
                          >
                            <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                              {[3, 5, 7, 10, 14, 21, 30].map((num) => (
                                <SelectItem
                                  key={num}
                                  value={String(num)}
                                  className="text-[var(--foreground)]"
                                >
                                  {num} days
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                    {/* Workflow Transition Configuration */}
                    {selectedTrigger?.type === trigger.type &&
                      trigger.type === "workflow_transition" && (
                        <div className="mt-3 ml-8 p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg space-y-3">
                          <div>
                            <Label className="text-[var(--foreground)] mb-2 block">
                              From Status
                            </Label>
                            <Select
                              value={transitionFrom}
                              onValueChange={setTransitionFrom}
                            >
                              <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                <SelectItem
                                  value="to-do"
                                  className="text-[var(--foreground)]"
                                >
                                  To Do
                                </SelectItem>
                                <SelectItem
                                  value="in-progress"
                                  className="text-[var(--foreground)]"
                                >
                                  In Progress
                                </SelectItem>
                                <SelectItem
                                  value="review"
                                  className="text-[var(--foreground)]"
                                >
                                  Review
                                </SelectItem>
                                <SelectItem
                                  value="done"
                                  className="text-[var(--foreground)]"
                                >
                                  Done
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[var(--foreground)] mb-2 block">
                              To Status
                            </Label>
                            <Select value={transitionTo} onValueChange={setTransitionTo}>
                              <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                                <SelectItem
                                  value="to-do"
                                  className="text-[var(--foreground)]"
                                >
                                  To Do
                                </SelectItem>
                                <SelectItem
                                  value="in-progress"
                                  className="text-[var(--foreground)]"
                                >
                                  In Progress
                                </SelectItem>
                                <SelectItem
                                  value="review"
                                  className="text-[var(--foreground)]"
                                >
                                  Review
                                </SelectItem>
                                <SelectItem
                                  value="done"
                                  className="text-[var(--foreground)]"
                                >
                                  Done
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
