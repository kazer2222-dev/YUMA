'use client';

import {
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Calendar,
  Target,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StatCardConfig {
  title: string;
  value: string;
  change: string;
  icon: typeof TrendingUp;
  color: string;
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  statusColor: string;
  priority: string;
  priorityColor: string;
  dueDate?: string;
}

interface Milestone {
  title: string;
  date: string;
  progress: number;
  color: string;
}

interface AiInsight {
  title: string;
  description: string;
  color: string;
}

interface ClickUpHomeDashboardProps {
  userName: string;
  statsCards: StatCardConfig[];
  recentTasks: RecentTask[];
  milestones: Milestone[];
  aiInsights: AiInsight[];
  onAiInsightsClick?: () => void;
}

export function ClickUpHomeDashboard({
  userName,
  statsCards,
  recentTasks,
  milestones,
  aiInsights,
  onAiInsightsClick,
}: ClickUpHomeDashboardProps) {
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-auto h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="mb-1">Welcome back, {userName} 👋</h1>
          <p className="text-[var(--muted-foreground)]">Here&apos;s what&apos;s happening with your projects today</p>
        </div>
        <Button
          className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white w-full sm:w-auto"
          onClick={onAiInsightsClick}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Insights
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="cursor-pointer border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:bg-[var(--muted)]"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <Card className="bg-[var(--card)] border-[var(--border)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5" style={{ color: '#4353FF' }} />
            <h2>Milestones</h2>
          </div>
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone.title}>
                <div className="flex items-center justify-between mb-2">
                  <h4>{milestone.title}</h4>
                  <span className="text-[var(--muted-foreground)]">{milestone.progress}%</span>
                </div>
                <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${milestone.progress}%`, backgroundColor: milestone.color }}
                  />
                </div>
                <span className="text-[var(--muted-foreground)]">{milestone.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-[var(--card)] border-[var(--border)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5" style={{ color: '#8B5CF6' }} />
          <h2>AI Insights</h2>
          <span className="px-2 py-0.5 rounded bg-[#8B5CF620] text-[#8B5CF6]">Powered by AI</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights.map((insight) => (
            <div
              key={insight.title}
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

