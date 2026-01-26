"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/context/notifications-context';
import { useUsers } from '@/context/users-context';
import { getFiscalMonthPeriod } from '@/lib/fiscal-month-utils';
import { differenceInDays, isWithinInterval, max, min, parseISO, startOfDay, endOfDay } from 'date-fns';
import * as D1Client from '@/lib/d1-client';
import { db, auth } from '@/lib/platform';
import { collection, onSnapshot, getDocs, query, limit, startAfter, where, addDoc, doc, setDoc, updateDoc, getCountFromServer, getDoc, writeBatch, deleteDoc } from '@/lib/realtime-shim';
import { onAuthStateChanged } from '@/lib/auth-shim';

// Enable D1 mode only when explicitly enabled via NEXT_PUBLIC_USE_D1
const USE_D1 = process.env.NEXT_PUBLIC_USE_D1 === 'true';
const POLL_INTERVAL_MS = 7000; // Firestore polling window
const D1_POLL_INTERVAL_MS = 30000; // D1 polling window (reduce requests in Cloudflare)
const D1_SYNC_COOLDOWN_MS = 5000;
const D1_AUX_SYNC_INTERVAL_MS = 180000; // aux tables refresh (3 minutes)

export type Location = { lat: number; lng: number } | null;

export type Room = {
  id: string;
  name?: string;
  capacity?: number;
  occupied?: boolean;
  roomType?: "Worker" | "Supervisor" | "Engineer";
  spaceSqm?: number; // room area in sqm
  occupants?: string[]; // array of worker IDs
};

export type Floor = {
  id: string;
  name?: string;
  rooms?: Room[];
  facilities?: any[]; // Added for reporting
};

export type Building = {
  id: string;
  name?: string;
  floors?: Floor[];
  facilities?: any[]; // Added for reporting
};

export type Residence = {
  id: string;
  name: string;
  city?: string; // City name from Complex
  address?: string;
  location?: Location;
  managerId?: string; // Added managerId
  isEmergencyMode?: boolean; // Added isEmergencyMode
  buildings?: Building[]; // optional — some APIs return nested buildings/floors
  rooms?: Room[]; // fallback when buildings are not present
  facilities?: any[]; // Added for reporting
};

// New domain types
export type Worker = {
  id: string; // معرّف فريد في النظام
  name: string; // اسم العامل
  employeeId?: string; // رقم الموظف (مثل: 40097) - يمكن تكراره في شركات مختلفة
  idNumber?: string; // رقم الهوية الوطنية (مثل: 2059537999) - فريد لكل شخص
  nationality?: string; // الجنسية
  company?: string; // الشركة - لتمييز العمال بنفس الرقم الوظيفي
  role?: "Worker" | "Supervisor" | "Engineer";
  status?: "Active" | "Transferring" | "Vacation" | "Exit"; // NEW
  transferDestination?: string; // NEW: City or Location name when status is Transferring
};

export type Occupant = {
  id?: string; // Firestore Document ID
  workerId: string;
  residenceId: string;
  buildingId?: string;
  floorId?: string;
  roomId: string;
  since: string; // ISO date - Check-in date
  until?: string | null; // ISO date - Check-out date (null = still active)
  checkInBy?: string; // User ID who performed check-in
  checkOutBy?: string; // User ID who performed check-out
  checkoutType?: 'Transfer' | 'Exit' | 'Vacation' | 'Other'; // NEW
  transferCity?: string; // NEW
  notes?: string; // Optional notes about this occupancy
  isEmergency?: boolean; // Flag for emergency/override check-ins
};

// Historical record of all accommodation movements (immutable)
export type AccommodationHistory = {
  id: string; // Unique ID for this history entry
  workerId: string;
  workerName?: string; // Cached for faster queries
  workerNationality?: string;

  actionType: 'CHECK_IN' | 'CHECK_OUT' | 'TRANSFER' | 'SWAP'; // Type of action
  actionDate: string; // ISO date when action occurred
  actionBy: string; // User ID who performed the action
  actionByName?: string; // Cached user name

  // Location details
  residenceId: string;
  residenceName?: string; // Cached
  buildingId?: string;
  buildingName?: string;
  floorId?: string;
  floorName?: string;
  roomId: string;
  roomName?: string;

  // Transfer-specific fields
  fromResidenceId?: string; // For TRANSFER actions
  fromResidenceName?: string;
  fromRoomId?: string;
  fromRoomName?: string;
  toResidenceId?: string; // For TRANSFER actions
  toResidenceName?: string;
  toRoomId?: string;
  toRoomName?: string;

  // Swap-specific fields
  swappedWithWorkerId?: string; // For SWAP actions
  swappedWithWorkerName?: string;

  // Metadata
  reason?: string; // Reason for action (optional)
  notes?: string; // Additional notes
  isEmergency?: boolean; // Flag for emergency actions
  duration?: number; // Days stayed (calculated for CHECK_OUT)
  relatedTransferRequestId?: string; // Link to TransferRequest if applicable
  checkoutType?: 'Transfer' | 'Exit' | 'Vacation' | 'Other'; // Type of checkout

  createdAt?: string; // Timestamp when record was created
};

export type TransferRequest = {
  id: string;
  from?: { residenceId?: string; roomId?: string };
  to: { residenceId: string; roomId?: string };
  workerIds: string[]; // one or many
  requestedBy: string; // user id
  requestedAt: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  reviewedBy?: string;
  reviewedAt?: string;
  reason?: string;
};

export type Notification = {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  read?: boolean;
};

// New types for Companies, Contracts, and Invoices
export type Company = {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
};

export type Contract = {
  id: string;
  companyId: string;
  residenceId: string; // Legacy: single residence (kept for backward compatibility)
  residenceIds?: string[]; // New: array of residence IDs, or ['all'] for all residences
  startDate: string; // ISO date
  endDate: string; // ISO date
  ratePerPersonPerMonth: number;
  expectedWorkers?: number;
  status: "Active" | "Expired" | "Cancelled";
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
};

export type Invoice = {
  id: string;
  contractId: string;
  companyId: string;
  residenceId: string;
  month: string; // format: YYYY-MM
  startDate: string; // ISO date
  endDate: string; // ISO date
  numberOfWorkers: number;
  numberOfDays: number;
  ratePerPerson: number;
  totalAmount: number;
  status: "Draft" | "Pending" | "Paid" | "Overdue" | "Cancelled";
  generatedAt: string;
  paidAt?: string;
  pdfUrl?: string;
  notes?: string;
};

export type DashboardStats = {
  totalWorkers: number;
  assignedWorkers: number;
  unassignedWorkers: number;
  occupancyRate: number;
  activeContracts: number;
  totalCompanies: number;
  pendingTransfers: number;
  unpaidInvoices: number;
  overdueInvoices: number; // NEW
  residenceOccupancy: Record<string, number>; // residenceId -> count
  lastUpdated: number;
};

