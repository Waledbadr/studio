/**
 * Server-side in-memory cache to drastically reduce Firestore reads
 * 
 * This cache stores collections data in memory with TTL (Time To Live)
 * to avoid hitting Firestore for every request.
 * 
 * Target: Reduce 200K reads/day to under 50K (75% reduction)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class ServerCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  // Default TTL: 5 minutes (adjust based on data freshness needs)
  private defaultTTL = 5 * 60 * 1000;
  
  // Collection-specific TTLs
  private collectionTTLs: Record<string, number> = {
    'workers': 10 * 60 * 1000,      // 10 min - workers don't change often
    'residences': 15 * 60 * 1000,   // 15 min - buildings rarely change
    'companies': 30 * 60 * 1000,    // 30 min - companies very stable
    'contracts': 10 * 60 * 1000,    // 10 min
    'invoices': 5 * 60 * 1000,      // 5 min - needs fresher data
    'occupants': 2 * 60 * 1000,     // 2 min - changes frequently
    'accommodationHistory': 5 * 60 * 1000, // 5 min
  };

  /**
   * Get data from cache or fetch function
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);
    
    // Return cached data if valid
    if (cached && (now - cached.timestamp) < cached.ttl) {
      console.log(`✅ [Cache HIT] ${key} (age: ${Math.floor((now - cached.timestamp) / 1000)}s)`);
      return cached.data as T;
    }
    
    // Fetch fresh data
    console.log(`⚠️ [Cache MISS] ${key} - fetching from Firestore...`);
    const data = await fetchFn();
    
    // Store in cache
    const ttl = customTTL || this.getCollectionTTL(key) || this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
    });
    
    console.log(`💾 [Cache SET] ${key} (TTL: ${ttl / 1000}s)`);
    return data;
  }

  /**
   * Get collection-specific TTL
   */
  private getCollectionTTL(key: string): number | undefined {
    for (const [collection, ttl] of Object.entries(this.collectionTTLs)) {
      if (key.includes(collection)) {
        return ttl;
      }
    }
    return undefined;
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ [Cache INVALIDATE] ${key}`);
  }

  /**
   * Invalidate cache by pattern (e.g., all keys containing 'workers')
   */
  invalidatePattern(pattern: string): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`🗑️ [Cache INVALIDATE PATTERN] ${pattern} (${count} keys)`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ [Cache CLEAR] All cache cleared (${size} keys)`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    return {
      totalKeys: entries.length,
      entries: entries.map(([key, entry]) => ({
        key,
        age: Math.floor((now - entry.timestamp) / 1000),
        ttl: entry.ttl / 1000,
        valid: (now - entry.timestamp) < entry.ttl,
      })),
    };
  }

  /**
   * Automatic cleanup of expired entries (run periodically)
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`🧹 [Cache CLEANUP] Removed ${removed} expired entries`);
    }
    
    return removed;
  }
}

// Singleton instance
const serverCache = new ServerCache();

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    serverCache.cleanup();
  }, 5 * 60 * 1000);
}

export default serverCache;

/**
 * Helper function to create cache-friendly collection queries
 */
export function createCachedQuery<T>(
  collection: string,
  queryFn: () => Promise<T>,
  options?: {
    ttl?: number;
    keyParams?: string[]; // Additional params to make key unique
  }
): () => Promise<T> {
  return async () => {
    const keyParts = [collection, ...(options?.keyParams || [])];
    const cacheKey = keyParts.join(':');
    
    return serverCache.get(cacheKey, queryFn, options?.ttl);
  };
}

/**
 * Export cache instance for manual control
 */
export { serverCache };
