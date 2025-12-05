'use client';

import React, { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Copy,
  Trash2,
  ExternalLink,
  FileText,
  MoveVertical,
  Archive,
  History,
  Lock,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ANIMATION_DURATIONS } from './types';

interface PageTreeContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  onClose: () => void;
  onAddChild?: (nodeId: string) => void;
  onAddSibling?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => Promise<boolean>;
  onOpen?: (nodeId: string) => void;
  onMove?: (nodeId: string) => void;
  onCopy?: (nodeId: string) => void;
  onArchive?: (nodeId: string) => void;
  onExport?: (nodeId: string) => void;
  onViewHistory?: (nodeId: string) => void;
  onPermissions?: (nodeId: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  divider?: boolean;
  danger?: boolean;
  onClick: () => void;
}

export const PageTreeContextMenu = memo(function PageTreeContextMenu({
  x,
  y,
  nodeId,
  onClose,
  onAddChild,
  onAddSibling,
  onDelete,
  onOpen,
  onMove,
  onCopy,
  onArchive,
  onExport,
  onViewHistory,
  onPermissions,
}: PageTreeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Position adjustment to keep menu in viewport
  const adjustedPosition = { x, y };

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        adjustedPosition.x = viewportWidth - rect.width - 8;
      }
      if (rect.bottom > viewportHeight) {
        adjustedPosition.y = viewportHeight - rect.height - 8;
      }
    }
  }, [x, y]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const menuItems: MenuItem[] = [
    {
      id: 'open',
      label: 'Open page',
      icon: ExternalLink,
      shortcut: 'Enter',
      onClick: () => {
        onOpen?.(nodeId);
        onClose();
      },
    },
    {
      id: 'add-child',
      label: 'Add child page',
      icon: Plus,
      shortcut: '⌘N',
      onClick: () => {
        onAddChild?.(nodeId);
        onClose();
      },
    },
    {
      id: 'divider-1',
      label: '',
      icon: () => null,
      divider: true,
      onClick: () => { },
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: Copy,
      shortcut: '⌘C',
      onClick: () => {
        onCopy?.(nodeId);
        onClose();
      },
    },
    {
      id: 'divider-2',
      label: '',
      icon: () => null,
      divider: true,
      onClick: () => { },
    },
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      onClick: () => {
        onExport?.(nodeId);
        onClose();
      },
    },
    {
      id: 'history',
      label: 'View history',
      icon: History,
      onClick: () => {
        onViewHistory?.(nodeId);
        onClose();
      },
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: Lock,
      onClick: () => {
        onPermissions?.(nodeId);
        onClose();
      },
    },
    {
      id: 'divider-3',
      label: '',
      icon: () => null,
      divider: true,
      onClick: () => { },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      onClick: async () => {
        if (onDelete) {
          await onDelete(nodeId);
        }
        onClose();
      },
    },
  ];

  return (
    <motion.div
      ref={menuRef}
      className={cn(
        'fixed z-50 min-w-[200px] bg-popover border border-border rounded-lg shadow-lg overflow-hidden',
        'backdrop-blur-sm'
      )}
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: ANIMATION_DURATIONS.selectionChange / 1000, ease: 'easeOut' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        {menuItems.map((item) => {
          if (item.divider) {
            return <div key={item.id} className="my-1 h-px bg-border" />;
          }

          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors',
                'hover:bg-accent',
                item.danger && 'text-destructive hover:text-destructive hover:bg-destructive/10'
              )}
              onClick={item.onClick}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-muted-foreground">{item.shortcut}</span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
});

export default PageTreeContextMenu;







