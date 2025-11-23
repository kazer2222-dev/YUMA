'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Calendar, User, Tag, Flag, Clock } from 'lucide-react';
import { formatDateDDMMYYYY } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { stripTemplateMetadata } from '@/lib/template-metadata';

interface Task {
  id: string;
  number: number;
  summary: string;
  description?: string;
  priority: string;
  tags: string[];
  dueDate?: string;
  estimate?: string;
  createdAt: string;
  updatedAt: string;
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
    color?: string;
  };
  customFieldValues: Array<{
    id: string;
    value: any;
    customField: {
      id: string;
      name: string;
      key: string;
      type: string;
    };
  }>;
  commentCount: number;
  attachmentCount: number;
}

function formatPriority(priority: string): string {
  const map: Record<string, string> = {
    HIGHEST: 'Highest',
    HIGH: 'High',
    NORMAL: 'Normal',
    LOW: 'Low',
    LOWEST: 'Lowest',
  };
  return map[priority] || priority;
}

interface Status {
  id: string;
  name: string;
  key: string;
  color?: string;
}

interface CustomField {
  id: string;
  name: string;
  key: string;
  type: string;
  options?: any;
  required: boolean;
}

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

interface TasksListProps {
  spaceSlug: string;
}

export function TasksList({ spaceSlug }: TasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [spaceTicker, setSpaceTicker] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [spaceSlug]);

  const fetchData = async () => {
    try {
      const [tasksRes, statusesRes, customFieldsRes, spaceRes] = await Promise.all([
        fetch(`/api/spaces/${spaceSlug}/tasks`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}/statuses`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}/custom-fields`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceSlug}`, { credentials: 'include' })
      ]);

      const [tasksData, statusesData, customFieldsData, spaceData] = await Promise.all([
        tasksRes.json(),
        statusesRes.json(),
        customFieldsRes.json(),
        spaceRes.json()
      ]);

      if (tasksData.success) setTasks(tasksData.tasks);
      if (statusesData.success) setStatuses(statusesData.statuses);
      if (spaceData.success) setSpaceTicker(spaceData.space.ticker || '');
      if (customFieldsData.success) setCustomFields(customFieldsData.customFields);

      // TODO: Fetch users from space members
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-muted-foreground">
            Manage and track your work
          </p>
        </div>
        <CreateTaskDialogUnified
          mode="inline"
          spaceSlug={spaceSlug}
          statuses={statuses}
          users={users}
          customFields={customFields}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onTaskCreated={() => fetchData()}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} spaceTicker={spaceTicker} />
        ))}
      </div>

      {tasks.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first task to start tracking your work
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const TaskCard = React.memo(function TaskCard({ task, spaceTicker }: { task: Task; spaceTicker?: string }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGHEST': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'HIGH': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
      case 'NORMAL': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'LOW': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'LOWEST': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {spaceTicker && task.number && (
              <div className="text-xs font-bold text-foreground mb-1" title={`Task Key: ${spaceTicker}-${task.number}`}>
                {spaceTicker}-{task.number}
              </div>
            )}
            <h3 className="font-semibold text-lg mb-2">{task.summary}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground">
                {stripTemplateMetadata(task.description)}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: task.status.color || '#6b7280' }}
                />
                <span>{task.status.name}</span>
              </div>
              
              {task.assignee && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{task.assignee.name || task.assignee.email}</span>
                </div>
              )}
              
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateDDMMYYYY(task.dueDate)}</span>
                </div>
              )}
              
              {task.estimate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{task.estimate}</span>
                </div>
              )}
            </div>

            {task.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1">
                  {task.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
              {formatPriority(task.priority)}
            </span>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TaskCard.displayName = 'TaskCard';


