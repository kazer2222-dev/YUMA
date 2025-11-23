'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';

interface CreateBoardDialogProps {
  spaceSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoardCreated: () => void;
}

export function CreateBoardDialog({ spaceSlug, open, onOpenChange, onBoardCreated }: CreateBoardDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [methodology, setMethodology] = useState<'KANBAN' | 'SCRUM'>('KANBAN');
  const [loading, setLoading] = useState(false);
  const { success: showSuccess, error: showError } = useToastHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showError('Board name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/spaces/${spaceSlug}/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          methodology
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Board created successfully');
        setName('');
        setDescription('');
        setMethodology('KANBAN');
        onBoardCreated();
        onOpenChange(false);
      } else {
        showError(data.message || 'Failed to create board');
      }
    } catch (error) {
      console.error('Error creating board:', error);
      showError('Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Choose a methodology and name your board.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`border rounded-lg p-3 text-left hover:bg-accent ${methodology === 'KANBAN' ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                onClick={() => setMethodology('KANBAN')}
                disabled={loading}
              >
                <div className="font-medium">Kanban</div>
                <div className="text-sm text-muted-foreground mt-1">Continuous flow with columns like To Do, In Progress, Done.</div>
              </button>
              <button
                type="button"
                className={`border rounded-lg p-3 text-left hover:bg-accent ${methodology === 'SCRUM' ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                onClick={() => setMethodology('SCRUM')}
                disabled={loading}
              >
                <div className="font-medium">Scrum</div>
                <div className="text-sm text-muted-foreground mt-1">Sprint-based workflow with Backlog and Sprint boards.</div>
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-name">Board Name</Label>
              <Input
                id="board-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Development Board, Marketing Board"
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-description">Description (Optional)</Label>
              <Textarea
                id="board-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this board is for..."
                disabled={loading}
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Board
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

