import { Zap, Filter, Play, AlertCircle } from "lucide-react";

interface AutomationPreviewProps {
  trigger: any;
  conditions: any[];
  actions: any[];
}

export function AutomationPreview({
  trigger,
  conditions,
  actions,
}: AutomationPreviewProps) {
  const generatePreviewText = () => {
    if (!trigger) {
      return "Select a trigger to start building your automation";
    }

    let text = `When **${trigger.label}**`;

    // Add trigger configuration details
    if (trigger.type === "task_updated" && trigger.fieldChangeMode === "specific") {
      const fields = trigger.selectedFields || [];
      if (fields.length > 0) {
        text += ` (${fields.join(", ")})`;
      }
    }

    if (trigger.type === "scheduled_time") {
      text += ` (${trigger.scheduleType || "daily"})`;
    }

    if (trigger.type === "before_due_date" || trigger.type === "after_due_date") {
      text += ` (${trigger.timeOffset || 2} ${trigger.timeUnit || "days"})`;
    }

    if (trigger.type === "ai_task_inactivity") {
      text += ` (${trigger.inactivityDays || 7} days)`;
    }

    if (trigger.type === "workflow_transition") {
      if (trigger.transitionFrom && trigger.transitionTo) {
        text += ` (${trigger.transitionFrom} → ${trigger.transitionTo})`;
      }
    }

    // Add conditions
    if (conditions.length > 0) {
      text += `, **if** `;
      text += conditions.map((c) => {
        const field = c.field || "field";
        const operator = c.operator || "equals";
        const value = c.value || "value";
        return `${field} ${operator} ${value}`;
      }).join(" **and** ");
    }

    // Add actions
    if (actions.length > 0) {
      text += `, **then** `;
      text += actions.map((a, idx) => {
        const actionLabel = getActionLabel(a);
        return `${idx + 1}. ${actionLabel}`;
      }).join("\n");
    } else if (trigger) {
      text += `, **then** (no actions configured yet)`;
    }

    return text;
  };

  const getActionLabel = (action: any) => {
    switch (action.type) {
      case "update_field":
        return `Update ${action.config?.field || "field"} to ${action.config?.value || "value"}`;
      case "assign_user":
        return `Assign to ${action.config?.userId || "user"}`;
      case "unassign_user":
        return "Unassign user";
      case "add_comment":
        return `Add comment: "${action.config?.comment || "..."}"`
      case "add_checklist_item":
        return `Add checklist item: "${action.config?.item || "..."}"`
      case "move_template":
        return `Move to ${action.config?.template || "template"}`;
      case "duplicate_task":
        return "Duplicate task";
      case "delete_task":
        return "Delete task";
      case "send_notification":
        return `Send notification to ${action.config?.recipients || "users"}`;
      case "send_email":
        return `Send email to ${action.config?.recipients || "users"}`;
      case "send_slack":
        return `Send Slack message to ${action.config?.channel || "channel"}`;
      case "send_webhook":
        return `Send webhook to ${action.config?.url || "URL"}`;
      case "ai_generate_summary":
        return "AI: Generate task summary";
      case "ai_improve_description":
        return "AI: Improve task description";
      case "ai_categorize":
        return "AI: Categorize into template";
      case "ai_predict_transition":
        return "AI: Predict next transition";
      case "ai_auto_assign":
        return "AI: Auto-assign by workload";
      case "ai_reminder":
        return "AI: Generate reminder";
      case "transition_status":
        return `Transition to ${action.config?.status || "status"}`;
      case "add_to_sprint":
        return `Add to ${action.config?.sprint || "sprint"}`;
      case "remove_from_sprint":
        return "Remove from sprint";
      case "start_sprint":
        return "Start sprint";
      case "complete_sprint":
        return "Complete sprint";
      default:
        return action.label || action.type;
    }
  };

  const previewText = generatePreviewText();
  const hasTrigger = !!trigger;
  const hasActions = actions.length > 0;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-[var(--foreground)] mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#5B5FED]" />
          Real-Time Preview
        </h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          See how your automation will work in plain language
        </p>
      </div>

      {/* Preview Box */}
      <div className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 overflow-y-auto pb-6">
        <div className="space-y-4 pb-4">
          {/* Trigger Section */}
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              hasTrigger ? "bg-blue-500/20" : "bg-[var(--muted)]"
            }`}>
              <Zap className={`w-4 h-4 ${
                hasTrigger ? "text-blue-500" : "text-[var(--muted-foreground)]"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--muted-foreground)] mb-1">
                When
              </div>
              <div className="text-sm text-[var(--foreground)]">
                {trigger ? (
                  <span>{trigger.label}</span>
                ) : (
                  <span className="text-[var(--muted-foreground)] italic">
                    No trigger selected
                  </span>
                )}
              </div>
              {trigger?.type === "task_updated" && trigger.fieldChangeMode === "specific" && (
                <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Fields: {trigger.selectedFields?.join(", ") || "none"}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          {hasTrigger && (
            <div className="flex items-center gap-2 pl-4">
              <div className="w-0.5 h-6 bg-[var(--border)]" />
            </div>
          )}

          {/* Conditions Section */}
          {hasTrigger && (
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                conditions.length > 0 ? "bg-purple-500/20" : "bg-[var(--muted)]"
              }`}>
                <Filter className={`w-4 h-4 ${
                  conditions.length > 0 ? "text-purple-500" : "text-[var(--muted-foreground)]"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[var(--muted-foreground)] mb-1">
                  If (optional)
                </div>
                <div className="text-sm text-[var(--foreground)]">
                  {conditions.length > 0 ? (
                    <div className="space-y-1">
                      {conditions.map((condition, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {idx > 0 && (
                            <span className="text-xs text-[var(--muted-foreground)]">AND</span>
                          )}
                          <span>
                            {condition.field} {condition.operator} {condition.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[var(--muted-foreground)] italic">
                      No conditions (always run)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          {hasTrigger && (
            <div className="flex items-center gap-2 pl-4">
              <div className="w-0.5 h-6 bg-[var(--border)]" />
            </div>
          )}

          {/* Actions Section */}
          {hasTrigger && (
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                hasActions ? "bg-green-500/20" : "bg-[var(--muted)]"
              }`}>
                <Play className={`w-4 h-4 ${
                  hasActions ? "text-green-500" : "text-[var(--muted-foreground)]"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[var(--muted-foreground)] mb-1">
                  Then
                </div>
                <div className="text-sm text-[var(--foreground)]">
                  {hasActions ? (
                    <div className="space-y-2">
                      {actions.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            {idx + 1}.
                          </span>
                          <span>{getActionLabel(action)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[var(--muted-foreground)] italic">
                      No actions configured
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Messages */}
      {hasTrigger && !hasActions && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-orange-500">
            Add at least one action to complete your automation
          </div>
        </div>
      )}

      {!hasTrigger && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-500">
            Start by selecting a trigger event
          </div>
        </div>
      )}
    </div>
  );
}