'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  FileText,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Zap,
  Layers,
  Search,
  Plus,
  Bug,
  ListTodo,
  Rocket,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/loading';
import { useToastHelpers } from '@/components/toast';

type SpaceMember = {
  id: string;
  role: string;
  joinedAt?: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
};

type SpaceStatus = {
  id: string;
  name: string;
  key: string;
  color?: string;
  isStart: boolean;
  isDone: boolean;
};

interface SpaceOverviewContentProps {
  space: {
    id: string;
    name: string;
    description?: string;
    slug: string;
    memberCount: number;
    taskCount: number;
    members: SpaceMember[];
    statuses: SpaceStatus[];
  };
  boards: Array<{
    id: string;
    name: string;
    description?: string;
    type?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  onOpenCreateBoard: () => void;
  onOpenTemplates: () => void;
  onOpenWorkflows: () => void;
  onNavigateToTab?: (tab: string, options?: { boardId?: string | null }) => void;
}

const WORKLOAD_COLORS = ['#10B981', '#3B82F6', '#8B5CF6'];

type TemplateCategory = 'bug' | 'feature' | 'task' | 'epic';

const TEMPLATE_CATEGORY_META: Record<
  TemplateCategory,
  { label: string; accent: string; badgeClass: string }
> = {
  bug: {
    label: 'Bug Reports',
    accent: '#EF4444',
    badgeClass: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
  },
  feature: {
    label: 'Features',
    accent: '#3B82F6',
    badgeClass: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30',
  },
  task: {
    label: 'Tasks',
    accent: '#10B981',
    badgeClass: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
  },
  epic: {
    label: 'Epics',
    accent: '#8B5CF6',
    badgeClass: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
  },
};

const SYSTEM_TEMPLATE_LIBRARY = [
  {
    id: 'system-bug',
    name: 'Bug Report',
    description: 'Severity-driven form with steps to reproduce and environment details.',
    fields: 12,
    category: 'bug' as TemplateCategory,
    icon: Bug,
  },
  {
    id: 'system-feature',
    name: 'Feature Request',
    description: 'Capture user stories, acceptance criteria, and success metrics.',
    fields: 10,
    category: 'feature' as TemplateCategory,
    icon: Lightbulb,
  },
  {
    id: 'system-task',
    name: 'Sprint Task',
    description: 'Lean template with priority, labels, and assignee fields pre-configured.',
    fields: 8,
    category: 'task' as TemplateCategory,
    icon: ListTodo,
  },
  {
    id: 'system-epic',
    name: 'Epic Planning',
    description: 'Milestone definition with goals, metrics, and linked stories.',
    fields: 15,
    category: 'epic' as TemplateCategory,
    icon: Rocket,
  },
];

type TemplateListItem = {
  id: string;
  title: string;
  fieldCount: number;
  updatedAt: string;
  sampleFields: string[];
  workflowLabel: string;
};

function getInitials(name?: string, email?: string) {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : 'NA';
}

export function SpaceOverviewContent({
  space,
  boards,
  onOpenCreateBoard,
  onOpenTemplates,
  onOpenWorkflows,
  onNavigateToTab,
}: SpaceOverviewContentProps) {
  const members = space.members ?? [];
  const memberCount = members.length || space.memberCount || 0;
  const statuses = space.statuses ?? [];
  const doneStatuses = statuses.filter((status) => status.isDone);
  const startStatuses = statuses.filter((status) => status.isStart);
  const inProgressStatuses = statuses.filter((status) => !status.isStart && !status.isDone);

  const workflowCompletion = statuses.length
    ? Math.round((doneStatuses.length / statuses.length) * 100)
    : 0;

  const topContributor = members.find((member) => member.role !== 'OWNER') ?? members[0];
  const needsSupport = members.slice().reverse().find((member) => member.role !== 'OWNER') ?? members[0];

  const tasksPerMember = Math.max(1, Math.round((space.taskCount || 0) / Math.max(1, memberCount)));
  const needsSupportTasks = Math.max(1, Math.round(tasksPerMember / 2));

  const workloadDistribution = useMemo(
    () => [
      { name: 'Done', value: Math.max(doneStatuses.length, 1) },
      { name: 'In Progress', value: Math.max(inProgressStatuses.length, 1) },
      { name: 'To Do', value: Math.max(startStatuses.length, 1) },
    ],
    [doneStatuses.length, inProgressStatuses.length, startStatuses.length],
  );

  const snapshotCards = [
    {
      id: 'tasks',
      value: (space.taskCount ?? 0).toLocaleString(),
      description: 'Total tasks currently tracked across every board.',
      accent: '#8B5CF6',
      icon: Sparkles,
    },
    {
      id: 'boards',
      value: boards.length ? `${boards.length} boards` : 'No boards',
      description: boards.length
        ? 'Monitor board progress and catch risks early.'
        : 'Create your first board to organise work visually.',
      accent: '#EF4444',
      icon: AlertTriangle,
    },
    {
      id: 'workflow',
      value: `${workflowCompletion}%`,
      description: `Workflow stages marked complete. Review remaining ${Math.max(
        0,
        100 - workflowCompletion,
      )}% in progress.`,
      accent: '#F59E0B',
      icon: Lightbulb,
    },
    {
      id: 'people',
      value: `${memberCount} ${memberCount === 1 ? 'person' : 'people'}`,
      description: 'Keep your team aligned with shared dashboards and automations.',
      accent: '#10B981',
      icon: Award,
    },
  ];

  const settingsCards = [
    {
      id: 'templates',
      title: 'Templates',
      description: 'Manage task templates',
      icon: FileText,
      color: '#8B5CF6',
      onClick: onOpenTemplates,
    },
    {
      id: 'workflows',
      title: 'Workflows',
      description: 'Customize workflows of templates',
      icon: Workflow,
      color: '#10B981',
      onClick: () => onOpenWorkflows(),
    },
    {
      id: 'automations',
      title: 'Automations',
      description: 'Automation and rules',
      icon: Zap,
      color: '#3B82F6',
      onClick: () => onNavigateToTab?.('integrations'),
    },
    {
      id: 'users',
      title: 'User management',
      description: 'Permissions and roles',
      icon: Users,
      color: '#F59E0B',
      onClick: () => onNavigateToTab?.('tasks'),
    },
  ];


  return (
    <div className="space-y-6">
      {/* AI Snapshot */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 p-6 pb-4">
        {snapshotCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="bg-gradient-to-br from-[var(--card)] to-[var(--background)] border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-[var(--primary)]/50"
              style={{
                borderColor: `${stat.accent}50`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className="w-5 h-5" style={{ color: stat.accent }} />
                <div className="text-3xl text-[var(--foreground)]">{stat.value}</div>
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                {stat.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6 pt-2">
        {/* Team Insights Section */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <div className="mb-2">
            <h2 className="flex items-center gap-2">
              <span>👥</span> Team Insights
            </h2>
          </div>
          <p className="text-[var(--muted-foreground)] mb-6">
            Here&apos;s how your team is performing this week
          </p>

          <div className="space-y-4">
            {/* Top Contributor Card */}
            <div className="p-4 bg-gradient-to-br from-[#10B981]/10 to-[#10B981]/5 rounded-lg border border-[#10B981]/30">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[var(--muted-foreground)] mb-1 text-xs">
                    Top Contributor
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-semibold">
                      {getInitials(topContributor?.user?.name, topContributor?.user?.email)}
                    </div>
                    <span className="text-[var(--foreground)] font-medium">
                      {topContributor?.user?.name || topContributor?.user?.email || 'Team Member'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-[#10B981] font-semibold">
                    {tasksPerMember}
                  </div>
                  <div className="text-[var(--muted-foreground)] text-xs">
                    tasks
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#10B981] text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+23% from last week</span>
              </div>
            </div>

            {/* Needs Support Card */}
            <div className="p-4 bg-gradient-to-br from-[#F59E0B]/10 to-[#F59E0B]/5 rounded-lg border border-[#F59E0B]/30">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[var(--muted-foreground)] mb-1 text-xs">
                    Needs Support
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#EC4899] flex items-center justify-center text-white text-sm font-semibold">
                      {getInitials(needsSupport?.user?.name, needsSupport?.user?.email)}
                    </div>
                    <span className="text-[var(--foreground)] font-medium">
                      {needsSupport?.user?.name || needsSupport?.user?.email || 'Team Member'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-[#F59E0B] font-semibold">
                    {needsSupportTasks}
                  </div>
                  <div className="text-[var(--muted-foreground)] text-xs">
                    task
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#F59E0B] text-sm">
                <Lightbulb className="w-4 h-4" />
                <span>Consider reassigning workload</span>
              </div>
            </div>

            {/* Workload Summary Card */}
            <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] mb-3">
                Workload Distribution
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workloadDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                      >
                        {workloadDistribution.map((entry, index) => (
                          <Cell key={entry.name} fill={WORKLOAD_COLORS[index % WORKLOAD_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {workloadDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: WORKLOAD_COLORS[index % WORKLOAD_COLORS.length] }}
                        />
                        <span className="text-[var(--muted-foreground)]">
                          {entry.name}
                        </span>
                      </div>
                      <span className="text-[var(--foreground)]">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* View All Members Button */}
            <button
              onClick={() => onNavigateToTab?.('tasks')}
              className="group w-full flex items-center justify-center gap-3 p-4 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-all duration-200 cursor-pointer text-white"
            >
              <Users className="w-5 h-5" />
              <span>View All Members</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Space Settings Section */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="mb-1">Space Settings</h2>
          <p className="text-[var(--muted-foreground)] mb-6">
            Configuration and permissions
          </p>

          <div className="space-y-2">
            {settingsCards.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="group w-full flex items-center gap-4 p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all duration-200 cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors duration-200"
                    style={{ backgroundColor: `${item.color}1A` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-[var(--foreground)] group-hover:text-[var(--foreground)] transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[var(--muted-foreground)]">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpaceTemplatesOverview({
  spaceSlug,
  onOpenTemplates,
}: {
  spaceSlug: string;
  onOpenTemplates: () => void;
}) {
  const { success } = useToastHelpers();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [activeTemplateIds, setActiveTemplateIds] = useState<string[]>([]);
  const [enabledSystemTemplates, setEnabledSystemTemplates] = useState<string[]>(['system-bug', 'system-feature']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!spaceSlug) return;
    let cancelled = false;
    async function fetchTemplates() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/spaces/${spaceSlug}/templates`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (cancelled) return;
        if (data.success) {
          const normalized: TemplateListItem[] = (data.templates ?? []).map((template: any) => {
            const fieldConfig = Array.isArray(template.fieldConfig) ? template.fieldConfig : [];
            const fieldLabels = fieldConfig
              .map((field: any) => field?.label || field?.inlineLabel || field?.name)
              .filter((label: unknown): label is string => Boolean(label && typeof label === 'string'))
              .slice(0, 3);
            return {
              id: template.id,
              title: template.title,
              fieldCount: fieldConfig.length,
              updatedAt: template.updatedAt,
              sampleFields: fieldLabels,
              workflowLabel: template.workflowId ? 'Custom workflow' : 'Default workflow',
            };
          });
          setTemplates(normalized);
          setActiveTemplateIds(normalized.map((template) => template.id));
        } else {
          setError(data.message || 'Unable to load templates for this space.');
        }
      } catch (err) {
        console.error('Failed to load templates', err);
        if (!cancelled) {
          setError('Unable to load templates for this space.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchTemplates();
    return () => {
      cancelled = true;
    };
  }, [spaceSlug]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSpaceTemplates = useMemo(() => {
    if (!normalizedQuery) return templates;
    return templates.filter(
      (template) =>
        template.title.toLowerCase().includes(normalizedQuery) ||
        template.sampleFields.some((field) => field.toLowerCase().includes(normalizedQuery)),
    );
  }, [templates, normalizedQuery]);

  const filteredSystemTemplates = useMemo(() => {
    if (!normalizedQuery) return SYSTEM_TEMPLATE_LIBRARY;
    return SYSTEM_TEMPLATE_LIBRARY.filter(
      (template) =>
        template.name.toLowerCase().includes(normalizedQuery) ||
        template.description.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const handleToggleSpaceTemplate = (templateId: string, enabled: boolean) => {
    setActiveTemplateIds((prev) =>
      enabled ? Array.from(new Set([...prev, templateId])) : prev.filter((id) => id !== templateId),
    );
    const template = templates.find((item) => item.id === templateId);
    if (template) {
      success(
        enabled ? 'Template enabled' : 'Template disabled',
        `${template.title} ${enabled ? 'is now available' : 'is hidden'} in this space`,
      );
    }
  };

  const handleToggleSystemTemplate = (templateId: string) => {
    setEnabledSystemTemplates((prev) => {
      const exists = prev.includes(templateId);
      const next = exists ? prev.filter((id) => id !== templateId) : [...prev, templateId];
      const template = SYSTEM_TEMPLATE_LIBRARY.find((item) => item.id === templateId);
      if (template) {
        success(
          exists ? 'Removed from space' : 'Added to space',
          `${template.name} ${exists ? 'removed from' : 'ready in'} your template list`,
        );
      }
      return next;
    });
  };

  const activeCount = activeTemplateIds.length;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#8B5CF6]">Templates</p>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mt-1">Templates overview</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Toggle availability, browse system templates, and create new ones without leaving the overview.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30">
              Active {activeCount}
            </Badge>
            <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30">
              Library {enabledSystemTemplates.length}/{SYSTEM_TEMPLATE_LIBRARY.length}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onOpenTemplates}
            className="border-[#8B5CF6]/40 text-[var(--foreground)] hover:bg-[#8B5CF6]/10"
          >
            Manage Templates
          </Button>
          <Button
            onClick={onOpenTemplates}
            className="bg-gradient-to-r from-[#4353FF] to-[#5B5FED] text-white hover:from-[#3343EF] hover:to-[#4B4FDD]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">Templates in this space</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Active templates stay in sync across every board.
            </p>
          </div>
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search templates"
              className="pl-9 bg-[var(--background)] border-[var(--border)] focus-visible:ring-[#8B5CF6]"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-[var(--border)]/60 p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))
          ) : filteredSpaceTemplates.length ? (
            filteredSpaceTemplates.map((template) => (
              <div
                key={template.id}
                className="group rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-4 transition hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-1 items-start gap-3">
                    <div className="rounded-xl bg-[#8B5CF6]/10 p-3 text-[#8B5CF6]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{template.title}</p>
                        <Badge className="bg-white/5 text-[var(--foreground)] border-white/10">
                          {template.fieldCount} fields
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2">
                        {template.sampleFields.length
                          ? `Includes ${template.sampleFields.join(', ')}`
                          : 'Reusable structure ready for task creation.'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
                        <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                        <span>{template.workflowLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {activeTemplateIds.includes(template.id) ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      checked={activeTemplateIds.includes(template.id)}
                      onCheckedChange={(checked) => handleToggleSpaceTemplate(template.id, Boolean(checked))}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--border)]/70 p-6 text-center">
              <p className="font-medium text-[var(--foreground)] mb-1">No templates match your search</p>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Create a new template or clear the search to view all templates in this space.
              </p>
              <Button onClick={onOpenTemplates} className="bg-[#4353FF] hover:bg-[#3343EF] text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">System template library</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Enable ready-made templates designed by the Yuma product team.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onOpenTemplates} className="text-[#4353FF] hover:text-white hover:bg-[#4353FF]">
            Open full library
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {filteredSystemTemplates.map((template) => {
            const Icon = template.icon;
            const meta = TEMPLATE_CATEGORY_META[template.category];
            const isEnabled = enabledSystemTemplates.includes(template.id);
            return (
              <div
                key={template.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-4 transition hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl p-3" style={{ backgroundColor: `${meta.accent}15` }}>
                      <Icon className="w-5 h-5" style={{ color: meta.accent }} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{template.name}</p>
                        <Badge className={`text-xs border ${meta.badgeClass}`}>{meta.label}</Badge>
                        <Badge className="text-xs bg-white/5 text-[var(--muted-foreground)] border-white/10">
                          {template.fields} fields
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">{template.description}</p>
                    </div>
                  </div>
                  <Button
                    variant={isEnabled ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleSystemTemplate(template.id)}
                    className={
                      isEnabled
                        ? 'bg-[#10B981]/20 text-[#065F46] border-[#10B981]/30 hover:bg-[#10B981]/30'
                        : 'border-[var(--border)] hover:border-[#8B5CF6] hover:text-[#8B5CF6]'
                    }
                  >
                    {isEnabled ? 'Added' : 'Add to space'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
