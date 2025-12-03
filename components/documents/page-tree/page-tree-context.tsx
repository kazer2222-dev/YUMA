'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode, useState } from 'react';
import { PageTreeNode, PageTreeState, DragState, DropTarget } from './types';

// Actions
type PageTreeAction =
  | { type: 'SET_NODES'; payload: PageTreeNode[] }
  | { type: 'ADD_NODE'; payload: PageTreeNode }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<PageTreeNode> } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'MOVE_NODE'; payload: { nodeId: string; newParentId: string | null; newPosition: number } }
  | { type: 'TOGGLE_EXPAND'; payload: string }
  | { type: 'EXPAND_NODE'; payload: string }
  | { type: 'COLLAPSE_NODE'; payload: string }
  | { type: 'EXPAND_ALL' }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'EXPAND_RECURSIVE'; payload: string }
  | { type: 'COLLAPSE_RECURSIVE'; payload: string }
  | { type: 'SET_SELECTED'; payload: string | null }
  | { type: 'SET_FOCUSED'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_DRAG_STATE'; payload: DragState | null }
  | { type: 'SET_DROP_TARGET'; payload: DropTarget | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EXPANDED_IDS'; payload: Set<string> };

// Initial state
const initialState: PageTreeState = {
  nodes: new Map(),
  rootIds: [],
  expandedIds: new Set(),
  selectedId: null,
  focusedId: null,
  searchQuery: '',
  filteredIds: null,
  dragState: null,
  isLoading: false,
  error: null,
};

// Helper: Build tree from flat list
function buildTree(nodes: PageTreeNode[]): { nodeMap: Map<string, PageTreeNode>; rootIds: string[] } {
  const nodeMap = new Map<string, PageTreeNode>();
  const rootIds: string[] = [];
  const childrenMap = new Map<string, string[]>();

  // First pass: index all nodes
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
    if (!node.parentId) {
      rootIds.push(node.id);
    } else {
      const siblings = childrenMap.get(node.parentId) || [];
      siblings.push(node.id);
      childrenMap.set(node.parentId, siblings);
    }
  });

  // Second pass: assign children
  childrenMap.forEach((childIds, parentId) => {
    const parent = nodeMap.get(parentId);
    if (parent) {
      parent.children = childIds
        .map(id => nodeMap.get(id)!)
        .filter(Boolean)
        .sort((a, b) => a.position - b.position);
      parent.childCount = parent.children.length;
    }
  });

  // Sort root nodes
  rootIds.sort((a, b) => {
    const nodeA = nodeMap.get(a);
    const nodeB = nodeMap.get(b);
    return (nodeA?.position || 0) - (nodeB?.position || 0);
  });

  return { nodeMap, rootIds };
}

// Helper: Get all descendant IDs
function getDescendantIds(nodeMap: Map<string, PageTreeNode>, nodeId: string): string[] {
  const ids: string[] = [];
  const node = nodeMap.get(nodeId);
  if (!node?.children) return ids;

  const stack = [...node.children];
  while (stack.length > 0) {
    const current = stack.pop()!;
    ids.push(current.id);
    if (current.children) {
      stack.push(...current.children);
    }
  }
  return ids;
}

// Helper: Filter nodes by search query
function filterNodes(
  nodeMap: Map<string, PageTreeNode>,
  rootIds: string[],
  query: string
): Set<string> | null {
  if (!query.trim()) return null;

  const lowerQuery = query.toLowerCase();
  const matchingIds = new Set<string>();
  const ancestorIds = new Set<string>();

  // Find matching nodes
  nodeMap.forEach((node, id) => {
    if (node.title.toLowerCase().includes(lowerQuery)) {
      matchingIds.add(id);
      // Add all ancestors
      let current = node;
      while (current.parentId) {
        ancestorIds.add(current.parentId);
        current = nodeMap.get(current.parentId)!;
        if (!current) break;
      }
    }
  });

  // Combine matching and ancestor IDs
  return new Set([...Array.from(matchingIds), ...Array.from(ancestorIds)]);
}

