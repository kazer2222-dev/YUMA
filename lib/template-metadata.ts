export type TemplateFieldType =
  | 'checkbox'
  | 'date'
  | 'datetime'
  | 'labels'
  | 'number'
  | 'paragraph'
  | 'radio'
  | 'select'
  | 'multiselect'
  | 'url'
  | 'user';

export interface TemplateFieldDefinition {
  id: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  options?: string[];
  order?: number;
  customFieldId?: string;
  customFieldKey?: string;
  customFieldType?: string;
}

export interface TemplateDefinition {
  id?: string;
  title?: string;
  fields: TemplateFieldDefinition[];
}

export interface SimpleUser {
  id: string;
  name?: string;
  email: string;
}

export interface TemplateFieldMetadata {
  id: string;
  label: string;
  type: TemplateFieldType;
  value: any;
  displayValue?: string;
}

export interface TemplateMetadata {
  templateId?: string;
  templateTitle?: string;
  summaryText?: string;
  fields: TemplateFieldMetadata[];
}

const TEMPLATE_METADATA_REGEX = /<!--template-fields:([A-Za-z0-9+/=]+)-->\s*$/;

function encodeBase64(input: string): string {
  try {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(input);
      let binary = '';
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      return window.btoa(binary);
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(input, 'utf-8').toString('base64');
    }
  } catch (error) {
    console.error('[TemplateMetadata] Failed to encode base64:', error);
  }
  return '';
}

function decodeBase64(input: string): string | null {
  try {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      const binary = window.atob(input);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(input, 'base64').toString('utf-8');
    }
  } catch (error) {
    console.error('[TemplateMetadata] Failed to decode base64:', error);
  }
  return null;
}

export function encodeTemplateMetadata(metadata: TemplateMetadata): string {
  try {
    const json = JSON.stringify(metadata);
    return encodeBase64(json);
  } catch (error) {
    console.error('[TemplateMetadata] Failed to encode metadata:', error);
    return '';
  }
}

export function decodeTemplateMetadata(encoded: string): TemplateMetadata | null {
  try {
    const json = decodeBase64(encoded);
    if (!json) return null;
    const metadata = JSON.parse(json) as TemplateMetadata;
    metadata.fields = Array.isArray(metadata.fields) ? metadata.fields : [];
    return metadata;
  } catch (error) {
    console.error('[TemplateMetadata] Failed to decode metadata:', error);
    return null;
  }
}

export function generateTemplateSummary(metadata: TemplateMetadata): string {
  if (!metadata.fields || metadata.fields.length === 0) return '';
  return metadata.fields
    .map((field) => {
      const display = field.displayValue ?? formatTemplateFieldValue({
        id: field.id,
        label: field.label,
        type: field.type
      }, field.value);
      return `**${field.label}**: ${display ?? ''}`;
    })
    .join('\n');
}

export function extractTemplateMetadata(description: string): {
  description: string;
  metadata: TemplateMetadata | null;
} {
  if (!description) {
    return { description: '', metadata: null };
  }

  const match = description.match(TEMPLATE_METADATA_REGEX);
  if (!match) {
    return { description, metadata: null };
  }

  const encoded = match[1];
  const metadata = decodeTemplateMetadata(encoded);
  let cleanedDescription = description.replace(TEMPLATE_METADATA_REGEX, '').trimEnd();

  if (metadata) {
    if (!metadata.summaryText || metadata.summaryText.length === 0) {
      metadata.summaryText = generateTemplateSummary(metadata);
    }

    if (metadata.summaryText) {
      const summary = metadata.summaryText.trim();
      const trimmedDescription = cleanedDescription.trimEnd();
      if (summary && trimmedDescription.endsWith(summary)) {
        cleanedDescription = trimmedDescription.slice(0, trimmedDescription.length - summary.length).trimEnd();
      }
    }
  }

  return { description: cleanedDescription, metadata };
}

export function applyTemplateMetadata(description: string, metadata: TemplateMetadata | null): string {
  if (!metadata || !metadata.fields || metadata.fields.length === 0) {
    return description;
  }

  const summary = (metadata.summaryText && metadata.summaryText.trim().length > 0)
    ? metadata.summaryText
    : generateTemplateSummary(metadata);

  let output = description.trimEnd();
  if (summary) {
    output = output ? `${output}\n\n${summary}` : summary;
  }

  const encoded = encodeTemplateMetadata({ ...metadata, summaryText: summary });
  if (encoded) {
    output = `${output}\n\n<!--template-fields:${encoded}-->`;
  }

  return output;
}

