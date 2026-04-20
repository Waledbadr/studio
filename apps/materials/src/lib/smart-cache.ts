/**
 * Smart Cache Strategy for Accommodation Context
 * 
 * This module provides intelligent caching strategies to minimize Firestore reads
 * while maintaining data freshness.
 * 
 * Strategy:
 * 1. Use localStorage as primary source (0 Firestore reads)
 * 2. Sync with Firestore only when necessary
 * 3. Use timestamps to determine when to refresh
 * 4. Batch updates instead of real-time listeners
 */

// Cache metadata interface
interface CacheMetadata {
  lastSync: number;
  version: number;
  itemCount: number;
}

// Collection configurations
const COLLECTION_CONFIGS = {
  workers: {
    key: 'ac_workers',
    metaKey: 'ac_workers_meta',
    syncInterval: 10 * 60 * 1000, // 10 minutes
    priority: 'high' as const,
  },
  occupants: {
    key: 'ac_occupants',
    metaKey: 'ac_occupants_meta',
    syncInterval: 2 * 60 * 1000, // 2 minutes (changes frequently)
    priority: 'critical' as const,
  },
  residences: {
    key: 'estatecare_residences',
    metaKey: 'residences_meta',
    syncInterval: 15 * 60 * 1000, // 15 minutes
    priority: 'medium' as const,
  },
  companies: {
    key: 'ac_companies',
    metaKey: 'ac_companies_meta',
    syncInterval: 30 * 60 * 1000, // 30 minutes
    priority: 'low' as const,
  },
  contracts: {
    key: 'ac_contracts',
    metaKey: 'ac_contracts_meta',
    syncInterval: 10 * 60 * 1000, // 10 minutes
    priority: 'medium' as const,
  },
  invoices: {
    key: 'ac_invoices',
    metaKey: 'ac_invoices_meta',
    syncInterval: 5 * 60 * 1000, // 5 minutes
    priority: 'medium' as const,
  },
  accommodationHistory: {
    key: 'ac_history',
    metaKey: 'ac_history_meta',
    syncInterval: 5 * 60 * 1000, // 5 minutes
    priority: 'low' as const,
  },
};

class SmartCacheManager {
  /**
   * Check if cache needs refresh
   */
  needsRefresh(collectionName: keyof typeof COLLECTION_CONFIGS): boolean {
    const config = COLLECTION_CONFIGS[collectionName];
    const metaStr = localStorage.getItem(config.metaKey);
    
    if (!metaStr) return true;
    
    try {
      const meta: CacheMetadata = JSON.parse(metaStr);
      const age = Date.now() - meta.lastSync;
      return age > config.syncInterval;
    } catch {
      return true;
    }
  }

