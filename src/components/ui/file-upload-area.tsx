'use client';

import React, { useState, useCallback, useRef, useId } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  FileText, 
  X, 
  File, 
  FileImage, 
  FileSpreadsheet,
  Loader2,
  Eye,
  Download,
  Paperclip
} from 'lucide-react';

// Helper to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Get icon based on file type
const getFileIcon = (file: File | UploadedFile) => {
  const type = 'type' in file && typeof file.type === 'string' ? file.type : '';
  const name = file.name || '';
  
  if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)) {
    return FileImage;
  }
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return FileText;
  }
  if (type.includes('spreadsheet') || type.includes('excel') || /\.(xlsx?|csv)$/i.test(name)) {
    return FileSpreadsheet;
  }
  return File;
};

// Check if file is previewable image
const isPreviewableImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export interface UploadedFile {
  url: string;
  path?: string;
  name: string;
  size?: number;
  uploadedAt?: Date;
}

export interface FileUploadAreaProps {
  /** Currently selected files (for controlled mode) */
  files?: File[];
  /** Callback when files change */
  onFilesChange?: (files: File[]) => void;
  /** Already uploaded files to display */
  uploadedFiles?: UploadedFile[];
  /** Callback to remove an uploaded file */
  onRemoveUploaded?: (file: UploadedFile) => void;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Maximum file size in bytes (default 15MB) */
  maxSize?: number;
  /** Allowed file types (MIME types or extensions) */
  accept?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether upload is in progress */
  uploading?: boolean;
  /** Upload progress (0-100) */
  uploadProgress?: number;
  /** Custom class for the container */
  className?: string;
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Whether to show file size */
  showFileSize?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Error message to display */
  error?: string;
  /** Whether to show image previews */
  showImagePreview?: boolean;
}

