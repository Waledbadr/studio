async function rpc(action: string, args?: any, _retry?: boolean) {
  const res = await fetch('/api/d1', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, args })
  });

  if (res.status === 401 && !_retry) {
    // Attempt a single silent refresh (access tokens are short-lived).
    try {
      const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      const j: any = await r.json().catch(() => ({}));
      if (r.ok && j?.ok) {
        return await rpc(action, args, true);
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
  return json.result;
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
export function getUserByEmail(email: string) { return rpc('getUserByEmail', [email]); }
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
