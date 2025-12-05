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

// FR-2: Permission types for template access control
export type TemplatePermission = 'CREATE' | 'EDIT' | 'VIEW';

// Entity types that can be granted access
export type TemplateAccessEntityType = 'USER' | 'ROLE' | 'GROUP' | 'SPECIAL';

// Special entity types like "ALL_MEMBERS", "CREATOR", "ASSIGNEE"
export type SpecialEntityId = 'ALL_MEMBERS' | 'CREATOR' | 'ASSIGNEE' | 'SPACE_ADMINS';

// Access rule for a template
export interface TemplateAccessRule {
  id?: string;
  permission: TemplatePermission;
  entityType: TemplateAccessEntityType;
  entityId?: string | null; // User/Role/Group ID, null for SPECIAL types
  // Display fields (not stored in DB, populated on fetch)
  entityName?: string;
  entityEmail?: string; // For users
  entityColor?: string; // For roles/groups
}

// Grouped access rules by permission type
export interface TemplateAccessConfig {
  restrictAccess: boolean;
  createRules: TemplateAccessRule[];
  editRules: TemplateAccessRule[];
  viewRules: TemplateAccessRule[];
}

// Entity that can be selected for access (used in search results)
export interface AccessEntity {
  id: string;
  type: TemplateAccessEntityType;
  name: string;
  email?: string; // For users
  description?: string; // For roles/groups
  color?: string; // For roles/groups
  memberCount?: number; // For groups
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
  // Access control fields
  restrictAccess?: boolean;
  accessRules?: TemplateAccessRule[];
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

