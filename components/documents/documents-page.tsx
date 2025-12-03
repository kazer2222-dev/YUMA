'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus,
  Search,
  FileText,
  Grid3x3,
  List,
  MoreVertical,
  Filter,
  Download,
  Share2,
  Trash2,
  Edit,
  Eye,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  Pin,
  PinOff,
} from 'lucide-react';
import { DocumentViewer } from './document-viewer';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

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
  authorId: string;
  fileSize?: number;
  mimeType?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
  commentCount: number;
  linkedTaskCount: number;
  access: string;
}

export function DocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [slug, filterType, filterStatus, searchQuery]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/spaces/${slug}/documents?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.error || data.message || 'Failed to fetch documents';
        console.error('Error fetching documents:', errorMessage);
        if (data.error === 'Prisma client needs to be regenerated') {
          console.error('⚠️ ACTION REQUIRED: Stop the dev server, run "npx prisma generate", then restart');
        }
        setDocuments([]);
        return;
      }

      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/spaces/${slug}/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setDocuments(documents.filter(d => d.id !== documentId));
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(null);
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handlePin = async (document: Document) => {
    try {
      const response = await fetch(`/api/spaces/${slug}/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPinned: !document.isPinned }),
      });
      const data = await response.json();

      if (data.success) {
        setDocuments(documents.map(d => 
          d.id === document.id ? { ...d, isPinned: !d.isPinned } : d
        ));
      }
    } catch (error) {
      console.error('Error pinning document:', error);
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-5 h-5" />;
      case 'DOCX':
        return <FileText className="w-5 h-5" />;
      case 'XLSX':
        return <FileSpreadsheet className="w-5 h-5" />;
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5" />;
      case 'RICH_TEXT':
        return <FileCode className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedDocument) {
    return (
      <DocumentViewer
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onUpdate={(updated) => {
          setDocuments((prev) =>
            prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
          );
          setSelectedDocument((prev) =>
            prev && prev.id === updated.id ? { ...prev, ...updated } : prev
          );
        }}
        spaceSlug={slug}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and collaborate on documents
          </p>
        </div>
        <Button onClick={() => router.push(`/spaces/${slug}/documents/new`)}>
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Filters and Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="RICH_TEXT">Rich Text</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="DOCX">Word</SelectItem>
              <SelectItem value="XLSX">Excel</SelectItem>
              <SelectItem value="IMAGE">Image</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Documents List/Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first document'}
            </p>
            {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
              <Button onClick={() => router.push(`/spaces/${slug}/documents/new`)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Document
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer hover:shadow-lg transition-shadow relative"
                onClick={() => setSelectedDocument(doc)}
              >
                {doc.isPinned && (
                  <Pin className="absolute top-2 right-2 w-4 h-4 text-yellow-500" />
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getDocumentIcon(doc.type)}
                      <CardTitle className="text-base line-clamp-2">{doc.title}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDocument(doc);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/spaces/${slug}/documents/${doc.id}`);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handlePin(doc);
                        }}>
                          {doc.isPinned ? (
                            <>
                              <PinOff className="w-4 h-4 mr-2" />
                              Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="w-4 h-4 mr-2" />
                              Pin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {doc.description && (
                    <CardDescription className="line-clamp-2 mt-2">
                      {doc.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={doc.author.avatar} />
                      <AvatarFallback>
                        {doc.author.name?.[0] || doc.author.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {doc.author.name || doc.author.email}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {doc.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{doc.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                    {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setSelectedDocument(doc)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      {getDocumentIcon(doc.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{doc.title}</h3>
                          {doc.isPinned && <Pin className="w-4 h-4 text-yellow-500" />}
                          <Badge variant="outline">{doc.status}</Badge>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {doc.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{doc.author.name || doc.author.email}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                          {doc.fileSize && (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(doc.fileSize)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocument(doc);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/spaces/${slug}/documents/${doc.id}`);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handlePin(doc);
                          }}>
                            {doc.isPinned ? (
                              <>
                                <PinOff className="w-4 h-4 mr-2" />
                                Unpin
                              </>
                            ) : (
                              <>
                                <Pin className="w-4 h-4 mr-2" />
                                Pin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

