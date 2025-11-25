/**
 * Cache Management API
 * 
 * Endpoints:
 * GET /api/cache/stats - Get cache statistics
 * POST /api/cache/clear - Clear all caches
 * POST /api/cache/invalidate - Invalidate specific cache
 */

import { NextResponse } from 'next/server';
import serverCache from '@/lib/server-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/cache/stats
export async function GET() {
  try {
    const stats = serverCache.getStats();
    
    return NextResponse.json({
      ok: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Cache stats error:', e);
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}

// POST /api/cache/clear
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, key, pattern } = body;
    
    if (action === 'clear') {
      // Clear all cache
      serverCache.clear();
      return NextResponse.json({
        ok: true,
        message: 'All cache cleared',
      });
    }
    
    if (action === 'invalidate') {
      if (pattern) {
        // Invalidate by pattern
        serverCache.invalidatePattern(pattern);
        return NextResponse.json({
          ok: true,
          message: `Cache invalidated for pattern: ${pattern}`,
        });
      }
      
      if (key) {
        // Invalidate specific key
        serverCache.invalidate(key);
        return NextResponse.json({
          ok: true,
          message: `Cache invalidated for key: ${key}`,
        });
      }
      
      return NextResponse.json(
        { ok: false, error: 'key or pattern required' },
        { status: 400 }
      );
    }
    
    if (action === 'cleanup') {
      // Manual cleanup of expired entries
      const removed = serverCache.cleanup();
      return NextResponse.json({
        ok: true,
        message: `Cleanup complete, removed ${removed} expired entries`,
        removed,
      });
    }
    
    return NextResponse.json(
      { ok: false, error: 'Invalid action. Use: clear, invalidate, or cleanup' },
      { status: 400 }
    );
  } catch (e) {
    console.error('Cache management error:', e);
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}
