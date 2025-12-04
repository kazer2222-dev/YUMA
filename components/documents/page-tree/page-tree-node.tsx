'use client';

import React, { useRef, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FileText, MoreHorizontal, Plus, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePageTree } from './page-tree-context';
import {
  PageTreeNode as PageTreeNodeType,
  PageStatus,
  ANIMATION_DURATIONS,
  ANIMATION_EASING,
  TREE_SPACING,
  PAGE_STATUS_COLORS,
} from './types';

import { InlinePageCreator } from './inline-page-creator';

interface PageTreeNodeProps {
  node: PageTreeNodeType;
  depth: number;
  isFirst: boolean;
  isLast: boolean;
  onSelect?: (nodeId: string) => void;
  onOpen?: (nodeId: string) => void;
  onContextMenu?: (e: React.MouseEvent, nodeId: string) => void;
  onCreateChild?: (parentId: string) => void;
  onCreateSibling?: (siblingId: string) => void;
  onInlineCreateSubmit?: (title: string) => Promise<void>;
  onInlineCreateCancel?: () => void;
  renderConnectingLines?: boolean;
  parentLineDepths?: number[]; // Depths that need vertical lines
}

// Memoized connecting line component
const ConnectingLines = memo(function ConnectingLines({
  depth,
  isLast,
  hasChildren,
  isExpanded,
  parentLineDepths,
}: {
  depth: number;
  isLast: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  parentLineDepths: number[];
}) {
  if (depth === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Vertical lines for each ancestor level */}
      {parentLineDepths.map((lineDepth) => (
        <div
          key={`vline-${lineDepth}`}
          className="absolute top-0 bottom-0"
          style={{
            left: `${lineDepth * TREE_SPACING.indentPerLevel + TREE_SPACING.chevronMarginLeft + TREE_SPACING.chevronSize / 2}px`,
            width: '1px',
            background: 'repeating-linear-gradient(to bottom, var(--tree-line-color) 0, var(--tree-line-color) 4px, transparent 4px, transparent 8px)',
          }}
        />
      ))}

      {/* Current node's L-shaped connector */}
      {depth > 0 && (
        <>
          {/* Vertical part of L */}
          <div
            className="absolute"
            style={{
              left: `${(depth - 1) * TREE_SPACING.indentPerLevel + TREE_SPACING.chevronMarginLeft + TREE_SPACING.chevronSize / 2}px`,
              top: 0,
              bottom: isLast ? '50%' : 0,
              width: '1px',
              background: 'repeating-linear-gradient(to bottom, var(--tree-line-color) 0, var(--tree-line-color) 4px, transparent 4px, transparent 8px)',
            }}
          />
          {/* Horizontal part of L */}
          <div
            className="absolute"
            style={{
              left: `${(depth - 1) * TREE_SPACING.indentPerLevel + TREE_SPACING.chevronMarginLeft + TREE_SPACING.chevronSize / 2}px`,
              top: '50%',
              width: `${TREE_SPACING.connectingLineOffset}px`,
              height: '1px',
              background: 'repeating-linear-gradient(to right, var(--tree-line-color) 0, var(--tree-line-color) 4px, transparent 4px, transparent 8px)',
            }}
          />
        </>
      )}
    </div>
  );
});

// Status badge component
const StatusBadge = memo(function StatusBadge({ status }: { status: PageStatus }) {
  if (status === 'DRAFT') return null; // Don't show badge for draft (default)

  const colors = PAGE_STATUS_COLORS[status];
  return (
    <span
      className="px-1.5 py-0.5 text-[10px] font-medium rounded"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {status.replace('_', ' ')}
    </span>
  );
});

