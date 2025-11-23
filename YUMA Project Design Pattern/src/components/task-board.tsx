import { TaskCard } from "./task-card";
import { Badge } from "./ui/badge";

interface Task {
  id: string;
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

interface TaskBoardProps {
  tasks: Task[];
}

const columns = [
  { id: "todo", title: "To Do", color: "border-[var(--status-todo)]" },
  { id: "in-progress", title: "In Progress", color: "border-[var(--status-in-progress)]" },
  { id: "done", title: "Done", color: "border-[var(--status-done)]" },
];

export function TaskBoard({ tasks }: TaskBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.id);
        
        return (
          <div key={column.id} className="space-y-4">
            <div className={`flex items-center justify-between p-3 bg-muted/50 rounded-lg border-t-2 ${column.color}`}>
              <h3>{column.title}</h3>
              <Badge variant="secondary" className="text-sm">
                {columnTasks.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  title={task.title}
                  description={task.description}
                  status={task.status}
                  priority={task.priority}
                  assignees={task.assignees}
                  dueDate={task.dueDate}
                  comments={task.comments}
                  attachments={task.attachments}
                  aiSuggested={task.aiSuggested}
                />
              ))}
              
              {columnTasks.length === 0 && (
                <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
