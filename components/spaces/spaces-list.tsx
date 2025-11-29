'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateSpaceDialog } from './create-space-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loading, CardSkeleton } from '@/components/loading';
import { useToastHelpers } from '@/components/toast';
import { Plus, Users, Calendar, Settings, Building2, CheckSquare } from 'lucide-react';

interface Space {
  id: string;
  name: string;
  description?: string;
  slug: string;
  ticker: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  taskCount: number;
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name?: string;
      email: string;
      avatar?: string;
    };
  }>;
}

export function SpacesList() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { success, error: showError } = useToastHelpers();

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const response = await fetch('/api/spaces', { credentials: 'include' });
      const data = await response.json();

      if (data.success) {
        setSpaces(data.spaces);
      } else {
        const errorMessage = data.message || 'Failed to fetch spaces';
        setError(errorMessage);
        showError('Failed to load spaces', errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Failed to fetch spaces';
      setError(errorMessage);
      showError('Network Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {spaces.length === 0 ? (
        <Card className="notion-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-notion-gray rounded-2xl flex items-center justify-center mb-6">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="notion-heading-2 mb-2">No workspaces yet</h3>
            <p className="notion-text-muted text-center mb-6 max-w-md">
              Create your first workspace to start organizing your tasks and projects with your team.
            </p>
            <Button 
              className="notion-button-primary"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
            <CreateSpaceDialog 
              open={createDialogOpen} 
              onOpenChange={setCreateDialogOpen}
              onSpaceCreated={fetchSpaces}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      )}
    </div>
  );
}

function SpaceCard({ space }: { space: Space }) {
  const router = useRouter();
  return (
    <Card className="notion-card-hover group cursor-pointer" onClick={() => router.push(`/spaces/${space.slug}`)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-notion-blue/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-notion-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg group-hover:text-notion-blue transition-colors">
                {space.name}
              </CardTitle>
              {space.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {space.description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{space.memberCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <CheckSquare className="h-4 w-4" />
              <span>{space.taskCount} tasks</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(space.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              // Handle settings
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


