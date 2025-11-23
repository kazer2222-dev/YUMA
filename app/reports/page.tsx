'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReportingDashboard } from '@/components/reports/reporting-dashboard';
import { NotionLayout } from '@/components/layout/notion-layout';
import { Loading } from '@/components/loading';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Space {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  taskCount: number;
}

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
        router.push('/auth');
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading reports..." />
      </div>
    );
  }

  return (
    <NotionLayout
      spaces={spaces}
      user={user}
      onLogout={handleLogout}
      onCreateSpace={() => {}}
      pageTitle="Reports"
      pageSubtitle="Analytics and insights across all spaces"
      breadcrumbs={[]}
    >
      <div className="p-8">
        <ReportingDashboard />
      </div>
    </NotionLayout>
  );
}
