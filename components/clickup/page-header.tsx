'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Breadcrumb {
  name: string;
  href?: string;
}

interface HeaderAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'ghost' | 'outline';
  icon?: React.ComponentType<{ className?: string }>;
}

interface ClickUpPageHeaderProps {
  title?: string;
  subtitle?: string;
  hideTitle?: boolean;
  breadcrumbs?: Breadcrumb[];
  actions?: HeaderAction[];
}

export function ClickUpPageHeader({
  title,
  subtitle,
  hideTitle,
  breadcrumbs = [],
  actions = [],
}: ClickUpPageHeaderProps) {
  const showTitle = !!title && !hideTitle;
  const showMeta = breadcrumbs.length > 0 || showTitle || !!subtitle || actions.length > 0;

  if (!showMeta) {
    return null;
  }

  return (
    <div className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-4 text-[var(--foreground)] sm:px-6">
      {breadcrumbs.length > 0 && (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.name}-${index}`} className="flex items-center gap-1">
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-[var(--foreground)]">
                  {crumb.name}
                </Link>
              ) : (
                <span>{crumb.name}</span>
              )}
              {index < breadcrumbs.length - 1 && <span className="opacity-60">/</span>}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {showTitle && (
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="max-w-3xl text-sm text-[var(--muted-foreground)]">
              {subtitle}
            </p>
          )}
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map(({ label, onClick, variant = 'default', icon: Icon }, index) => (
              <Button key={`${label}-${index}`} onClick={onClick} variant={variant}>
                {Icon && <Icon className={cn('h-4 w-4', label ? 'mr-2' : undefined)} />}
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


















