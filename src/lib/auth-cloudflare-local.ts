/**
 * Mock Cloudflare Environment for local development
 * This simulates D1 Database and other Cloudflare bindings locally
 */

import { AuthService } from './auth';

// Mock D1 Database
class MockD1Database {
  private storage = new Map<string, any>();

  prepare(query: string) {
    return {
      bind: (...params: any[]) => ({
        first: async () => {
          // Simulate database queries
          if (query.includes('SELECT * FROM users WHERE email = ?')) {
            const email = params[0];
            return this.getMockUser(email);
          }
          if (query.includes('SELECT * FROM sessions WHERE token = ?')) {
            const token = params[0];
            return this.getMockSession(token);
          }
          return null;
        },
        all: async () => ({
          results: [],
          success: true
        }),
        run: async () => ({
          success: true,
          meta: { changes: 1 }
        })
      })
    };
  }

  private getMockUser(email: string) {
    const users = {
      'dev@estatecare.com': {
        id: 'cf-user-1',
        name: 'مدير النظام',
        email: 'dev@estatecare.com',
        role: 'admin',
        password_hash: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', // admin123
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      'manager@estatecare.com': {
        id: 'cf-user-2',
        name: 'مدير العقارات',
        email: 'manager@estatecare.com',
        role: 'manager',
        password_hash: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    return users[email as keyof typeof users] || null;
  }

  private getMockSession(token: string) {
    // Simple session validation for demo
    if (token && token.startsWith('cf-')) {
      return {
        id: 'session-1',
        user_id: 'cf-user-1',
        token: token,
        is_active: true,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      };
    }
    return null;
  }
}

// Mock Cloudflare Environment
export class MockCloudflareEnv {
  DB = new MockD1Database();
  KV = {
    get: async (key: string) => null,
    put: async (key: string, value: string) => {},
    delete: async (key: string) => {}
  };
  BUCKET = {
    put: async (key: string, value: any) => {},
    get: async (key: string) => null,
    delete: async (key: string) => {}
  };
}

// Create Cloudflare-compatible Auth Service for local use
export class LocalCloudflareAuthService extends AuthService {
  constructor() {
    super(new MockCloudflareEnv() as any);
  }

  // Override methods that require actual D1 database calls
  async login(credentials: { email: string; password: string }) {
    console.log('[CloudflareAuth] Login attempt for', credentials.email);
    
    // Use the parent class method with mock environment
    const result = await super.login(credentials);
    
    if (result) {
      console.log('[CloudflareAuth] Login successful for', credentials.email);
      console.log('[CloudflareAuth] User role:', result.user.role);
    } else {
      console.log('[CloudflareAuth] Login failed for', credentials.email);
    }
    
    return result;
  }
}