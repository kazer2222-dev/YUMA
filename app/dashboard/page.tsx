'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpacesList } from '@/components/spaces/spaces-list';
import { NotionLayout } from '@/components/layout/notion-layout';
import { Calendar, Shield, Plus, Search, Star, Clock, CheckSquare, BarChart3 } from 'lucide-react';

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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

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
        } else {
          // If spaces fetch fails, set empty array instead of error
          console.warn('Failed to fetch spaces:', spacesData.message);
          setSpaces([]);
        }

      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        // Only redirect to auth if it's an authentication error
        if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
          router.push('/auth');
          return;
        }
        // For other errors, just show error message
        setError('Failed to load dashboard data. Please try refreshing.');
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        router.push('/auth');
      } else {
        setError('Failed to logout');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setError('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Ensure user exists before rendering layout
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        <p>Failed to load user data. Redirecting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <NotionLayout
        spaces={spaces || []}
        user={user}
        onLogout={handleLogout}
        onCreateSpace={async () => {
          const res = await fetch('/api/spaces', { credentials: 'include' });
          const data = await res.json();
          if (data.success) {
            setSpaces(data.spaces || []);
          }
        }}
        pageTitle="Dashboard"
        pageSubtitle="Manage your workspaces and tasks"
        breadcrumbs={[]}
        onRefreshSpaces={async () => {
          const res = await fetch('/api/spaces', { credentials: 'include' });
          const data = await res.json();
          if (data.success) {
            setSpaces(data.spaces || []);
          }
        }}
        actions={[]}
      >
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </NotionLayout>
    );
  }

  return (
    <NotionLayout
      spaces={spaces || []}
      user={user}
      onLogout={handleLogout}
      onCreateSpace={async () => {
        const res = await fetch('/api/spaces', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setSpaces(data.spaces || []);
        }
      }}
      pageTitle="Dashboard"
      pageSubtitle="Manage your workspaces and tasks"
      breadcrumbs={[]}
      onRefreshSpaces={async () => {
        const res = await fetch('/api/spaces', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setSpaces(data.spaces || []);
        }
      }}
      actions={[]}
      showSearch={true}
      onSearch={(query) => console.log('Search:', query)}
    >
      <div className="p-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="notion-card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Spaces</p>
                  <p className="text-2xl font-bold">{spaces.length}</p>
                </div>
                <div className="w-8 h-8 bg-notion-blue/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-notion-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="notion-card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <div className="w-8 h-8 bg-notion-green/10 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-notion-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="notion-card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Today</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <div className="w-8 h-8 bg-notion-orange/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-notion-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="notion-card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
                <div className="w-8 h-8 bg-notion-purple/10 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-notion-purple" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spaces List */}
        <div>
          <h2 className="notion-heading-2 mb-6">Your Workspaces</h2>
          <SpacesList />
        </div>
      </div>
    </NotionLayout>
  );
}