// Reducer
function pageTreeReducer(state: PageTreeState, action: PageTreeAction): PageTreeState {
  switch (action.type) {
    case 'SET_NODES': {
      const { nodeMap, rootIds } = buildTree(action.payload);
      // Preserve expanded state
      const expandedIds = new Set<string>();
      nodeMap.forEach((node, id) => {
        if (state.expandedIds.has(id) || node.isExpanded) {
          expandedIds.add(id);
        }
      });
      return {
        ...state,
        nodes: nodeMap,
        rootIds,
        expandedIds,
        filteredIds: state.searchQuery
          ? filterNodes(nodeMap, rootIds, state.searchQuery)
          : null,
      };
    }

    case 'ADD_NODE': {
      const newNode = action.payload;
      const newNodes = new Map(state.nodes);
      newNodes.set(newNode.id, newNode);

      // Update parent's children
      if (newNode.parentId) {
        const parent = newNodes.get(newNode.parentId);
        if (parent) {
          const children = parent.children || [];
          newNodes.set(newNode.parentId, {
            ...parent,
            children: [...children, newNode].sort((a, b) => a.position - b.position),
            childCount: children.length + 1,
          });
        }
      }

      const rootIds = newNode.parentId
        ? state.rootIds
        : [...state.rootIds, newNode.id].sort((a, b) => {
          const nodeA = newNodes.get(a);
          const nodeB = newNodes.get(b);
          return (nodeA?.position || 0) - (nodeB?.position || 0);
        });

      return { ...state, nodes: newNodes, rootIds };
    }

    case 'UPDATE_NODE': {
      const { id, updates } = action.payload;
      const node = state.nodes.get(id);
      if (!node) return state;

      const newNodes = new Map(state.nodes);
      newNodes.set(id, { ...node, ...updates });
      return { ...state, nodes: newNodes };
    }

    case 'DELETE_NODE': {
      const nodeId = action.payload;
      const node = state.nodes.get(nodeId);
      if (!node) return state;

      const descendantIds = getDescendantIds(state.nodes, nodeId);
      const idsToDelete = new Set([nodeId, ...descendantIds]);

      const newNodes = new Map(state.nodes);
      idsToDelete.forEach(id => newNodes.delete(id));

      // Update parent's children
      if (node.parentId) {
        const parent = newNodes.get(node.parentId);
        if (parent) {
          const children = (parent.children || []).filter(c => c.id !== nodeId);
          newNodes.set(node.parentId, {
            ...parent,
            children,
            childCount: children.length,
          });
        }
      }

      const rootIds = node.parentId
        ? state.rootIds
        : state.rootIds.filter(id => id !== nodeId);

      const newExpandedIds = new Set(state.expandedIds);
      idsToDelete.forEach(id => newExpandedIds.delete(id));

      return {
        ...state,
        nodes: newNodes,
        rootIds,
        expandedIds: newExpandedIds,
        selectedId: idsToDelete.has(state.selectedId || '') ? null : state.selectedId,
      };
    }

    case 'TOGGLE_EXPAND': {
      const nodeId = action.payload;
      const newExpandedIds = new Set(state.expandedIds);
      if (newExpandedIds.has(nodeId)) {
        newExpandedIds.delete(nodeId);
      } else {
        newExpandedIds.add(nodeId);
      }
      return { ...state, expandedIds: newExpandedIds };
    }

    case 'EXPAND_NODE': {
      const newExpandedIds = new Set(state.expandedIds);
      newExpandedIds.add(action.payload);
      return { ...state, expandedIds: newExpandedIds };
    }

    case 'COLLAPSE_NODE': {
      const newExpandedIds = new Set(state.expandedIds);
      newExpandedIds.delete(action.payload);
      return { ...state, expandedIds: newExpandedIds };
    }

    case 'EXPAND_ALL': {
      const newExpandedIds = new Set<string>();
      state.nodes.forEach((node, id) => {
        if (node.childCount > 0 || (node.children && node.children.length > 0)) {
          newExpandedIds.add(id);
        }
      });
      return { ...state, expandedIds: newExpandedIds };
    }

    case 'COLLAPSE_ALL': {
      return { ...state, expandedIds: new Set() };
    }

    case 'EXPAND_RECURSIVE': {
      const nodeId = action.payload;
      const descendantIds = getDescendantIds(state.nodes, nodeId);
      const newExpandedIds = new Set(state.expandedIds);
      newExpandedIds.add(nodeId);
      descendantIds.forEach(id => {
        const node = state.nodes.get(id);
        if (node && (node.childCount > 0 || (node.children && node.children.length > 0))) {
          newExpandedIds.add(id);
        }
      });
      return { ...state, expandedIds: newExpandedIds };
    }

    case 'COLLAPSE_RECURSIVE': {
      const nodeId = action.payload;
      const descendantIds = getDescendantIds(state.nodes, nodeId);
      const newExpandedIds = new Set(state.expandedIds);
      newExpandedIds.delete(nodeId);
      descendantIds.forEach(id => newExpandedIds.delete(id));
      return { ...state, expandedIds: newExpandedIds };
    }

    case 'SET_SELECTED':
      return { ...state, selectedId: action.payload };

    case 'SET_FOCUSED':
      return { ...state, focusedId: action.payload };

    case 'SET_SEARCH_QUERY': {
      const query = action.payload;
      const filteredIds = filterNodes(state.nodes, state.rootIds, query);
      // Auto-expand ancestors of matches
      if (filteredIds) {
        const newExpandedIds = new Set(state.expandedIds);
        filteredIds.forEach(id => {
          const node = state.nodes.get(id);
          if (node?.parentId) {
            newExpandedIds.add(node.parentId);
          }
        });
        return { ...state, searchQuery: query, filteredIds, expandedIds: newExpandedIds };
      }
      return { ...state, searchQuery: query, filteredIds: null };
    }

    case 'SET_DRAG_STATE':
      return { ...state, dragState: action.payload };

    case 'SET_DROP_TARGET':
      return {
        ...state,
        dragState: state.dragState
          ? { ...state.dragState, dropTarget: action.payload }
          : null,
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_EXPANDED_IDS':
      return { ...state, expandedIds: action.payload };

    default:
      return state;
  }
}

// Context
interface PageTreeContextValue {
  state: PageTreeState;
  dispatch: React.Dispatch<PageTreeAction>;
  // Convenience methods
  setNodes: (nodes: PageTreeNode[]) => void;
  addNode: (node: PageTreeNode) => void;
  updateNode: (id: string, updates: Partial<PageTreeNode>) => void;
  deleteNode: (id: string) => void;
  moveNode: (nodeId: string, newParentId: string | null, newPosition: number) => void;
  toggleExpand: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  expandRecursive: (nodeId: string) => void;
  collapseRecursive: (nodeId: string) => void;
  setSelected: (nodeId: string | null) => void;
  setFocused: (nodeId: string | null) => void;
  setSearchQuery: (query: string) => void;
  startDrag: (nodeIds: string[]) => void;
  updateDropTarget: (target: DropTarget | null) => void;
  endDrag: () => void;
  isNodeVisible: (nodeId: string) => boolean;
  getVisibleNodes: () => PageTreeNode[];
  getNodePath: (nodeId: string) => PageTreeNode[];
  isDescendantOf: (nodeId: string, potentialAncestorId: string) => boolean;
  inlineCreator: { parentId: string | null; afterId: string | null } | null;
  setInlineCreator: (creator: { parentId: string | null; afterId: string | null } | null) => void;
}

const PageTreeContext = createContext<PageTreeContextValue | null>(null);

export function PageTreeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pageTreeReducer, initialState);
  const [inlineCreator, setInlineCreator] = useState<{ parentId: string | null; afterId: string | null } | null>(null);

  const setNodes = useCallback((nodes: PageTreeNode[]) => {
    dispatch({ type: 'SET_NODES', payload: nodes });
  }, []);

  const addNode = useCallback((node: PageTreeNode) => {
    dispatch({ type: 'ADD_NODE', payload: node });
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<PageTreeNode>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id, updates } });
  }, []);

  const deleteNode = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NODE', payload: id });
  }, []);

  const moveNode = useCallback((nodeId: string, newParentId: string | null, newPosition: number) => {
    dispatch({ type: 'MOVE_NODE', payload: { nodeId, newParentId, newPosition } });
  }, []);

  const toggleExpand = useCallback((nodeId: string) => {
    dispatch({ type: 'TOGGLE_EXPAND', payload: nodeId });
  }, []);

  const expandNode = useCallback((nodeId: string) => {
    dispatch({ type: 'EXPAND_NODE', payload: nodeId });
  }, []);

  const collapseNode = useCallback((nodeId: string) => {
    dispatch({ type: 'COLLAPSE_NODE', payload: nodeId });
  }, []);

  const expandAll = useCallback(() => {
    dispatch({ type: 'EXPAND_ALL' });
  }, []);

  const collapseAll = useCallback(() => {
    dispatch({ type: 'COLLAPSE_ALL' });
  }, []);

  const expandRecursive = useCallback((nodeId: string) => {
    dispatch({ type: 'EXPAND_RECURSIVE', payload: nodeId });
  }, []);

  const collapseRecursive = useCallback((nodeId: string) => {
    dispatch({ type: 'COLLAPSE_RECURSIVE', payload: nodeId });
  }, []);

  const setSelected = useCallback((nodeId: string | null) => {
    dispatch({ type: 'SET_SELECTED', payload: nodeId });
  }, []);

  const setFocused = useCallback((nodeId: string | null) => {
    dispatch({ type: 'SET_FOCUSED', payload: nodeId });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const startDrag = useCallback((nodeIds: string[]) => {
    const nodes = nodeIds.map(id => state.nodes.get(id)).filter(Boolean) as PageTreeNode[];
    dispatch({
      type: 'SET_DRAG_STATE',
      payload: {
        draggedIds: nodeIds,
        draggedNodes: nodes,
        dropTarget: null,
        isDragging: true,
        ghostPosition: { x: 0, y: 0 },
      },
    });
  }, [state.nodes]);

  const updateDropTarget = useCallback((target: DropTarget | null) => {
    dispatch({ type: 'SET_DROP_TARGET', payload: target });
  }, []);

  const endDrag = useCallback(() => {
    dispatch({ type: 'SET_DRAG_STATE', payload: null });
  }, []);

  const isNodeVisible = useCallback((nodeId: string): boolean => {
    if (state.filteredIds && !state.filteredIds.has(nodeId)) {
      return false;
    }
    const node = state.nodes.get(nodeId);
    if (!node) return false;
    if (!node.parentId) return true;

    // Check if all ancestors are expanded
    let current = node;
    while (current.parentId) {
      if (!state.expandedIds.has(current.parentId)) {
        return false;
      }
      current = state.nodes.get(current.parentId)!;
      if (!current) break;
    }
    return true;
  }, [state.nodes, state.expandedIds, state.filteredIds]);

  const getVisibleNodes = useCallback((): PageTreeNode[] => {
    const visible: PageTreeNode[] = [];

    const traverse = (nodeIds: string[], depth: number) => {
      for (const id of nodeIds) {
        const node = state.nodes.get(id);
        if (!node) continue;

        // Check filter
        if (state.filteredIds && !state.filteredIds.has(id)) continue;

        visible.push({ ...node, depth });

        // Traverse children if expanded
        if (state.expandedIds.has(id) && node.children && node.children.length > 0) {
          traverse(
            node.children.map(c => c.id),
            depth + 1
          );
        }
      }
    };

    traverse(state.rootIds, 0);
    return visible;
  }, [state.nodes, state.rootIds, state.expandedIds, state.filteredIds]);

  const getNodePath = useCallback((nodeId: string): PageTreeNode[] => {
    const path: PageTreeNode[] = [];
    let current = state.nodes.get(nodeId);
    while (current) {
      path.unshift(current);
      if (current.parentId) {
        current = state.nodes.get(current.parentId);
      } else {
        break;
      }
    }
    return path;
  }, [state.nodes]);

  const isDescendantOf = useCallback((nodeId: string, potentialAncestorId: string): boolean => {
    let current = state.nodes.get(nodeId);
    while (current?.parentId) {
      if (current.parentId === potentialAncestorId) return true;
      current = state.nodes.get(current.parentId);
    }
    return false;
  }, [state.nodes]);

  const value = useMemo<PageTreeContextValue>(
    () => ({
      state,
      dispatch,
      setNodes,
      addNode,
      updateNode,
      deleteNode,
      moveNode,
      toggleExpand,
      expandNode,
      collapseNode,
      expandAll,
      collapseAll,
      expandRecursive,
      collapseRecursive,
      setSelected,
      setFocused,
      setSearchQuery,
      startDrag,
      updateDropTarget,
      endDrag,
      isNodeVisible,
      getVisibleNodes,
      getNodePath,
      isDescendantOf,
      inlineCreator,
      setInlineCreator,
    }),
    [
      state,
      setNodes,
      addNode,
      updateNode,
      deleteNode,
      moveNode,
      toggleExpand,
      expandNode,
      collapseNode,
      expandAll,
      collapseAll,
      expandRecursive,
      collapseRecursive,
      setSelected,
      setFocused,
      setSearchQuery,
      startDrag,
      updateDropTarget,
      endDrag,
      isNodeVisible,
      getVisibleNodes,
      getNodePath,
      isDescendantOf,
      inlineCreator,
      setInlineCreator,
    ]
  );

  return <PageTreeContext.Provider value={value}>{children}</PageTreeContext.Provider>;
}

export function usePageTree() {
  const context = useContext(PageTreeContext);
  if (!context) {
    throw new Error('usePageTree must be used within a PageTreeProvider');
  }
  return context;
}

