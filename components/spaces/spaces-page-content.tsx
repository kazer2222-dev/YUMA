'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateSpaceDialog } from './create-space-dialog';
import { Plus, Users, Calendar, CheckSquare, Search, Building2, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Space {
    id: string;
    name: string;
    description?: string;
    slug: string;
    ticker: string;
    timezone: string;
    createdAt: string;
    updatedAt: string;
    memberCount: number;
    taskCount: number;
    members: Array<{
        id: string;
        role: string;
        joinedAt: string;
        user: {
            id: string;
            name?: string;
            email: string;
            avatar?: string;
        };
    }>;
}

interface SpacesPageContentProps {
    spaces: Space[];
    onRefresh?: () => void;
}

export function SpacesPageContent({ spaces, onRefresh }: SpacesPageContentProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const filteredSpaces = spaces.filter(space =>
        space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.ticker?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <div className="relative w-96">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search spaces..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Create New Space Card */}
                <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="h-full min-h-[180px] rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-3 transition-colors group p-6"
                >
                    <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-base font-medium text-muted-foreground group-hover:text-primary">Create New Space</span>
                </button>

                {filteredSpaces.map((space) => (
                    <Card
                        key={space.id}
                        className="group cursor-pointer hover:shadow-md transition-all border-border hover:border-primary/50 flex flex-col"
                        onClick={() => router.push(`/spaces/${space.slug}`)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg group-hover:text-primary transition-colors truncate">
                                            {space.name}
                                        </CardTitle>
                                        {space.description && (
                                            <CardDescription className="mt-1 line-clamp-2">
                                                {space.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 mt-auto">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <span>{space.memberCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CheckSquare className="h-4 w-4" />
                                        <span>{space.taskCount}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1" title={`Created ${new Date(space.createdAt).toLocaleDateString()}`}>
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDistanceToNow(new Date(space.createdAt), { addSuffix: true })}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredSpaces.length === 0 && searchQuery && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No spaces found matching "{searchQuery}"
                    </div>
                )}
            </div>

            <CreateSpaceDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSpaceCreated={onRefresh}
            />
        </div>
    );
}
