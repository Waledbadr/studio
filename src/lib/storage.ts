/**
 * نظام إدارة الملفات مع Cloudflare R2 Storage
 * للتعامل مع رفع وتحميل وإدارة الملفات
 */

import { CloudflareEnv } from './cloudflare-db';

export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  publicUrl: string;
  r2Key: string;
}

export interface FileMetadata {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  r2_key: string;
  public_url: string;
  entity_type?: string;
  entity_id?: string;
  uploaded_by?: string;
  is_public: boolean;
  created_at: string;
}

export class StorageService {
  constructor(private env: CloudflareEnv) {}

  /**
   * رفع ملف إلى R2 Storage
   */
  async uploadFile(
    file: File,
    options: {
      entityType?: string;
      entityId?: string;
      uploadedBy?: string;
      isPublic?: boolean;
      folder?: string;
    } = {}
  ): Promise<FileUploadResult> {
    try {
      // التحقق من نوع الملف والحجم
      this.validateFile(file);

      // إنشاء مفتاح فريد للملف
      const fileId = crypto.randomUUID();
      const fileExtension = this.getFileExtension(file.name);
      const folder = options.folder || 'uploads';
      const r2Key = `${folder}/${fileId}${fileExtension}`;

      // رفع الملف إلى R2
      await this.env.BUCKET.put(r2Key, file.stream(), {
        httpMetadata: {
          contentType: file.type,
          contentDisposition: `inline; filename="${file.name}"`,
        },
        customMetadata: {
          originalName: file.name,
          uploadedBy: options.uploadedBy || 'unknown',
          entityType: options.entityType || '',
          entityId: options.entityId || '',
        }
      });

      // إنشاء الURL العام
      const publicUrl = this.getPublicUrl(r2Key, options.isPublic);

      // حفظ معلومات الملف في قاعدة البيانات
      const fileMetadata: Omit<FileMetadata, 'created_at'> = {
        id: fileId,
        filename: `${fileId}${fileExtension}`,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        r2_key: r2Key,
        public_url: publicUrl,
        entity_type: options.entityType,
        entity_id: options.entityId,
        uploaded_by: options.uploadedBy,
        is_public: options.isPublic || false
      };

      await this.saveFileMetadata(fileMetadata);

      return {
        id: fileId,
        filename: `${fileId}${fileExtension}`,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        publicUrl: publicUrl,
        r2Key: r2Key
      };
    } catch (error) {
      console.error('خطأ في رفع الملف:', error);
      throw new Error('فشل في رفع الملف');
    }
  }

