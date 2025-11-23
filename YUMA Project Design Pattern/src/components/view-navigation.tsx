import { useState } from "react";
import { LayoutGrid, CheckSquare, Columns3, Route, LayoutGrid as IntegrationsIcon, BarChart3, Archive, Zap, Calendar, Settings } from "lucide-react";
import { Button } from "./ui/button";

const views = [
  { id: "overview", label: "Overview", icon: LayoutGrid, color: "#4353FF" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, color: "#10B981" },
  { id: "board", label: "Board", icon: Columns3, color: "#8B5CF6" },
  { id: "roadmap", label: "Roadmap", icon: Route, color: "#EC4899" },
  { id: "integrations", label: "Integrations", icon: IntegrationsIcon, color: "#06B6D4" },
  { id: "reports", label: "Reports", icon: BarChart3, color: "#F59E0B" },
  { id: "backlog", label: "Backlog", icon: Archive, color: "#7D8089" },
  { id: "sprints", label: "Sprints", icon: Zap, color: "#FBBF24" },
  { id: "releases", label: "Releases", icon: Calendar, color: "#14B8A6" },
];

export function ViewNavigation() {
  const [activeView, setActiveView] = useState("board");

  return (
    <div className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="flex items-center justify-between px-3 sm:px-6 h-12 gap-2">
        {/* Scrollable view tabs */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-hide">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeView === view.id
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon 
                  className="w-4 h-4" 
                  style={{ color: activeView === view.id ? "white" : view.color }}
                />
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            );
          })}
        </div>

        {/* Actions - hidden on very small screens */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="h-8">
            <Settings className="w-3 h-3 mr-2" style={{ color: "#7D8089" }} />
            <span className="hidden lg:inline">Configure Statuses</span>
          </Button>
          <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white h-8">
            <svg className="w-3 h-3 mr-2" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z" />
            </svg>
            <span className="hidden lg:inline">Create Task</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
