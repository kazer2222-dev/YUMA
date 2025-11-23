'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ClickUpSidebar } from '@/components/clickup/clickup-sidebar';
import { MobileSidebar } from '@/components/clickup/mobile-sidebar';
import { ClickUpHeader } from '@/components/clickup/clickup-header';
import { ClickUpPageHeader } from '@/components/clickup/page-header';
import { CreateSpaceDialog } from '@/components/spaces/create-space-dialog';
import { CreateTaskDialogUnified } from '@/components/tasks/create-task-dialog-unified';

type SpaceBoard = {
  id: string;
  name: string;
  description?: string;
  order: number;
};

type LayoutSpace = {
  id: string;
  name: string;
  slug: string;
  ticker: string;
  description?: string;
  memberCount: number;
  taskCount: number;
  boards?: SpaceBoard[];
};

type LayoutUser = {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
};

type HeaderAction = {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'ghost' | 'outline';
  icon?: React.ComponentType<{ className?: string }>;
};

type Breadcrumb = {
  name: string;
  href?: string;
};

interface ClickUpAppShellProps {
  children: React.ReactNode;
  spaces: LayoutSpace[];
  user: LayoutUser;
  onLogout: () => void;
  onCreateSpace?: () => void;
  onRefreshSpaces?: () => void;
  pageTitle: string;
  pageSubtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: HeaderAction[];
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  hideTitle?: boolean;
}

export function ClickUpAppShell({
  children,
  spaces,
  user,
  onLogout,
  onCreateSpace,
  onRefreshSpaces,
  pageTitle,
  pageSubtitle,
  breadcrumbs = [],
  actions = [],
  showSearch = false,
  onSearch,
  hideTitle,
}: ClickUpAppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [createSpaceDialogOpen, setCreateSpaceDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  const activeSpaceSlug = useMemo(() => {
    const match = pathname?.match(/^\/spaces\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [pathname]);

  const activeBoardId = searchParams?.get('boardId') ?? null;

  const userInitial = (user.name ?? user.email)?.charAt(0)?.toUpperCase() ?? 'A';
  const userName = user.name ?? user.email;

  const navigateHome = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    } else {
      router.push('/');
    }
  };

  const navigateToSpace = (slug: string) => {
    router.push(`/spaces/${slug}?view=overview`);
  };

  const navigateToBoard = (slug: string, boardId: string) => {
    router.push(`/spaces/${slug}?view=board&boardId=${boardId}`);
  };

  const navigateTool = (toolId: 'calendar' | 'reports' | 'ai-assistant' | 'integrations') => {
    switch (toolId) {
      case 'calendar':
        router.push('/calendar');
        break;
      case 'reports':
        router.push('/reports');
        break;
      case 'ai-assistant':
        router.push('/ai');
        break;
      case 'integrations':
        router.push('/integrations');
        break;
      default:
        break;
    }
    setMobileSidebarOpen(false);
  };

  const handleCreateSpace = () => {
    setCreateSpaceDialogOpen(true);
  };

  const handleSpaceCreated = () => {
    onCreateSpace?.();
    onRefreshSpaces?.();
  };

  const handleCreateBoard = (slug: string) => {
    router.push(`/spaces/${slug}?createBoard=true`);
    setMobileSidebarOpen(false);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handler = () => {
      setCreateTaskDialogOpen(true);
    };

    window.addEventListener('yuma:create-task', handler);
    return () => window.removeEventListener('yuma:create-task', handler);
  }, []);

  return (
    <>
      <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <ClickUpSidebar
          spaces={spaces}
          collapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
          activePath={pathname ?? '/'}
          activeSpaceSlug={activeSpaceSlug}
          activeBoardId={activeBoardId}
          onNavigateHome={navigateHome}
          onSelectSpace={navigateToSpace}
          onSelectBoard={navigateToBoard}
          onCreateSpace={handleCreateSpace}
          onCreateBoard={handleCreateBoard}
          onNavigateTool={navigateTool}
        />

        <MobileSidebar
          open={mobileSidebarOpen}
          onOpenChange={setMobileSidebarOpen}
          spaces={spaces}
          activePath={pathname ?? '/'}
          activeSpaceSlug={activeSpaceSlug}
          activeBoardId={activeBoardId}
          onNavigateHome={navigateHome}
          onSelectSpace={navigateToSpace}
          onSelectBoard={navigateToBoard}
          onCreateSpace={handleCreateSpace}
          onCreateBoard={handleCreateBoard}
          onNavigateTool={navigateTool}
        />

        <div className="flex w-full flex-1 flex-col overflow-hidden">
          <ClickUpHeader
            onMenuClick={() => setMobileSidebarOpen(true)}
            onCreateTask={() => setCreateTaskDialogOpen(true)}
            onSearch={onSearch}
            showSearch={showSearch}
            userInitial={userInitial}
            userName={userName}
            onLogout={onLogout}
          />

          <ClickUpPageHeader
            title={pageTitle}
            subtitle={pageSubtitle}
            breadcrumbs={breadcrumbs}
            actions={actions}
            hideTitle={hideTitle}
          />

          <main className="flex-1 overflow-auto bg-[var(--background)] px-4 py-4 sm:px-6">
            <div className="mx-auto h-full w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>

      <CreateSpaceDialog
        open={createSpaceDialogOpen}
        onOpenChange={setCreateSpaceDialogOpen}
        onSpaceCreated={handleSpaceCreated}
      />

      <CreateTaskDialogUnified
        mode="global"
        spaces={spaces}
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
        onTaskCreated={() => setCreateTaskDialogOpen(false)}
      />
    </>
  );
}

