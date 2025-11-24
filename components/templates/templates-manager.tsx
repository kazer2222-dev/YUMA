'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Trash2, X, Clock, ArrowLeft, Search, Bug, Lightbulb, ListTodo, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToastHelpers } from '@/components/toast';
import { TemplateCreationWizard } from './template-creation-wizard';
import type { Template, TemplateField, BaseTemplate } from './template-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TemplatesManagerProps {
  spaceSlug: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  standalone?: boolean;
  onBack?: () => void;
}

const SYSTEM_TEMPLATES: BaseTemplate[] = [
  {
    id: 'system-bug',
    name: 'Bug Report',
    description: 'Report and track software bugs',
    category: 'bug',
    color: '#ef4444',
    icon: 'bug',
    fieldCount: 7,
    isSystem: true,
  },
  {
    id: 'system-feature',
    name: 'Feature Request',
    description: 'Submit new feature ideas',
    category: 'feature',
    color: '#3b82f6',
    icon: 'lightbulb',
    fieldCount: 6,
    isSystem: true,
  },
  {
    id: 'system-task',
    name: 'Sprint Task',
    description: 'Standard sprint task template',
    category: 'task',
    color: '#10b981',
    icon: 'task',
    fieldCount: 5,
    isSystem: true,
  },
  {
    id: 'system-epic',
    name: 'Epic Planning',
    description: 'Large initiatives and epics',
    category: 'epic',
    color: '#8b5cf6',
    icon: 'epic',
    fieldCount: 8,
    isSystem: true,
  },
];

const templateIcons = {
  bug: Bug,
  feature: Lightbulb,
  task: ListTodo,
  epic: Rocket,
  custom: FileText,
};

const categoryColors = {
  bug: 'bg-red-500/10 text-red-600 border-red-500/30',
  feature: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  task: 'bg-green-500/10 text-green-600 border-green-500/30',
  epic: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  custom: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
};

const categoryLabels = {
  bug: 'Bug Reports',
  feature: 'Features',
  task: 'Tasks',
  epic: 'Epics',
  custom: 'Custom',
};

