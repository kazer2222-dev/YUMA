'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface DeleteSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  onConfirm: () => void;
}

export function DeleteSpaceDialog({ open, onOpenChange, entityName, onConfirm }: DeleteSpaceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[var(--border)] bg-[var(--card)]">
        <AlertDialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <AlertDialogTitle className="text-[var(--foreground)]">Delete Space?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-[var(--muted-foreground)]">
            <p>
              You are about to permanently delete <span className="text-[var(--foreground)]">&quot;{entityName}&quot;</span>.
            </p>
            <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 p-3 text-sm">
              <p>This action will:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Delete all tasks and boards in this space</li>
                <li>Remove all templates and workflows</li>
                <li>Delete all space settings and configurations</li>
              </ul>
            </div>
            <p className="text-red-400">This action cannot be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-500 text-white hover:bg-red-600">
            Delete Space
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}










