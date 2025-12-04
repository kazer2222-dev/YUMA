'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageTree } from './page-tree';
import { PageTreeNode } from './page-tree/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Search,
  Plus,
  Clock,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';
import { Skeleton } from '@/components/loading';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface DocumentsPageProps {
  showSidebar?: boolean;
  onPageSelect?: (pageId: string) => void;
}

export function DocumentsPage({ showSidebar = true, onPageSelect }: DocumentsPageProps) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { success, error: showError } = useToastHelpers();

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [pages, setPages] = useState<PageTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter pages based on search query
  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch pages
  const fetchPages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/spaces/${slug}/pages/tree`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && data.pages) {
        setPages(data.pages);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  // Initial fetch and listen for refresh
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchPages();
    };
    window.addEventListener('REFRESH_PAGE_TREE', handleRefresh);
    return () => {
      window.removeEventListener('REFRESH_PAGE_TREE', handleRefresh);
    };
  }, [fetchPages]);

  // Handle page selection
  const handlePageSelect = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
  }, []);

  // Handle page open (navigate to document editor)
  const handlePageOpen = useCallback(
    (pageId: string) => {
      console.log('[DocumentsPage] handlePageOpen called with pageId:', pageId);
      if (onPageSelect) {
        onPageSelect(pageId);
      } else {
        router.push(`/spaces/${slug}/documents/${pageId}`);
      }
    },
    [router, slug, onPageSelect]
  );

  // Handle page creation
  const handlePageCreate = useCallback(
    async (parentId: string | null, title: string): Promise<PageTreeNode | null> => {
      try {
        console.log('Creating page...', { slug, parentId, title });
        const response = await fetch(`/api/spaces/${slug}/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title,
            parentId,
          }),
        });

        const data = await response.json();
        if (data.success && data.page) {
          success('Page created successfully');

          // Dispatch event to refresh sidebar tree
          window.dispatchEvent(new CustomEvent('REFRESH_PAGE_TREE'));

          if (onPageSelect) {
            onPageSelect(data.page.id);
          } else {
            router.push(`/spaces/${slug}/documents/${data.page.id}`);
          }
          return data.page;
        } else {
          console.error('Failed to create page:', data.message);
          showError(data.message || 'Failed to create page');
          return null;
        }
      } catch (error: any) {
        console.error('Failed to create page:', error);
        showError(error?.message || 'Failed to create page');
        return null;
      }
    },
    [slug, router, success, showError, onPageSelect]
  );

  // Handle page move
  const handlePageMove = useCallback(
    async (pageId: string, newParentId: string | null, newPosition: number): Promise<boolean> => {
      try {
        const response = await fetch(`/api/spaces/${slug}/pages/${pageId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            newParentId,
            newPosition,
          }),
        });

        const data = await response.json();
        return data.success;
      } catch (error) {
        console.error('Failed to move page:', error);
        return false;
      }
    },
    [slug]
  );

  // Handle page deletion
  const handlePageDelete = useCallback(
    async (pageId: string): Promise<boolean> => {
      if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
        return false;
      }

      try {
        const response = await fetch(`/api/spaces/${slug}/documents/${pageId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        const data = await response.json();
        return data.success;
      } catch (error) {
        console.error('Failed to delete page:', error);
        return false;
      }
    },
    [slug]
  );

  return (
    <div className="flex h-full bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">


        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-lg border border-border bg-card p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="pt-4 flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : pages.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Documents</h2>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              </div>

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Create New Card - Now First */}
                  <button
                    onClick={() => handlePageCreate(null, 'Untitled')}
                    className="h-32 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-2 transition-colors group"
                  >
                    <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">Create New Page</span>
                  </button>

                  {filteredPages.map((page) => (
                    <Card
                      key={page.id}
                      className="group cursor-pointer hover:shadow-md transition-all border-border hover:border-primary/50"
                      onClick={() => handlePageOpen(page.id)}
                    >
                      <CardContent className="p-4 flex flex-col h-32 justify-between">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                              {page.icon ? (
                                <span>{page.icon}</span>
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                          <h3 className="font-medium truncate" title={page.title || 'Untitled'}>
                            {page.title || 'Untitled'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {page.authorAvatar ? (
                            <img src={page.authorAvatar} alt="" className="w-4 h-4 rounded-full" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-[8px]">{page.authorName?.[0] || '?'}</span>
                            </div>
                          )}
                          <span>
                            {page.updatedAt ? formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true }) : 'Just now'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredPages.length === 0 && searchQuery && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No documents found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground h-full">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-lg font-medium mb-2">No documents yet</h2>
                <p className="text-sm max-w-md mb-6">
                  Create your first page to get started with documentation.
                </p>
                <Button
                  variant="default"
                  onClick={() => {
                    console.log('Creating first page...', { slug: params.slug });
                    handlePageCreate(null, 'Untitled');
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Page
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentsPage;
