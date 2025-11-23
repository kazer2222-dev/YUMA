'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ClickUpAppShell } from '@/components/layout/clickup-app-shell';
import { ClickUpHomeDashboard } from '@/components/clickup/home-dashboard';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Space {
  id: string;
  name: string;
  description?: string;
  slug: string;
  ticker: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  taskCount: number;
}

interface Task {
  id: string;
  number: string;
  summary: string;
  description?: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  assignee?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  status: {
    id: string;
    name: string;
    key: string;
    color: string;
    isDone: boolean;
  };
  space: {
    id: string;
    name: string;
    slug: string;
    ticker: string;
  };
}

type StatCardConfig = {
  title: string;
  value: string;
  change: string;
  icon: typeof TrendingUp;
  color: string;
};

const DEFAULT_MILESTONES = [
  { title: 'Q4 Product Launch', date: 'Dec 15, 2024', progress: 68, color: '#4353FF' },
  { title: 'Mobile App Beta', date: 'Nov 30, 2024', progress: 45, color: '#8B5CF6' },
  { title: 'Design System 2.0', date: 'Nov 20, 2024', progress: 82, color: '#10B981' },
] as const;

const DEFAULT_AI_INSIGHTS = [
  {
    title: 'Task Bottleneck Detected',
    description: "3 tasks in 'Review' status for over 48 hours",
    color: '#F59E0B',
  },
  {
    title: 'High Productivity Day',
    description: 'Team completed 23% more tasks than average',
    color: '#10B981',
  },
  {
    title: 'Deadline Reminder',
    description: '5 tasks due in the next 24 hours',
    color: '#4353FF',
  },
] as const;

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [userRes, spacesRes, tasksRes] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }).catch(err => {
            console.error('Auth fetch error:', err);
            return { status: 500, json: async () => ({ success: false, message: 'Network error' }) };
          }),
          fetch('/api/spaces', { credentials: 'include' }).catch(err => {
            console.error('Spaces fetch error:', err);
            return { status: 500, json: async () => ({ success: false, message: 'Network error' }) };
          }),
          fetch('/api/tasks/global', { credentials: 'include' }).catch(err => {
            console.error('Tasks fetch error:', err);
            return { status: 500, json: async () => ({ success: false, message: 'Network error' }) };
          }),
        ]);

        if (userRes.status === 401 || !userRes.ok) {
          router.push('/auth');
          return;
        }

        const userData = await userRes.json();
        const spacesData = await spacesRes.json();
        const tasksData = await tasksRes.json();

        if (userData.success) {
          setUser(userData.user);
        } else {
          router.push('/auth');
          return;
        }

        if (spacesData.success) {
          setSpaces(spacesData.spaces || []);
        } else {
          console.warn('Failed to fetch spaces:', spacesData.message);
          setSpaces([]);
        }

        if (tasksData.success) {
          setTasks(tasksData.tasks || []);
        } else {
          console.warn('Failed to fetch tasks:', tasksData.message);
          setTasks([]);
        }
      } catch (error: any) {
        console.error('Failed to fetch home page data:', error);
        setError(error.message || 'Failed to load data');
        // Don't redirect on error - let user see the error message
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Handle redirect if user is not authenticated after loading completes
  useEffect(() => {
    if (!loading && !user && !error) {
      router.push('/auth');
    }
  }, [loading, user, error, router]);

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((task) => {
    const key = task.status.key?.toLowerCase() ?? '';
    const name = task.status.name?.toLowerCase() ?? '';
    return key === 'in_progress' || name.includes('progress');
  }).length;

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const completedToday = tasks.filter((task) => {
    if (!task.status.isDone) return false;
    const updated = new Date(task.updatedAt || task.createdAt);
    updated.setHours(0, 0, 0, 0);
    return updated.getTime() === today.getTime();
  }).length;

  const teamMembers = useMemo(() => {
    const assigneeIds = new Set(tasks.map((task) => task.assignee?.id).filter(Boolean) as string[]);
    if (assigneeIds.size > 0) return assigneeIds.size;
    return spaces.reduce((total, space) => total + (space.memberCount ?? 0), 0);
  }, [spaces, tasks]);

  const statsCards = useMemo<StatCardConfig[]>(() => [
    {
      title: 'Total Tasks',
      value: totalTasks.toString(),
      change: '+12%',
      icon: CheckCircle2,
      color: '#4353FF',
    },
    {
      title: 'In Progress',
      value: inProgressTasks.toString(),
      change: '+8%',
      icon: Clock,
      color: '#8B5CF6',
    },
    {
      title: 'Completed Today',
      value: completedToday.toString(),
      change: '+23%',
      icon: TrendingUp,
      color: '#10B981',
    },
    {
      title: 'Team Members',
      value: teamMembers.toString(),
      change: '+2',
      icon: Users,
      color: '#F59E0B',
    },
  ], [totalTasks, inProgressTasks, completedToday, teamMembers]);

  const formattedRecentTasks = useMemo(() => {
    const getPriorityColor = (priority: string) => {
      switch (priority?.toUpperCase()) {
        case 'URGENT':
          return '#F44336';
        case 'HIGH':
          return '#FF9800';
        case 'MEDIUM':
          return '#F59E0B';
        case 'LOW':
          return '#4353FF';
        default:
          return '#7D8089';
      }
    };

    const getStatusColor = (status: Task['status']) => {
      if (status.isDone) {
        return '#10B981';
      }
      const name = status.name.toLowerCase();
      if (name.includes('review') || name.includes('qa')) {
        return '#10B981';
      }
      if (name.includes('progress') || status.key?.toLowerCase() === 'in_progress') {
        return '#8B5CF6';
      }
      return '#4353FF';
    };

    const formatDate = (dateString?: string) => {
      if (!dateString) return '—';
      const date = new Date(dateString);
      const month = date.toLocaleString('default', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    };

    return [...tasks]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      )
      .slice(0, 4)
      .map((task) => ({
        id: task.number || task.id,
        title: task.summary,
        status: task.status.name,
        statusColor: getStatusColor(task.status),
        priority: task.priority || 'Unset',
        priorityColor: getPriorityColor(task.priority),
        dueDate: formatDate(task.dueDate),
      }));
  }, [tasks]);

  const milestones = DEFAULT_MILESTONES.map((milestone) => ({ ...milestone }));
  const aiInsights = DEFAULT_AI_INSIGHTS.map((insight) => ({ ...insight }));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--primary)]" />
          <p className="text-sm text-[var(--muted-foreground)]">Preparing your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <div className="text-center max-w-md p-6">
          <p className="text-lg font-semibold text-red-500 mb-2">Error loading page</p>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:opacity-90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect will be handled by useEffect above
    return null;
  }

  const userName = user.name || user.email?.split('@')[0] || 'Admin';

  const refreshSpaces = async () => {
    try {
      const response = await fetch('/api/spaces', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setSpaces(data.spaces || []);
      }
    } catch (error) {
      console.error('Failed to refresh spaces:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        router.push('/auth');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    router.push(`/search?query=${encodeURIComponent(query.trim())}`);
  };

  return (
    <ClickUpAppShell
      spaces={spaces}
      user={user}
      onLogout={handleLogout}
      onCreateSpace={refreshSpaces}
      onRefreshSpaces={refreshSpaces}
      pageTitle="Home"
      breadcrumbs={[]}
      actions={[]}
      showSearch
      onSearch={handleSearch}
      hideTitle
    >
      <ClickUpHomeDashboard
        userName={userName}
        statsCards={statsCards}
        recentTasks={formattedRecentTasks}
        milestones={milestones}
        aiInsights={aiInsights}
        onAiInsightsClick={() => router.push('/ai')}
      />
    </ClickUpAppShell>
  );
}

