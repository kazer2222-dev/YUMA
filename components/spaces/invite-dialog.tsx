'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToastHelpers } from '@/components/toast';
import { Loader2, Mail } from 'lucide-react';

interface Role {
    id: string;
    name: string;
    description: string | null;
}

interface InviteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spaceSlug: string;
    onSuccess: () => void;
}

export function InviteDialog({
    open,
    onOpenChange,
    spaceSlug,
    onSuccess,
}: InviteDialogProps) {
    const [email, setEmail] = useState('');
    const [roleId, setRoleId] = useState('');
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const { success, error: showError } = useToastHelpers();

    useEffect(() => {
        if (open) {
            fetchRoles();
        }
    }, [open, spaceSlug]);

    const fetchRoles = async () => {
        try {
            setLoadingRoles(true);
            const response = await fetch(`/api/spaces/${spaceSlug}/roles`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setRoles(data.roles);
                // Set default role to "Member"
                const memberRole = data.roles.find((r: Role) => r.name === 'Member');
                if (memberRole) {
                    setRoleId(memberRole.id);
                }
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
        } finally {
            setLoadingRoles(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !roleId) {
            showError('Error', 'Please fill in all fields');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`/api/spaces/${spaceSlug}/invitations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, roleId }),
            });

            const data = await response.json();

            if (data.success) {
                success('Success', `Invitation sent to ${email}`);
                setEmail('');
                onSuccess();
                onOpenChange(false);
            } else {
                showError('Error', data.message || 'Failed to send invitation');
            }
        } catch (error) {
            showError('Error', 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite People</DialogTitle>
                    <DialogDescription>
                        Send an invitation to join this space
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={roleId} onValueChange={setRoleId} disabled={loadingRoles}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            <div>
                                                <div className="font-medium">{role.name}</div>
                                                {role.description && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {role.description}
                                                    </div>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                        <Button type="submit" disabled={loading || !email || !roleId}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
