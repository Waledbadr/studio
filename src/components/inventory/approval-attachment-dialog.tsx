'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApprovalAttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (attachmentData: {
    url: string;
    path: string;
    filename: string;
  } | null) => Promise<void>;
  orderId: string;
}

export function ApprovalAttachmentDialog({
  open,
  onOpenChange,
  onApprove,
  orderId,
}: ApprovalAttachmentDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file size (15MB max)
    const maxSize = 15 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 15MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type (common document formats)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: 'Unsupported file type',
        description: 'Please upload a PDF, image (JPG, PNG, WEBP), or Word document',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleApproveWithAttachment = async () => {
    setUploading(true);
    try {
      let attachmentData: { url: string; path: string; filename: string } | null = null;

      // Upload file if provided
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/uploads/order-approval', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        attachmentData = {
          url: data.url,
          path: data.path,
          filename: file.name,
        };

        toast({
          title: 'Attachment uploaded successfully',
          description: 'Approving the request...',
        });
      }

      // Call approve with attachment data
      await onApprove(attachmentData);
      
      // Reset state
      setFile(null);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error uploading attachment:', error);
      toast({
        title: 'Upload error',
        description: error?.message || 'An error occurred while uploading the attachment',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSkipAndApprove = async () => {
    setUploading(true);
    try {
      await onApprove(null);
      setFile(null);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error approving:', error);
      toast({
        title: 'Approval error',
        description: error?.message || 'An error occurred while approving the request',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Approve Material Request</span>
          </DialogTitle>
          <DialogDescription>
            You can upload a signed approval attachment (optional) or approve directly without attachment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Note:</strong> Attachment upload is optional. You can approve the request without an attachment or upload a signed document.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="attachment" className="block">
              Approval Attachment (Optional)
            </Label>
            
            {!file ? (
              <div className="space-y-3">
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    id="attachment"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    disabled={uploading}
                  />
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Click to select file</span>
                      {' or drag and drop here'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      PDF, Image (JPG, PNG, WEBP) or Word (up to 15MB)
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('attachment')?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Browse File
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-start justify-between gap-3">
                  <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" dir="ltr">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-8 w-8"
                    onClick={handleRemoveFile}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSkipAndApprove}
            disabled={uploading}
          >
            {uploading ? 'Approving...' : 'Approve without Attachment'}
          </Button>
          <Button
            type="button"
            onClick={handleApproveWithAttachment}
            disabled={uploading || !file}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {uploading ? 'Uploading & Approving...' : 'Upload & Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
