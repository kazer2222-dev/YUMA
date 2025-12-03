'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
// Using custom TodoBlock extension
import { TodoBlock } from '@/lib/extensions/todo-block';
// Using custom ToggleList extension
import { ToggleList } from '@/lib/extensions/toggle-list';
// Table extensions removed - use Spreadsheet document type instead
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import FontFamily from '@tiptap/extension-font-family';
import { Mark, mergeAttributes } from '@tiptap/core';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  Minus,
  Save,
  Share2,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  ArrowLeft,
  X,
  Sparkles,
  Hash,
  Loader2,
  Type,
  CheckSquare,
  Image,
  Languages,
  AlertCircle,
  Edit,
  RotateCcw,
  Wand2,
  Send,
  ALargeSmall,
  Upload,
  ChevronRight,
  Smile,
  ListTree,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';
import { DocumentShareDialog } from './document-share-dialog';
import { AttachmentParser } from './attachment-parser';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Custom Hashtag Mark extension
const Hashtag = Mark.create({
  name: 'hashtag',
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-type="hashtag"]',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'hashtag' }), 0];
  },
  addInputRules() {
    return [
      {
        find: /#(\w+)/g,
        handler: ({ state, range, match }) => {
          const hashtag = match[0];
          const start = range.from;
          const end = start + hashtag.length;
          
          state.tr.addMark(
            start,
            end,
            this.type.create({ 'data-tag': match[1] })
          );
        },
        undoable: true,
      },
    ];
  },
  addPasteRules() {
    return [
      {
        find: /#(\w+)/g,
        handler: ({ state, range, match }) => {
          const hashtag = match[0];
          const start = range.from;
          const end = start + hashtag.length;
          
          state.tr.addMark(
            start,
            end,
            this.type.create({ 'data-tag': match[1] })
          );
        },
      },
    ];
  },
});

interface DocumentEditorPageProps {
  spaceSlug: string;
  documentId: string | null;
  onClose: () => void;
  onTitleChange?: (title: string) => void;
}

interface Document {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  content?: string;
  type: string;
  status: string;
  tags: string[];
}