export function TemplatesManager({
  spaceSlug,
  open,
  onOpenChange,
  onSuccess,
  standalone = false,
  onBack,
}: TemplatesManagerProps) {
  const { success, error: showError } = useToastHelpers();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplateIds, setActiveTemplateIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'activeTemplates' | 'library' | 'create'>('activeTemplates');
  const [selectedBaseTemplate, setSelectedBaseTemplate] = useState<BaseTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (standalone || open) {
      fetchTemplates();
    }
  }, [standalone, open, spaceSlug]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/templates`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        const fetchedTemplates = data.templates || [];
        setTemplates(fetchedTemplates);
        setActiveTemplateIds(new Set(fetchedTemplates.map((t: Template) => t.id)));
      } else {
        showError(data.message || 'Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      showError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = () => {
    setCurrentView('library');
  };

  const handleTemplateSelected = (baseTemplate: BaseTemplate) => {
    setSelectedBaseTemplate(baseTemplate);
    setCurrentView('create');
  };

  const handleToggleTemplate = async (templateId: string, checked: boolean) => {
    const newActiveIds = new Set(activeTemplateIds);
    if (checked) {
      newActiveIds.add(templateId);
    } else {
      newActiveIds.delete(templateId);
    }
    setActiveTemplateIds(newActiveIds);
    success(checked ? 'Template activated' : 'Template deactivated');
  };

  const handleDelete = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/templates/${templateToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        success(data.message || 'Template deleted successfully');
        fetchTemplates();
      } else {
        showError(data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      showError('Failed to delete template');
    } finally {
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleWizardComplete = () => {
    setCurrentView('activeTemplates');
    setSelectedBaseTemplate(null);
    fetchTemplates();
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleWizardCancel = () => {
    setCurrentView('activeTemplates');
    setSelectedBaseTemplate(null);
  };

  // Filter templates for library view
  const filteredTemplates = useMemo(() => {
    let filtered = SYSTEM_TEMPLATES;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          categoryLabels[t.category].toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const categories = [
    { id: 'all', label: 'All Templates', count: SYSTEM_TEMPLATES.length },
    { id: 'bug', label: 'Bug Reports', count: SYSTEM_TEMPLATES.filter((t) => t.category === 'bug').length },
    { id: 'feature', label: 'Features', count: SYSTEM_TEMPLATES.filter((t) => t.category === 'feature').length },
    { id: 'task', label: 'Tasks', count: SYSTEM_TEMPLATES.filter((t) => t.category === 'task').length },
    { id: 'epic', label: 'Epics', count: SYSTEM_TEMPLATES.filter((t) => t.category === 'epic').length },
  ];

  // Render Active Templates View
  const renderActiveTemplatesView = () => (
    <>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-2">
              {standalone && onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="h-8 px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Overview</span>
                </Button>
              )}
              <h2 className="text-[var(--foreground)] m-0 text-xl font-semibold">Templates</h2>
              <Button
                onClick={handleAddTemplate}
                className="group relative gap-2 h-9 px-4 bg-[#4353ff] hover:bg-[#3343ef] text-white text-xs shadow-lg shadow-[#4353ff]/20 hover:shadow-[#4353ff]/40 transition-all duration-300 ml-auto overflow-hidden border border-[#4353ff]/50 hover:border-[#4353ff]/70"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <Plus className="relative w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative">Add Template</span>
              </Button>
            </div>
            <p className="text-[var(--muted-foreground)] text-xs leading-relaxed m-0">
              Manage templates in this space. Toggle templates on or off to control availability.
            </p>
          </div>
          {!standalone && onOpenChange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 p-0 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-[var(--muted)]/50 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
            <h3 className="text-[var(--foreground)] mb-2 text-lg font-semibold">No templates added yet</h3>
            <p className="text-[var(--muted-foreground)] text-sm text-center max-w-sm mb-6">
              Create your first template to streamline task creation with pre-configured fields and workflows.
            </p>
            <Button onClick={handleAddTemplate} className="h-9 px-4 bg-[#4353ff] hover:bg-[#3343ef] text-white text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {templates.map((template) => {
              const isActive = activeTemplateIds.has(template.id);
              return (
                <div
                  key={template.id}
                  className={`group relative bg-[var(--card)] rounded-lg border transition-all duration-200 p-4 ${
                    isActive
                      ? 'border-[var(--border)] hover:border-[#4353ff]/50'
                      : 'border-[var(--border)]/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[var(--foreground)] text-sm font-semibold m-0">{template.title}</h3>
                          {isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] mt-2">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {template.fieldConfig?.length || 0} field{(template.fieldConfig?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Updated {new Date(template.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`template-toggle-${template.id}`}
                          className="text-xs text-[var(--muted-foreground)] cursor-pointer"
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Label>
                        <Switch
                          id={`template-toggle-${template.id}`}
                          checked={isActive}
                          onCheckedChange={(checked) => handleToggleTemplate(template.id, checked)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template)}
                        className="h-8 w-8 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  // Render Template Library View
  const renderLibraryView = () => (
    <>
      {/* Header with Back Button */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('activeTemplates')}
            className="h-8 px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Active Templates</span>
          </Button>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-[#4353ff]" />
              <h2 className="text-[var(--foreground)] m-0 text-xl font-semibold">Template Library</h2>
            </div>
            <p className="text-[var(--muted-foreground)] text-xs leading-relaxed m-0">
              Streamline task creation with pre-configured templates. Choose from our library or create custom templates tailored to your workflow.
            </p>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Search Field */}
        <div className="mt-4 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[#4353ff] focus:ring-1 focus:ring-[#4353ff] h-9 text-sm"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all flex-shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-[#4353ff] text-white shadow-lg shadow-[#4353ff]/20'
                  : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-xs opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <p>No templates found matching your search.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => {
              const Icon = templateIcons[template.category];
              return (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-[#4353ff] transition-colors"
                  onClick={() => handleTemplateSelected(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${template.color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: template.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1">{template.name}</h3>
                        <p className="text-sm text-[var(--muted-foreground)]">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={categoryColors[template.category]}>
                        {categoryLabels[template.category]}
                      </Badge>
                      <span className="text-xs text-[var(--muted-foreground)]">{template.fieldCount} fields</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  const content = (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
      {currentView === 'activeTemplates' && renderActiveTemplatesView()}
      {currentView === 'library' && renderLibraryView()}
      {currentView === 'create' && selectedBaseTemplate && (
        <TemplateCreationWizard
          spaceSlug={spaceSlug}
          baseTemplate={selectedBaseTemplate}
          open={true}
          standalone={true}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      )}
    </div>
  );

  if (standalone) {
    return (
      <>
        {content}
        {/* Delete Confirmation */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this template? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={open || false} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Templates</DialogTitle>
            <DialogDescription>
              Manage task creation templates for this space. Toggle templates on or off to control availability.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
