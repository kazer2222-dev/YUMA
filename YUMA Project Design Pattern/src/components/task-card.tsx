import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Calendar, MessageSquare, Paperclip } from "lucide-react";

interface TaskCardProps {
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  assignees?: { name: string; avatar?: string; initials: string }[];
  dueDate?: string;
  comments?: number;
  attachments?: number;
  aiSuggested?: boolean;
}

const statusConfig = {
  "todo": { label: "To Do", color: "bg-[var(--status-todo)]" },
  "in-progress": { label: "In Progress", color: "bg-[var(--status-in-progress)]" },
  "done": { label: "Done", color: "bg-[var(--status-done)]" },
  "blocked": { label: "Blocked", color: "bg-[var(--status-blocked)]" },
};

const priorityConfig = {
  "low": { color: "border-l-[var(--priority-low)]" },
  "medium": { color: "border-l-[var(--priority-medium)]" },
  "high": { color: "border-l-[var(--priority-high)]" },
  "urgent": { color: "border-l-[var(--priority-urgent)]" },
};

export function TaskCard({
  title,
  description,
  status,
  priority,
  assignees = [],
  dueDate,
  comments,
  attachments,
  aiSuggested = false,
}: TaskCardProps) {
  return (
    <Card className={`p-4 border-l-4 ${priorityConfig[priority].color} hover:shadow-md transition-shadow cursor-pointer`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="mb-1">{title}</h4>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          <Badge
            className={`${statusConfig[status].color} text-white border-0 shrink-0`}
          >
            {statusConfig[status].label}
          </Badge>
        </div>

        {aiSuggested && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-gradient-to-r from-[var(--ai-gradient-from)]/10 to-[var(--ai-gradient-to)]/10 border border-[var(--ai-primary)]/20">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--ai-gradient-from)] to-[var(--ai-gradient-to)] animate-pulse" />
            <span className="text-sm text-[var(--ai-primary)]">AI Suggested</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            {dueDate && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{dueDate}</span>
              </div>
            )}
            {comments !== undefined && comments > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">{comments}</span>
              </div>
            )}
            {attachments !== undefined && attachments > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Paperclip className="w-4 h-4" />
                <span className="text-sm">{attachments}</span>
              </div>
            )}
          </div>

          {assignees.length > 0 && (
            <div className="flex -space-x-2">
              {assignees.map((assignee, index) => (
                <Avatar key={index} className="w-8 h-8 border-2 border-background">
                  {assignee.avatar && <AvatarImage src={assignee.avatar} alt={assignee.name} />}
                  <AvatarFallback className="text-xs">{assignee.initials}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
