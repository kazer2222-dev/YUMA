'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToastHelpers } from '@/components/toast';
import { Loader2, Plus } from 'lucide-react';

interface CreateSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpaceCreated?: () => void;
}

export function CreateSpaceDialog({ 
  open, 
  onOpenChange, 
  onSpaceCreated 
}: CreateSpaceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ticker: ''
  });
  const { success, error: showError } = useToastHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        success('Space created successfully', `"${formData.name}" has been created`);
        onSpaceCreated?.();
        onOpenChange(false);
        setFormData({ name: '', description: '', ticker: '' });
        // Refresh the page to update the sidebar
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } else {
        const errorMessage = data.message || 'Failed to create space';
        setError(errorMessage);
        showError('Failed to create space', errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Failed to create space';
      setError(errorMessage);
      showError('Network Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="notion-heading-2">Create New Workspace</DialogTitle>
          <DialogDescription className="notion-text-muted">
            Create a new workspace to organize your projects and collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">Workspace Name</Label>
            <Input
              id="name"
              placeholder="My Project Workspace"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
              className="notion-input h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticker" className="text-sm font-medium text-foreground">Ticker</Label>
            <Input
              id="ticker"
              placeholder="CRM"
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
              required
              disabled={loading}
              className="notion-input h-11"
              maxLength={10}
              pattern="[A-Z]+"
              title="Only uppercase letters A-Z, 1-10 characters"
            />
            <p className="text-xs text-muted-foreground">Prefix for task numbers (e.g., CRM-1, CRM-2)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this workspace is for..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              className="notion-input min-h-[80px]"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="notion-button-ghost"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="notion-button-primary">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}












