'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { NotionLayout } from '@/components/layout/notion-layout';
import { Loading } from '@/components/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TaskDetailView } from '@/components/tasks/task-detail-view';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface SpaceListItem {
  id: string;
  name: string;
  slug: string;
  ticker: string;
  memberCount: number;
  taskCount: number;
  boards?: Array<{
    id: string;
    name: string;
    description?: string;
    order: number;
  }>;
}

interface Task {
  id: string;
  number: number;
  summary: string;
  description?: string;
  priority: string;
  tags: string[];
  dueDate?: string;
  estimate?: string;
  assignee?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  status?: {
    id: string;
    name: string;
    key: string;
  };
  space?: {
    id: string;
    name: string;
    slug: string;
    ticker: string;
  };
  [key: string]: any; // Allow other properties from API
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.slug as string;
  const taskId = params.taskId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<SpaceListItem[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, spacesRes] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          fetch('/api/spaces', { credentials: 'include' })
        ]);

        const userData = await userRes.json();
        const spacesData = await spacesRes.json();

        if (userData.success) {
          setUser(userData.user);
        } else {
          router.push('/auth');
          return;
        }

        if (spacesData.success) {
          setSpaces(spacesData.spaces || []);
        }

        if (spaceSlug && taskId) {
          await fetchTask();
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        router.push('/auth');
      }
    };

    fetchData();
  }, [spaceSlug, taskId, router]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, { 
        credentials: 'include' 
      });
      const data = await response.json();

      if (data.success) {
        setTask(data.task);
      } else {
        setError(data.message || 'Task not found');
      }
    } catch (err) {
      setError('Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleCreateSpace = () => {
    // Not applicable on task page
  };

  const handleRefreshSpaces = async () => {
    const res = await fetch('/api/spaces', { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setSpaces(data.spaces || []);
    }
  };

  if (loading || !user) {
    return <Loading />;
  }

  if (error) {
    return (
      <NotionLayout
        spaces={spaces}
        user={user}
        onLogout={handleLogout}
        onCreateSpace={handleCreateSpace}
        onRefreshSpaces={handleRefreshSpaces}
        pageTitle=""
        pageSubtitle=""
        hideTitle={true}
      >
        <div className="flex items-center justify-center h-full">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </NotionLayout>
    );
  }

  return (
    <NotionLayout
      spaces={spaces}
      user={user}
      onLogout={handleLogout}
      onCreateSpace={handleCreateSpace}
      onRefreshSpaces={handleRefreshSpaces}
      pageTitle=""
      pageSubtitle=""
      hideTitle={true}
    >
      {task && (
        <TaskDetailView
          taskId={taskId}
          spaceSlug={spaceSlug}
          task={task}
        />
      )}
    </NotionLayout>
  );
}
