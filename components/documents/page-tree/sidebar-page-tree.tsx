'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarPageNode {
  id: string;
  parentId: string | null;
  title: string;
  icon?: string | null;
  childCount: number;
  children?: SidebarPageNode[];
}

interface SidebarPageTreeProps {
  spaceSlug: string;
  isCollapsed?: boolean;
}

// Minimal tree node for sidebar
const SidebarTreeNode = memo(function SidebarTreeNode({
  node,
  depth,
  spaceSlug,
  isLast,
  expandedNodes,
  onToggleExpand,
}: {
  node: SidebarPageNode;
  depth: number;
  spaceSlug: string;
  isLast: boolean;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
}) {
  const router = useRouter();
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.childCount > 0 || (node.children && node.children.length > 0);

  const handleChevronClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleExpand(node.id);
  }, [node.id, onToggleExpand]);

  const handleNavigate = useCallback(() => {
    router.push(`/spaces/${spaceSlug}/documents/${node.id}`);
  }, [router, spaceSlug, node.id]);

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer',
          'hover:bg-accent/50 transition-colors text-sm'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleNavigate}
      >
        {/* Chevron */}
        {hasChildren ? (
          <button
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-accent"
            onClick={handleChevronClick}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        {node.icon ? (
          <span className="text-sm">{node.icon}</span>
        ) : (
          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}

        {/* Title */}
        <span className="truncate text-muted-foreground group-hover:text-foreground transition-colors">
          {node.title || 'Untitled'}
        </span>
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            {node.children.map((child, index) => (
              <SidebarTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                spaceSlug={spaceSlug}
                isLast={index === node.children!.length - 1}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export function SidebarPageTree({ spaceSlug, isCollapsed }: SidebarPageTreeProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [pages, setPages] = useState<SidebarPageNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch pages
  useEffect(() => {
    if (!spaceSlug) return;

    const fetchPages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/spaces/${spaceSlug}/pages/tree`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success && data.pages) {
          // Build flat list (hierarchy will be available after schema migration)
          const rootNodes: SidebarPageNode[] = data.pages.map((page: any) => ({
            id: page.id,
            parentId: page.parentId,
            title: page.title,
            icon: page.icon,
            childCount: page.childCount || 0,
            children: [],
          }));

          setPages(rootNodes);
        }
      } catch (error) {
        console.error('Failed to fetch pages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, [spaceSlug]);

  const handleToggleSection = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleCreatePage = useCallback(async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: 'Untitled' }),
      });
      const data = await response.json();
      if (data.success && data.page) {
        router.push(`/spaces/${spaceSlug}/documents/${data.page.id}`);
      }
    } catch (error) {
      console.error('Failed to create page:', error);
    }
  }, [spaceSlug, router]);

  if (isCollapsed) {
    return (
      <div className="px-2 py-1">
        <button
          className="w-full flex items-center justify-center p-2 rounded-md hover:bg-accent transition-colors"
          onClick={() => router.push(`/spaces/${spaceSlug}/documents`)}
          title="Pages"
        >
          <FileText className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={handleToggleSection}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span>Pages</span>
        </button>
        <button
          onClick={handleCreatePage}
          className="p-1 rounded hover:bg-accent transition-colors"
          title="New page"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Pages Tree */}
      {isExpanded && (
        <div className="space-y-0.5 px-1">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
          ) : pages.length === 0 ? (
            <button
              onClick={handleCreatePage}
              className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground text-left transition-colors"
            >
              + Create a page
            </button>
          ) : (
            pages.map((page, index) => (
              <SidebarTreeNode
                key={page.id}
                node={page}
                depth={0}
                spaceSlug={spaceSlug}
                isLast={index === pages.length - 1}
                expandedNodes={expandedNodes}
                onToggleExpand={handleToggleExpand}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SidebarPageTree;

