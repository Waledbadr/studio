// In-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();

// Pending requests map to prevent duplicate concurrent requests
const pendingRequests = new Map<string, Promise<any>>();

// Load cache from localStorage on init (browser only)
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('d1_cache');
    if (saved) {
      const parsed = JSON.parse(saved);
      const now = Date.now();
      // Only restore non-expired entries
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        if (value.expires > now) {
          cache.set(key, value);
        }
      });
      console.log(`[D1 Cache] Restored ${cache.size} entries from localStorage`);
    }
  } catch (e) {
    console.warn('[D1 Cache] Failed to restore from localStorage:', e);
  }
}

// Save cache to localStorage periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    try {
      const obj: any = {};
      cache.forEach((value, key) => {
        obj[key] = value;
      });
      localStorage.setItem('d1_cache', JSON.stringify(obj));
    } catch (e) {
      // Quota exceeded or other error - clear cache
      cache.clear();
      localStorage.removeItem('d1_cache');
    }
  }, 30000); // Save every 30 seconds
}

// Cache configuration (in milliseconds)
const CACHE_TIMES = {
  workers: 300000,       // 5 minutes (was 30s)
  residences: 600000,    // 10 minutes (was 1m)
  occupants: 120000,     // 2 minutes (was 15s)
  companies: 1800000,    // 30 minutes (was 5m)
  notifications: 180000, // 3 minutes
  inventory: 240000,     // 4 minutes
  default: 120000        // 2 minutes (was 10s)
};

function getCacheTTL(action: string): number {
  if (action.includes('Worker')) return CACHE_TIMES.workers;
  if (action.includes('Residence')) return CACHE_TIMES.residences;
  if (action.includes('Occupant')) return CACHE_TIMES.occupants;
  if (action.includes('Compan')) return CACHE_TIMES.companies;
  if (action.includes('Notification')) return CACHE_TIMES.notifications;
  if (action.includes('Inventory')) return CACHE_TIMES.inventory;
  if (action.includes('User')) return CACHE_TIMES.workers;
  if (action.includes('Contract')) return CACHE_TIMES.residences;
  if (action.includes('Invoice')) return CACHE_TIMES.residences;
  if (action.includes('Transfer')) return CACHE_TIMES.occupants;
  return CACHE_TIMES.default;
}

async function rpc(action: string, args?: any, _retry?: boolean): Promise<any> {
  // Generate cache key
  const cacheKey = `${action}:${JSON.stringify(args || {})}`;
  
  // Check cache first (skip for write operations)
  if (!action.toLowerCase().includes('create') && 
      !action.toLowerCase().includes('update') && 
      !action.toLowerCase().includes('delete')) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      console.log(`[D1 Cache] Hit for ${action}`);
      return cached.data;
    }
    
    // Check if request is already pending
    const pending = pendingRequests.get(cacheKey);
    if (pending) {
      console.log(`[D1 Cache] Waiting for pending request: ${action}`);
      return await pending;
    }
  }
  
  console.log(`[D1] Fetching ${action} from DB...`);
  
  // Create the fetch promise and store it
  const fetchPromise: Promise<any> = (async (): Promise<any> => {
    const res = await fetch('/api/d1', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, args })
    });

  if (res.status === 401 && !_retry) {
    // Attempt a single silent refresh (access tokens are short-lived).
    try {
      const canRefresh = (() => {
        try {
          if (typeof window === 'undefined') return false;
          return window.sessionStorage?.getItem('ec_had_session') === '1' || window.localStorage?.getItem('ec_had_session') === '1';
        } catch {
          return false;
        }
      })();
      if (canRefresh) {
        const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
        const j: any = await r.json().catch(() => ({}));
        if (r.ok && j?.ok) {
          return await rpc(action, args, true);
        }
      }
    } catch {
      // ignore refresh errors; fall through to original 401 handling
    }
  }
  let json: any = undefined;
  try {
    json = await res.json();
  } catch (e) {
    let bodyText = '';
    try { bodyText = await res.text(); } catch {}
    const hint = bodyText ? ` Response: ${bodyText.slice(0, 200)}` : '';
    throw new Error(`Cloudflare D1 RPC failed: invalid JSON response (HTTP ${res.status}).${hint}`);
  }
  if (!res.ok) {
    const msg = (json && json.error) ? json.error : `HTTP ${res.status}`;
    throw new Error(`Cloudflare D1 error: ${msg}`);
  }
  if (!json.ok) throw new Error(json.error || 'D1 RPC failed');
  
  // Cache the result (except for write operations)
  if (!action.toLowerCase().includes('create') && 
      !action.toLowerCase().includes('update') && 
      !action.toLowerCase().includes('delete')) {
    const ttl = getCacheTTL(action);
    cache.set(cacheKey, {
      data: json.result,
      expires: Date.now() + ttl
    });
    
    // Clean old cache entries periodically
    if (cache.size > 150) {
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (value.expires < now) cache.delete(key);
      }
    }
  }
  
  return json.result;
  })();
  
  // Store pending request
  if (!action.toLowerCase().includes('create') && 
      !action.toLowerCase().includes('update') && 
      !action.toLowerCase().includes('delete')) {
    pendingRequests.set(cacheKey, fetchPromise);
  }
  
  try {
    const result = await fetchPromise;
    return result;
  } finally {
    // Remove from pending requests
    pendingRequests.delete(cacheKey);
  }
}