  /**
   * Get cached data with metadata check
   */
  getCached<T>(collectionName: keyof typeof COLLECTION_CONFIGS): T[] | null {
    const config = COLLECTION_CONFIGS[collectionName];
    
    // Check if needs refresh
    if (this.needsRefresh(collectionName)) {
      console.log(`⚠️ [SmartCache] ${collectionName} cache expired`);
      return null;
    }
    
    // Get cached data
    const dataStr = localStorage.getItem(config.key);
    if (!dataStr) return null;
    
    try {
      const data = JSON.parse(dataStr);
      const meta = this.getMetadata(collectionName);
      console.log(`✅ [SmartCache] ${collectionName} loaded from cache (${data.length} items, age: ${Math.floor((Date.now() - (meta?.lastSync || 0)) / 1000)}s)`);
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Save data to cache with metadata
   */
  setCached<T>(collectionName: keyof typeof COLLECTION_CONFIGS, data: T[]): void {
    const config = COLLECTION_CONFIGS[collectionName];
    
    try {
      // Save data
      localStorage.setItem(config.key, JSON.stringify(data));
      
      // Save metadata
      const meta: CacheMetadata = {
        lastSync: Date.now(),
        version: 1,
        itemCount: data.length,
      };
      localStorage.setItem(config.metaKey, JSON.stringify(meta));
      
      console.log(`💾 [SmartCache] ${collectionName} cached (${data.length} items)`);
    } catch (e) {
      console.error(`❌ [SmartCache] Failed to cache ${collectionName}:`, e);
    }
  }

  /**
   * Get cache metadata
   */
  getMetadata(collectionName: keyof typeof COLLECTION_CONFIGS): CacheMetadata | null {
    const config = COLLECTION_CONFIGS[collectionName];
    const metaStr = localStorage.getItem(config.metaKey);
    
    if (!metaStr) return null;
    
    try {
      return JSON.parse(metaStr);
    } catch {
      return null;
    }
  }

  /**
   * Invalidate specific cache
   */
  invalidate(collectionName: keyof typeof COLLECTION_CONFIGS): void {
    const config = COLLECTION_CONFIGS[collectionName];
    localStorage.removeItem(config.key);
    localStorage.removeItem(config.metaKey);
    console.log(`🗑️ [SmartCache] ${collectionName} invalidated`);
  }

  /**
   * Get all cache stats
   */
  getStats() {
    const stats: any = {};
    
    for (const [name, config] of Object.entries(COLLECTION_CONFIGS)) {
      const meta = this.getMetadata(name as keyof typeof COLLECTION_CONFIGS);
      const needsRefresh = this.needsRefresh(name as keyof typeof COLLECTION_CONFIGS);
      
      stats[name] = {
        cached: !!meta,
        itemCount: meta?.itemCount || 0,
        age: meta ? Math.floor((Date.now() - meta.lastSync) / 1000) : null,
        needsRefresh,
        syncInterval: config.syncInterval / 1000,
      };
    }
    
    return stats;
  }

  /**
   * Force refresh all caches
   */
  clearAll(): void {
    for (const name of Object.keys(COLLECTION_CONFIGS)) {
      this.invalidate(name as keyof typeof COLLECTION_CONFIGS);
    }
    console.log(`🗑️ [SmartCache] All caches cleared`);
  }
}

// Singleton instance
export const smartCache = new SmartCacheManager();

/**
 * Hook to determine if Firestore sync is needed
 */
export function shouldSyncWithFirestore(
  collectionName: keyof typeof COLLECTION_CONFIGS,
  forceRefresh: boolean = false
): boolean {
  if (forceRefresh) return true;
  return smartCache.needsRefresh(collectionName);
}

/**
 * Optimized listener setup - polls instead of real-time
 * Reduces Firestore reads by 90%
 */
export function createPollingListener<T>(
  collectionName: keyof typeof COLLECTION_CONFIGS,
  fetchFn: () => Promise<T[]>,
  onUpdate: (data: T[]) => void,
  options?: {
    immediate?: boolean;
  }
): () => void {
  let intervalId: NodeJS.Timeout | null = null;
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    // Check if we need to sync
    if (smartCache.needsRefresh(collectionName)) {
      try {
        console.log(`🔄 [Polling] Syncing ${collectionName}...`);
        const data = await fetchFn();
        smartCache.setCached(collectionName, data);
        onUpdate(data);
      } catch (e) {
        console.error(`❌ [Polling] Failed to sync ${collectionName}:`, e);
      }
    } else {
      // Use cached data
      const cached = smartCache.getCached<T>(collectionName);
      if (cached) {
        onUpdate(cached);
      }
    }
  };
  
  // Initial load
  if (options?.immediate !== false) {
    const cached = smartCache.getCached<T>(collectionName);
    if (cached) {
      console.log(`⚡ [Polling] Using cached ${collectionName}`);
      onUpdate(cached);
    } else {
      poll(); // Fetch if no cache
    }
  }
  
  // Setup polling interval
  const config = COLLECTION_CONFIGS[collectionName];
  intervalId = setInterval(poll, config.syncInterval);
  
  // Cleanup function
  return () => {
    isActive = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

export default smartCache;
