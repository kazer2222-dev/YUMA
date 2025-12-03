'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Lock, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface DocumentPermissionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId: string;
    spaceSlug: string;
}

interface AccessEntry {
    id: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    role: string;
    grantedBy: string;
    createdAt: string;
}

const ROLE_OPTIONS = [
    { value: 'OWNER', label: 'Owner', description: 'Full control' },
    { value: 'ADMIN', label: 'Admin', description: 'Can manage permissions' },
    { value: 'EDIT', label: 'Can edit', description: 'Can edit content' },
    { value: 'COMMENT', label: 'Can comment', description: 'Can add comments' },
    { value: 'VIEW', label: 'Can view', description: 'Read-only access' },
    { value: 'RESTRICTED', label: 'Restricted', description: 'No access' },
];

export function DocumentPermissionsDialog({
    open,
    onOpenChange,
    documentId,
    spaceSlug,
}: DocumentPermissionsDialogProps) {
    const [accessList, setAccessList] = useState<AccessEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState('VIEW');

    useEffect(() => {
        if (open) {
            fetchAccessList();
        }
    }, [open, documentId]);

    const fetchAccessList = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/spaces/${spaceSlug}/documents/${documentId}/access`,
                { credentials: 'include' }
            );
            const data = await response.json();
            if (data.success) {
                setAccessList(data.access || []);
            }
        } catch (error) {
            console.error('Failed to fetch access list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!newUserEmail.trim()) return;

        try {
            const response = await fetch(
                `/api/spaces/${spaceSlug}/documents/${documentId}/access`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        email: newUserEmail,
                        role: newUserRole,
                    }),
                }
            );

            const data = await response.json();
            if (data.success) {
                setNewUserEmail('');
                setNewUserRole('VIEW');
                await fetchAccessList();
            }
        } catch (error) {
            console.error('Failed to add user:', error);
        }
    };

    const handleUpdateRole = async (accessId: string, newRole: string) => {
        try {
            const response = await fetch(
                `/api/spaces/${spaceSlug}/documents/${documentId}/access/${accessId}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ role: newRole }),
                }
            );

            const data = await response.json();
            if (data.success) {
                await fetchAccessList();
            }
        } catch (error) {
            console.error('Failed to update role:', error);
        }
    };

    const handleRemoveAccess = async (accessId: string) => {
        try {
            const response = await fetch(
                `/api/spaces/${spaceSlug}/documents/${documentId}/access/${accessId}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                }
            );

            const data = await response.json();
            if (data.success) {
                await fetchAccessList();
            }
        } catch (error) {
            console.error('Failed to remove access:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Document Permissions
                    </DialogTitle>
                    <DialogDescription>
                        Manage who can access this document and what they can do.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Add User Section */}
                    <div className="border rounded-lg p-4 space-y-3">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Add People
                        </h3>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter email address"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddUser();
                                    }
                                }}
                                className="flex-1"
                            />
                            <Select value={newUserRole} onValueChange={setNewUserRole}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLE_OPTIONS.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAddUser} size="sm">
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                            </Button>
                        </div>
                    </div>

                    {/* Access List */}
                    <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Loading permissions...
                            </div>
                        ) : accessList.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No specific permissions set</p>
                                <p className="text-xs mt-1">
                                    All space members can access this document
                                </p>
                            </div>
                        ) : (
                            accessList.map((access) => (
                                <div
                                    key={access.id}
                                    className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {access.userName || 'Unknown User'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {access.userEmail}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={access.role}
                                            onValueChange={(newRole) =>
                                                handleUpdateRole(access.id, newRole)
                                            }
                                        >
                                            <SelectTrigger className="w-36">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ROLE_OPTIONS.map((role) => (
                                                    <SelectItem key={role.value} value={role.value}>
                                                        <div>
                                                            <div className="font-medium">{role.label}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {role.description}
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveAccess(access.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
