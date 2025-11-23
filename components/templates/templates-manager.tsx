'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, FileText, Trash2, X, Clock } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';
import { TemplateLibrary } from './template-library';
import { TemplateCreationWizard } from './template-creation-wizard';
import type { Template, TemplateField } from './template-types';

interface TemplatesManagerProps {
  spaceSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TemplatesManager({ spaceSlug, open, onOpenChange, onSuccess }: TemplatesManagerProps) {
  const { success, error: showError } = useToastHelpers();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplateIds, setActiveTemplateIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedBaseTemplate, setSelectedBaseTemplate] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, spaceSlug]);

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
        // Initialize all templates as active by default
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
    setLibraryOpen(true);
  };

  const handleTemplateSelected = (baseTemplate: any) => {
    setSelectedBaseTemplate(baseTemplate);
    setLibraryOpen(false);
    setWizardOpen(true);
  };

  const handleToggleTemplate = async (templateId: string, checked: boolean) => {
    const newActiveIds = new Set(activeTemplateIds);
    if (checked) {
      newActiveIds.add(templateId);
    } else {
      newActiveIds.delete(templateId);
    }
    setActiveTemplateIds(newActiveIds);
    
    // TODO: Call API to persist template active state
    // For now, just update UI optimistically
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
    setWizardOpen(false);
    setSelectedBaseTemplate(null);
    fetchTemplates();
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleWizardCancel = () => {
    setWizardOpen(false);
    setSelectedBaseTemplate(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Templates</DialogTitle>
            <DialogDescription>
              Manage task creation templates for this space. Toggle templates on or off to control availability.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No templates added yet</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                    Create your first template to streamline task creation with pre-configured fields and workflows.
                  </p>
                  <Button onClick={handleAddTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => {
                  const isActive = activeTemplateIds.has(template.id);
                  return (
                    <div
                      key={template.id}
                      className="group flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-base">{template.title}</h3>
                          {isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {template.fieldConfig?.length || 0} field{(template.fieldConfig?.length || 0) !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated {new Date(template.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`template-toggle-${template.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {isActive ? 'ON' : 'OFF'}
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
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {templates.length > 0 && (
            <div className="border-t pt-4">
              <Button onClick={handleAddTemplate} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Library */}
      {libraryOpen && (
        <TemplateLibrary
          spaceSlug={spaceSlug}
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          onTemplateSelected={handleTemplateSelected}
        />
      )}

      {/* Template Creation Wizard */}
      {wizardOpen && selectedBaseTemplate && (
        <TemplateCreationWizard
          spaceSlug={spaceSlug}
          baseTemplate={selectedBaseTemplate}
          open={wizardOpen}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      )}

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
