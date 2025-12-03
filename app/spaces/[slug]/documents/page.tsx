'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DocumentsPage } from '@/components/documents/documents-page';
import { NotionLayout } from '@/components/layout/notion-layout';
import { Loading } from '@/components/loading';

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

export default function SpaceDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleCreateSpace = () => {
    // Implement if needed or pass empty
  };

  const handleRefreshSpaces = async () => {
    const res = await fetch('/api/spaces', { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setSpaces(data.spaces || []);
    }
  };

  const currentSpace = spaces.find((s) => s.slug === slug);
  const spaceName = currentSpace?.name || slug;

  if (loading || !user) {
    return <Loading />;
  }

  return (
    <NotionLayout
      spaces={spaces}
      user={user}
      onLogout={handleLogout}
      onCreateSpace={handleCreateSpace}
      onRefreshSpaces={handleRefreshSpaces}
      pageTitle="Documents"
      showSearch={true}
      breadcrumbs={[
        { name: 'Spaces', href: '/' },
        { name: spaceName, href: `/spaces/${slug}` },
        { name: 'Documents' }
      ]}
    >
      <DocumentsPage showSidebar={false} />
    </NotionLayout>
  );
}