// Label lozenge component
const LabelLozenge = memo(function LabelLozenge({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  return (
    <span
      className="px-1.5 py-0.5 text-[10px] font-medium rounded"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {name}
    </span>
  );
});

export const PageTreeNodeComponent = memo(function PageTreeNodeComponent({
  node,
  depth,
  isFirst,
  isLast,
  onSelect,
  onOpen,
  onContextMenu,
  onCreateChild,
  onCreateSibling,
  onInlineCreateSubmit,
  onInlineCreateCancel,
  renderConnectingLines = true,
  parentLineDepths = [],
}: PageTreeNodeProps) {
  const {
    state,
    toggleExpand,
    expandRecursive,
    collapseRecursive,
    setSelected,
    setFocused,
    inlineCreator,
  } = usePageTree();

  const rowRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Check if we are creating a child for this node
  const isCreatingChild = inlineCreator?.parentId === node.id;

  // Force expand if creating child
  const isExpanded = state.expandedIds.has(node.id) || isCreatingChild;
  const isSelected = state.selectedId === node.id;
  const isFocused = state.focusedId === node.id;
  const hasChildren = node.childCount > 0 || Boolean(node.children && node.children.length > 0) || isCreatingChild;

  // Handle chevron click
  const handleChevronClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.altKey || e.metaKey) {
        // Alt/Option + click = recursive expand/collapse
        if (isExpanded) {
          collapseRecursive(node.id);
        } else {
          expandRecursive(node.id);
        }
      } else {
        toggleExpand(node.id);
      }
    },
    [node.id, isExpanded, toggleExpand, expandRecursive, collapseRecursive]
  );

  // Handle row click (open page)
  const handleRowClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent drag from interfering
      // Don't open if clicking directly on interactive elements
      const target = e.target as HTMLElement;

      // Only block if clicking directly on a button element itself
      // or if the target is inside a button that's visible and interactive
      if (target.tagName === 'BUTTON') {
        console.log('[PageTree] Click blocked - clicked directly on button');
        return;
      }

      // Check if target is inside a button, but only block if the button is visible
      const button = target.closest('button');
      if (button) {
        // Check if button is visible (not hidden by opacity)
        const computedStyle = window.getComputedStyle(button);
        const isVisible = computedStyle.opacity !== '0' && computedStyle.pointerEvents !== 'none';
        if (isVisible) {
          console.log('[PageTree] Click blocked - clicked inside visible button');
          return;
        }
      }

      // Check for no-dnd elements
      if (target.closest('[data-no-dnd="true"]')) {
        console.log('[PageTree] Click blocked - clicked on no-dnd element');
        return;
      }

      console.log('[PageTree] Opening document:', node.id, node.title);
      setSelected(node.id);
      setFocused(node.id);
      onSelect?.(node.id);
      onOpen?.(node.id);
    },
    [node.id, node.title, setSelected, setFocused, onSelect, onOpen]
  );

  // Handle context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setSelected(node.id);
      onContextMenu?.(e, node.id);
    },
    [node.id, setSelected, onContextMenu]
  );

  // Calculate parent line depths for children
  const childParentLineDepths = isLast
    ? parentLineDepths
    : [...parentLineDepths, depth];

  // Indent based on depth
  const indent = depth * TREE_SPACING.indentPerLevel;

  return (
    <>
      {/* Node Row */}
      <motion.div
        // ... (props)
        ref={rowRef}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-level={depth + 1}
        tabIndex={isFocused ? 0 : -1}
        className={cn(
          'page-tree-node relative flex items-center h-8 cursor-pointer select-none group/node rounded gap-2 pr-3',
          'transition-colors duration-100',
          isSelected && 'bg-[var(--primary)] text-white',
          !isSelected && isHovered && 'bg-[var(--muted)] text-[var(--foreground)]',
          !isSelected && !isHovered && 'text-muted-foreground'
        )}
        style={{ paddingLeft: `${indent + 12}px` }}
        onClick={handleRowClick}
        onPointerUp={(e) => {
          if (e.button === 0) {
            handleRowClick(e as any);
          }
        }}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: ANIMATION_DURATIONS.selectionChange / 1000, ease: 'easeOut' }}
      >
        {/* Connecting Lines */}
        {renderConnectingLines && (
          <ConnectingLines
            depth={depth}
            isLast={isLast}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            parentLineDepths={parentLineDepths}
          />
        )}

        {/* Toggle Chevron */}
        {hasChildren && (
          <button
            className={cn(
              'toggle-chevron flex items-center justify-center w-4 h-4 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10 flex-shrink-0',
            )}
            onClick={handleChevronClick}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            data-no-dnd="true"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: ANIMATION_DURATIONS.expandNode / 1000 * 0.5, ease: 'easeOut' }}
            >
              <ChevronRight className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-muted-foreground")} />
            </motion.div>
          </button>
        )}

        {/* Page Icon */}
        <div className="flex items-center justify-center w-5 h-5">
          {node.icon ? (
            <span className="text-sm">{node.icon}</span>
          ) : (
            <FileText className={cn("w-4 h-4", isSelected ? "text-white" : "text-muted-foreground")} />
          )}
        </div>

        {/* Title */}
        <span className={cn(
          "flex-1 truncate transition-colors",
          isSelected ? "text-white font-medium" : "text-inherit group-hover/node:text-foreground"
        )}>
          {node.title || 'Untitled'}
        </span>

        {/* ... (Draft, Status, Labels, Hover Actions) */}
        {node.hasUnpublishedChanges && (
          <Pencil className="w-3 h-3 text-amber-500 mr-1" aria-label="Has unpublished changes" />
        )}

        <StatusBadge status={node.status} />

        <div className="hidden group-hover/node:flex items-center gap-1 mx-2">
          {node.labels.slice(0, 2).map((label) => (
            <LabelLozenge key={label.id} name={label.name} color={label.color} />
          ))}
          {node.labels.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{node.labels.length - 2}</span>
          )}
        </div>

        <div className={cn(
          'flex items-center gap-0.5 opacity-0 group-hover/node:opacity-100 transition-opacity',
          isSelected && 'opacity-100'
        )}>
          <button
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onCreateChild?.(node.id);
            }}
            aria-label="Add child page"
          >
            <Plus className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-muted-foreground")} />
          </button>

          <button
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu?.(e, node.id);
            }}
            aria-label="More options"
          >
            <MoreHorizontal className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-muted-foreground")} />
          </button>
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isExpanded && (hasChildren || isCreatingChild) && (
          <motion.div
            role="group"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: ANIMATION_DURATIONS.expandNode / 1000, ease: ANIMATION_EASING.easeOut },
              opacity: { duration: ANIMATION_DURATIONS.expandNode / 1000, delay: 0.05 },
            }}
            style={{ overflow: 'hidden' }}
          >
            {/* Inline Creator */}
            {isCreatingChild && onInlineCreateSubmit && onInlineCreateCancel && (
              <div className="relative">
                {/* Connecting lines for creator */}
                {renderConnectingLines && (
                  <ConnectingLines
                    depth={depth + 1}
                    isLast={!node.children || node.children.length === 0}
                    hasChildren={false}
                    isExpanded={false}
                    parentLineDepths={childParentLineDepths}
                  />
                )}
                <InlinePageCreator
                  parentId={node.id}
                  depth={depth + 1}
                  onSubmit={onInlineCreateSubmit}
                  onCancel={onInlineCreateCancel}
                />
              </div>
            )}

            {node.children && node.children.map((child, index) => (
              <PageTreeNodeComponent
                key={child.id}
                node={child}
                depth={depth + 1}
                isFirst={index === 0 && !isCreatingChild}
                isLast={index === node.children!.length - 1}
                onSelect={onSelect}
                onOpen={onOpen}
                onContextMenu={onContextMenu}
                onCreateChild={onCreateChild}
                onCreateSibling={onCreateSibling}
                onInlineCreateSubmit={onInlineCreateSubmit}
                onInlineCreateCancel={onInlineCreateCancel}
                renderConnectingLines={renderConnectingLines}
                parentLineDepths={childParentLineDepths}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default PageTreeNodeComponent;

