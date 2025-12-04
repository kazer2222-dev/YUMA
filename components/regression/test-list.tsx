'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, AlertCircle } from 'lucide-react';

interface Test {
    id: string;
    name: string;
    module: string | null;
    score: number;
    lastExecutedRelease?: {
        version: string;
    };
}

interface TestListProps {
    tests: Test[];
    isLoading: boolean;
}

export function TestList({ tests, isLoading }: TestListProps) {
    if (isLoading) {
        return <div>Loading tests...</div>;
    }

    if (tests.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                No tests found. Create one to get started.
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-red-500 font-bold';
        if (score >= 50) return 'text-yellow-500 font-bold';
        return 'text-green-500 font-bold';
    };

    return (
        <div className="space-y-4">
            {tests.map((test) => (
                <Card key={test.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{test.name}</span>
                                {test.module && <Badge variant="outline">{test.module}</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Last executed: {test.lastExecutedRelease?.version || 'Never'}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Priority</div>
                                <div className={`text-xl ${getScoreColor(test.score)}`}>
                                    {test.score.toFixed(1)}
                                </div>
                            </div>

                            <Button size="sm" variant="ghost">
                                <Play className="w-4 h-4 mr-2" />
                                Run
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