export function stripTemplateMetadata(description: string): string {
  return extractTemplateMetadata(description).description;
}

export function normalizeTemplateFieldValue(field: TemplateFieldDefinition, rawValue: any): any {
  switch (field.type) {
    case 'checkbox': {
      const hasOptions = Array.isArray(field.options) && field.options.length > 0;
      if (hasOptions) {
        if (Array.isArray(rawValue)) {
          return rawValue.filter((value) => typeof value === 'string' && value.trim().length > 0);
        }
        if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
          return [rawValue.trim()];
        }
        return [];
      }
      return Boolean(rawValue);
    }
    case 'labels':
    case 'multiselect': {
      if (Array.isArray(rawValue)) {
        return rawValue.filter((value) => typeof value === 'string' && value.trim().length > 0);
      }
      if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
        return rawValue
          .split(/[\s,]+/)
          .map((value) => value.trim())
          .filter(Boolean);
      }
      return [];
    }
    case 'datetime': {
      if (rawValue && typeof rawValue === 'object') {
        return {
          date: typeof rawValue.date === 'string' ? rawValue.date : '',
          time: typeof rawValue.time === 'string' ? rawValue.time : ''
        };
      }
      return { date: '', time: '' };
    }
    default:
      return rawValue;
  }
}

export function isTemplateFieldValueEmpty(field: TemplateFieldDefinition, value: any): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (field.type === 'datetime' && value && typeof value === 'object') {
    const date = typeof value.date === 'string' ? value.date.trim() : '';
    const time = typeof value.time === 'string' ? value.time.trim() : '';
    return !date && !time;
  }
  if (field.type === 'checkbox' && typeof value === 'boolean') {
    return value === false;
  }
  return false;
}

export function formatTemplateFieldValue(
  field: TemplateFieldDefinition,
  value: any,
  options?: { users?: SimpleUser[] }
): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (field.type === 'user' && typeof value === 'string' && options?.users) {
    const user = options.users.find((u) => u.id === value);
    if (user) {
      return user.name || user.email;
    }
  }

  if (!value) {
    if (field.type === 'checkbox') {
      return 'No';
    }
    return '';
  }

  if (field.type === 'datetime' && typeof value === 'object') {
    const date = value.date || '';
    const time = value.time || '';
    return [date, time].filter(Boolean).join(' ');
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

export function buildTemplateMetadata(
  template: TemplateDefinition,
  values: Record<string, any>,
  options?: { users?: SimpleUser[] }
): TemplateMetadata | null {
  if (!template || !template.fields || template.fields.length === 0) {
    return null;
  }

  const fields: TemplateFieldMetadata[] = [];

  template.fields
    .filter((field) => field.id !== 'summary')
    .forEach((field) => {
      const rawValue = values[field.id];
      if (isTemplateFieldValueEmpty(field, rawValue)) {
        return;
      }

      const normalizedValue = normalizeTemplateFieldValue(field, rawValue);
      if (isTemplateFieldValueEmpty(field, normalizedValue)) {
        return;
      }

      fields.push({
        id: field.id,
        label: field.label,
        type: field.type,
        value: normalizedValue,
        displayValue: formatTemplateFieldValue(field, normalizedValue, options)
      });
    });

  if (fields.length === 0) {
    return null;
  }

  const metadata: TemplateMetadata = {
    templateId: template.id,
    templateTitle: template.title,
    fields
  };

  metadata.summaryText = generateTemplateSummary(metadata);
  return metadata;
}

export function metadataToTemplateValues(
  metadata: TemplateMetadata | null,
  template: TemplateDefinition | null
): Record<string, any> {
  if (!metadata || !template) return {};

  const values: Record<string, any> = {};
  const fieldMap = new Map<string, TemplateFieldDefinition>();
  template.fields.forEach((field) => {
    fieldMap.set(field.id, field);
  });

  metadata.fields.forEach((metaField) => {
    const definition = fieldMap.get(metaField.id);
    if (!definition) {
      return;
    }
    values[metaField.id] = normalizeTemplateFieldValue(definition, metaField.value);
  });

  return values;
}

export function templateToDefinition(template: { id?: string; title?: string; fieldConfig: Array<any> }): TemplateDefinition {
  return {
    id: template.id,
    title: template.title,
    fields: (template.fieldConfig || []).map((field: any) => ({
      id: field.id,
      label: field.label,
      type: field.type as TemplateFieldType,
      required: field.required,
      options: field.options,
      order: field.order,
      customFieldId: field.customFieldId,
      customFieldKey: field.customFieldKey,
      customFieldType: field.customFieldType
    }))
  };
}
