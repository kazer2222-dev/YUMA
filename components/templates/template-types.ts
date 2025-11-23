export interface TemplateField {
  id: string;
  type: 'checkbox' | 'date' | 'datetime' | 'labels' | 'number' | 'paragraph' | 'radio' | 'select' | 'multiselect' | 'url' | 'user';
  label: string;
  required: boolean;
  defaultValue?: any;
  helpText?: string;
  options?: string[]; // For radio, select, multiselect
  order: number;
  customFieldId?: string;
  customFieldKey?: string;
  customFieldType?: string;
  inlineLabel?: string;
}

export interface Template {
  id: string;
  title: string;
  fieldConfig: TemplateField[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  workflowId?: string | null;
}

export interface BaseTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'bug' | 'feature' | 'task' | 'epic' | 'custom';
  color: string;
  icon: string;
  fieldCount: number;
  isSystem?: boolean;
}





