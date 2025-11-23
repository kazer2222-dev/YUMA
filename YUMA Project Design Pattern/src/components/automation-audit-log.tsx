import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Filter,
  Calendar,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  Zap,
  Play,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";

interface AuditLogEntry {
  id: string;
  automationId: string;
  automationName: string;
  status: "success" | "failed" | "skipped";
  triggeredBy: string;
  triggerType: string;
  startTime: string;
  endTime: string;
  duration: number; // in milliseconds
  actionsExecuted: number;
  actionsFailed: number;
  errorMessage?: string;
  details: {
    trigger: string;
    conditions: string[];
    actions: Array<{
      type: string;
      status: "success" | "failed";
      message?: string;
    }>;
  };
}

// Mock data
const generateMockLogs = (): AuditLogEntry[] => {
  const automations = [
    { id: "1", name: "High Priority Alert" },
    { id: "2", name: "Auto-assign New Tasks" },
    { id: "3", name: "Weekly Status Report" },
    { id: "4", name: "Overdue Task Reminder" },
    { id: "5", name: "Sprint Auto-start" },
  ];

  const triggers = [
    { type: "task_created", label: "Task Created" },
    { type: "task_updated", label: "Task Updated" },
    { type: "scheduled_time", label: "Scheduled Time" },
    { type: "before_due_date", label: "Before Due Date" },
    { type: "workflow_transition", label: "Workflow Transition" },
  ];

  const now = new Date();
  const logs: AuditLogEntry[] = [];

  for (let i = 0; i < 50; i++) {
    const automation = automations[Math.floor(Math.random() * automations.length)];
    const trigger = triggers[Math.floor(Math.random() * triggers.length)];
    const status = Math.random() > 0.15 ? "success" : Math.random() > 0.5 ? "failed" : "skipped";
    const actionsCount = Math.floor(Math.random() * 5) + 1;
    const failedActions = status === "failed" ? Math.floor(Math.random() * actionsCount) : 0;
    const duration = Math.floor(Math.random() * 5000) + 100;

    const startTime = new Date(now.getTime() - i * 3600000 - Math.random() * 3600000);
    const endTime = new Date(startTime.getTime() + duration);

    logs.push({
      id: `log-${i}`,
      automationId: automation.id,
      automationName: automation.name,
      status,
      triggeredBy: trigger.label,
      triggerType: trigger.type,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      actionsExecuted: actionsCount - failedActions,
      actionsFailed: failedActions,
      errorMessage: status === "failed" ? "Action execution timeout" : undefined,
      details: {
        trigger: trigger.label,
        conditions: ["Priority is High", "Assignee is not set"],
        actions: Array.from({ length: actionsCount }, (_, idx) => ({
          type: ["Send Email", "Update Field", "Add Comment", "Send Notification"][
            idx % 4
          ],
          status: idx < failedActions ? "failed" : "success",
          message: idx < failedActions ? "Connection timeout" : undefined,
        })),
      },
    });
  }

  return logs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
};

