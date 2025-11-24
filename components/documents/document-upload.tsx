'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { useToastHelpers } from '@/components/toast';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  spaceSlug: string;
  onUploadComplete?: (document: any) => void;
  onUploadError?: (error: Error) => void;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  multiple?: boolean;
  taskIds?: string[];
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB default

const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return <File className="w-5 h-5" />;
  if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return <FileText className="w-5 h-5 text-blue-500" />;
  if (mimeType.includes('spreadsheetml') || mimeType.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  if (mimeType.includes('presentationml') || mimeType.includes('powerpoint')) return <FileCode className="w-5 h-5 text-orange-500" />;
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
  return <File className="w-5 h-5" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  documentId?: string;
}

export function DocumentUpload({
  spaceSlug,
  onUploadComplete,
  onUploadError,
  maxSize = MAX_FILE_SIZE,
  acceptedTypes,
  multiple = true,
  taskIds = [],
}: FileUploadProps) {
  const { success: showSuccess, error: showError } = useToastHelpers();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`;
    }
    if (acceptedTypes && acceptedTypes.length > 0) {
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });
      if (!isValidType) {
        return `${file.name} is not a supported file type`;
      }
    }
    return null;
  };

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const fileArray = Array.from(fileList);
      const newFiles: UploadFile[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
          showError('Upload Error', error);
        } else {
          newFiles.push({
            file,
            id: `${Date.now()}-${Math.random()}`,
            progress: 0,
            status: 'pending' as const,
          });
        }
      });

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
        // Start uploading after state update
        setTimeout(() => {
          newFiles.forEach((uf) => {
            uploadFileFunc(uf);
          });
        }, 0);
      }
    },
    [maxSize, acceptedTypes]
  );

  const uploadFileFunc = useCallback(async (uploadFile: UploadFile) => {
    try {
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('title', uploadFile.file.name);
      if (taskIds.length > 0) {
        formData.append('taskIds', JSON.stringify(taskIds));
      }

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, progress } : f
            )
          );
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, status: 'success' as const, progress: 100, documentId: response.document.id }
                  : f
              )
            );
            showSuccess('Success', `${uploadFile.file.name} uploaded successfully`);
            onUploadComplete?.(response.document);
          } else {
            throw new Error(response.message || 'Upload failed');
          }
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'error' as const, error: 'Network error' }
              : f
          )
        );
        showError('Upload Error', `Failed to upload ${uploadFile.file.name}`);
        onUploadError?.(new Error('Network error'));
      });

      // Start upload
      xhr.open('POST', `/api/spaces/${spaceSlug}/documents/upload`);
      xhr.send(formData);
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Unknown error' }
            : f
        )
      );
      showError('Upload Error', `Failed to upload ${uploadFile.file.name}`);
      onUploadError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [spaceSlug, taskIds, onUploadComplete, onUploadError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const retryUpload = useCallback((uploadFile: UploadFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id ? { ...f, status: 'pending' as const, progress: 0, error: undefined } : f
      )
    );
    setTimeout(() => {
      uploadFileFunc({ ...uploadFile, status: 'pending', progress: 0, error: undefined });
    }, 0);
  }, [uploadFileFunc]);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
      >
        <CardContent className="flex flex-col items-center justify-center p-12">
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedTypes?.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-1">
            {isDragging ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className="text-xs text-muted-foreground text-center">
            or click to browse
            {maxSize && ` (Max ${formatFileSize(maxSize)})`}
          </p>
        </CardContent>
      </Card>

      {/* Upload List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadFile) => (
            <Card key={uploadFile.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(uploadFile.file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="mt-2 h-1" />
                    )}
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {uploadFile.error}
                      </p>
                    )}
                    {uploadFile.status === 'success' && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Uploaded successfully
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'error' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryUpload(uploadFile)}
                      >
                        Retry
                      </Button>
                    )}
                    {uploadFile.status !== 'uploading' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(uploadFile.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

