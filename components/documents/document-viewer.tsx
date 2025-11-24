'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// ScrollArea will be used if available, otherwise fallback to div
import {
  ArrowLeft,
  Edit,
  Share2,
  Download,
  MoreVertical,
  FileText,
  Clock,
  User,
  Tag,
  MessageSquare,
  History,
  Settings,
  Eye,
  Save,
  List as ListIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { DocumentEditor } from './document-editor';
import { DocumentComments } from './document-comments';
import { DocumentShareDialog } from './document-share-dialog';
import { DocumentAccessManager } from './document-access-manager';
import { cn } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';

interface Document {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  tags: string[];
  author: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  content?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
  commentCount: number;
}

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
  onUpdate: (document: Document) => void;
  spaceSlug: string;
}

export function DocumentViewer({
  document: initialDocument,
  onClose,
  onUpdate,
  spaceSlug,
}: DocumentViewerProps) {
  const { error: showError } = useToastHelpers();
  const [document, setDocument] = useState<Document>(initialDocument);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [isEditing, setIsEditing] = useState(false);
  const [showTOC, setShowTOC] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [initialDocument.id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/spaces/${spaceSlug}/documents/${initialDocument.id}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setDocument(data.document);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract TOC from document structure or content
  const tableOfContents = useMemo(() => {
    if (document.structure) {
      try {
        const parsed = typeof document.structure === 'string' 
          ? JSON.parse(document.structure) 
          : document.structure;
        return parsed.headings || [];
      } catch {
        return [];
      }
    }
    
    // Fallback: extract headings from HTML content
    if (document.content) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(document.content, 'text/html');
      const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headings.map((heading, index) => ({
        id: `heading-${index}`,
        level: parseInt(heading.tagName.charAt(1)),
        text: heading.textContent || '',
      }));
    }
    
    return [];
  }, [document.structure, document.content]);

  const handleSave = async (content: string) => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (data.success) {
        setDocument({ ...document, content: data.document.content, updatedAt: data.document.updatedAt });
        onUpdate?.(data.document);
        return;
      }
      throw new Error(data.message || 'Failed to save');
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  };

  const handleTitleSave = async (newTitle: string) => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newTitle }),
      });

      const data = await response.json();
      if (data.success) {
        setDocument({ ...document, title: data.document.title });
        onUpdate?.(data.document);
      }
    } catch (error) {
      console.error('Error saving title:', error);
      showError('Error', 'Failed to save title');
    }
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading document...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{document.title}</h1>
            {document.description && (
              <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{document.status}</Badge>
          {document.type === 'RICH_TEXT' && (
            <Button
              variant={isEditing ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => setShareDialogOpen(true)}>
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setAccessDialogOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Manage Access
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Table of Contents Sidebar */}
        {showTOC && tableOfContents.length > 0 && !isEditing && (
          <div className="w-64 border-r bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ListIcon className="w-4 h-4" />
                Table of Contents
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowTOC(false)}
              >
                ×
              </Button>
            </div>
            <div className="h-full overflow-y-auto">
              <nav className="space-y-1">
                {tableOfContents.map((heading: any) => (
                  <button
                    key={heading.id}
                    onClick={() => scrollToHeading(heading.id)}
                    className={cn(
                      'block w-full text-left px-2 py-1 rounded text-sm hover:bg-accent transition-colors',
                      heading.level === 1 && 'font-semibold',
                      heading.level === 2 && 'pl-4',
                      heading.level === 3 && 'pl-6',
                      heading.level >= 4 && 'pl-8 text-xs'
                    )}
                  >
                    {heading.text}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {isEditing && document.type === 'RICH_TEXT' ? (
            <DocumentEditor
              documentId={document.id}
              initialContent={document.content || ''}
              title={document.title}
              onSave={handleSave}
              onTitleChange={handleTitleSave}
              spaceSlug={spaceSlug}
              onClose={() => setIsEditing(false)}
            />
          ) : (
            <div className="max-w-4xl mx-auto p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="comments">
                    Comments ({document.commentCount})
                  </TabsTrigger>
                  <TabsTrigger value="versions">
                    Versions ({document.versionCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="mt-6">
                  {document.type === 'RICH_TEXT' && document.content ? (
                    <div className="relative">
                      {!showTOC && tableOfContents.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-0 right-0 z-10"
                          onClick={() => setShowTOC(true)}
                        >
                          <ListIcon className="w-4 h-4 mr-2" />
                          Show TOC
                        </Button>
                      )}
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: document.content.replace(
                            /<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi,
                            (match, tag, content, offset) => {
                              const id = `heading-${offset}`;
                              return `<${tag} id="${id}">${content}</${tag}>`;
                            }
                          )
                        }}
                      />
                    </div>
                  ) : document.fileUrl ? (
                    <div className="border rounded-lg p-4">
                      {document.mimeType?.startsWith('image/') ? (
                        <img
                          src={document.fileUrl}
                          alt={document.title}
                          className="max-w-full h-auto"
                        />
                      ) : (
                        <iframe
                          src={document.fileUrl}
                          className="w-full h-[600px] border-0"
                          title={document.title}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No content available
                    </div>
                  )}
                </TabsContent>

            <TabsContent value="details" className="mt-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Author:</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={document.author.avatar} />
                          <AvatarFallback>
                            {document.author.name?.[0] || document.author.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{document.author.name || document.author.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Created:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Updated:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {document.fileSize && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Size:</span>
                        <span className="text-sm text-muted-foreground">
                          {(document.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}
                    {document.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                          {document.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              <DocumentComments
                documentId={document.id}
                spaceSlug={spaceSlug}
                currentUserId={document.authorId}
                onCommentCreate={() => {
                  setDocument({ ...document, commentCount: document.commentCount + 1 });
                }}
              />
            </TabsContent>

            <TabsContent value="versions" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                Version history coming soon
              </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      <DocumentShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        documentId={document.id}
        spaceSlug={spaceSlug}
      />

      {/* Access Manager Dialog */}
      <DocumentAccessManager
        open={accessDialogOpen}
        onOpenChange={setAccessDialogOpen}
        documentId={document.id}
        spaceSlug={spaceSlug}
      />
    </div>
  );
}

