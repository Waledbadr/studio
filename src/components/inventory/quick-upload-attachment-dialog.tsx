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
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, X } from 'lucide-react';
import { updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUsers } from '@/context/users-context';
import { FileUploadArea } from '@/components/ui/file-upload-area';

interface QuickUploadAttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSuccess?: () => void;
}

export function QuickUploadAttachmentDialog({
  open,
  onOpenChange,
  orderId,
  onSuccess,
}: QuickUploadAttachmentDialogProps) {
  const { toast } = useToast();
  const { currentUser } = useUsers();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (files.length === 0 || !db || !currentUser) return;

    setUploading(true);
    try {
      // Upload first file
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

      // Update order in Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        approvalAttachmentUrl: data.url,
        approvalAttachmentPath: data.path,
        approvalAttachmentName: file.name,
        approvalAttachmentUploadedAt: Timestamp.now(),
        approvalAttachmentUploadedById: currentUser.id,
      });

      toast({
        title: 'تم رفع المرفق بنجاح',
        description: 'تم إضافة مرفق الموافقة إلى الطلب',
      });

      setFiles([]);
      onOpenChange(false);
      onSuccess?.();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>رفع مرفق الموافقة</DialogTitle>
          <DialogDescription>
            إضافة مستند موافقة موقع لهذا الطلب
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <FileUploadArea
            files={files}
            onFilesChange={setFiles}
            maxFiles={3}
            label="ملف المرفق"
            description="PDF, صور (JPG, PNG, WEBP), Word • الحد الأقصى 15 ميجا"
            compact
            disabled={uploading}
          />
        </div>

        <DialogFooter>
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
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {uploading ? 'جاري الرفع...' : 'رفع المرفق'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