// Cache management utilities
export function clearD1Cache() {
  const size = cache.size;
  cache.clear();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('d1_cache');
  }
  console.log(`[D1 Cache] Cleared ${size} entries`);
}

export function getD1CacheStats() {
  const now = Date.now();
  const valid = Array.from(cache.values()).filter(v => v.expires > now).length;
  const expired = cache.size - valid;
  return { total: cache.size, valid, expired };
}

export function getWorkers() { return rpc('getWorkers'); }
export function d1Ping() { return rpc('d1Ping'); }
export function listTables() { return rpc('listTables'); }
export function getResidences() { return rpc('getResidences'); }
export function getOccupants(residenceId?: string) { return rpc('getOccupants', [residenceId]); }
export function getCompanies() { return rpc('getCompanies'); }
export function createCompany(data: any) { return rpc('createCompany', [data]); }
export function updateCompany(id: string, data: any) { return rpc('updateCompany', [id, data]); }
export function deleteCompany(id: string) { return rpc('deleteCompany', [id]); }
export function getContracts() { return rpc('getContracts'); }
export function getInvoices() { return rpc('getInvoices'); }
export function getHistory() { return rpc('getHistory'); }
export function getTransferRequests() { return rpc('getTransferRequests'); }
export function getNotifications() { return rpc('getNotifications'); }
export function getInventory() { return rpc('getInventory'); }
export function getUsers() { return rpc('getUsers'); }
export function getUser(id: string) { return rpc('getUser', [id]); }

// Local storage fallback for user functions
async function localGetUserByEmail(email: string): Promise<any> {
  try {
    const users = localStorage.getItem('estatecare_users');
    if (!users) return null;
    const parsed = JSON.parse(users);
    const normalized = String(email).trim().toLowerCase();
    return parsed.find((u: any) => String(u.email).trim().toLowerCase() === normalized) || null;
  } catch {
    return null;
  }
}

async function localSetUserPassword(id: string, password: string): Promise<any> {
  try {
    const users = localStorage.getItem('estatecare_users');
    const parsed = users ? JSON.parse(users) : [];
    const user = parsed.find((u: any) => u.id === id);
    if (!user) throw new Error('User not found');
    
    // Fallback: Store plain password (not ideal, but for dev purposes)
    // In production, this would use bcrypt
    user.passwordHash = password;
    localStorage.setItem('estatecare_users', JSON.stringify(parsed));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as any)?.message || 'Failed to update password' };
  }
}

