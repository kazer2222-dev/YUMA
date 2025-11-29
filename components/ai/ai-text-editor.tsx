'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import Mention from '@tiptap/extension-mention';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, Sparkles, X, CheckCircle, Languages, AlertCircle, Edit, Bold, Italic, List, Code, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Link2, Highlighter, Strikethrough, Palette, CheckSquare, Minus, Users, Hash, RotateCcw, Heading1, Heading2, Heading3, Quote, Type, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';

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
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'uk', name: 'Ukrainian' },
];

const COLOR_PALETTE = [
  { name: 'Black', value: '#000000' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Brown', value: '#A16207' },
];

interface AITextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  onMenuStateChange?: (hasOpenMenus: boolean) => void;
}

export function AITextEditor({ value, onChange, placeholder, rows = 3, className, onMenuStateChange }: AITextEditorProps) {
  const [aiMode, setAiMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState<'text' | 'background'>('text');
  const [showCustomTableDialog, setShowCustomTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const { error: showError, warning: showWarning } = useToastHelpers();
  
  // Note: Removed document-level listeners that might interfere with button clicks
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectionMenuPosition, setSelectionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [languageMenuPosition, setLanguageMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);
  const isInternalUpdate = useRef(false);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions we want to add with custom config
        strike: false,
        // Note: color and highlight are disabled by not including them in StarterKit
        // We're adding them explicitly as separate extensions
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Add more details... Type / to activate AI',
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
      // Mention.configure({
      //   HTMLAttributes: {
      //     class: 'mention',
      //   },
      // }),
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
    content: value,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-xs mx-auto focus:outline-none min-h-[80px]',
          // Padding: 12px top/bottom, 16px left/right as per requirements
          'py-3 px-4',
          'prose-headings:font-bold prose-headings:text-foreground',
          'prose-p:my-2 prose-p:text-sm prose-p:text-foreground',
          'prose-strong:font-bold prose-strong:text-foreground',
          'prose-ul:list-disc prose-ul:my-2 prose-ol:list-decimal',
          'prose-li:text-foreground',
          // Code styling handled by global ProseMirror styles
          'prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:text-foreground',
          'prose-a:underline hover:prose-a:no-underline prose-a:text-primary'
        ),
      },
    },
  });

  // Ensure component is mounted and document.body exists before rendering portals
  useEffect(() => {
    if (typeof window !== 'undefined' && document?.body) {
      setMounted(true);
    }
  }, []);

  // Sync external value changes to editor
  useEffect(() => {
    if (editor && !isInternalUpdate.current && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
    isInternalUpdate.current = false;
  }, [value, editor]);

  // Notify parent when menu state changes
  useEffect(() => {
    const hasOpenMenus = showSelectionMenu || showLanguageMenu || showPromptDialog || showColorPicker || showHighlightPicker;
    onMenuStateChange?.(hasOpenMenus);
  }, [showSelectionMenu, showLanguageMenu, showPromptDialog, showColorPicker, showHighlightPicker, onMenuStateChange]);

  // Define handleAIProcess before it's used in useEffect
  const handleAIProcess = useCallback(async () => {
    console.log('handleAIProcess called', { loading, hasEditor: !!editor, aiMode });
    
    if (loading || !editor) {
      console.log('Early return:', { loading, hasEditor: !!editor });
      return;
    }

    // Get current editor content - prefer editor content over value prop
    const currentText = editor.state.doc.textContent.trim();
    console.log('Current editor text:', currentText);
    
    // If empty or just contains "/", show error
    if (!currentText || currentText === '/') {
      console.log('No text to process');
      showError('Input required', 'Please enter text or a prompt for AI to process.');
      return;
    }

    setLoading(true);
    try {
      // Remove "/" if it's at the start (from AI mode activation)
      const textToProcess = currentText.startsWith('/') ? currentText.substring(1).trim() : currentText.trim();
      
      if (!textToProcess) {
        console.log('Text to process is empty after trimming');
        showError('Input required', 'Please enter text or a prompt for AI to process.');
        setLoading(false);
        return;
      }

      console.log('Sending AI request:', { textToProcess, length: textToProcess.length });

      const response = await fetch('/api/ai/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToProcess,
        }),
      });

      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        showError('Failed to process text', errorData.message || `Server error: ${response.status}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      console.log('AI response received:', { success: data.success, hasResult: !!data.result, resultLength: data.result?.length });

      if (data.success && data.result) {
        // Update editor content directly
        console.log('Updating editor with result');
        isInternalUpdate.current = true;
        editor.chain().focus().setContent(data.result).run();
        onChange(data.result);
        setAiMode(false);
      } else {
        console.error('AI processing failed:', data);
        showError('Failed to process text', data.message || 'An error occurred while processing the text.');
      }
    } catch (error) {
      console.error('AI processing error:', error);
      showError('Error', error instanceof Error ? error.message : 'Failed to process text. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [editor, loading, onChange, showError, aiMode]);

  // Handle keydown events for AI features
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle "/" key for AI menu
      if (e.key === '/' && !aiMode && !loading && !showSelectionMenu && !showLanguageMenu && !showPromptDialog) {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;
        
        if (hasSelection) {
          const selectedText = editor.state.doc.textBetween(from, to);
          if (selectedText && selectedText.trim().length > 0) {
            e.preventDefault();
            setSelectionRange({ from, to });
            
            // Get editor position for menu placement
            const editorElement = editor.view.dom.closest('.tiptap-editor-wrapper');
            if (editorElement) {
              const rect = editorElement.getBoundingClientRect();
              const menuWidth = 224;
              const menuTop = rect.top;
              let menuLeft = rect.right + 8;
              
              if (menuLeft + menuWidth > window.innerWidth) {
                menuLeft = rect.left - menuWidth - 8;
                if (menuLeft < 8) menuLeft = 8;
              }
              
              const finalTop = Math.max(8, Math.min(menuTop, window.innerHeight - 250));
              const finalLeft = Math.max(8, Math.min(menuLeft, window.innerWidth - menuWidth - 8));
              
              setSelectionMenuPosition({ top: finalTop, left: finalLeft });
              setShowSelectionMenu(true);
            }
            return;
          }
        }
        
        // If empty or cursor at start, enable AI mode
        const isEmpty = editor.isEmpty;
        const { from: cursorFrom } = editor.state.selection;
        const textBeforeCursor = editor.state.doc.textBetween(0, cursorFrom);
        
        if (isEmpty || (textBeforeCursor === '' && cursorFrom === 0)) {
          e.preventDefault();
          setAiMode(true);
          // Optionally insert "/" as a visual indicator, but we'll remove it on Enter
          // Don't insert "/" - let user type their prompt directly
        }
      }
      
      // Handle Enter in AI mode
      if (e.key === 'Enter' && aiMode && !e.shiftKey && !loading) {
        console.log('Enter pressed in AI mode via DOM listener');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleAIProcess();
        return; // Stop event propagation
      }
      
      // Keyboard shortcuts for table modification when table is selected
      if ((e.ctrlKey || e.metaKey) && !showSelectionMenu && !showLanguageMenu && !showPromptDialog && !loading && !aiMode && !showCustomTableDialog) {
        const isInTable = editor?.isActive('table') || editor?.isActive('tableCell') || editor?.isActive('tableRow');
        
        if (isInTable && ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          
          if (e.shiftKey) {
            // Delete operations with Shift modifier
            switch (e.key) {
              case 'ArrowRight':
              case 'ArrowLeft':
                // Delete current column
                editor.chain().focus().deleteColumn().run();
                break;
              case 'ArrowDown':
              case 'ArrowUp':
                // Delete current row
                editor.chain().focus().deleteRow().run();
                break;
            }
          } else {
            // Add operations without Shift
            switch (e.key) {
              case 'ArrowRight':
                // Add column after current position
                editor.chain().focus().addColumnAfter().run();
                break;
              case 'ArrowLeft':
                // Add column before current position
                editor.chain().focus().addColumnBefore().run();
                break;
              case 'ArrowDown':
                // Add row below
                editor.chain().focus().addRowAfter().run();
                break;
              case 'ArrowUp':
                // Add row above
                editor.chain().focus().addRowBefore().run();
                break;
            }
          }
          return;
        }
      }
      
      // Keyboard shortcuts for menu options
      if (showSelectionMenu && !showLanguageMenu && !showPromptDialog && !loading && !aiMode) {
        if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          e.stopPropagation();
          handleSelectionAction('improve');
        } else if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          e.stopPropagation();
          handleSelectionAction('check-errors');
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          e.stopPropagation();
          handleSelectionAction('translate');
        } else if (e.key === 'u' || e.key === 'U') {
          e.preventDefault();
          e.stopPropagation();
          handleSelectionAction('update');
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          // Close menu on Delete/Backspace to prevent invalid selection errors
          e.preventDefault();
          e.stopPropagation();
          setShowSelectionMenu(false);
          setSelectionRange(null);
          // Restore focus to editor
          editor?.chain().focus().run();
        }
      }
      
      // Escape to exit AI mode or close menus
      if (e.key === 'Escape') {
        if (aiMode) setAiMode(false);
        if (showLanguageMenu) setShowLanguageMenu(false);
        if (showSelectionMenu) setShowSelectionMenu(false);
        if (showPromptDialog) {
          setShowPromptDialog(false);
          setCustomPrompt('');
        }
        if (showCustomTableDialog) {
          setShowCustomTableDialog(false);
        }
        if (showLinkDialog) {
          setShowLinkDialog(false);
          setLinkUrl('');
          setLinkText('');
        }
      }
    };

    // Add DOM event listener with capture phase to catch events before ProseMirror processes them
    editor.view.dom.addEventListener('keydown', handleKeyDown, true); // capture phase
    return () => editor.view.dom.removeEventListener('keydown', handleKeyDown, true);
  }, [editor, aiMode, loading, showSelectionMenu, showLanguageMenu, showPromptDialog, showCustomTableDialog, handleAIProcess]);


  // Reset table dimensions when dialog opens
  useEffect(() => {
    if (showCustomTableDialog) {
      setTableCols(4);
      setTableRows(3);
    }
  }, [showCustomTableDialog]);

  // Keyboard shortcuts for custom table dialog
  useEffect(() => {
    if (!showCustomTableDialog) return;

    const handleDialogKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when dialog is open and inputs might not be focused
      if ((e.ctrlKey || e.metaKey) && ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        switch (e.key) {
          case 'ArrowRight':
            setTableCols(prev => {
              const current = prev > 0 ? prev : 4;
              return Math.min(10, current + 1);
            });
            break;
          case 'ArrowLeft':
            setTableCols(prev => {
              const current = prev > 0 ? prev : 4;
              return Math.max(1, current - 1);
            });
            break;
          case 'ArrowDown':
            setTableRows(prev => {
              const current = prev > 0 ? prev : 3;
              return Math.min(10, current + 1);
            });
            break;
          case 'ArrowUp':
            setTableRows(prev => {
              const current = prev > 0 ? prev : 3;
              return Math.max(1, current - 1);
            });
            break;
        }
        return false;
      }
    };

    // Use capture phase to catch events early
    window.addEventListener('keydown', handleDialogKeyDown, true);
    return () => window.removeEventListener('keydown', handleDialogKeyDown, true);
  }, [showCustomTableDialog]);

  const handleLinkInsert = () => {
    if (!linkUrl.trim() || !editor) return;

    const urlInput = linkUrl.trim();
    // Ensure URL has protocol
    const finalUrl = urlInput.match(/^https?:\/\//) ? urlInput : `https://${urlInput}`;
    const text = linkText.trim();

    if (editor.isActive('link')) {
      // Update existing link - just change the URL
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    } else {
      // Insert new link
      if (text) {
        // Insert link with custom text
        editor.chain().focus().insertContent({
          type: 'text',
          text: text,
          marks: [
            {
              type: 'link',
              attrs: {
                href: finalUrl,
              },
            },
          ],
        }).run();
      } else {
        // Insert link with URL as text (or selected text)
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        
        if (selectedText) {
          // Use selected text as link text
          editor.chain().focus().setLink({ href: finalUrl }).run();
        } else {
          // Insert URL as both text and link
          editor.chain().focus().insertContent({
            type: 'text',
            text: finalUrl,
            marks: [
              {
                type: 'link',
                attrs: {
                  href: finalUrl,
                },
              },
            ],
          }).run();
        }
      }
    }

    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleSelectionAction = async (action: 'improve' | 'check-errors' | 'translate' | 'update', targetLanguage?: string, customPromptText?: string) => {
    console.log('handleSelectionAction called:', { action, selectionRange, loading, editor: !!editor });
    if (!selectionRange || loading || !editor) {
      console.log('Early return:', { selectionRange: !!selectionRange, loading, editor: !!editor });
      return;
    }

    const { from, to } = selectionRange;
    
    // Validate selection range is still within document bounds
    const docSize = editor.state.doc.content.size;
    if (from < 0 || to < 0 || from > docSize || to > docSize || from > to) {
      console.error('Invalid selection range:', { from, to, docSize });
      setShowSelectionMenu(false);
      setShowLanguageMenu(false);
      setShowPromptDialog(false);
      setSelectionRange(null);
      return;
    }

    const selectedText_ = editor.state.doc.textBetween(from, to).trim();
    
    if (!selectedText_) {
      setShowSelectionMenu(false);
      setShowLanguageMenu(false);
      setShowPromptDialog(false);
      setSelectionRange(null);
      return;
    }

    // If update is selected, show prompt dialog
    if (action === 'update' && !customPromptText) {
      setShowSelectionMenu(false);
      setShowPromptDialog(true);
      setTimeout(() => {
        promptInputRef.current?.focus();
      }, 100);
      return;
    }

    // If translate is selected but no language chosen, show language menu
    if (action === 'translate' && !targetLanguage) {
      // Calculate position for language menu
      let menuTop = 0;
      let menuLeft = 0;
      
      if (selectionMenuPosition) {
        // Position to the right of the selection menu
        menuTop = selectionMenuPosition.top;
        menuLeft = selectionMenuPosition.left + 230; // Offset to the right (menu width + gap)
        
        // If menu would go off-screen, position it to the left instead
        if (menuLeft + 224 > window.innerWidth) {
          menuLeft = selectionMenuPosition.left - 230;
        }
      } else {
        // Fallback: position near editor
        const editorElement = editor.view.dom.closest('.tiptap-editor-wrapper');
        if (editorElement) {
          const rect = editorElement.getBoundingClientRect();
          menuTop = rect.top + 50;
          menuLeft = rect.right + 10;
          
          // Ensure it's in viewport
          if (menuLeft + 224 > window.innerWidth) {
            menuLeft = rect.left - 230;
          }
        } else {
          // Last resort: use window center
          menuTop = window.innerHeight / 2;
          menuLeft = window.innerWidth / 2 - 112; // Center the 224px wide menu
        }
      }
      
      // Ensure menu stays in viewport
      menuTop = Math.max(8, Math.min(menuTop, window.innerHeight - 300));
      menuLeft = Math.max(8, Math.min(menuLeft, window.innerWidth - 232));
      
      setLanguageMenuPosition({
        top: menuTop,
        left: menuLeft,
      });
      setShowLanguageMenu(true);
      console.log('Language menu shown at:', { top: menuTop, left: menuLeft });
      return;
    }

    setLoading(true);
    setShowSelectionMenu(false);
    setShowLanguageMenu(false);

    try {
      const response = await fetch('/api/ai/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText_,
          action,
          targetLanguage,
          customPrompt: customPromptText,
        }),
      });

      const data = await response.json();

      if (data.success && data.result) {
        // Log for debugging
        console.log('AI Selection Action response:', {
          action,
          resultLength: data.result.length,
          wasTruncated: data.wasTruncated,
          resultPreview: data.result.substring(0, 100) + (data.result.length > 100 ? '...' : ''),
        });
        
        if (data.wasTruncated) {
          showWarning('Warning', 'The AI response may have been truncated. The result might be incomplete.');
        }
        
        // Replace selected text with result using TipTap
        editor.chain()
          .focus()
          .setTextSelection({ from, to })
          .deleteSelection()
          .insertContent(data.result)
          .run();
      } else {
        showError('Failed to process text', data.message || 'An error occurred while processing the text.');
      }
    } catch (error) {
      console.error('AI processing error:', error);
      showError('Error', 'Failed to process text. Please try again.');
    } finally {
      setLoading(false);
      setSelectionRange(null);
      setCustomPrompt('');
      setShowPromptDialog(false);
    }
  };

  const handleUpdateWithPrompt = async () => {
    if (!customPrompt.trim() || !selectionRange || loading || !editor) return;
    
    const promptText = customPrompt.trim();
    const { from, to } = selectionRange;
    const selectedText_ = editor.state.doc.textBetween(from, to).trim();
    
    if (!selectedText_) {
      setShowPromptDialog(false);
      return;
    }

    setLoading(true);
    setShowPromptDialog(false);
    setShowSelectionMenu(false);

    try {
      const response = await fetch('/api/ai/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText_,
          action: 'update',
          customPrompt: promptText,
        }),
      });

      const data = await response.json();

      if (data.success && data.result) {
        // Log for debugging
        console.log('AI Update response:', {
          resultLength: data.result.length,
          wasTruncated: data.wasTruncated,
          resultPreview: data.result.substring(0, 100) + (data.result.length > 100 ? '...' : ''),
          fullResult: data.result, // Log full result for debugging
        });
        
        if (data.wasTruncated) {
          showWarning('Warning', 'The AI response was truncated due to length limits. The result may be incomplete. Consider breaking your request into smaller parts.');
        }
        
        // Replace selected text with result using TipTap
        editor.chain()
          .focus()
          .setTextSelection({ from, to })
          .deleteSelection()
          .insertContent(data.result)
          .run();
      } else {
        showError('Failed to process text', data.message || 'An error occurred while processing the text.');
      }
    } catch (error) {
      console.error('AI processing error:', error);
      showError('Error', 'Failed to process text. Please try again.');
    } finally {
      setLoading(false);
      setSelectionRange(null);
      setCustomPrompt('');
    }
  };

  // Close menu on outside click
  useEffect(() => {
    if (!showSelectionMenu && !showLanguageMenu && !showColorPicker && !showHighlightPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on a button inside the menu (buttons trigger actions)
      // Use a small delay to allow button click handlers to execute first
      if (target.closest('button') && (menuRef.current?.contains(target) || languageMenuRef.current?.contains(target))) {
        return;
      }
      
      // Check if click is inside any relevant element
      const clickedSelectionMenu = menuRef.current?.contains(target);
      const clickedLanguageMenu = languageMenuRef.current?.contains(target);
      const clickedEditor = target.closest('.tiptap-editor-wrapper');
      const clickedPromptDialog = showPromptDialog && target.closest('[role="dialog"]');
      
      // If clicking outside all menus, editor, and prompt dialog, close menus
      if (!clickedSelectionMenu && !clickedLanguageMenu && !clickedEditor && !clickedPromptDialog) {
        if (showSelectionMenu) {
          setShowSelectionMenu(false);
        }
        if (showLanguageMenu) {
          setShowLanguageMenu(false);
        }
        if (showColorPicker) {
          setShowColorPicker(false);
        }
        if (showHighlightPicker) {
          setShowHighlightPicker(false);
        }
      }
    };

    // Use mousedown for better responsiveness
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSelectionMenu, showLanguageMenu, showPromptDialog, showColorPicker, showHighlightPicker]);

  // Ensure language menu can receive wheel events for touchpad scrolling
  useEffect(() => {
    if (!showLanguageMenu || !languageMenuRef.current) return;

    const menuElement = languageMenuRef.current;
    
    // Wheel handler to prevent event from bubbling to dialog/page, but allow native scrolling
    const handleWheel = (e: WheelEvent) => {
      // Only handle if content is scrollable
      if (menuElement.scrollHeight <= menuElement.clientHeight) {
        return; // Don't interfere if content fits
      }
      
      const { scrollTop, scrollHeight, clientHeight } = menuElement;
      const deltaY = e.deltaY;
      const isScrollingDown = deltaY > 0;
      const isScrollingUp = deltaY < 0;
      const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;
      const canScrollUp = scrollTop > 0;
      
      // If we can scroll in the requested direction, allow native browser scrolling
      // but prevent event from bubbling to dialog/page
      if ((isScrollingDown && canScrollDown) || (isScrollingUp && canScrollUp)) {
        // Don't prevent default - let browser handle smooth native scrolling
        // Only stop propagation to prevent dialog/page from scrolling
        e.stopPropagation();
        e.stopImmediatePropagation();
      } else {
        // At scroll boundary, prevent both default and propagation
        // This prevents dialog/page from scrolling when menu is at boundary
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Use capture phase to intercept before other handlers
    // Use passive: false so we can prevent default when at boundaries
    menuElement.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    
    // Focus the menu element to ensure it can receive events
    setTimeout(() => {
      menuElement.focus();
    }, 0);
    
    return () => {
      menuElement.removeEventListener('wheel', handleWheel, { capture: true } as any);
    };
  }, [showLanguageMenu]);


  return (
    <div className={cn('relative', className)}>
      <div className="border rounded-md overflow-hidden">
        {/* AI Mode Indicator */}
        {aiMode && (
          <div className="bg-purple-50 dark:bg-purple-950/20 border-b border-purple-200 dark:border-purple-800 px-2 py-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span className="text-purple-700 dark:text-purple-300 font-medium">AI Active</span>
              <span className="text-purple-600 dark:text-purple-400 text-[11px]">Press Enter to process</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
              onClick={() => setAiMode(false)}
            >
              <X className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            </Button>
          </div>
        )}

        {/* Formatting Toolbar */}
        {!aiMode && editor && (
          <div className="flex items-center gap-1 p-1 border-b border-border bg-muted/30">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive('bold') && 'bg-muted')}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              disabled={loading || aiMode}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive('italic') && 'bg-muted')}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              disabled={loading || aiMode}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive('underline') && 'bg-muted')}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              disabled={loading || aiMode}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive('strike') && 'bg-muted')}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              disabled={loading || aiMode}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive('highlight') && 'bg-muted')}
              onClick={() => editor?.chain().focus().toggleHighlight().run()}
              disabled={loading || aiMode}
              title="Highlight"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive('bulletList') && 'bg-muted')}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              disabled={loading || aiMode}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive('codeBlock') && 'bg-muted')}
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              disabled={loading || aiMode}
              title="Code Block"
            >
              <Code className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive({ textAlign: 'left' }) && 'bg-muted')}
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              disabled={loading || aiMode}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive({ textAlign: 'center' }) && 'bg-muted')}
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              disabled={loading || aiMode}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive({ textAlign: 'right' }) && 'bg-muted')}
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              disabled={loading || aiMode}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive('link') && 'bg-muted')}
              onClick={() => {
                if (!editor) return;
                // Get current selection text if any
                const { from, to } = editor.state.selection;
                const selectedText = editor.state.doc.textBetween(from, to);
                
                // If there's already a link, get its URL
                const linkAttrs = editor.getAttributes('link');
                const existingUrl = linkAttrs.href || '';
                
                // If editing an existing link, remove protocol for cleaner display
                const displayUrl = existingUrl.replace(/^https?:\/\//, '');
                
                setLinkText(selectedText);
                setLinkUrl(displayUrl || existingUrl);
                setShowLinkDialog(true);
              }}
              disabled={loading || aiMode || !editor}
              title={editor?.isActive('link') ? 'Edit Link' : 'Add Link'}
            >
              <Link2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={loading || aiMode}
                  title="Text Format"
                >
                  <Type className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => editor?.chain().focus().setParagraph().run()} className={cn(editor?.isActive('paragraph') && 'bg-muted')}>
                  <span className="text-xs">Paragraph</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={cn(editor?.isActive('heading', { level: 1 }) && 'bg-muted')}>
                  <Heading1 className="h-3 w-3 mr-2" />
                  <span className="text-base font-bold">Heading 1</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={cn(editor?.isActive('heading', { level: 2 }) && 'bg-muted')}>
                  <Heading2 className="h-3 w-3 mr-2" />
                  <span className="text-sm font-bold">Heading 2</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={cn(editor?.isActive('heading', { level: 3 }) && 'bg-muted')}>
                  <Heading3 className="h-3 w-3 mr-2" />
                  <span className="text-sm font-semibold">Heading 3</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive('blockquote') && 'bg-muted')}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              disabled={loading || aiMode}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", editor?.isActive('taskList') && 'bg-muted')}
              onClick={() => editor?.chain().focus().toggleTaskList().run()}
              disabled={loading || aiMode}
              title="Checklist"
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              disabled={loading || aiMode}
              title="Divider"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={loading || aiMode}
                  title="Table"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => editor?.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run()}>
                  2×2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run()}>
                  3×3
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCustomTableDialog(true)}>
                  Custom
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-px h-6 bg-border mx-1" />
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setShowColorPicker(!showColorPicker)}
                disabled={loading || aiMode}
                title="Text Color"
              >
                <Palette className="h-4 w-4" />
              </Button>
              {showColorPicker && (
                <div className="absolute top-8 left-0 z-50 w-48 bg-popover border rounded-lg shadow-lg p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className="w-8 h-8 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color.value }}
                        onClick={() => {
                          editor.chain().focus().setColor(color.value).run();
                          setShowColorPicker(false);
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      editor.chain().focus().unsetColor().run();
                      setShowColorPicker(false);
                    }}
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-7 w-7 p-0", editor?.isActive('highlight') && 'bg-muted')}
                onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                disabled={loading || aiMode}
                title="Background Color"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
              {showHighlightPicker && (
                <div className="absolute top-8 left-0 z-50 w-48 bg-popover border rounded-lg shadow-lg p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className="w-8 h-8 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color.value }}
                        onClick={() => {
                          editor.chain().focus().toggleHighlight({ color: color.value }).run();
                          setShowHighlightPicker(false);
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      editor.chain().focus().unsetHighlight().run();
                      setShowHighlightPicker(false);
                    }}
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
              disabled={loading || aiMode || !editor}
              title="Clear Format"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="relative tiptap-editor-wrapper">
          {editor && (
            <div className={cn(
              'relative',
              loading && 'ai-processing'
            )}>
              <EditorContent editor={editor} />
              {/* AI Processing Animation */}
              {loading && (
                <div className="ai-loading-indicator absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="ai-loading-content inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    <span className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent">
                      AI is thinking...
                    </span>
                    <div className="ai-dots flex gap-1.5">
                      <div className="ai-dot w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                      <div className="ai-dot w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                      <div className="ai-dot w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Subtle hint about AI selection feature */}
          {!loading && !aiMode && value && value.trim() !== '' && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-muted-foreground/60 pointer-events-none">
              <Sparkles className="h-3 w-3" />
              <span>Select text + "/" for AI</span>
            </div>
          )}
        </div>
      </div>

      {/* Selection Menu - Render in portal to avoid dialog overflow issues */}
      {showSelectionMenu && selectionMenuPosition && mounted && typeof document !== 'undefined' && document.body && createPortal(
        <div
          ref={menuRef}
          data-ai-menu="true"
          className="fixed w-56 rounded-md border bg-popover p-1 shadow-lg"
          style={{
            top: `${selectionMenuPosition.top}px`,
            left: `${selectionMenuPosition.left}px`,
            zIndex: 999999,
            pointerEvents: 'auto',
            isolation: 'isolate',
          }}
        >
          <div className="space-y-1" style={{ pointerEvents: 'auto' }}>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-left font-normal"
              style={{ 
                pointerEvents: 'auto', 
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1000000,
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Improve clicked, selectionRange:', selectionRange);
                handleSelectionAction('improve');
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm">Improve Requirements <span className="text-xs text-muted-foreground ml-1">(I)</span></span>
                <span className="text-xs text-muted-foreground">Enhance clarity and structure</span>
              </div>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-left font-normal"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectionAction('check-errors');
              }}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm">Grammar Improvement <span className="text-xs text-muted-foreground ml-1">(G)</span></span>
                <span className="text-xs text-muted-foreground">Grammar, spelling, clarity</span>
              </div>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-left font-normal"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectionAction('translate');
              }}
            >
              <Languages className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm">Translate <span className="text-xs text-muted-foreground ml-1">(T)</span></span>
                <span className="text-xs text-muted-foreground">Choose target language</span>
              </div>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-left font-normal"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectionAction('update');
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm">Update <span className="text-xs text-muted-foreground ml-1">(U)</span></span>
                <span className="text-xs text-muted-foreground">Custom prompt</span>
              </div>
            </Button>
          </div>
        </div>,
        document.body
      )}

      {/* Prompt Dialog for Update */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Text with Custom Prompt</DialogTitle>
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
                placeholder="e.g., Make it more formal, Add details, Summarize..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleUpdateWithPrompt();
                  }
                  if (e.key === 'Escape') {
                    setShowPromptDialog(false);
                    setCustomPrompt('');
                  }
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Selected text: "{editor && selectionRange ? editor.state.doc.textBetween(selectionRange.from, selectionRange.to).substring(0, 50) : ''}{editor && selectionRange && editor.state.doc.textBetween(selectionRange.from, selectionRange.to).length > 50 ? '...' : ''}"
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setShowPromptDialog(false);
              setCustomPrompt('');
            }}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdateWithPrompt} disabled={!customPrompt.trim() || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Language Selection Menu - Render in portal */}
      {showLanguageMenu && languageMenuPosition && mounted && typeof document !== 'undefined' && document.body && createPortal(
        <div
          ref={languageMenuRef}
          data-ai-menu="true"
          tabIndex={-1}
          className="fixed w-56 rounded-md border bg-popover p-1 shadow-lg max-h-[300px] language-menu-scroll"
          style={{
            top: `${languageMenuPosition.top}px`,
            left: `${languageMenuPosition.left}px`,
            scrollbarWidth: 'thin',
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            touchAction: 'pan-y',
            zIndex: 999999,
            pointerEvents: 'auto',
            isolation: 'isolate',
            outline: 'none',
          }}
          onMouseEnter={() => {
            // Focus when mouse enters to ensure wheel events work
            if (languageMenuRef.current) {
              languageMenuRef.current.focus();
            }
          }}
        >
          <div className="space-y-1" style={{ pointerEvents: 'auto' }}>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Select target language:
            </div>
            {LANGUAGES.map((language) => (
              <Button
                key={language.code}
                type="button"
                variant="ghost"
                className="w-full justify-start text-left font-normal"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectionAction('translate', language.code);
                }}
              >
                <Languages className="h-4 w-4 mr-2" />
                <span className="text-sm">{language.name}</span>
              </Button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Custom Table Size Dialog */}
      <Dialog open={showCustomTableDialog} onOpenChange={setShowCustomTableDialog}>
        <DialogContent 
          className="sm:max-w-sm"
          onKeyDown={(e) => {
            // Handle keyboard shortcuts directly in the dialog
            if ((e.ctrlKey || e.metaKey) && ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
              e.preventDefault();
              e.stopPropagation();
              
              switch (e.key) {
                case 'ArrowRight':
                  setTableCols(prev => {
                    const current = prev > 0 ? prev : 4;
                    return Math.min(10, current + 1);
                  });
                  break;
                case 'ArrowLeft':
                  setTableCols(prev => {
                    const current = prev > 0 ? prev : 4;
                    return Math.max(1, current - 1);
                  });
                  break;
                case 'ArrowDown':
                  setTableRows(prev => {
                    const current = prev > 0 ? prev : 3;
                    return Math.min(10, current + 1);
                  });
                  break;
                case 'ArrowUp':
                  setTableRows(prev => {
                    const current = prev > 0 ? prev : 3;
                    return Math.max(1, current - 1);
                  });
                  break;
              }
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Custom Table Size</DialogTitle>
            <DialogDescription>
              Enter the number of columns and rows for your table. Use Ctrl+Arrow keys to adjust: →/← for columns, ↑/↓ for rows.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Columns Control */}
            <div className="space-y-2">
              <Label htmlFor="table-cols-input">Columns (X)</Label>
              <Input
                id="table-cols-input"
                type="number"
                min={1}
                max={10}
                value={tableCols}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 10) {
                    setTableCols(val);
                  } else if (e.target.value === '') {
                    setTableCols(0);
                  }
                }}
                onKeyDown={(e) => {
                  // Handle Ctrl+Arrow shortcuts for columns
                  if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.key === 'ArrowRight') {
                      setTableCols(prev => {
                        const current = prev > 0 ? prev : 4;
                        return Math.min(10, current + 1);
                      });
                    } else if (e.key === 'ArrowLeft') {
                      setTableCols(prev => {
                        const current = prev > 0 ? prev : 4;
                        return Math.max(1, current - 1);
                      });
                    }
                    return false;
                  }
                  // Handle Enter to create table
                  if (e.key === 'Enter' && tableCols >= 1 && tableRows >= 1) {
                    e.preventDefault();
                    if (editor) {
                      editor.chain().focus().insertTable({ 
                        rows: tableRows, 
                        cols: tableCols, 
                        withHeaderRow: false 
                      }).run();
                    }
                    setShowCustomTableDialog(false);
                  }
                }}
                className="w-20"
                placeholder="1-10"
                autoFocus
              />
            </div>

            {/* Rows Control */}
            <div className="space-y-2">
              <Label htmlFor="table-rows-input">Rows (Y)</Label>
              <Input
                id="table-rows-input"
                type="number"
                min={1}
                max={10}
                value={tableRows}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 10) {
                    setTableRows(val);
                  } else if (e.target.value === '') {
                    setTableRows(0);
                  }
                }}
                onKeyDown={(e) => {
                  // Handle Ctrl+Arrow shortcuts for rows
                  if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.key === 'ArrowDown') {
                      setTableRows(prev => {
                        const current = prev > 0 ? prev : 3;
                        return Math.min(10, current + 1);
                      });
                    } else if (e.key === 'ArrowUp') {
                      setTableRows(prev => {
                        const current = prev > 0 ? prev : 3;
                        return Math.max(1, current - 1);
                      });
                    }
                    return false;
                  }
                  // Handle Enter to create table
                  if (e.key === 'Enter' && tableCols >= 1 && tableRows >= 1) {
                    e.preventDefault();
                    if (editor) {
                      editor.chain().focus().insertTable({ 
                        rows: tableRows, 
                        cols: tableCols, 
                        withHeaderRow: false 
                      }).run();
                    }
                    setShowCustomTableDialog(false);
                  }
                }}
                className="w-20"
                placeholder="1-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCustomTableDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (editor && tableCols >= 1 && tableRows >= 1) {
                  editor.chain().focus().insertTable({ 
                    rows: tableRows, 
                    cols: tableCols, 
                    withHeaderRow: false 
                  }).run();
                }
                setShowCustomTableDialog(false);
              }}
              disabled={tableCols < 1 || tableRows < 1 || tableCols > 10 || tableRows > 10}
            >
              Create Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Enter the URL and optional link text. If no text is provided, the URL will be used as the link text.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Link Text */}
            <div className="space-y-2">
              <Label htmlFor="link-text-input">Link Text (optional)</Label>
              <Input
                id="link-text-input"
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text (optional)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && linkUrl.trim()) {
                    e.preventDefault();
                    handleLinkInsert();
                  }
                }}
              />
            </div>

            {/* Link URL */}
            <div className="space-y-2">
              <Label htmlFor="link-url-input">URL *</Label>
              <Input
                id="link-url-input"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && linkUrl.trim()) {
                    e.preventDefault();
                    handleLinkInsert();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowLinkDialog(false);
                setLinkUrl('');
                setLinkText('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleLinkInsert}
              disabled={!linkUrl.trim()}
            >
              {editor?.isActive('link') ? 'Update Link' : 'Add Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

