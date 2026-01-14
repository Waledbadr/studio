import { NextResponse } from 'next/server';
import * as D1Actions from '@/lib/d1-actions';

const allowed: Record<string, (...args: any[]) => Promise<any>> = {
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
  getUser: D1Actions.getUser,
  updateUser: D1Actions.updateUser,
  createUser: D1Actions.createUser,
  createServiceOrder: D1Actions.createServiceOrder,
  receiveServiceOrder: D1Actions.receiveServiceOrder,

  // Maintenance requests
  createMaintenanceRequest: D1Actions.createMaintenanceRequest,
  updateMaintenanceRequest: D1Actions.updateMaintenanceRequest,
  getMaintenanceRequests: D1Actions.getMaintenanceRequests,
  assignMaintenance: D1Actions.assignMaintenance,

  // Orders
  getOrders: D1Actions.getOrders,
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
  try {
    const body = await req.json();
    const { action, args } = body;
    if (!action || typeof action !== 'string' || !(action in allowed)) {
      return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
    }
    const fn = allowed[action];
    const res = await fn(...(Array.isArray(args) ? args : [args]));
    return NextResponse.json({ ok: true, result: res });
  } catch (e: any) {
    console.error('D1 API error', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
