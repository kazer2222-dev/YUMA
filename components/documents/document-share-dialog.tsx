'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Copy, CheckCircle2, Calendar as CalendarIcon, Lock, Globe, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToastHelpers } from '@/components/toast';
import { cn } from '@/lib/utils';

interface ShareLink {
  id: string;
  token: string;
  accessLevel: string;
  password?: string;
  expiresAt?: string;
  maxViews?: number;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
}

interface DocumentShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  spaceSlug: string;
}

export function DocumentShareDialog({
  open,
  onOpenChange,
  documentId,
  spaceSlug,
}: DocumentShareDialogProps) {
  const { success: showSuccess, error: showError } = useToastHelpers();
  const [loading, setLoading] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newLink, setNewLink] = useState({
    accessLevel: 'VIEW',
    password: '',
    expiresAt: null as Date | null,
    maxViews: '',
  });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchShareLinks();
    }
  }, [open, documentId, spaceSlug]);

  const fetchShareLinks = async () => {
    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/documents/${documentId}/share-links`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (data.success) {
        setShareLinks(data.shareLinks || []);
      }
    } catch (error) {
      console.error('Error fetching share links:', error);
    }
  };

  const handleCreateLink = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/spaces/${spaceSlug}/documents/${documentId}/share-links`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            accessLevel: newLink.accessLevel,
            password: newLink.password || undefined,
            expiresAt: newLink.expiresAt?.toISOString(),
            maxViews: newLink.maxViews ? parseInt(newLink.maxViews) : undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess('Success', 'Share link created');
        setNewLink({
          accessLevel: 'VIEW',
          password: '',
          expiresAt: null,
          maxViews: '',
        });
        setIsCreating(false);
        await fetchShareLinks();
      } else {
        throw new Error(data.message || 'Failed to create share link');
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      showError('Error', 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLink = async (linkId: string, isActive: boolean) => {
    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/documents/${documentId}/share-links/${linkId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isActive: !isActive }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchShareLinks();
        showSuccess('Success', `Link ${!isActive ? 'activated' : 'deactivated'}`);
      } else {
        throw new Error(data.message || 'Failed to update link');
      }
    } catch (error) {
      console.error('Error updating link:', error);
      showError('Error', 'Failed to update link');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this share link?')) return;

    try {
      const response = await fetch(
        `/api/spaces/${spaceSlug}/documents/${documentId}/share-links/${linkId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchShareLinks();
        showSuccess('Success', 'Share link deleted');
      } else {
        throw new Error(data.message || 'Failed to delete link');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      showError('Error', 'Failed to delete link');
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/documents/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    showSuccess('Copied', 'Share link copied to clipboard');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Create and manage share links for this document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Link */}
          {!isCreating ? (
            <Button onClick={() => setIsCreating(true)} className="w-full">
              <Globe className="w-4 h-4 mr-2" />
              Create Share Link
            </Button>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Access Level</Label>
                <Select
                  value={newLink.accessLevel}
                  onValueChange={(value) =>
                    setNewLink({ ...newLink, accessLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEW">View Only</SelectItem>
                    <SelectItem value="COMMENT">Comment</SelectItem>
                    <SelectItem value="EDIT">Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Password (Optional)</Label>
                <Input
                  type="password"
                  placeholder="Leave empty for no password"
                  value={newLink.password}
                  onChange={(e) =>
                    setNewLink({ ...newLink, password: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Expiration Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !newLink.expiresAt && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newLink.expiresAt ? (
                        format(newLink.expiresAt, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newLink.expiresAt || undefined}
                      onSelect={(date) =>
                        setNewLink({ ...newLink, expiresAt: date || null })
                      }
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Max Views (Optional)</Label>
                <Input
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={newLink.maxViews}
                  onChange={(e) =>
                    setNewLink({ ...newLink, maxViews: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewLink({
                      accessLevel: 'VIEW',
                      password: '',
                      expiresAt: null,
                      maxViews: '',
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateLink}
                  disabled={loading}
                  className="flex-1"
                >
                  Create Link
                </Button>
              </div>
            </div>
          )}

          {/* Existing Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Active Share Links</h3>
            {shareLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No share links created yet
              </p>
            ) : (
              shareLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{link.accessLevel}</Badge>
                      {link.password && (
                        <Badge variant="outline">
                          <Lock className="w-3 h-3 mr-1" />
                          Password Protected
                        </Badge>
                      )}
                      {link.expiresAt && (
                        <Badge variant="outline">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          Expires {format(new Date(link.expiresAt), 'MMM d, yyyy')}
                        </Badge>
                      )}
                      {link.maxViews && (
                        <Badge variant="outline">
                          {link.viewCount} / {link.maxViews} views
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {window.location.origin}/documents/shared/{link.token}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {format(new Date(link.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(link.token)}
                    >
                      {copiedToken === link.token ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Switch
                      checked={link.isActive}
                      onCheckedChange={() => handleToggleLink(link.id, link.isActive)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLink(link.id)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))
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


