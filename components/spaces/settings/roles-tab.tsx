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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToastHelpers } from '@/components/toast';
import { Plus, MoreHorizontal, Shield, Loader2, Users } from 'lucide-react';

interface Role {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    isSystem: boolean;
    createdAt: string;
    _count?: {
        members: number;
        permissions: number;
    };
}

interface RolesTabProps {
    spaceSlug: string;
}

export function RolesTab({ spaceSlug }: RolesTabProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const { success, error: showError } = useToastHelpers();

    useEffect(() => {
        fetchRoles();
    }, [spaceSlug]);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/spaces/${spaceSlug}/roles`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setRoles(data.roles);
            } else {
                showError('Error', data.message || 'Failed to load roles');
            }
        } catch (error) {
            showError('Error', 'Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRole = async (roleId: string, roleName: string) => {
        if (!confirm(`Delete role "${roleName}"? This cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/spaces/${spaceSlug}/roles/${roleId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (data.success) {
                success('Success', 'Role deleted');
                fetchRoles();
            } else {
                showError('Error', data.message || 'Failed to delete role');
            }
        } catch (error) {
            showError('Error', 'Failed to delete role');
        }
    };

    if (loading) {
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
                    <h3 className="text-lg font-semibold">Roles</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage custom roles and their permissions
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Role
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No roles found
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{role.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <span className="text-sm text-muted-foreground line-clamp-2">
                                            {role.description || '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Users className="w-3.5 h-3.5" />
                                            {role._count?.members || 0}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {role.isSystem ? (
                                            <Badge>System</Badge>
                                        ) : role.isDefault ? (
                                            <Badge variant="secondary">Default</Badge>
                                        ) : (
                                            <Badge variant="outline">Custom</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingRole(role)}>
                                                    Edit Details
                                                </DropdownMenuItem>
                                                {!role.isSystem && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteRole(role.id, role.name)}
                                                        className="text-red-600 focus:text-red-600"
                                                        disabled={role._count && role._count.members > 0}
                                                    >
                                                        {role._count && role._count.members > 0
                                                            ? `Cannot delete (${role._count.members} members)`
                                                            : 'Delete Role'}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <RoleDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                spaceSlug={spaceSlug}
                onSuccess={fetchRoles}
            />

            <RoleDialog
                open={!!editingRole}
                onOpenChange={(open) => !open && setEditingRole(null)}
                spaceSlug={spaceSlug}
                role={editingRole || undefined}
                onSuccess={() => {
                    fetchRoles();
                    setEditingRole(null);
                }}
            />
        </div>
    );
}

interface RoleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spaceSlug: string;
    role?: Role;
    onSuccess: () => void;
}

function RoleDialog({ open, onOpenChange, spaceSlug, role, onSuccess }: RoleDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { success, error: showError } = useToastHelpers();

    useEffect(() => {
        if (role) {
            setName(role.name);
            setDescription(role.description || '');
        } else {
            setName('');
            setDescription('');
        }
    }, [role, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            showError('Error', 'Role name is required');
            return;
        }

        try {
            setLoading(true);

            const url = role
                ? `/api/spaces/${spaceSlug}/roles/${role.id}`
                : `/api/spaces/${spaceSlug}/roles`;

            const response = await fetch(url, {
                method: role ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, description }),
            });

            const data = await response.json();

            if (data.success) {
                success('Success', role ? 'Role updated' : 'Role created');
                onSuccess();
                onOpenChange(false);
            } else {
                showError('Error', data.message || `Failed to ${role ? 'update' : 'create'} role`);
            }
        } catch (error) {
            showError('Error', `Failed to ${role ? 'update' : 'create'} role`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{role ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                    <DialogDescription>
                        {role ? 'Update role details' : 'Create a custom role with specific permissions'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="role-name">Role Name</Label>
                            <Input
                                id="role-name"
                                placeholder="e.g., QA Lead, Automation Engineer"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role-description">Description (Optional)</Label>
                            <Textarea
                                id="role-description"
                                placeholder="Describe the purpose and responsibilities of this role"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !name.trim()}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {role ? 'Update' : 'Create'} Role
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
