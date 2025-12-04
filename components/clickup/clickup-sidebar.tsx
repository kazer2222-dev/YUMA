'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Home,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  LayoutGrid,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteSpaceDialog } from '@/components/spaces/delete-space-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageTree } from '@/components/documents/page-tree/page-tree';

type ToolId = 'calendar' | 'reports' | 'ai-assistant' | 'integrations';

type NavItem = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  color?: string | null;
  count?: number;
  type?: 'group' | 'space' | 'board' | 'tool';
  spaceId?: string;
  spaceSlug?: string;
  boardId?: string;
  toolId?: ToolId;
  children?: NavItem[];
};

type Board = {
  id: string;
  name: string;
  color?: string | null;
};

type SidebarSpace = {
  id: string;
  name: string;
  slug: string;
  taskCount?: number;
  color?: string | null;
  boards?: Board[];
};

export interface ClickUpSidebarProps {
  spaces: SidebarSpace[];
  collapsed?: boolean;
  activePath: string;
  activeSpaceSlug?: string | null;
  activeBoardId?: string | null;
  onCollapseChange?: (collapsed: boolean) => void;
  onNavigateHome: () => void;
  onSelectSpace: (slug: string) => void;
  onSelectBoard?: (spaceSlug: string, boardId: string) => void;
  onCreateSpace?: () => void;
  onCreateBoard?: (spaceSlug: string) => void;
  onDeleteSpace?: (space: { id: string; name: string }) => void;
  onDeleteBoard?: (board: { spaceSlug: string; id: string; name: string }) => void;
  onNavigateTool?: (toolId: ToolId) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

interface NavItemComponentProps {
  item: NavItem;
  depth?: number;
  selectedSpace?: string | null;
  selectedBoard?: string | null;
  selectedTool?: ToolId | null;
  onSpaceSelect?: (spaceSlug: string) => void;
  onBoardSelect?: (spaceSlug: string, boardId: string) => void;
  onToolSelect?: (toolId: ToolId) => void;
  onCreateSpace?: () => void;
  onDeleteSpaceRequest?: (space: { id: string; name: string }) => void;
  onDeleteBoardRequest?: (board: { spaceSlug: string; id: string; name: string }) => void;

