'use client';

import { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Home, 
  Plus, 
  Settings, 
  FileText,
  Users,
  Building2,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Star,
  Clock,
  CheckSquare,
  GanttChart,
  Menu,
  LayoutGrid,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { YUMALogo } from '@/components/ui/yuma-logo';
import { PageTree } from '@/components/documents/page-tree';
import { PageTreeNode } from '@/components/documents/page-tree/types';

interface SidebarProps {
  spaces: Array<{
    id: string;
    name: string;
    slug: string;
    ticker: string;
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
  onCreateSpace: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
  onRefreshSpaces?: () => void;
  onCreateBoard?: (spaceSlug: string) => void;
}

export function NotionSidebar({ spaces, user, onLogout, onCreateSpace, onCollapseChange, onRefreshSpaces, onCreateBoard }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    spaces: true
  });
  const [expandedSpaces, setExpandedSpaces] = useState<{ [key: string]: boolean }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<{ name: string; slug: string } | null>(null);
  const [deleteBoardDialogOpen, setDeleteBoardDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<{ id: string; name: string; spaceSlug: string } | null>(null);
  const chevronClickedRef = useRef<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Determine current view
  const currentView = searchParams?.get('view') || (pathname?.includes('/documents') ? 'documents' : null);
  const isDocumentsView = pathname?.includes('/documents') || currentView === 'documents';
  const isBoardView = currentView === 'board';

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapseChange?.(newState);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSpace = (spaceId: string) => {
    setExpandedSpaces(prev => ({
      ...prev,
      [spaceId]: !prev[spaceId]
    }));
  };

  const handleDeleteSpace = (space: { name: string; slug: string }) => {
    setSpaceToDelete(space);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSpace = async () => {
    if (!spaceToDelete) return;

    try {
      const response = await fetch(`/api/spaces/${spaceToDelete.slug}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        onRefreshSpaces?.();
        // If we're on the deleted space, redirect to dashboard
        if (pathname.includes(`/spaces/${spaceToDelete.slug}`)) {
          router.push('/dashboard');
        }
      } else {
        alert(data.message || 'Failed to delete space');
      }
    } catch (error) {
      console.error('Error deleting space:', error);
      alert('Failed to delete space');
    } finally {
      setDeleteDialogOpen(false);
      setSpaceToDelete(null);
    }
  };

  // Auto-expand spaces that are currently active (boards or documents view)
  useEffect(() => {
    spaces.forEach(space => {
      const isSpaceActive = pathname?.includes(`/spaces/${space.slug}`);
      if (!isSpaceActive) return;

      const boards = Array.isArray(space.boards) ? space.boards : [];
      const currentBoardId = searchParams?.get('boardId');
      const isBoardActive = currentBoardId && boards.some(board => board.id === currentBoardId);
      const isDocumentsActive = pathname?.includes(`/spaces/${space.slug}/documents`) || 
                                (pathname?.includes(`/spaces/${space.slug}`) && searchParams?.get('view') === 'documents');
      
      // Auto-expand if viewing this space, any board within it, or documents
      if (isSpaceActive || isBoardActive || isDocumentsActive) {
        setExpandedSpaces(prev => {
          // Only set if not already set to avoid unnecessary updates
          if (prev[space.id] !== true) {
            return {
              ...prev,
              [space.id]: true
            };
          }
          return prev;
        });
      }
    });
  }, [spaces, pathname, searchParams]);

  const navigationItems = [
    { name: 'Home', href: '/', icon: Home, current: pathname === '/' || pathname === '/dashboard', color: 'text-blue-500' },
  ];



  const getSpaceIcon = (space: any) => {
    if (space.name.toLowerCase().includes('personal')) return Home;
    if (space.name.toLowerCase().includes('work')) return Building2;
    return Building2;
  };

  return (
    <div className={`notion-sidebar ${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out fixed left-0 top-0 h-screen z-50 border-r border-border`} style={{ backgroundColor: '#0C0D11' }}>
      {/* Header - Exact spec: h-14 (3.5rem / 56px) */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-border relative h-14 flex items-center`}>
        <div className={`${isCollapsed ? 'flex flex-col items-center gap-2' : 'flex items-center justify-between'}`}>
          <button
            onClick={() => {
              // Use Next.js router for client-side navigation (no full page reload)
              router.push('/home');
            }}
            className="hover:opacity-80 transition-opacity cursor-pointer"
            type="button"
          >
            <YUMALogo showText={!isCollapsed} size={isCollapsed ? 'sm' : 'md'} />
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* Main Navigation - Exact spec: py-2.5, px-4, rounded-lg, gap-3, icon w-5 h-5 */}
          <div className="space-y-1 mb-4">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium w-full text-left ${
                  item.current
                    ? 'bg-[#1A1B20] border-l-2 border-[#4353FF]'
                    : 'text-muted-foreground hover:bg-[#1A1B20]'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color || ''}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </button>
            ))}
          </div>

          {/* Spaces Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-3 py-2">
              {!isCollapsed && (
                <button
                  onClick={() => toggleSection('spaces')}
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {expandedSections.spaces ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>Spaces</span>
                </button>
              )}
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCreateSpace}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>

            {expandedSections.spaces && (
              <div className="space-y-0.5">
                {spaces.map((space) => {
                  const Icon = getSpaceIcon(space);
                  const isSpaceActive = pathname.includes(`/spaces/${space.slug}`);
                  const currentBoardId = searchParams?.get('boardId');
                  const boards = Array.isArray(space.boards) ? space.boards : [];
                  const isActive = isSpaceActive && !currentBoardId; // Only highlight space if no board is selected
                  const isSpaceExpanded = expandedSpaces[space.id] ?? false;
                  const hasBoards = boards.length > 0;
                  
                  return (
                    <div key={space.id}>
                      {!isCollapsed ? (
                        <>
                          {/* Space Row with Toggle */}
                          <div 
                            className={`group/item relative flex items-center flex-1 min-w-0 rounded-md ${
                              isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                            }`}
                          >
                            {/* Dropdown Toggle Button - Only for spaces with boards - Positioned absolutely in front */}
                            {hasBoards && (
                              <div className="absolute left-1 top-1/2 -translate-y-1/2 z-[100]" style={{ pointerEvents: 'auto' }}>
                                <button
                                  data-chevron-toggle="true"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    e.nativeEvent.stopImmediatePropagation();
                                    chevronClickedRef.current = true;
                                    toggleSpace(space.id);
                                    // Reset after a short delay
                                    setTimeout(() => {
                                      chevronClickedRef.current = false;
                                    }, 200);
                                    return false;
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    e.nativeEvent.stopImmediatePropagation();
                                    chevronClickedRef.current = true;
                                  }}
                                  onMouseUp={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    e.nativeEvent.stopImmediatePropagation();
                                  }}
                                  className="p-2.5 hover:bg-accent/90 rounded-md border-2 border-border bg-background flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center shadow-md hover:shadow-lg transition-all"
                                  type="button"
                                  style={{ pointerEvents: 'auto' }}
                                >
                                  {isSpaceExpanded ? (
                                    <ChevronDown className="h-5 w-5 pointer-events-none text-foreground font-bold" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 pointer-events-none text-foreground font-bold" />
                                  )}
                                </button>
                              </div>
                            )}
                            {/* Navigation Button - Entire row is clickable - With left padding for chevron */}
                            <button
                              onClick={(e) => {
                                // Don't navigate if chevron was clicked
                                if (chevronClickedRef.current) {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  return false;
                                }
                                
                                // Don't navigate if click came from chevron button
                                const target = e.target as HTMLElement;
                                const chevronButton = target.closest('button[data-chevron-toggle="true"]');
                                
                                if (chevronButton) {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  return false;
                                }
                                
                                // Don't navigate if click is in the left area where chevron is (first 50px)
                                if (hasBoards) {
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  const clickX = e.clientX - rect.left;
                                  if (clickX < 50) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    return false;
                                  }
                                }
                                
                                e.stopPropagation();
                                const lastBoardId = localStorage.getItem(`lastBoard_${space.slug}`);
                                const targetPath = lastBoardId 
                                  ? `/spaces/${space.slug}?boardId=${lastBoardId}`
                                  : `/spaces/${space.slug}`;
                                
                                console.log('[Sidebar] Space clicked:', {
                                  spaceName: space.name,
                                  spaceSlug: space.slug,
                                  targetPath,
                                  lastBoardId,
                                  currentPath: window.location.pathname
                                });
                                
                                // Use Next.js router for client-side navigation
                                router.push(targetPath);
                              }}
                              className={`flex items-center space-x-2 px-3 py-2 text-sm flex-1 w-full text-left transition-colors ${
                                hasBoards ? 'pl-12' : ''
                              } ${
                                isActive ? 'text-accent-foreground' : 'text-muted-foreground hover:text-accent-foreground'
                              }`}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="truncate font-medium">{space.name}</span>
                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    <Badge variant="secondary" className="text-xs">
                                      {space.taskCount}
                                    </Badge>
                                  </div>
                                </div>
                                {space.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {space.description}
                                  </p>
                                )}
                              </div>
                            </button>
                            {/* Menu Button */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-1.5 mr-1 hover:bg-accent/50 rounded z-10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                  }}
                                  type="button"
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCreateBoard?.(space.slug);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <LayoutGrid className="mr-2 h-4 w-4" />
                                  Create Board
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSpace({ name: space.name, slug: space.slug });
                                  }}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Space
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {/* Space Sub-items - Dynamic based on current view */}
                          {isSpaceExpanded && (() => {
                            const spaceView = searchParams?.get('view');
                            const isSpaceOnBoardView = pathname?.includes(`/spaces/${space.slug}`) && spaceView === 'board';
                            const isSpaceOnDocumentsView = pathname?.includes(`/spaces/${space.slug}/documents`) || 
                                                          (pathname?.includes(`/spaces/${space.slug}`) && spaceView === 'documents');
                            
                            // Show boards when on board view
                            if (isSpaceOnBoardView) {
                              return (
                                <div className="ml-6 pl-4 mt-1 space-y-0.5">
                                  {boards.map((board) => {
                                    const currentBoardId = searchParams?.get('boardId');
                                    const isBoardActive = currentBoardId === board.id;
                                    const openDeleteBoard = (e: React.MouseEvent) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setBoardToDelete({ id: board.id, name: board.name, spaceSlug: space.slug });
                                      setDeleteBoardDialogOpen(true);
                                    };

                                    return (
                                      <div
                                        key={board.id}
                                        className={`group/item flex items-center rounded-md ${
                                          isBoardActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                                        }`}
                                      >
                                        <Link
                                          href={`/spaces/${space.slug}?view=board&boardId=${board.id}`}
                                          className={`flex items-center space-x-2 px-3 py-2 text-sm flex-1 transition-colors ${
                                            isBoardActive ? 'text-accent-foreground' : 'text-muted-foreground hover:text-accent-foreground'
                                          }`}
                                        >
                                          <LayoutGrid className="h-3 w-3 flex-shrink-0" />
                                          <span className="flex-1 font-medium truncate">{board.name}</span>
                                        </Link>
                                        <button
                                          onClick={openDeleteBoard}
                                          className="p-1.5 hover:bg-destructive/20 rounded mr-2"
                                          title="Delete board"
                                        >
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }
                            
                            // Show documents tree when on documents view
                            if (isSpaceOnDocumentsView) {
                              return (
                                <div className="ml-6 pl-4 mt-1" style={{ height: '500px' }}>
                                  <PageTree
                                    spaceSlug={space.slug}
                                    onPageOpen={(pageId) => router.push(`/spaces/${space.slug}/documents/${pageId}`)}
                                    onPageCreate={async (parentId, title) => {
                                      try {
                                        const response = await fetch(`/api/spaces/${space.slug}/pages`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          credentials: 'include',
                                          body: JSON.stringify({ title, parentId }),
                                        });
                                        const data = await response.json();
                                        return data.success ? data.page : null;
                                      } catch (error) {
                                        console.error('Failed to create page:', error);
                                        return null;
                                      }
                                    }}
                                    onPageMove={async (pageId, newParentId, newPosition) => {
                                      try {
                                        const response = await fetch(`/api/spaces/${space.slug}/pages/${pageId}/move`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          credentials: 'include',
                                          body: JSON.stringify({ newParentId, newPosition }),
                                        });
                                        const data = await response.json();
                                        return data.success;
                                      } catch (error) {
                                        console.error('Failed to move page:', error);
                                        return false;
                                      }
                                    }}
                                    onPageDelete={async (pageId) => {
                                      if (!confirm('Are you sure you want to delete this page?')) return false;
                                      try {
                                        const response = await fetch(`/api/spaces/${space.slug}/documents/${pageId}`, {
                                          method: 'DELETE',
                                          credentials: 'include',
                                        });
                                        const data = await response.json();
                                        return data.success;
                                      } catch (error) {
                                        console.error('Failed to delete page:', error);
                                        return false;
                                      }
                                    }}
                                    showSearch={false}
                                    className="h-full"
                                  />
                                </div>
                              );
                            }
                            
                            // Default: show Pages link and Boards
                            return (
                              <div className="ml-6 pl-4 mt-1 space-y-0.5">
                                {/* Pages link */}
                                <div
                                  className={`group/item flex items-center rounded-md ${
                                    pathname === `/spaces/${space.slug}/documents` ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                                  }`}
                                >
                                  <Link
                                    href={`/spaces/${space.slug}/documents`}
                                    className={`flex items-center space-x-2 px-3 py-2 text-sm flex-1 transition-colors ${
                                      pathname === `/spaces/${space.slug}/documents` ? 'text-accent-foreground' : 'text-muted-foreground hover:text-accent-foreground'
                                    }`}
                                  >
                                    <FileText className="h-3 w-3 flex-shrink-0" />
                                    <span className="flex-1 font-medium truncate">Pages</span>
                                  </Link>
                                </div>
                                {/* Boards */}
                                {boards.map((board) => {
                                  const currentBoardId = searchParams?.get('boardId');
                                  const isBoardActive = currentBoardId === board.id;
                                  const openDeleteBoard = (e: React.MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setBoardToDelete({ id: board.id, name: board.name, spaceSlug: space.slug });
                                    setDeleteBoardDialogOpen(true);
                                  };

                                  return (
                                    <div
                                      key={board.id}
                                      className={`group/item flex items-center rounded-md ${
                                        isBoardActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                                      }`}
                                    >
                                      <Link
                                        href={`/spaces/${space.slug}?view=board&boardId=${board.id}`}
                                        className={`flex items-center space-x-2 px-3 py-2 text-sm flex-1 transition-colors ${
                                          isBoardActive ? 'text-accent-foreground' : 'text-muted-foreground hover:text-accent-foreground'
                                        }`}
                                      >
                                        <LayoutGrid className="h-3 w-3 flex-shrink-0" />
                                        <span className="flex-1 font-medium truncate">{board.name}</span>
                                      </Link>
                                      <button
                                        onClick={openDeleteBoard}
                                        className="p-1.5 hover:bg-destructive/20 rounded mr-2"
                                        title="Delete board"
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <Link
                          href={`/spaces/${space.slug}`}
                          className={`flex items-center justify-center px-3 py-2 rounded-md text-sm transition-colors ${
                            isActive
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Footer - Theme only (Profile/Settings/Logout removed) */}
      <div className="p-4 border-t border-border">
        {!isCollapsed && (
          <div className="space-y-2">
            <ThemeToggle />
          </div>
        )}
      </div>

      {/* Delete Space Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Space</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{spaceToDelete?.name}"</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-destructive mb-1">This action cannot be undone</h4>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete the space and all of its data including:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• All tasks and subtasks</li>
                    <li>• All boards and their configurations</li>
                    <li>• All team members and their access</li>
                    <li>• All custom fields and settings</li>
                    <li>• All comments and activity history</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSpace}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Space
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Board Confirmation Dialog */}
      <Dialog open={deleteBoardDialogOpen} onOpenChange={setDeleteBoardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Board</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{boardToDelete?.name}"</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-destructive mb-1">This action cannot be undone</h4>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete the board and all of its data including:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• All statuses and configuration</li>
                    <li>• Column settings and WIP limits</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteBoardDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!boardToDelete) return;
                try {
                  const response = await fetch(`/api/spaces/${boardToDelete.spaceSlug}/boards/${boardToDelete.id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                  });
                  const data = await response.json();
                  if (data.success) {
                    onRefreshSpaces?.();
                    // If currently viewing this board, navigate back to the space root
                    if (pathname.includes(`/boards/${boardToDelete.id}`)) {
                      router.push(`/spaces/${boardToDelete.spaceSlug}`);
                    }
                  } else {
                    alert(data.message || 'Failed to delete board');
                  }
                } catch (error) {
                  console.error('Error deleting board:', error);
                  alert('Failed to delete board');
                } finally {
                  setDeleteBoardDialogOpen(false);
                  setBoardToDelete(null);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
