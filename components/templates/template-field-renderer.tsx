'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import Calendar from 'react-calendar';
import type { TemplateField } from './template-types';

const NO_TIME_VALUE = '__no_time__';
const NO_DEFAULT_VALUE = '__no_default__';

interface TemplateFieldRendererProps {
  field: TemplateField;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  users?: Array<{ id: string; name?: string; email: string }>;
  labelSuggestions?: string[];
}

const timeOptions = Array.from({ length: 48 }).map((_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
});

const toDateInstance = (iso: string) => {
  const parts = iso.split('-').map(Number);
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
  }
  return undefined;
};

const formatDateDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export function TemplateFieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
  users = [],
  labelSuggestions = []
}: TemplateFieldRendererProps) {
  const [labelInput, setLabelInput] = useState('');

  const sanitizedSuggestions = useMemo(
    () => labelSuggestions.map((item) => item.trim()).filter(Boolean),
    [labelSuggestions]
  );

  const labelValues = useMemo(() => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (Array.isArray(field.defaultValue)) return field.defaultValue;
    if (typeof field.defaultValue === 'string') {
      return field.defaultValue
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }, [value, field.defaultValue]);

  const availableLabelSuggestions = useMemo(() => {
    return sanitizedSuggestions.filter((suggestion) => {
      if (labelValues.includes(suggestion)) return false;
      if (!labelInput) return true;
      return suggestion.toLowerCase().startsWith(labelInput.toLowerCase());
    });
  }, [sanitizedSuggestions, labelValues, labelInput]);

  const commitLabels = (raw: string) => {
    const tokens = raw
      .split(/[\s,]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    if (tokens.length === 0) return;

    const unique = Array.from(new Set([...labelValues, ...tokens]));
    onChange(unique);
    setLabelInput('');
  };

  const resolveDateValue = (raw: any): string => {
    if (typeof raw === 'string') return raw;
    if (raw instanceof Date) return raw.toISOString().slice(0, 10);
    if (Array.isArray(raw)) return '';
    if (typeof raw === 'object' && raw && 'date' in raw) {
      return typeof (raw as any).date === 'string' ? (raw as any).date : '';
    }
    if (typeof field.defaultValue === 'string') return field.defaultValue;
    if (field.defaultValue && typeof field.defaultValue === 'object' && 'date' in (field.defaultValue as any)) {
      return typeof (field.defaultValue as any).date === 'string' ? (field.defaultValue as any).date : '';
    }
    return '';
  };

  switch (field.type) {
    case 'checkbox': {
      const hasOptions = Array.isArray(field.options) && field.options.length > 0;
      if (hasOptions) {
        const selectedValues = Array.isArray(value)
          ? value
          : Array.isArray(field.defaultValue)
            ? field.defaultValue
            : typeof field.defaultValue === 'string' && field.defaultValue
              ? [field.defaultValue]
              : [];

        const toggleValue = (option: string) => {
          const exists = selectedValues.includes(option);
          if (exists) {
            onChange(selectedValues.filter((item) => item !== option));
          } else {
            onChange([...selectedValues, option]);
          }
        };

        return (
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-checkbox-group`}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option, idx) => {
                const checked = selectedValues.includes(option);
                return (
                  <label
                    key={idx}
                    className="flex items-center gap-2 px-2 py-1 rounded-sm text-sm hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleValue(option)}
                      disabled={disabled}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedValues.map((option) => (
                  <span
                    key={option}
                    className="px-2 py-1 text-xs bg-secondary rounded-md flex items-center gap-1"
                  >
                    {option}
                    <button
                      type="button"
                      onClick={() => toggleValue(option)}
                      className="text-muted-foreground hover:text-foreground"
                      disabled={disabled}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          </div>
        );
      }

      const inlineLabel = field.inlineLabel?.trim() || field.helpText?.trim() || 'Yes';
      const showHelpText = Boolean(
        field.helpText && field.helpText.trim() && field.helpText.trim() !== inlineLabel
      );
      const isChecked = Boolean(
        value !== undefined ? value : field.defaultValue !== undefined ? field.defaultValue : false
      );

      return (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-checkbox`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${field.id}-checkbox`}
              checked={isChecked}
              onCheckedChange={(checked) => onChange(Boolean(checked))}
              disabled={disabled}
            />
            <span className="text-sm text-foreground">{inlineLabel}</span>
          </div>
          {showHelpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    case 'date': {
      const currentValue = resolveDateValue(value);
      const selectedDate = currentValue ? toDateInstance(currentValue) : undefined;

      return (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-date`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal"
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>{currentValue ? formatDateDDMMYYYY(currentValue) : 'Select date'}</span>
                {currentValue && (
                  <X
                    className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange('');
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[100] date-picker-popover shadow-lg" align="start">
              <div className="date-picker-calendar-wrapper">
                <Calendar
                  onChange={(val: any) => {
                    if (val instanceof Date) {
                      const y = val.getFullYear();
                      const m = String(val.getMonth() + 1).padStart(2, '0');
                      const d = String(val.getDate()).padStart(2, '0');
                      onChange(`${y}-${m}-${d}`);
                    }
                  }}
                  value={selectedDate || null}
                />
              </div>
            </PopoverContent>
          </Popover>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    case 'datetime': {
      const current = (() => {
        if (value && typeof value === 'object') {
          return {
            date: typeof (value as any).date === 'string' ? (value as any).date : '',
            time: typeof (value as any).time === 'string' ? (value as any).time : ''
          };
        }
        if (typeof value === 'string') {
          const [datePart, timePart = ''] = value.split(/[T\s]/);
          return { date: datePart || '', time: timePart || '' };
        }
        if (field.defaultValue && typeof field.defaultValue === 'object') {
          return {
            date: typeof (field.defaultValue as any).date === 'string' ? (field.defaultValue as any).date : '',
            time: typeof (field.defaultValue as any).time === 'string' ? (field.defaultValue as any).time : ''
          };
        }
        if (typeof field.defaultValue === 'string') {
          const [datePart, timePart = ''] = field.defaultValue.split(/[T\s]/);
          return { date: datePart || '', time: timePart || '' };
        }
        return { date: '', time: '' };
      })();

      const selectedDate = current.date ? toDateInstance(current.date) : undefined;

      return (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-datetime`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>{current.date ? formatDateDDMMYYYY(current.date) : 'Date'}</span>
                  {current.date && (
                    <X
                      className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange({ ...current, date: '' });
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100] date-picker-popover shadow-lg" align="start">
                <div className="date-picker-calendar-wrapper">
                  <Calendar
                    onChange={(val: any) => {
                      if (val instanceof Date) {
                        const y = val.getFullYear();
                        const m = String(val.getMonth() + 1).padStart(2, '0');
                        const d = String(val.getDate()).padStart(2, '0');
                        onChange({ ...current, date: `${y}-${m}-${d}` });
                      }
                    }}
                    value={selectedDate || null}
                  />
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2">
              <Select
                value={current.time || NO_TIME_VALUE}
                onValueChange={(val) => {
                  const nextTime = val === NO_TIME_VALUE ? '' : val;
                  onChange({ ...current, time: nextTime });
                }}
                disabled={disabled}
              >
                <SelectTrigger className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Time" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value={NO_TIME_VALUE}>No time</SelectItem>
                  {timeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {current.time && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => onChange({ ...current, time: '' })}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    case 'number': {
      const rawValue = value !== undefined ? value : field.defaultValue ?? '';
      const numericValue = rawValue === null ? '' : rawValue;
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.id}
            type="number"
            value={numericValue === '' ? '' : String(numericValue)}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                onChange('');
                return;
              }
              const parsed = Number(raw);
              onChange(Number.isNaN(parsed) ? '' : parsed);
            }}
            disabled={disabled}
            required={field.required}
            placeholder={field.helpText}
          />
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    case 'paragraph': {
      const currentValue = value !== undefined ? value : field.defaultValue ?? '';
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            id={field.id}
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            placeholder={field.helpText}
            rows={4}
          />
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    case 'radio': {
      const currentValue = value !== undefined ? value : field.defaultValue ?? '';
      return (
        <div className="space-y-2">
          <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.id}-${idx}`}
                  name={field.id}
                  value={option}
                  checked={currentValue === option}
                  onChange={() => onChange(option)}
                  disabled={disabled}
                  required={field.required}
                  className="h-4 w-4"
                />
                <Label htmlFor={`${field.id}-${idx}`} className="font-normal cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    case 'select': {
      const currentValue = value !== undefined ? value : field.defaultValue ?? '';
      const selectValue = currentValue || NO_DEFAULT_VALUE;
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={selectValue}
            onValueChange={(val) => onChange(val === NO_DEFAULT_VALUE ? '' : val)}
            disabled={disabled}
            required={field.required}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.helpText || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_DEFAULT_VALUE}>Clear selection</SelectItem>
              {field.options?.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    case 'multiselect': {
      const selectedValues = Array.isArray(value)
        ? value
        : Array.isArray(field.defaultValue)
          ? field.defaultValue
          : typeof field.defaultValue === 'string' && field.defaultValue
            ? [field.defaultValue]
            : [];

      const toggleValue = (option: string) => {
        const exists = selectedValues.includes(option);
        if (exists) {
          onChange(selectedValues.filter((item) => item !== option));
        } else {
          onChange([...selectedValues, option]);
        }
      };

      return (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-multiselect`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                disabled={disabled}
              >
                <span>
                  {selectedValues.length > 0
                    ? `${selectedValues.length} selected`
                    : field.helpText || 'Select options...'}
                </span>
                <span className="text-sm text-muted-foreground">▼</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 space-y-1" align="start">
              {field.options && field.options.length > 0 ? (
                field.options.map((option, idx) => {
                  const checked = selectedValues.includes(option);
                  return (
                    <label
                      key={idx}
                      className="flex items-center gap-2 px-2 py-1 rounded-sm text-sm hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleValue(option)}
                        disabled={disabled}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground px-2 py-1">No options configured.</p>
              )}
            </PopoverContent>
          </Popover>
          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((option) => (
                <span
                  key={option}
                  className="px-2 py-1 text-xs bg-secondary rounded-md flex items-center gap-1"
                >
                  {option}
                  <button
                    type="button"
                    onClick={() => toggleValue(option)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={disabled}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    case 'url': {
      const currentValue = value !== undefined ? value : field.defaultValue ?? '';
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.id}
            type="url"
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            placeholder={field.helpText || 'https://...'}
          />
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    case 'user': {
      const currentValue = value !== undefined ? value : field.defaultValue ?? '';
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={currentValue}
            onValueChange={onChange}
            disabled={disabled}
            required={field.required}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.helpText || 'Select user...'} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    case 'labels': {
      return (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-labels`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div
            className={`rounded-md border px-3 py-2 ${disabled ? 'bg-muted cursor-not-allowed' : 'cursor-text'}`}
            onClick={() => {
              if (disabled) return;
              const input = document.getElementById(`${field.id}-labels-input`);
              input?.focus();
            }}
          >
            <div className="flex flex-wrap gap-2 items-center">
              {labelValues.map((label) => (
                <span
                  key={label}
                  className="px-2 py-1 text-xs bg-secondary rounded-md flex items-center gap-1"
                >
                  {label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(labelValues.filter((item) => item !== label));
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={disabled}
                    aria-label={`Remove ${label}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                id={`${field.id}-labels-input`}
                className="flex-1 min-w-[140px] outline-none bg-transparent text-sm"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  const isCommitKey = ['Enter', 'Tab', ' ', 'Spacebar', ','].includes(e.key);
                  if (isCommitKey) {
                    e.preventDefault();
                    commitLabels(labelInput);
                  } else if (e.key === 'Backspace' && labelInput === '' && labelValues.length > 0) {
                    onChange(labelValues.slice(0, -1));
                  }
                }}
                onBlur={() => {
                  if (labelInput.trim()) {
                    commitLabels(labelInput);
                  }
                }}
                placeholder={labelValues.length === 0 ? 'Add labels (space to confirm)' : ''}
                disabled={disabled}
              />
            </div>
          </div>
          {availableLabelSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {availableLabelSuggestions.slice(0, 10).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="px-2 py-1 bg-secondary rounded-md hover:bg-secondary/80"
                  onClick={() => {
                    if (disabled) return;
                    onChange([...labelValues, suggestion]);
                    setLabelInput('');
                  }}
                  disabled={disabled}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    default: {
      const currentValue = value !== undefined ? value : field.defaultValue ?? '';
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.id}
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            placeholder={field.helpText}
          />
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }
  }
}


