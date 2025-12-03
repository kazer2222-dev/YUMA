// Confluence-style Page Tree Types

export interface PageLabel {
  id: string;
  name: string;
  color: string; // Hex color for the lozenge
}

export type PageStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ARCHIVED';

export interface PageTreeNode {
  id: string;
  parentId: string | null;
  title: string;
  icon?: string; // Emoji or icon identifier
  status: PageStatus;
  labels: PageLabel[];
  hasUnpublishedChanges: boolean;
  position: number;
  childCount: number;
  children?: PageTreeNode[];
  isExpanded: boolean;
  depth: number;
  path: string[]; // Array of ancestor IDs for breadcrumb
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
}

export interface PageTreeState {
  nodes: Map<string, PageTreeNode>;
  rootIds: string[]; // Top-level page IDs
  expandedIds: Set<string>;
  selectedId: string | null;
  focusedId: string | null;
  searchQuery: string;
  filteredIds: Set<string> | null; // IDs visible after filtering
  dragState: DragState | null;
  isLoading: boolean;
  error: string | null;
}

export interface DragState {
  draggedIds: string[];
  draggedNodes: PageTreeNode[];
  dropTarget: DropTarget | null;
  isDragging: boolean;
  ghostPosition: { x: number; y: number };
}

export interface DropTarget {
  nodeId: string;
  position: 'before' | 'after' | 'inside'; // Reorder vs. reparent
  depth: number;
  isValid: boolean;
}

export interface TreeContextMenuAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  divider?: boolean;
  danger?: boolean;
  disabled?: boolean;
  action: (nodeId: string) => void;
}

// Animation timing constants (matching Confluence Cloud 2025)
export const ANIMATION_DURATIONS = {
  expandNode: 220,
  collapseNode: 180,
  recursiveExpand: 280,
  recursiveCollapse: 240,
  pageLoad: 300,
  dragStart: 120,
  dropZoneHover: 150,
  dropCommit: 200,
  inlineCreatorOpen: 180,
  inlineCreatorClose: 160,
  selectionChange: 150,
  rowHover: 100,
  remotePageAdd: 250,
  remoteMove: 300,
  remoteDelete: 200,
} as const;

// Animation easing
export const ANIMATION_EASING = {
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
} as const;

// Spacing constants (Confluence standard)
export const TREE_SPACING = {
  indentPerLevel: 28, // px per nesting level
  nodeHeight: 32, // Height of each tree row
  iconSize: 20, // Page icon size
  chevronSize: 16, // Expand/collapse chevron
  chevronMarginLeft: 8, // Left margin for chevron
  connectingLineOffset: 10, // Horizontal line to icon
  gapBetweenNodes: 0, // Gap between rows
} as const;

// Status badge colors
export const PAGE_STATUS_COLORS: Record<PageStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: '#FFF7E6', text: '#FA8C16', border: '#FFD591' },
  IN_REVIEW: { bg: '#E6F7FF', text: '#1890FF', border: '#91D5FF' },
  APPROVED: { bg: '#F6FFED', text: '#52C41A', border: '#B7EB8F' },
  ARCHIVED: { bg: '#F5F5F5', text: '#8C8C8C', border: '#D9D9D9' },
};

// Keyboard navigation
export interface KeyboardNavigationState {
  focusedIndex: number;
  visibleNodeIds: string[];
}

export type KeyboardAction = 
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'EXPAND'
  | 'COLLAPSE'
  | 'ENTER'
  | 'SPACE'
  | 'CREATE_CHILD';


