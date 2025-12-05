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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Plus, Search, Loader2, Users, UserPlus, X, Check } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

interface Role {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
}

interface GroupMember {
    id: string;
    userId: string;
    user: User;
    addedAt: string;
}

interface GroupDetail {
    id: string;
    name: string;
    description: string | null;
    role: Role | null;
    members: GroupMember[];
}

interface Group {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    _count: {
        members: number;
    };
    role: Role | null;
}

interface SpaceMember {
    id: string;
    userId: string;
    user: User;
}

interface GroupsTabProps {
    spaceSlug: string;
}

export function GroupsTab({ spaceSlug }: GroupsTabProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [spaceMembers, setSpaceMembers] = useState<SpaceMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
    const [managingGroup, setManagingGroup] = useState<GroupDetail | null>(null);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const { success, error: showError } = useToastHelpers();

    // Form state
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupRoleId, setNewGroupRoleId] = useState<string>('');
    const [creating, setCreating] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');

    useEffect(() => {
        fetchGroups();
        fetchRoles();
        fetchSpaceMembers();
    }, [spaceSlug]);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/spaces/${spaceSlug}/groups`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setGroups(data.groups);
            } else {
                showError('Error', data.message || 'Failed to load groups');
            }
        } catch (err) {
            showError('Error', 'Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await fetch(`/api/spaces/${spaceSlug}/roles`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setRoles(data.roles);
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
        }
    };

    const fetchSpaceMembers = async () => {
        try {
            const response = await fetch(`/api/spaces/${spaceSlug}/members`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setSpaceMembers(data.members);
            }
        } catch (err) {
            console.error('Error fetching space members:', err);
        }
    };

    const fetchGroupDetail = async (groupId: string) => {
        try {
            setLoadingMembers(true);
            const response = await fetch(`/api/spaces/${spaceSlug}/groups/${groupId}`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setManagingGroup(data.group);
                // Pre-select existing members
                setSelectedUserIds(data.group.members.map((m: GroupMember) => m.userId));
            } else {
                showError('Error', data.message || 'Failed to load group details');
            }
        } catch (err) {
            showError('Error', 'Failed to load group details');
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        try {
            setCreating(true);
            const response = await fetch(`/api/spaces/${spaceSlug}/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: newGroupName,
                    description: newGroupDescription,
                    roleId: newGroupRoleId || undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                success('Success', 'Group created successfully');
                setIsCreateDialogOpen(false);
                setNewGroupName('');
                setNewGroupDescription('');
                setNewGroupRoleId('');
                fetchGroups();
            } else {
                showError('Error', data.message || 'Failed to create group');
            }
        } catch (err) {
            showError('Error', 'Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    const handleManageMembers = async (group: Group) => {
        setMemberSearchQuery('');
        setIsMembersDialogOpen(true);
        await fetchGroupDetail(group.id);
    };

    const handleUpdateGroupRole = async (groupId: string, roleId: string | null) => {
        try {
            const response = await fetch(`/api/spaces/${spaceSlug}/groups/${groupId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ roleId }),
            });

            const data = await response.json();

            if (data.success) {
                success('Success', 'Role updated');
                fetchGroups();
            } else {
                showError('Error', data.message || 'Failed to update role');
            }
        } catch (err) {
            showError('Error', 'Failed to update role');
        }
    };

    const handleSaveMembers = async () => {
        if (!managingGroup) return;

        try {
            setSaving(true);

            // Get current member user IDs
            const currentMemberIds = managingGroup.members.map(m => m.userId);

            // Find users to add (in selectedUserIds but not in current)
            const toAdd = selectedUserIds.filter(id => !currentMemberIds.includes(id));

            // Find users to remove (in current but not in selectedUserIds)
            const toRemove = currentMemberIds.filter(id => !selectedUserIds.includes(id));

            // Add new members
            for (const userId of toAdd) {
                await fetch(`/api/spaces/${spaceSlug}/groups/${managingGroup.id}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ userId }),
                });
            }

            // Remove members
            for (const userId of toRemove) {
                await fetch(`/api/spaces/${spaceSlug}/groups/${managingGroup.id}/members?userId=${userId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
            }

            success('Success', 'Members updated successfully');
            setIsMembersDialogOpen(false);
            setManagingGroup(null);
            setSelectedUserIds([]);
            fetchGroups();
        } catch (err) {
            showError('Error', 'Failed to update members');
        } finally {
            setSaving(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleDeleteGroup = async (groupId: string, groupName: string) => {
        if (!confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/spaces/${spaceSlug}/groups/${groupId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (data.success) {
                success('Success', 'Group deleted successfully');
                fetchGroups();
            } else {
                showError('Error', data.message || 'Failed to delete group');
            }
        } catch (err) {
            showError('Error', 'Failed to delete group');
        }
    };

    const filteredGroups = groups.filter((group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter available members for the dialog
    const filteredSpaceMembers = spaceMembers.filter((member) => {
        const name = member.user.name?.toLowerCase() || '';
        const email = member.user.email.toLowerCase();
        const query = memberSearchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
    });

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
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9"
                    />
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create User Group</DialogTitle>
                            <DialogDescription>
                                Create a group to organize members and assign roles efficiently.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Group Name</Label>
                                <Input
                                    id="name"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="e.g. Frontend Team"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                    placeholder="Optional description..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role (Optional)</Label>
                                <Select value={newGroupRoleId} onValueChange={setNewGroupRoleId}>
                                    <SelectTrigger>
                                        {newGroupRoleId ? (
                                            <span>{roles.find(r => r.id === newGroupRoleId)?.name}</span>
                                        ) : (
                                            <span className="text-muted-foreground">Select a role...</span>
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Members of this group will inherit permissions from the selected role.
                                </p>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={creating}>
                                    {creating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Group'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Manage Members Dialog */}
            <Dialog open={isMembersDialogOpen} onOpenChange={(open) => {
                setIsMembersDialogOpen(open);
                if (!open) {
                    setManagingGroup(null);
                    setSelectedUserIds([]);
                    setMemberSearchQuery('');
                }
            }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Manage Members - {managingGroup?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Select the users you want to add to this group.
                        </DialogDescription>
                    </DialogHeader>

                    {loadingMembers ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Selected members list */}
                            <div className="space-y-2">
                                <Label>{selectedUserIds.length} member{selectedUserIds.length !== 1 ? 's' : ''} selected</Label>
                                {selectedUserIds.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/20 max-h-32 overflow-auto">
                                        {selectedUserIds.map((userId) => {
                                            const member = spaceMembers.find(m => m.userId === userId);
                                            if (!member) return null;
                                            return (
                                                <div
                                                    key={userId}
                                                    className="flex items-center gap-1.5 bg-background border rounded-full pl-1 pr-2 py-1 text-sm"
                                                >
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={member.user.avatar || undefined} />
                                                        <AvatarFallback className="text-xs">
                                                            {(member.user.name || member.user.email)[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="truncate max-w-[100px]">
                                                        {member.user.name || member.user.email.split('@')[0]}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleUserSelection(userId);
                                                        }}
                                                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                                                    >
                                                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-3 border rounded-md bg-muted/20 text-sm text-muted-foreground text-center">
                                        No members selected
                                    </div>
                                )}
                            </div>

                            {/* Search with suggestions dropdown */}
                            <div className="relative">
                                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                                    <Search className="w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search members to add..."
                                        value={memberSearchQuery}
                                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                                        className="h-7 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    />
                                </div>

                                {/* Suggestions dropdown - only show when there's a search query */}
                                {memberSearchQuery.trim() && (
                                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                                        {filteredSpaceMembers.filter(m => !selectedUserIds.includes(m.userId)).length === 0 ? (
                                            <div className="p-3 text-center text-muted-foreground text-sm">
                                                No matching members found
                                            </div>
                                        ) : (
                                            filteredSpaceMembers
                                                .filter(m => !selectedUserIds.includes(m.userId))
                                                .map((member) => (
                                                    <div
                                                        key={member.userId}
                                                        className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted transition-colors"
                                                        onClick={() => {
                                                            toggleUserSelection(member.userId);
                                                            setMemberSearchQuery('');
                                                        }}
                                                    >
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarImage src={member.user.avatar || undefined} />
                                                            <AvatarFallback className="text-xs">
                                                                {(member.user.name || member.user.email)[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-sm truncate">
                                                                {member.user.name || 'Unnamed'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground truncate">
                                                                {member.user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsMembersDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveMembers} disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Group Name</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredGroups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    {searchQuery ? 'No groups found' : 'No groups created yet'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredGroups.map((group) => (
                                <TableRow key={group.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                {group.name}
                                            </div>
                                            {group.description && (
                                                <div className="text-sm text-muted-foreground pl-6">
                                                    {group.description}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-secondary/80"
                                            onClick={() => handleManageMembers(group)}
                                        >
                                            {group._count.members} members
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {/* Inline role dropdown */}
                                        <Select
                                            value={group.role?.id || ''}
                                            onValueChange={(value) => handleUpdateGroupRole(group.id, value || null)}
                                        >
                                            <SelectTrigger className="w-[140px] h-8">
                                                {group.role ? (
                                                    <span className="text-sm">{group.role.name}</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">Select role</span>
                                                )}
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(group.createdAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleManageMembers(group)}>
                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                    Manage Members
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteGroup(group.id, group.name)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    Delete Group
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
