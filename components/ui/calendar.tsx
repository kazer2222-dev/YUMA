'use client';

import * as React from 'react';
import CalendarLib from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { cn } from '@/lib/utils';

export type CalendarProps = {
  value?: Date | null;
  onChange?: (value: Date | null) => void;
  mode?: 'single' | 'range';
  selected?: Date | null;
  onSelect?: (date: Date | null) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
};

function Calendar({
  value,
  onChange,
  mode = 'single',
  selected,
  onSelect,
  disabled,
  className,
  minDate,
  maxDate,
  ...props
}: CalendarProps) {
  const handleChange = (date: Date | Date[] | null) => {
    if (mode === 'single') {
      const singleDate = Array.isArray(date) ? date[0] : date;
      if (onSelect) {
        onSelect(singleDate || null);
      }
      if (onChange) {
        onChange(singleDate || null);
      }
    } else {
      const singleDate = Array.isArray(date) ? date[0] : date;
      if (onChange) {
        onChange(singleDate || null);
      }
    }
  };

  // Use selected prop if provided, otherwise use value
  const calendarValue = selected !== undefined ? selected : value;

  return (
    <div className={cn('react-calendar-wrapper', className)}>
      <CalendarLib
        onChange={handleChange}
        value={calendarValue || undefined}
        tileDisabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        className="border-0 bg-transparent"
        {...props}
      />
      <style jsx global>{`
        .react-calendar-wrapper .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .react-calendar-wrapper .react-calendar__navigation {
          display: flex;
          height: 44px;
          margin-bottom: 1em;
        }
        .react-calendar-wrapper .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          font-size: 16px;
          margin-top: 8px;
        }
        .react-calendar-wrapper .react-calendar__navigation button:enabled:hover,
        .react-calendar-wrapper .react-calendar__navigation button:enabled:focus {
          background-color: hsl(var(--accent));
        }
        .react-calendar-wrapper .react-calendar__navigation button[disabled] {
          background-color: transparent;
        }
        .react-calendar-wrapper .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 500;
          font-size: 0.75em;
          color: hsl(var(--muted-foreground));
        }
        .react-calendar-wrapper .react-calendar__month-view__weekdays__weekday {
          padding: 0.5em;
        }
        .react-calendar-wrapper .react-calendar__month-view__days__day--weekend {
          color: inherit;
        }
        .react-calendar-wrapper .react-calendar__tile {
          max-width: 100%;
          padding: 10px 6.6667px;
          background: none;
          text-align: center;
          line-height: 16px;
          font-size: 0.833em;
          border-radius: 4px;
        }
        .react-calendar-wrapper .react-calendar__tile:enabled:hover,
        .react-calendar-wrapper .react-calendar__tile:enabled:focus {
          background-color: hsl(var(--accent));
        }
        .react-calendar-wrapper .react-calendar__tile--now {
          background: hsl(var(--accent));
        }
        .react-calendar-wrapper .react-calendar__tile--active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .react-calendar-wrapper .react-calendar__tile--active:enabled:hover,
        .react-calendar-wrapper .react-calendar__tile--active:enabled:focus {
          background: hsl(var(--primary));
        }
        .react-calendar-wrapper .react-calendar__tile--disabled {
          background-color: transparent;
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };

