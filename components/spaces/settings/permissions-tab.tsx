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
import { Checkbox } from '@/components/ui/checkbox';
import { useToastHelpers } from '@/components/toast';
import { Loader2, Save } from 'lucide-react';
import { PERMISSION_METADATA, getPermissionsByCategory, type PermissionKey } from '@/lib/constants/permissions';

interface Role {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
}

interface Permission {
    id: string;
    roleId: string;
    permissionKey: string;
    granted: boolean;
}

interface PermissionsTabProps {
    spaceSlug: string;
}

export function PermissionsTab({ spaceSlug }: PermissionsTabProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const { success, error: showError } = useToastHelpers();

    const permissionsByCategory = getPermissionsByCategory();

    useEffect(() => {
        fetchData();
    }, [spaceSlug]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch roles
            const rolesResponse = await fetch(`/api/spaces/${spaceSlug}/roles`, {
                credentials: 'include',
            });
            const rolesData = await rolesResponse.json();

            if (!rolesData.success) {
                throw new Error('Failed to load roles');
            }

            setRoles(rolesData.roles);

            // Fetch permissions for each role
            const permissionsMap: Record<string, Permission[]> = {};

            for (const role of rolesData.roles) {
                const permResponse = await fetch(
                    `/api/spaces/${spaceSlug}/roles/${role.id}/permissions`,
                    { credentials: 'include' }
                );
                const permData = await permResponse.json();

                if (permData.success) {
                    permissionsMap[role.id] = permData.permissions;
                }
            }

            setPermissions(permissionsMap);
        } catch (error) {
            showError('Error', 'Failed to load permissions');
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (roleId: string, permissionKey: PermissionKey): boolean => {
        const rolePerms = permissions[roleId] || [];
        const perm = rolePerms.find((p) => p.permissionKey === permissionKey);
        return perm?.granted || false;
    };

    const togglePermission = (roleId: string, permissionKey: PermissionKey) => {
        setPermissions((prev) => {
            const rolePerms = prev[roleId] || [];
            const existingPerm = rolePerms.find((p) => p.permissionKey === permissionKey);

            const newRolePerms = existingPerm
                ? rolePerms.map((p) =>
                    p.permissionKey === permissionKey ? { ...p, granted: !p.granted } : p
                )
                : [
                    ...rolePerms,
                    {
                        id: `temp-${Date.now()}`,
                        roleId,
                        permissionKey,
                        granted: true,
                    },
                ];

            return {
                ...prev,
                [roleId]: newRolePerms,
            };
        });

        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            for (const role of roles) {
                const rolePerms = permissions[role.id] || [];

                const response = await fetch(
                    `/api/spaces/${spaceSlug}/roles/${role.id}/permissions`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            permissions: rolePerms.map((p) => ({
                                permissionKey: p.permissionKey,
                                granted: p.granted,
                            })),
                        }),
                    }
                );

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || 'Failed to update permissions');
                }
            }

            success('Success', 'Permissions updated');

            setHasChanges(false);
            fetchData();
        } catch (error: any) {
            showError('Error', error.message || 'Failed to save permissions');
        } finally {
            setSaving(false);
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
                    <h3 className="text-lg font-semibold">Permission Matrix</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure what each role can do
                    </p>
                </div>
                {hasChanges && (
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Changes
                    </Button>
                )}
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px] sticky left-0 bg-background">
                                Permission
                            </TableHead>
                            {roles.map((role) => (
                                <TableHead key={role.id} className="text-center min-w-[120px]">
                                    <div className="font-semibold">{role.name}</div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(permissionsByCategory).map(([category, perms]) => (
                            <>
                                <TableRow key={`category-${category}`} className="bg-muted/50">
                                    <TableCell
                                        colSpan={roles.length + 1}
                                        className="font-semibold sticky left-0"
                                    >
                                        {category}
                                    </TableCell>
                                </TableRow>
                                {perms.map(({ key, metadata }) => (
                                    <TableRow key={key}>
                                        <TableCell className="sticky left-0 bg-background">
                                            <div>
                                                <div className="font-medium text-sm">{metadata.label}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {metadata.description}
                                                </div>
                                            </div>
                                        </TableCell>
                                        {roles.map((role) => (
                                            <TableCell key={role.id} className="text-center">
                                                <div className="flex justify-center">
                                                    <Checkbox
                                                        checked={hasPermission(role.id, key)}
                                                        onCheckedChange={() => togglePermission(role.id, key)}
                                                        disabled={role.isSystem && role.name === 'Space Admin'}
                                                    />
                                                </div>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
