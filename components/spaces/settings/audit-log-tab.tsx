'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToastHelpers } from '@/components/toast';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
    id: string;
    action: string;
    targetId: string | null;
    metadata: Record<string, any> | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
    };
}

interface AuditLogTabProps {
    spaceSlug: string;
}

const ACTION_LABELS: Record<string, string> = {
    MEMBER_ADDED: 'Added Member',
    MEMBER_REMOVED: 'Removed Member',
    ROLE_CHANGED: 'Changed Role',
    ROLE_CREATED: 'Created Role',
    ROLE_UPDATED: 'Updated Role',
    ROLE_DELETED: 'Deleted Role',
    PERMISSIONS_UPDATED: 'Updated Permissions',
    INVITATION_SENT: 'Sent Invitation',
};

export function AuditLogTab({ spaceSlug }: AuditLogTabProps) {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionFilter, setActionFilter] = useState<string>('all');
    const { error: showError } = useToastHelpers();

    useEffect(() => {
        fetchLogs();
    }, [spaceSlug, page, actionFilter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(actionFilter !== 'all' && { action: actionFilter }),
            });

            const response = await fetch(`/api/spaces/${spaceSlug}/audit?${params}`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setLogs(data.logs);
                setTotalPages(data.pagination.totalPages);
            } else {
                showError('Error', data.message || 'Failed to load audit log');
            }
        } catch (error) {
            showError('Error', 'Failed to load audit log');
        } finally {
            setLoading(false);
        }
    };

    const getActionLabel = (action: string) => {
        return ACTION_LABELS[action] || action;
    };

    const getActionBadgeVariant = (action: string) => {
        if (action.includes('DELETE') || action.includes('REMOVED')) return 'destructive';
        if (action.includes('CREATE') || action.includes('ADDED')) return 'default';
        if (action.includes('UPDATE') || action.includes('CHANGED')) return 'secondary';
        return 'outline';
    };

    const renderMetadata = (metadata: Record<string, any> | null) => {
        if (!metadata) return null;

        return (
            <div className="text-xs text-muted-foreground mt-1">
                {Object.entries(metadata).map(([key, value]) => (
                    <span key={key} className="mr-2">
                        {key}: <span className="font-medium">{String(value)}</span>
                    </span>
                ))}
            </div>
        );
    };

    if (loading && page === 1) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Audit Log</h3>
                    <p className="text-sm text-muted-foreground">
                        Track all permission and membership changes
                    </p>
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="MEMBER_ADDED">Member Added</SelectItem>
                        <SelectItem value="MEMBER_REMOVED">Member Removed</SelectItem>
                        <SelectItem value="ROLE_CHANGED">Role Changed</SelectItem>
                        <SelectItem value="ROLE_CREATED">Role Created</SelectItem>
                        <SelectItem value="PERMISSIONS_UPDATED">Permissions Updated</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No audit logs found
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="w-7 h-7">
                                                <AvatarImage src={log.user.avatar || undefined} />
                                                <AvatarFallback>
                                                    {log.user.name?.[0] || log.user.email[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {log.user.name || log.user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getActionBadgeVariant(log.action) as any}>
                                            {getActionLabel(log.action)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        {renderMetadata(log.metadata)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                        {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
