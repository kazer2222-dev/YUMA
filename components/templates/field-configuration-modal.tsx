'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Trash2 } from 'lucide-react';
import type { TemplateField } from './template-types';

interface FieldConfigurationModalProps {
  open: boolean;
  field: TemplateField | null;
  onSave: (field: TemplateField) => void;
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

const OPTION_FIELD_TYPES = ['radio', 'select', 'multiselect', 'checkbox'];

export function FieldConfigurationModal({ open, field, onSave, onCancel }: FieldConfigurationModalProps) {
  const [fieldType, setFieldType] = useState<TemplateField['type']>(field?.type || 'paragraph');
  const [label, setLabel] = useState(field?.label || '');
  const [required, setRequired] = useState(field?.required || false);
  const [helpText, setHelpText] = useState(field?.helpText || '');
  const [options, setOptions] = useState<string[]>(field?.options || []);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (field) {
      setFieldType(field.type);
      setLabel(field.label);
      setRequired(field.required);
      setHelpText(field.helpText || '');
      setOptions(field.options || []);
    } else {
      setFieldType('paragraph');
      setLabel('');
      setRequired(false);
      setHelpText('');
      setOptions([]);
    }
    setNewOption('');
  }, [field, open]);

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!label.trim()) {
      return;
    }

    const fieldData: TemplateField = {
      id: field?.id || '',
      type: fieldType,
      label: label.trim(),
      required,
      helpText: helpText.trim() || undefined,
      options: OPTION_FIELD_TYPES.includes(fieldType) && options.length > 0 ? options : undefined,
      order: field?.order || 0,
    };

    onSave(fieldData);
  };

  const needsOptions = OPTION_FIELD_TYPES.includes(fieldType);

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Field</DialogTitle>
          <DialogDescription>Define the field properties and settings</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Field Type */}
          <div>
            <Label htmlFor="field-type">Field Type</Label>
            <Select value={fieldType} onValueChange={(value) => setFieldType(value as TemplateField['type'])}>
              <SelectTrigger id="field-type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field Name */}
          <div>
            <Label htmlFor="field-label">
              Field Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="field-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter field title"
              className="mt-1"
            />
          </div>

          {/* Required Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="field-required">Required field</Label>
            <Switch id="field-required" checked={required} onCheckedChange={setRequired} />
          </div>

          {/* Help Text */}
          <div>
            <Label htmlFor="field-help">Help Text</Label>
            <Textarea
              id="field-help"
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              placeholder="Add descriptive help text (optional)"
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Options (for select, radio, multiselect, checkbox) */}
          {needsOptions && (
            <div>
              <Label>Options</Label>
              <div className="mt-2 space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={option} readOnly className="flex-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Enter option value"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleAddOption} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            Save Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}