  /**
   * تحميل ملف من R2 Storage
   */
  async downloadFile(fileId: string): Promise<Response | null> {
    try {
      const fileMetadata = await this.getFileMetadata(fileId);
      if (!fileMetadata) {
        return null;
      }

      const object = await this.env.BUCKET.get(fileMetadata.r2_key);
      if (!object) {
        return null;
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': fileMetadata.mime_type,
          'Content-Disposition': `attachment; filename="${fileMetadata.original_name}"`,
          'Content-Length': fileMetadata.size_bytes.toString(),
        }
      });
    } catch (error) {
      console.error('خطأ في تحميل الملف:', error);
      return null;
    }
  }

  /**
   * حذف ملف من R2 Storage وقاعدة البيانات
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const fileMetadata = await this.getFileMetadata(fileId);
      if (!fileMetadata) {
        return false;
      }

      // حذف من R2
      await this.env.BUCKET.delete(fileMetadata.r2_key);

      // حذف من قاعدة البيانات
      await this.deleteFileMetadata(fileId);

      return true;
    } catch (error) {
      console.error('خطأ في حذف الملف:', error);
      return false;
    }
  }

  /**
   * جلب قائمة الملفات لكيان معين
   */
  async getEntityFiles(entityType: string, entityId: string): Promise<FileMetadata[]> {
    try {
      const { results } = await this.env.DB.prepare(
        `SELECT * FROM files 
         WHERE entity_type = ? AND entity_id = ? 
         ORDER BY created_at DESC`
      ).bind(entityType, entityId).all();
      
      return results as unknown as FileMetadata[];
    } catch (error) {
      console.error('خطأ في جلب ملفات الكيان:', error);
      return [];
    }
  }

  /**
   * جلب معلومات ملف واحد
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const result = await this.env.DB.prepare(
        "SELECT * FROM files WHERE id = ?"
      ).bind(fileId).first();
      
      return result as unknown as FileMetadata | null;
    } catch (error) {
      console.error('خطأ في جلب معلومات الملف:', error);
      return null;
    }
  }

  /**
   * رفع متعدد الملفات
   */
  async uploadMultipleFiles(
    files: File[],
    options: {
      entityType?: string;
      entityId?: string;
      uploadedBy?: string;
      isPublic?: boolean;
      folder?: string;
    } = {}
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, options);
        results.push(result);
      } catch (error) {
        console.error(`خطأ في رفع الملف ${file.name}:`, error);
        // نواصل مع الملفات الأخرى
      }
    }
    
    return results;
  }

  /**
   * إنشاء URL مؤقت للوصول للملف
   */
  async createTemporaryUrl(fileId: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const fileMetadata = await this.getFileMetadata(fileId);
      if (!fileMetadata) {
        return null;
      }

      // إنشاء توقيع مؤقت
      const expiry = Math.floor(Date.now() / 1000) + expiresIn;
      const signature = await this.generateSignature(fileMetadata.r2_key, expiry);
      
      return `${fileMetadata.public_url}?expires=${expiry}&signature=${signature}`;
    } catch (error) {
      console.error('خطأ في إنشاء URL مؤقت:', error);
      return null;
    }
  }

  /**
   * تحسين الصور (ضغط وتغيير الحجم)
   */
  async optimizeImage(
    file: File,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): Promise<File> {
    // للتطبيق الأساسي، نرجع الملف كما هو
    // يمكن تطوير هذه الوظيفة لاحقاً لاستخدام Cloudflare Images
    return file;
  }

  /**
   * البحث في الملفات
   */
  async searchFiles(
    query: string,
    options: {
      entityType?: string;
      mimeType?: string;
      uploadedBy?: string;
      limit?: number;
    } = {}
  ): Promise<FileMetadata[]> {
    try {
      let sql = `SELECT * FROM files WHERE (original_name LIKE ? OR filename LIKE ?)`;
      let bindings = [`%${query}%`, `%${query}%`];

      if (options.entityType) {
        sql += ` AND entity_type = ?`;
        bindings.push(options.entityType);
      }

      if (options.mimeType) {
        sql += ` AND mime_type LIKE ?`;
        bindings.push(`${options.mimeType}%`);
      }

      if (options.uploadedBy) {
        sql += ` AND uploaded_by = ?`;
        bindings.push(options.uploadedBy);
      }

      sql += ` ORDER BY created_at DESC`;

      if (options.limit) {
        sql += ` LIMIT ?`;
        bindings.push(options.limit.toString());
      }

      const { results } = await this.env.DB.prepare(sql).bind(...bindings).all();
      return results as unknown as FileMetadata[];
    } catch (error) {
      console.error('خطأ في البحث في الملفات:', error);
      return [];
    }
  }

  /**
   * إحصائيات التخزين
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    filesByEntity: Record<string, number>;
  }> {
    try {
      const [
        totalFiles,
        totalSize,
        filesByType,
        filesByEntity
      ] = await Promise.all([
        this.env.DB.prepare("SELECT COUNT(*) as count FROM files").first(),
        this.env.DB.prepare("SELECT SUM(size_bytes) as total FROM files").first(),
        this.env.DB.prepare(`
          SELECT mime_type, COUNT(*) as count 
          FROM files 
          GROUP BY mime_type 
          ORDER BY count DESC
        `).all(),
        this.env.DB.prepare(`
          SELECT entity_type, COUNT(*) as count 
          FROM files 
          WHERE entity_type IS NOT NULL 
          GROUP BY entity_type 
          ORDER BY count DESC
        `).all()
      ]);

      const typeStats: Record<string, number> = {};
      filesByType.results?.forEach((row: any) => {
        typeStats[row.mime_type] = row.count;
      });

      const entityStats: Record<string, number> = {};
      filesByEntity.results?.forEach((row: any) => {
        entityStats[row.entity_type] = row.count;
      });

      return {
        totalFiles: totalFiles?.count || 0,
        totalSize: totalSize?.total || 0,
        filesByType: typeStats,
        filesByEntity: entityStats
      };
    } catch (error) {
      console.error('خطأ في جلب إحصائيات التخزين:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        filesByType: {},
        filesByEntity: {}
      };
    }
  }

  // ===================================================
  // وظائف مساعدة خاصة
  // ===================================================

  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (file.size > maxSize) {
      throw new Error('حجم الملف كبير جداً. الحد الأقصى 10MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('نوع الملف غير مدعوم');
    }
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  private getPublicUrl(r2Key: string, isPublic: boolean = false): string {
    // يجب تحديث هذا بناءً على إعدادات R2 الفعلية
    const domain = process.env.R2_PUBLIC_DOMAIN || 'your-bucket.r2.cloudflarestorage.com';
    return `https://${domain}/${r2Key}`;
  }

  private async saveFileMetadata(metadata: Omit<FileMetadata, 'created_at'>): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO files (
        id, filename, original_name, mime_type, size_bytes, r2_key, 
        public_url, entity_type, entity_id, uploaded_by, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      metadata.id,
      metadata.filename,
      metadata.original_name,
      metadata.mime_type,
      metadata.size_bytes,
      metadata.r2_key,
      metadata.public_url,
      metadata.entity_type || null,
      metadata.entity_id || null,
      metadata.uploaded_by || null,
      metadata.is_public
    ).run();
  }

  private async deleteFileMetadata(fileId: string): Promise<void> {
    await this.env.DB.prepare(
      "DELETE FROM files WHERE id = ?"
    ).bind(fileId).run();
  }

  private async generateSignature(r2Key: string, expiry: number): Promise<string> {
    const secret = process.env.R2_SIGNATURE_SECRET || 'default-secret';
    const data = `${r2Key}:${expiry}:${secret}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 16);
  }
}
