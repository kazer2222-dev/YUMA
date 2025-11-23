import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Plus, Settings, Users } from "lucide-react";

interface ProjectHeaderProps {
  projectName: string;
  description: string;
  progress: number;
  teamMembers?: { name: string; avatar?: string; initials: string }[];
  tasksCompleted: number;
  totalTasks: number;
}

export function ProjectHeader({
  projectName,
  description,
  progress,
  teamMembers = [],
  tasksCompleted,
  totalTasks,
}: ProjectHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1>{projectName}</h1>
            <Badge variant="secondary" className="text-sm">
              Active
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
          <Button className="bg-[var(--ai-primary)] text-white hover:bg-[var(--ai-primary)]/90">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {tasksCompleted} of {totalTasks} tasks completed
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Team Members</span>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {teamMembers.slice(0, 5).map((member, index) => (
                <Avatar key={index} className="w-8 h-8 border-2 border-background">
                  {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                  <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            {teamMembers.length > 5 && (
              <span className="text-sm text-muted-foreground">
                +{teamMembers.length - 5} more
              </span>
            )}
            <Button variant="outline" size="sm" className="ml-auto">
              <Users className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Quick Stats</span>
          <div className="flex gap-4">
            <div>
              <div className="text-2xl">{tasksCompleted}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl">{totalTasks - tasksCompleted}</div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
