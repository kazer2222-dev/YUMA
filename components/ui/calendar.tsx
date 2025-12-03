'use client';

import * as React from 'react';
import CalendarLib from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className={cn('calendar-wrapper', className)}>
      <CalendarLib
        onChange={
          (value: Date | Date[] | [Date | null, Date | null] | null) => {
            let normalized: Date | Date[] | null = null;

            if (Array.isArray(value)) {
              const filtered = (value as Array<Date | null>).filter((d): d is Date => d instanceof Date);
              if (filtered.length === 0) normalized = null;
              else if (filtered.length === 1) normalized = filtered[0];
              else normalized = filtered;
            } else {
              normalized = value instanceof Date ? value : null;
            }

            handleChange(normalized);
          }
        }
        value={calendarValue || undefined}
        tileDisabled={
          disabled
            ? ({ date }) => disabled(date)
            : undefined
        }
        minDate={minDate}
        maxDate={maxDate}
        prevLabel={<ChevronLeft className="h-4 w-4" />}
        nextLabel={<ChevronRight className="h-4 w-4" />}
        prev2Label={null}
        next2Label={null}
        className="custom-calendar"
        {...props}
      />
      <style jsx global>{`
        /* Calendar Container */
        .calendar-wrapper .custom-calendar {
          width: 280px;
          border: none;
          background: hsl(var(--popover));
          color: hsl(var(--popover-foreground));
          font-family: inherit;
          padding: 12px;
          border-radius: 8px;
        }

        /* Navigation Header */
        .calendar-wrapper .react-calendar__navigation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 0 4px;
        }

        .calendar-wrapper .react-calendar__navigation button {
          min-width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          color: hsl(var(--foreground));
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease;
        }

        .calendar-wrapper .react-calendar__navigation button:hover:not(:disabled) {
          background-color: hsl(var(--accent));
        }

        .calendar-wrapper .react-calendar__navigation button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .calendar-wrapper .react-calendar__navigation__label {
          flex-grow: 1;
          font-weight: 600;
          font-size: 14px;
        }

        /* Weekday Headers */
        .calendar-wrapper .react-calendar__month-view__weekdays {
          text-align: center;
          margin-bottom: 8px;
        }

        .calendar-wrapper .react-calendar__month-view__weekdays__weekday {
          padding: 8px 0;
          font-size: 12px;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .calendar-wrapper .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }

        /* Day Tiles */
        .calendar-wrapper .react-calendar__month-view__days {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .calendar-wrapper .react-calendar__tile {
          aspect-ratio: 1;
          max-width: 100%;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 400;
          color: hsl(var(--foreground));
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .calendar-wrapper .react-calendar__tile:hover:not(:disabled) {
          background-color: hsl(var(--accent));
        }

        .calendar-wrapper .react-calendar__tile:focus {
          outline: none;
          box-shadow: 0 0 0 2px hsl(var(--ring));
        }

        /* Today */
        .calendar-wrapper .react-calendar__tile--now {
          background-color: hsl(var(--accent));
          font-weight: 600;
        }

        .calendar-wrapper .react-calendar__tile--now:hover {
          background-color: hsl(var(--accent));
        }

        /* Selected Date */
        .calendar-wrapper .react-calendar__tile--active {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          font-weight: 600;
        }

        .calendar-wrapper .react-calendar__tile--active:hover {
          background-color: hsl(var(--primary)) !important;
        }

        /* Neighboring Month Days */
        .calendar-wrapper .react-calendar__month-view__days__day--neighboringMonth {
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
        }

        /* Weekend Days */
        .calendar-wrapper .react-calendar__month-view__days__day--weekend {
          color: hsl(var(--foreground));
        }

        /* Disabled Tiles */
        .calendar-wrapper .react-calendar__tile:disabled {
          background-color: transparent;
          color: hsl(var(--muted-foreground));
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Year/Decade View */
        .calendar-wrapper .react-calendar__year-view__months,
        .calendar-wrapper .react-calendar__decade-view__years,
        .calendar-wrapper .react-calendar__century-view__decades {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 8px 0;
        }

        .calendar-wrapper .react-calendar__year-view .react-calendar__tile,
        .calendar-wrapper .react-calendar__decade-view .react-calendar__tile,
        .calendar-wrapper .react-calendar__century-view .react-calendar__tile {
          aspect-ratio: auto;
          padding: 12px 8px;
          font-size: 13px;
        }

        /* Remove default react-calendar borders */
        .calendar-wrapper .react-calendar__tile--hasActive {
          background: transparent;
        }

        .calendar-wrapper .react-calendar--selectRange .react-calendar__tile--hover {
          background-color: hsl(var(--accent));
        }
      `}</style>
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
