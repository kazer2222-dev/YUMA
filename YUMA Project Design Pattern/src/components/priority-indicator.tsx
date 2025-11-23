import { AlertCircle } from "lucide-react";

interface PriorityIndicatorProps {
  priority: "low" | "medium" | "high" | "urgent";
  showLabel?: boolean;
}

const priorityConfig = {
  low: {
    label: "Low",
    color: "text-[var(--priority-low)]",
    bgColor: "bg-[var(--priority-low)]",
  },
  medium: {
    label: "Medium",
    color: "text-[var(--priority-medium)]",
    bgColor: "bg-[var(--priority-medium)]",
  },
  high: {
    label: "High",
    color: "text-[var(--priority-high)]",
    bgColor: "bg-[var(--priority-high)]",
  },
  urgent: {
    label: "Urgent",
    color: "text-[var(--priority-urgent)]",
    bgColor: "bg-[var(--priority-urgent)]",
  },
};

export function PriorityIndicator({ priority, showLabel = false }: PriorityIndicatorProps) {
  const config = priorityConfig[priority];

  if (showLabel) {
    return (
      <div className={`flex items-center gap-2 ${config.color}`}>
        <div className={`w-2 h-2 rounded-full ${config.bgColor}`} />
        <span className="text-sm">{config.label} Priority</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${config.color}`}>
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm">{config.label}</span>
    </div>
  );
}
