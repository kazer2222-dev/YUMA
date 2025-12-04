'use client';

import { ClickUpAppShell } from '@/components/layout/clickup-app-shell';
import { SpacesPageContent } from '@/components/spaces/spaces-page-content';
import { useUser, useSpaces, useRefreshSpaces } from '@/lib/hooks/use-spaces';
import { Loading } from '@/components/loading';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SpacesPage() {
    const router = useRouter();
    const { data: user, isLoading: userLoading } = useUser();
    const { data: spaces, isLoading: spacesLoading } = useSpaces();
    const refreshSpaces = useRefreshSpaces();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, userLoading, router]);

    if (userLoading || spacesLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loading />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    // Transform spaces for LayoutSpace type (ClickUpAppShell expects this)
    const layoutSpaces = spaces?.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        ticker: s.ticker || '',
        description: s.description,
        memberCount: s.memberCount,
        taskCount: s.taskCount,
        boards: s.boards || []
    })) || [];

    return (
        <ClickUpAppShell
            spaces={layoutSpaces}
            user={{
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: undefined
            }}
            onLogout={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/auth/login');
            }}
            onRefreshSpaces={refreshSpaces}
            pageTitle="Spaces"
            hideTitle={true}
            showSearch={true}
        >
            <SpacesPageContent spaces={spaces || []} onRefresh={refreshSpaces} />
        </ClickUpAppShell>
    );
}
