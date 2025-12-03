'use client';

import React, { useRef, useCallback, useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Search,
  Plus,
  FileText,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePageTree, PageTreeProvider } from './page-tree-context';
import { PageTreeNodeComponent } from './page-tree-node';
import { PageTreeContextMenu } from './page-tree-context-menu';
import { InlinePageCreator } from './inline-page-creator';
import { DocumentPermissionsDialog } from '../document-permissions-dialog';
import { DocumentHistoryDialog } from '../document-history-dialog';
import {
  PageTreeNode,
  ANIMATION_DURATIONS,
  TREE_SPACING,
} from './types';

interface PageTreeProps {
  spaceSlug: string;
  onPageSelect?: (pageId: string) => void;
  onPageOpen?: (pageId: string) => void;
  onPageCreate?: (parentId: string | null, title: string) => Promise<PageTreeNode | null>;
  onPageMove?: (pageId: string, newParentId: string | null, newPosition: number) => Promise<boolean>;
  onPageDelete?: (pageId: string) => Promise<boolean>;
  className?: string;
  showSearch?: boolean;
}

// Sortable tree node wrapper
const SortableTreeNode = memo(function SortableTreeNode({
  node,
  depth,
  isFirst,
  isLast,
  parentLineDepths,
  onSelect,
  onOpen,
  onContextMenu,
  onCreateChild,
  onInlineCreateSubmit,
  onInlineCreateCancel,
}: {
  node: PageTreeNode;
  depth: number;
  isFirst: boolean;
  isLast: boolean;
  parentLineDepths: number[];
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onCreateChild: (id: string) => void;
  onInlineCreateSubmit: (title: string) => Promise<void>;
  onInlineCreateCancel: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Only apply drag listeners to non-interactive parts
  // The chevron and buttons should not trigger drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Don't start drag if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('[data-no-dnd="true"]') ||
      target.closest('.toggle-chevron')
    ) {
      e.stopPropagation();
      return;
    }
    // Call original drag handler
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e as any);
    }
  }, [listeners]);

  const dragListeners = listeners ? {
    ...listeners,
    onPointerDown: handlePointerDown,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...dragListeners}
    >
      <PageTreeNodeComponent
        node={node}
        depth={depth}
        isFirst={isFirst}
        isLast={isLast}
        parentLineDepths={parentLineDepths}
        onSelect={onSelect}
        onOpen={onOpen}
        onContextMenu={onContextMenu}
        onCreateChild={onCreateChild}
        onInlineCreateSubmit={onInlineCreateSubmit}
        onInlineCreateCancel={onInlineCreateCancel}
      />
    </div>
  );
});

// Drag overlay ghost
const DragGhost = memo(function DragGhost({ nodes }: { nodes: PageTreeNode[] }) {
  if (nodes.length === 0) return null;

  return (
    <div
      className="bg-background/95 backdrop-blur-sm border-2 border-blue-500 rounded-lg shadow-lg px-3 py-2"
      style={{ opacity: 0.9 }}
    >
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium">
          {nodes.length === 1 ? nodes[0].title || 'Untitled' : `${nodes.length} pages`}
        </span>
      </div>
    </div>
  );
});


