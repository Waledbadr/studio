async function rpc(action: string, args?: any) {
  const res = await fetch('/api/d1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, args })
  });
  let json: any = undefined;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error('Cloudflare D1 RPC failed: invalid JSON response');
  }
  if (!res.ok) {
    const msg = (json && json.error) ? json.error : `HTTP ${res.status}`;
    throw new Error(`Cloudflare D1 error: ${msg}`);
  }
  if (!json.ok) throw new Error(json.error || 'D1 RPC failed');
  return json.result;
}

export function getWorkers() { return rpc('getWorkers'); }
export function getResidences() { return rpc('getResidences'); }
export function getOccupants(residenceId?: string) { return rpc('getOccupants', [residenceId]); }
export function getCompanies() { return rpc('getCompanies'); }
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
