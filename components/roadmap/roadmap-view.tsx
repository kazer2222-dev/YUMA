'use client';

import { useState, useEffect, useCallback } from 'react';
import { RoadmapTimeline } from './roadmap-timeline';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface RoadmapItem {
  id: string;
  number?: number;
  title: string;
  summary?: string;
  description?: string;
  startDate: string | Date;
  endDate: string | Date;
  dueDate?: string | Date;
  progress: number;
  priority: string;
  status?: {
    id: string;
    name: string;
    color?: string;
  } | string;
  assignee?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  parentId?: string;
  children: RoadmapItem[];
  space: {
    id: string;
    name: string;
    slug: string;
    ticker?: string;
  };
}

interface RoadmapViewProps {
  spaceSlug?: string;
}

export function RoadmapView({ spaceSlug }: RoadmapViewProps) {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statuses, setStatuses] = useState<Array<{ id: string; name: string; color?: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name?: string; email: string }>>([]);

  const fetchStatusesAndUsers = useCallback(async () => {
    if (!spaceSlug) return;
    
    try {
      // Fetch statuses from first board or space statuses
      const statusesRes = await fetch(`/api/spaces/${spaceSlug}/statuses`, { credentials: 'include' });
      if (statusesRes.ok) {
        const statusesData = await statusesRes.json();
        if (statusesData.success) {
          setStatuses(statusesData.statuses.map((s: any) => ({
            id: s.id,
            name: s.name,
            color: s.color
          })));
        }
      }
      
      // Fetch users (space members)
      const usersRes = await fetch(`/api/spaces/${spaceSlug}/members`, { credentials: 'include' });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.members.map((m: any) => m.user));
        }
      }
    } catch (err) {
      console.error('Failed to fetch statuses and users:', err);
    }
  }, [spaceSlug]);

  const fetchRoadmapData = useCallback(async () => {
    try {
      setLoading(true);
      const url = spaceSlug 
        ? `/api/spaces/${spaceSlug}/roadmap`
        : '/api/roadmap/global';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setRoadmapItems(data.items || []);
      } else {
        setError(data.message || 'Failed to fetch roadmap data');
      }
    } catch (err) {
      setError('Failed to fetch roadmap data');
    } finally {
      setLoading(false);
    }
  }, [spaceSlug]);

  useEffect(() => {
    fetchRoadmapData();
  }, [fetchRoadmapData]);

  useEffect(() => {
    fetchStatusesAndUsers();
  }, [fetchStatusesAndUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl mb-1">Roadmap</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {spaceSlug ? 'Project roadmap for this space' : 'Global roadmap across all spaces'}
          </p>
        </div>
      </div>

      {/* Timeline Component */}
      <div className="flex-1 overflow-hidden">
          <RoadmapTimeline 
          tasks={roadmapItems.map(item => {
            // Map the item to match the Task type expected by RoadmapTimeline
            const taskStartDate = item.startDate ? new Date(item.startDate) : (item.dueDate ? new Date(item.dueDate) : new Date());
            const taskEndDate = item.dueDate ? new Date(item.dueDate) : (item.endDate ? new Date(item.endDate) : (item.startDate ? new Date(item.startDate) : new Date()));
            
            return {
              id: item.id,
              number: item.number,
              summary: item.summary || item.title,
              description: item.description,
              startDate: taskStartDate.toISOString().split('T')[0],
              dueDate: taskEndDate.toISOString().split('T')[0],
              status: typeof item.status === 'object' ? {
                id: item.status.id,
                name: item.status.name,
                color: item.status.color || undefined
              } : (item.status ? {
                id: item.status,
                name: item.status,
                color: undefined
              } : undefined),
              assignee: item.assignee,
              priority: item.priority || 'NORMAL',
              progress: item.progress,
              parentId: item.parentId,
              space: {
                ...item.space,
                ticker: item.space.ticker || item.space.slug || 'SPACE'
              }
            };
          })}
            spaceSlug={spaceSlug || ''}
            statuses={statuses}
            users={users}
            onTasksChange={() => {
            // Only refetch on explicit refresh, not after every update
            // Optimistic updates handle the UI, so we don't need to refetch
            // This prevents the screen refresh/flash
          }}
            onTaskUpdate={async (taskId, updates) => {
              // Store original values for rollback
              const originalItem = roadmapItems.find(item => item.id === taskId);
              const rollbackData = originalItem ? {
                startDate: originalItem.startDate,
                endDate: originalItem.endDate,
                dueDate: originalItem.dueDate
              } : null;
              
              // Update local state immediately (optimistic update)
              setRoadmapItems(prevItems => {
                return prevItems.map(item => {
                  if (item.id === taskId) {
                    const updated = { ...item };
                    if (updates.startDate) {
                    // Convert Date to ISO string for storage
                    updated.startDate = typeof updates.startDate === 'string' 
                      ? updates.startDate 
                      : updates.startDate.toISOString();
                    }
                    if (updates.dueDate) {
                    // Convert Date to ISO string for storage
                    const dueDateStr = typeof updates.dueDate === 'string'
                      ? updates.dueDate
                      : updates.dueDate.toISOString();
                    updated.dueDate = dueDateStr;
                    updated.endDate = dueDateStr; // Keep endDate in sync
                    }
                    return updated;
                  }
                  // Recursively update children
                  if (item.children && item.children.length > 0) {
                    return {
                      ...item,
                      children: item.children.map(child => {
                        if (child.id === taskId) {
                          const updated = { ...child };
                          if (updates.startDate) {
                          // Convert Date to ISO string for storage
                          updated.startDate = typeof updates.startDate === 'string'
                            ? updates.startDate
                            : updates.startDate.toISOString();
                          }
                          if (updates.dueDate) {
                          // Convert Date to ISO string for storage
                          const dueDateStr = typeof updates.dueDate === 'string'
                            ? updates.dueDate
                            : updates.dueDate.toISOString();
                          updated.dueDate = dueDateStr;
                          updated.endDate = dueDateStr;
                          }
                          return updated;
                        }
                        return child;
                      })
                    };
                  }
                  return item;
                });
              });
              
              // Send async API request in background
              try {
                const updateBody: any = {};
                if (updates.dueDate) {
                  updateBody.dueDate = updates.dueDate.toISOString().split('T')[0];
                }
                if (updates.startDate) {
                  updateBody.startDate = updates.startDate.toISOString().split('T')[0];
                }
                
                const response = await fetch(`/api/spaces/${spaceSlug}/tasks/${taskId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(updateBody)
                });
                
                if (response.ok) {
                  const data = await response.json();
                  if (!data.success) {
                    throw new Error(data.message || 'Failed to update task dates');
                  }
                  // Success - no need to refetch, state already updated
                } else {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Unknown error');
                }
              } catch (err: any) {
                console.error('Failed to update task:', err);
                
                // Rollback to original values on error
                if (rollbackData) {
                  setRoadmapItems(prevItems => {
                    return prevItems.map(item => {
                      if (item.id === taskId) {
                        return {
                          ...item,
                          startDate: rollbackData.startDate,
                          endDate: rollbackData.endDate,
                          dueDate: rollbackData.dueDate
                        };
                      }
                      if (item.children && item.children.length > 0) {
                        return {
                          ...item,
                          children: item.children.map(child => {
                            if (child.id === taskId) {
                              return {
                                ...child,
                                startDate: rollbackData.startDate,
                                endDate: rollbackData.endDate,
                                dueDate: rollbackData.dueDate
                              };
                            }
                            return child;
                          })
                        };
                      }
                      return item;
                    });
                  });
                }
                
                throw err; // Re-throw so the timeline component can handle it
              }
            }}
          />
        </div>
    </div>
  );
}
