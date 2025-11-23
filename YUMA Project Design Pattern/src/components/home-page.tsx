import { TrendingUp, Users, CheckCircle2, Clock, Sparkles, ArrowUpRight, Calendar, Target } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

const statsCards = [
  {
    title: "Total Tasks",
    value: "127",
    change: "+12%",
    trend: "up",
    icon: CheckCircle2,
    color: "#4353FF",
  },
  {
    title: "In Progress",
    value: "34",
    change: "+8%",
    trend: "up",
    icon: Clock,
    color: "#8B5CF6",
  },
  {
    title: "Completed Today",
    value: "18",
    change: "+23%",
    trend: "up",
    icon: TrendingUp,
    color: "#10B981",
  },
  {
    title: "Team Members",
    value: "12",
    change: "+2",
    trend: "up",
    icon: Users,
    color: "#F59E0B",
  },
];

const recentTasks = [
  {
    id: "TASK-143",
    title: "Design new landing page",
    status: "In Progress",
    priority: "High",
    assignee: "John Doe",
    dueDate: "Nov 8",
    statusColor: "#8B5CF6",
    priorityColor: "#FF9800",
  },
  {
    id: "TASK-142",
    title: "Implement authentication flow",
    status: "Review",
    priority: "Urgent",
    assignee: "Jane Smith",
    dueDate: "Nov 6",
    statusColor: "#10B981",
    priorityColor: "#F44336",
  },
  {
    id: "TASK-141",
    title: "Update documentation",
    status: "To Do",
    priority: "Medium",
    assignee: "Mike Johnson",
    dueDate: "Nov 10",
    statusColor: "#4353FF",
    priorityColor: "#F59E0B",
  },
  {
    id: "TASK-140",
    title: "Fix mobile responsiveness",
    status: "In Progress",
    priority: "High",
    assignee: "Sarah Wilson",
    dueDate: "Nov 7",
    statusColor: "#8B5CF6",
    priorityColor: "#FF9800",
  },
];

const upcomingMilestones = [
  {
    title: "Q4 Product Launch",
    date: "Dec 15, 2024",
    progress: 68,
    color: "#4353FF",
  },
  {
    title: "Mobile App Beta",
    date: "Nov 30, 2024",
    progress: 45,
    color: "#8B5CF6",
  },
  {
    title: "Design System 2.0",
    date: "Nov 20, 2024",
    progress: 82,
    color: "#10B981",
  },
];

const aiInsights = [
  {
    title: "Task Bottleneck Detected",
    description: "3 tasks in 'Review' status for over 48 hours",
    severity: "warning",
    color: "#F59E0B",
  },
  {
    title: "High Productivity Day",
    description: "Team completed 23% more tasks than average",
    severity: "success",
    color: "#10B981",
  },
  {
    title: "Deadline Reminder",
    description: "5 tasks due in the next 24 hours",
    severity: "info",
    color: "#4353FF",
  },
];

export function HomePage() {
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-auto h-full">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="mb-1">Welcome back, Admin 👋</h1>
          <p className="text-[var(--muted-foreground)]">
            Here's what's happening with your projects today
          </p>
        </div>
        <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white w-full sm:w-auto">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Insights
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="bg-[var(--card)] border-[var(--border)] p-4 hover:bg-[var(--muted)] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                  <ArrowUpRight className="w-3 h-3" style={{ color: stat.color }} />
                  <span style={{ color: stat.color }}>{stat.change}</span>
                </div>
              </div>
              <div>
                <h2 className="mb-1" style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-bold)' }}>{stat.value}</h2>
                <p className="text-[var(--muted-foreground)]">{stat.title}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks - Takes 2 columns */}
        <Card className="lg:col-span-2 bg-[var(--card)] border-[var(--border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2>Recent Tasks</h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-[var(--background)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[var(--muted-foreground)]">{task.id}</span>
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${task.statusColor}20`, color: task.statusColor }}
                    >
                      {task.status}
                    </span>
                  </div>
                  <h4 className="truncate">{task.title}</h4>
                </div>
                <div className="flex items-center gap-4 text-[var(--muted-foreground)]">
                  <div
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: `${task.priorityColor}20`, color: task.priorityColor }}
                  >
                    {task.priority}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{task.dueDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Milestones - Takes 1 column */}
        <Card className="bg-[var(--card)] border-[var(--border)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5" style={{ color: "#4353FF" }} />
            <h2>Milestones</h2>
          </div>
          <div className="space-y-4">
            {upcomingMilestones.map((milestone) => (
              <div key={milestone.title}>
                <div className="flex items-center justify-between mb-2">
                  <h4>{milestone.title}</h4>
                  <span className="text-[var(--muted-foreground)]">
                    {milestone.progress}%
                  </span>
                </div>
                <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${milestone.progress}%`,
                      backgroundColor: milestone.color,
                    }}
                  />
                </div>
                <span className="text-[var(--muted-foreground)]">{milestone.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Insights Section */}
      <Card className="bg-[var(--card)] border-[var(--border)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5" style={{ color: "#8B5CF6" }} />
          <h2>AI Insights</h2>
          <span className="px-2 py-0.5 rounded bg-[#8B5CF620] text-[#8B5CF6]">
            Powered by AI
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights.map((insight, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${insight.color}20` }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: insight.color }}
                  />
                </div>
                <div>
                  <h4 className="mb-1">{insight.title}</h4>
                  <span className="text-[var(--muted-foreground)]">
                    {insight.description}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