export function DocumentEditorPage({
  spaceSlug,
  documentId,
  onClose,
  onTitleChange,
}: DocumentEditorPageProps) {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToastHelpers();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(!!documentId);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showAttachmentParser, setShowAttachmentParser] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; avatar?: string }>>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const usersRef = useRef(users);
  
  // Keep usersRef in sync with users state
  useEffect(() => {
    usersRef.current = users;
  }, [users]);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [slashSearchQuery, setSlashSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // AI Selection Menu States (similar to task editor)
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [selectionMenuPosition, setSelectionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [languageMenuPosition, setLanguageMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const promptInputRef = useRef<HTMLInputElement>(null);
  const generateInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  
  // AI Revert functionality
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [canRevert, setCanRevert] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [revertPosition, setRevertPosition] = useState<{ top: number; left: number } | null>(null);
  
  // AI Input Panel (inline UI instead of popup)
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPanelMode, setAiPanelMode] = useState<'generate' | 'update' | null>(null);
  const [aiPanelPrompt, setAiPanelPrompt] = useState('');
  const aiPanelInputRef = useRef<HTMLInputElement>(null);
  

  const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'az', name: 'Azerbaijani' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'tr', name: 'Turkish' },
  ];

  const [isMounted, setIsMounted] = useState(false);

  // Initialize TipTap editor (only on client)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        strike: false,
        link: false,
        underline: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing... Use / for commands',
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
        showOnlyWhenEditable: true,
        showOnlyCurrent: true, // Only show placeholder on the current/focused empty node
        includeChildren: false, // Don't show placeholder in nested elements
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Strike,
      HorizontalRule,
      TodoBlock,
      ToggleList,
      // Table extensions removed - use Spreadsheet document type instead
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:no-underline',
        },
      }),
      Hashtag.configure({
        HTMLAttributes: {
          class: 'hashtag',
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          items: ({ query }: { query: string }) => {
            const currentUsers = usersRef.current;
            if (!query) return currentUsers.slice(0, 5).map(user => ({
              id: user.id,
              label: user.name || user.email,
            }));
            
            return currentUsers
              .filter(user => 
                user.name.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 5)
              .map(user => ({
                id: user.id,
                label: user.name || user.email,
              }));
          },
        },
      }),
    ],
    content: '',
    immediatelyRender: false, // Fix SSR hydration issue
    onUpdate: ({ editor }) => {
      setHasChanges(true);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none min-h-[600px] w-full',
          '!max-w-full',
          // Theme-aware text colors - ensure bright text
          'prose-headings:text-foreground prose-headings:font-bold prose-headings:opacity-100',
          'prose-p:text-foreground prose-p:my-4 prose-p:opacity-100 [&_p.is-editor-empty:first-child]:text-transparent',
          'prose-strong:text-foreground prose-strong:font-bold prose-strong:opacity-100',
          'prose-em:text-foreground prose-em:opacity-100',
          'prose-ul:text-foreground prose-ol:text-foreground prose-ul:opacity-100 prose-ol:opacity-100',
          'prose-li:text-foreground prose-li:opacity-100',
          'prose-blockquote:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:opacity-100',
          'prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:opacity-100',
          'prose-pre:text-foreground prose-pre:bg-muted prose-pre:opacity-100',
          'prose-a:text-primary prose-a:underline hover:prose-a:no-underline prose-a:opacity-100',
          'prose-hr:border-border',
          'prose-table:text-foreground prose-table:opacity-100',
          'prose-th:text-foreground prose-th:border-border prose-th:opacity-100',
          'prose-td:text-foreground prose-td:border-border prose-td:opacity-100',
          'prose:opacity-100'
        ),
        style: 'opacity: 1;',
      },
    },
  });

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch users for mentions
  useEffect(() => {
    if (!isMounted || !spaceSlug) return;
    
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/spaces/${spaceSlug}/members`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success && data.members) {
          setUsers(data.members.map((m: any) => ({
            id: m.user.id,
            name: m.user.name || m.user.email,
            email: m.user.email,
            avatar: m.user.avatar,
          })));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();
  }, [spaceSlug, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    
    if (documentId) {
      fetchDocument();
    } else {
      setLoading(false);
    }
  }, [documentId, spaceSlug, isMounted]);

  // Update editor content when document is loaded
  useEffect(() => {
    if (editor && document && document.content && isMounted) {
      // Only set content if editor is empty or content is different
      const currentContent = editor.getHTML();
      if (currentContent !== document.content) {
        // Use requestAnimationFrame to avoid flushSync warning
        requestAnimationFrame(() => {
          editor.commands.setContent(document.content || '');
        });
      }
    }
  }, [editor, document, isMounted]);

  // Base slash command options
  const baseSlashCommands = [
    // AI Group
    { id: 'generate-requirement', label: 'Generate Requirement', description: 'AI-powered generation', icon: <Sparkles className="h-4 w-4" />, group: 'AI' },
    // Text Formatting Group
    { id: 'bold', label: 'Bold', description: 'Bold text', icon: <Bold className="h-4 w-4" />, group: 'Text Formatting' },
    { id: 'italic', label: 'Italic', description: 'Italic text', icon: <Italic className="h-4 w-4" />, group: 'Text Formatting' },
    { id: 'underline', label: 'Underline', description: 'Underline text', icon: <UnderlineIcon className="h-4 w-4" />, group: 'Text Formatting' },
    { id: 'strikethrough', label: 'Strikethrough', description: 'Strikethrough text', icon: <Strikethrough className="h-4 w-4" />, group: 'Text Formatting' },
    { id: 'highlight', label: 'Highlight', description: 'Highlight text', icon: <Highlighter className="h-4 w-4" />, group: 'Text Formatting' },
    { id: 'align-left', label: 'Align Left', description: 'Left align', icon: <AlignLeft className="h-4 w-4" />, group: 'Text Formatting' },
    { id: 'align-center', label: 'Align Center', description: 'Center align', icon: <AlignCenter className="h-4 w-4" />, group: 'Text Formatting' },
    { id: 'align-right', label: 'Align Right', description: 'Right align', icon: <AlignRight className="h-4 w-4" />, group: 'Text Formatting' },
    // Font Group
    { id: 'font-inter', label: 'Inter', description: 'Default font', icon: <ALargeSmall className="h-4 w-4" />, group: 'Fonts' },
    { id: 'font-serif', label: 'Serif', description: 'Georgia font', icon: <ALargeSmall className="h-4 w-4" />, group: 'Fonts' },
    { id: 'font-mono', label: 'Monospace', description: 'Code font', icon: <ALargeSmall className="h-4 w-4" />, group: 'Fonts' },
    { id: 'font-comic', label: 'Comic Sans', description: 'Casual font', icon: <ALargeSmall className="h-4 w-4" />, group: 'Fonts' },
    { id: 'font-arial', label: 'Arial', description: 'Classic font', icon: <ALargeSmall className="h-4 w-4" />, group: 'Fonts' },
    { id: 'font-times', label: 'Times New Roman', description: 'Traditional font', icon: <ALargeSmall className="h-4 w-4" />, group: 'Fonts' },
    // Text Group
    { id: 'paragraph', label: 'Text', description: 'Plain text', icon: <Type className="h-4 w-4" />, group: 'Basic Blocks' },
    { id: 'heading1', label: 'Heading 1', description: 'Big heading', icon: <Heading1 className="h-4 w-4" />, group: 'Basic Blocks' },
    { id: 'heading2', label: 'Heading 2', description: 'Medium heading', icon: <Heading2 className="h-4 w-4" />, group: 'Basic Blocks' },
    { id: 'heading3', label: 'Heading 3', description: 'Small heading', icon: <Heading3 className="h-4 w-4" />, group: 'Basic Blocks' },
    // List Group
    { id: 'bullet-list', label: 'Bulleted List', description: 'Simple list', icon: <List className="h-4 w-4" />, group: 'Lists' },
    { id: 'numbered-list', label: 'Numbered List', description: 'Numbered list', icon: <ListOrdered className="h-4 w-4" />, group: 'Lists' },
    { id: 'task-list', label: 'To-do List', description: 'Checkbox list', icon: <CheckSquare className="h-4 w-4" />, group: 'Lists' },
    { id: 'toggle-list', label: 'Toggle List', description: 'Collapsible heading with content', icon: <ChevronRight className="h-4 w-4" />, group: 'Basic Blocks' },
    // Advanced Group
    { id: 'quote', label: 'Quote', description: 'Blockquote', icon: <Quote className="h-4 w-4" />, group: 'Advanced' },
    { id: 'code-block', label: 'Code', description: 'Code snippet', icon: <Code className="h-4 w-4" />, group: 'Advanced' },
    { id: 'divider', label: 'Divider', description: 'Horizontal line', icon: <Minus className="h-4 w-4" />, group: 'Advanced' },
    { id: 'link', label: 'Link', description: 'Insert link', icon: <Link2 className="h-4 w-4" />, group: 'Advanced' },
    { id: 'emoji', label: 'Emoji', description: 'Insert emoji', icon: <Smile className="h-4 w-4" />, group: 'Advanced' },
    { id: 'table-of-contents', label: 'Table of Contents', description: 'Navigate headings', icon: <ListTree className="h-4 w-4" />, group: 'Advanced' },
    { id: 'parse-attachment', label: 'Parse File', description: 'Extract text from file', icon: <Upload className="h-4 w-4" />, group: 'Advanced' },
  ];

  // Selection-based AI commands (shown when text is selected)
  const selectionAICommands = [
    { id: 'ai-improve', label: 'Improve Text', description: 'Enhance clarity', icon: <Sparkles className="h-4 w-4" />, group: 'Selection AI' },
    { id: 'ai-grammar', label: 'Check Grammar', description: 'Fix errors', icon: <AlertCircle className="h-4 w-4" />, group: 'Selection AI' },
    { id: 'ai-translate', label: 'Translate', description: 'Choose language', icon: <Languages className="h-4 w-4" />, group: 'Selection AI' },
    { id: 'ai-update', label: 'Update Text', description: 'Custom prompt', icon: <Edit className="h-4 w-4" />, group: 'Selection AI' },
  ];

  // Combined commands - include selection AI commands when there's a selection
  const allSlashCommands = selectionRange 
    ? [...selectionAICommands, ...baseSlashCommands]
    : baseSlashCommands;

  // Filter commands based on search query
  const slashCommands = slashSearchQuery.trim()
    ? allSlashCommands.filter(cmd => 
        cmd.label.toLowerCase().includes(slashSearchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(slashSearchQuery.toLowerCase()) ||
        cmd.group.toLowerCase().includes(slashSearchQuery.toLowerCase())
      )
    : allSlashCommands;

  // Store slash position for deletion
  const slashPositionRef = useRef<number | null>(null);

  // Handle slash command menu
  useEffect(() => {
    if (!editor || !isMounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle "/" key - show menu anywhere in the text
      if (e.key === '/' && !slashMenuOpen && !showSelectionMenu) {
        // Ensure editor is focused
        if (!editor.isFocused) {
          editor.commands.focus();
        }
        
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;
        
        // Store selection range if there's a selection
        if (hasSelection) {
          const selectedText = editor.state.doc.textBetween(from, to);
          if (selectedText && selectedText.trim().length > 0) {
            setSelectionRange({ from, to });
          }
        } else {
          setSelectionRange(null);
        }
        
        if (!hasSelection) {
          // Don't prevent default - let "/" be typed
          slashPositionRef.current = from;
        } else {
          e.preventDefault();
        }
        
        // Wait for "/" to be inserted (or immediately if selection), then show menu
        setTimeout(() => {
          if (!editor) return;
          try {
            const pos = hasSelection ? from : editor.state.selection.from;
            const coords = editor.view.coordsAtPos(Math.min(pos, editor.state.doc.content.size));
            setSlashMenuPosition({
              top: coords.top + window.scrollY + 20,
              left: coords.left + window.scrollX,
            });
            setSlashMenuOpen(true);
            setSelectedSlashIndex(0);
            setSlashSearchQuery(''); // Reset search when opening menu
          } catch (error) {
            console.error('Error opening slash menu:', error);
          }
        }, hasSelection ? 0 : 50); // Increased timeout for better reliability
      } else if (slashMenuOpen) {
        // Close menu on space key - keep the "/" in the text
        if (e.key === ' ') {
          // Don't prevent default - let space be typed
          closeSlashMenu(false); // Don't delete the "/"
          return;
        }
        
        // Handle typing for search - capture alphanumeric keys
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setSlashSearchQuery(prev => prev + e.key);
          setSelectedSlashIndex(0); // Reset selection when searching
          return;
        }
        
        // Handle backspace for search
        if (e.key === 'Backspace') {
          e.preventDefault();
          setSlashSearchQuery(prev => {
            if (prev.length > 0) {
              return prev.slice(0, -1);
            }
            // If search is empty, close menu
            closeSlashMenu(false);
            return '';
          });
          setSelectedSlashIndex(0);
          return;
        }
        
        // Keyboard navigation in menu - use filtered command count
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSlashIndex((prev) => (prev + 1) % Math.max(1, slashCommands.length));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSlashIndex((prev) => (prev - 1 + slashCommands.length) % Math.max(1, slashCommands.length));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          if (slashCommands.length > 0) {
            handleSlashCommand(selectedSlashIndex);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeSlashMenu();
        }
      } else if (showSelectionMenu) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowSelectionMenu(false);
          setSelectionMenuPosition(null);
        }
      }
    };

    const editorElement = editor?.view?.dom;
    if (!editorElement) return;
    
    editorElement.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editor, isMounted, slashMenuOpen, selectedSlashIndex, showSelectionMenu, slashSearchQuery, slashCommands.length]);

  const closeSlashMenu = (deleteSlash: boolean = true) => {
    setSlashMenuOpen(false);
    setSlashMenuPosition(null);
    setSlashSearchQuery(''); // Reset search query
    // Delete the "/" that was typed (only if deleteSlash is true and no selection was made)
    if (deleteSlash && editor && slashPositionRef.current !== null && !selectionRange) {
      const { from } = editor.state.selection;
      // Look back to find the "/"
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 5), from);
      const slashIdx = textBefore.lastIndexOf('/');
      if (slashIdx >= 0) {
        const deleteFrom = from - (textBefore.length - slashIdx);
        editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
      }
    }
    slashPositionRef.current = null;
    setSelectionRange(null);
  };

  const handleSlashCommand = async (index: number) => {
    if (!editor) return;
    if (index >= slashCommands.length) return; // Guard against invalid index

    const command = slashCommands[index];
    if (!command) return;
    
    const { from } = editor.state.selection;
    const currentSelectionRange = selectionRange; // Store before clearing
    
    // Find and delete the "/" character and any search text (only if no selection - "/" wasn't typed when selecting)
    if (!currentSelectionRange) {
      // Calculate how many characters to delete (/ + search query length)
      const deleteLength = 1 + slashSearchQuery.length;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - deleteLength - 5), from);
      const slashIdx = textBefore.lastIndexOf('/');
      
      // Delete the "/" and search text if found
      if (slashIdx >= 0) {
        const deleteFrom = from - (textBefore.length - slashIdx);
        editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
      }
    }
    
    // Close menu first
    setSlashMenuOpen(false);
    setSlashMenuPosition(null);
    setSlashSearchQuery('');
    slashPositionRef.current = null;
    
    // Handle selection-based AI commands
    if (command.id.startsWith('ai-') && currentSelectionRange) {
      switch (command.id) {
        case 'ai-improve':
          await handleSelectionAction('improve');
          return;
        case 'ai-grammar':
          await handleSelectionAction('check-errors');
          return;
        case 'ai-translate':
          // Show language menu
          if (slashMenuPosition) {
            setLanguageMenuPosition({
              top: slashMenuPosition.top,
              left: slashMenuPosition.left + 280,
            });
          }
          setShowLanguageMenu(true);
          return;
        case 'ai-update':
          setShowPromptDialog(true);
          setTimeout(() => promptInputRef.current?.focus(), 100);
          return;
      }
    }
    
    // Clear selection range for non-AI commands
    setSelectionRange(null);
    
    // Handle different commands
    switch (command.id) {
      case 'generate-requirement':
        // Show AI panel to enter prompt
        setAiPanelMode('generate');
        setShowAIPanel(true);
        setTimeout(() => aiPanelInputRef.current?.focus(), 100);
        break;
        
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
        
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
        
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
        
      case 'strikethrough':
        editor.chain().focus().toggleStrike().run();
        break;
        
      case 'highlight':
        editor.chain().focus().toggleHighlight().run();
        break;
        
      case 'align-left':
        editor.chain().focus().setTextAlign('left').run();
        break;
        
      case 'align-center':
        editor.chain().focus().setTextAlign('center').run();
        break;
        
      case 'align-right':
        editor.chain().focus().setTextAlign('right').run();
        break;
        
      case 'font-inter':
        editor.chain().focus().setFontFamily('Inter, system-ui, sans-serif').run();
        break;
        
      case 'font-serif':
        editor.chain().focus().setFontFamily('Georgia, serif').run();
        break;
        
      case 'font-mono':
        editor.chain().focus().setFontFamily('SF Mono, Monaco, Consolas, monospace').run();
        break;
        
      case 'font-comic':
        editor.chain().focus().setFontFamily('Comic Sans MS, cursive').run();
        break;
        
      case 'font-arial':
        editor.chain().focus().setFontFamily('Arial, Helvetica, sans-serif').run();
        break;
        
      case 'font-times':
        editor.chain().focus().setFontFamily('Times New Roman, Times, serif').run();
        break;
        
      case 'paragraph':
        editor.chain().focus().setParagraph().run();
        break;
        
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
        
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
        
      case 'heading3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
        
      case 'bullet-list':
        editor.chain().focus().toggleBulletList().run();
        break;
        
      case 'numbered-list':
        editor.chain().focus().toggleOrderedList().run();
        break;
        
      case 'task-list':
        // Check if there's selected text to convert
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, '\n');
        
        if (selectedText.trim()) {
          // Convert selected text lines to todo items
          const lines = selectedText.split('\n').filter(line => line.trim());
          const todoItems = lines.map((line, idx) => ({
            id: `t_${Date.now()}_${idx}`,
            content: line.trim(),
            checked: false,
            indent: 0,
            priority: 'none',
          }));
          
          editor.chain()
            .focus()
            .deleteSelection()
            .insertContent({
              type: 'todoBlock',
              attrs: { items: JSON.stringify(todoItems) },
            })
            .run();
        } else {
          editor.chain().focus().insertContent({
            type: 'todoBlock',
            attrs: { items: '[]' },
          }).run();
        }
        break;
        
      case 'toggle-list':
        editor.chain().focus().insertToggleList().run();
        break;
        
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        break;
        
      case 'code-block':
        editor.chain().focus().toggleCodeBlock().run();
        break;
        
      case 'divider':
        editor.chain().focus().setHorizontalRule().run();
        break;
        
      case 'parse-attachment':
        setShowAttachmentParser(true);
        break;
        
      case 'link':
        setLinkDialogOpen(true);
        break;
        
      case 'emoji':
        setShowEmojiPicker(true);
        break;
        
      case 'table-of-contents':
        // Generate table of contents from headings
        generateTableOfContents();
        break;
    }
  };

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Common emojis for quick selection
  const commonEmojis = ['😀', '😊', '👍', '❤️', '🎉', '✅', '⭐', '🔥', '💡', '📌', '📝', '✨', '🚀', '💪', '👏', '🙏', '😂', '🤔', '👀', '💯'];
  
  const insertEmoji = (emoji: string) => {
    if (editor) {
      editor.chain().focus().insertContent(emoji).run();
    }
    setShowEmojiPicker(false);
  };

  // Table of contents state
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [tocHeadings, setTocHeadings] = useState<{ level: number; text: string; pos: number }[]>([]);

  // Generate table of contents from headings
  const generateTableOfContents = () => {
    if (!editor) return;
    
    const headings: { level: number; text: string; pos: number }[] = [];
    
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        headings.push({
          level: node.attrs.level,
          text: node.textContent,
          pos: pos,
        });
      }
    });
    
    setTocHeadings(headings);
    setShowTableOfContents(true);
  };

  // Scroll to heading position
  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    
    editor.chain().focus().setTextSelection(pos).run();
    
    // Scroll the heading into view
    setTimeout(() => {
      const element = editor.view.domAtPos(pos);
      if (element && element.node) {
        const domNode = element.node as HTMLElement;
        domNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    
    setShowTableOfContents(false);
  };

  // Handle Generate Requirement with prompt
  const handleGenerateRequirement = async () => {
    const prompt = aiPanelMode === 'generate' ? aiPanelPrompt : generatePrompt;
    if (!editor || !prompt.trim()) return;
    
    // Store original content for revert
    const currentHTML = editor.getHTML();
    const currentText = editor.getText().trim();
    setOriginalContent(currentHTML);
    setIsGenerating(true);
    setShowGenerateDialog(false);
    setShowAIPanel(false);
    
    // Get cursor position for undo button (if view is available)
    let coords = { top: 100, left: 100 }; // Default fallback
    if (editor.view) {
      try {
        const cursorPos = editor.state.selection.from;
        coords = editor.view.coordsAtPos(cursorPos);
      } catch {
        // Use default coords if coordsAtPos fails
      }
    }
    
    try {
      const response = await fetch('/api/ai/generate-requirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: title || 'Document',
          userPrompt: prompt.trim(),
          existingContent: currentText, // Send existing content
          mode: currentText.length > 50 ? 'append' : 'generate', // Append or generate fresh
        }),
      });

      const data = await response.json();

      if (data.success && data.requirement) {
        // Check if editor view is available before focusing
        if (editor.view) {
          editor.chain().focus().insertContent(data.requirement).run();
        } else {
          // Fallback: insert content without focus
          editor.commands.insertContent(data.requirement);
        }
        setGeneratedContent(data.requirement);
        setCanRevert(true);
        
        // Position undo button near where content was inserted
        setRevertPosition({
          top: coords.top + window.scrollY,
          left: coords.left + window.scrollX,
        });
      } else {
        showError('Failed to generate', data.message || 'An error occurred.');
        setOriginalContent(null);
      }
    } catch (error) {
      console.error('Generation error:', error);
      showError('Error', 'Failed to generate requirement.');
      setOriginalContent(null);
    } finally {
      setIsGenerating(false);
      setGeneratePrompt('');
      setAiPanelPrompt('');
      setAiPanelMode(null);
    }
  };
  
  // Handle AI Panel Submit
  const handleAIPanelSubmit = async () => {
    if (!aiPanelPrompt.trim() || !editor) return;
    
    if (aiPanelMode === 'generate') {
      await handleGenerateRequirement();
    } else if (aiPanelMode === 'update' && selectionRange) {
      await handleSelectionAction('update', undefined, aiPanelPrompt.trim());
      setShowAIPanel(false);
      setAiPanelPrompt('');
      setAiPanelMode(null);
    }
  };
  
  // Revert to original content
  const handleRevert = () => {
    if (!editor || !originalContent) return;
    
    editor.chain().focus().setContent(originalContent).run();
    setOriginalContent(null);
    setCanRevert(false);
    setGeneratedContent(null);
    setRevertPosition(null);
    showSuccess('Reverted', 'Content restored to previous version.');
  };

  // Handle AI Selection Actions (like task editor)
  const handleSelectionAction = async (action: 'improve' | 'check-errors' | 'translate' | 'update', targetLanguage?: string, customPromptText?: string) => {
    if (!selectionRange || isGenerating || !editor) return;

    const { from, to } = selectionRange;
    
    // Validate range
    const docSize = editor.state.doc.content.size;
    if (from < 0 || to < 0 || from > docSize || to > docSize || from > to) {
      setShowSelectionMenu(false);
      setShowLanguageMenu(false);
      setSelectionRange(null);
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to).trim();
    
    if (!selectedText) {
      setShowSelectionMenu(false);
      setShowLanguageMenu(false);
      setSelectionRange(null);
      return;
    }

    // If update is selected without prompt, show AI panel
    if (action === 'update' && !customPromptText) {
      setShowSelectionMenu(false);
      setAiPanelMode('update');
      setShowAIPanel(true);
      setTimeout(() => aiPanelInputRef.current?.focus(), 100);
      return;
    }

    // If translate is selected without language, show language menu
    if (action === 'translate' && !targetLanguage) {
      if (selectionMenuPosition) {
        setLanguageMenuPosition({
          top: selectionMenuPosition.top,
          left: selectionMenuPosition.left + 240,
        });
      }
      setShowLanguageMenu(true);
      return;
    }

    // Store original content for revert and get position
    setOriginalContent(editor.getHTML());
    const coords = editor.view.coordsAtPos(from);
    setIsGenerating(true);
    setShowSelectionMenu(false);
    setShowLanguageMenu(false);

    try {
      const response = await fetch('/api/ai/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          action,
          targetLanguage,
          customPrompt: customPromptText,
        }),
      });

      const data = await response.json();

      if (data.success && data.result) {
        // Replace selected text with result
        editor.chain()
          .focus()
          .setTextSelection({ from, to })
          .deleteSelection()
          .insertContent(data.result)
          .run();
        
        // Track generated content and position for undo
        setGeneratedContent(data.result);
        setRevertPosition({
          top: coords.top + window.scrollY,
          left: coords.left + window.scrollX,
        });
        setCanRevert(true);
      } else {
        showError('Failed to process', data.message || 'An error occurred.');
        setOriginalContent(null);
      }
    } catch (error) {
      console.error('AI processing error:', error);
      showError('Error', 'Failed to process text.');
      setOriginalContent(null);
    } finally {
      setIsGenerating(false);
      setSelectionRange(null);
      setCustomPrompt('');
      setShowPromptDialog(false);
      setShowAIPanel(false);
      setAiPanelPrompt('');
      setAiPanelMode(null);
    }
  };

  // Handle Update with custom prompt
  const handleUpdateWithPrompt = async () => {
    if (!customPrompt.trim() || !selectionRange || !editor) return;
    await handleSelectionAction('update', undefined, customPrompt.trim());
  };

  // Close menus on outside click
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    if (!showSelectionMenu && !showLanguageMenu && !slashMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking inside menus or dialogs
      if (menuRef.current?.contains(target)) return;
      if (languageMenuRef.current?.contains(target)) return;
      if (target.closest('[role="dialog"]')) return;
      if (target.closest('.fixed.z-\\[100\\]')) return; // Slash menu
      
      // Close all menus
      if (slashMenuOpen) {
        closeSlashMenu();
      }
      if (showSelectionMenu) {
        setShowSelectionMenu(false);
        setSelectionMenuPosition(null);
      }
      if (showLanguageMenu) {
        setShowLanguageMenu(false);
        setLanguageMenuPosition(null);
      }
    };

    // Use a small delay to avoid closing when clicking menu items
    const timeoutId = setTimeout(() => {
      window.document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      window.document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSelectionMenu, showLanguageMenu, slashMenuOpen]);

  // Update parent title when document title changes
  useEffect(() => {
    if (onTitleChange && title) {
      onTitleChange(title);
    }
  }, [title, onTitleChange]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/spaces/${spaceSlug}/documents/${documentId}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        const doc = data.document;
        setDocument(doc);
        setTitle(doc.title || '');
        // Editor content will be set by the useEffect hook
      } else {
        showError('Error', data.message || 'Failed to load document');
        onClose();
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      showError('Error', 'Failed to load document');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!hasChanges || isSaving) return;
    await saveDocument(true);
  };

  const saveDocument = async (isAutoSave = false) => {
    if (!editor) return;

    try {
      setIsSaving(true);
      const content = editor.getHTML();

      const url = documentId
        ? `/api/spaces/${spaceSlug}/documents/${documentId}`
        : `/api/spaces/${spaceSlug}/documents`;

      const method = documentId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title || 'Untitled Document',
          content,
          type: 'RICH_TEXT',
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (!documentId && data.document) {
          // New document created, navigate to edit page
          router.replace(`/spaces/${spaceSlug}/documents/${data.document.id}`);
          setDocument(data.document);
        }
        setHasChanges(false);
        if (!isAutoSave) {
          showSuccess('Success', 'Document saved');
          // Navigate to documents list after saving
          router.push(`/spaces/${spaceSlug}?view=documents`);
        }
      } else {
        showError('Error', data.message || 'Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      showError('Error', 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    if (!editor) return;

    const content = editor.getText();
    const pdf = new jsPDF();
    const lines = pdf.splitTextToSize(content, 180);
    pdf.text(lines, 10, 10);
    pdf.save(`${title || 'document'}.pdf`);
    showSuccess('Success', 'Document exported as PDF');
  };

  const handleExportWord = () => {
    if (!editor) return;

    const content = editor.getHTML();
    const blob = new Blob(
      [
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title || 'Document'}</title>
</head>
<body>
  ${content}
</body>
</html>`,
      ],
      { type: 'application/msword' }
    );
    const url = URL.createObjectURL(blob);
    if (typeof window !== 'undefined' && window.document) {
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${title || 'document'}.doc`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    showSuccess('Success', 'Document exported as Word');
  };

  const handleExportExcel = () => {
    if (!editor) return;

    const content = editor.getText();
    const lines = content.split('\n').filter((line) => line.trim());
    const data = lines.map((line) => [line]);
    const ws = XLSX.utils.aoa_to_sheet([['Content'], ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Document');
    XLSX.writeFile(wb, `${title || 'document'}.xlsx`);
    showSuccess('Success', 'Document exported as Excel');
  };

  const handleInsertLink = () => {
    if (!editor || !linkUrl.trim()) return;
    
    editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
    setLinkDialogOpen(false);
    setLinkUrl('');
  };

  // Handle parsed attachment content
  const handleParsedContent = (content: string, fileName: string) => {
    if (!editor) return;
    
    // Insert the parsed content with a header
    const formattedContent = `<h3>📎 Content from: ${fileName}</h3><p>${content.replace(/\n/g, '</p><p>')}</p>`;
    editor.chain().focus().insertContent(formattedContent).run();
    setShowAttachmentParser(false);
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">
            {!isMounted ? 'Initializing editor...' : 'Loading document...'}
          </p>
        </div>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 bg-background flex flex-col document-editor-full-width">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
        <div className="w-full px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setHasChanges(true);
                }}
                className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent outline-none w-full text-foreground placeholder:text-gray-400"
                placeholder="Document title"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareDialogOpen(true)}
                disabled={!documentId}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportWord}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as Word
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="default"
                size="sm"
                onClick={() => saveDocument(false)}
                disabled={isSaving || !hasChanges}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Hint for slash commands */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              Type <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">/ </kbd> for formatting options and AI commands
            </span>

            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowAttachmentParser(true)}
                title="Parse Attachment"
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Input Panel - Inline UI */}
      {showAIPanel && (
        <div className="border-t bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 p-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50">
                <Wand2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {aiPanelMode === 'generate' ? 'Generate with AI' : 'Update with AI'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto"
                onClick={() => {
                  setShowAIPanel(false);
                  setAiPanelPrompt('');
                  setAiPanelMode(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={aiPanelInputRef}
                  value={aiPanelPrompt}
                  onChange={(e) => setAiPanelPrompt(e.target.value)}
                  placeholder={aiPanelMode === 'generate' 
                    ? "Describe what you want to generate... (e.g., 'User authentication requirements')"
                    : "How should the text be updated? (e.g., 'Make it more professional')"
                  }
                  className="pr-10 bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:border-purple-400 focus:ring-purple-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAIPanelSubmit();
                    }
                    if (e.key === 'Escape') {
                      setShowAIPanel(false);
                      setAiPanelPrompt('');
                      setAiPanelMode(null);
                    }
                  }}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↵</kbd>
                </div>
              </div>
              <Button 
                onClick={handleAIPanelSubmit}
                disabled={!aiPanelPrompt.trim() || isGenerating}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revert Panel - Shows after AI processing with preview */}
      {canRevert && !isGenerating && (
        <div 
          className="fixed z-50 animate-in fade-in slide-in-from-left-2 duration-300"
          style={{
            top: revertPosition ? `${Math.max(80, revertPosition.top - 60)}px` : '50%',
            right: '24px',
            maxWidth: '320px',
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-orange-200 dark:border-orange-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-b border-orange-100 dark:border-orange-900">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900">
                  <Sparkles className="h-3 w-3 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-orange-800 dark:text-orange-300">AI Generated</span>
              </div>
              <Button
                onClick={() => {
                  setCanRevert(false);
                  setOriginalContent(null);
                  setGeneratedContent(null);
                  setRevertPosition(null);
                }}
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-orange-100 dark:hover:bg-orange-900"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
            
            {/* Preview of generated content */}
            {generatedContent && (
              <div className="px-3 py-2 max-h-32 overflow-y-auto border-b border-orange-100 dark:border-orange-900">
                <p className="text-xs text-muted-foreground mb-1">Added content:</p>
                <div className="text-sm text-foreground/80 line-clamp-4 bg-orange-50/50 dark:bg-orange-950/20 rounded p-2">
                  {generatedContent.replace(/<[^>]*>/g, ' ').slice(0, 200)}
                  {generatedContent.length > 200 && '...'}
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 p-2">
              <Button
                onClick={handleRevert}
                variant="outline"
                size="sm"
                className="flex-1 border-orange-300 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
              >
                <RotateCcw className="h-4 w-4 mr-2 text-orange-600" />
                <span className="text-orange-700 dark:text-orange-400">Undo</span>
              </Button>
              <Button
                onClick={() => {
                  setCanRevert(false);
                  setOriginalContent(null);
                  setGeneratedContent(null);
                  setRevertPosition(null);
                }}
                variant="default"
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Keep Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-auto bg-background w-full min-h-0 relative">
        <div className="w-full py-8 px-4 sm:px-6 lg:px-8 xl:px-12">
          <EditorContent editor={editor} />
        </div>
        
        {/* AI Loading Indicator - Enhanced Animation */}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/90 dark:bg-gray-900/90 shadow-2xl border border-purple-200 dark:border-purple-800">
              {/* Animated AI Icon */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 blur-xl opacity-50 animate-pulse"></div>
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 animate-spin-slow">
                  <Sparkles className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
              
              {/* Animated Text */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  AI is working its magic
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">Processing</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
              
              {/* Progress shimmer */}
              <div className="w-48 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 animate-shimmer"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slash Command Menu - Grouped like Notion */}
      {slashMenuOpen && slashMenuPosition && (
        <div
          className="fixed z-[100] w-72 rounded-lg border bg-popover shadow-lg max-h-[400px] overflow-y-auto"
          style={{
            top: `${slashMenuPosition.top}px`,
            left: `${slashMenuPosition.left}px`,
          }}
        >
          {/* Search indicator */}
          {slashSearchQuery && (
            <div className="px-3 py-2 border-b bg-muted/50">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Search:</span>
                <span className="font-medium">{slashSearchQuery}</span>
                {slashCommands.length === 0 && (
                  <span className="text-muted-foreground ml-auto">No results</span>
                )}
              </div>
            </div>
          )}

          {/* No results message */}
          {slashCommands.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No commands found for "{slashSearchQuery}"
            </div>
          )}

          {/* Selection AI Group - Only shown when text is selected */}
          {selectionRange && slashCommands.filter(c => c.group === 'Selection AI').length > 0 && (
            <div className="p-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                AI for Selected Text
              </div>
              {slashCommands.filter(c => c.group === 'Selection AI').map((command) => {
                const index = slashCommands.findIndex(c => c.id === command.id);
                return (
                  <Button
                    key={command.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left font-normal h-auto py-2",
                      selectedSlashIndex === index && "bg-purple-100 dark:bg-purple-900/30"
                    )}
                    onMouseEnter={() => setSelectedSlashIndex(index)}
                    onClick={() => handleSlashCommand(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-purple-100 dark:bg-purple-900/30">
                        <span className="text-purple-600 dark:text-purple-400">{command.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{command.label}</span>
                        <span className="text-xs text-muted-foreground">{command.description}</span>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}

          {/* AI Group */}
          <div className={cn("p-1", selectionRange && "border-t")}>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              AI
            </div>
            {slashCommands.filter(c => c.group === 'AI').map((command) => {
              const index = slashCommands.findIndex(c => c.id === command.id);
              return (
                <Button
                  key={command.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left font-normal h-auto py-2",
                    selectedSlashIndex === index && "bg-accent"
                  )}
                  onMouseEnter={() => setSelectedSlashIndex(index)}
                  onClick={() => handleSlashCommand(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                      {command.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{command.label}</span>
                      <span className="text-xs text-muted-foreground">{command.description}</span>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Text Formatting Group */}
          {slashCommands.filter(c => c.group === 'Text Formatting').length > 0 && (
            <div className="p-1 border-t">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Text Formatting
              </div>
              {slashCommands.filter(c => c.group === 'Text Formatting').map((command) => {
                const index = slashCommands.findIndex(c => c.id === command.id);
                return (
                  <Button
                    key={command.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left font-normal h-auto py-2",
                      selectedSlashIndex === index && "bg-accent"
                    )}
                    onMouseEnter={() => setSelectedSlashIndex(index)}
                    onClick={() => handleSlashCommand(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                        {command.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{command.label}</span>
                        <span className="text-xs text-muted-foreground">{command.description}</span>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Basic Blocks Group */}
          <div className="p-1 border-t">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Basic Blocks
            </div>
            {slashCommands.filter(c => c.group === 'Basic Blocks').map((command) => {
              const index = slashCommands.findIndex(c => c.id === command.id);
              return (
                <Button
                  key={command.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left font-normal h-auto py-2",
                    selectedSlashIndex === index && "bg-accent"
                  )}
                  onMouseEnter={() => setSelectedSlashIndex(index)}
                  onClick={() => handleSlashCommand(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                      {command.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{command.label}</span>
                      <span className="text-xs text-muted-foreground">{command.description}</span>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Fonts Group */}
          {slashCommands.filter(c => c.group === 'Fonts').length > 0 && (
            <div className="p-1 border-t">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fonts
              </div>
              {slashCommands.filter(c => c.group === 'Fonts').map((command) => {
                const index = slashCommands.findIndex(c => c.id === command.id);
                return (
                  <Button
                    key={command.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left font-normal h-auto py-2",
                      selectedSlashIndex === index && "bg-accent"
                    )}
                    onMouseEnter={() => setSelectedSlashIndex(index)}
                    onClick={() => handleSlashCommand(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                        {command.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium" style={{ fontFamily: command.id === 'font-inter' ? 'Inter' : command.id === 'font-serif' ? 'Georgia' : command.id === 'font-mono' ? 'monospace' : command.id === 'font-comic' ? 'Comic Sans MS' : command.id === 'font-arial' ? 'Arial' : 'Times New Roman' }}>{command.label}</span>
                        <span className="text-xs text-muted-foreground">{command.description}</span>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Lists Group */}
          <div className="p-1 border-t">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lists
            </div>
            {slashCommands.filter(c => c.group === 'Lists').map((command) => {
              const index = slashCommands.findIndex(c => c.id === command.id);
              return (
                <Button
                  key={command.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left font-normal h-auto py-2",
                    selectedSlashIndex === index && "bg-accent"
                  )}
                  onMouseEnter={() => setSelectedSlashIndex(index)}
                  onClick={() => handleSlashCommand(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                      {command.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{command.label}</span>
                      <span className="text-xs text-muted-foreground">{command.description}</span>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Advanced Group */}
          <div className="p-1 border-t">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Advanced
            </div>
            {slashCommands.filter(c => c.group === 'Advanced').map((command) => {
              const index = slashCommands.findIndex(c => c.id === command.id);
              return (
                <Button
                  key={command.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left font-normal h-auto py-2",
                    selectedSlashIndex === index && "bg-accent"
                  )}
                  onMouseEnter={() => setSelectedSlashIndex(index)}
                  onClick={() => handleSlashCommand(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                      {command.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{command.label}</span>
                      <span className="text-xs text-muted-foreground">{command.description}</span>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Selection Menu (when text is selected and "/" is pressed) */}
      {showSelectionMenu && selectionMenuPosition && (
        <div
          ref={menuRef}
          className="fixed z-[100] w-56 rounded-md border bg-popover p-1 shadow-lg"
          style={{
            top: `${selectionMenuPosition.top}px`,
            left: `${selectionMenuPosition.left}px`,
          }}
        >
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal"
              onClick={() => handleSelectionAction('improve')}
              disabled={isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm">Improve Text</span>
                <span className="text-xs text-muted-foreground">Enhance clarity</span>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal"
              onClick={() => handleSelectionAction('check-errors')}
              disabled={isGenerating}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm">Check Grammar</span>
                <span className="text-xs text-muted-foreground">Fix errors</span>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal"
              onClick={() => handleSelectionAction('translate')}
              disabled={isGenerating}
            >
              <Languages className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm">Translate</span>
                <span className="text-xs text-muted-foreground">Choose language</span>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal"
              onClick={() => handleSelectionAction('update')}
              disabled={isGenerating}
            >
              <Edit className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm">Update Text</span>
                <span className="text-xs text-muted-foreground">Custom prompt</span>
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Language Selection Menu */}
      {showLanguageMenu && languageMenuPosition && (
        <div
          ref={languageMenuRef}
          className="fixed z-[100] w-48 rounded-md border bg-popover p-1 shadow-lg max-h-[300px] overflow-y-auto"
          style={{
            top: `${languageMenuPosition.top}px`,
            left: `${languageMenuPosition.left}px`,
          }}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Select language:
          </div>
          {LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant="ghost"
              className="w-full justify-start text-left font-normal"
              onClick={() => handleSelectionAction('translate', lang.code)}
              disabled={isGenerating}
            >
              <Languages className="h-4 w-4 mr-2" />
              <span className="text-sm">{lang.name}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Update Text Prompt Dialog */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Text with AI</DialogTitle>
            <DialogDescription>
              Enter your instruction for how to update the selected text.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="prompt">Your Instruction</Label>
              <Input
                id="prompt"
                ref={promptInputRef}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Make it more formal, Add details..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleUpdateWithPrompt();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPromptDialog(false);
              setCustomPrompt('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateWithPrompt} disabled={!customPrompt.trim() || isGenerating}>
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Requirement Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Requirement</DialogTitle>
            <DialogDescription>
              Describe what you want to generate and AI will create detailed requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="generate">What do you want to generate?</Label>
              <Input
                id="generate"
                ref={generateInputRef}
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder="e.g., User authentication flow, API endpoints..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateRequirement();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowGenerateDialog(false);
              setGeneratePrompt('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleGenerateRequirement} disabled={!generatePrompt.trim() || isGenerating}>
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      {documentId && (
        <DocumentShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          documentId={documentId}
          spaceSlug={spaceSlug}
        />
      )}

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Enter the URL you want to link to
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInsertLink();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setLinkDialogOpen(false);
              setLinkUrl('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleInsertLink}>
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment Parser */}
      <AttachmentParser
        open={showAttachmentParser}
        onOpenChange={setShowAttachmentParser}
        onParsed={handleParsedContent}
      />

      {/* Emoji Picker Dialog */}
      <Dialog open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5" />
              Insert Emoji
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-10 gap-1 p-2">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                className="text-2xl p-2 hover:bg-muted rounded-md transition-colors"
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="border-t pt-3 mt-2">
            <p className="text-xs text-muted-foreground mb-2">Or type your own:</p>
            <div className="flex gap-2">
              <Input
                placeholder="Paste or type emoji..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget;
                    if (input.value) {
                      insertEmoji(input.value);
                    }
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table of Contents - Notion Style */}
      <Dialog open={showTableOfContents} onOpenChange={setShowTableOfContents}>
        <DialogContent className="sm:max-w-[350px] p-0">
          <div className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-sm font-medium">
              <ListTree className="h-4 w-4 text-muted-foreground" />
              Table of Contents
            </DialogTitle>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {tocHeadings.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <p>No headings found</p>
                <p className="text-xs mt-1">Add headings (H1, H2, H3) to your document</p>
              </div>
            ) : (
              <div className="py-1">
                {tocHeadings.map((heading, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-full text-left px-4 py-2 hover:bg-muted/50 transition-colors text-sm",
                      "flex items-center gap-2"
                    )}
                    style={{ paddingLeft: `${16 + (heading.level - 1) * 16}px` }}
                    onClick={() => scrollToHeading(heading.pos)}
                  >
                    <span className={cn(
                      "flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs",
                      heading.level === 1 && "bg-primary/10 text-primary font-semibold",
                      heading.level === 2 && "bg-muted text-muted-foreground",
                      heading.level === 3 && "bg-muted/50 text-muted-foreground text-[10px]"
                    )}>
                      H{heading.level}
                    </span>
                    <span className={cn(
                      "truncate",
                      heading.level === 1 && "font-medium",
                      heading.level === 2 && "text-muted-foreground",
                      heading.level === 3 && "text-muted-foreground text-xs"
                    )}>
                      {heading.text || 'Untitled'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Styles for active buttons */}
      <style jsx global>{`
        button[data-active="true"] {
          background-color: hsl(var(--accent));
        }
      `}</style>
    </div>
  );
}

