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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, UserPlus, Search, Loader2, Users } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';
import { format } from 'date-fns';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface GroupRole {
    groupName: string;
    roleName: string;
    roleId: string;
}

interface Member {
    id: string;
    userId: string;
    addedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
    };
    role: {
        id: string;
        name: string;
        description: string | null;
        isDefault: boolean;
    };
    groupRoles: GroupRole[];
    adder: {
        id: string;
        name: string | null;
        email: string;
    } | null;
}

interface Role {
    id: string;
    name: string;
    description: string | null;
}

interface PeopleTabProps {
    spaceSlug: string;
    onInvite: () => void;
}

export function PeopleTab({ spaceSlug, onInvite }: PeopleTabProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { success, error: showError } = useToastHelpers();

    useEffect(() => {
        fetchMembers();
        fetchRoles();
    }, [spaceSlug]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/spaces/${spaceSlug}/members`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setMembers(data.members);
            } else {
                showError('Error', data.message || 'Failed to load members');
            }
        } catch (err) {
            showError('Error', 'Failed to load members');
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
            console.error('Failed to load roles:', err);
        }
    };

    const handleChangeRole = async (memberId: string, newRoleId: string) => {
        try {
            const response = await fetch(`/api/spaces/${spaceSlug}/members/${memberId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ roleId: newRoleId }),
            });

            const data = await response.json();

            if (data.success) {
                success('Success', 'Member role updated');
                fetchMembers();
            } else {
                showError('Error', data.message || 'Failed to update role');
            }
        } catch (err) {
            showError('Error', 'Failed to update role');
        }
    };

    const handleRemoveMember = async (memberId: string, userName: string) => {
        if (!confirm(`Remove ${userName} from this space?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/spaces/${spaceSlug}/members/${memberId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (data.success) {
                success('Success', 'Member removed');
                fetchMembers();
            } else {
                showError('Error', data.message || 'Failed to remove member');
            }
        } catch (err) {
            showError('Error', 'Failed to remove member');
        }
    };

    const filteredMembers = members.filter((member) =>
        member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9"
                    />
                </div>
                <Button onClick={onInvite} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Invite People
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Group Roles</TableHead>
                            <TableHead>Added</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    {searchQuery ? 'No members found' : 'No members yet'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMembers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={member.user.avatar || undefined} />
                                                <AvatarFallback>
                                                    {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">
                                                    {member.user.name || member.user.email}
                                                </div>
                                                {member.user.name && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {member.user.email}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {/* Inline role dropdown */}
                                        <Select
                                            value={member.role.id}
                                            onValueChange={(value) => handleChangeRole(member.id, value)}
                                        >
                                            <SelectTrigger className="w-[140px] h-8">
                                                <span className="text-sm">{member.role.name}</span>
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
                                    <TableCell>
                                        {/* Group roles - grouped by role name */}
                                        <div className="flex flex-wrap gap-1">
                                            {member.groupRoles && member.groupRoles.length > 0 ? (
                                                <>
                                                    {Object.entries(
                                                        member.groupRoles.reduce((acc, gr) => {
                                                            if (!acc[gr.roleName]) {
                                                                acc[gr.roleName] = [];
                                                            }
                                                            acc[gr.roleName].push(gr.groupName);
                                                            return acc;
                                                        }, {} as Record<string, string[]>)
                                                    ).map(([roleName, groupNames]) => (
                                                        <div key={roleName} className="relative group/tooltip">
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 cursor-help"
                                                            >
                                                                <Users className="w-3 h-3 mr-1" />
                                                                {roleName}
                                                            </Badge>
                                                            {/* Custom CSS tooltip */}
                                                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block z-50">
                                                                <div className="bg-popover text-popover-foreground text-xs rounded-md border shadow-md px-2 py-1.5 whitespace-nowrap">
                                                                    {groupNames.join(', ')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(member.addedAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => handleRemoveMember(member.id, member.user.name || member.user.email)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    Remove from Space
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

            <div className="text-sm text-muted-foreground">
                {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
            </div>
        </div>
    );
}