export function AutomationAuditLog() {
  const [logs] = useState<AuditLogEntry[]>(generateMockLogs());
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [automationFilter, setAutomationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const getStatusIcon = (status: AuditLogEntry["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "skipped":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: AuditLogEntry["status"]) => {
    const variants = {
      success: "bg-green-500/20 text-green-500 border-green-500/30",
      failed: "bg-red-500/20 text-red-500 border-red-500/30",
      skipped: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    };

    return (
      <Badge
        variant="outline"
        className={`${variants[status]} border text-xs`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const filteredLogs = logs.filter((log) => {
    // Status filter
    if (statusFilter !== "all" && log.status !== statusFilter) return false;

    // Automation filter
    if (automationFilter !== "all" && log.automationId !== automationFilter) return false;

    // Search filter
    if (
      searchQuery &&
      !log.automationName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.triggeredBy.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Date filter
    if (dateFilter !== "all") {
      const logDate = new Date(log.startTime);
      const now = new Date();
      const diffHours = (now.getTime() - logDate.getTime()) / 3600000;

      if (dateFilter === "1h" && diffHours > 1) return false;
      if (dateFilter === "24h" && diffHours > 24) return false;
      if (dateFilter === "7d" && diffHours > 168) return false;
      if (dateFilter === "30d" && diffHours > 720) return false;
    }

    return true;
  });

  // Get unique automations from logs
  const uniqueAutomations = Array.from(
    new Map(
      logs.map((log) => [log.automationId, { id: log.automationId, name: log.automationName }])
    ).values()
  );

  const stats = {
    total: filteredLogs.length,
    success: filteredLogs.filter((l) => l.status === "success").length,
    failed: filteredLogs.filter((l) => l.status === "failed").length,
    skipped: filteredLogs.filter((l) => l.status === "skipped").length,
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl text-[var(--foreground)]">Automation Audit Log</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              View execution history and debug automation runs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[var(--border)] text-[var(--foreground)]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[var(--border)] text-[var(--foreground)]"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
            <div className="text-2xl text-[var(--foreground)]">{stats.total}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">Total Runs</div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
            <div className="text-2xl text-green-500">{stats.success}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">Successful</div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
            <div className="text-2xl text-red-500">{stats.failed}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">Failed</div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
            <div className="text-2xl text-orange-500">{stats.skipped}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">Skipped</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by automation name or trigger..."
              className="pl-10 bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
              <SelectItem value="all" className="text-[var(--foreground)]">
                All Status
              </SelectItem>
              <SelectItem value="success" className="text-[var(--foreground)]">
                Success
              </SelectItem>
              <SelectItem value="failed" className="text-[var(--foreground)]">
                Failed
              </SelectItem>
              <SelectItem value="skipped" className="text-[var(--foreground)]">
                Skipped
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={automationFilter} onValueChange={setAutomationFilter}>
            <SelectTrigger className="w-[150px] bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
              <Zap className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Automation" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
              <SelectItem value="all" className="text-[var(--foreground)]">
                All Automations
              </SelectItem>
              {uniqueAutomations.map((automation) => (
                <SelectItem key={automation.id} value={automation.id} className="text-[var(--foreground)]">
                  {automation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[150px] bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
              <SelectItem value="all" className="text-[var(--foreground)]">
                All Time
              </SelectItem>
              <SelectItem value="1h" className="text-[var(--foreground)]">
                Last Hour
              </SelectItem>
              <SelectItem value="24h" className="text-[var(--foreground)]">
                Last 24 Hours
              </SelectItem>
              <SelectItem value="7d" className="text-[var(--foreground)]">
                Last 7 Days
              </SelectItem>
              <SelectItem value="30d" className="text-[var(--foreground)]">
                Last 30 Days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Log Entries - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-12 h-12 text-[var(--muted-foreground)] mb-4" />
              <p className="text-[var(--foreground)] mb-2">No logs found</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden"
                >
                  {/* Log Header */}
                  <button
                    onClick={() =>
                      setExpandedLog(expandedLog === log.id ? null : log.id)
                    }
                    className="w-full p-4 flex items-center gap-4 hover:bg-[var(--muted)]/30 transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(log.status)}
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-5 gap-4">
                      <div className="col-span-2">
                        <div className="text-sm text-[var(--foreground)] mb-1">
                          {log.automationName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <Zap className="w-3 h-3" />
                          {log.triggeredBy}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-[var(--muted-foreground)] mb-1">
                          Status
                        </div>
                        {getStatusBadge(log.status)}
                      </div>

                      <div>
                        <div className="text-xs text-[var(--muted-foreground)] mb-1">
                          Actions
                        </div>
                        <div className="text-sm text-[var(--foreground)]">
                          {log.actionsExecuted}
                          {log.actionsFailed > 0 && (
                            <span className="text-red-500 ml-1">
                              ({log.actionsFailed} failed)
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-[var(--muted-foreground)] mb-1">
                          Time
                        </div>
                        <div className="text-sm text-[var(--foreground)]">
                          {formatRelativeTime(log.startTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {formatDuration(log.duration)}
                      </div>
                      {expandedLog === log.id ? (
                        <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedLog === log.id && (
                    <div className="border-t border-[var(--border)] p-4 bg-[var(--background)]/50">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm text-[var(--foreground)] mb-2">
                              Execution Details
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-[var(--muted-foreground)]">
                                  Start Time:
                                </span>
                                <span className="text-[var(--foreground)]">
                                  {formatDateTime(log.startTime)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[var(--muted-foreground)]">
                                  End Time:
                                </span>
                                <span className="text-[var(--foreground)]">
                                  {formatDateTime(log.endTime)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[var(--muted-foreground)]">
                                  Duration:
                                </span>
                                <span className="text-[var(--foreground)]">
                                  {formatDuration(log.duration)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[var(--muted-foreground)]">
                                  Automation ID:
                                </span>
                                <span className="text-[var(--foreground)] font-mono">
                                  {log.automationId}
                                </span>
                              </div>
                            </div>
                          </div>

                          {log.details.conditions.length > 0 && (
                            <div>
                              <h4 className="text-sm text-[var(--foreground)] mb-2">
                                Conditions Evaluated
                              </h4>
                              <div className="space-y-1">
                                {log.details.conditions.map((condition, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-[var(--muted-foreground)] flex items-center gap-2"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    {condition}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {log.errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-sm text-red-500 mb-1">
                                    Error Message
                                  </div>
                                  <div className="text-xs text-red-400">
                                    {log.errorMessage}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column - Actions */}
                        <div>
                          <h4 className="text-sm text-[var(--foreground)] mb-2">
                            Actions Executed
                          </h4>
                          <div className="space-y-2">
                            {log.details.actions.map((action, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg"
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  {action.status === "success" ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-[var(--foreground)] mb-1">
                                    {idx + 1}. {action.type}
                                  </div>
                                  {action.message && (
                                    <div className="text-xs text-red-400">
                                      {action.message}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}