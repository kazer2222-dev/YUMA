'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToastHelpers } from '@/components/toast';
import { FileText, Table2, ArrowLeft, Loader2, Sparkles, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  spaceSlug: string;
}

type DocumentTypeOption = 'document' | 'spreadsheet';
type Step = 'select-type' | 'configure';

export function CreateDocumentDialog({
  open,
  onOpenChange,
  onSuccess,
  spaceSlug,
}: CreateDocumentDialogProps) {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToastHelpers();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('select-type');
  const [selectedType, setSelectedType] = useState<DocumentTypeOption | null>(null);
  const [title, setTitle] = useState('');

  const resetDialog = () => {
    setStep('select-type');
    setSelectedType(null);
    setTitle('');
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handleTypeSelect = (type: DocumentTypeOption) => {
    setSelectedType(type);
    setStep('configure');
  };

  const handleBack = () => {
    setStep('select-type');
    setTitle('');
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showError('Error', 'Please enter a title');
      return;
    }

    try {
      setLoading(true);
      
      const documentType = selectedType === 'spreadsheet' ? 'SPREADSHEET' : 'RICH_TEXT';
      
      const response = await fetch(`/api/spaces/${spaceSlug}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          type: documentType,
          content: selectedType === 'spreadsheet' 
            ? JSON.stringify({ sheets: [{ id: 'sheet-1', name: 'Sheet 1', data: {} }] })
            : '',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showError('Error', data.error || data.message || 'Failed to create document');
        return;
      }

      showSuccess('Success', `${selectedType === 'spreadsheet' ? 'Spreadsheet' : 'Document'} created successfully`);
      resetDialog();
      onOpenChange(false);
      
      // Navigate to the new document
      if (data.document?.id) {
        router.push(`/spaces/${spaceSlug}/documents/${data.document.id}`);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating document:', error);
      showError('Error', 'Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'select-type' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Create New</DialogTitle>
              <DialogDescription>
                Choose the type of document you want to create
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-6">
              {/* Document Option */}
              <button
                onClick={() => handleTypeSelect('document')}
                className={cn(
                  "group relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all duration-200",
                  "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                )}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Document</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Rich text editor with AI features
                  </p>
                </div>
                <div className="absolute top-3 right-3">
                  <Sparkles className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {/* Spreadsheet Option */}
              <button
                onClick={() => handleTypeSelect('spreadsheet')}
                className={cn(
                  "group relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all duration-200",
                  "hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30",
                  "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                )}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <Grid3X3 className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Spreadsheet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Excel-like tables with sheets
                  </p>
                </div>
                <div className="absolute top-3 right-3">
                  <Table2 className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle className="text-xl">
                    {selectedType === 'spreadsheet' ? 'New Spreadsheet' : 'New Document'}
                  </DialogTitle>
                  <DialogDescription>
                    Enter a name for your {selectedType === 'spreadsheet' ? 'spreadsheet' : 'document'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl text-white",
                  selectedType === 'spreadsheet' 
                    ? "bg-gradient-to-br from-green-500 to-emerald-600"
                    : "bg-gradient-to-br from-blue-500 to-indigo-600"
                )}>
                  {selectedType === 'spreadsheet' ? (
                    <Grid3X3 className="w-6 h-6" />
                  ) : (
                    <FileText className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {selectedType === 'spreadsheet' ? 'Spreadsheet' : 'Document'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedType === 'spreadsheet' 
                      ? 'Excel-like interface with multiple sheets'
                      : 'Rich text editor with formatting & AI'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-title">Title</Label>
                <Input
                  id="doc-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={selectedType === 'spreadsheet' ? 'My Spreadsheet' : 'My Document'}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && title.trim()) {
                      handleCreate();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={loading || !title.trim()}
                className={cn(
                  selectedType === 'spreadsheet'
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                )}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create {selectedType === 'spreadsheet' ? 'Spreadsheet' : 'Document'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
