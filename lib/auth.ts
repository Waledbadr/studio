/**
 * نظام المصادقة لتطبيق EstateCare مع Cloudflare
 * يستخدم JWT للمصادقة وbcrypt لتشفير كلمات المرور
 */

import { CloudflareDB, CloudflareEnv, User } from './cloudflare-db';

// إعدادات JWT
const JWT_SECRET = process.env.JWT_SECRET || 'estatecare-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// أنواع البيانات
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'admin' | 'manager' | 'user' | 'maintenance';
}

export interface AuthToken {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// وظائف تشفير كلمة المرور البسيطة (بديل bcrypt للـ Edge Runtime)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}

// وظائف JWT بسيطة
function generateJWT(payload: any, secret: string, expiresIn: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresIn === '7d' ? 7 * 24 * 60 * 60 : 3600);

  const fullPayload = {
    ...payload,
    iat: now,
    exp: exp
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(fullPayload));
  const signature = btoa(secret + encodedHeader + encodedPayload).substring(0, 32);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token: string, secret: string): any {
  try {
    const [header, payload, signature] = token.split('.');
    
    const expectedSignature = btoa(secret + header + payload).substring(0, 32);
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    const decodedPayload = JSON.parse(atob(payload));
    
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return decodedPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export class AuthService {
  private db: CloudflareDB;

  constructor(private env: CloudflareEnv) {
    this.db = new CloudflareDB(env);
  }

  /**
   * تسجيل الدخول
   */
  async login(credentials: LoginCredentials): Promise<AuthToken | null> {
    try {
      // البحث عن المستخدم
      const user = await this.db.getUserByEmail(credentials.email);
      if (!user || !user.is_active) {
        return null;
      }

      // التحقق من كلمة المرور
      const isPasswordValid = await verifyPassword(credentials.password, user.password_hash);
      if (!isPasswordValid) {
        return null;
      }

      // إنشاء JWT Token
      const token = this.generateToken(user);

      // تحديث آخر تسجيل دخول
      await this.db.updateUser(user.id, {
        last_login: new Date().toISOString()
      });

      // حفظ الجلسة في قاعدة البيانات
      await this.createSession(user.id, token);

      // إرجاع التوكن والمستخدم (بدون كلمة المرور)
      const { password_hash, ...userWithoutPassword } = user;
      return {
        token,
        user: userWithoutPassword
      };
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      return null;
    }
  }

  /**
   * إنشاء حساب جديد
   */
  async register(userData: RegisterData): Promise<AuthToken | null> {
    try {
      // التحقق من عدم وجود المستخدم مسبقاً
      const existingUser = await this.db.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل');
      }

      // تشفير كلمة المرور
      const hashedPassword = await hashPassword(userData.password);

      // إنشاء المستخدم الجديد
      const userId = crypto.randomUUID();
      const newUser: Omit<User, 'created_at' | 'updated_at'> = {
        id: userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role || 'user',
        password_hash: hashedPassword,
        avatar_url: undefined,
        is_active: true,
        last_login: undefined
      };

      await this.db.createUser(newUser);

      // تسجيل الدخول التلقائي
      return await this.login({
        email: userData.email,
        password: userData.password
      });
    } catch (error) {
      console.error('خطأ في إنشاء الحساب:', error);
      return null;
    }
  }

  /**
   * إنشاء JWT Token
   */
  private generateToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return generateJWT(payload, JWT_SECRET, JWT_EXPIRES_IN);
  }

  /**
   * التحقق من صحة التوكن
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      // فك تشفير التوكن
      const decoded = verifyJWT(token, JWT_SECRET) as JWTPayload;

      // التحقق من وجود الجلسة في قاعدة البيانات
      const session = await this.getSessionByToken(token);
      if (!session || !session.is_active || new Date(session.expires_at) < new Date()) {
        return null;
      }

      // جلب بيانات المستخدم
      const user = await this.db.getUserById(decoded.userId);
      if (!user || !user.is_active) {
        return null;
      }

      // تحديث آخر استخدام للجلسة
      await this.updateSessionLastAccessed(session.id);

      return user;
    } catch (error) {
      console.error('خطأ في التحقق من التوكن:', error);
      return null;
    }
  }

  /**
   * تسجيل الخروج
   */
  async logout(token: string): Promise<boolean> {
    try {
      // إلغاء تفعيل الجلسة
      const session = await this.getSessionByToken(token);
      if (session) {
        await this.deactivateSession(session.id);
      }
      return true;
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      return false;
    }
  }

  /**
   * تغيير كلمة المرور
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.db.getUserById(userId);
      if (!user) {
        return false;
      }

      // التحقق من كلمة المرور الحالية
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        return false;
      }

      // تشفير كلمة المرور الجديدة
      const hashedNewPassword = await hashPassword(newPassword);

      // تحديث كلمة المرور
      await this.db.updateUser(userId, {
        password_hash: hashedNewPassword
      });

      // إلغاء تفعيل جميع الجلسات الحالية (لإجبار المستخدم على تسجيل الدخول مرة أخرى)
      await this.deactivateAllUserSessions(userId);

      return true;
    } catch (error) {
      console.error('خطأ في تغيير كلمة المرور:', error);
      return false;
    }
  }

  /**
   * إعادة تعيين كلمة المرور
   */
  async resetPassword(email: string): Promise<string | null> {
    try {
      const user = await this.db.getUserByEmail(email);
      if (!user) {
        return null;
      }

      // إنشاء كلمة مرور مؤقتة
      const tempPassword = this.generateRandomPassword();
      const hashedTempPassword = await hashPassword(tempPassword);

      // تحديث كلمة المرور
      await this.db.updateUser(user.id, {
        password_hash: hashedTempPassword
      });

      // إلغاء تفعيل جميع الجلسات
      await this.deactivateAllUserSessions(user.id);

      return tempPassword;
    } catch (error) {
      console.error('خطأ في إعادة تعيين كلمة المرور:', error);
      return null;
    }
  }

  /**
   * التحقق من صلاحيات المستخدم
   */
  hasPermission(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'admin': 4,
      'manager': 3,
      'maintenance': 2,
      'user': 1
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  // ===================================================
  // وظائف إدارة الجلسات
  // ===================================================

  private async createSession(userId: string, token: string): Promise<void> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // انتهاء الصلاحية بعد 7 أيام

    await this.env.DB.prepare(
      `INSERT INTO sessions (id, user_id, token, expires_at, is_active)
       VALUES (?, ?, ?, ?, true)`
    ).bind(sessionId, userId, token, expiresAt.toISOString()).run();
  }

  private async getSessionByToken(token: string): Promise<any> {
    return await this.env.DB.prepare(
      "SELECT * FROM sessions WHERE token = ?"
    ).bind(token).first();
  }

  private async updateSessionLastAccessed(sessionId: string): Promise<void> {
    await this.env.DB.prepare(
      "UPDATE sessions SET last_accessed = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(sessionId).run();
  }

  private async deactivateSession(sessionId: string): Promise<void> {
    await this.env.DB.prepare(
      "UPDATE sessions SET is_active = false WHERE id = ?"
    ).bind(sessionId).run();
  }

  private async deactivateAllUserSessions(userId: string): Promise<void> {
    await this.env.DB.prepare(
      "UPDATE sessions SET is_active = false WHERE user_id = ?"
    ).bind(userId).run();
  }

  // ===================================================
  // وظائف مساعدة
  // ===================================================

  private generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * استخراج التوكن من Headers
   */
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * إنشاء Middleware للحماية
   */
  static async requireAuth(request: Request, env: CloudflareEnv, requiredRole?: string) {
    const authHeader = request.headers.get('Authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      return new Response(JSON.stringify({ error: 'لم يتم توفير رمز المصادقة' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authService = new AuthService(env);
    const user = await authService.verifyToken(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'رمز المصادقة غير صالح أو منتهي الصلاحية' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (requiredRole && !authService.hasPermission(user.role, requiredRole)) {
      return new Response(JSON.stringify({ error: 'ليس لديك صلاحية للوصول إلى هذا المورد' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return { user, token };
  }
}