export async function getUserByEmail(email: string) {
  try {
    return await rpc('getUserByEmail', [email]);
  } catch (e: any) {
    // Fallback to local storage
    console.warn('D1 getUserByEmail failed, using local fallback:', e?.message);
    return await localGetUserByEmail(email);
  }
}

export async function setUserPassword(id: string, password: string) {
  try {
    return await rpc('setUserPassword', [id, password]);
  } catch (e: any) {
    // Fallback to local storage
    console.warn('D1 setUserPassword failed, using local fallback:', e?.message);
    return await localSetUserPassword(id, password);
  }
}

export function createUser(id: string, data: any) { return rpc('createUser', [id, data]); }
export function updateUser(id: string, data: any) { return rpc('updateUser', [id, data]); }
export function setUserPasswordHash(id: string, hash: string) { return rpc('setUserPasswordHash', [id, hash]); }
export function getServiceOrders() { return rpc('getServiceOrders'); }
export function getInventoryCategories() { return rpc('getInventoryCategories'); }
export function upsertInventoryCategories(names: string[]) { return rpc('upsertInventoryCategories', [names]); }
export function renameInventoryCategory(oldName: string, newName: string) { return rpc('renameInventoryCategory', [oldName, newName]); }
export function createInventoryItem(data: any) { return rpc('createInventoryItem', [data]); }
export function updateInventoryItem(id: string, data: any) { return rpc('updateInventoryItem', [id, data]); }
export function deleteInventoryItem(id: string) { return rpc('deleteInventoryItem', [id]); }
export function issueStock(payload: any) { return rpc('issueStock', [payload]); }
export function createMRV(payload: any) { return rpc('createMRV', [payload]); }
export function approveMRVRequest(requestId: string, approverId: string) { return rpc('approveMRVRequest', [requestId, approverId]); }
export function createResidence(data: any) { return rpc('createResidence', [data]); }
export function updateResidence(id: string, data: any) { return rpc('updateResidence', [id, data]); }
export function deleteResidence(id: string) { return rpc('deleteResidence', [id]); }
export function createWorker(data: any) { return rpc('createWorker', [data]); }
export function updateWorker(id: string, data: any) { return rpc('updateWorker', [id, data]); }
export function deleteWorker(id: string) { return rpc('deleteWorker', [id]); }
export function createTransferRequest(tr: any) { return rpc('createTransferRequest', [tr]); }
export function updateTransferRequest(id: string, data: any) { return rpc('updateTransferRequest', [id, data]); }
export function checkInWorker(params: any) { return rpc('checkInWorker', [params]); }
export function checkOutWorker(params: any) { return rpc('checkOutWorker', [params]); }
export function createServiceOrder(payload: any) { return rpc('createServiceOrder', [payload]); }
export function receiveServiceOrder(orderId: string, updates: any[], receivedById: string, forceComplete?: boolean) { return rpc('receiveServiceOrder', [orderId, updates, receivedById, forceComplete]); }
export function transferStock(payload: any) { return rpc('transferStock', [payload]); }
export function reconcileStock(payload: any) { return rpc('reconcileStock', [payload]); }
export function createOrder(payload: any) { return rpc('createOrder', [payload]); }
export function approveOrder(orderId: string, approverId: string, approverName?: string) { return rpc('approveOrder', [orderId, approverId, approverName]); }
export function rejectOrder(orderId: string, approverId: string, reason?: string) { return rpc('rejectOrder', [orderId, approverId, reason]); }
export function updateOrderStatus(orderId: string, status: string) { return rpc('updateOrderStatus', [orderId, status]); }
export function getOrders() { return rpc('getOrders'); }
export function getOrder(id: string) { return rpc('getOrder', [id]); }
export function createMRVRequest(payload: any) { return rpc('createMRVRequest', [payload]); }
