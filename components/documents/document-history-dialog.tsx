'use client';

import React, { useState, useEffect } from 'react';
import { History, Clock, User, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface DocumentHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId: string;
    spaceSlug: string;
}

interface Version {
    id: string;
    version: number;
    content?: string;
    changeNote?: string;
    changeSummary?: string;
    label?: string;
    createdBy: string;
    createdAt: string;
}

export function DocumentHistoryDialog({
    open,
    onOpenChange,
    documentId,
    spaceSlug,
}: DocumentHistoryDialogProps) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchVersions();
        }
    }, [open, documentId]);

    const fetchVersions = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/spaces/${spaceSlug}/documents/${documentId}/versions`,
                { credentials: 'include' }
            );
            const data = await response.json();
            if (data.success) {
                setVersions(data.versions || []);
            }
        } catch (error) {
            console.error('Failed to fetch versions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreVersion = async (versionId: string) => {
        if (!confirm('Are you sure you want to restore this version?')) return;

        try {
            const response = await fetch(
                `/api/spaces/${spaceSlug}/documents/${documentId}/versions`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ versionId }),
                }
            );

            const data = await response.json();
            if (data.success) {
                await fetchVersions();
                // Optionally close dialog or show success message
            }
        } catch (error) {
            console.error('Failed to restore version:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Version History
                    </DialogTitle>
                    <DialogDescription>
                        View and restore previous versions of this document.
                    </DialogDescription>
                </DialogHeader>

                <div className="h-[500px] overflow-y-auto pr-4">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Loading version history...
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No version history available</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold">
                                                    Version {version.version}
                                                </span>
                                                {version.label && (
                                                    <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                                        {version.label}
                                                    </span>
                                                )}
                                                {index === 0 && (
                                                    <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-600 rounded">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {version.createdBy}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(version.createdAt)}
                                                </span>
                                            </div>
                                            {version.changeSummary && (
                                                <p className="text-sm text-muted-foreground mb-1">
                                                    {version.changeSummary}
                                                </p>
                                            )}
                                            {version.changeNote && (
                                                <p className="text-sm italic text-muted-foreground">
                                                    "{version.changeNote}"
                                                </p>
                                            )}
                                        </div>
                                        {index !== 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRestoreVersion(version.id)}
                                            >
                                                <RotateCcw className="w-3 h-3 mr-1" />
                                                Restore
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
