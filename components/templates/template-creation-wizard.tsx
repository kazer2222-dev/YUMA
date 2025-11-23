'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, X, Plus, Trash2, GripVertical, Settings } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';
import { WorkflowSelection } from './workflow-selection';
import { FieldConfigurationModal } from './field-configuration-modal';
import type { BaseTemplate, TemplateField } from './template-types';
import { useRouter } from 'next/navigation';

interface TemplateCreationWizardProps {
  spaceSlug: string;
  baseTemplate: BaseTemplate;
  open: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

const FIELD_TYPES = [
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date Picker' },
  { value: 'datetime', label: 'Date-Time Picker' },
  { value: 'labels', label: 'Labels' },
  { value: 'number', label: 'Number Field' },
  { value: 'paragraph', label: 'Paragraph (Multi-line Text)' },
  { value: 'radio', label: 'Radio Button' },
  { value: 'select', label: 'Select List (Single Choice)' },
  { value: 'multiselect', label: 'Select List (Multiple Choice)' },
  { value: 'url', label: 'URL Field' },
  { value: 'user', label: 'User Picker Field' },
];

// Default fields based on template category
const getDefaultFields = (category: string): TemplateField[] => {
  const baseFields: TemplateField[] = [
    {
      id: 'field-1',
      type: 'paragraph',
      label: 'Task Summary',
      required: true,
      order: 1,
    },
    {
      id: 'field-2',
      type: 'select',
      label: 'Priority Level',
      required: true,
      options: ['Highest', 'High', 'Normal', 'Low', 'Lowest'],
      order: 2,
    },
    {
      id: 'field-3',
      type: 'date',
      label: 'Due Date',
      required: false,
      order: 3,
    },
    {
      id: 'field-4',
      type: 'user',
      label: 'Assignee',
      required: false,
      order: 4,
    },
  ];

  if (category === 'bug') {
    return [
      ...baseFields,
      {
        id: 'field-5',
        type: 'paragraph',
        label: 'Steps to Reproduce',
        required: true,
        order: 5,
      },
      {
        id: 'field-6',
        type: 'select',
        label: 'Severity',
        required: true,
        options: ['Critical', 'High', 'Medium', 'Low'],
        order: 6,
      },
    ];
  }

  if (category === 'feature') {
    return [
      ...baseFields,
      {
        id: 'field-5',
        type: 'paragraph',
        label: 'User Story',
        required: true,
        order: 5,
      },
    ];
  }

  return baseFields;
};

export function TemplateCreationWizard({
  spaceSlug,
  baseTemplate,
  open,
  onComplete,
  onCancel,
}: TemplateCreationWizardProps) {
  const router = useRouter();
  const { success, error: showError } = useToastHelpers();
  const [step, setStep] = useState<1 | 2>(1);
  const [templateName, setTemplateName] = useState(baseTemplate.name);
  const [templateDescription, setTemplateDescription] = useState(baseTemplate.description || '');
  const [fields, setFields] = useState<TemplateField[]>(() => getDefaultFields(baseTemplate.category));
  const [fieldConfigOpen, setFieldConfigOpen] = useState(false);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [workflowSelectionOpen, setWorkflowSelectionOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [workflowChoice, setWorkflowChoice] = useState<'default' | 'custom' | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAddField = () => {
    setEditingField(null);
    setFieldConfigOpen(true);
  };

  const handleEditField = (field: TemplateField) => {
    setEditingField(field);
    setFieldConfigOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId).map((f, idx) => ({ ...f, order: idx + 1 })));
  };

  const handleFieldSaved = (field: TemplateField) => {
    if (editingField) {
      // Update existing field
      setFields((prev) =>
        prev.map((f) => (f.id === editingField.id ? { ...field, id: editingField.id } : f))
      );
    } else {
      // Add new field
      const newField = {
        ...field,
        id: `field-${Date.now()}`,
        order: fields.length + 1,
      };
      setFields((prev) => [...prev, newField]);
    }
    setFieldConfigOpen(false);
    setEditingField(null);
  };

  const handleContinue = () => {
    if (step === 1) {
      if (!templateName.trim()) {
        showError('Template name is required');
        return;
      }
      setStep(2);
    }
  };

  const handleWorkflowSelected = (choice: 'default' | 'custom', workflowId?: string | null) => {
    setWorkflowChoice(choice);
    if (choice === 'default') {
      handleSaveTemplate(null);
    } else if (choice === 'custom' && workflowId) {
      setSelectedWorkflowId(workflowId);
      handleSaveTemplate(workflowId);
    } else {
      // Custom workflow selected but no workflowId yet - open selection screen
      setWorkflowSelectionOpen(true);
    }
  };

  const handleWorkflowFromSelection = (workflowId: string | null) => {
    setSelectedWorkflowId(workflowId);
    setWorkflowSelectionOpen(false);
    handleSaveTemplate(workflowId);
  };

  const handleSaveTemplate = async (workflowId: string | null) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: templateName.trim(),
          fieldConfig: fields.map((f) => ({
            type: f.type,
            label: f.label,
            required: f.required,
            defaultValue: f.defaultValue,
            helpText: f.helpText,
            options: f.options,
            order: f.order,
          })),
          workflowId: workflowId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        success('Template created successfully');
        onComplete();
        // Redirect to Board Tab
        router.push(`/spaces/${spaceSlug}?view=board`);
      } else {
        showError(data.message || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      showError('Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (step === 1) {
      onCancel();
    } else {
      setStep(1);
    }
  };

  return (
    <>
      <Dialog open={open && !workflowSelectionOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? 'Create Template – Configure Fields' : 'Create Template – Select Workflow'}
            </DialogTitle>
            <DialogDescription>
              {step === 1
                ? 'Configure the fields for your template. Add, edit, or remove fields as needed.'
                : 'Choose how the template workflow will behave.'}
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Template Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Enter template description (optional)"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              {/* Fields Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Fields</h3>
                    <p className="text-sm text-muted-foreground">Configure the fields that will appear when creating tasks from this template</p>
                  </div>
                  <Button onClick={handleAddField} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <p>No fields added yet. Click "Add Field" to get started.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <Card key={field.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{field.label}</span>
                                {field.required && (
                                  <Badge variant="outline" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type}
                                </Badge>
                              </div>
                              {field.helpText && (
                                <p className="text-sm text-muted-foreground">{field.helpText}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditField(field)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteField(field.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <WorkflowSelection
                onSelect={handleWorkflowSelected}
                spaceSlug={spaceSlug}
                saving={saving}
              />
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 flex items-center justify-between">
            <Button variant="outline" onClick={handleCancel}>
              {step === 1 ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </>
              )}
            </Button>
            {step === 1 && (
              <Button onClick={handleContinue}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Field Configuration Modal */}
      {fieldConfigOpen && (
        <FieldConfigurationModal
          open={fieldConfigOpen}
          field={editingField}
          onSave={handleFieldSaved}
          onCancel={() => {
            setFieldConfigOpen(false);
            setEditingField(null);
          }}
        />
      )}

      {/* Workflow Selection Screen */}
      {workflowSelectionOpen && (
        <WorkflowSelection
          open={workflowSelectionOpen}
          onSelect={handleWorkflowFromSelection}
          onCancel={() => setWorkflowSelectionOpen(false)}
          spaceSlug={spaceSlug}
          mode="select"
        />
      )}
    </>
  );
}

