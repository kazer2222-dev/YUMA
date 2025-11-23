'use client';

import { ClickUpAppShell } from './clickup-app-shell';

export interface NotionLayoutProps {
  children: React.ReactNode;
  spaces: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    memberCount: number;
    taskCount: number;
    boards?: Array<{
      id: string;
      name: string;
      description?: string;
      order: number;
    }>;
  }>;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  onLogout: () => void;
  onCreateSpace?: () => void;
  onRefreshSpaces?: () => void;
  pageTitle: string;
  pageSubtitle?: string;
  breadcrumbs?: Array<{ name: string; href?: string }>;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'ghost' | 'outline';
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  hideTitle?: boolean;
  centerSearchAndCreate?: boolean;
}

export function NotionLayout(props: NotionLayoutProps) {
  return <ClickUpAppShell {...props} />;
}


















