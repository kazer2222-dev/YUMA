'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BoardView } from '@/components/board/board-view';
import { NotionLayout } from '@/components/layout/notion-layout';
import { Loading } from '@/components/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';

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

interface Board {
  id: string;
  name: string;
  description?: string;
  spaceId: string;
  order: number;
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.slug as string;
  const boardId = params.boardId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<SpaceListItem[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
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

        if (spaceSlug && boardId) {
        // Persist as last visited board for this space
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`lastBoard_${spaceSlug}`, boardId);
          } catch (e) {
            // ignore storage errors
          }
        }
          await fetchBoard();
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        router.push('/auth');
      }
    };

    fetchData();
  }, [spaceSlug, boardId, router]);

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/boards/${boardId}`, { 
        credentials: 'include' 
      });
      const data = await response.json();

      if (data.success) {
        setBoard(data.board);
      } else {
        setError(data.message || 'Board not found');
      }
    } catch (err) {
      setError('Failed to fetch board');
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

  const { showSuccess, showError } = useToastHelpers();

  const handleDeleteBoard = async () => {
    if (!confirm(`Are you sure you want to delete "${board.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/boards/${boardId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Board deleted successfully');
        router.push(`/spaces/${spaceSlug}`);
      } else {
        showError(data.message || 'Failed to delete board');
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      showError('Failed to delete board');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading board..." />
      </div>
    );
  }

  if (error || !board) {
    return (
      <NotionLayout
        spaces={spaces}
        user={user}
        onLogout={handleLogout}
        onCreateSpace={() => {}}
        pageTitle="Board Error"
        breadcrumbs={[]}
      >
        <div className="p-8">
          <div className="space-y-4">
            <Button variant="outline" onClick={() => router.push(`/spaces/${spaceSlug}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Space
            </Button>
            <Alert variant="destructive">
              <AlertDescription>{error || 'Board not found'}</AlertDescription>
            </Alert>
          </div>
        </div>
      </NotionLayout>
    );
  }

  return (
    <NotionLayout
      spaces={spaces}
      user={user}
      onLogout={handleLogout}
      onCreateSpace={() => {}}
      pageTitle={board.name}
      breadcrumbs={[]}
      actions={[
        {
          label: 'Delete Board',
          onClick: handleDeleteBoard,
          variant: 'destructive' as const,
          icon: Trash2
        }
      ]}
      onRefreshSpaces={async () => {
        // Refresh spaces and redirect
        const res = await fetch('/api/spaces', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setSpaces(data.spaces || []);
        }
      }}
    >
      <div className="flex-1 p-6">
        <BoardView boardId={boardId} spaceSlug={spaceSlug} />
      </div>
    </NotionLayout>
  );
}

