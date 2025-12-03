'use client';

import React, { useState, useRef, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ANIMATION_DURATIONS, TREE_SPACING } from './types';

interface InlinePageCreatorProps {
  parentId: string | null;
  depth?: number;
  onSubmit: (title: string) => Promise<void>;
  onCancel: () => void;
}

export const InlinePageCreator = memo(function InlinePageCreator({
  parentId,
  depth = parentId ? 1 : 0,
  onSubmit,
  onCancel,
}: InlinePageCreatorProps) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isSubmittingRef = useRef(false);

  // Handle key events
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (title.trim() && !isSubmittingRef.current) {
        isSubmittingRef.current = true;
        try {
          await onSubmit(title.trim());
        } catch (error) {
          console.error('Failed to submit:', error);
          isSubmittingRef.current = false;
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }
  };

  // Handle blur - only submit if Enter wasn't pressed
  const handleBlur = (e: React.FocusEvent) => {
    // Small delay to allow Enter key handler to run first
    setTimeout(async () => {
      if (!isSubmittingRef.current && title.trim()) {
        isSubmittingRef.current = true;
        try {
          await onSubmit(title.trim());
        } catch (error) {
          console.error('Failed to submit:', error);
          isSubmittingRef.current = false;
        }
      } else if (!title.trim() && !isSubmittingRef.current) {
        onCancel();
      }
    }, 100);
  };

  const indent = depth * TREE_SPACING.indentPerLevel;

  return (
    <motion.div
      className={cn(
        'page-tree-inline-creator flex items-center h-8 rounded',
        'bg-background border border-blue-500'
      )}
      style={{ marginLeft: `${indent}px` }}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 32, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{
        height: { duration: ANIMATION_DURATIONS.inlineCreatorOpen / 1000, ease: 'easeOut' },
        opacity: { duration: ANIMATION_DURATIONS.inlineCreatorOpen / 1000 },
      }}
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-5 h-5 ml-6">
        <FileText className="w-4 h-4 text-blue-500" />
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Page title"
        className={cn(
          'flex-1 px-2 py-1 text-sm bg-transparent outline-none',
          'placeholder:text-muted-foreground'
        )}
      />

      {/* Hint */}
      <span className="text-xs text-muted-foreground mr-2">
        Enter to create • Esc to cancel
      </span>
    </motion.div>
  );
});

export default InlinePageCreator;

