import { Badge } from "./ui/badge";

interface StatusBadgeProps {
  status: "todo" | "in-progress" | "done" | "blocked";
  size?: "sm" | "md" | "lg";
}

const statusConfig = {
  "todo": {
    label: "To Do",
    color: "bg-[var(--status-todo)]",
    textColor: "text-white",
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-[var(--status-in-progress)]",
    textColor: "text-white",
  },
  "done": {
    label: "Done",
    color: "bg-[var(--status-done)]",
    textColor: "text-white",
  },
  "blocked": {
    label: "Blocked",
    color: "bg-[var(--status-blocked)]",
    textColor: "text-white",
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge
      className={`${config.color} ${config.textColor} border-0`}
      variant="secondary"
    >
      {config.label}
    </Badge>
  );
}