type AccommodationContextValue = {
  residences: Residence[];
  loading: boolean;
  refresh: () => Promise<void>;
  // new exports
  workers: Worker[];
  occupants: Occupant[];
  dashboardStats: DashboardStats | null; // NEW: Lightweight stats
  refreshDashboardStats: () => Promise<DashboardStats>; // NEW: Fetch stats efficiently
  autoArchiveOccupants: () => Promise<void>; // NEW: Auto cleanup
  accommodationHistory: AccommodationHistory[]; // NEW: Complete history of all movements
  transferRequests: TransferRequest[];
  notifications: Notification[];
  // new domain objects
  companies: Company[];
  contracts: Contract[];
  invoices: Invoice[];
  findWorkers: (q: string) => Worker[];

  // History queries
  getWorkerHistory: (workerId: string) => AccommodationHistory[];
  getRoomHistory: (residenceId: string, roomId: string) => AccommodationHistory[];
  getHistoryByDateRange: (startDate: string, endDate: string) => AccommodationHistory[];

  // Async History Fetching
  fetchWorkerHistory: (workerId: string) => Promise<AccommodationHistory[]>;
  fetchRoomHistory: (roomId: string) => Promise<AccommodationHistory[]>;

  // History Management
  deleteHistoryRecord: (historyId: string) => Promise<{ ok: boolean; error?: string }>;
  updateHistoryRecord: (historyId: string, updates: Partial<AccommodationHistory>) => Promise<{ ok: boolean; error?: string }>;
  undoLastAction: (workerId: string) => Promise<{ ok: boolean; error?: string; message?: string }>;

  // ⚡ Optimized Async Operations (Direct Firestore)
  findWorkerAsync: (queryStr: string) => Promise<Worker[]>;
  getWorkersByIds: (ids: string[]) => Promise<Worker[]>; // NEW
  getWorkerByIdOrEmployeeId: (identifier: string) => Promise<Worker | null>; // NEW
  checkWorkerOccupancy: (workerId: string) => Promise<Occupant | null>; // NEW
  getTransferringWorkers: () => Promise<Worker[]>; // NEW: Get all workers with status 'Transferring'
  checkInWorkerAsync: (params: {
    workerId: string;
    residenceId: string;
    roomId: string;
    checkInDate?: string;
    performedBy: string;
    emergencyMode?: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  checkOutWorkerAsync: (params: {
    workerId: string;
    residenceId: string;
    roomId: string;
    checkOutDate?: string;
    performedBy: string;
    checkoutType?: 'Transfer' | 'Exit' | 'Vacation' | 'Other'; // NEW
    transferCity?: string; // NEW
  }) => Promise<{ ok: boolean; error?: string }>;
  getRoomOccupantsAsync: (residenceId: string, roomId: string) => Promise<Occupant[]>;
  importWorkersBatch: (workersList: Worker[]) => Promise<{ ok: boolean; count?: number; error?: string }>;
  deleteAllWorkers: () => Promise<{ ok: boolean; count?: number; error?: string }>;

  // 🚨 EMERGENCY: Manual sync function to replace real-time listeners
  manualSyncFromFirestore: () => Promise<{ ok: boolean; totalReads: number; error?: string }>;

  // worker CRUD (firestore-backed when available)
  saveWorker: (worker: Worker | Omit<Worker, 'id'>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  migrateLocalWorkersToFirestore?: (opts?: { removeLocal?: boolean }) => Promise<{ migrated: number; skipped: number; errors: number }>;

  // ===== NEW: Enhanced operations with complete history tracking =====
  checkInWorker: (params: {
    workerId: string;
    residenceId: string;
    roomId: string;
    buildingId?: string;
    floorId?: string;
    checkInDate?: string;
    notes?: string;
    performedBy: string;
    silent?: boolean;
    emergencyMode?: boolean;
  }) => Promise<{ ok: boolean; error?: string; historyId?: string }>;

  checkOutWorkerEnhanced: (params: {
    workerId: string;
    checkOutDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
    transferCity?: string; // NEW
  }) => Promise<{ ok: boolean; error?: string; historyId?: string }>;

  transferWorker: (params: {
    workerId: string;
    toResidenceId: string;
    toRoomId: string;
    toBuildingId?: string;
    toFloorId?: string;
    transferDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
  }) => Promise<{ ok: boolean; error?: string; historyId?: string }>;

  swapWorkers: (params: {
    worker1Id: string;
    worker2Id: string;
    swapDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
  }) => Promise<{ ok: boolean; error?: string; historyIds?: string[] }>;

  // Batch operations with dates
  bulkCheckIn: (params: {
    workerIds: string[];
    residenceId: string;
    roomId: string;
    buildingId?: string;
    floorId?: string;
    checkInDate?: string;
    notes?: string;
    performedBy: string;
    emergencyMode?: boolean;
  }) => Promise<{ ok: boolean; results: Record<string, { success: boolean; error?: string; historyId?: string }> }>;

  bulkCheckOut: (params: {
    workerIds: string[];
    checkOutDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
    transferCity?: string; // NEW
  }) => Promise<{ ok: boolean; results: Record<string, { success: boolean; error?: string; historyId?: string }> }>;

  bulkTransfer: (params: {
    workerIds: string[];
    toResidenceId: string;
    toRoomId: string;
    toBuildingId?: string;
    toFloorId?: string;
    transferDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
  }) => Promise<{ ok: boolean; results: Record<string, { success: boolean; error?: string; historyId?: string }> }>;

  // ===== LEGACY: Kept for backward compatibility =====
  assignWorkerToRoom: (
    workerId: string,
    residenceId: string,
    roomId: string,
    checkInDate?: string
  ) => Promise<{ ok: boolean; error: string }>;
  bulkAssign: (
    workerIds: string[],
    residenceId: string,
    roomId: string,
    checkInDate?: string
  ) => { ok: boolean; results: Record<string, string | true> };
  checkOutWorker: (
    workerId: string,
    residenceId: string,
    roomId: string,
    checkOutDate?: string
  ) => { ok: boolean; error?: string };
  quickTransfer: (
    workerId: string,
    fromResidenceId: string,
    fromRoomId: string,
    toResidenceId: string,
    toRoomId: string,
    checkInDate?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  createTransferRequest: (
    req: Omit<TransferRequest, "id" | "requestedAt" | "status">
  ) => Promise<TransferRequest>;
  reviewTransferRequest: (
    id: string,
    approve: boolean,
    reviewerId: string
  ) => Promise<{ ok: boolean; error?: string }>;
  getDailyReport: (dateISO?: string) => Record<string, Record<string, number>>; // residenceId -> nationality -> count
  getMonthlyReport: (
    year: number,
    month: number
  ) => { perResidence: Record<string, number>; perOccupant: Record<string, number> };
  // Company CRUD
  saveCompany: (company: Company | Omit<Company, 'id' | 'createdAt'>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  // Contract CRUD
  saveContract: (contract: Contract | Omit<Contract, 'id' | 'createdAt'>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  // Invoice CRUD & generation
  saveInvoice: (invoice: Invoice | Omit<Invoice, 'id'>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  generateMonthlyInvoices: (month: string, customStartDay?: number, customRange?: { startDate: Date, endDate: Date }, filters?: { companyId?: string, residenceId?: string }, forceRegenerate?: boolean) => Promise<{ generated: number; errors: number }>;
  // Utility
  getContractsByCompany: (companyId: string) => Contract[];
  getInvoicesByContract: (contractId: string) => Invoice[];
  getActiveContractsForResidence: (residenceId: string) => Contract[];
  fetchOccupantsForFloor: (residenceId: string, floorId?: string) => Promise<void>;
};

export const AccommodationContext = createContext<AccommodationContextValue | undefined>(undefined);

export function AccommodationProvider({ children }: { children: React.ReactNode }) {
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null); // NEW
  const [accommodationHistory, setAccommodationHistory] = useState<AccommodationHistory[]>([]); // NEW
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // New state for companies, contracts, invoices
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { toast } = useToast();
  const globalNotifications = useNotifications();
  const workersUnsubRef = useRef<any | null>(null);
  const workersPermissionWarnedRef = useRef(false);
  const historyUnsubRef = useRef<any | null>(null); // NEW
  const workersFirestoreDisabledRef = useRef(false);
  const companiesUnsubRef = useRef<any | null>(null);
  const contractsUnsubRef = useRef<any | null>(null);
  const invoicesUnsubRef = useRef<any | null>(null);
  const lastMutationTimeRef = useRef<number>(0); // Track last mutation time to prevent stale fetches
  const workersRef = useRef<Worker[]>([]);
  const d1PollWarnedRef = useRef(false); // avoid spamming D1 unavailability toasts

  // Keep workersRef in sync
  useEffect(() => {
    workersRef.current = workers;
  }, [workers]);

  const loadWorkersFromLocalStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("ac_workers");
      const parsed = raw ? (JSON.parse(raw) as Worker[]) : [];
      setWorkers(parsed);
    } catch (err) {
      console.warn("Accommodation: failed to load workers from localStorage", err);
    }
  }, []);

  // 🆕 Load ALL data from localStorage
  const loadAllFromLocalStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      console.log('💾 [Emergency Mode] Loading all data from localStorage...');

      const w = localStorage.getItem("ac_workers");
      const o = localStorage.getItem("ac_occupants");
      const r = localStorage.getItem("estatecare_residences");
      const c = localStorage.getItem("ac_companies");
      const ct = localStorage.getItem("ac_contracts");
      const i = localStorage.getItem("ac_invoices");
      const h = localStorage.getItem("ac_history");
      const t = localStorage.getItem("ac_transfers");
      const n = localStorage.getItem("ac_notifications");

      if (w) setWorkers(JSON.parse(w));
      if (o) setOccupants(JSON.parse(o));
      if (r) {
        const parsed = JSON.parse(r);
        setResidences(parsed.map(mapComplexToResidence));
      }
      if (c) setCompanies(JSON.parse(c));
      if (ct) setContracts(JSON.parse(ct));
      if (i) setInvoices(JSON.parse(i));
      if (h) setAccommodationHistory(JSON.parse(h));
      if (t) setTransferRequests(JSON.parse(t));
      if (n) setNotifications(JSON.parse(n));

      console.log('✅ [Emergency Mode] Loaded from localStorage:', {
        workers: w ? JSON.parse(w).length : 0,
        occupants: o ? JSON.parse(o).length : 0,
        residences: r ? JSON.parse(r).length : 0,
      });
    } catch (err) {
      console.error("❌ [Emergency Mode] Failed to load from localStorage:", err);
    }
  }, []);

  // 🆕 Manual sync from Firestore (call only when user requests)
  const manualSyncFromFirestore = useCallback(async () => {
    if (USE_D1) {
      try {
        toast({
          title: "جاري التحديث...",
          description: "يتم تحديث البيانات من Cloudflare D1",
        });
        await syncFromD1('full', { silent: false, forceAux: true });
        toast({ title: "تم التحديث بنجاح ✅", description: "تم تحديث البيانات من Cloudflare D1" });
        return { ok: true, totalReads: 0 };
      } catch (e: any) {
        console.error('❌ [D1 Manual Sync] Failed:', e);
        toast({
          title: "فشل التحديث",
          description: e.message || 'حدث خطأ غير متوقع',
          variant: "destructive",
        });
        return { ok: false, totalReads: 0, error: String(e) };
      }
    }

    if (!db) {
      toast({
        title: "خطأ",
        description: "قاعدة البيانات غير متاحة",
        variant: "destructive",
      });
      return { ok: false, totalReads: 0, error: 'DB not available' };
    }

    try {
      console.log('🔄 [Manual Sync] Starting sync from Firestore...');

      toast({
        title: "جاري التحديث...",
        description: "يتم تحديث البيانات من قاعدة البيانات",
      });

      // DISABLED: Workers and Occupants fetch disabled to prevent large reads. Only metadata is synced.
      const [companiesSnap, contractsSnap, invoicesSnap, residencesSnap] = await Promise.all([
        // getDocs(query(collection(db, 'workers'), limit(2000))),
        // getDocs(query(collection(db, 'occupants'), limit(2000))),
        getDocs(query(collection(db, 'companies'), limit(100))),
        getDocs(query(collection(db, 'contracts'), limit(200))),
        getDocs(query(collection(db, 'invoices'), limit(300))),
        getDocs(query(collection(db, 'residences'))), // Fetch all residences (usually small collection)
        // getDocs(query(collection(db, 'accommodationHistory'), limit(500))),
      ]);

      const totalReads = companiesSnap.size + contractsSnap.size + invoicesSnap.size + residencesSnap.size;

      console.log(`📊 [Manual Sync] Total reads: ${totalReads}`);

      // const newWorkers = workersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Worker[];
      // const newOccupants = occupantsSnap.docs.map(d => { ... }) as Occupant[];
      const newCompanies = companiesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Company[];
      const newContracts = contractsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Contract[];
      const newInvoices = invoicesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Invoice[];
      const newResidences = residencesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[]; // Cast to any to avoid type mismatch with Residence vs Complex

      // setWorkers(newWorkers);
      // setOccupants(newOccupants);
      setCompanies(newCompanies);
      setContracts(newContracts);
      setInvoices(newInvoices);
      // setAccommodationHistory(newHistory);

      // Update residences in local storage so ResidencesContext can pick it up on reload
      localStorage.setItem('estatecare_residences', JSON.stringify(newResidences));

      // Also update local state if we are using it
      // Filter out disabled residences
      const activeNewResidences = newResidences.filter((r: any) => !r.disabled);
      setResidences(activeNewResidences.map(mapComplexToResidence));

      // Save to localStorage
      // localStorage.setItem('ac_workers', JSON.stringify(newWorkers));
      // localStorage.setItem('ac_occupants', JSON.stringify(newOccupants));
      localStorage.setItem('ac_companies', JSON.stringify(newCompanies));
      localStorage.setItem('ac_contracts', JSON.stringify(newContracts));
      localStorage.setItem('ac_invoices', JSON.stringify(newInvoices));
      // localStorage.setItem('ac_history', JSON.stringify(newHistory));

      console.log('✅ [Manual Sync] Complete:', {
        // workers: newWorkers.length,
        // occupants: newOccupants.length,
        companies: newCompanies.length,
        contracts: newContracts.length,
        invoices: newInvoices.length,
        // history: newHistory.length,
        totalReads,
      });

      toast({
        title: "تم التحديث بنجاح ✅",
        description: `تم تحديث البيانات (${totalReads} قراءة)`,
      });

      return { ok: true, totalReads };
    } catch (e: any) {
      console.error('❌ [Manual Sync] Failed:', e);
      toast({
        title: "فشل التحديث",
        description: e.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
      return { ok: false, totalReads: 0, error: String(e) };
    }
  }, [db, toast]);

  // 🆕 Sync from D1
  type D1SyncScope = 'core' | 'full';
  const lastD1AuxSyncAtRef = useRef(0);

  const syncFromD1 = useCallback(async (scope: D1SyncScope = 'full', opts?: { silent?: boolean; forceAux?: boolean }) => {
    const silent = !!opts?.silent;
    const forceAux = !!opts?.forceAux;
    try {
      if (!silent) {
        console.log('🔄 [D1 Sync] Starting sync from Cloudflare D1...');
        setLoading(true);
      }

      // Core tables: always needed for accommodation assign/search.
      const [w, r, o] = await Promise.all([
        D1Client.getWorkers(),
        D1Client.getResidences(),
        D1Client.getOccupants(),
      ]);

      setWorkers(w as Worker[]);
      setResidences((r as any[]).map(mapComplexToResidence));
      setOccupants(o as Occupant[]);

      // Aux tables: fetch less often to reduce Cloudflare/D1 RPC usage.
      const now = Date.now();
      const shouldSyncAux = scope === 'full' || forceAux || (now - lastD1AuxSyncAtRef.current > D1_AUX_SYNC_INTERVAL_MS);
      if (shouldSyncAux) {
        lastD1AuxSyncAtRef.current = now;
        const [c, ct, i, h, t, n] = await Promise.all([
          D1Client.getCompanies(),
          D1Client.getContracts(),
          D1Client.getInvoices(),
          D1Client.getHistory(),
          D1Client.getTransferRequests(),
          D1Client.getNotifications(),
        ]);
        setCompanies(c as Company[]);
        setContracts(ct as Contract[]);
        setInvoices(i as Invoice[]);
        setAccommodationHistory(h as AccommodationHistory[]);
        setTransferRequests(t as TransferRequest[]);
        setNotifications(n as Notification[]);
      }

      if (!silent) {
        console.log('✅ [D1 Sync] Sync complete');
      }
    } catch (e: any) {
      console.error('❌ [D1 Sync] Failed:', e);
      if (!silent) setLoading(false);

      const msg = typeof e?.message === 'string' ? e.message : String(e);
      const isBindingMissing = /D1 binding not available/i.test(msg);
      if (!silent) {
        toast({
          title: "فشل تحديث البيانات",
          description: isBindingMissing
            ? "قاعدة بيانات D1 غير متاحة في وضع التشغيل الحالي. شغّل التطبيق عبر `npm run dev:d1` (Cloudflare Pages dev) لعرض بيانات العمال من D1."
            : "حدث خطأ أثناء الاتصال بـ Cloudflare D1",
          variant: "destructive"
        });
      }
      throw e;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  const d1SyncInFlightRef = useRef(false);
  const lastD1SyncAtRef = useRef(0);

  const scheduleD1Sync = useCallback(() => {
    if (!USE_D1) return;
    const now = Date.now();
    if (d1SyncInFlightRef.current) return;
    if (now - lastD1SyncAtRef.current < D1_SYNC_COOLDOWN_MS) return;
    d1SyncInFlightRef.current = true;
    lastD1SyncAtRef.current = now;
    void syncFromD1('core', { silent: true }).finally(() => {
      d1SyncInFlightRef.current = false;
    });
  }, [syncFromD1]);

  const handleWorkersSnapshotError = useCallback(
    (err: unknown) => {
      const code =
        typeof err === "object" && err && "code" in err && typeof (err as { code: unknown }).code === "string"
          ? (err as { code: string }).code
          : "";
      const message =
        typeof err === "object" && err && "message" in err && typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
          : "";
      const isPermissionIssue = code === "permission-denied" || /permission|insufficient permissions/i.test(message);

      if (isPermissionIssue) {
        workersFirestoreDisabledRef.current = true;
        if (workersUnsubRef.current) {
          try {
            workersUnsubRef.current();
          } catch { }
          workersUnsubRef.current = null;
        }
        const isAuthed = !!auth?.currentUser;
        if (isAuthed) {
          console.warn("Accommodation: Firestore denied access to workers collection. Falling back to local cache.");
          if (!workersPermissionWarnedRef.current) {
            workersPermissionWarnedRef.current = true;
            try {
              toast({
                title: "Firestore permission",
                description: "لا يمكن تحميل بيانات العمال من Firestore، سيتم استخدام البيانات المخزنة محلياً فقط.",
                variant: "destructive",
              });
            } catch { }
          }
        } else {
          // During logout or unauthenticated states, avoid noisy warnings/toasts.
          console.log(
            "Accommodation: Workers listener stopped or denied while unauthenticated. Using local cache without warning."
          );
        }
        loadWorkersFromLocalStorage();
        return;
      }

      console.error("Failed to subscribe to workers collection:", err);
    },
    [auth, loadWorkersFromLocalStorage, toast]
  );

  const startWorkersListener = useCallback(async () => {
    console.log('📡 [startWorkersListener] Called', {
      hasDb: !!db,
      firestoreDisabled: workersFirestoreDisabledRef.current,
      hasExistingListener: !!workersUnsubRef.current
    });

    if (!db || workersFirestoreDisabledRef.current) {
      console.log('⏭️ [startWorkersListener] Skipping (no DB or disabled)');
      return;
    }
    if (workersUnsubRef.current) {
      console.log('⏭️ [startWorkersListener] Skipping (listener already exists)');
      return;
    }

    try {
      console.log('🧪 [startWorkersListener] Testing permissions with limit(1) query...');
      await getDocs(query(collection(db, "workers"), limit(1)));
      console.log('✅ [startWorkersListener] Permission test passed');
    } catch (err) {
      console.error('❌ [startWorkersListener] Permission test failed:', err);
      handleWorkersSnapshotError(err);
      return;
    }

    console.log('📻 [startWorkersListener] Setting up polling for workers...');

    const fetchWorkers = async () => {
      try {
        try {
          if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
        } catch {
          // ignore
        }
        let list: Worker[] = [];
        if (USE_D1) {
          try {
            const w = await D1Client.getWorkers();
            list = (w || []).map((d: any) => ({ id: d.id, ...d } as Worker));
          } catch (e: any) {
            console.error('D1 getWorkers failed', e);
            handleWorkersSnapshotError(e);
            return;
          }
        } else {
          // Fetch all workers (bounded) - this may be large
          const snap = await getDocs(query(collection(db, 'workers')));
          list = snap.docs.map((d: any) => {
            const data = d.data();
            const role = data?.role;
            const normalizedRole: Worker["role"] = role === "Supervisor" || role === "Engineer" ? role : "Worker";
            return {
              id: d.id,
              name: typeof data?.name === "string" ? data.name : "",
              employeeId: typeof data?.employeeId === "string" ? data.employeeId : undefined,
              idNumber: typeof data?.idNumber === "string" ? data.idNumber : undefined,
              nationality: typeof data?.nationality === "string" ? data.nationality : "",
              company: typeof data?.company === "string" ? data.company : undefined,
              role: normalizedRole,
            } as Worker;
          });
        }

        console.log('📦 [startWorkersListener] Workers fetched:', list.length);
        workersPermissionWarnedRef.current = false;
        setWorkers(list);
        try { localStorage.setItem('ac_workers', JSON.stringify(list)); } catch { }
      } catch (err) {
        console.error('Failed to fetch workers', err);
        handleWorkersSnapshotError(err);
      }
    };

    // Start immediate fetch and then poll
    fetchWorkers();
    const intervalId = window.setInterval(fetchWorkers, USE_D1 ? D1_POLL_INTERVAL_MS : POLL_INTERVAL_MS);
    workersUnsubRef.current = () => clearInterval(intervalId);
  }, [handleWorkersSnapshotError]);

  function mapComplexToResidence(complex: any): Residence {
    return {
      id: complex.id,
      name: complex.name || complex.title || "Unnamed",
      city: complex.city || "",
      address: complex.city || complex.address || "",
      location: complex.location || null,
      managerId: complex.managerId,
      isEmergencyMode: complex.isEmergencyMode,
      buildings: Array.isArray(complex.buildings)
        ? complex.buildings.map((b: any) => ({
          id: b.id,
          name: b.name,
          floors: b.floors,
          facilities: b.facilities
        }))
        : undefined,
      rooms: undefined,
      facilities: complex.facilities,
    };
  }

  // Load residences via polling (D1 or Firestore) to avoid persistent listeners
  useEffect(() => {
    const _auth = auth;
    const _db = db;

    if (!_auth) return;

    let pollId: number | null = null;

    const unsubscribeAuth = onAuthStateChanged(_auth, (user) => {
      if (user) {
        setLoading(true);

        const fetchResidences = async () => {
          try {
            try {
              if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
            } catch {
              // ignore
            }
            if (USE_D1) {
              try {
                const r = await D1Client.getResidences();
                const activeDocs = (r || []).filter((d: any) => !d.disabled);
                setResidences(activeDocs.map(mapComplexToResidence));
              } catch (e: any) {
                console.error('D1 getResidences failed', e);
                if (!d1PollWarnedRef.current) {
                  d1PollWarnedRef.current = true;
                  toast({ title: 'D1 unavailable', description: 'فشل الاتصال بـ Cloudflare D1 للحصول على السكنات', variant: 'destructive' });
                }
              }
            } else if (_db) {
              const snap = await getDocs(collection(_db, 'residences'));
              const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
              const activeDocs = docs.filter((d: any) => !d.disabled);
              setResidences(activeDocs.map(mapComplexToResidence));
            }
          } catch (e) {
            console.error('Failed to fetch residences', e);
          } finally {
            setLoading(false);
          }
        };

        fetchResidences();
        pollId = window.setInterval(fetchResidences, USE_D1 ? D1_POLL_INTERVAL_MS : POLL_INTERVAL_MS);
      } else {
        if (pollId) { clearInterval(pollId); pollId = null; }
        setResidences([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (pollId) clearInterval(pollId);
    };
  }, []);

  // Provide a safe refresh function that re-runs the load logic when called.
  const refresh = async () => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("estatecare_residences") : null;
      if (stored) {
        const parsed = JSON.parse(stored || "[]");
        // Filter out disabled residences from cache
        const activeResidences = (parsed || []).filter((d: any) => !d.disabled);
        setResidences(activeResidences.map(mapComplexToResidence));
      }
    } catch (e) {
      console.error("Accommodation refresh failed", e);
    }
  };

  // Initialize additional domain data from localStorage if present.
  useEffect(() => {
    try {
      // DISABLED: Local storage for workers/occupants disabled per user request
      // const w = typeof window !== "undefined" ? localStorage.getItem("ac_workers") : null;
      // const o = typeof window !== "undefined" ? localStorage.getItem("ac_occupants") : null;
      const t = typeof window !== "undefined" ? localStorage.getItem("ac_transfers") : null;
      const n = typeof window !== "undefined" ? localStorage.getItem("ac_notifications") : null;
      // if (w) setWorkers(JSON.parse(w));
      // if (o) setOccupants(JSON.parse(o));
      if (t) setTransferRequests(JSON.parse(t));
      if (n) setNotifications(JSON.parse(n));
    } catch (e) {
      console.error("Accommodation: failed to init local domain data", e);
    }
  }, []);

  // ⚡ OPTIMIZED: Workers - Load on demand instead of real-time listener
  // This prevents loading 4000+ workers on every page load
  // Workers are loaded only when needed (search, specific queries)
  useEffect(() => {
    if (!db || !auth) {
      if (!USE_D1) {
        console.log('🔴 [Accommodation Context] Firestore DB not initialized');
      } else {
        console.log('🔴 [Accommodation Context] Cloudflare D1 mode active; skipping Firestore initialization');
      }
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (!USE_D1) console.log('✅ [Workers] Auth ready - Workers loaded on demand (not real-time)');
        // Workers array stays empty until explicitly loaded via search/query
        // This saves ~4000 reads per page load
      } else {
        console.log('🔓 [Workers] User logged out');
        setWorkers([]);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [db, auth]);

  // Polling replacement for Firestore listeners (also supports D1 mode)
  useEffect(() => {
    let unsubscribeAuth: (() => void) | null = null;
    let pollId: number | null = null;

    const fetchAll = async () => {
      try {
        if (USE_D1) {
          try {
            await syncFromD1('core', { silent: true });
          } catch (e: any) {
            console.error('D1 sync failed during polling', e);
            if (!d1PollWarnedRef.current) {
              d1PollWarnedRef.current = true;
              toast({ title: 'D1 unavailable', description: 'فشل التزامن مع Cloudflare D1 أثناء التحديث الدوري', variant: 'destructive' });
            }
          }
          return;
        }

        // Firestore polling
        const [companiesSnap, contractsSnap, invoicesSnap, occupantsSnap, historySnap, transfersSnap] = await Promise.all([
          getDocs(query(collection(db, 'companies'), limit(500))),
          getDocs(query(collection(db, 'contracts'), limit(1000))),
          getDocs(query(collection(db, 'invoices'), limit(1000))),
          getDocs(query(collection(db, 'occupants'))),
          getDocs(query(collection(db, 'accommodationHistory'))),
          getDocs(query(collection(db, 'transferRequests'))),
        ]);

        setCompanies(companiesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Company)));
        setContracts(contractsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Contract)));
        setInvoices(invoicesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Invoice)));
        setOccupants(occupantsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any)));
        setAccommodationHistory(historySnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AccommodationHistory)));
        setTransferRequests(transfersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as TransferRequest)));
      } catch (e) {
        console.error('Polling fetchAll failed', e);
      }
    };

    // In D1 mode we don't require Firestore auth/db; start immediately.
    if (USE_D1) {
      console.log('✅ [D1 Poll] Starting initial sync and poll (no Firestore)');
      // One-time full sync to populate less-frequent tables.
      void syncFromD1('full', { silent: false, forceAux: true }).catch(() => {});
      fetchAll();
      pollId = window.setInterval(fetchAll, D1_POLL_INTERVAL_MS);
    } else {
      if (!db || !auth) return;
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('✅ [Firestore Polling] Auth ready - starting periodic fetch...');
          fetchAll();
          pollId = window.setInterval(fetchAll, POLL_INTERVAL_MS);
        } else {
          console.log('🔓 [Polling] User logged out, stopping poll and clearing data...');
          if (pollId) { clearInterval(pollId); pollId = null; }
          setCompanies([]);
          setContracts([]);
          setInvoices([]);
          setOccupants([]);
          setAccommodationHistory([]);
          setTransferRequests([]);
        }
      });
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (pollId) clearInterval(pollId);
    };
  }, [db, auth, syncFromD1]);

  function findRoomPath(residenceId: string, roomId: string): { buildingId?: string; floorId?: string } {
    const res = residences.find((r) => r.id === residenceId);
    if (!res) return {};
    if (res.buildings) {
      for (const b of res.buildings) {
        if (!b.floors) continue;
        for (const f of b.floors) {
          if (!f.rooms) continue;
          const rr = f.rooms.find((r: any) => r.id === roomId);
          if (rr) return { buildingId: (b as any).id, floorId: (f as any).id };
        }
      }
    }
    return {};
  }

  // Helpers: persist some data to localStorage (optional backup only)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem("ac_companies", JSON.stringify(companies));
      localStorage.setItem("ac_contracts", JSON.stringify(contracts));
      localStorage.setItem("ac_invoices", JSON.stringify(invoices));
    } catch (e) {
      console.error("Accommodation: persist failed", e);
    }
  }, [workers, occupants, accommodationHistory, transferRequests, notifications, companies, contracts, invoices]);

  // Capacity calculation per role
  function calcCapacityFromSpace(spaceSqm: number, role: "Worker" | "Supervisor" | "Engineer") {
    const per = role === "Worker" ? 4 : role === "Supervisor" ? 8 : 16;
    return Math.floor(spaceSqm / per);
  }

  function findRoom(residenceId: string, roomId: string): Room | undefined {
    const res = residences.find((r) => r.id === residenceId);
    if (!res) return undefined;
    if (res.rooms) return res.rooms.find((r) => r.id === roomId);
    if (res.buildings) {
      for (const b of res.buildings) {
        if (!b.floors) continue;
        for (const f of b.floors) {
          if (!f.rooms) continue;
          const rr = f.rooms.find((r) => r.id === roomId);
          if (rr) return rr;
        }
      }
    }
    return undefined;
  }

  // Search workers by name, id, nationality, employee ID, national ID number, company
  function findWorkers(q: string) {
    const norm = q.trim().toLowerCase();
    if (!norm) return workers;
    return workers.filter(
      (w) =>
        (w.name || "").toLowerCase().includes(norm) ||
        (w.id || "").toLowerCase().includes(norm) ||
        (w.employeeId || "").toLowerCase().includes(norm) ||
        (w.idNumber || "").toLowerCase().includes(norm) ||
        (w.nationality || "").toLowerCase().includes(norm) ||
        (w.company || "").toLowerCase().includes(norm)
    );
  }

  // Save (create/update) a worker. If Firestore is configured, persist there. Otherwise write to localStorage.
  async function saveWorker(worker: Worker | Omit<Worker, 'id'>) {
    try {
      const id = ('id' in worker && worker.id) ? worker.id : `w_${Date.now()}`;
      const payload = {
        id,
        name: (worker as any).name,
        employeeId: (worker as any).employeeId || '',
        idNumber: (worker as any).idNumber || '',
        nationality: (worker as any).nationality || '',
        company: (worker as any).company || '',
        role: (worker as any).role || 'Worker',
        status: (worker as any).status || 'Active',
        transferDestination: (worker as any).transferDestination || null,
        updatedAt: new Date().toISOString()
      };

      if (USE_D1) {
        // Check if exists
        const existing = workers.find(w => w.id === id);
        if (existing) {
          await D1Client.updateWorker(id, payload);
        } else {
          await D1Client.createWorker(payload);
        }
        // Optimistic update
        setWorkers(prev => {
          const idx = prev.findIndex(w => w.id === id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = payload;
            return copy;
          }
          return [payload, ...prev];
        });
        toast({ title: "Success", description: "Worker saved (D1)." });
        return;
      }

      if (db) {
        const payload = {
          name: (worker as any).name,
          employeeId: (worker as any).employeeId || '',
          idNumber: (worker as any).idNumber || '',
          nationality: (worker as any).nationality || '',
          company: (worker as any).company || '',
          role: (worker as any).role || 'Worker'
        };
        await setDoc(doc(db, 'workers', id), payload, { merge: true } as any);
        return;
      }
    } catch (e) {
      console.error('saveWorker (firestore) failed', e);
    }

    // fallback: localStorage
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('ac_workers') : null;
      const list: Worker[] = raw ? JSON.parse(raw) : [];
      const id = ('id' in worker && (worker as any).id) ? (worker as any).id : `w_${Date.now()}`;
      const payload: Worker = {
        id,
        name: (worker as any).name,
        employeeId: (worker as any).employeeId || '',
        idNumber: (worker as any).idNumber || '',
        nationality: (worker as any).nationality || '',
        company: (worker as any).company || '',
        role: (worker as any).role || 'Worker'
      };
      const idx = list.findIndex(w => w.id === id);
      if (idx >= 0) list[idx] = payload; else list.unshift(payload);
      if (typeof window !== 'undefined') localStorage.setItem('ac_workers', JSON.stringify(list));
      setWorkers(list);
    } catch (e) {
      console.error('saveWorker (local) failed', e);
    }
  }

  async function deleteWorker(id: string) {
    try {
      if (USE_D1) {
        await D1Client.deleteWorker(id);
        setWorkers(prev => prev.filter(w => w.id !== id));
        toast({ title: "Success", description: "Worker deleted (D1)." });
        return;
      }
      if (db) {
        await deleteDoc(doc(db, 'workers', id));
        // Continue to update local state manually since listeners are disabled
      }
    } catch (e) {
      console.error('deleteWorker (firestore) failed', e);
    }

    try {
      // Update state directly first for responsiveness
      setWorkers(prev => {
        const updated = prev.filter(w => w.id !== id);
        // Also update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('ac_workers', JSON.stringify(updated));
        }
        return updated;
      });
    } catch (e) {
      console.error('deleteWorker (local) failed', e);
    }
  }

  // Migration helper: push localStorage 'ac_workers' into Firestore 'workers' collection
  async function migrateLocalWorkersToFirestore(opts?: { removeLocal?: boolean }) {
    const result = { migrated: 0, skipped: 0, errors: 0 };
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('ac_workers') : null;
      const list: Worker[] = raw ? JSON.parse(raw) : [];
      if (!list.length) return result;
      if (!db) {
        console.warn('Firestore not configured - migration aborted');
        return result;
      }
      for (const w of list) {
        try {
          const id = w.id || `w_${Date.now()}`;
          await setDoc(doc(db, 'workers', id), {
            name: w.name,
            employeeId: w.employeeId || '',
            idNumber: w.idNumber || '',
            nationality: w.nationality || '',
            company: w.company || '',
            role: w.role || 'Worker'
          } as any);
          result.migrated += 1;
        } catch (e) {
          console.error('Failed to migrate worker', w, e);
          result.errors += 1;
        }
      }
      if (opts?.removeLocal) {
        try { localStorage.removeItem('ac_workers'); setWorkers([]); } catch { }
      }
      return result;
    } catch (e) {
      console.error('migrateLocalWorkersToFirestore failed', e);
      return result;
    }
  }

  // Assign single worker to room with nationality & capacity checks
  function assignWorkerToRoom(workerId: string, residenceId: string, roomId: string, checkInDate?: string) {
    const w = workers.find((x) => x.id === workerId);
    if (!w) return { ok: false, error: "worker-not-found" };
    const room = findRoom(residenceId, roomId);
    if (!room) return { ok: false, error: "room-not-found" };
    if (!room.spaceSqm || !room.roomType) return { ok: false, error: "room-metadata-missing" };
    // nationality check: occupants in same room must share nationality
    const existing = occupants.filter((o) => o.roomId === roomId && o.residenceId === residenceId && !o.until);
    if (existing.length > 0) {
      const firstWorker = workers.find((x) => x.id === existing[0].workerId);
      if (firstWorker && firstWorker.nationality && w.nationality && firstWorker.nationality !== w.nationality) {
        return { ok: false, error: "nationality-mismatch" };
      }
    }
    // capacity check
    const cap = calcCapacityFromSpace(room.spaceSqm, room.roomType);
    if (existing.length >= cap) return { ok: false, error: "room-full" };
    // create occupant
    const occ: Occupant = {
      workerId: w.id,
      residenceId,
      roomId,
      buildingId: undefined,
      floorId: undefined,
      since: checkInDate || new Date().toISOString(),
    };
    setOccupants((prev) => [...prev, occ]);
    // notification if near full
    if (existing.length + 1 >= Math.max(1, Math.floor(cap * 0.9))) {
      const note: Notification = {
        id: `n_${Date.now()}`,
        title: "Room approaching full",
        body: `Room ${room.name || roomId} at ${residenceId} is ${existing.length + 1}/${cap}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [note, ...prev]);
    }
    return { ok: true };
  }

  function bulkAssign(workerIds: string[], residenceId: string, roomId: string, checkInDate?: string) {
    const results: Record<string, string | true> = {};
    for (const wid of workerIds) {
      const r = assignWorkerToRoom(wid, residenceId, roomId, checkInDate);
      results[wid] = r.ok ? true : r.error || "error";
    }
    return { ok: true, results };
  }

  function checkOutWorker(workerId: string, residenceId: string, roomId: string, checkOutDate?: string) {
    const occ = occupants.find(o => o.workerId === workerId && o.residenceId === residenceId && o.roomId === roomId && !o.until);
    if (!occ) return { ok: false, error: "occupant-not-found" };
    const updatedOcc: Occupant = { ...occ, until: checkOutDate || new Date().toISOString() };
    setOccupants((prev) => prev.map((o) => (o.workerId === workerId && o.residenceId === residenceId && o.roomId === roomId ? updatedOcc : o)));
    return { ok: true };
  }

  async function quickTransfer(workerId: string, fromResidenceId: string, fromRoomId: string, toResidenceId: string, toRoomId: string, checkInDate?: string) {
    // 1. Check Out
    const co = await checkOutWorkerAsync({
      workerId,
      residenceId: fromResidenceId,
      roomId: fromRoomId,
      checkOutDate: checkInDate || new Date().toISOString(),
      performedBy: 'system', // or current user if available in logic
      checkoutType: 'Transfer'
    });
    if (!co.ok) return co;

    // 2. Check In
    const ci = await checkInWorkerAsync({
      workerId,
      residenceId: toResidenceId,
      roomId: toRoomId,
      checkInDate: checkInDate || new Date().toISOString(),
      performedBy: 'system'
    });
    return ci;
  }

  async function createTransferRequest(req: Omit<TransferRequest, "id" | "requestedAt" | "status">) {
    const tr: TransferRequest = { ...req, id: `trs_${Date.now()}`, requestedAt: new Date().toISOString(), status: "Pending" };

    if (USE_D1) {
      try {
        await D1Client.createTransferRequest(tr);
        setTransferRequests((prev) => [tr, ...prev]); // optimistic
        toast({ title: 'Success', description: 'Transfer request created (D1).' });
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to create transfer request (D1).', variant: 'destructive' });
      }
    } else if (db) {
      try {
        await setDoc(doc(db, 'transferRequests', tr.id), tr);
        // setTransferRequests is handled by onSnapshot
      } catch (e) { console.error('Firestore create transfer error', e); }
    } else {
      // Fallback local
      setTransferRequests((prev) => [tr, ...prev]);
      try {
        localStorage.setItem('ac_transfers', JSON.stringify([...transferRequests, tr]));
      } catch { }
    }

    // Add notification to global notifications system
    if (globalNotifications?.addNotification && auth?.currentUser) {
      globalNotifications.addNotification({
        userId: req.requestedBy,
        type: 'transfer_request',
        title: 'طلب نقل جديد',
        message: `طلب نقل ${tr.workerIds.length} عامل إلى ${tr.to.residenceId}`,
        href: '/accommodation/transfers',
        referenceId: tr.id,
      }).catch(err => console.error('Failed to add notification:', err));
    }

    // Keep local notification for backward compatibility
    const note: Notification = {
      id: `n_${Date.now()}_t`,
      title: "New transfer request",
      body: `Transfer ${tr.id} to ${tr.to.residenceId}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [note, ...prev]);
    return tr;
  }

  async function reviewTransferRequest(id: string, approve: boolean, reviewerId: string) {
    const tr = transferRequests.find((t) => t.id === id);
    if (!tr) return { ok: false, error: "not-found" };
    if (tr.status !== "Pending") return { ok: false, error: "already-reviewed" };
    const updated: TransferRequest = { ...tr, status: approve ? "Approved" : "Rejected", reviewedBy: reviewerId, reviewedAt: new Date().toISOString() };

    if (USE_D1) {
      try {
        await D1Client.updateTransferRequest(id, updated);
        setTransferRequests((prev) => prev.map((p) => (p.id === id ? updated : p)));
      } catch (e) {
        console.error(e);
        return { ok: false, error: 'D1 update failed' };
      }
    } else if (db) {
      try {
        await setDoc(doc(db, 'transferRequests', id), updated);
      } catch (e) { console.error('Firestore review transfer error', e); }
    } else {
      setTransferRequests((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }

    // Add notification to global notifications system
    if (globalNotifications?.addNotification && tr.requestedBy && auth?.currentUser) {
      globalNotifications.addNotification({
        userId: tr.requestedBy,
        type: approve ? 'order_approved' : 'generic',
        title: approve ? 'تمت الموافقة على طلب النقل' : 'تم رفض طلب النقل',
        message: `طلب النقل #${id.slice(0, 8)} ${approve ? 'تمت الموافقة عليه' : 'تم رفضه'}`,
        href: '/accommodation/transfers',
        referenceId: id,
      }).catch(err => console.error('Failed to add notification:', err));
    }

    // if approved, perform automatic allocation where possible
    if (approve) {
      const targetRoomId = tr.to.roomId;
      if (targetRoomId) {
        for (const wid of tr.workerIds) {
          // Use async checkIn but verify concurrency?
          await checkInWorkerAsync({
            workerId: wid,
            residenceId: tr.to.residenceId,
            roomId: targetRoomId,
            performedBy: reviewerId
          });
        }
      } else {
        // Auto-allocation logic logic (simplified for D1 migration: just warn not supported or fallback)
        // Original logic invoked assignWorkerToRoom (sync).
        // For now, let's just log or skip auto-allocation if not strictly needed or upgrade it later.
        // Or better: replicate the logic using checkInWorkerAsync.
        const candidateRes = residences.find((r) => r.id === tr.to.residenceId);
        if (candidateRes) {
          const roomList: Room[] = [];
          if (candidateRes.rooms) roomList.push(...candidateRes.rooms);
          if (candidateRes.buildings) {
            for (const b of candidateRes.buildings)
              if (b.floors)
                for (const f of b.floors) if (f.rooms) roomList.push(...(f.rooms as Room[]));
          }
          for (const wid of tr.workerIds) {
            const w = workers.find((x) => x.id === wid);
            if (!w) continue;
            // Simplified match finding
            const found = roomList.find(
              (r) =>
                r.spaceSqm &&
                r.roomType &&
                (occupants.filter((o) => o.roomId === r.id && o.residenceId === tr.to.residenceId).length < (calcCapacityFromSpace(r.spaceSqm, r.roomType) || 4))
            );
            if (found) {
              await checkInWorkerAsync({
                workerId: wid,
                residenceId: tr.to.residenceId,
                roomId: found.id,
                performedBy: reviewerId
              });
            }
          }
        }
      }
    }
    return { ok: true };
  }

  // Reports
  function getDailyReport(dateISO?: string) {
    const date = dateISO ? new Date(dateISO) : new Date();
    const dayStr = date.toISOString().slice(0, 10);
    const res: Record<string, Record<string, number>> = {};
    for (const occ of occupants) {
      const sinceDay = occ.since.slice(0, 10);
      if (sinceDay <= dayStr) {
        res[occ.residenceId] = res[occ.residenceId] || {};
        const w = workers.find((x) => x.id === occ.workerId);
        const nat = w?.nationality || "Unknown";
        res[occ.residenceId][nat] = (res[occ.residenceId][nat] || 0) + 1;
      }
    }
    return res;
  }

  function getMonthlyReport(year: number, month: number) {
    // month: 1-12
    const perResidence: Record<string, number> = {};
    const perOccupant: Record<string, number> = {};
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    for (const occ of occupants) {
      const since = new Date(occ.since);
      if (since < end) {
        const overlapStart = since < start ? start : since;
        const overlapDays = Math.ceil((end.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
        perResidence[occ.residenceId] = (perResidence[occ.residenceId] || 0) + overlapDays;
        perOccupant[occ.workerId] = (perOccupant[occ.workerId] || 0) + overlapDays;
      }
    }
    return { perResidence, perOccupant };
  }

  // ⚡ Optimized Async Operations
  const findWorkerAsync = useCallback(async (queryStr: string) => {
    if (!queryStr.trim()) return [];
    const term = queryStr.trim();
    const termLower = term.toLowerCase();

    // Cloudflare D1 mode: Firestore `db` is null, so use the in-memory list (refreshed by D1 polling)
    // and fall back to a one-time D1 fetch if the list hasn't loaded yet.
    if (USE_D1) {
      const workerMatchesTerm = (w: any): boolean => {
        if (w.name?.toLowerCase().includes(termLower)) return true;
        if (w.nameAr?.toLowerCase().includes(termLower)) return true;
        if (w.nameEn?.toLowerCase().includes(termLower)) return true;
        if (w.fullName?.toLowerCase().includes(termLower)) return true;
        if (w.id?.toLowerCase?.().includes?.(termLower)) return true;
        if (w.idNumber?.toLowerCase?.().includes?.(termLower)) return true;
        if (w.employeeId?.toLowerCase?.().includes?.(termLower)) return true;
        if (w.nationality?.toLowerCase?.().includes?.(termLower)) return true;
        if (w.company?.toLowerCase?.().includes?.(termLower)) return true;
        return false;
      };

      let list: Worker[] = workersRef.current as Worker[];
      if (!list || list.length === 0) {
        try {
          const w = await D1Client.getWorkers();
          list = (w || []).map((d: any) => ({ id: d.id, ...d } as Worker));
          setWorkers(list);
          try { localStorage.setItem('ac_workers', JSON.stringify(list)); } catch {}
        } catch (e) {
          console.error('D1 getWorkers failed (search)', e);
          // If D1 is unavailable or auth hasn't settled yet, return empty results gracefully.
          return [];
        }
      }

      // Prefer exact matches first for IDs
      const exactMatches = list.filter((w: any) =>
        String(w.id || '').toLowerCase() === termLower ||
        String(w.idNumber || '').toLowerCase() === termLower ||
        String(w.employeeId || '').toLowerCase() === termLower
      );
      if (exactMatches.length > 0) return exactMatches.slice(0, 15);

      const matches = list.filter(workerMatchesTerm);
      return matches.slice(0, 15);
    }

    console.log('🔍 [Search] Looking for:', term);
    const startTime = Date.now();

    // Helper function to check if worker matches search term (partial name match)
    const workerMatchesTerm = (w: any): boolean => {
      // Check name field (main field)
      if (w.name?.toLowerCase().includes(termLower)) return true;
      // Check any other name-related fields that might exist
      if (w.nameAr?.toLowerCase().includes(termLower)) return true;
      if (w.nameEn?.toLowerCase().includes(termLower)) return true;
      if (w.fullName?.toLowerCase().includes(termLower)) return true;
      // Check ID fields too
      if (w.idNumber?.toLowerCase().includes(termLower)) return true;
      if (w.employeeId?.toLowerCase().includes(termLower)) return true;
      return false;
    };

    // 1. Try ID Number (Prefix/Range)
    const qId = query(collection(db, 'workers'), where('idNumber', '>=', term), where('idNumber', '<=', term + '\uf8ff'), limit(10));
    const snapId = await getDocs(qId);
    if (!snapId.empty) {
      console.log(`✅ [Search] Found ${snapId.size} by ID in ${Date.now() - startTime}ms (${snapId.size} reads)`);
      return snapId.docs.map((d: any) => ({ id: d.id, ...d.data() } as Worker));
    }

    // 2. Try Employee ID (Prefix/Range)
    const qEmp = query(collection(db, 'workers'), where('employeeId', '>=', term), where('employeeId', '<=', term + '\uf8ff'), limit(10));
    const snapEmp = await getDocs(qEmp);
    if (!snapEmp.empty) {
      console.log(`✅ [Search] Found ${snapEmp.size} by EmployeeID in ${Date.now() - startTime}ms (${snapEmp.size} reads)`);
      return snapEmp.docs.map((d: any) => ({ id: d.id, ...d.data() } as Worker));
    }

    // 3. Try Name (Prefix) - efficient range query for names starting with term
    const qName = query(collection(db, 'workers'), where('name', '>=', term), where('name', '<=', term + '\uf8ff'), limit(10));
    const snapName = await getDocs(qName);
    if (!snapName.empty) {
      console.log(`✅ [Search] Found ${snapName.size} by Name (prefix) in ${Date.now() - startTime}ms (${snapName.size} reads)`);
      return snapName.docs.map((d: any) => ({ id: d.id, ...d.data() } as Worker));
    }

    // 4. Search in cached workers for partial name match (contains any part of name)
    if (workersRef.current.length > 0) {
      const partialMatches = workersRef.current.filter(workerMatchesTerm).slice(0, 15);

      if (partialMatches.length > 0) {
        console.log(`✅ [Search] Found ${partialMatches.length} by Name (partial) from cache in ${Date.now() - startTime}ms`);
        return partialMatches;
      }
    }

    // 5. Fallback: Fetch all workers and search for partial name match
    // This handles searching by last name or any part of the name
    console.log('🔄 [Search] Fetching all workers for partial match...');
    const allWorkersFromDb: Worker[] = [];
    let lastDoc: any = null;
    const batchSize = 1000;
    let totalReads = 0;

    // Paginate through all workers until we find matches
    while (true) {
      let q = lastDoc
        ? query(collection(db, 'workers'), limit(batchSize), startAfter(lastDoc))
        : query(collection(db, 'workers'), limit(batchSize));

      const snap = await getDocs(q);
      if (snap.empty) break;

      totalReads += snap.size;
      const batchWorkers = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Worker));

      // Check for matches in this batch
      const batchMatches = batchWorkers.filter(workerMatchesTerm);

      if (batchMatches.length > 0) {
        console.log(`✅ [Search] Found ${batchMatches.length} by Name (partial) in ${Date.now() - startTime}ms (${totalReads} reads)`);
        return batchMatches.slice(0, 15);
      }

      allWorkersFromDb.push(...batchWorkers);

      if (snap.docs.length < batchSize) break;
      lastDoc = snap.docs[snap.docs.length - 1];

      // Safety limit to prevent too many reads
      if (totalReads >= 5000) {
        console.log(`⚠️ [Search] Reached safety limit of 5000 reads`);
        break;
      }
    }

    console.log(`❌ [Search] No results in ${Date.now() - startTime}ms (${totalReads} reads total)`);
    return [];
  }, [db]);

  // Fetch multiple workers by ID (for display)
  const getWorkersByIds = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return [];

    if (USE_D1) {
      const wanted = new Set(ids);
      let list: Worker[] = workersRef.current as Worker[];
      if (!list || list.length === 0) {
        try {
          const w = await D1Client.getWorkers();
          list = (w || []).map((d: any) => ({ id: d.id, ...d } as Worker));
          setWorkers(list);
          try { localStorage.setItem('ac_workers', JSON.stringify(list)); } catch {}
        } catch (e) {
          console.error('D1 getWorkers failed (getWorkersByIds)', e);
          return [];
        }
      }
      return list.filter((w) => wanted.has(w.id));
    }

    if (!db) return [];

    // Filter out IDs we already have in state
    const missingIds = ids.filter(id => !workersRef.current.find(w => w.id === id));
    if (missingIds.length === 0) return [];

    // Fetch missing
    // Firestore 'in' query is limited to 10 (or 30). We'll do parallel getDoc for simplicity and robustness
    // or chunks of 10 if we expect many. Parallel getDoc is fine for < 20.

    const fetchedWorkers: Worker[] = [];
    const chunks = [];
    const chunkSize = 10;
    for (let i = 0; i < missingIds.length; i += chunkSize) {
      chunks.push(missingIds.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      // Use 'in' query for efficiency if possible, but IDs are document keys usually.
      // If IDs are document keys, we can use documentId().
      // But let's stick to parallel getDoc for now as it's simplest for mixed ID types (though we assume doc ID here)

      const promises = chunk.map(id => getDoc(doc(db!, 'workers', id)));
      const snaps = await Promise.all(promises);

      snaps.forEach(snap => {
        if (snap.exists()) {
          fetchedWorkers.push({ id: snap.id, ...snap.data() } as Worker);
        }
      });
    }

    if (fetchedWorkers.length > 0) {
      setWorkers(prev => {
        // Merge and deduplicate
        const existingIds = new Set(prev.map(w => w.id));
        const newOnes = fetchedWorkers.filter(w => !existingIds.has(w.id));
        return [...prev, ...newOnes];
      });
    }

    return fetchedWorkers;
  }, [db]);

  // NEW: Get worker by ID or Employee ID
  const getWorkerByIdOrEmployeeId = useCallback(async (identifier: string): Promise<Worker | null> => {
    if (!identifier?.trim()) return null;

    const term = identifier.trim();

    if (USE_D1) {
      let list: Worker[] = workersRef.current as Worker[];
      if (!list || list.length === 0) {
        try {
          const w = await D1Client.getWorkers();
          list = (w || []).map((d: any) => ({ id: d.id, ...d } as Worker));
          setWorkers(list);
          try { localStorage.setItem('ac_workers', JSON.stringify(list)); } catch {}
        } catch (e) {
          console.error('D1 getWorkers failed (getWorkerByIdOrEmployeeId)', e);
          return null;
        }
      }
      return list.find((w) => w.id === term || w.employeeId === term) || null;
    }

    if (!db) return null;

    // First try to find in cached workers
    const cachedWorker = workersRef.current.find(w => w.id === term || w.employeeId === term);
    if (cachedWorker) return cachedWorker;

    // Try to get by document ID (UUID)
    try {
      const docRef = doc(db, 'workers', term);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Worker;
      }
    } catch (error) {
      // Not a valid document ID, continue
    }

    // Try to find by employeeId
    try {
      const q = query(collection(db, 'workers'), where('employeeId', '==', term), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as Worker;
      }
    } catch (error) {
      console.error('Error searching by employeeId:', error);
    }

    return null;
  }, [db]);

  const checkWorkerOccupancy = useCallback(async (workerId: string) => {
    if (!workerId || typeof workerId !== 'string') {
      console.warn('checkWorkerOccupancy: invalid workerId', workerId);
      return null;
    }

    if (USE_D1) {
      const occ = occupants.find((o) => o.workerId === workerId && (o.until == null || o.until === ''));
      return occ || null;
    }

    if (!db) return null;
    try {
      const q = query(
        collection(db, 'occupants'),
        where('workerId', '==', workerId),
        where('until', '==', null),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Occupant;
    } catch (e) {
      console.error("checkWorkerOccupancy failed", e);
      return null;
    }
  }, [db, occupants]);

  // NEW: Get all workers with status 'Transferring'
  const getTransferringWorkers = useCallback(async (): Promise<Worker[]> => {
    if (!db) {
      console.log('[getTransferringWorkers] No DB, returning empty array');
      return [];
    }
    try {
      console.log('[getTransferringWorkers] Fetching workers with status=Transferring...');
      const q = query(
        collection(db, 'workers'),
        where('status', '==', 'Transferring')
      );
      const snap = await getDocs(q);
      const workers = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Worker));
      console.log(`[getTransferringWorkers] Found ${workers.length} transferring workers`);
      return workers;
    } catch (e) {
      console.error('[getTransferringWorkers] Failed:', e);
      return [];
    }
  }, [db]);

  const getRoomOccupantsAsync = useCallback(async (residenceId: string, roomId: string) => {
    if (!db || !residenceId || !roomId) return [];
    try {
      const q = query(
        collection(db, 'occupants'),
        where('residenceId', '==', residenceId),
        where('roomId', '==', roomId),
        where('until', '==', null)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any)) as Occupant[];
    } catch (e) {
      console.error("getRoomOccupantsAsync failed", e);
      return [];
    }
  }, [db]);

  const fetchOccupantsForFloor = useCallback(async (residenceId: string, floorId?: string) => {
    if (!db || !residenceId) return;
    const startTime = Date.now();
    try {
      let q;
      if (floorId) {
        q = query(
          collection(db, 'occupants'),
          where('residenceId', '==', residenceId),
          where('floorId', '==', floorId),
          where('until', '==', null)
        );
      } else {
        // Fetch all for residence (useful for residences without floors)
        q = query(
          collection(db, 'occupants'),
          where('residenceId', '==', residenceId),
          where('until', '==', null)
        );
      }

      const snap = await getDocs(q);

      // Race condition check: If a mutation happened after we started fetching, ignore this result
      // to prevent overwriting the optimistic update with stale data.
      if (lastMutationTimeRef.current > startTime) {
        console.log('⚠️ [fetchOccupantsForFloor] Skipping stale fetch result due to recent mutation');
        return;
      }

      const floorOccupants = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any)) as Occupant[];

      setOccupants(prev => {
        // Remove existing occupants for this scope to avoid duplicates/stale data
        let otherOccupants;
        if (floorId) {
          otherOccupants = prev.filter(o => o.floorId !== floorId);
        } else {
          // If fetching by residence, replace all occupants for this residence
          otherOccupants = prev.filter(o => o.residenceId !== residenceId);
        }
        return [...otherOccupants, ...floorOccupants];
      });
    } catch (e) {
      console.error("Failed to fetch occupants", e);
    }
  }, [db]);

  const checkInWorkerAsync = useCallback(async (params: {
    workerId: string;
    residenceId: string;
    roomId: string;
    checkInDate?: string;
    performedBy: string;
    emergencyMode?: boolean;
  }) => {
    if (USE_D1) {
      try {
        const path = findRoomPath(params.residenceId, params.roomId);
        const since = params.checkInDate || new Date().toISOString();
        const res = await D1Client.checkInWorker({
          workerId: params.workerId,
          residenceId: params.residenceId,
          roomId: params.roomId,
          buildingId: path.buildingId,
          floorId: path.floorId,
          since,
          checkInBy: params.performedBy,
          isEmergency: params.emergencyMode,
        });

        if (res.ok) {
          // Optimistic local update to reflect immediately in UI.
          setOccupants((prev) => {
            const withoutActive = prev.filter((o) => !(o.workerId === params.workerId && (o.until == null)));
            return [
              ...withoutActive,
              {
                id: (res as any).id || `occ_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                workerId: params.workerId,
                residenceId: params.residenceId,
                buildingId: path.buildingId,
                floorId: path.floorId,
                roomId: params.roomId,
                since,
                until: null,
                checkInBy: params.performedBy,
                isEmergency: !!params.emergencyMode,
                updatedAt: new Date().toISOString(),
              } as any,
            ];
          });
          setWorkers((prev) =>
            prev.map((w) =>
              w.id === params.workerId
                ? { ...w, status: 'Active', transferDestination: undefined }
                : w
            )
          );
          scheduleD1Sync();
          return { ok: true };
        }
        toast({ title: 'D1 error', description: res?.error || 'Failed to check-in (D1)', variant: 'destructive' });
        return { ok: false, error: res?.error || 'D1 error' };
      } catch (e: any) {
        console.error('D1 Check-in error', e);
        const msg = String(e?.message || e || 'D1 error');
        if (/D1|Cloudflare/i.test(msg)) {
          toast({ title: 'D1 unavailable', description: 'خدمة Cloudflare D1 غير متاحة حالياً', variant: 'destructive' });
        }
        return { ok: false, error: msg };
      }
    }

    if (!db) return { ok: false, error: 'DB not available' };

    // 1. Fetch Worker (to check nationality and role)
    // Use getDoc for direct ID lookup instead of query
    const workerRef = doc(db, 'workers', params.workerId);
    const workerSnap = await getDoc(workerRef);

    let worker: Worker;
    if (workerSnap.exists()) {
      worker = { id: workerSnap.id, ...workerSnap.data() } as Worker;
    } else {
      // Fallback: Try query if ID is not the document key (legacy support)
      const q = query(collection(db, 'workers'), where('id', '==', params.workerId), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return { ok: false, error: 'worker-not-found' };
      worker = { id: snap.docs[0].id, ...snap.docs[0].data() } as Worker;
    }

    // AUTO-CHECKOUT: If worker is Transferring and has current occupancy, check them out one day before new check-in
    if (worker.status === 'Transferring') {
      try {
        // Find current active occupancy
        const currentOccupancyQuery = query(
          collection(db, 'occupants'),
          where('workerId', '==', params.workerId),
          where('until', '==', null)
        );
        const currentOccSnap = await getDocs(currentOccupancyQuery);

        if (!currentOccSnap.empty) {
          const currentOcc = currentOccSnap.docs[0];
          const currentOccData = currentOcc.data();

          // Calculate checkout date: one day before new check-in date
          const newCheckInDate = params.checkInDate ? new Date(params.checkInDate) : new Date();
          const autoCheckOutDate = new Date(newCheckInDate);
          autoCheckOutDate.setDate(autoCheckOutDate.getDate() - 1);
          const autoCheckOutISO = autoCheckOutDate.toISOString();

          console.log(`🔄 [Auto-Checkout] Worker ${params.workerId} is Transferring. Auto-checking out from residence ${currentOccData.residenceId} on ${autoCheckOutISO.split('T')[0]}`);

          // Update the current occupancy with checkout date
          await updateDoc(currentOcc.ref, {
            until: autoCheckOutISO,
            checkOutBy: params.performedBy,
            checkoutType: 'Transfer',
            notes: 'تم الإخراج تلقائياً عند التسكين في السكن الجديد'
          });

          // Update mutation timestamp
          lastMutationTimeRef.current = Date.now();

          // Update local state
          setOccupants(prev => prev.map(o =>
            o.id === currentOcc.id
              ? { ...o, until: autoCheckOutISO, checkOutBy: params.performedBy, checkoutType: 'Transfer' }
              : o
          ));

          console.log(`✅ [Auto-Checkout] Successfully checked out worker from previous residence`);
        }
      } catch (e) {
        console.warn('⚠️ [Auto-Checkout] Failed to auto-checkout transferring worker (non-critical):', e);
        // Continue with check-in even if auto-checkout fails
      }
    }

    // 2. Fetch Room Occupants (to check capacity & nationality)
    const occupants = await getRoomOccupantsAsync(params.residenceId, params.roomId);

    // 3. Validate Room
    const room = findRoom(params.residenceId, params.roomId);
    if (!room) {
      console.error(`Room not found: ${params.residenceId} / ${params.roomId}. Residences loaded: ${residences.length}`);
      return { ok: false, error: 'room-not-found' };
    }

    // 4. Dynamic Rules Check (Nationality & Role/Capacity)
    // SKIP ALL CHECKS IF EMERGENCY MODE IS ON (Global Residence Mode OR Operation Mode)
    const residence = residences.find(r => r.id === params.residenceId);
    const isEmergency = params.emergencyMode || residence?.isEmergencyMode;

    if (!isEmergency) {
      let effectiveRole = worker.role || 'Worker';

      if (occupants.length > 0) {
        const firstOcc = occupants[0];

        // Fetch first occupant details to determine room's current "state"
        const firstWorkerRef = doc(db, 'workers', firstOcc.workerId);
        const firstWorkerSnap = await getDoc(firstWorkerRef);

        if (firstWorkerSnap.exists()) {
          const firstWorker = firstWorkerSnap.data() as Worker;

          // Rule 1: Nationality Mismatch
          // If room has occupants, new worker must match their nationality
          if (firstWorker.nationality && worker.nationality && firstWorker.nationality !== worker.nationality) {
            return { ok: false, error: 'nationality-mismatch' };
          }

          // Rule 2: Role Mismatch (implied by dynamic capacity)
          // If room is occupied by Supervisor, only Supervisor can enter (to maintain capacity logic)
          const currentRoomRole = firstWorker.role || 'Worker';
          if (currentRoomRole !== effectiveRole) {
            return { ok: false, error: 'role-mismatch' };
          }

          effectiveRole = currentRoomRole;
        }
      }

      // Calculate Dynamic Capacity based on Effective Role
      // Worker: 4 sqm/person, Supervisor: 8 sqm/person, Engineer: 16 sqm/person
      // Default to 4 if spaceSqm is missing
      const spaceSqm = Number(room.spaceSqm) || 16;
      const sqmPerPerson = effectiveRole === 'Engineer' ? 16 : effectiveRole === 'Supervisor' ? 8 : 4;

      // Calculate used Sqm based on current occupants count and the effective role
      const usedSqm = occupants.length * sqmPerPerson;
      const requiredSqm = sqmPerPerson;

      if (usedSqm + requiredSqm > spaceSqm) {
        return {
          ok: false,
          error: `room-full (Used: ${usedSqm}, Req: ${requiredSqm}, Space: ${spaceSqm}, Occ: ${occupants.length})`
        };
      }
    }

    // 5. Create Occupant
    const newOcc: any = {
      workerId: params.workerId,
      residenceId: params.residenceId,
      roomId: params.roomId,
      since: params.checkInDate || new Date().toISOString(),
      checkInBy: params.performedBy,
      until: null,
      isEmergency: params.emergencyMode || false
    };

    const docRef = await addDoc(collection(db, 'occupants'), newOcc);
    newOcc.id = docRef.id;

    // Update mutation timestamp
    lastMutationTimeRef.current = Date.now();

    // NEW: Update Worker Status to Active
    try {
      await updateDoc(doc(db, 'workers', params.workerId), {
        status: 'Active',
        transferDestination: null
      });

      // Update local workers state
      setWorkers(prev => prev.map(w => {
        if (w.id === params.workerId) {
          return { ...w, status: 'Active', transferDestination: undefined };
        }
        return w;
      }));
    } catch (e) {
      console.warn('Failed to update worker status on check-in', e);
    }

    // Update local state: Sync this room's occupants
    setOccupants(prev => {
      // Keep occupants from other rooms
      const otherRooms = prev.filter(o => o.roomId !== params.roomId);

      // Get existing occupants for this room from state
      const currentRoomOccupants = prev.filter(o => o.roomId === params.roomId);

      // Merge with fetched occupants (deduplicate by ID or workerId)
      const mergedMap = new Map();

      // 1. Add fetched occupants (might be stale)
      occupants.forEach(o => mergedMap.set(o.workerId, o));

      // 2. Add existing local occupants (might have recent additions)
      currentRoomOccupants.forEach(o => mergedMap.set(o.workerId, o));

      // 3. Add the new one
      mergedMap.set(newOcc.workerId, newOcc);

      return [...otherRooms, ...Array.from(mergedMap.values())];
    });

    return { ok: true };
  }, [db, getRoomOccupantsAsync, residences]);

  const checkOutWorkerAsync = useCallback(async (params: {
    workerId: string;
    residenceId: string;
    roomId: string;
    checkOutDate?: string;
    performedBy: string;
    checkoutType?: 'Transfer' | 'Exit' | 'Vacation' | 'Other'; // NEW
    transferCity?: string; // NEW
  }) => {
    if (USE_D1) {
      try {
        const res = await D1Client.checkOutWorker({
          workerId: params.workerId,
          residenceId: params.residenceId,
          roomId: params.roomId,
          until: params.checkOutDate || new Date().toISOString(),
          checkOutBy: params.performedBy,
          checkoutType: params.checkoutType,
          transferCity: params.transferCity
        });
        if (res.ok) {
          scheduleD1Sync();
          return { ok: true };
        }
        toast({ title: 'D1 error', description: res?.error || 'Failed to check-out (D1)', variant: 'destructive' });
        return { ok: false, error: res?.error || 'D1 error' };
      } catch (e: any) {
        console.error('D1 Check-out error', e);
        const msg = String(e?.message || e || 'D1 error');
        if (/D1|Cloudflare/i.test(msg)) {
          toast({ title: 'D1 unavailable', description: 'خدمة Cloudflare D1 غير متاحة حالياً', variant: 'destructive' });
        }
        return { ok: false, error: msg };
      }
    }

    if (!db) return { ok: false, error: 'DB not available' };

    const q = query(
      collection(db, 'occupants'),
      where('workerId', '==', params.workerId),
      where('residenceId', '==', params.residenceId),
      where('roomId', '==', params.roomId),
      where('until', '==', null)
    );
    const snap = await getDocs(q);

    if (snap.empty) return { ok: false, error: 'occupant-not-found' };

    const docRef = snap.docs[0].ref;
    const updatePayload: any = {
      until: params.checkOutDate || new Date().toISOString(),
      checkOutBy: params.performedBy
    };

    if (params.checkoutType) updatePayload.checkoutType = params.checkoutType;
    if (params.transferCity) updatePayload.transferCity = params.transferCity;

    await updateDoc(docRef, updatePayload);

    // Update mutation timestamp
    lastMutationTimeRef.current = Date.now();

    // NEW: Update Worker Status based on checkout type
    try {
      const workerUpdate: any = {};
      if (params.checkoutType === 'Transfer') {
        workerUpdate.status = 'Transferring';
        if (params.transferCity) workerUpdate.transferDestination = params.transferCity;
      } else if (params.checkoutType === 'Exit') {
        workerUpdate.status = 'Exit';
      } else if (params.checkoutType === 'Vacation') {
        workerUpdate.status = 'Vacation';
      } else {
        // Default or Other
        workerUpdate.status = 'Active'; // Or keep as is? Maybe 'Unassigned'?
        // If they are checked out without specific reason, they are just unassigned but still in system?
        // Let's assume 'Active' means "In System" but if not in occupant list, they are unassigned.
        // But 'Transferring' is a special state.
      }

      if (Object.keys(workerUpdate).length > 0) {
        await updateDoc(doc(db, 'workers', params.workerId), workerUpdate);

        // Update local workers state
        setWorkers(prev => prev.map(w => {
          if (w.id === params.workerId) {
            return { ...w, ...workerUpdate };
          }
          return w;
        }));
      }
    } catch (e) {
      console.warn('Failed to update worker status on check-out', e);
    }

    // Update local state immediately
    setOccupants(prev => prev.filter(o => o.workerId !== params.workerId));

    return { ok: true };
  }, [db]);

  // ============ COMPANY CRUD ============
  async function saveCompany(company: Company | Omit<Company, 'id' | 'createdAt'>) {
    try {
      const id = ('id' in company && company.id) ? company.id : `comp_${Date.now()}`;
      const now = new Date().toISOString();
      const payload: Company = {
        id,
        name: company.name,
        nameAr: company.nameAr,
        nameEn: company.nameEn,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        address: company.address,
        createdAt: ('createdAt' in company) ? company.createdAt : now,
        updatedAt: now,
      };

      if (db) {
        await setDoc(doc(db, 'companies', id), payload, { merge: true } as any);
      } else {
        // Cloudflare-only path (D1)
        const exists = companies.some((c) => c.id === id);
        if (exists) {
          await (D1Client as any).updateCompany(id, payload);
        } else {
          await (D1Client as any).createCompany(payload);
        }
      }

      // Update local cache immediately
      setCompanies((prev) => {
        const idx = prev.findIndex((c) => c.id === id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...payload };
          return next;
        }
        return [...prev, payload];
      });
      try {
        const nextCompanies = (() => {
          const idx = companies.findIndex((c) => c.id === id);
          if (idx >= 0) {
            const next = [...companies];
            next[idx] = { ...next[idx], ...payload };
            return next;
          }
          return [...companies, payload];
        })();
        localStorage.setItem('ac_companies', JSON.stringify(nextCompanies));
      } catch {}

      toast({ title: 'Success', description: 'Company saved successfully' });
    } catch (e) {
      console.error('saveCompany failed:', e);
      toast({ title: 'Error', description: 'Failed to save company', variant: 'destructive' });
      throw e;
    }
  }

  async function deleteCompany(id: string) {
    try {
      // Check if company has active contracts
      const activeContracts = contracts.filter(c => c.companyId === id && c.status === 'Active');
      if (activeContracts.length > 0) {
        toast({ title: 'Cannot delete', description: 'Company has active contracts', variant: 'destructive' });
        return;
      }

      if (db) {
        await deleteDoc(doc(db, 'companies', id));
      } else {
        await (D1Client as any).deleteCompany(id);
      }

      setCompanies((prev) => prev.filter((c) => c.id !== id));
      try {
        const next = companies.filter((c) => c.id !== id);
        localStorage.setItem('ac_companies', JSON.stringify(next));
      } catch {}

      toast({ title: 'Deleted', description: 'Company deleted successfully' });
    } catch (e) {
      console.error('deleteCompany failed:', e);
      toast({ title: 'Error', description: 'Failed to delete company', variant: 'destructive' });
      throw e;
    }
  }

  // ============ CONTRACT CRUD ============
  async function saveContract(contract: Contract | Omit<Contract, 'id' | 'createdAt'>) {
    try {
      if (!db) throw new Error('Firestore not configured');
      const id = ('id' in contract && contract.id) ? contract.id : `ctr_${Date.now()}`;
      const now = new Date().toISOString();
      const payload: Contract = {
        id,
        companyId: contract.companyId,
        residenceId: contract.residenceId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        ratePerPersonPerMonth: contract.ratePerPersonPerMonth,
        expectedWorkers: contract.expectedWorkers,
        status: contract.status || 'Active',
        notes: contract.notes,
        createdAt: ('createdAt' in contract) ? contract.createdAt : now,
        updatedAt: now,
        createdBy: contract.createdBy,
      };
      await setDoc(doc(db, 'contracts', id), payload, { merge: true } as any);
      toast({ title: 'Success', description: 'Contract saved successfully' });
    } catch (e) {
      console.error('saveContract failed:', e);
      toast({ title: 'Error', description: 'Failed to save contract', variant: 'destructive' });
      throw e;
    }
  }

  async function deleteContract(id: string) {
    try {
      if (!db) throw new Error('Firestore not configured');
      // Check if contract has invoices
      const contractInvoices = invoices.filter(inv => inv.contractId === id);
      if (contractInvoices.length > 0) {
        toast({ title: 'Cannot delete', description: 'Contract has associated invoices', variant: 'destructive' });
        return;
      }
      await deleteDoc(doc(db, 'contracts', id));
      toast({ title: 'Deleted', description: 'Contract deleted successfully' });
    } catch (e) {
      console.error('deleteContract failed:', e);
      toast({ title: 'Error', description: 'Failed to delete contract', variant: 'destructive' });
      throw e;
    }
  }

  // ============ INVOICE CRUD ============
  async function saveInvoice(invoice: Invoice | Omit<Invoice, 'id'>) {
    try {
      if (!db) throw new Error('Firestore not configured');
      const id = ('id' in invoice && invoice.id) ? invoice.id : `inv_${Date.now()}`;
      const payload: Invoice = {
        id,
        contractId: invoice.contractId,
        companyId: invoice.companyId,
        residenceId: invoice.residenceId,
        month: invoice.month,
        startDate: invoice.startDate,
        endDate: invoice.endDate,
        numberOfWorkers: invoice.numberOfWorkers,
        numberOfDays: invoice.numberOfDays,
        ratePerPerson: invoice.ratePerPerson,
        totalAmount: invoice.totalAmount,
        status: invoice.status || 'Draft',
        generatedAt: invoice.generatedAt,
        paidAt: invoice.paidAt,
        pdfUrl: invoice.pdfUrl,
        notes: invoice.notes,
      };
      await setDoc(doc(db, 'invoices', id), payload, { merge: true } as any);
      toast({ title: 'Success', description: 'Invoice saved successfully' });
    } catch (e) {
      console.error('saveInvoice failed:', e);
      toast({ title: 'Error', description: 'Failed to save invoice', variant: 'destructive' });
      throw e;
    }
  }

  async function deleteInvoice(id: string) {
    try {
      if (!db) throw new Error('Firestore not configured');
      const invoice = invoices.find(inv => inv.id === id);
      if (invoice?.status === 'Paid') {
        toast({ title: 'Cannot delete', description: 'Cannot delete paid invoices', variant: 'destructive' });
        return;
      }
      await deleteDoc(doc(db, 'invoices', id));
      toast({ title: 'Deleted', description: 'Invoice deleted successfully' });
    } catch (e) {
      console.error('deleteInvoice failed:', e);
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'destructive' });
      throw e;
    }
  }

  // ============ INVOICE GENERATION ============
  async function generateMonthlyInvoices(month: string, customStartDay?: number, customRange?: { startDate: Date, endDate: Date }, filters?: { companyId?: string, residenceId?: string }, forceRegenerate?: boolean): Promise<{ generated: number; errors: number }> {
    // month format: YYYY-MM
    const result = { generated: 0, errors: 0 };
    try {
      // Support both Firestore and D1 data sources
      let dataOccupants = occupants;
      let dataWorkers = workers;
      let dataContracts = contracts;
      let dataCompanies = companies;

      if (USE_D1) {
        try {
          const [o, h, w, ct, cp] = await Promise.all([
            D1Client.getOccupants(),
            D1Client.getHistory(),
            D1Client.getWorkers(),
            D1Client.getContracts(),
            D1Client.getCompanies()
          ]);
          dataOccupants = o as any[] || [];
          dataWorkers = w as any[] || [];
          dataContracts = ct as any[] || [];
          dataCompanies = cp as any[] || [];
          // Use D1 history for period calculations
          // We'll filter it by date range below
        } catch (e: any) {
          console.error('generateMonthlyInvoices: failed to fetch data from D1', e);
          toast({ title: 'D1 unavailable', description: 'فشل الحصول على بيانات الفواتير من Cloudflare D1', variant: 'destructive' });
          return result;
        }
      } else {
        if (!db) throw new Error('Firestore not configured');
      }

      // 1. Get Fiscal Period
      let startDate: Date;
      let endDate: Date;

      if (customRange) {
        startDate = customRange.startDate;
        endDate = customRange.endDate;
      } else {
        const period = getFiscalMonthPeriod(month, customStartDay);
        startDate = period.startDate;
        endDate = period.endDate;
      }

      // 2. Get History for the period
      const allHistory = USE_D1 ? await (D1Client.getHistory() as Promise<any[]>) : accommodationHistory;
      const periodHistory = allHistory.filter(h => {
        const d = new Date(h.actionDate);
        return d >= new Date(startDate.toISOString()) && d <= new Date(endDate.toISOString());
      });

      // 3. Pre-load workers for all occupants to avoid empty workers array
      const allOccupantWorkerIds = new Set<string>();
      (dataOccupants || []).forEach(occ => allOccupantWorkerIds.add(occ.workerId));
      periodHistory.forEach(h => allOccupantWorkerIds.add(h.workerId));

      let availableWorkers = dataWorkers || []; // Start with already loaded workers
      if (allOccupantWorkerIds.size > 0) {
        console.log(`[Invoice Generation] Pre-loading ${allOccupantWorkerIds.size} workers...`);
        const fetchedWorkers = await getWorkersByIds(Array.from(allOccupantWorkerIds));

        // Merge with existing workers
        const workerMap = new Map((availableWorkers || []).map(w => [w.id, w]));
        fetchedWorkers.forEach(w => workerMap.set(w.id, w));
        availableWorkers = Array.from(workerMap.values());

        console.log(`[Invoice Generation] Workers available for billing: ${availableWorkers.length}`);
      }

      // Find all active contracts for this month
      let activeContracts = (dataContracts || []).filter(c => {
        if (c.status !== 'Active') return false;
        const contractStart = new Date(c.startDate);
        const contractEnd = new Date(c.endDate);
        // Contract must overlap with fiscal period
        return contractStart < endDate && contractEnd > startDate;
      });

      // Apply company filter if specified
      if (filters?.companyId && filters.companyId !== 'all') {
        activeContracts = activeContracts.filter(c => c.companyId === filters.companyId);
        console.log(`[Invoice Generation] Filtered to company ${filters.companyId}: ${activeContracts.length} contracts`);
      }

      console.log(`[Invoice Generation] Found ${activeContracts.length} active contracts for period ${startDate.toISOString()} - ${endDate.toISOString()}`);
      console.log(`[Invoice Generation] Total occupants in system: ${(dataOccupants || []).length}`);
      console.log(`[Invoice Generation] Total workers in system: ${(dataWorkers || []).length}`);
      console.log(`[Invoice Generation] Total history records in period: ${periodHistory.length}`);

      for (const contract of activeContracts) {
        // Get all residence IDs for this contract (supports multiple residences)
        let contractResidenceIds = getContractResidenceIds(contract);

        // Apply residence filter if specified
        if (filters?.residenceId && filters.residenceId !== 'all') {
          contractResidenceIds = contractResidenceIds.filter(id => id === filters.residenceId);
          console.log(`[Invoice Generation] Filtered to residence ${filters.residenceId}: ${contractResidenceIds.length} residences`);
        }

        if (contractResidenceIds.length === 0) {
          console.warn(`Contract ${contract.id} has no residences (after filter) - skipping`);
          continue;
        }

// Resolve Company (use D1 data when available)
        const company = (USE_D1 ? dataCompanies : companies).find(c => c.id === contract.companyId);
        if (!company) {
          console.warn(`Company not found for contract ${contract.id}`);
          continue;
        }

        // Generate invoice for each residence in the contract
        for (const residenceId of contractResidenceIds) {
          try {
            // Check if invoice already exists for this month and residence (skip if forceRegenerate)
            if (!forceRegenerate) {
              const existing = invoices.find(inv =>
                inv.contractId === contract.id &&
                inv.month === month &&
                inv.residenceId === residenceId
              );
              if (existing) {
                console.log(`Invoice already exists for contract ${contract.id} residence ${residenceId} month ${month}`);
                continue;
              }
            }

            console.log(`[Invoice Debug] Processing residence ${residenceId}`);
            console.log(`[Invoice Debug] Total occupants: ${(dataOccupants || []).length}`);
            console.log(`[Invoice Debug] Occupants in this residence: ${(dataOccupants || []).filter(o => o.residenceId === residenceId).length}`);

            // Find ALL workers who were in this residence during the billing period
            // AND belong to this company
            const workerIdsInResidence = new Set<string>();

            // Add currently occupied workers (no checkout date)
            (dataOccupants || [])
              .filter(occ => occ.residenceId === residenceId && !occ.until)
              .forEach(occ => workerIdsInResidence.add(occ.workerId));

            // Add workers who were in this residence during the billing period (including checked out)
            (dataOccupants || [])
              .filter(occ => {
                if (occ.residenceId !== residenceId) return false;
                const occStart = new Date(occ.since);
                const occEnd = occ.until ? new Date(occ.until) : endDate;
                // Check if occupancy overlaps with billing period (use >= for same day)
                return occStart <= endDate && occEnd >= startDate;
              })
              .forEach(occ => workerIdsInResidence.add(occ.workerId));

            // Add workers from historical movements in this period
            periodHistory
              .filter(h => h.residenceId === residenceId)
              .forEach(h => workerIdsInResidence.add(h.workerId));

            // Also check toResidenceId for transfers
            periodHistory
              .filter(h => h.toResidenceId === residenceId)
              .forEach(h => workerIdsInResidence.add(h.workerId));

            // Filter to only workers belonging to this company
            const companyName = (company.name || '').trim().toLowerCase();
            const companyNameAr = (company.nameAr || '').trim().toLowerCase();
            const companyNameEn = (company.nameEn || '').trim().toLowerCase();
            const companyId = (company.id || '').trim().toLowerCase();

            const residenceWorkers = availableWorkers.filter(w => {
              if (!workerIdsInResidence.has(w.id)) return false;

              const workerCompany = (w.company || '').trim().toLowerCase();
              return (
                workerCompany === companyName ||
                workerCompany === companyNameAr ||
                workerCompany === companyNameEn ||
                workerCompany === companyId
              );
            });

            console.log(`[Invoice Generation] Contract ${contract.id}, Residence ${residenceId}: Found ${residenceWorkers.length} workers for company "${company.name}" (Total in residence: ${workerIdsInResidence.size})`);

            if (residenceWorkers.length === 0) {
              console.warn(`No workers found for company "${company.name}" in residence ${residenceId} (contract ${contract.id})`);
            }

            // Calculate Days for each worker
            const workerBreakdown: any[] = [];
            let totalBillableDays = 0;

            for (const worker of residenceWorkers) {
              // Filter movements for this worker in this residence
              const workerMovements = periodHistory.filter(h =>
                h.workerId === worker.id &&
                h.residenceId === residenceId
              ).sort((a, b) => new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime());

              // Check if currently occupying
              const currentOccupancy = (dataOccupants || []).find(o =>
                o.workerId === worker.id && o.residenceId === residenceId && !o.until
              );

              // Check all occupancy records that overlap with the billing period
              const allWorkerOccupancy = (dataOccupants || []).filter(o => {
                if (o.workerId !== worker.id || o.residenceId !== residenceId) return false;
                const occStart = new Date(o.since);
                const occEnd = o.until ? new Date(o.until) : endDate;
                // Only include records that overlap with billing period
                return occStart <= endDate && occEnd >= startDate;
              });

              // Debug logging for specific worker
              if (worker.name && (worker.name.includes('RAHEEM') || worker.name.includes('MAROOF'))) {
                console.log(`[DEBUG] Worker: ${worker.name}`);
                console.log(`[DEBUG] Billing period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
                console.log(`[DEBUG] All occupancy records for this worker:`, allWorkerOccupancy.map(o => ({
                  since: o.since,
                  until: o.until,
                  residenceId: o.residenceId
                })));
                console.log(`[DEBUG] Movements count:`, workerMovements.length);
                console.log(`[DEBUG] Movements:`, workerMovements.map(m => ({
                  actionType: m.actionType,
                  actionDate: m.actionDate,
                  residenceId: m.residenceId,
                  toResidenceId: m.toResidenceId,
                  fromResidenceId: m.fromResidenceId
                })));
              }

              // Determine initial state at startDate
              let isInside = false;

              if (workerMovements.length > 0) {
                const firstEvent = workerMovements[0];
                const firstType = firstEvent.actionType;
                // If first event is leaving, they must have been inside
                // For TRANSFER, check if it's outgoing from this residence
                const isTransferOut = firstType === 'TRANSFER' && firstEvent.fromResidenceId === residenceId;

                if (firstType === 'CHECK_OUT' || isTransferOut) {
                  isInside = true;
                }
              } else {
                // No movements in period - check occupancy records
                // Check if there's any occupancy record that overlaps with the billing period
                for (const occ of allWorkerOccupancy) {
                  const occStart = new Date(occ.since);
                  const occEnd = occ.until ? new Date(occ.until) : endDate;

                  // Check if occupancy overlaps with billing period (use >= for same day)
                  if (occStart <= endDate && occEnd >= startDate) {
                    isInside = true;
                    break;
                  }
                }

                // Fallback: If currently occupied and check-in was before period start
                if (!isInside && currentOccupancy) {
                  if (new Date(currentOccupancy.since) < startDate) {
                    isInside = true;
                  }
                }
              }

              // Calculate active days
              let days = 0;
              let currentStatus = isInside;
              let lastDate = startDate;

              // If no movements, calculate from occupancy records
              if (workerMovements.length === 0) {
                // Find the relevant occupancy records that overlap with billing period
                for (const occ of allWorkerOccupancy) {
                  const occStart = new Date(occ.since);
                  const occEnd = occ.until ? new Date(occ.until) : endDate;

                  // Calculate overlap with billing period
                  const effectiveStart = occStart > startDate ? occStart : startDate;
                  const effectiveEnd = occEnd < endDate ? occEnd : endDate;

                  if (effectiveStart <= effectiveEnd) {
                    // +1 to include both start and end days (same day = 1, consecutive = 2)
                    const diff = differenceInDays(effectiveEnd, effectiveStart) + 1;
                    days += Math.max(0, diff);

                    // Debug logging
                    if (worker.name && worker.name.includes('RAHEEM')) {
                      console.log(`[DEBUG] Occupancy record:`, {
                        since: occ.since,
                        until: occ.until,
                        effectiveStart: effectiveStart.toISOString(),
                        effectiveEnd: effectiveEnd.toISOString(),
                        calculatedDays: diff
                      });
                    }
                  }
                }
              } else {
                // Use movement-based calculation
                if (worker.name && (worker.name.includes('RAHEEM') || worker.name.includes('MAROOF'))) {
                  console.log(`[DEBUG] Using movement-based calculation, initial status:`, currentStatus);
                }

                for (const event of workerMovements) {
                  const eventDate = new Date(event.actionDate);
                  if (eventDate < startDate) continue;
                  if (eventDate > endDate) break;

                  if (currentStatus) {
                    // +1 to include both start and end days (same day = 1, consecutive = 2)
                    const diff = differenceInDays(eventDate, lastDate) + 1;
                    days += diff;

                    if (worker.name && (worker.name.includes('RAHEEM') || worker.name.includes('MAROOF'))) {
                      console.log(`[DEBUG] Adding days from ${lastDate.toISOString()} to ${eventDate.toISOString()}: ${diff} days`);
                    }
                  }

                  const isTransferIn = event.actionType === 'TRANSFER' && event.toResidenceId === contract.residenceId;

                  if (event.actionType === 'CHECK_IN' || isTransferIn) {
                    currentStatus = true;
                    if (worker.name && (worker.name.includes('RAHEEM') || worker.name.includes('MAROOF'))) {
                      console.log(`[DEBUG] Status changed to IN at ${eventDate.toISOString()}`);
                    }
                  } else {
                    currentStatus = false;
                    if (worker.name && (worker.name.includes('RAHEEM') || worker.name.includes('MAROOF'))) {
                      console.log(`[DEBUG] Status changed to OUT at ${eventDate.toISOString()}`);
                    }
                  }
                  lastDate = eventDate;
                }

                // After last event, if still inside, add days until endDate
                if (currentStatus) {
                  // +1 to include both start and end days (same day = 1, consecutive = 2)
                  const diff = differenceInDays(endDate, lastDate) + 1;
                  days += diff;

                  if (worker.name && (worker.name.includes('RAHEEM') || worker.name.includes('MAROOF'))) {
                    console.log(`[DEBUG] Adding remaining days from ${lastDate.toISOString()} to ${endDate.toISOString()}: ${diff} days`);
                  }
                }

                if (worker.name && (worker.name.includes('RAHEEM') || worker.name.includes('MAROOF'))) {
                  console.log(`[DEBUG] Total calculated days:`, days);
                }
              }

              if (days > 0) {
                workerBreakdown.push({
                  workerId: worker.id,
                  name: worker.name,
                  days,
                  amount: (contract.ratePerPersonPerMonth / 30) * days
                });
                totalBillableDays += days;
              }
            }

            if (totalBillableDays === 0) {
              console.log(`No billable days for contract ${contract.id} residence ${residenceId}`);
              continue;
            }

            const totalAmount = workerBreakdown.reduce((sum, w) => sum + w.amount, 0);

            // Generate short invoice ID: inv_CityAbbr_ResAbbr_YYMM
            const residenceObj = residences.find(r => r.id === residenceId);
            const cityAbbr = (residenceObj?.city || 'UNK').substring(0, 3).toUpperCase();
            const resAbbr = (residenceObj?.name || residenceId).substring(0, 4).replace(/[^a-zA-Z0-9]/g, '');
            const yearMonth = month.replace('-', '').substring(2); // YYMM from YYYYMM

            const invoice: Invoice = {
              id: `inv_${cityAbbr}_${resAbbr}_${yearMonth}`,
              contractId: contract.id,
              companyId: contract.companyId,
              residenceId: residenceId,
              month,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              numberOfWorkers: workerBreakdown.length,
              numberOfDays: totalBillableDays,
              ratePerPerson: contract.ratePerPersonPerMonth,
              totalAmount: Math.round(totalAmount * 100) / 100,
              status: 'Pending',
              generatedAt: new Date().toISOString(),
              notes: JSON.stringify(workerBreakdown),
            };

            await saveInvoice(invoice);
            result.generated++;
          } catch (e) {
            console.error(`Failed to generate invoice for contract ${contract.id} residence ${residenceId}:`, e);
            result.errors++;
          }
        } // end for each residence
      } // end for each contract

      toast({
        title: 'Invoice Generation Complete',
        description: `Generated ${result.generated} invoices with ${result.errors} errors`
      });
    } catch (e) {
      console.error('generateMonthlyInvoices failed:', e);
      toast({ title: 'Error', description: 'Failed to generate invoices', variant: 'destructive' });
    }
    return result;
  }

  // ============ UTILITY FUNCTIONS ============

  // Helper to get effective residence IDs from a contract
  function getContractResidenceIds(contract: Contract): string[] {
    // If residenceIds is set, use it
    if (contract.residenceIds && contract.residenceIds.length > 0) {
      // If 'all' is in the array, return all residence IDs
      if (contract.residenceIds.includes('all')) {
        return residences.map(r => r.id);
      }
      return contract.residenceIds;
    }
    // Fallback to legacy single residenceId
    if (contract.residenceId) {
      // If 'all', return all residence IDs
      if (contract.residenceId === 'all') {
        return residences.map(r => r.id);
      }
      return [contract.residenceId];
    }
    return [];
  }

  function getContractsByCompany(companyId: string): Contract[] {
    return contracts.filter(c => c.companyId === companyId);
  }

  function getInvoicesByContract(contractId: string): Invoice[] {
    return invoices.filter(inv => inv.contractId === contractId);
  }

  function getActiveContractsForResidence(residenceId: string): Contract[] {
    return contracts.filter(c => c.residenceId === residenceId && c.status === 'Active');
  }

  // ============ NEW: HISTORY QUERY FUNCTIONS ============
  function getWorkerHistory(workerId: string): AccommodationHistory[] {
    return accommodationHistory
      .filter(h => h.workerId === workerId && h.notes !== 'Auto-archived from occupants collection')
      .sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());
  }

  function getRoomHistory(residenceId: string, roomId: string): AccommodationHistory[] {
    return accommodationHistory
      .filter(h =>
        (h.residenceId === residenceId && h.roomId === roomId) ||
        (h.toResidenceId === residenceId && h.toRoomId === roomId) ||
        (h.fromResidenceId === residenceId && h.fromRoomId === roomId)
      )
      .sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());
  }

  function getHistoryByDateRange(startDate: string, endDate: string): AccommodationHistory[] {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return accommodationHistory
      .filter(h => {
        const actionTime = new Date(h.actionDate).getTime();
        return actionTime >= start && actionTime <= end;
      })
      .sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());
  }

  // Async History Fetching
  async function fetchWorkerHistory(workerId: string): Promise<AccommodationHistory[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, 'accommodationHistory'), where('workerId', '==', workerId));
      const snap = await getDocs(q);
      return snap.docs
        .map((d: any) => ({ id: d.id, ...d.data() } as AccommodationHistory))
        .filter((h: AccommodationHistory) => h.notes !== 'Auto-archived from occupants collection')
        .sort((a: AccommodationHistory, b: AccommodationHistory) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());
    } catch (e) {
      console.error("Failed to fetch worker history", e);
      return [];
    }
  }

  async function fetchRoomHistory(roomId: string): Promise<AccommodationHistory[]> {
    if (!db) return [];
    try {
      // Fetch history where room is involved as main room, from room, or to room
      const q1 = query(collection(db, 'accommodationHistory'), where('roomId', '==', roomId));
      const q2 = query(collection(db, 'accommodationHistory'), where('toRoomId', '==', roomId));
      const q3 = query(collection(db, 'accommodationHistory'), where('fromRoomId', '==', roomId));

      const [s1, s2, s3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);

      const allDocs = [...s1.docs, ...s2.docs, ...s3.docs];
      // Deduplicate by ID
      const uniqueDocs = Array.from(new Map(allDocs.map((d: any) => [d.id, d])).values());

      return uniqueDocs.map((d: any) => ({ id: d.id, ...d.data() } as AccommodationHistory))
        .sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());
    } catch (e) {
      console.error("Failed to fetch room history", e);
      return [];
    }
  }

  // ============ NEW: ENHANCED OPERATIONS WITH HISTORY ============

  // Helper: Create history record
  async function createHistoryRecord(historyData: Omit<AccommodationHistory, 'id'>): Promise<string> {
    const id = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const history: AccommodationHistory = {
      ...historyData,
      id,
    };

    try {
      if (db) {
        await setDoc(doc(db, 'accommodationHistory', id), history);
      }
      setAccommodationHistory(prev => [history, ...prev]);

      // Also save to localStorage as fallback
      try {
        if (typeof window !== 'undefined') {
          const existing = localStorage.getItem('ac_history');
          const historyList = existing ? JSON.parse(existing) : [];
          historyList.unshift(history);
          localStorage.setItem('ac_history', JSON.stringify(historyList));
        }
      } catch (localErr) {
        console.warn('Failed to save history to localStorage:', localErr);
      }

      return id;
    } catch (e) {
      console.error('Failed to create history record:', e);
      // Don't throw - allow operation to continue without history
      return id;
    }
  }

  // Delete history record
  async function deleteHistoryRecord(historyId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      if (!db) return { ok: false, error: 'Database not available' };

      // Delete from Firestore
      await deleteDoc(doc(db, 'accommodationHistory', historyId));

      // Update local state
      setAccommodationHistory(prev => prev.filter(h => h.id !== historyId));

      // Update localStorage
      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem('ac_history');
        if (existing) {
          const historyList = JSON.parse(existing);
          const filtered = historyList.filter((h: AccommodationHistory) => h.id !== historyId);
          localStorage.setItem('ac_history', JSON.stringify(filtered));
        }
      }

      toast({
        title: "تم حذف السجل ✅",
        description: "تم حذف السجل من التاريخ بنجاح",
      });

      return { ok: true };
    } catch (e: any) {
      console.error('Failed to delete history record:', e);
      toast({
        title: "فشل حذف السجل ❌",
        description: e.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
      return { ok: false, error: e.message };
    }
  }

  // Update history record
  async function updateHistoryRecord(historyId: string, updates: Partial<AccommodationHistory>): Promise<{ ok: boolean; error?: string }> {
    try {
      if (!db) return { ok: false, error: 'Database not available' };

      // Update in Firestore
      await updateDoc(doc(db, 'accommodationHistory', historyId), updates);

      // Update local state
      setAccommodationHistory(prev => prev.map(h =>
        h.id === historyId ? { ...h, ...updates } : h
      ));

      // Update localStorage
      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem('ac_history');
        if (existing) {
          const historyList = JSON.parse(existing);
          const updated = historyList.map((h: AccommodationHistory) =>
            h.id === historyId ? { ...h, ...updates } : h
          );
          localStorage.setItem('ac_history', JSON.stringify(updated));
        }
      }

      toast({
        title: "تم تحديث السجل ✅",
        description: "تم تحديث السجل بنجاح",
      });

      return { ok: true };
    } catch (e: any) {
      console.error('Failed to update history record:', e);
      toast({
        title: "فشل تحديث السجل ❌",
        description: e.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
      return { ok: false, error: e.message };
    }
  }

  // Undo last action for a worker
  async function undoLastAction(workerId: string): Promise<{ ok: boolean; error?: string; message?: string }> {
    try {
      if (!db) return { ok: false, error: 'Database not available' };

      // Get worker's last action
      const workerHistory = accommodationHistory
        .filter(h => h.workerId === workerId)
        .sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());

      if (workerHistory.length === 0) {
        return { ok: false, error: 'No history found for this worker' };
      }

      const lastAction = workerHistory[0];
      const now = new Date();
      const actionDate = new Date(lastAction.actionDate);
      const diffMinutes = (now.getTime() - actionDate.getTime()) / (1000 * 60);

      // Only allow undo within 30 minutes
      if (diffMinutes > 30) {
        return {
          ok: false,
          error: 'Cannot undo actions older than 30 minutes',
          message: `هذه العملية تمت منذ ${Math.round(diffMinutes)} دقيقة. يمكن التراجع فقط عن العمليات خلال 30 دقيقة.`
        };
      }

      const currentUser = auth?.currentUser?.uid || 'system';

      // Handle different action types
      if (lastAction.actionType === 'CHECK_IN') {
        // Undo check-in: remove from occupants
        const occQuery = query(
          collection(db, 'occupants'),
          where('workerId', '==', workerId),
          where('residenceId', '==', lastAction.residenceId),
          where('roomId', '==', lastAction.roomId),
          where('until', '==', null)
        );

        const occSnap = await getDocs(occQuery);
        if (!occSnap.empty) {
          await deleteDoc(occSnap.docs[0].ref);
        }

        // Delete history record
        await deleteDoc(doc(db, 'accommodationHistory', lastAction.id));
        setAccommodationHistory(prev => prev.filter(h => h.id !== lastAction.id));

        toast({
          title: "تم التراجع عن التسكين ✅",
          description: `تم إلغاء تسكين العامل في ${lastAction.residenceName} / ${lastAction.roomName}`,
        });

        return { ok: true, message: 'تم التراجع عن عملية التسكين بنجاح' };

      } else if (lastAction.actionType === 'CHECK_OUT') {
        // Undo check-out: restore occupant record
        const occQuery = query(
          collection(db, 'occupants'),
          where('workerId', '==', workerId),
          where('residenceId', '==', lastAction.residenceId),
          where('roomId', '==', lastAction.roomId),
          where('until', '!=', null)
        );

        const occSnap = await getDocs(occQuery);
        if (!occSnap.empty) {
          // Restore the occupant by removing check-out date
          await updateDoc(occSnap.docs[0].ref, {
            until: null,
            checkOutBy: null,
            checkoutType: null,
          });
        }

        // Delete history record
        await deleteDoc(doc(db, 'accommodationHistory', lastAction.id));
        setAccommodationHistory(prev => prev.filter(h => h.id !== lastAction.id));

        toast({
          title: "تم التراجع عن الإخراج ✅",
          description: `تم إلغاء إخراج العامل من ${lastAction.residenceName} / ${lastAction.roomName}`,
        });

        return { ok: true, message: 'تم التراجع عن عملية الإخراج بنجاح' };

      } else if (lastAction.actionType === 'TRANSFER') {
        // Undo transfer: revert to previous location
        // This is more complex - need to check-out from new location and check-in to old location

        if (!lastAction.fromResidenceId || !lastAction.fromRoomId) {
          return { ok: false, error: 'Cannot undo transfer - missing original location data' };
        }

        // Check out from current (new) location
        const currentOccQuery = query(
          collection(db, 'occupants'),
          where('workerId', '==', workerId),
          where('until', '==', null)
        );

        const currentOccSnap = await getDocs(currentOccQuery);
        if (!currentOccSnap.empty) {
          await deleteDoc(currentOccSnap.docs[0].ref);
        }

        // Check back in to original location
        const occupantData: Occupant = {
          workerId,
          residenceId: lastAction.fromResidenceId,
          roomId: lastAction.fromRoomId,
          buildingId: lastAction.buildingId,
          floorId: lastAction.floorId,
          since: lastAction.actionDate, // Use original date
          checkInBy: currentUser,
        };

        await addDoc(collection(db, 'occupants'), occupantData);

        // Delete transfer history record
        await deleteDoc(doc(db, 'accommodationHistory', lastAction.id));
        setAccommodationHistory(prev => prev.filter(h => h.id !== lastAction.id));

        toast({
          title: "تم التراجع عن النقل ✅",
          description: `تم إلغاء نقل العامل وإعادته إلى ${lastAction.fromResidenceName} / ${lastAction.fromRoomName}`,
        });

        return { ok: true, message: 'تم التراجع عن عملية النقل بنجاح' };
      }

      return { ok: false, error: 'Unsupported action type for undo' };

    } catch (e: any) {
      console.error('Failed to undo last action:', e);
      toast({
        title: "فشل التراجع عن العملية ❌",
        description: e.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
      return { ok: false, error: e.message };
    }
  }

  // Enhanced Check-In with history
  async function checkInWorker(params: {
    workerId: string;
    residenceId: string;
    roomId: string;
    buildingId?: string;
    floorId?: string;
    checkInDate?: string;
    notes?: string;
    performedBy: string;
    silent?: boolean;
    emergencyMode?: boolean;
  }): Promise<{ ok: boolean; error?: string; historyId?: string }> {
    try {
      console.log('🔵 [checkInWorker] Starting optimized check-in:', params);

      // Use optimized async check-in (no massive reads)
      const result = await checkInWorkerAsync({
        workerId: params.workerId,
        residenceId: params.residenceId,
        roomId: params.roomId,
        checkInDate: params.checkInDate,
        performedBy: params.performedBy,
        emergencyMode: params.emergencyMode
      });

      if (!result.ok) {
        if (!params.silent) {
          toast({
            title: "فشل التسكين",
            description: result.error || 'حدث خطأ غير متوقع',
            variant: "destructive",
          });
        }
        return { ok: false, error: result.error };
      }

      // Create history record (best effort)
      let historyId: string | undefined;
      try {
        // Fetch worker details for history if not in local cache
        let workerName = workers.find(w => w.id === params.workerId)?.name;
        let workerNat = workers.find(w => w.id === params.workerId)?.nationality;

        if (!workerName && db) {
          const snap = await getDocs(query(collection(db, 'workers'), where('id', '==', params.workerId), limit(1)));
          if (!snap.empty) {
            const d = snap.docs[0].data();
            workerName = d.name;
            workerNat = d.nationality;
          }
        }

        const residence = residences.find(r => r.id === params.residenceId);
        const room = findRoom(params.residenceId, params.roomId);

        historyId = await createHistoryRecord({
          workerId: params.workerId,
          workerName: workerName || 'Unknown',
          workerNationality: workerNat,
          actionType: 'CHECK_IN',
          actionDate: params.checkInDate || new Date().toISOString(),
          actionBy: params.performedBy,
          residenceId: params.residenceId,
          residenceName: residence?.name,
          buildingId: params.buildingId,
          floorId: params.floorId,
          roomId: params.roomId,
          roomName: room?.name || params.roomId,
          notes: params.notes,
          isEmergency: params.emergencyMode || residence?.isEmergencyMode,
          createdAt: new Date().toISOString(),
        });
      } catch (historyError) {
        console.warn('⚠️ [checkInWorker] History record failed (non-critical):', historyError);
      }

      if (!params.silent) {
        toast({
          title: "تم التسكين بنجاح ✅",
          description: `تم تسكين العامل بنجاح`,
        });
      }

      return { ok: true, historyId };
    } catch (e: any) {
      console.error('❌ [checkInWorker] Failed with error:', e);
      return { ok: false, error: e.message || 'unknown-error' };
    }
  }

  // Enhanced Check-Out with history
  async function checkOutWorkerEnhanced(params: {
    workerId: string;
    checkOutDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
    transferCity?: string; // NEW
  }): Promise<{ ok: boolean; error?: string; historyId?: string }> {
    try {
      // Helper function to calculate duration (including check-in day)
      const calculateDuration = (sinceDate: string, untilDate: string): number => {
        const since = new Date(sinceDate);
        const until = new Date(untilDate);
        since.setHours(0, 0, 0, 0);
        until.setHours(0, 0, 0, 0);
        const diffTime = until.getTime() - since.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(diffDays + 1, 1); // +1 to include check-in day, minimum 1 day
      };

      // Find current occupancy
      const occ = occupants.find(o => o.workerId === params.workerId && !o.until);
      if (!occ) {
        // Try async check if not in local state
        const asyncOcc = await checkWorkerOccupancy(params.workerId);
        if (!asyncOcc) return { ok: false, error: 'occupant-not-found' };

        // Calculate duration
        const checkOutDate = params.checkOutDate || new Date().toISOString();
        const duration = asyncOcc.since ? calculateDuration(asyncOcc.since, checkOutDate) : undefined;

        // Use async result
        const result = await checkOutWorkerAsync({
          workerId: params.workerId,
          residenceId: asyncOcc.residenceId,
          roomId: asyncOcc.roomId,
          checkOutDate: params.checkOutDate,
          performedBy: params.performedBy,
          checkoutType: params.reason as any, // Pass reason as type
          transferCity: params.transferCity
        });

        if (!result.ok) return { ok: false, error: result.error };

        // Create history with duration
        const historyId = await createHistoryRecord({
          workerId: params.workerId,
          actionType: 'CHECK_OUT',
          actionDate: checkOutDate,
          actionBy: params.performedBy,
          residenceId: asyncOcc.residenceId,
          roomId: asyncOcc.roomId,
          reason: params.reason,
          notes: params.notes,
          duration: duration,
          createdAt: new Date().toISOString()
        });

        return { ok: true, historyId };
      }

      // Calculate duration for local occ
      const checkOutDateLocal = params.checkOutDate || new Date().toISOString();
      const durationLocal = occ.since ? calculateDuration(occ.since, checkOutDateLocal) : undefined;

      // Use local occ
      const result = await checkOutWorkerAsync({
        workerId: params.workerId,
        residenceId: occ.residenceId,
        roomId: occ.roomId,
        checkOutDate: params.checkOutDate,
        performedBy: params.performedBy,
        checkoutType: params.reason as any,
        transferCity: params.transferCity
      });

      if (!result.ok) return { ok: false, error: result.error };

      const residence = residences.find(r => r.id === occ.residenceId);
      const room = findRoom(occ.residenceId, occ.roomId);

      // Create history with duration
      const historyId = await createHistoryRecord({
        workerId: params.workerId,
        workerName: workers.find(w => w.id === params.workerId)?.name || 'Unknown',
        actionType: 'CHECK_OUT',
        actionDate: checkOutDateLocal,
        actionBy: params.performedBy,
        residenceId: occ.residenceId,
        residenceName: residence?.name,
        roomId: occ.roomId,
        roomName: room?.name || occ.roomId,
        reason: params.reason,
        notes: params.notes,
        duration: durationLocal,
        checkoutType: params.reason as any,
        createdAt: new Date().toISOString()
      });

      return { ok: true, historyId };
    } catch (e: any) {
      console.error('checkOutWorkerEnhanced failed', e);
      return { ok: false, error: e.message || 'unknown-error' };
    }
  }

  // Enhanced Transfer with history
  async function transferWorker(params: {
    workerId: string;
    toResidenceId: string;
    toRoomId: string;
    toBuildingId?: string;
    toFloorId?: string;
    transferDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
  }): Promise<{ ok: boolean; error?: string; historyId?: string }> {
    try {
      const w = workers.find(x => x.id === params.workerId);
      if (!w) return { ok: false, error: "worker-not-found" };

      const currentOccupant = occupants.find(o => o.workerId === params.workerId && !o.until);
      if (!currentOccupant) return { ok: false, error: "worker-not-assigned" };

      // Check target room
      const toRoom = findRoom(params.toResidenceId, params.toRoomId);
      if (!toRoom) return { ok: false, error: "target-room-not-found" };

      // Check Emergency Mode
      const toResidence = residences.find(r => r.id === params.toResidenceId);
      const isEmergency = toResidence?.isEmergencyMode;

      if (!isEmergency) {
        // Relaxed metadata check (use defaults if missing, similar to checkInWorkerAsync)
        const spaceSqm = toRoom.spaceSqm || 16;
        const roomType = toRoom.roomType || 'Worker';
        // if (!toRoom.spaceSqm || !toRoom.roomType) return { ok: false, error: "target-room-metadata-missing" };

        // Nationality check
        const targetRoomOccupants = occupants.filter(o =>
          o.roomId === params.toRoomId &&
          o.residenceId === params.toResidenceId &&
          !o.until
        );

        if (targetRoomOccupants.length > 0) {
          const firstWorker = workers.find(x => x.id === targetRoomOccupants[0].workerId);
          if (firstWorker && firstWorker.nationality && w.nationality && firstWorker.nationality !== w.nationality) {
            return { ok: false, error: "nationality-mismatch" };
          }
        }

        // Capacity check (Dynamic based on roles)
        const usedSqm = targetRoomOccupants.reduce((sum, o) => {
          const occWorker = workers.find(wk => wk.id === o.workerId);
          const role = occWorker?.role || 'Worker';
          return sum + (role === 'Engineer' ? 16 : role === 'Supervisor' ? 8 : 4);
        }, 0);

        const incomingWorkerRole = w.role || 'Worker';
        const requiredSqm = incomingWorkerRole === 'Engineer' ? 16 : incomingWorkerRole === 'Supervisor' ? 8 : 4;

        if (usedSqm + requiredSqm > Number(spaceSqm)) {
          return { ok: false, error: `target-room-full (Used: ${usedSqm}, Req: ${requiredSqm}, Space: ${spaceSqm})` };
        }
      }

      const transferDate = params.transferDate || new Date().toISOString();

      // Get names for history
      const fromResidence = residences.find(r => r.id === currentOccupant.residenceId);
      const fromRoom = findRoom(currentOccupant.residenceId, currentOccupant.roomId);
      // const toResidence = residences.find(r => r.id === params.toResidenceId); // Already fetched above

      // Create history record
      const historyId = await createHistoryRecord({
        workerId: params.workerId,
        workerName: w.name,
        workerNationality: w.nationality,
        actionType: 'TRANSFER',
        actionDate: transferDate,
        actionBy: params.performedBy,
        fromResidenceId: currentOccupant.residenceId,
        fromResidenceName: fromResidence?.name,
        fromRoomId: currentOccupant.roomId,
        fromRoomName: fromRoom?.name || currentOccupant.roomId,
        toResidenceId: params.toResidenceId,
        toResidenceName: toResidence?.name,
        toRoomId: params.toRoomId,
        toRoomName: toRoom?.name || params.toRoomId,
        residenceId: params.toResidenceId,
        residenceName: toResidence?.name,
        roomId: params.toRoomId,
        roomName: toRoom?.name || params.toRoomId,
        reason: params.reason,
        notes: params.notes,
        checkoutType: (params.reason as any) || 'Transfer',
        createdAt: new Date().toISOString(),
      });

      // Check out from current room
      const updatedCurrentOccupant: Occupant = {
        ...currentOccupant,
        until: transferDate,
        checkOutBy: params.performedBy,
      };

      // Create new occupant record
      const newOccupant: Occupant = {
        workerId: params.workerId,
        residenceId: params.toResidenceId,
        roomId: params.toRoomId,
        buildingId: params.toBuildingId,
        floorId: params.toFloorId,
        since: transferDate,
        until: null,
        checkInBy: params.performedBy,
        notes: params.notes,
      };

      // Perform Check-Out
      const outResult = await checkOutWorkerAsync({
        workerId: params.workerId,
        residenceId: currentOccupant.residenceId,
        roomId: currentOccupant.roomId,
        checkOutDate: transferDate,
        performedBy: params.performedBy
      });

      if (!outResult.ok) {
        throw new Error(`Check-out failed: ${outResult.error}`);
      }

      // Perform Check-In
      const inResult = await checkInWorkerAsync({
        workerId: params.workerId,
        residenceId: params.toResidenceId,
        roomId: params.toRoomId,
        checkInDate: transferDate,
        performedBy: params.performedBy
      });

      if (!inResult.ok) {
        // Rollback check-out if possible? Or just report error.
        // For now, throw error.
        throw new Error(`Check-in failed: ${inResult.error}`);
      }

      toast({
        title: "تم النقل بنجاح",
        description: `تم نقل ${w.name} من ${fromRoom?.name || currentOccupant.roomId} إلى ${toRoom.name || params.toRoomId}`,
      });

      return { ok: true, historyId };
    } catch (e: any) {

      console.error('transferWorker failed:', e);
      const msg = e?.message || String(e || 'unknown-error');
      if (/D1|Cloudflare/i.test(msg)) {
        toast({ title: 'D1 unavailable', description: 'خدمة Cloudflare D1 غير متاحة حالياً، العملية لم تكتمل', variant: 'destructive' });
      }
      return { ok: false, error: msg };
    }
  }

  // Swap workers between rooms
  async function swapWorkers(params: {
    worker1Id: string;
    worker2Id: string;
    swapDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
  }): Promise<{ ok: boolean; error?: string; historyIds?: string[] }> {
    try {
      const w1 = workers.find(x => x.id === params.worker1Id);
      const w2 = workers.find(x => x.id === params.worker2Id);
      if (!w1 || !w2) return { ok: false, error: "worker-not-found" };

      const occ1 = occupants.find(o => o.workerId === params.worker1Id && !o.until);
      const occ2 = occupants.find(o => o.workerId === params.worker2Id && !o.until);
      if (!occ1 || !occ2) return { ok: false, error: "workers-not-assigned" };

      const swapDate = params.swapDate || new Date().toISOString();

      // Get names for history
      const res1 = residences.find(r => r.id === occ1.residenceId);
      const res2 = residences.find(r => r.id === occ2.residenceId);
      const room1 = findRoom(occ1.residenceId, occ1.roomId);
      const room2 = findRoom(occ2.residenceId, occ2.roomId);

      const history1Id = await createHistoryRecord({
        workerId: params.worker1Id,
        workerName: w1.name,
        workerNationality: w1.nationality,
        actionType: 'SWAP',
        actionDate: swapDate,
        actionBy: params.performedBy,
        fromResidenceId: occ1.residenceId,
        fromResidenceName: res1?.name,
        fromRoomId: occ1.roomId,
        fromRoomName: room1?.name || occ1.roomId,
        toResidenceId: occ2.residenceId,
        toResidenceName: res2?.name,
        toRoomId: occ2.roomId,
        toRoomName: room2?.name || occ2.roomId,
        residenceId: occ2.residenceId,
        residenceName: res2?.name,
        roomId: occ2.roomId,
        roomName: room2?.name || occ2.roomId,
        swappedWithWorkerId: params.worker2Id,
        swappedWithWorkerName: w2.name,
        reason: params.reason,
        notes: params.notes,
        createdAt: new Date().toISOString(),
      });

      const history2Id = await createHistoryRecord({
        workerId: params.worker2Id,
        workerName: w2.name,
        workerNationality: w2.nationality,
        actionType: 'SWAP',
        actionDate: swapDate,
        actionBy: params.performedBy,
        fromResidenceId: occ2.residenceId,
        fromResidenceName: res2?.name,
        fromRoomId: occ2.roomId,
        fromRoomName: room2?.name || occ2.roomId,
        toResidenceId: occ1.residenceId,
        toResidenceName: res1?.name,
        toRoomId: occ1.roomId,
        toRoomName: room1?.name || occ1.roomId,
        residenceId: occ1.residenceId,
        residenceName: res1?.name,
        roomId: occ1.roomId,
        roomName: room1?.name || occ1.roomId,
        swappedWithWorkerId: params.worker1Id,
        swappedWithWorkerName: w1.name,
        reason: params.reason,
        notes: params.notes,
        createdAt: new Date().toISOString(),
      });

      // Create new occupancies (swapped)
      const newOcc1: Occupant = {
        workerId: params.worker1Id,
        residenceId: occ2.residenceId,
        roomId: occ2.roomId,
        buildingId: occ2.buildingId,
        floorId: occ2.floorId,
        since: swapDate,
        until: null,
        checkInBy: params.performedBy,
        notes: params.notes,
      };

      const newOcc2: Occupant = {
        workerId: params.worker2Id,
        residenceId: occ1.residenceId,
        roomId: occ1.roomId,
        buildingId: occ1.buildingId,
        floorId: occ1.floorId,
        since: swapDate,
        until: null,
        checkInBy: params.performedBy,
        notes: params.notes,
      };

      if (db) {
        const occupantsRef = collection(db, 'occupants');

        // Optimize: Query specific documents instead of all
        const q1 = query(occupantsRef, where('workerId', '==', params.worker1Id), where('until', '==', null));
        const snap1 = await getDocs(q1);

        const q2 = query(occupantsRef, where('workerId', '==', params.worker2Id), where('until', '==', null));
        const snap2 = await getDocs(q2);

        if (!snap1.empty) await updateDoc(snap1.docs[0].ref, { until: swapDate, checkOutBy: params.performedBy });
        if (!snap2.empty) await updateDoc(snap2.docs[0].ref, { until: swapDate, checkOutBy: params.performedBy });

        // Create new occupancies
        await addDoc(occupantsRef, newOcc1);
        await addDoc(occupantsRef, newOcc2);
      }

      // Update local state: Remove old active records and add new ones
      setOccupants(prev => {
        const filtered = prev.filter(o =>
          !(o.workerId === params.worker1Id && !o.until) &&
          !(o.workerId === params.worker2Id && !o.until)
        );
        return [...filtered, newOcc1, newOcc2];
      });

      toast({
        title: "تم التبديل بنجاح",
        description: `تم تبديل ${w1.name} مع ${w2.name}`,
      });

      return { ok: true, historyIds: [history1Id, history2Id] };
    } catch (e: any) {
      console.error('swapWorkers failed:', e);
      return { ok: false, error: e.message || 'unknown-error' };
    }
  }

  // Batch import workers
  async function importWorkersBatch(workersList: Worker[]) {
    if (!db) return { ok: false, error: 'DB not available' };

    try {
      const batchSize = 450; // Firestore limit is 500
      const chunks = [];

      for (let i = 0; i < workersList.length; i += batchSize) {
        chunks.push(workersList.slice(i, i + batchSize));
      }

      let totalSuccess = 0;
      let totalErrors = 0;

      for (const chunk of chunks) {
        const batch = writeBatch(db);

        for (const worker of chunk) {
          const id = worker.id || `w_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const ref = doc(db, 'workers', id);
          batch.set(ref, {
            name: worker.name,
            employeeId: worker.employeeId || '',
            idNumber: worker.idNumber || '',
            nationality: worker.nationality || '',
            company: worker.company || '',
            role: worker.role || 'Worker'
          }, { merge: true });
        }

        await batch.commit();
        totalSuccess += chunk.length;
      }

      return { ok: true, count: totalSuccess };
    } catch (e: any) {
      console.error('Batch import failed', e);
      return { ok: false, error: e.message };
    }
  }

  // Delete All Workers (Danger Zone)
  async function deleteAllWorkers() {
    if (!db) return { ok: false, error: 'DB not available' };

    try {
      // Check if user is admin (client-side check, server rules still apply)
      if (auth?.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().role !== 'Admin') {
          return { ok: false, error: 'Permission denied: Only Admins can delete all workers.' };
        }
      }

      const q = query(collection(db, 'workers'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return { ok: true, count: 0 };

      const batchSize = 450;
      const docs = snapshot.docs;
      const chunks = [];

      for (let i = 0; i < docs.length; i += batchSize) {
        chunks.push(docs.slice(i, i + batchSize));
      }

      let deletedCount = 0;

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((doc: any) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        deletedCount += chunk.length;
      }

      // Clear local state
      setWorkers([]);

      return { ok: true, count: deletedCount };
    } catch (e: any) {
      console.error('Delete all failed', e);
      return { ok: false, error: e.message };
    }
  }

  // Batch Check-In (Optimized with Batch Writes)
  async function bulkCheckIn(params: {
    workerIds: string[];
    residenceId: string;
    roomId: string;
    buildingId?: string;
    floorId?: string;
    checkInDate?: string;
    notes?: string;
    performedBy: string;
    emergencyMode?: boolean;
  }): Promise<{ ok: boolean; results: Record<string, { success: boolean; error?: string; historyId?: string }> }> {
    if (USE_D1) {
      const results: Record<string, { success: boolean; error?: string; historyId?: string }> = {};
      try {
        const room = findRoom(params.residenceId, params.roomId);
        if (!room) {
          params.workerIds.forEach((id) => (results[id] = { success: false, error: 'room-not-found' }));
          return { ok: false, results };
        }
        const path = findRoomPath(params.residenceId, params.roomId);
        const since = params.checkInDate || new Date().toISOString();

        // Run sequentially to avoid hammering D1 with a burst of requests.
        for (const wid of params.workerIds) {
          try {
            const res = await D1Client.checkInWorker({
              workerId: wid,
              residenceId: params.residenceId,
              roomId: params.roomId,
              buildingId: path.buildingId,
              floorId: path.floorId,
              since,
              checkInBy: params.performedBy,
              isEmergency: params.emergencyMode,
            });
            if (res?.ok) {
              results[wid] = { success: true };
            } else {
              results[wid] = { success: false, error: res?.error || 'D1 error' };
            }
          } catch (e: any) {
            results[wid] = { success: false, error: String(e?.message || e || 'D1 error') };
          }
        }

        // Optimistic local update for all successful check-ins
        const successIds = Object.entries(results)
          .filter(([, r]) => r.success)
          .map(([id]) => id);
        if (successIds.length > 0) {
          setOccupants((prev) => {
            const without = prev.filter((o) => !(successIds.includes(o.workerId) && (o.until == null)));
            const added = successIds.map((wid) => ({
              id: `occ_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              workerId: wid,
              residenceId: params.residenceId,
              buildingId: path.buildingId,
              floorId: path.floorId,
              roomId: params.roomId,
              since,
              until: null,
              checkInBy: params.performedBy,
              isEmergency: !!params.emergencyMode,
              updatedAt: new Date().toISOString(),
            } as any));
            return [...without, ...added];
          });
          setWorkers((prev) => prev.map((w) => (successIds.includes(w.id) ? { ...w, status: 'Active', transferDestination: undefined } : w)));
        }

        scheduleD1Sync();
        const ok = Object.values(results).some((r) => r.success);
        return { ok, results };
      } catch (e: any) {
        console.error('D1 bulkCheckIn failed', e);
        return { ok: false, results };
      }
    }

    if (!db) return { ok: false, results: {} };

    const results: Record<string, { success: boolean; error?: string; historyId?: string }> = {};
    const successIds: string[] = [];
    const newOccupants: Occupant[] = [];
    const newHistory: AccommodationHistory[] = [];

    try {
      // 1. Fetch Room & Existing Occupants (Once)
      const room = findRoom(params.residenceId, params.roomId);
      if (!room) {
        params.workerIds.forEach(id => results[id] = { success: false, error: 'room-not-found' });
        return { ok: false, results };
      }

      const existingOccupants = await getRoomOccupantsAsync(params.residenceId, params.roomId);

      // 2. Determine Room State (Nationality & Role)
      let currentNationality: string | undefined;
      let currentRole: string | undefined;

      if (existingOccupants.length > 0) {
        // Check all occupants to find the room's nationality/role
        // We need to fetch details for existing occupants to be sure
        const occupantWorkerIds = existingOccupants.map(o => o.workerId);

        // Fetch details for up to 5 occupants to determine room state
        const checkIds = occupantWorkerIds.slice(0, 5);
        const promises = checkIds.map(id => getDoc(doc(db!, 'workers', id)));
        const snaps = await Promise.all(promises);

        for (const snap of snaps) {
          if (snap.exists()) {
            const d = snap.data() as Worker;
            if (d.nationality && !currentNationality) currentNationality = d.nationality;
            if (d.role && !currentRole) currentRole = d.role;

            // If we found both, break
            if (currentNationality && currentRole) break;
          }
        }
      }

      // 3. Process Workers
      // Fetch all workers in parallel (or use cache if available)
      // Since we need to check rules, we must have worker details.
      const workersToProcess: Worker[] = [];

      // Optimization: Check local cache first
      const missingWorkerIds: string[] = [];
      for (const wid of params.workerIds) {
        // ALWAYS fetch fresh data for critical operations to avoid stale role/nationality issues
        // const cached = workers.find(w => w.id === wid);
        // if (cached) workersToProcess.push(cached);
        // else missingWorkerIds.push(wid);
        missingWorkerIds.push(wid);
      }

      // Fetch missing workers
      if (missingWorkerIds.length > 0) {
        // Fetch individually to be safe (or use 'in' query if < 30)
        // For robustness, we'll fetch individually in parallel
        const promises = missingWorkerIds.map(id => getDoc(doc(db!, 'workers', id)));
        const snapshots = await Promise.all(promises);
        snapshots.forEach(snap => {
          if (snap.exists()) workersToProcess.push({ id: snap.id, ...snap.data() } as Worker);
          else results[snap.id] = { success: false, error: 'worker-not-found' };
        });
      }

      // 4. Validate & Prepare Batch
      const batch = writeBatch(db);
      let currentCount = existingOccupants.length;

      // Calculate capacity based on role
      // If room is empty, first valid worker sets the role
      // If room is occupied, role is fixed

      // Check for Residence Emergency Mode
      const residence = residences.find(r => r.id === params.residenceId);
      const isEmergency = params.emergencyMode || residence?.isEmergencyMode;

      // AUTO-CHECKOUT: For Transferring workers, check them out from previous residence one day before
      const checkInDate = params.checkInDate || new Date().toISOString();
      const newCheckInDate = new Date(checkInDate);
      const autoCheckOutDate = new Date(newCheckInDate);
      autoCheckOutDate.setDate(autoCheckOutDate.getDate() - 1);
      const autoCheckOutISO = autoCheckOutDate.toISOString();

      for (const worker of workersToProcess) {
        // AUTO-CHECKOUT: If worker is Transferring, find and checkout from previous residence
        if (worker.status === 'Transferring') {
          try {
            const currentOccupancyQuery = query(
              collection(db, 'occupants'),
              where('workerId', '==', worker.id),
              where('until', '==', null)
            );
            const currentOccSnap = await getDocs(currentOccupancyQuery);

            if (!currentOccSnap.empty) {
              const currentOcc = currentOccSnap.docs[0];
              const currentOccData = currentOcc.data();

              console.log(`🔄 [Auto-Checkout Bulk] Worker ${worker.id} is Transferring. Auto-checking out from residence ${currentOccData.residenceId} on ${autoCheckOutISO.split('T')[0]}`);

              // Add to batch: Update the current occupancy with checkout date
              batch.update(currentOcc.ref, {
                until: autoCheckOutISO,
                checkOutBy: params.performedBy,
                checkoutType: 'Transfer',
                notes: 'تم الإخراج تلقائياً عند التسكين في السكن الجديد'
              });

              // Update local state
              setOccupants(prev => prev.map(o =>
                o.id === currentOcc.id
                  ? { ...o, until: autoCheckOutISO, checkOutBy: params.performedBy, checkoutType: 'Transfer' }
                  : o
              ));

              console.log(`✅ [Auto-Checkout Bulk] Worker ${worker.id} will be checked out from previous residence`);
            }
          } catch (e) {
            console.warn(`⚠️ [Auto-Checkout Bulk] Failed to auto-checkout worker ${worker.id} (non-critical):`, e);
            // Continue with check-in even if auto-checkout fails
          }
        }

        // SKIP CHECKS IF EMERGENCY MODE
        if (!isEmergency) {
          // Rule 1: Nationality
          if (currentNationality && worker.nationality) {
            const rNat = currentNationality.trim().toLowerCase();
            const wNat = worker.nationality.trim().toLowerCase();
            if (rNat !== wNat) {
              results[worker.id] = { success: false, error: 'nationality-mismatch' };
              continue;
            }
          }

          // Rule 2: Role
          const workerRole = worker.role || 'Worker';
          if (currentRole && currentRole !== workerRole) {
            results[worker.id] = { success: false, error: 'role-mismatch' };
            continue;
          }

          // If room was empty and this is first valid worker, set state
          if (!currentNationality && !currentRole) {
            currentNationality = worker.nationality;
            currentRole = workerRole;
          }

          // Rule 3: Capacity
          // Use spaceSqm if available, otherwise fallback to capacity * 4 (standard worker space), or default 16
          const spaceSqm = room.spaceSqm || ((room.capacity || 4) * 4);
          const sqmPerPerson = (currentRole === 'Engineer') ? 16 : (currentRole === 'Supervisor' ? 8 : 4);
          const cap = Math.floor(spaceSqm / sqmPerPerson);

          if (currentCount >= cap) {
            results[worker.id] = { success: false, error: 'room-full' };
            continue;
          }
        }

        // Valid! Prepare writes
        const occId = `occ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const histId = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const checkInDate = params.checkInDate || new Date().toISOString();

        // Occupant Doc
        const newOcc: Occupant = {
          id: occId,
          workerId: worker.id,
          residenceId: params.residenceId,
          roomId: params.roomId,
          buildingId: params.buildingId,
          floorId: params.floorId,
          since: checkInDate,
          until: null,
          checkInBy: params.performedBy,
          notes: params.notes,
          isEmergency: isEmergency || false
        };
        batch.set(doc(db, 'occupants', occId), newOcc);

        // Update worker status to Active if they were Transferring
        if (worker.status === 'Transferring') {
          batch.update(doc(db, 'workers', worker.id), {
            status: 'Active',
            transferDestination: null
          });

          // Update local state
          setWorkers(prev => prev.map(w =>
            w.id === worker.id
              ? { ...w, status: 'Active', transferDestination: undefined }
              : w
          ));
        }

        // History Doc
        const newHist: AccommodationHistory = {
          id: histId,
          workerId: worker.id,
          workerName: worker.name,
          workerNationality: worker.nationality,
          actionType: 'CHECK_IN',
          actionDate: checkInDate,
          actionBy: params.performedBy,
          residenceId: params.residenceId,
          residenceName: residences.find(r => r.id === params.residenceId)?.name,
          buildingId: params.buildingId,
          floorId: params.floorId,
          roomId: params.roomId,
          roomName: room.name || params.roomId,
          notes: params.notes,
          isEmergency: isEmergency || false,
          createdAt: new Date().toISOString(),
        };
        batch.set(doc(db, 'accommodationHistory', histId), newHist);

        // Track success
        results[worker.id] = { success: true, historyId: histId };
        successIds.push(worker.id);
        newOccupants.push(newOcc);
        newHistory.push(newHist);
        currentCount++;
      }

      // 5. Commit Batch
      if (successIds.length > 0) {
        await batch.commit();

        // Update mutation timestamp
        lastMutationTimeRef.current = Date.now();

        // 6. Update Local State (Once)
        setOccupants(prev => {
          // Remove any stale entries for these workers if they exist (unlikely for check-in but safe)
          const filtered = prev.filter(o => !successIds.includes(o.workerId));
          return [...filtered, ...newOccupants];
        });

        setAccommodationHistory(prev => [...newHistory, ...prev]);
      }

    } catch (e: any) {
      console.error('Bulk Check-In Failed:', e);
      // Mark all pending as failed
      params.workerIds.forEach(id => {
        if (!results[id]) results[id] = { success: false, error: e.message || 'batch-error' };
      });
      return { ok: false, results };
    }

    const successCount = successIds.length;
    toast({
      title: "عملية التسكين الجماعي",
      description: `تم تسكين ${successCount} من ${params.workerIds.length} عامل بنجاح`,
      variant: successCount === params.workerIds.length ? "default" : "destructive",
    });

    return { ok: true, results };
  }

  // Batch Check-Out
  async function bulkCheckOut(params: {
    workerIds: string[];
    checkOutDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
    transferCity?: string; // NEW
  }) {
    const results: Record<string, { success: boolean; error?: string; historyId?: string }> = {};

    // Process sequentially to avoid race conditions/overload
    for (const wid of params.workerIds) {
      const res = await checkOutWorkerEnhanced({
        workerId: wid,
        checkOutDate: params.checkOutDate,
        reason: params.reason,
        notes: params.notes,
        performedBy: params.performedBy,
        transferCity: params.transferCity
      });
      results[wid] = { success: res.ok, error: res.error, historyId: res.historyId };
    }

    return { ok: true, results };
  }

  // Batch Transfer
  async function bulkTransfer(params: {
    workerIds: string[];
    toResidenceId: string;
    toRoomId: string;
    toBuildingId?: string;
    toFloorId?: string;
    transferDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
  }): Promise<{ ok: boolean; results: Record<string, { success: boolean; error?: string; historyId?: string }> }> {
    const results: Record<string, { success: boolean; error?: string; historyId?: string }> = {};

    for (const workerId of params.workerIds) {
      const result = await transferWorker({
        workerId,
        toResidenceId: params.toResidenceId,
        toRoomId: params.toRoomId,
        toBuildingId: params.toBuildingId,
        toFloorId: params.toFloorId,
        transferDate: params.transferDate,
        reason: params.reason,
        notes: params.notes,
        performedBy: params.performedBy,
      });

      results[workerId] = {
        success: result.ok,
        error: result.error,
        historyId: result.historyId,
      };
    }

    const successCount = Object.values(results).filter(r => r.success).length;
    const failures = Object.values(results).filter(r => !r.success);

    if (successCount === params.workerIds.length) {
      toast({
        title: "عملية النقل الجماعي",
        description: `تم نقل ${successCount} من ${params.workerIds.length} عامل بنجاح`,
      });
    } else {
      const uniqueErrors = Array.from(new Set(failures.map(f => f.error).filter(Boolean)));
      toast({
        title: "تنبيه في عملية النقل",
        description: `تم نقل ${successCount} وفشل ${failures.length}. الأسباب: ${uniqueErrors.join(", ")}`,
        variant: "destructive"
      });
    }

    return { ok: true, results };
  }

  // 🆕 Efficient Dashboard Stats Fetching
  const refreshDashboardStats = useCallback(async () => {
    if (!db) {
      console.warn('⚠️ [Dashboard] DB not available');
      return {
        totalWorkers: 0,
        assignedWorkers: 0,
        unassignedWorkers: 0,
        occupancyRate: 0,
        activeContracts: 0,
        totalCompanies: 0,
        pendingTransfers: 0,
        unpaidInvoices: 0,
        overdueInvoices: 0, // NEW
        residenceOccupancy: {},
        lastUpdated: Date.now()
      };
    }

    try {
      console.log('📊 [Dashboard] Refreshing stats...');

      // 1. Global counts
      const workersCount = (await getCountFromServer(collection(db, 'workers'))).data().count;
      // Only count ACTIVE occupants (where until is null)
      const occupantsCount = (await getCountFromServer(
        query(collection(db, 'occupants'), where('until', '==', null))
      )).data().count;
      const companiesCount = (await getCountFromServer(collection(db, 'companies'))).data().count;

      // 2. Active Contracts (status = Active)
      const activeContractsCount = (await getCountFromServer(
        query(collection(db, 'contracts'), where('status', '==', 'Active'))
      )).data().count;

      // 3. Pending Transfers (status = Pending)
      const pendingTransfersCount = (await getCountFromServer(
        query(collection(db, 'transferRequests'), where('status', '==', 'Pending'))
      )).data().count;

      // 4. Unpaid Invoices (status = Pending or Overdue)
      const unpaidInvoicesCount = (await getCountFromServer(
        query(collection(db, 'invoices'), where('status', 'in', ['Pending', 'Overdue']))
      )).data().count;

      // 5. Overdue Invoices (status = Overdue)
      const overdueInvoicesCount = (await getCountFromServer(
        query(collection(db, 'invoices'), where('status', '==', 'Overdue'))
      )).data().count;

      // 6. Occupancy by Residence
      const residenceOccupancy: Record<string, number> = {};
      const targetResidences = residences.length > 0 ? residences : [];

      await Promise.all(targetResidences.map(async (res) => {
        if (!db) return;
        const count = (await getCountFromServer(
          query(collection(db, 'occupants'), where('residenceId', '==', res.id), where('until', '==', null))
        )).data().count;
        residenceOccupancy[res.id] = count;
      }));

      // Calculate total capacity for occupancy rate
      let totalCapacity = 0;
      targetResidences.forEach(res => {
        if (res.rooms) {
          res.rooms.forEach(room => {
            if (room.spaceSqm && room.roomType) {
              const per = room.roomType === "Worker" ? 4 : room.roomType === "Supervisor" ? 8 : 16;
              totalCapacity += Math.floor(room.spaceSqm / per);
            } else if (room.capacity) {
              totalCapacity += room.capacity;
            }
          });
        }
        if (res.buildings) {
          res.buildings.forEach(b => b.floors?.forEach(f => f.rooms?.forEach(r => {
            if (r.spaceSqm && r.roomType) {
              const per = r.roomType === "Worker" ? 4 : r.roomType === "Supervisor" ? 8 : 16;
              totalCapacity += Math.floor(r.spaceSqm / per);
            } else if (r.capacity) {
              totalCapacity += r.capacity;
            }
          })));
        }
      });

      const stats: DashboardStats = {
        totalWorkers: workersCount,
        assignedWorkers: occupantsCount,
        unassignedWorkers: Math.max(0, workersCount - occupantsCount),
        occupancyRate: totalCapacity > 0 ? Math.round((occupantsCount / totalCapacity) * 100) : 0,
        activeContracts: activeContractsCount,
        totalCompanies: companiesCount,
        pendingTransfers: pendingTransfersCount,
        unpaidInvoices: unpaidInvoicesCount,
        overdueInvoices: overdueInvoicesCount,
        residenceOccupancy,
        lastUpdated: Date.now()
      };

      setDashboardStats(stats);
      return stats;

    } catch (error) {
      console.error('❌ [Dashboard] Failed to refresh stats:', error);
      // Do not return null to match return type Promise<DashboardStats>
      return {
        totalWorkers: 0,
        assignedWorkers: 0,
        unassignedWorkers: 0,
        occupancyRate: 0,
        activeContracts: 0,
        totalCompanies: 0,
        pendingTransfers: 0,
        unpaidInvoices: 0,
        overdueInvoices: 0,
        residenceOccupancy: {},
        lastUpdated: Date.now()
      };
    }
  }, [db, residences]);

  // 🆕 Automatic Archiving of Checked-out Occupants
  const autoArchiveOccupants = useCallback(async () => {
    if (!db) return;

    try {
      // Find occupants who are checked out (until is set)
      // Note: != null query works in Firestore
      const q = query(collection(db, 'occupants'), where('until', '!=', null), limit(20));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return;

      console.log(`🧹 [Auto Archive] Found ${snapshot.size} checked-out occupants. Archiving...`);

      const batch = writeBatch(db);
      let archivedCount = 0;

      for (const docSnap of snapshot.docs) {
        const occ = docSnap.data() as Occupant;

        // Calculate duration if both dates exist
        let duration: number | undefined;
        if (occ.since && occ.until) {
          const sinceDate = new Date(occ.since);
          const untilDate = new Date(occ.until);
          sinceDate.setHours(0, 0, 0, 0);
          untilDate.setHours(0, 0, 0, 0);
          const diffTime = untilDate.getTime() - sinceDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          duration = Math.max(diffDays + 1, 1); // +1 to include check-in day
        }

        // Create history record
        const historyRef = doc(collection(db, 'accommodationHistory'));
        batch.set(historyRef, {
          id: historyRef.id,
          workerId: occ.workerId,
          actionType: 'CHECK_OUT',
          actionDate: occ.until,
          actionBy: occ.checkOutBy || 'system',
          residenceId: occ.residenceId,
          roomId: occ.roomId,
          buildingId: occ.buildingId,
          floorId: occ.floorId,
          duration: duration,
          notes: 'Auto-archived from occupants collection',
          createdAt: new Date().toISOString()
        });

        // Delete from occupants
        batch.delete(docSnap.ref);
        archivedCount++;
      }

      await batch.commit();

      if (archivedCount > 0) {
        toast({
          title: "أرشفة تلقائية",
          description: `تم أرشفة ${archivedCount} سجل خروج قديم`,
        });
        // Refresh stats after cleanup
        refreshDashboardStats();
      }

    } catch (error) {
      console.error('❌ [Auto Archive] Failed:', error);
    }
  }, [db, toast, refreshDashboardStats]);

  const value: AccommodationContextValue = {
    residences,
    loading,
    refresh,
    workers,
    occupants,
    dashboardStats, // NEW
    refreshDashboardStats, // NEW
    autoArchiveOccupants, // NEW
    accommodationHistory, // NEW
    transferRequests,
    notifications,
    companies,
    contracts,
    invoices,
    findWorkers,
    // History queries - NEW
    getWorkerHistory,
    getRoomHistory,
    getHistoryByDateRange,
    // Async History Fetching
    fetchWorkerHistory,
    fetchRoomHistory,
    // History Management
    deleteHistoryRecord,
    updateHistoryRecord,
    undoLastAction,
    // 🚨 EMERGENCY: Manual sync function to replace real-time listeners
    manualSyncFromFirestore,
    // 🧹 Auto Archive
    // autoArchiveOccupants, // NEW (Removed duplicate)
    // ⚡ Optimized Async Operations
    findWorkerAsync,
    getWorkersByIds,
    getWorkerByIdOrEmployeeId,
    checkWorkerOccupancy,
    getTransferringWorkers,
    checkInWorkerAsync,
    checkOutWorkerAsync,
    getRoomOccupantsAsync,
    fetchOccupantsForFloor,
    importWorkersBatch,
    deleteAllWorkers,
    // Enhanced operations - NEW
    checkInWorker,
    checkOutWorkerEnhanced,
    transferWorker,
    swapWorkers,
    bulkCheckIn,
    bulkCheckOut,
    bulkTransfer,
    // Legacy operations
    saveWorker,
    deleteWorker,
    assignWorkerToRoom: async (workerId: string, residenceId: string, roomId: string, checkInDate?: string) => {
      const result = await checkInWorkerAsync({
        workerId,
        residenceId,
        roomId,
        checkInDate,
        performedBy: 'legacy-assign'
      });
      return { ok: result.ok, error: result.error || '' };
    },
    bulkAssign,
    checkOutWorker,
    quickTransfer,
    createTransferRequest,
    reviewTransferRequest,
    getDailyReport,
    getMonthlyReport,
    saveCompany,
    deleteCompany,
    saveContract,
    deleteContract,
    saveInvoice,
    deleteInvoice,
    generateMonthlyInvoices,
    getContractsByCompany,
    getInvoicesByContract,
    getActiveContractsForResidence,
  };

  return <AccommodationContext.Provider value={value}>{children}</AccommodationContext.Provider>;
}

export function useAccommodation() {
  const ctx = useContext(AccommodationContext);
  if (!ctx) throw new Error("useAccommodation must be used within AccommodationProvider");
  return ctx;
}