// Inner tree component (uses context)
function PageTreeInner({
  spaceSlug,
  onPageSelect,
  onPageOpen,
  onPageCreate,
  onPageMove,
  onPageDelete,
  className,
  showSearch = true,
}: PageTreeProps) {
  const {
    state,
    dispatch,
    setNodes,
    setSearchQuery,
    setSelected,
    getVisibleNodes,
    startDrag,
    endDrag,
    updateDropTarget,
    isDescendantOf,
    inlineCreator,
    setInlineCreator,
  } = usePageTree();

  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [draggedNodes, setDraggedNodes] = useState<PageTreeNode[]>([]);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedNodeForPermissions, setSelectedNodeForPermissions] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedNodeForHistory, setSelectedNodeForHistory] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load expanded state from localStorage
  useEffect(() => {
    const storedState = localStorage.getItem(`pageTree_${spaceSlug}_expanded`);
    if (storedState) {
      try {
        const expandedIds = JSON.parse(storedState);
        if (Array.isArray(expandedIds)) {
          dispatch({ type: 'SET_EXPANDED_IDS', payload: new Set(expandedIds) });
        }
      } catch (e) {
        console.error('Failed to parse stored tree state:', e);
      }
    }
  }, [spaceSlug]);

  // Save expanded state to localStorage when it changes
  useEffect(() => {
    const expandedArray = Array.from(state.expandedIds);
    localStorage.setItem(`pageTree_${spaceSlug}_expanded`, JSON.stringify(expandedArray));
  }, [state.expandedIds, spaceSlug]);

  // Fetch pages function (can be called to refresh)
  const fetchPages = useCallback(async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/pages/tree`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && data.pages) {
        setNodes(data.pages);
      }
    } catch (error) {
      console.error('Failed to fetch page tree:', error);
    }
  }, [spaceSlug, setNodes]);

  // Fetch pages on mount
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);


  // Handle search
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  // Handle page selection
  const handlePageSelect = useCallback(
    (pageId: string) => {
      setSelected(pageId);
      onPageSelect?.(pageId);
    },
    [setSelected, onPageSelect]
  );

  // Handle page open
  const handlePageOpen = useCallback(
    (pageId: string) => {
      onPageOpen?.(pageId);
    },
    [onPageOpen]
  );

  // Handle context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
    },
    []
  );

  // Handle create child
  const handleCreateChild = useCallback(
    (parentId: string) => {
      setInlineCreator({ parentId, afterId: null });
    },
    []
  );

  // Handle inline create submit
  const handleInlineCreateSubmit = useCallback(
    async (title: string) => {
      if (!inlineCreator || !onPageCreate) return;

      try {
        const newPage = await onPageCreate(inlineCreator.parentId, title);
        if (newPage) {
          // Page created successfully, close inline creator and refresh tree
          setInlineCreator(null);
          await fetchPages();
          // Navigate to the new page
          onPageOpen?.(newPage.id);
        } else {
          throw new Error('Failed to create page');
        }
      } catch (error) {
        console.error('Page creation failed:', error);
        throw error; // Propagate to InlinePageCreator
      }
    },
    [inlineCreator, onPageCreate, fetchPages, onPageOpen]
  );

  // Handle inline create cancel
  const handleInlineCreateCancel = useCallback(() => {
    setInlineCreator(null);
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const nodeId = event.active.id as string;
      const node = state.nodes.get(nodeId);
      if (node) {
        setDraggedNodes([node]);
        startDrag([nodeId]);
      }
    },
    [state.nodes, startDrag]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) {
        updateDropTarget(null);
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      // Prevent dropping onto self or descendants
      if (activeId === overId || isDescendantOf(overId, activeId)) {
        updateDropTarget({ nodeId: overId, position: 'inside', depth: 0, isValid: false });
        return;
      }

      // Valid drop target
      const overNode = state.nodes.get(overId);
      updateDropTarget({
        nodeId: overId,
        position: 'inside',
        depth: overNode?.depth || 0,
        isValid: true,
      });
    },
    [state.nodes, updateDropTarget, isDescendantOf]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      endDrag();
      setDraggedNodes([]);

      if (!over || !onPageMove) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      if (activeId === overId || isDescendantOf(overId, activeId)) {
        return;
      }

      // Move page
      const overNode = state.nodes.get(overId);
      await onPageMove(activeId, overId, (overNode?.position || 0) + 1);
    },
    [endDrag, onPageMove, state.nodes, isDescendantOf]
  );

  // Get visible nodes
  const visibleNodes = getVisibleNodes();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      const currentIndex = visibleNodes.findIndex((n) => n.id === state.focusedId);
      if (currentIndex === -1) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < visibleNodes.length - 1) {
            setSelected(visibleNodes[currentIndex + 1].id);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelected(visibleNodes[currentIndex - 1].id);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (state.selectedId) {
            handlePageOpen(state.selectedId);
          }
          break;
        case ' ':
          e.preventDefault();
          // Toggle expand handled by PageTreeNodeComponent
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleNodes, state.focusedId, state.selectedId, setSelected, handlePageOpen]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  return (
    <div
      ref={containerRef}
      className={cn('page-tree flex flex-col h-full', className)}
      role="tree"
      aria-label="Page tree"
    >
      {/* Header with search and controls */}
      <div className="flex-shrink-0 p-3 space-y-2 border-b border-border">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search pages..."
              value={state.searchQuery}
              onChange={handleSearchChange}
              className="pl-8 h-8 text-sm"
            />
          </div>
        )}

      </div>

      {/* Tree content */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {state.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : visibleNodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {state.searchQuery ? 'No pages match your search' : 'No pages yet'}
            </p>
            {!state.searchQuery && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setInlineCreator({ parentId: null, afterId: null })}
                className="mt-2"
              >
                Create your first page
              </Button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={visibleNodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
              {/* Render root nodes */}
              {state.rootIds.map((rootId, index) => {
                const node = state.nodes.get(rootId);
                if (!node) return null;
                if (state.filteredIds && !state.filteredIds.has(rootId)) return null;

                return (
                  <SortableTreeNode
                    key={rootId}
                    node={node}
                    depth={0}
                    isFirst={index === 0}
                    isLast={index === state.rootIds.length - 1}
                    parentLineDepths={[]}
                    onSelect={handlePageSelect}
                    onOpen={handlePageOpen}
                    onContextMenu={handleContextMenu}
                    onCreateChild={handleCreateChild}
                    onInlineCreateSubmit={handleInlineCreateSubmit}
                    onInlineCreateCancel={handleInlineCreateCancel}
                  />
                );
              })}
            </SortableContext>

            <DragOverlay>
              <DragGhost nodes={draggedNodes} />
            </DragOverlay>
          </DndContext>
        )}


      </div>

      <AnimatePresence>
        {contextMenu && (
          <PageTreeContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            nodeId={contextMenu.nodeId}
            onClose={() => setContextMenu(null)}
            onAddChild={handleCreateChild}
            onDelete={onPageDelete}
            onOpen={handlePageOpen}
            onCopy={async (nodeId) => {
              try {
                const response = await fetch(`/api/spaces/${spaceSlug}/pages/${nodeId}/copy`, {
                  method: 'POST',
                  credentials: 'include',
                });
                const data = await response.json();
                if (data.success && data.page) {
                  // Refresh the tree to show the new copied page
                  await fetchPages();
                  // Optionally navigate to the copied page
                  // onPageOpen?.(data.page.id);
                } else {
                  console.error('Failed to copy page:', data.message);
                  alert(data.message || 'Failed to copy page');
                }
              } catch (error) {
                console.error('Failed to copy page:', error);
                alert('Failed to copy page. Please try again.');
              }
            }}
            onPermissions={(nodeId) => {
              setSelectedNodeForPermissions(nodeId);
              setPermissionsDialogOpen(true);
              setContextMenu(null);
            }}
            onViewHistory={(nodeId) => {
              setSelectedNodeForHistory(nodeId);
              setHistoryDialogOpen(true);
              setContextMenu(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Permissions Dialog */}
      {selectedNodeForPermissions && (
        <DocumentPermissionsDialog
          open={permissionsDialogOpen}
          onOpenChange={setPermissionsDialogOpen}
          documentId={selectedNodeForPermissions}
          spaceSlug={spaceSlug}
        />
      )}

      {/* History Dialog */}
      {selectedNodeForHistory && (
        <DocumentHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          documentId={selectedNodeForHistory}
          spaceSlug={spaceSlug}
        />
      )}

      {/* CSS Variables for connecting lines */}
      <style jsx global>{`
        .page-tree {
          --tree-line-color: #D0D0D0;
        }
        
        .dark .page-tree {
          --tree-line-color: #444444;
        }
      `}</style>
    </div>
  );
}

// Main export with provider
export function PageTree(props: PageTreeProps) {
  return (
    <PageTreeProvider>
      <PageTreeInner {...props} />
    </PageTreeProvider>
  );
}

export default PageTree;

