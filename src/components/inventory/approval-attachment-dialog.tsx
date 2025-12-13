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
import { FileUploadArea } from '@/components/ui/file-upload-area';

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
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleApproveWithAttachment = async () => {
    setUploading(true);
    try {
      let attachmentData: { url: string; path: string; filename: string } | null = null;

      // Upload first file if provided
      if (files.length > 0) {
        const file = files[0];
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
          title: 'تم رفع المرفق بنجاح',
          description: 'جاري الموافقة على الطلب...',
        });
      }

      // Call approve with attachment data
      await onApprove(attachmentData);
      
      // Reset state
      setFiles([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error uploading attachment:', error);
      toast({
        title: 'خطأ في الرفع',
        description: error?.message || 'حدث خطأ أثناء رفع المرفق',
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
      setFiles([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error approving:', error);
      toast({
        title: 'خطأ في الموافقة',
        description: error?.message || 'حدث خطأ أثناء الموافقة على الطلب',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>الموافقة على طلب المواد</span>
          </DialogTitle>
          <DialogDescription>
            يمكنك رفع مرفق الموافقة (اختياري) أو الموافقة مباشرة بدون مرفق
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription className="text-sm">
              <strong>ملاحظة:</strong> رفع المرفق اختياري. يمكنك الموافقة على الطلب بدون مرفق أو رفع مستند موقع.
            </AlertDescription>
          </Alert>

          <FileUploadArea
            files={files}
            onFilesChange={setFiles}
            maxFiles={3}
            label="مرفق الموافقة (اختياري)"
            description="PDF, صور (JPG, PNG, WEBP), Word • الحد الأقصى 15 ميجا"
            compact
            disabled={uploading}
          />
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSkipAndApprove}
            disabled={uploading}
          >
            {uploading ? 'جاري الموافقة...' : 'الموافقة بدون مرفق'}
          </Button>
          <Button
            type="button"
            onClick={handleApproveWithAttachment}
            disabled={uploading || files.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {uploading ? 'جاري الرفع والموافقة...' : 'رفع والموافقة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
