'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  File, 
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastHelpers } from '@/components/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ParsedAttachment {
  fileName: string;
  fileType: string;
  content: string;
  success: boolean;
  error?: string;
}

interface AttachmentParserProps {
  onParsed: (content: string, fileName: string) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AttachmentParser({ onParsed, trigger, open: controlledOpen, onOpenChange }: AttachmentParserProps) {
  const { success: showSuccess, error: showError } = useToastHelpers();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Support controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedResult, setParsedResult] = useState<ParsedAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setParsedResult(null);
    setProgress(0);
    setIsParsing(false);
  };

  const handleClose = () => {
    resetState();
    setOpen(false);
  };

  const parseFile = async (file: File): Promise<ParsedAttachment> => {
    const fileType = file.type || 'application/octet-stream';
    let content = '';

    try {
      setProgress(10);

      // Handle text-based files directly
      if (fileType.startsWith('text/') || fileType === 'application/json') {
        content = await file.text();
        setProgress(100);
        return { fileName: file.name, fileType, content, success: true };
      }

      // Handle CSV
      if (fileType === 'text/csv' || file.name.endsWith('.csv')) {
        content = await file.text();
        const lines = content.split('\n');
        const formatted = lines.map(line => {
          const cells = line.split(',');
          return cells.join(' | ');
        }).join('\n');
        setProgress(100);
        return { fileName: file.name, fileType, content: formatted, success: true };
      }

      // Handle images - Use API for OCR
      if (fileType.startsWith('image/')) {
        setProgress(30);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'ocr');

        const response = await fetch('/api/ai/parse-attachment', {
          method: 'POST',
          body: formData,
        });

        setProgress(80);

        if (!response.ok) {
          throw new Error('Failed to parse image');
        }

        const data = await response.json();
        if (data.success) {
          setProgress(100);
          return { fileName: file.name, fileType, content: data.content, success: true };
        } else {
          throw new Error(data.error || 'Failed to extract text from image');
        }
      }

      // Handle PDFs and Office documents - Use API
      if (
        fileType === 'application/pdf' ||
        fileType.includes('word') ||
        fileType.includes('excel') ||
        fileType.includes('spreadsheet')
      ) {
        setProgress(30);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'parse');

        const response = await fetch('/api/ai/parse-attachment', {
          method: 'POST',
          body: formData,
        });

        setProgress(80);

        if (!response.ok) {
          throw new Error('Failed to parse document');
        }

        const data = await response.json();
        if (data.success) {
          setProgress(100);
          return { fileName: file.name, fileType, content: data.content, success: true };
        } else {
          throw new Error(data.error || 'Failed to parse document');
        }
      }

      // Try to read as text for unknown types
      try {
        content = await file.text();
        setProgress(100);
        return { fileName: file.name, fileType, content, success: true };
      } catch {
        throw new Error('Unsupported file type');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse file';
      return { fileName: file.name, fileType, content: '', success: false, error: errorMessage };
    }
  };

  const handleFileDrop = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (file.size > 10 * 1024 * 1024) {
      showError('Error', 'File size must be less than 10MB');
      return;
    }

    setIsParsing(true);
    setProgress(0);

    const result = await parseFile(file);
    setParsedResult(result);
    setIsParsing(false);

    if (result.success) {
      showSuccess('Parsed', 'Successfully extracted text from ' + result.fileName);
    } else {
      showError('Error', result.error || 'Failed to parse file');
    }
  }, [showSuccess, showError]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileDrop(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileDrop(e.target.files);
  };

  const handleInsert = () => {
    if (parsedResult?.success && parsedResult.content) {
      onParsed(parsedResult.content, parsedResult.fileName);
      handleClose();
    }
  };

  return (
    <>
      {!isControlled && (
        trigger ? (
          <div onClick={() => setOpen(true)}>{trigger}</div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Parse Attachment
          </Button>
        )
      )}

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Parse Attachment to Text</DialogTitle>
            <DialogDescription>
              Upload a file to extract its text content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!parsedResult && !isParsing && (
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                  isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".txt,.csv,.md,.html,.pdf,.doc,.docx,.xls,.xlsx,.json,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium">
                  Drop a file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports: PDF, Word, Excel, Images (OCR), Text, CSV, JSON
                </p>
              </div>
            )}

            {isParsing && (
              <div className="space-y-4 text-center py-8">
                <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
                <div>
                  <p className="font-medium">Parsing file...</p>
                  <p className="text-sm text-muted-foreground">
                    Extracting text content
                  </p>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {parsedResult && (
              <div className="space-y-4">
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-lg",
                  parsedResult.success
                    ? "bg-green-50 dark:bg-green-950/30"
                    : "bg-red-50 dark:bg-red-950/30"
                )}>
                  {parsedResult.success ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{parsedResult.fileName}</p>
                    <p className={cn(
                      "text-sm",
                      parsedResult.success ? "text-green-600" : "text-red-600"
                    )}>
                      {parsedResult.success
                        ? parsedResult.content.length + ' characters extracted'
                        : parsedResult.error}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetState}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {parsedResult.success && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-3 py-2 text-xs font-medium">
                      Preview (first 500 characters)
                    </div>
                    <div className="p-3 max-h-48 overflow-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {parsedResult.content.slice(0, 500)}
                        {parsedResult.content.length > 500 && '...'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {parsedResult && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetState}>
                Parse Another
              </Button>
              {parsedResult.success && (
                <Button onClick={handleInsert}>
                  Insert to Document
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

