/**
 * API لرفع الملفات إلى R2 Storage
 */

import { StorageService, CloudflareEnv, AuthService } from '../_lib';

export const runtime = 'edge';

// POST - رفع ملف واحد أو متعدد
export async function POST(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة
    const authResult = await AuthService.requireAuth(request, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;
    const folder = formData.get('folder') as string;
    const isPublic = formData.get('isPublic') === 'true';

    if (!files || files.length === 0) {
      return Response.json(
        { error: 'لم يتم تحديد أي ملفات' },
        { status: 400 }
      );
    }

    const storageService = new StorageService(env);
    
    const uploadOptions = {
      entityType,
      entityId,
      uploadedBy: authResult.user.id,
      isPublic,
      folder: folder || 'uploads'
    };

    if (files.length === 1) {
      // رفع ملف واحد
      const result = await storageService.uploadFile(files[0], uploadOptions);
      
      return Response.json({
        success: true,
        message: 'تم رفع الملف بنجاح',
        data: result
      });
    } else {
      // رفع متعدد الملفات
      const results = await storageService.uploadMultipleFiles(files, uploadOptions);
      
      return Response.json({
        success: true,
        message: `تم رفع ${results.length} ملف بنجاح`,
        data: results
      });
    }

  } catch (error) {
    console.error('خطأ في API رفع الملفات:', error);
    return Response.json(
      { error: 'حدث خطأ في رفع الملف' },
      { status: 500 }
    );
  }
}

// GET - جلب قائمة الملفات أو تحميل ملف
export async function GET(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة
    const authResult = await AuthService.requireAuth(request, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const download = searchParams.get('download') === 'true';
    const search = searchParams.get('search');

    const storageService = new StorageService(env);

    if (fileId) {
      if (download) {
        // تحميل ملف
        const fileResponse = await storageService.downloadFile(fileId);
        if (!fileResponse) {
          return Response.json(
            { error: 'الملف غير موجود' },
            { status: 404 }
          );
        }
        return fileResponse;
      } else {
        // جلب معلومات ملف واحد
        const fileMetadata = await storageService.getFileMetadata(fileId);
        if (!fileMetadata) {
          return Response.json(
            { error: 'الملف غير موجود' },
            { status: 404 }
          );
        }
        
        return Response.json({
          success: true,
          data: fileMetadata
        });
      }
    } else if (entityType && entityId) {
      // جلب ملفات كيان معين
      const files = await storageService.getEntityFiles(entityType, entityId);
      
      return Response.json({
        success: true,
        data: files
      });
    } else if (search) {
      // البحث في الملفات
      const searchOptions = {
        entityType: searchParams.get('filterEntityType') || undefined,
        mimeType: searchParams.get('filterMimeType') || undefined,
        uploadedBy: searchParams.get('filterUploadedBy') || undefined,
        limit: parseInt(searchParams.get('limit') || '50')
      };
      
      const files = await storageService.searchFiles(search, searchOptions);
      
      return Response.json({
        success: true,
        data: files
      });
    } else {
      return Response.json(
        { error: 'يجب تحديد معرف الملف أو معرف الكيان أو كلمة البحث' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('خطأ في API جلب الملفات:', error);
    return Response.json(
      { error: 'حدث خطأ في جلب الملف' },
      { status: 500 }
    );
  }
}

// DELETE - حذف ملف
export async function DELETE(request: Request, { env }: { env: CloudflareEnv }) {
  try {
    // التحقق من المصادقة
    const authResult = await AuthService.requireAuth(request, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return Response.json(
        { error: 'معرف الملف مطلوب' },
        { status: 400 }
      );
    }

    const storageService = new StorageService(env);
    
    // التحقق من صلاحية حذف الملف
    const fileMetadata = await storageService.getFileMetadata(fileId);
    if (!fileMetadata) {
      return Response.json(
        { error: 'الملف غير موجود' },
        { status: 404 }
      );
    }

    // يمكن للمستخدم حذف ملفاته أو للإداري حذف أي ملف
    if (fileMetadata.uploaded_by !== authResult.user.id && authResult.user.role !== 'admin') {
      return Response.json(
        { error: 'ليس لديك صلاحية لحذف هذا الملف' },
        { status: 403 }
      );
    }

    const success = await storageService.deleteFile(fileId);
    
    if (success) {
      return Response.json({
        success: true,
        message: 'تم حذف الملف بنجاح'
      });
    } else {
      return Response.json(
        { error: 'فشل في حذف الملف' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('خطأ في API حذف الملفات:', error);
    return Response.json(
      { error: 'حدث خطأ في حذف الملف' },
      { status: 500 }
    );
  }
}
