'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageTree } from './page-tree';
import { PageTreeNode } from './page-tree/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronRight,
  FileText,
  Search,
  Plus,
  Settings,
  Grid3x3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';

interface DocumentsPageProps {
  showSidebar?: boolean;
}

export function DocumentsPage({ showSidebar = true }: DocumentsPageProps) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { success, error: showError } = useToastHelpers();

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<PageTreeNode[]>([]);

  // Handle page selection
  const handlePageSelect = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
  }, []);

  // Handle page open (navigate to document editor)
  const handlePageOpen = useCallback(
    (pageId: string) => {
      console.log('[DocumentsPage] handlePageOpen called with pageId:', pageId);
      router.push(`/spaces/${slug}/documents/${pageId}`);
    },
    [router, slug]
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
          router.push(`/spaces/${slug}/documents/${data.page.id}`);
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
    [slug, router, success, showError]
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
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Pages</h1>
            {/* Breadcrumb */}
            {breadcrumb.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {breadcrumb.map((node, index) => (
                  <div key={node.id} className="flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    <button
                      className="hover:text-foreground transition-colors"
                      onClick={() => handlePageOpen(node.id)}
                    >
                      {node.icon ? (
                        <span className="mr-1">{node.icon}</span>
                      ) : (
                        <FileText className="w-3 h-3 inline mr-1" />
                      )}
                      {node.title || 'Untitled'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Creating page...', { slug: params.slug });
                handlePageCreate(null, 'Untitled');
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Page
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-medium mb-2">Select a page</h2>
            <p className="text-sm max-w-md">
              Choose a page from the tree on the left to view or edit it, or create a new page to get started.
            </p>
            <Button
              variant="default"
              size="sm"
              className="mt-4"
              onClick={() => {
                console.log('Creating first page...', { slug: params.slug });
                handlePageCreate(null, 'Untitled');
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create your first page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentsPage;
