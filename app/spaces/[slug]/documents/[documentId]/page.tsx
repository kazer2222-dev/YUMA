'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DocumentEditorPage } from '@/components/documents/document-editor-page';
import { SpreadsheetEditor } from '@/components/documents/spreadsheet-editor';
import { NotionLayout } from '@/components/layout/notion-layout';
import { Loading } from '@/components/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Space {
  id: string;
  name: string;
  slug: string;
  description?: string;
  memberCount: number;
  taskCount: number;
}

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  content?: string;
}

export default function DocumentEditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const documentId = params.documentId as string;

  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [document, setDocument] = useState<Document | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('Document');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, spacesRes] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          fetch('/api/spaces', { credentials: 'include' })
        ]);

        const userData = await userRes.json();
        const spacesData = await spacesRes.json();

        if (userData.success) {
          setUser(userData.user);
        } else {
          router.push('/auth');
          return;
        }

        if (spacesData.success) {
          setSpaces(spacesData.spaces || []);
        }

        // Fetch document to get title and type
        const docRes = await fetch(`/api/spaces/${slug}/documents/${documentId}`, {
          credentials: 'include'
        });
        const docData = await docRes.json();
        if (docData.success && docData.document) {
          setDocument(docData.document);
          setDocumentTitle(docData.document.title || 'Document');
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load page data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, slug, documentId]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleCreateSpace = () => {
    // Not applicable on document page
  };

  const handleRefreshSpaces = async () => {
    const res = await fetch('/api/spaces', { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setSpaces(data.spaces || []);
    }
  };

  const handleSearch = (query: string) => {
    router.push(`/spaces/${slug}/documents?search=${encodeURIComponent(query)}`);
  };

  const handleSpreadsheetSave = async (data: any) => {
    const response = await fetch(`/api/spaces/${slug}/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: documentTitle,
        content: JSON.stringify(data),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save');
    }
  };

  const currentSpace = spaces.find((s) => s.slug === slug);
  const spaceName = currentSpace?.name || slug;

  if (loading || !user) {
    return <Loading />;
  }

  if (error) {
    return (
      <NotionLayout
        spaces={spaces}
        user={user}
        onLogout={handleLogout}
        onCreateSpace={handleCreateSpace}
        onRefreshSpaces={handleRefreshSpaces}
        pageTitle="Document Editor"
        showSearch={true}
        onSearch={handleSearch}
        breadcrumbs={[
          { name: 'Spaces', href: '/' },
          { name: spaceName, href: `/spaces/${slug}` },
          { name: 'Documents', href: `/spaces/${slug}/documents` },
          { name: documentTitle }
        ]}
      >
        <div className="flex items-center justify-center h-full">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </NotionLayout>
    );
  }

  // Render spreadsheet editor for SPREADSHEET type
  if (document?.type === 'SPREADSHEET') {
    let initialData;
    try {
      initialData = document.content ? JSON.parse(document.content) : undefined;
    } catch {
      initialData = undefined;
    }

    return (
      <NotionLayout
        spaces={spaces}
        user={user}
        onLogout={handleLogout}
        onCreateSpace={handleCreateSpace}
        onRefreshSpaces={handleRefreshSpaces}
        pageTitle={documentTitle}
        hideTitle={true}
        showSearch={true}
        onSearch={handleSearch}
        breadcrumbs={[
          { name: 'Spaces', href: '/' },
          { name: spaceName, href: `/spaces/${slug}` },
          { name: 'Documents', href: `/spaces/${slug}/documents` },
          { name: documentTitle }
        ]}
      >
        <SpreadsheetEditor
          documentId={documentId}
          spaceSlug={slug}
          initialData={initialData}
          title={documentTitle}
          onTitleChange={setDocumentTitle}
          onSave={handleSpreadsheetSave}
        />
      </NotionLayout>
    );
  }

  // Default: Rich text document editor
  return (
    <NotionLayout
      spaces={spaces}
      user={user}
      onLogout={handleLogout}
      onCreateSpace={handleCreateSpace}
      onRefreshSpaces={handleRefreshSpaces}
      pageTitle={documentTitle}
      hideTitle={true}
      showSearch={true}
      onSearch={handleSearch}
      breadcrumbs={[
        { name: 'Spaces', href: '/' },
        { name: spaceName, href: `/spaces/${slug}` },
        { name: 'Documents', href: `/spaces/${slug}?tab=documents` },
        { name: documentTitle }
      ]}
    >
      <DocumentEditorPage
        spaceSlug={slug}
        documentId={documentId}
        onClose={() => router.push(`/spaces/${slug}/documents`)}
        onTitleChange={setDocumentTitle}
      />
    </NotionLayout>
  );
}
