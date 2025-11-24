'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Strike from '@tiptap/extension-strike';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Palette,
  Table2,
  Minus,
  Save,
  Users,
  MessageSquare,
  Sparkles,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';

interface Collaborator {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
  color: string;
}

interface DocumentEditorProps {
  documentId: string;
  initialContent?: string;
  title: string;
  onSave?: (content: string) => Promise<void>;
  onTitleChange?: (title: string) => void;
  collaborators?: Collaborator[];
  spaceSlug: string;
  readOnly?: boolean;
  onClose?: () => void;
}

export function DocumentEditor({
  documentId,
  initialContent = '',
  title: initialTitle,
  onSave,
  onTitleChange,
  collaborators = [],
  spaceSlug,
  readOnly = false,
  onClose,
}: DocumentEditorProps) {
  const { success: showSuccess, error: showError } = useToastHelpers();
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Collaborator[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        strike: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing... Use / for commands',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Strike,
      HorizontalRule,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:no-underline',
        },
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      setHasChanges(true);
      // Auto-save after 2 seconds of inactivity
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(editor.getHTML());
      }, 2000);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-6',
      },
    },
  });

  // Simulate active collaborators (in production, use WebSocket/SSE)
  useEffect(() => {
    if (collaborators.length > 0) {
      setActiveUsers(collaborators.slice(0, 3)); // Show first 3 active users
    }
  }, [collaborators]);

  const handleAutoSave = async (content: string) => {
    if (!onSave || !hasChanges) return;
    
    try {
      setIsSaving(true);
      await onSave(content);
      setHasChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
      showError('Error', 'Failed to auto-save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!editor || !onSave) return;
    
    try {
      setIsSaving(true);
      await onSave(editor.getHTML());
      setHasChanges(false);
      showSuccess('Success', 'Document saved');
    } catch (error) {
      console.error('Save failed:', error);
      showError('Error', 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onTitleChange?.(newTitle);
  };

  if (!editor) {
    return <div className="p-6">Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
              placeholder="Document title"
              disabled={readOnly}
            />
            {isSaving && (
              <Badge variant="outline" className="text-xs">
                Saving...
              </Badge>
            )}
            {hasChanges && !isSaving && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Unsaved changes
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Active Collaborators */}
            {activeUsers.length > 0 && (
              <div className="flex items-center gap-1 -mr-2">
                {activeUsers.map((user, index) => (
                  <Avatar
                    key={user.id}
                    className="w-7 h-7 border-2 border-background"
                    style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                  >
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs" style={{ backgroundColor: user.color }}>
                      {user.name?.[0] || user.email[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {collaborators.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                    +{collaborators.length - 3}
                  </div>
                )}
              </div>
            )}

            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={isSaving || !hasChanges}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            )}
            
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        {!readOnly && (
          <div className="flex items-center gap-1 px-6 py-2 border-t overflow-x-auto">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                data-active={editor.isActive('bold')}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                data-active={editor.isActive('italic')}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                data-active={editor.isActive('underline')}
              >
                <UnderlineIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                data-active={editor.isActive('strike')}
              >
                <Strikethrough className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Heading1 className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  >
                    <Heading1 className="w-4 h-4 mr-2" />
                    Heading 1
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    <Heading2 className="w-4 h-4 mr-2" />
                    Heading 2
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  >
                    <Heading3 className="w-4 h-4 mr-2" />
                    Heading 3
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().setParagraph().run()}
                  >
                    Paragraph
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                data-active={editor.isActive('bulletList')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                data-active={editor.isActive('orderedList')}
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                data-active={editor.isActive('blockquote')}
              >
                <Quote className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                data-active={editor.isActive('codeBlock')}
              >
                <Code className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                data-active={editor.isActive({ textAlign: 'left' })}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                data-active={editor.isActive({ textAlign: 'center' })}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                data-active={editor.isActive({ textAlign: 'right' })}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const url = window.prompt('Enter URL');
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }}
                data-active={editor.isActive('link')}
              >
                <Link2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const rows = parseInt(prompt('Rows') || '3');
                  const cols = parseInt(prompt('Columns') || '3');
                  editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
                }}
              >
                <Table2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Styles for active buttons */}
      <style jsx global>{`
        button[data-active="true"] {
          background-color: hsl(var(--accent));
        }
      `}</style>
    </div>
  );
}

