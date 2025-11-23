import { Search, Plus, Bell, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { CreateTaskDialog } from "./create-task-dialog";
import { useState } from "react";

interface ClickUpHeaderProps {
  onMenuClick?: () => void;
  currentSpace?: string | null;
  currentBoard?: string | null;
}

export function ClickUpHeader({ onMenuClick, currentSpace }: ClickUpHeaderProps) {
  const [showCreateTask, setShowCreateTask] = useState(false);

  return (
    <>
      <div className="h-14 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-3 sm:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 mr-2"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search bar - hidden on very small screens */}
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Search tasks..."
              className="pl-9 bg-[var(--input-background)] border-[var(--border)] h-9"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Create Task - text hidden on mobile */}
          <Button
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white h-9 px-2 sm:px-4"
            onClick={() => setShowCreateTask(true)}
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Create Task</span>
          </Button>

          <ThemeToggle />

          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="w-4 h-4" style={{ color: "#4353FF" }} />
          </Button>

          {/* User profile - name hidden on small screens */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-[var(--primary)]">
              <AvatarFallback className="bg-[var(--primary)] text-white">A</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">admin</span>
          </div>
        </div>
      </div>

      <CreateTaskDialog open={showCreateTask} onOpenChange={setShowCreateTask} />
    </>
  );
}