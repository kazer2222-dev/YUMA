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

const deriveTicker = (spaceName: string | undefined, slug: string | undefined) => {
  if (slug) {
    const slugTicker = slug
      .split(/[-\s_]/)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 4)
      .toUpperCase();
    if (slugTicker) {
      return slugTicker;
    }
  }
  if (spaceName) {
    return spaceName.slice(0, 4).toUpperCase();
  }
  return 'SPCE';
};

export function NotionLayout(props: NotionLayoutProps) {
  const spacesWithTicker = (props.spaces || []).filter(Boolean).map((space) => ({
    ...space,
    ticker: (space as any).ticker ?? deriveTicker(space?.name, space?.slug),
  }));

  return <ClickUpAppShell {...props} spaces={spacesWithTicker} />;
}


