  onClose?: () => void;
  isSortable?: boolean;
  renderPageTree?: (spaceSlug: string) => React.ReactNode;
  isDocumentsMode?: boolean;
  activeSpaceSlug?: string;
}

function NavItemComponent({
  item,
  depth = 0,
  selectedSpace,
  selectedBoard,
  selectedTool,
  onSpaceSelect,
  onBoardSelect,
  onToolSelect,
  onCreateSpace,
  onDeleteSpaceRequest,
  onDeleteBoardRequest,
  onClose,
  isSortable = false,
  renderPageTree,
  isDocumentsMode,
  activeSpaceSlug,
}: NavItemComponentProps) {
  const pathname = usePathname();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !isSortable,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const isSpace = item.type === 'space';
  const isBoard = item.type === 'board';
  const isTool = item.type === 'tool';
  const isGroup = item.type === 'group';
  const isSpacesGroup = isGroup && item.id === 'spaces' && depth === 0;
  const isSpacesPage = pathname === '/spaces';

  const isSpaceSelected = isSpace && selectedSpace === item.spaceSlug && !selectedBoard;
  const isBoardSelected = isBoard && selectedBoard === item.boardId;
  const isToolSelected = isTool && selectedTool === item.toolId;

  const isSelected = isSpaceSelected || isBoardSelected || isToolSelected || (isSpacesGroup && isSpacesPage);

  // Determine if we should show PageTree for this item
  const showPageTree = isSpace && isDocumentsMode && activeSpaceSlug === item.spaceSlug;

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (depth === 0) return true;
    if (isSpace && selectedSpace === item.spaceSlug) return true;
    if (hasChildren && item.children?.some((child) => child.boardId === selectedBoard)) {
      return true;
    }
    return false;
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!hasChildren && !showPageTree) return;
    if (isSpace && selectedSpace === item.spaceSlug) {
      setIsExpanded(true);
    }
    if (item.children?.some((child) => child.boardId === selectedBoard)) {
      setIsExpanded(true);
    }
  }, [hasChildren, isSpace, item.children, item.spaceSlug, selectedBoard, selectedSpace, showPageTree]);

  const handleClick = () => {
    // Expansion logic moved to chevron click handler

    if (item.id === 'spaces') {
      window.location.href = '/spaces';
      onClose?.();
      return;
    }

    if (isSpace && item.spaceSlug) {
      onSpaceSelect?.(item.spaceSlug);
      onClose?.();
      return;
    }

    if (isBoard && item.spaceSlug && item.boardId) {
      onBoardSelect?.(item.spaceSlug, item.boardId);
      onClose?.();
    }
  };

  const paddingLeft = depth * 12 + 12;

  const showHoverActions = isHovered || isMenuOpen;

  const needsHoverActionPadding =
    (isSpacesGroup && showHoverActions) || ((isSpace || isBoard) && (isHovered || isMenuOpen));


  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={handleClick}
        className={`relative flex w-full items-center gap-2 rounded px-3 py-1.5 text-left transition-colors cursor-pointer ${isSelected
          ? 'bg-[var(--primary)] text-white'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
          } ${needsHoverActionPadding ? 'pr-10' : ''}`}
        style={{ paddingLeft }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {(hasChildren || showPageTree) && (
          <span
            className="shrink-0 rounded-sm p-0.5 hover:bg-[var(--muted-foreground)]/20"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        )}

        {item.icon && (
          <span className="shrink-0" style={{ color: item.iconColor || 'currentColor' }}>
            <item.icon className="h-4 w-4" />
          </span>
        )}

        <span className="flex-1 truncate">{item.label}</span>

        {item.count !== undefined && (
          <span
            className={`shrink-0 text-xs text-[var(--muted-foreground)] transition-opacity duration-150 ${showHoverActions ? 'opacity-0' : 'opacity-100'
              }`}
            style={{ minWidth: '1.5rem', textAlign: 'right' }}
          >
            {item.count}
          </span>
        )}

        {isSpacesGroup && showHoverActions && onCreateSpace && (
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="pointer-events-auto h-6 w-6 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={(event) => {
                event.stopPropagation();
                onCreateSpace();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </span>
        )}

        {(isSpace || isBoard) && (isHovered || isMenuOpen) && (
          <span className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="pointer-events-auto h-6 w-6 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                onClick={(event) => event.stopPropagation()}
              >
                {isSpace ? (
                  <DropdownMenuItem
                    className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                    onClick={() => {
                      if (item.spaceId) {
                        onDeleteSpaceRequest?.({ id: item.spaceId, name: item.label });
                      }
                      setIsMenuOpen(false);
                    }}
                  >
                    Delete Space
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                    onClick={() => {
                      if (item.spaceSlug && item.boardId) {
                        onDeleteBoardRequest?.({ spaceSlug: item.spaceSlug, id: item.boardId, name: item.label });
                      }
                      setIsMenuOpen(false);
                    }}
                  >
                    Delete Board
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        )}
      </div>

      {isExpanded && (
        <div>
          {showPageTree && renderPageTree ? (
            <div>
              {renderPageTree(item.spaceSlug!)}
            </div>
          ) : (
            hasChildren && (
              isSpacesGroup ? (
                <SortableContext
                  items={item.children?.map((child) => child.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  {
                    item.children?.map((child) => (
                      <NavItemComponent
                        key={child.id}
                        item={child}
                        depth={depth + 1}
                        selectedSpace={selectedSpace}
                        selectedBoard={selectedBoard}
                        selectedTool={selectedTool}
                        onSpaceSelect={onSpaceSelect}
                        onBoardSelect={onBoardSelect}
                        onToolSelect={onToolSelect}
                        onCreateSpace={onCreateSpace}
                        onDeleteSpaceRequest={onDeleteSpaceRequest}
                        onDeleteBoardRequest={onDeleteBoardRequest}
                        onClose={onClose}
                        isSortable={true}
                        renderPageTree={renderPageTree}
                        isDocumentsMode={isDocumentsMode}
                        activeSpaceSlug={activeSpaceSlug}
                      />
                    ))
                  }
                </SortableContext>
              ) : (
                item.children?.map((child) => (
                  <NavItemComponent
                    key={child.id}
                    item={child}
                    depth={depth + 1}
                    selectedSpace={selectedSpace}
                    selectedBoard={selectedBoard}
                    selectedTool={selectedTool}
                    onSpaceSelect={onSpaceSelect}
                    onBoardSelect={onBoardSelect}
                    onToolSelect={onToolSelect}
                    onCreateSpace={onCreateSpace}
                    onDeleteSpaceRequest={onDeleteSpaceRequest}
                    onDeleteBoardRequest={onDeleteBoardRequest}
                    onClose={onClose}
                    renderPageTree={renderPageTree}
                    isDocumentsMode={isDocumentsMode}
                    activeSpaceSlug={activeSpaceSlug}
                  />
                ))
              )
            ))}
        </div>
      )}
    </div>
  );
}

interface SidebarContentProps
  extends Omit<ClickUpSidebarProps, 'collapsed' | 'onCollapseChange' | 'isMobile'> {
  collapsed: boolean;
  onDeleteSpaceRequest: (space: { id: string; name: string }) => void;
  onDeleteBoardRequest: (board: { spaceSlug: string; id: string; name: string }) => void;
}

function SidebarContent({
  spaces,
  collapsed,
  activePath,
  activeSpaceSlug,
  activeBoardId,
  onNavigateHome,
  onSelectSpace,
  onSelectBoard,
  onNavigateTool,
  onClose,
  onCreateSpace,
  onDeleteSpaceRequest,
  onDeleteBoardRequest,
}: SidebarContentProps) {
  const [orderedSpaces, setOrderedSpaces] = useState(spaces);

  useEffect(() => {
    setOrderedSpaces(spaces);
  }, [spaces]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedSpaces((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const navigationData = useMemo<NavItem[]>(() => {
    const spaceItems: NavItem = {
      id: 'spaces',
      label: 'Spaces',
      type: 'group',
      children: orderedSpaces.map((space) => ({
        id: space.id,
        label: space.name,
        type: 'space',
        spaceId: space.id,
        spaceSlug: space.slug,
        count: space.taskCount,
        color: space.color ?? '#4353FF',
        children: (space.boards || []).map((board) => ({
          id: board.id,
          label: board.name,
          type: 'board',
          boardId: board.id,
          spaceSlug: space.slug,
          color: board.color ?? space.color ?? '#3B82F6',
        })),
      })),
    };

    return [spaceItems];
  }, [orderedSpaces]);


  const router = useRouter();
  const searchParams = useSearchParams();
  const isDocumentsMode = activePath.includes('/documents') || searchParams?.get('view') === 'documents';

  const renderPageTree = (spaceSlug: string) => (
    <PageTree
      spaceSlug={spaceSlug}
      onPageSelect={(pageId) => {
        router.push(`/spaces/${spaceSlug}?view=documents&documentId=${pageId}`);
        onClose?.();
      }}
      onPageOpen={(pageId) => {
        router.push(`/spaces/${spaceSlug}?view=documents&documentId=${pageId}`);
        onClose?.();
      }}
      onPageCreate={async (parentId, title) => {
        const response = await fetch(`/api/spaces/${spaceSlug}/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title, parentId }),
        });
        const data = await response.json();
        return data.success ? data.page : null;
      }}
      onPageMove={async (pageId, newParentId, newPosition) => {
        const response = await fetch(`/api/spaces/${spaceSlug}/pages/${pageId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ newParentId, newPosition }),
        });
        const data = await response.json();
        return data.success;
      }}
      onPageDelete={async (pageId) => {
        if (!confirm('Are you sure you want to delete this page?')) return false;
        const response = await fetch(`/api/spaces/${spaceSlug}/documents/${pageId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await response.json();
        return data.success;
      }}
      showSearch={false}
      className=""
    />
  );

  if (collapsed) {
    return (
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-full ${activePath === '/' || activePath === '/dashboard'
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            onClick={() => {
              onNavigateHome();
              onClose?.();
            }}
          >
            <Home className="h-5 w-5" />
          </Button>

        </div>
      </div>
    );
  }



  return (
    <DndContext
      id="sidebar-dnd-context"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <button
          className={`mb-2 flex w-full items-center gap-2 rounded px-3 py-2 transition-colors ${activePath === '/' || activePath === '/dashboard'
            ? 'bg-[var(--primary)] text-white'
            : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          onClick={() => {
            onNavigateHome();
            onClose?.();
          }}
          type="button"
        >
          <Home className="h-4 w-4" />
          <span>Home</span>
        </button>

        {navigationData.map((section) => (
          <div key={section.id} className="mb-4">
            <NavItemComponent
              item={section}
              selectedSpace={activeSpaceSlug ?? undefined}
              selectedBoard={activeBoardId ?? null}
              selectedTool={null}
              onSpaceSelect={onSelectSpace}
              onBoardSelect={onSelectBoard}
              onToolSelect={onNavigateTool}
              onCreateSpace={onCreateSpace}
              onDeleteSpaceRequest={onDeleteSpaceRequest}
              onDeleteBoardRequest={onDeleteBoardRequest}
              onClose={onClose}
              renderPageTree={renderPageTree}
              isDocumentsMode={isDocumentsMode}
              activeSpaceSlug={activeSpaceSlug ?? undefined}
            />
          </div>
        ))}
      </div>
    </DndContext>
  );
}

type DeleteTarget =
  | { type: 'space'; id: string; name: string }
  | { type: 'board'; id: string; name: string; spaceSlug: string };

export function ClickUpSidebar(props: ClickUpSidebarProps) {
  const { collapsed: collapsedProp, onCollapseChange, onNavigateHome, isMobile, ...contentProps } = props;

  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(collapsedProp ?? false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  useEffect(() => {
    if (typeof collapsedProp === 'boolean') {
      setInternalCollapsed(collapsedProp);
    }
  }, [collapsedProp]);

  const collapsed = internalCollapsed;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setInternalCollapsed(next);
    onCollapseChange?.(next);
  };

  const handleDeleteSpaceRequest = (space: { id: string; name: string }) => {
    setDeleteTarget({ type: 'space', id: space.id, name: space.name });
  };

  const handleDeleteBoardRequest = (board: { spaceSlug: string; id: string; name: string }) => {
    setDeleteTarget({ type: 'board', id: board.id, name: board.name, spaceSlug: board.spaceSlug });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'space') {
      contentProps.onDeleteSpace?.({ id: deleteTarget.id, name: deleteTarget.name });
    } else {
      contentProps.onDeleteBoard?.({
        id: deleteTarget.id,
        name: deleteTarget.name,
        spaceSlug: deleteTarget.spaceSlug,
      });
    }

    setDeleteTarget(null);
  };

  const sidebarContent = (
    <SidebarContent
      {...contentProps}
      collapsed={isMobile ? false : collapsed}
      onNavigateHome={() => {
        onNavigateHome();
        if (isMobile) {
          contentProps.onClose?.();
        }
      }}
      onDeleteSpaceRequest={handleDeleteSpaceRequest}
      onDeleteBoardRequest={handleDeleteBoardRequest}
    />
  );

  return (
    <>
      {isMobile ? (
        sidebarContent
      ) : (
        <aside
          className={`hidden h-screen flex-col border-r border-[var(--border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-all duration-300 lg:flex ${collapsed ? 'w-16' : 'w-60'
            }`}
        >
          <div
            className={`flex h-14 items-center border-b border-[var(--border)] ${collapsed ? 'justify-center gap-3 px-2' : 'justify-between px-4'
              }`}
          >
            <button
              onClick={onNavigateHome}
              className={`flex items-center gap-2 text-[var(--primary)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] ${collapsed ? 'text-base' : 'text-lg'
                }`}
              type="button"
            >
              <span className="font-semibold">{collapsed ? 'Y' : 'YUMA'}</span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {sidebarContent}
        </aside>
      )}

      <DeleteSpaceDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        entityName={deleteTarget?.name ?? ''}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
