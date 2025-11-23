import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Filter,
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

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
  groupId: string;
}

interface ConditionGroup {
  id: string;
  logic: "AND" | "OR";
  conditions: Condition[];
}

interface AutomationConditionsProps {
  conditions: any[];
  onConditionsChange: (conditions: any[]) => void;
}

const CONDITION_FIELDS = [
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "assignee", label: "Assignee" },
  { value: "labels", label: "Labels" },
  { value: "template", label: "Template" },
  { value: "due_date", label: "Due Date" },
  { value: "time_estimate", label: "Time Estimate" },
  { value: "checklist", label: "Checklist" },
  { value: "attachments", label: "Attachments" },
  { value: "comments", label: "Comments" },
  { value: "creator", label: "Creator" },
  { value: "updater", label: "Last Updated By" },
  { value: "custom_field", label: "Custom Field" },
];

const OPERATORS = {
  text: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does Not Contain" },
    { value: "empty", label: "Is Empty" },
    { value: "not_empty", label: "Is Not Empty" },
  ],
  number: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "increased", label: "Increased" },
    { value: "decreased", label: "Decreased" },
  ],
  date: [
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
    { value: "within_range", label: "Within Range" },
    { value: "equals", label: "Equals" },
  ],
  labels: [
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does Not Contain" },
    { value: "label_added", label: "Label Added" },
    { value: "label_removed", label: "Label Removed" },
  ],
  status: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "changed_from_to", label: "Changed From → To" },
  ],
};

const FIELD_TYPE_MAP: Record<string, keyof typeof OPERATORS> = {
  status: "status",
  priority: "text",
  assignee: "text",
  labels: "labels",
  template: "text",
  due_date: "date",
  time_estimate: "number",
  checklist: "text",
  attachments: "text",
  comments: "text",
  creator: "text",
  updater: "text",
  custom_field: "text",
};

export function AutomationConditions({
  conditions,
  onConditionsChange,
}: AutomationConditionsProps) {
  const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>([
    {
      id: "group-1",
      logic: "AND",
      conditions: [],
    },
  ]);

  // Sync changes to parent whenever conditionGroups changes
  useEffect(() => {
    const allConditions = conditionGroups.flatMap((group) =>
      group.conditions.map((c) => ({ ...c, logic: group.logic }))
    );
    onConditionsChange(allConditions);
  }, [conditionGroups, onConditionsChange]);

  const addCondition = (groupId: string) => {
    const newCondition: Condition = {
      id: `condition-${Date.now()}`,
      field: "",
      operator: "",
      value: "",
      groupId,
    };

    setConditionGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, conditions: [...group.conditions, newCondition] }
          : group
      )
    );
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setConditionGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.filter((c) => c.id !== conditionId),
            }
          : group
      )
    );
  };

  const updateCondition = (
    groupId: string,
    conditionId: string,
    field: keyof Condition,
    value: string
  ) => {
    setConditionGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map((c) =>
                c.id === conditionId ? { ...c, [field]: value } : c
              ),
            }
          : group
      )
    );
  };

  const addConditionGroup = () => {
    const newGroup: ConditionGroup = {
      id: `group-${Date.now()}`,
      logic: "OR",
      conditions: [],
    };
    setConditionGroups((prev) => [...prev, newGroup]);
  };

  const removeConditionGroup = (groupId: string) => {
    setConditionGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const toggleGroupLogic = (groupId: string) => {
    setConditionGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, logic: group.logic === "AND" ? "OR" : ("AND" as "AND" | "OR") }
          : group
      )
    );
  };

  const updateParent = () => {
    // Flatten all conditions for parent component
    const allConditions = conditionGroups.flatMap((group) =>
      group.conditions.map((c) => ({ ...c, logic: group.logic }))
    );
    onConditionsChange(allConditions);
  };

  const getOperatorsForField = (field: string) => {
    const fieldType = FIELD_TYPE_MAP[field] || "text";
    return OPERATORS[fieldType];
  };

  const shouldShowValueInput = (operator: string) => {
    return !["empty", "not_empty", "label_added", "label_removed"].includes(operator);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl text-[var(--foreground)] mb-2">Add Conditions (Optional)</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Define when this automation should run. Skip this step to run on every trigger.
        </p>
      </div>

      {conditionGroups.length === 0 ? (
        <div className="text-center py-12 bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <Filter className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
          <h3 className="text-[var(--foreground)] mb-2">No Conditions</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            This automation will run every time the trigger fires
          </p>
          <Button
            onClick={() => addCondition("group-1")}
            variant="outline"
            className="border-[var(--border)] text-[var(--foreground)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Condition
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {conditionGroups.map((group, groupIndex) => (
            <div
              key={group.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    Condition Group {groupIndex + 1}
                  </span>
                  {group.conditions.length > 1 && (
                    <button
                      onClick={() => toggleGroupLogic(group.id)}
                      className="px-2 py-1 text-xs rounded bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80"
                    >
                      {group.logic}
                    </button>
                  )}
                </div>
                {conditionGroups.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeConditionGroup(group.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Conditions */}
              <div className="space-y-3">
                {group.conditions.map((condition, conditionIndex) => (
                  <div key={condition.id}>
                    {conditionIndex > 0 && (
                      <div className="flex items-center justify-center py-2">
                        <span className="px-3 py-1 text-xs rounded-full bg-[var(--muted)] text-[var(--foreground)]">
                          {group.logic}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        {/* Field Selector */}
                        <div>
                          <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                            Field
                          </Label>
                          <Select
                            value={condition.field}
                            onValueChange={(value) =>
                              updateCondition(group.id, condition.id, "field", value)
                            }
                          >
                            <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] h-9">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                              {CONDITION_FIELDS.map((field) => (
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

                        {/* Operator Selector */}
                        <div>
                          <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                            Operator
                          </Label>
                          <Select
                            value={condition.operator}
                            onValueChange={(value) =>
                              updateCondition(group.id, condition.id, "operator", value)
                            }
                            disabled={!condition.field}
                          >
                            <SelectTrigger className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] h-9">
                              <SelectValue placeholder="Select operator" />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                              {condition.field &&
                                getOperatorsForField(condition.field).map((op) => (
                                  <SelectItem
                                    key={op.value}
                                    value={op.value}
                                    className="text-[var(--foreground)]"
                                  >
                                    {op.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Value Input */}
                        <div>
                          <Label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                            Value
                          </Label>
                          {shouldShowValueInput(condition.operator) ? (
                            <Input
                              value={condition.value}
                              onChange={(e) =>
                                updateCondition(
                                  group.id,
                                  condition.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              placeholder="Enter value"
                              className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] h-9"
                              disabled={!condition.operator}
                            />
                          ) : (
                            <div className="h-9 flex items-center px-3 bg-[var(--muted)]/50 border border-[var(--border)] rounded text-xs text-[var(--muted-foreground)]">
                              No value needed
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(group.id, condition.id)}
                        className="h-9 w-9 mt-5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Condition Button */}
              <Button
                onClick={() => addCondition(group.id)}
                variant="outline"
                size="sm"
                className="w-full mt-3 border-dashed border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Condition to Group
              </Button>
            </div>
          ))}

          {/* Add Group Button */}
          <Button
            onClick={addConditionGroup}
            variant="outline"
            className="w-full border-dashed border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add OR Condition Group
          </Button>
        </div>
      )}
    </div>
  );
}