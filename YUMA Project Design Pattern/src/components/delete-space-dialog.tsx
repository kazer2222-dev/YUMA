import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceName: string;
  onConfirm: () => void;
}

export function DeleteSpaceDialog({
  open,
  onOpenChange,
  spaceName,
  onConfirm,
}: DeleteSpaceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[var(--card)] border-[var(--border)]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <AlertDialogTitle className="text-[var(--foreground)]">
              Delete Space?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[var(--muted-foreground)] space-y-3">
            <p>
              You are about to permanently delete the space{" "}
              <span className="text-[var(--foreground)]">
                "{spaceName}"
              </span>
              .
            </p>
            <div className="bg-[var(--muted)]/50 border border-[var(--border)] rounded-lg p-3 space-y-2">
              <p className="text-sm">This action will:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Delete all tasks and boards in this space</li>
                <li>Remove all templates and workflows</li>
                <li>Delete all space settings and configurations</li>
              </ul>
            </div>
            <p className="text-red-400">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Delete Space
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
