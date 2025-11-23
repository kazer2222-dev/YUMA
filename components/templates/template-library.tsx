'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft, Bug, Lightbulb, ListTodo, Rocket, FileText, X } from 'lucide-react';
import type { BaseTemplate } from './template-types';

interface TemplateLibraryProps {
  spaceSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelected: (template: BaseTemplate) => void;
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

export function TemplateLibrary({ spaceSlug, open, onOpenChange, onTemplateSelected }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates = useMemo(() => {
    let filtered = SYSTEM_TEMPLATES;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
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

  const handleTemplateClick = (template: BaseTemplate) => {
    onTemplateSelected(template);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Template Library</DialogTitle>
          <DialogDescription>
            Browse and select a template to add to your space. You'll configure fields and workflow next.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No templates found matching your search.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => {
                const Icon = templateIcons[template.category];
                return (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleTemplateClick(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${template.color}20` }}
                            >
                              <Icon className="h-5 w-5" style={{ color: template.color }} />
                            </div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                          </div>
                          <CardDescription className="text-sm">{template.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className={categoryColors[template.category]}>
                          {categoryLabels[template.category]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{template.fieldCount} fields</span>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}





