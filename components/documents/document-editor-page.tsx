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
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
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
  Table2,
  Minus,
  Save,
  Share2,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  ArrowLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';
import { DocumentShareDialog } from './document-share-dialog';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

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
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHasHeader, setTableHasHeader] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  // Initialize TipTap editor (only on client)
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
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[600px] p-8 max-w-4xl',
          // Theme-aware text colors - ensure bright text
          'prose-headings:text-foreground prose-headings:font-bold prose-headings:opacity-100',
          'prose-p:text-foreground prose-p:my-4 prose-p:opacity-100',
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
        style: 'color: hsl(var(--foreground)); opacity: 1;',
      },
    },
  });

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        editor.commands.setContent(document.content || '');
      }
    }
  }, [editor, document, isMounted]);

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
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'document'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const handleInsertTable = () => {
    if (!editor) return;
    
    const rows = Math.max(1, Math.min(20, tableRows));
    const cols = Math.max(1, Math.min(20, tableCols));
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: tableHasHeader })
      .run();
    setTableDialogOpen(false);
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
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
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
                className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent outline-none w-full text-foreground"
                style={{ 
                  color: 'hsl(var(--foreground)) !important',
                  caretColor: 'hsl(var(--foreground))',
                  WebkitTextFillColor: 'hsl(var(--foreground)) !important'
                }}
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

          {/* Toolbar */}
          <div className="flex items-center gap-1 mt-4 pt-4 border-t overflow-x-auto">
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
                  <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
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
                  const currentUrl = editor.getAttributes('link').href || '';
                  setLinkUrl(currentUrl);
                  setLinkDialogOpen(true);
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
                  setTableRows(3);
                  setTableCols(3);
                  setTableHasHeader(true);
                  setTableDialogOpen(true);
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
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto py-8">
          <EditorContent editor={editor} />
        </div>
      </div>

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

      {/* Table Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Table</DialogTitle>
            <DialogDescription>
              Choose the number of rows and columns for your table
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rows">Rows</Label>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cols">Columns</Label>
                <Input
                  id="cols"
                  type="number"
                  min="1"
                  max="20"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="header-toggle" className="text-sm font-medium">
                  Header row
                </Label>
                <p className="text-xs text-muted-foreground">
                  Adds a styled header row for column titles
                </p>
              </div>
              <Switch
                id="header-toggle"
                checked={tableHasHeader}
                onCheckedChange={setTableHasHeader}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertTable}>
              Insert Table
            </Button>
          </DialogFooter>
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

