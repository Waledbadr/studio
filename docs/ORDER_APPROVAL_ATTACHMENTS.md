# Order Approval Attachments Feature

## Overview
تم إضافة إمكانية رفع مرفقات موقعة من المدير العام عند الموافقة على طلبات المواد (Material Requests).

## Features Added

### 1. API Endpoint
- **Path**: `/api/uploads/order-approval`
- **Method**: POST
- **Max File Size**: 15MB
- **Supported Formats**: PDF, Images (JPG, PNG, WEBP), Word (DOC, DOCX)
- **Storage**: Vercel Blob Storage at `orders/approvals/{timestamp}_{filename}`

### 2. Data Model
Added fields to `Order` interface (already existed):
```typescript
approvalAttachmentUrl?: string | null;
approvalAttachmentPath?: string | null;
approvalAttachmentName?: string | null;
approvalAttachmentUploadedAt?: Timestamp;
approvalAttachmentUploadedById?: string | null;
```

### 3. UI Components

#### ApprovalAttachmentDialog
**Location**: `src/components/inventory/approval-attachment-dialog.tsx`

**Features**:
- Drag-and-drop file upload
- File type and size validation
- Preview selected file with size display
- Two approval options:
  - "رفع والموافقة" (Upload & Approve) - with attachment
  - "الموافقة بدون مرفق" (Approve without attachment) - skip upload
- Professional RTL layout

**Props**:
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (attachmentData: {...} | null) => Promise<void>;
  orderId: string;
}
```

### 4. Updated Context
**File**: `src/context/orders-context.tsx`

Modified `updateOrderStatus`:
```typescript
updateOrderStatus(
  id: string, 
  status: OrderStatus, 
  approverId?: string,
  attachmentData?: {
    url: string;
    path: string;
    filename: string;
  } | null
)
```

### 5. Order Detail Page
**File**: `src/app/inventory/orders/[id]/page.tsx`

**Changes**:
- Added `ApprovalAttachmentDialog` component
- Modified `handleApprove` to show dialog instead of direct approval
- Added attachment display section for approved orders
- Shows file name, upload date, and download button

## User Flow

### Approving an Order (Admin)
1. Admin navigates to order detail page
2. Clicks "Approve" button
3. Dialog opens with two options:
   - Upload attachment (optional): drag-and-drop or click to browse
   - Approve without attachment: direct approval
4. If uploading:
   - File is validated (type & size)
   - Shows preview with file name and size
   - Click "رفع والموافقة"
5. Order is approved and attachment data is saved to Firestore

### Viewing Attachments
- Approved orders show attachment section if attachment exists
- Displays file name and upload timestamp
- Download button opens attachment in new tab

## Technical Details

### File Validation
```typescript
// Max size
const maxSize = 15 * 1024 * 1024; // 15MB

// Allowed types
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
```

### Upload Flow
1. File selected/dropped
2. Client-side validation
3. FormData created
4. POST to `/api/uploads/order-approval`
5. Server uploads to Vercel Blob
6. Returns `{ url, path, filename }`
7. Data passed to `updateOrderStatus`
8. Saved to Firestore order document

## Environment Requirements
- `BLOB_READ_WRITE_TOKEN` must be set in environment variables
- Same token used for MRV invoice uploads

## Firestore Structure
```javascript
orders/{orderId} {
  // ... existing fields
  approvalAttachmentUrl: "https://...",
  approvalAttachmentPath: "orders/approvals/1234567890_document.pdf",
  approvalAttachmentName: "document.pdf",
  approvalAttachmentUploadedAt: Timestamp,
  approvalAttachmentUploadedById: "userId"
}
```

## Notes
- Attachment upload is **optional**
- Quick approval from orders list (dropdown) does not support attachments
- Only Admin users can approve orders
- Attachments are only shown in detail view after approval
- File is stored with sanitized filename to prevent special character issues
- Upload errors are caught and displayed via toast notifications

## Future Enhancements
- Support multiple attachments per order
- Add attachment preview modal
- Allow attachment replacement after approval
- Add attachment history/audit trail