const allowedTypesList = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function FileUploadArea({
  files = [],
  onFilesChange,
  uploadedFiles = [],
  onRemoveUploaded,
  maxFiles = 10,
  maxSize = 15 * 1024 * 1024, // 15MB
  accept = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx',
  disabled = false,
  uploading = false,
  uploadProgress,
  className,
  label,
  description,
  showFileSize = true,
  compact = false,
  error,
  showImagePreview = true,
}: FileUploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId();

  const displayError = error || localError;

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `الملف "${file.name}" كبير جداً. الحد الأقصى ${formatFileSize(maxSize)}`;
    }

    // Check file type
    const isValidType = allowedTypesList.some(type => file.type === type) ||
      accept.split(',').some(ext => file.name.toLowerCase().endsWith(ext.trim().toLowerCase()));

    if (!isValidType) {
      return `نوع الملف "${file.name}" غير مدعوم`;
    }

    return null;
  }, [maxSize, accept]);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    if (!onFilesChange) return;

    const fileArray = Array.from(newFiles);
    const totalFiles = files.length + fileArray.length;

    if (totalFiles > maxFiles) {
      setLocalError(`يمكنك رفع ${maxFiles} ملفات كحد أقصى`);
      return;
    }

    const validFiles: File[] = [];
    let firstError: string | null = null;

    for (const file of fileArray) {
      // Skip duplicates
      if (files.some(f => f.name === file.name && f.size === file.size)) {
        continue;
      }

      const error = validateFile(file);
      if (error && !firstError) {
        firstError = error;
      } else if (!error) {
        validFiles.push(file);
        
        // Generate preview for images
        if (showImagePreview && isPreviewableImage(file)) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreviews(prev => ({
              ...prev,
              [file.name + file.size]: e.target?.result as string
            }));
          };
          reader.readAsDataURL(file);
        }
      }
    }

    if (firstError) {
      setLocalError(firstError);
    } else {
      setLocalError(null);
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  }, [files, onFilesChange, maxFiles, validateFile, showImagePreview]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploading) return;

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled, uploading]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, uploading, handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [handleFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    if (!onFilesChange) return;
    const file = files[index];
    
    // Remove preview
    setImagePreviews(prev => {
      const key = file.name + file.size;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    
    onFilesChange(files.filter((_, i) => i !== index));
    setLocalError(null);
  }, [files, onFilesChange]);

  const handleBrowseClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const totalFilesCount = files.length + uploadedFiles.length;
  const canAddMore = totalFilesCount < maxFiles;

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {/* Drop Zone */}
      {canAddMore && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg transition-all duration-200',
            compact ? 'p-4' : 'p-6',
            dragActive
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
            (disabled || uploading) && 'opacity-50 cursor-not-allowed',
            displayError && 'border-destructive/50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            id={`file-upload-${uniqueId}`}
            type="file"
            multiple={maxFiles > 1}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={handleInputChange}
            accept={accept}
            disabled={disabled || uploading}
          />
          
          <div className={cn('text-center', compact ? 'space-y-1' : 'space-y-2')}>
            {uploading ? (
              <>
                <Loader2 className={cn('mx-auto text-primary animate-spin', compact ? 'h-8 w-8' : 'h-10 w-10')} />
                <div className="text-sm text-muted-foreground">
                  جاري الرفع...
                  {uploadProgress !== undefined && (
                    <span className="font-medium text-primary mr-2">{uploadProgress}%</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <Upload className={cn('mx-auto text-muted-foreground', compact ? 'h-8 w-8' : 'h-10 w-10')} />
                <div className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
                  <span className="font-semibold text-primary cursor-pointer hover:underline">
                    اضغط لاختيار الملفات
                  </span>
                  {' أو اسحبها وأفلتها هنا'}
                </div>
                {description && (
                  <div className="text-xs text-muted-foreground">{description}</div>
                )}
                {!description && (
                  <div className="text-xs text-muted-foreground">
                    PDF, صور (JPG, PNG, WEBP), Word, Excel • الحد الأقصى {formatFileSize(maxSize)}
                    {maxFiles > 1 && ` • حتى ${maxFiles} ملفات`}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <X className="h-4 w-4" />
          {displayError}
        </p>
      )}

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Paperclip className="h-4 w-4" />
            <span>الملفات المختارة ({files.length})</span>
          </div>
          <div className="grid gap-2">
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file);
              const previewKey = file.name + file.size;
              const preview = imagePreviews[previewKey];

              return (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  {/* Preview or Icon */}
                  {preview && showImagePreview ? (
                    <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0 border">
                      <img 
                        src={preview} 
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileIcon className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" dir="ltr">
                      {file.name}
                    </p>
                    {showFileSize && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>
                  
                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleRemoveFile(index)}
                    disabled={disabled || uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Already Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Paperclip className="h-4 w-4 text-emerald-600" />
            <span>المرفقات المحفوظة ({uploadedFiles.length})</span>
          </div>
          <div className="grid gap-2">
            {uploadedFiles.map((file, index) => {
              const FileIcon = getFileIcon(file);
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

              return (
                <div
                  key={`uploaded-${file.url}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/30 group"
                >
                  {/* Preview or Icon */}
                  {isImage ? (
                    <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0 border">
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <FileIcon className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" dir="ltr">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {file.size && <span>{formatFileSize(file.size)}</span>}
                      {file.uploadedAt && (
                        <span>
                          {file.uploadedAt.toLocaleDateString('ar-EG')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-8 w-8 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                      onClick={() => window.open(file.url, '_blank')}
                      title="عرض"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <a
                      href={file.url}
                      download={file.name}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                      title="تحميل"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    {onRemoveUploaded && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onRemoveUploaded(file)}
                        disabled={disabled || uploading}
                        title="حذف"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Browse Button (alternative to drop zone) */}
      {canAddMore && !compact && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleBrowseClick}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جاري الرفع...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              اختر الملفات
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default FileUploadArea;
