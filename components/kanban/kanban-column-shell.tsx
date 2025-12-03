'use client';

import React from 'react';

interface KanbanColumnShellProps {
  title: string;
  countLabel?: string;
  columnColor: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  footerContent?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  showDropOverlay?: boolean;
  highlight?: boolean;
  minHeight?: string | number;
}

export const KanbanColumnShell = React.forwardRef<HTMLDivElement, KanbanColumnShellProps>(
  (
    {
      title,
      countLabel,
      columnColor,
      children,
      headerActions,
      footerContent,
      className = '',
      bodyClassName = '',
      showDropOverlay = false,
      highlight = false,
      minHeight,
    },
    ref,
  ) => {
    return (
      <div className={`flex-shrink-0 w-72 sm:w-80 group ${className}`}>
        <div
          ref={ref}
          className={`flex flex-col bg-gradient-to-b from-[var(--card)] to-[var(--card)]/80 dark:from-[var(--card)] dark:to-[var(--background)] rounded-xl border backdrop-blur-sm h-full relative z-10 ${
            highlight
              ? 'border-2 shadow-2xl transition-all duration-150'
              : 'border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-300'
          }`}
          style={
            highlight
              ? {
                  borderColor: columnColor,
                  boxShadow: `0 0 20px ${columnColor}40, 0 8px 32px rgba(0,0,0,0.12)`,
                  backgroundColor: `${columnColor}05`,
                }
              : undefined
          }
        >
          <div className="relative">
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{
                background: `linear-gradient(90deg, ${columnColor}, ${columnColor}80)`,
                boxShadow: `0 0 10px ${columnColor}40`,
              }}
            />
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] mt-1">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{
                    backgroundColor: columnColor,
                    boxShadow: `0 0 8px ${columnColor}80`,
                  }}
                />
                <span className="text-[var(--foreground)]">{title}</span>
                {typeof countLabel !== 'undefined' && (
                  <span
                    className="text-xs px-2 py-1 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: `${columnColor}15`,
                      color: columnColor,
                      border: `1px solid ${columnColor}30`,
                    }}
                  >
                    {countLabel}
                  </span>
                )}
              </div>
              {headerActions && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {headerActions}
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex-1 p-3 space-y-3 min-h-[200px] relative z-20 ${bodyClassName}`}
            style={minHeight ? { minHeight } : undefined}
          >
            {showDropOverlay && (
              <div className="absolute inset-0 rounded-xl pointer-events-none z-10 animate-in fade-in duration-150">
                <div
                  className="absolute inset-0 rounded-xl border-2 border-dashed"
                  style={{
                    borderColor: columnColor,
                    backgroundColor: `${columnColor}10`,
                    animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              </div>
            )}

            {children}
          </div>

          {footerContent && <div className="p-3 pt-0 mt-auto">{footerContent}</div>}
        </div>
      </div>
    );
  },
);

KanbanColumnShell.displayName = 'KanbanColumnShell';













