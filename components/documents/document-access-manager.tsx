'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, UserPlus, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToastHelpers } from '@/components/toast';
import { cn } from '@/lib/utils';

interface DocumentAccess {
  id: string;
  userId: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  role: string;
  expiresAt?: string;
  createdAt: string;
}

interface DocumentAccessManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  spaceSlug: string;
}

export function DocumentAccessManager({
  open,
  onOpenChange,
  documentId,
  spaceSlug,
}: DocumentAccessManagerProps) {
  const { success: showSuccess, error: showError } = useToastHelpers();
  const [loading, setLoading] = useState(false);
  const [accessList, setAccessList] = useState<DocumentAccess[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAccess, setNewAccess] = useState({
    userId: '',
    role: 'VIEW',
    expiresAt: null as Date | null,
  });
  const [availableUsers, setAvailableUsers] = useState<Array<{
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  }>>([]);

  useEffect(() => {
    if (open) {
      fetchAccess();
      fetchAvailableUsers();
    }
  }, [open, documentId, spaceSlug]);

  const fetchAccess = async () => {
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
      console.error('Error fetching access:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/members`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (data.success) {
        setAvailableUsers(data.members?.map((m: any) => m.user) || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleGrantAccess = async () => {
    if (!newAccess.userId) {
      showError('Error', 'Please select a user');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/spaces/${spaceSlug}/documents/${documentId}/access`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: newAccess.userId,
            role: newAccess.role,
            expiresAt: newAccess.expiresAt?.toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess('Success', 'Access granted');
        setNewAccess({
          userId: '',
          role: 'VIEW',
          expiresAt: null,
        });
        setIsAdding(false);
        await fetchAccess();
      } else {
        throw new Error(data.message || 'Failed to grant access');
      }
    } catch (error) {
      console.error('Error granting access:', error);
      showError('Error', 'Failed to grant access');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (accessId: string, userId: string) => {
    if (!confirm('Are you sure you want to revoke access for this user?')) return;

    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/documents/${documentId}/access?accessId=${accessId}&userId=${userId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess('Success', 'Access revoked');
        await fetchAccess();
      } else {
        throw new Error(data.message || 'Failed to revoke access');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      showError('Error', 'Failed to revoke access');
    }
  };

  const filteredUsers = availableUsers.filter(
    (user) =>
      !accessList.some((access) => access.userId === user.id) &&
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default';
      case 'ADMIN':
        return 'default';
      case 'EDIT':
        return 'secondary';
      case 'COMMENT':
        return 'outline';
      case 'VIEW':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Access</DialogTitle>
          <DialogDescription>
            Control who can view, comment, or edit this document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Access */}
          {!isAdding ? (
            <Button onClick={() => setIsAdding(true)} className="w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              Grant Access
            </Button>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Search Users</Label>
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery && filteredUsers.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredUsers.slice(0, 5).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setNewAccess({ ...newAccess, userId: user.id });
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name?.[0] || user.email[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.name || user.email}
                        </p>
                        {user.name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {newAccess.userId && (
                <>
                  <div className="space-y-2">
                    <Label>Selected User</Label>
                    <div className="flex items-center gap-2 p-2 border rounded">
                      {(() => {
                        const user = availableUsers.find(
                          (u) => u.id === newAccess.userId
                        );
                        return user ? (
                          <>
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.name?.[0] || user.email[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm flex-1">
                              {user.name || user.email}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                setNewAccess({ ...newAccess, userId: '' })
                              }
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Permission Level</Label>
                    <Select
                      value={newAccess.role}
                      onValueChange={(value) =>
                        setNewAccess({ ...newAccess, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEW">View Only</SelectItem>
                        <SelectItem value="COMMENT">Comment</SelectItem>
                        <SelectItem value="EDIT">Edit</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Expiration Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !newAccess.expiresAt && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newAccess.expiresAt ? (
                            format(newAccess.expiresAt, 'PPP')
                          ) : (
                            <span>No expiration</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newAccess.expiresAt || undefined}
                          onSelect={(date) =>
                            setNewAccess({ ...newAccess, expiresAt: date || null })
                          }
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAdding(false);
                        setNewAccess({
                          userId: '',
                          role: 'VIEW',
                          expiresAt: null,
                        });
                        setSearchQuery('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGrantAccess}
                      disabled={loading}
                      className="flex-1"
                    >
                      Grant Access
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Access List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Current Access</h3>
            {accessList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No additional access granted
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessList.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={access.user.avatar} />
                            <AvatarFallback>
                              {access.user.name?.[0] || access.user.email[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {access.user.name || access.user.email}
                            </p>
                            {access.user.name && (
                              <p className="text-xs text-muted-foreground">
                                {access.user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(access.role)}>
                          {access.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {access.expiresAt ? (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(access.expiresAt), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRevokeAccess(access.id, access.userId)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}














