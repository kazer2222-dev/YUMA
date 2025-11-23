'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Loader2, 
  Download, 
  FileText, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  File
} from 'lucide-react';

interface ReportData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  topPerformers: Array<{
    name: string;
    completedTasks: number;
    email: string;
  }>;
  taskTrends: Array<{
    date: string;
    created: number;
    completed: number;
  }>;
  priorityDistribution: {
    highest: number;
    high: number;
    normal: number;
    low: number;
    lowest: number;
  };
}

interface Sprint {
  id: string;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  board?: {
    id: string;
    name: string;
  };
  tasks?: Array<{
    id: string;
    number: number;
    summary: string;
    priority: string;
    status?: {
      name: string;
      isDone: boolean;
    };
    assignee?: {
      name?: string;
      email: string;
    };
    storyPoints?: number;
  }>;
}

interface ReportingDashboardProps {
  spaceSlug?: string;
}

export function ReportingDashboard({ spaceSlug }: ReportingDashboardProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [exportFormat, setExportFormat] = useState('csv');
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [sprintsLoading, setSprintsLoading] = useState(false);

  const fetchSprints = useCallback(async () => {
    if (!spaceSlug) return;
    
    try {
      setSprintsLoading(true);
      const response = await fetch(`/api/spaces/${spaceSlug}/sprints`, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setSprints(data.sprints || []);
      }
    } catch (err) {
      console.error('Failed to fetch sprints:', err);
    } finally {
      setSprintsLoading(false);
    }
  }, [spaceSlug]);

  useEffect(() => {
    fetchReportData();
    if (spaceSlug) {
      fetchSprints();
    }
  }, [spaceSlug, dateRange, fetchSprints]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');

      const url = spaceSlug 
        ? `/api/spaces/${spaceSlug}/reports?days=${dateRange}`
        : `/api/reports/global?days=${dateRange}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
      } else {
        setError(data.message || 'Failed to fetch report data');
      }
    } catch (err) {
      setError('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: string) => {
    try {
      const url = spaceSlug 
        ? `/api/spaces/${spaceSlug}/reports/export?format=${format}&days=${dateRange}`
        : `/api/reports/export?format=${format}&days=${dateRange}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        const ext =
          format === 'csv' ? 'csv' :
          (format === 'xlsx' || format === 'xls' || format === 'excel') ? 'xls' :
          (format === 'pdf' ? 'pdf' : 'csv');
        link.download = `yuma-report-${new Date().toISOString().split('T')[0]}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        setError('Failed to export report');
      }
    } catch (err) {
      setError('Failed to export report');
    }
  };

  const getCompletionRate = () => {
    if (!reportData) return 0;
    return Math.round((reportData.completedTasks / reportData.totalTasks) * 100);
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Reports & Analytics
          </h2>
          <p className="text-muted-foreground">
            {spaceSlug ? 'Analytics and reports for this space' : 'Global analytics and reports'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => exportReport(exportFormat)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {getCompletionRate()}% completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportData?.completedTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reportData?.inProgressTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reportData?.overdueTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Most productive team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData?.topPerformers.slice(0, 5).map((performer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {performer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">{performer.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {performer.completedTasks} tasks
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>
              Task priority breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Highest</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${(reportData?.priorityDistribution.highest || 0) / (reportData?.totalTasks || 1) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{reportData?.priorityDistribution.highest || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">High</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full" 
                      style={{ width: `${(reportData?.priorityDistribution.high || 0) / (reportData?.totalTasks || 1) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{reportData?.priorityDistribution.high || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Normal</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(reportData?.priorityDistribution.normal || 0) / (reportData?.totalTasks || 1) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{reportData?.priorityDistribution.normal || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Low</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(reportData?.priorityDistribution.low || 0) / (reportData?.totalTasks || 1) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{reportData?.priorityDistribution.low || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Lowest</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-600 h-2 rounded-full" 
                      style={{ width: `${(reportData?.priorityDistribution.lowest || 0) / (reportData?.totalTasks || 1) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{reportData?.priorityDistribution.lowest || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sprint Reports */}
      {spaceSlug && (
        <Card>
          <CardHeader>
            <CardTitle>Sprint Reports</CardTitle>
            <CardDescription>
              View tasks from completed sprints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Sprint</label>
              <Select 
                value={selectedSprintId} 
                onValueChange={setSelectedSprintId}
                disabled={sprintsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={sprintsLoading ? "Loading sprints..." : "Choose a sprint"} />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name} {sprint.state === 'COMPLETED' ? '(Completed)' : sprint.state === 'ACTIVE' ? '(Active)' : ''}
                      {sprint.board?.name ? ` - ${sprint.board.name}` : ''}
                    </SelectItem>
                  ))}
                  {sprints.length === 0 && !sprintsLoading && (
                    <SelectItem value="no-sprints" disabled>No sprints available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedSprintId && (() => {
              const selectedSprint = sprints.find(s => s.id === selectedSprintId);
              if (!selectedSprint || !selectedSprint.tasks || selectedSprint.tasks.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks found in this sprint
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Task</th>
                        <th className="text-left p-3 font-semibold">Summary</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-left p-3 font-semibold">Assignee</th>
                        <th className="text-left p-3 font-semibold">Priority</th>
                        <th className="text-left p-3 font-semibold">Story Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSprint.tasks.map((task) => (
                        <tr key={task.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <span className="font-mono text-sm">#{task.number}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{task.summary}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant={task.status?.isDone ? "default" : "secondary"}>
                              {task.status?.name || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{task.assignee?.name || task.assignee?.email || 'Unassigned'}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{task.priority || 'NORMAL'}</Badge>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{task.storyPoints || '-'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>
            Download detailed reports in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center gap-2"
              onClick={() => exportReport('csv')}
            >
              <FileSpreadsheet className="h-6 w-6" />
              <span>CSV Data</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center gap-2"
              onClick={() => exportReport('xlsx')}
            >
              <FileSpreadsheet className="h-6 w-6" />
              <span>Excel Report</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center gap-2"
              onClick={() => exportReport('pdf')}
            >
              <File className="h-6 w-6" />
              <span>PDF Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
