'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Node, mergeAttributes, InputRule } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';

// Toggle List NodeView Component
export const ToggleListView: React.FC<NodeViewProps> = ({ 
  node, 
  updateAttributes,
}) => {
  // Initialize state from node attrs
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const open = node.attrs.open === true;
    console.log('[ToggleList] Initial state:', open, 'node.attrs:', node.attrs);
    return open;
  });

  // Sync with node attrs when they change externally
  useEffect(() => {
    const open = node.attrs.open === true;
    console.log('[ToggleList] Node attrs changed, syncing state:', open);
    setIsOpen(open);
  }, [node.attrs.open]);

  // Toggle handler
  const handleToggle = useCallback((e: React.MouseEvent) => {
    console.log('[ToggleList] handleToggle called', {
      currentState: isOpen,
      eventType: e.type,
      target: e.target,
      currentTarget: e.currentTarget,
    });
    
    e.preventDefault();
    e.stopPropagation();
    
    const newValue = !isOpen;
    console.log('[ToggleList] Setting new state:', newValue);
    setIsOpen(newValue);
    
    // Defer the attribute update to avoid React render conflicts
    setTimeout(() => {
      console.log('[ToggleList] Calling updateAttributes with:', { open: newValue });
      updateAttributes({ open: newValue });
    }, 0);
  }, [isOpen, updateAttributes]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('[ToggleList] handleMouseDown called', {
      target: e.target,
      currentTarget: e.currentTarget,
    });
    e.preventDefault();
    e.stopPropagation();
  }, []);

  console.log('[ToggleList] Rendering with isOpen:', isOpen, 'classes:', cn("toggle-list-wrapper", isOpen ? "is-open" : "is-closed"));

  // Log DOM structure after render
  useEffect(() => {
    const wrapper = document.querySelector('.toggle-list-wrapper');
    if (wrapper) {
      const content = wrapper.querySelector('.toggle-content');
      const innerDiv = content?.querySelector('[data-node-view-content-react]');
      const paragraphs = innerDiv?.querySelectorAll('p') || [];
      
      console.log('[ToggleList] DOM structure:', {
        wrapperClasses: wrapper.className,
        hasContent: !!content,
        contentChildren: content ? content.children.length : 0,
        hasInnerDiv: !!innerDiv,
        innerDivChildren: innerDiv ? innerDiv.children.length : 0,
        paragraphCount: paragraphs.length,
        paragraphs: Array.from(paragraphs).map((p, i) => ({
          index: i,
          text: p.textContent?.substring(0, 20),
          isFirst: i === 0,
        })),
        contentHTML: content ? content.innerHTML.substring(0, 200) : null,
      });
    }
  }, [isOpen]);

  return (
    <NodeViewWrapper 
      className={cn("toggle-list-wrapper", isOpen ? "is-open" : "is-closed")}
    >
      <div className="toggle-row">
        {/* Toggle Arrow */}
        <span
          className={cn("toggle-arrow", isOpen && "toggle-arrow-open")}
          onClick={handleToggle}
          onMouseDown={handleMouseDown}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
        
        {/* Editable Content */}
        <NodeViewContent className="toggle-content" />
      </div>
    </NodeViewWrapper>
  );
};

// Toggle List Extension
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggleList: {
      insertToggleList: () => ReturnType;
    };
  }
}

export const ToggleList = Node.create({
  name: 'toggleList',
  
  group: 'block',
  
  content: 'paragraph block*',
  
  defining: true,
  
  draggable: true,
  
  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: element => {
          const value = element.getAttribute('data-open') !== 'false';
          console.log('[ToggleList] parseHTML open:', value);
          return value;
        },
        renderHTML: attributes => {
          console.log('[ToggleList] renderHTML open:', attributes.open);
          return {
            'data-open': attributes.open ? 'true' : 'false',
          };
        },
      },
    };
  },
  
  parseHTML() {
    return [{ tag: 'div[data-type="toggle-list"]' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle-list' }), 0];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ToggleListView, {
      stopEvent: ({ event }) => {
        const target = event.target as HTMLElement | null;
        const isToggleArrow = target && typeof target.closest === 'function' && target.closest('.toggle-arrow');
        console.log('[ToggleList] stopEvent called', {
          eventType: event.type,
          target,
          isToggleArrow,
          willStop: isToggleArrow,
        });
        return isToggleArrow || false;
      },
    });
  },
  
  addCommands() {
    return {
      insertToggleList: () => ({ commands }) => {
        console.log('[ToggleList] insertToggleList command called');
        return commands.insertContent({
          type: this.name,
          attrs: { open: true },
          content: [{ type: 'paragraph', content: [] }],
        });
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-9': () => {
        console.log('[ToggleList] Keyboard shortcut Mod-Shift-9 pressed');
        return this.editor.commands.insertToggleList();
      },
    };
  },
  
  addInputRules() {
    return [
      new InputRule({
        find: /^>\s$/,
        handler: ({ range, chain }) => {
          console.log('[ToggleList] Input rule > matched');
          chain()
            .deleteRange(range)
            .insertContent({
              type: this.name,
              attrs: { open: true },
              content: [{ type: 'paragraph', content: [] }],
            })
            .run();
        },
      }),
      new InputRule({
        find: /^toggle\s$/i,
        handler: ({ range, chain }) => {
          console.log('[ToggleList] Input rule toggle matched');
          chain()
            .deleteRange(range)
            .insertContent({
              type: this.name,
              attrs: { open: true },
              content: [{ type: 'paragraph', content: [] }],
            })
            .run();
        },
      }),
    ];
  },
});

export default ToggleList;
