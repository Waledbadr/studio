/**
 * نسخة محلية مبسطة من AuthService للتطوير
 * تستخدم SQLite محلي بدلاً من Cloudflare D1
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'maintenance';
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  user: Omit<User, 'password_hash'>;
}

// المستخدمين التجريبيين (كما هم في قاعدة البيانات)
const testUsers: User[] = [
  {
    id: 'dev-admin-123',
    name: 'مدير التطوير',
    email: 'dev@estatecare.com',
    role: 'admin',
    password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-001',
    name: 'أحمد محمد',
    email: 'ahmed@test.com',
    role: 'user',
    password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-002',
    name: 'فاطمة علي',
    email: 'fatima@test.com',
    role: 'manager',
    password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'tech-001',
    name: 'محمد التقني',
    email: 'tech@test.com',
    role: 'maintenance',
    password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// وظيفة تشفير بسيطة متوافقة مع قيم المستخدمين التجريبية (SHA-256 للرمز مباشرة)
async function hashPassword(password: string): Promise<string> {
  try {
    // Use Web Crypto API which is available in both Node.js and Edge Runtime
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Hash password error:', error);
    // Fallback: simple hash for development
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}

// JWT بسيط
// Base64 helpers compatible with Node and Edge
function base64Encode(str: string): string {
  try {
    // Try using btoa (available in browsers and Edge Runtime)
    return btoa(str);
  } catch {
    // Fallback for Node.js
    return Buffer.from(str, 'utf8').toString('base64');
  }
}

function base64Decode(b64: string): string {
  try {
    // Try using atob (available in browsers and Edge Runtime)
    return atob(b64);
  } catch {
    // Fallback for Node.js
    return Buffer.from(b64, 'base64').toString('utf8');
  }
}

function generateJWT(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 أيام
  };

  const header = base64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = base64Encode(JSON.stringify(payload));
  const signature = base64Encode('dev-secret' + header + encodedPayload).substring(0, 32);

  return `${header}.${encodedPayload}.${signature}`;
}

function verifyJWT(token: string): any {
  try {
    const [header, payload, signature] = token.split('.');
    
    const expectedSignature = base64Encode('dev-secret' + header + payload).substring(0, 32);
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    const decodedPayload = JSON.parse(base64Decode(payload));
    
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return decodedPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export class LocalAuthService {
  async login(credentials: LoginCredentials): Promise<AuthToken | null> {
    try {
      // البحث عن المستخدم
      const user = testUsers.find(u => u.email === credentials.email && u.is_active);
      console.log('[AuthLocal] Login attempt for', credentials.email, 'userFound:', !!user);
      if (!user) {
        return null;
      }

      // التحقق من كلمة المرور
      const isPasswordValid = await verifyPassword(credentials.password, user.password_hash);
      console.log('[AuthLocal] Password valid:', isPasswordValid);
      if (!isPasswordValid) {
        return null;
      }

      // إنشاء JWT Token
      const token = generateJWT(user);
      console.log('[AuthLocal] Token generated');

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

  async verifyToken(token: string): Promise<Omit<User, 'password_hash'> | null> {
    try {
      const payload = verifyJWT(token);
      
      // البحث عن المستخدم
      const user = testUsers.find(u => u.id === payload.userId && u.is_active);
      if (!user) {
        return null;
      }

      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('خطأ في التحقق من التوكن:', error);
      return null;
    }
  }

  async register(userData: { name: string; email: string; password: string; role?: string }): Promise<AuthToken | null> {
    try {
      // التحقق من عدم وجود المستخدم
      const existingUser = testUsers.find(u => u.email === userData.email);
      if (existingUser) {
        return null;
      }

      // إنشاء مستخدم جديد
      const hashedPassword = await hashPassword(userData.password);
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: (userData.role as any) || 'user',
        password_hash: hashedPassword,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // إضافة للمصفوفة (في الواقع سيتم حفظه في قاعدة البيانات)
      testUsers.push(newUser);

      // إنشاء التوكن
      const token = generateJWT(newUser);

      const { password_hash, ...userWithoutPassword } = newUser;
      return {
        token,
        user: userWithoutPassword
      };
    } catch (error) {
      console.error('خطأ في التسجيل:', error);
      return null;
    }
  }
}
