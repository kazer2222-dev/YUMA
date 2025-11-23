export type WorkflowCategory = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface WorkflowStatusInput {
  key: string;
  name: string;
  category: WorkflowCategory;
  color?: string | null;
  isInitial?: boolean;
  isFinal?: boolean;
  order?: number;
  visibilityRules?: Record<string, any> | null;
  fieldLockRules?: Record<string, any> | null;
  statusRefId?: string | null;
}

export interface WorkflowTransitionInput {
  key?: string;
  name: string;
  fromKey: string;
  toKey: string;
  conditions?: Record<string, any> | null;
  validators?: Record<string, any> | null;
  postFunctions?: Record<string, any> | null;
  uiTrigger?: 'BUTTON' | 'MENU' | 'AI' | string;
  order?: number;
}

export interface WorkflowInput {
  spaceId: string;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  aiOptimized?: boolean;
  statuses: WorkflowStatusInput[];
  transitions: WorkflowTransitionInput[];
  linkedTemplateIds?: string[];
}

export interface WorkflowUpdateInput {
  name?: string;
  description?: string | null;
  isDefault?: boolean;
  aiOptimized?: boolean;
  statuses?: WorkflowStatusInput[];
  transitions?: WorkflowTransitionInput[];
  linkedTemplateIds?: string[];
}

export interface WorkflowSummary {
  id: string;
  spaceId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  aiOptimized: boolean;
  version: number;
  linkedTemplates: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowDetail extends WorkflowSummary {
  statuses: Array<{
    id: string;
    key: string;
    name: string;
    category: WorkflowCategory;
    color?: string | null;
    isInitial: boolean;
    isFinal: boolean;
    order: number;
    visibilityRules?: Record<string, any> | null;
    fieldLockRules?: Record<string, any> | null;
    statusRefId?: string | null;
  }>;
  transitions: Array<{
    id: string;
    key?: string;
    name: string;
    fromId: string;
    toId: string;
    fromKey: string;
    toKey: string;
    conditions?: Record<string, any> | null;
    validators?: Record<string, any> | null;
    postFunctions?: Record<string, any> | null;
    uiTrigger?: string | null;
    order: number;
  }>;
}
























