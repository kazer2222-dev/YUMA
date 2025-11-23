import { Card } from "./ui/card";
import { StatusBadge } from "./status-badge";
import { PriorityIndicator } from "./priority-indicator";
import { CollaborationAvatars } from "./collaboration-avatars";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const sampleUsers = [
  { name: "Alice Johnson", initials: "AJ", color: "var(--collaboration-user-1)", role: "Designer" },
  { name: "Bob Smith", initials: "BS", color: "var(--collaboration-user-2)", role: "Developer" },
  { name: "Carol White", initials: "CW", color: "var(--collaboration-user-3)", role: "PM" },
  { name: "David Brown", initials: "DB", color: "var(--collaboration-user-4)", role: "Developer" },
];

export function DesignShowcase() {
  return (
    <Card className="p-8">
      <div className="space-y-8">
        <div>
          <h2 className="mb-4">YUMA Design System</h2>
          <p className="text-muted-foreground">
            A comprehensive design pattern library for task management and AI-powered collaboration
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3>Status Badges</h3>
          <div className="flex flex-wrap gap-3">
            <StatusBadge status="todo" />
            <StatusBadge status="in-progress" />
            <StatusBadge status="done" />
            <StatusBadge status="blocked" />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3>Priority Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PriorityIndicator priority="low" showLabel />
            <PriorityIndicator priority="medium" showLabel />
            <PriorityIndicator priority="high" showLabel />
            <PriorityIndicator priority="urgent" showLabel />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3>Collaboration Avatars</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Small Size</p>
              <CollaborationAvatars users={sampleUsers} size="sm" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-3">Medium Size</p>
              <CollaborationAvatars users={sampleUsers} size="md" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-3">Large Size</p>
              <CollaborationAvatars users={sampleUsers} size="lg" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3>AI-Themed Components</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button className="bg-gradient-to-r from-[var(--ai-gradient-from)] to-[var(--ai-gradient-to)] text-white hover:opacity-90">
              AI Generate Tasks
            </Button>
            <Button 
              variant="outline" 
              className="border-[var(--ai-primary)] text-[var(--ai-primary)] hover:bg-[var(--ai-primary)]/10"
            >
              Ask AI Assistant
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3>Color Palette</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--ai-primary)]" />
              <p className="text-sm">AI Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--ai-secondary)]" />
              <p className="text-sm">AI Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--status-in-progress)]" />
              <p className="text-sm">In Progress</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--status-done)]" />
              <p className="text-sm">Done</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--priority-medium)]" />
              <p className="text-sm">Medium Priority</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--priority-high)]" />
              <p className="text-sm">High Priority</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--collaboration-user-1)]" />
              <p className="text-sm">User 1</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--collaboration-user-2)]" />
              <p className="text-sm">User 2</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
