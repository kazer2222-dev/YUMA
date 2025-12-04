'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, Plus, Mail, Shield, User, Eye, Trash2 } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';
import { Loading, Skeleton } from '@/components/loading';

interface SpaceMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
}

interface SpaceMembersManagerProps {
  spaceSlug: string;
}

const ROLE_COLORS = {
  OWNER: 'bg-red-500/10 text-red-500 border-red-500/30',
  ADMIN: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  MEMBER: 'bg-green-500/10 text-green-500 border-green-500/30',
  VIEWER: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

const ROLE_ICONS = {
  OWNER: Shield,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye,
};

function getInitials(name?: string, email?: string) {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : 'NA';
}

export function SpaceMembersManager({ spaceSlug }: SpaceMembersManagerProps) {
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [addingMember, setAddingMember] = useState(false);
  const { success, error: showError } = useToastHelpers();

  useEffect(() => {
    fetchMembers();
  }, [spaceSlug]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/spaces/${spaceSlug}/members`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setMembers(data.members || []);
      } else {
        setError(data.message || 'Failed to load members');
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      showError('Email is required', 'Please enter an email address');
      return;
    }

    try {
      setAddingMember(true);
      const response = await fetch(`/api/spaces/${spaceSlug}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          role: newMemberRole,
        }),
      });

      const data = await response.json();
      if (data.success) {
        success('Member added', `${newMemberEmail} has been added to the space`);
        setAddMemberOpen(false);
        setNewMemberEmail('');
        setNewMemberRole('MEMBER');
        fetchMembers();
      } else {
        showError('Failed to add member', data.message || 'Could not add member');
      }
    } catch (err) {
      console.error('Failed to add member:', err);
      showError('Failed to add member', 'An error occurred while adding the member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();
      if (data.success) {
        success('Role updated', 'Member role has been updated');
        fetchMembers();
      } else {
        showError('Failed to update role', data.message || 'Could not update role');
      }
    } catch (err) {
      console.error('Failed to update role:', err);
      showError('Failed to update role', 'An error occurred while updating the role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from this space?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        success('Member removed', `${memberEmail} has been removed from the space`);
        fetchMembers();
      } else {
        showError('Failed to remove member', data.message || 'Could not remove member');
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
      showError('Failed to remove member', 'An error occurred while removing the member');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchMembers} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if current user can manage members (OWNER or ADMIN)
  // This will be determined by the API - if user can add/update members, they have permission
  // For now, we'll show the UI if there are any OWNER/ADMIN members (basic check)
  // In a real scenario, you'd get the current user's role from the space data
  const ownerCount = members.filter((m) => m.role === 'OWNER').length;
  // Show management UI - API will enforce permissions
  const canManageMembers = true; // API will handle permission checks

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">Team Members</h2>
          <p className="text-[var(--muted-foreground)] mt-1">
            Manage who has access to this space and their permissions
          </p>
        </div>
        {canManageMembers && (
          <Button onClick={() => setAddMemberOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({members.length})
          </CardTitle>
          <CardDescription>
            All people who have access to this space
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.length === 0 ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No members found</p>
              </div>
            ) : (
              members.map((member) => {
                const RoleIcon = ROLE_ICONS[member.role];
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold">
                        {member.user.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={member.user.name || member.user.email}
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          getInitials(member.user.name, member.user.email)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[var(--foreground)]">
                            {member.user.name || member.user.email}
                          </p>
                          <Badge className={`text-xs border ${ROLE_COLORS[member.role]}`}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] truncate">
                          {member.user.email}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {canManageMembers && member.role !== 'OWNER' && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleUpdateRole(member.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.user.email)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {member.role === 'OWNER' && (
                      <Badge className={ROLE_COLORS.OWNER}>
                        <Shield className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a new member to this space by entering their email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={newMemberRole} onValueChange={(value: any) => setNewMemberRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin - Can manage members and settings</SelectItem>
                  <SelectItem value="MEMBER">Member - Can create and edit tasks</SelectItem>
                  <SelectItem value="VIEWER">Viewer - Read-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={addingMember || !newMemberEmail.trim()}>
              {addingMember ? <Loading size="sm" /> : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

