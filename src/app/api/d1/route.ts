import '@/lib/setimmediate-polyfill';

import { NextResponse } from 'next/server';
import * as D1Actions from '@/lib/d1-actions';
import { getCloudflareEnvRecord } from '@/lib/runtime-env';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { getCookieFromRequest } from '@/lib/http-cookies';

const allowed: Record<string, (...args: any[]) => Promise<any>> = {
  // Diagnostics
  d1Ping: D1Actions.d1Ping,
  listTables: D1Actions.listTables,

  getWorkers: D1Actions.getWorkers,
  getResidences: D1Actions.getResidences,
  getOccupants: D1Actions.getOccupants,
  getCompanies: D1Actions.getCompanies,
  getContracts: D1Actions.getContracts,
  getInvoices: D1Actions.getInvoices,
  getHistory: D1Actions.getHistory,
  getTransferRequests: D1Actions.getTransferRequests,
  getNotifications: D1Actions.getNotifications,
  getInventory: D1Actions.getInventory,
  getInventoryCategories: D1Actions.getInventoryCategories,
  upsertInventoryCategories: D1Actions.upsertInventoryCategories,
  renameInventoryCategory: D1Actions.renameInventoryCategory,
  getInventoryTransactions: D1Actions.getInventoryTransactions,
  createInventoryItem: D1Actions.createInventoryItem,
  updateInventoryItem: D1Actions.updateInventoryItem,
  deleteInventoryItem: D1Actions.deleteInventoryItem,
  issueStock: D1Actions.issueStock,
  transferStock: D1Actions.transferStock,
  reconcileStock: D1Actions.reconcileStock,
  getUsers: D1Actions.getUsers,
  getServiceOrders: D1Actions.getServiceOrders,
  createMRV: D1Actions.createMRV,
  createMRVRequest: D1Actions.createMRVRequest,
  approveMRVRequest: D1Actions.approveMRVRequest,
  createResidence: D1Actions.createResidence,
  updateResidence: D1Actions.updateResidence,
  createWorker: D1Actions.createWorker,
  updateWorker: D1Actions.updateWorker,
  deleteWorker: D1Actions.deleteWorker,
  createTransferRequest: D1Actions.createTransferRequest,
  updateTransferRequest: D1Actions.updateTransferRequest,
  checkInWorker: D1Actions.checkInWorker,
  checkOutWorker: D1Actions.checkOutWorker,
  createCompany: D1Actions.createCompany,
  updateCompany: D1Actions.updateCompany,
  deleteCompany: D1Actions.deleteCompany,
  getUser: D1Actions.getUser,
  getUserByEmail: D1Actions.getUserByEmail,
  updateUser: D1Actions.updateUser,
  createUser: D1Actions.createUser,
  setUserPasswordHash: D1Actions.setUserPasswordHash,
  setUserPassword: D1Actions.setUserPassword,
  createServiceOrder: D1Actions.createServiceOrder,
  receiveServiceOrder: D1Actions.receiveServiceOrder,

  // Maintenance requests
  createMaintenanceRequest: D1Actions.createMaintenanceRequest,
  updateMaintenanceRequest: D1Actions.updateMaintenanceRequest,
  getMaintenanceRequests: D1Actions.getMaintenanceRequests,
  assignMaintenance: D1Actions.assignMaintenance,

  // Orders
  getOrders: D1Actions.getOrders,
  getOrder: D1Actions.getOrder,
  createOrder: D1Actions.createOrder,
  approveOrder: D1Actions.approveOrder,
  rejectOrder: D1Actions.rejectOrder,
  updateOrderStatus: D1Actions.updateOrderStatus,

  // Notifications
  createNotification: D1Actions.createNotification,
  markAsRead: D1Actions.markAsRead,
  deleteNotification: D1Actions.deleteNotification,
  getUserNotifications: D1Actions.getUserNotifications,

  // Audit
  createAuditLog: D1Actions.createAuditLog,
  getAuditLogs: D1Actions.getAuditLogs,

  // Feedback
  createFeedback: D1Actions.createFeedback,
  updateFeedback: D1Actions.updateFeedback,
  getFeedback: D1Actions.getFeedback,
};

export async function POST(req: Request) {
  const requestId = (() => {
    try {
      // Edge runtime provides WebCrypto
      return crypto.randomUUID();
    } catch {
      return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
  })();

  let actionName: string | null = null;

  try {
    // Auth gate: accept either Cloudflare Access JWT assertion header (when Access is in front)
    // or the app's session cookie (access_token).
    const accessHeader = req.headers.get('cf-access-jwt-assertion') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    let accessToken = accessHeader;
    if (!accessToken) {
      try {
        const cookieStore = await cookies();
        accessToken = cookieStore.get('access_token')?.value || '';
      } catch {
        // ignore cookie access errors
      }
    }
    if (!accessToken) {
      accessToken = getCookieFromRequest(req, 'access_token') || '';
    }
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify only app JWT cookies; Cloudflare Access header is considered trusted at the edge.
    if (!accessHeader) {
      try {
        await verifyAccessToken(accessToken);
      } catch (e: any) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get env from request context
    const env = await getCloudflareEnvRecord();
    if (!env || !env.DB) {
      const errorMsg = process.env.NODE_ENV === 'production'
        ? 'D1 binding not available. Please verify the D1 database binding is linked in Cloudflare Pages Settings > Functions > D1 Bindings. See CLOUDFLARE_PAGES_DEPLOYMENT.md for setup instructions.'
        : 'D1 binding not available. If running locally, start the app with `npm run dev:d1` (Cloudflare Pages dev) so `getRequestContext().env.DB` is present.';
      
      return NextResponse.json(
        {
          ok: false,
          error: errorMsg,
          hint: 'Ensure D1 binding "DB" is configured in your Pages project settings.'
        },
        { status: 503 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body', requestId }, { status: 400 });
    }

    const { action, args } = body ?? {};
    actionName = typeof action === 'string' ? action : null;
    if (!action || typeof action !== 'string' || !(action in allowed)) {
      return NextResponse.json({ ok: false, error: 'Invalid action', requestId }, { status: 400 });
    }
    const fn = allowed[action];
    
    // Pass env as first argument to all D1 actions
    const actionArgs = Array.isArray(args) ? args : [args];
    const res = await fn(env, ...actionArgs);
    
    return NextResponse.json({ ok: true, result: res, requestId });
  } catch (e: any) {
    // Log full error including possible nested cause for Drizzle/D1 errors
    try { console.error('D1 API error:', e?.message || e); } catch {}
    try { if (e && e.cause) console.error('D1 API cause:', e.cause); } catch {}
    try { console.error(e); } catch {}
    const errMsg = (e?.message || String(e)) + (e?.cause && e.cause?.message ? ` -- cause: ${e.cause.message}` : '');
    return NextResponse.json(
      {
        ok: false,
        error: errMsg,
        action: actionName,
        requestId,
      },
      { status: 500 }
    );
  }
}


export const runtime = 'edge';
