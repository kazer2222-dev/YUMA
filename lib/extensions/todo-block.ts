import { Node, mergeAttributes, textblockTypeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TodoBlockView } from './todo-node-view';
import { InputRule } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    todoBlock: {
      insertTodoBlock: () => ReturnType;
    };
  }
}

export const TodoBlock = Node.create({
  name: 'todoBlock',
  
  group: 'block',
  
  // Not an atom - we manage content ourselves via React
  atom: true,
  
  // No content - all managed via attributes and React
  content: '',
  
  selectable: true,
  
  draggable: true,
  
  // Prevent isolation issues
  isolating: false,
  
  addAttributes() {
    return {
      items: {
        default: '[]',
        parseHTML: element => element.getAttribute('data-items') || '[]',
        renderHTML: attributes => ({
          'data-items': attributes.items,
        }),
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="todo-block"]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    // No content hole for atom nodes
    return ['div', mergeAttributes(HTMLAttributes, { 
      'data-type': 'todo-block', 
      class: 'todo-block-container' 
    })];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(TodoBlockView);
  },
  
  addCommands() {
    return {
      insertTodoBlock: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            items: '[]',
          },
        });
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-t': () => this.editor.commands.insertTodoBlock(),
    };
  },
  
  addInputRules() {
    return [
      // Match "[] " at the start of a line
      new InputRule({
        find: /^\[\]\s$/,
        handler: ({ state, range, chain }) => {
          chain()
            .deleteRange(range)
            .insertContent({
              type: this.name,
              attrs: { items: '[]' },
            })
            .run();
        },
      }),
      // Match "- [ ] " at the start of a line
      new InputRule({
        find: /^-\s\[\s?\]\s$/,
        handler: ({ state, range, chain }) => {
          chain()
            .deleteRange(range)
            .insertContent({
              type: this.name,
              attrs: { items: '[]' },
            })
            .run();
        },
      }),
      // Match "todo " at the start of a line (case insensitive)
      new InputRule({
        find: /^todo\s$/i,
        handler: ({ state, range, chain }) => {
          chain()
            .deleteRange(range)
            .insertContent({
              type: this.name,
              attrs: { items: '[]' },
            })
            .run();
        },
      }),
    ];
  },
});

export default TodoBlock;
