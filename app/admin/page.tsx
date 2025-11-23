'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { NotionLayout } from '@/components/layout/notion-layout';
import { Loading } from '@/components/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Home } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check authentication
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();

        if (!userData.success) {
          router.push('/auth');
          return;
        }

        setUser(userData.user);

        // Check admin status from user data
        if (userData.user.isAdmin) {
          setIsAdmin(true);
        } else {
          setError('Admin access required. You do not have permission to access this page.');
        }
      } catch (err) {
        console.error('Failed to check admin access:', err);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Checking admin access..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm underline"
            >
              Go to Dashboard
            </button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <NotionLayout
      spaces={[]}
      user={user || { id: '', email: '', name: '' }}
      onLogout={handleLogout}
      onCreateSpace={() => {}}
      pageTitle="Admin Dashboard"
      pageSubtitle="Platform administration and management"
      breadcrumbs={[]}
      actions={[
        {
          label: 'Dashboard',
          onClick: () => router.push('/dashboard'),
          variant: 'secondary',
          icon: Home
        }
      ]}
      showSearch={false}
    >
      <div className="p-8">
        <AdminDashboard />
      </div>
    </NotionLayout>
  );
}
