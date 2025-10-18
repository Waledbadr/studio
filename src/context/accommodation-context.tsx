"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, query, limit, Unsubscribe } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/context/notifications-context';

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
};

export type Building = {
  id: string;
  name?: string;
  floors?: Floor[];
};

export type Residence = {
  id: string;
  name: string;
  address?: string;
  location?: Location;
  buildings?: Building[]; // optional — some APIs return nested buildings/floors
  rooms?: Room[]; // fallback when buildings are not present
};

// New domain types
export type Worker = {
  id: string; // معرّف فريد في النظام
  name: string; // اسم العامل
  employeeId?: string; // رقم الموظف (مثل: 40097) - يمكن تكراره في شركات مختلفة
  idNumber?: string; // رقم الهوية الوطنية (مثل: 2059537999) - فريد لكل شخص
  nationaliy?: string; // الجنسية
  company?: string; // الشركة - لتمييز العمال بنفس الرقم الوظيفي
  role?: "Worker" | "Supervisor" | "Engineer";
};

export type Occupant = {
  workerId: string;
  residenceId: string;
  buildingId?: string;
  floorId?: string;
  roomId: string;
  since: string; // ISO date - Check-in date
  until?: string; // ISO date - Check-out date (null = still active)
  checkInBy?: string; // User ID who performed check-in
  checkOutBy?: string; // User ID who performed check-out
  notes?: string; // Optional notes about this occupancy
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
  duration?: number; // Days stayed (calculated for CHECK_OUT)
  relatedTransferRequestId?: string; // Link to TransferRequest if applicable
  
  createdAt: string; // Timestamp when record was created
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
  residenceId: string;
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

type AccommodationContextValue = {
  residences: Residence[];
  loading: boolean;
  refresh: () => Promise<void>;
  // new exports
  workers: Worker[];
  occupants: Occupant[];
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
  }) => Promise<{ ok: boolean; error?: string; historyId?: string }>;
  
  checkOutWorkerEnhanced: (params: {
    workerId: string;
    checkOutDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
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
  }) => Promise<{ ok: boolean; results: Record<string, { success: boolean; error?: string; historyId?: string }> }>;
  
  bulkCheckOut: (params: {
    workerIds: string[];
    checkOutDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
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
  ) => { ok: boolean; error?: string };
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
  ) => { ok: boolean; error?: string };
  createTransferRequest: (
    req: Omit<TransferRequest, "id" | "requestedAt" | "status">
  ) => TransferRequest;
  reviewTransferRequest: (
    id: string,
    approve: boolean,
    reviewerId: string
  ) => { ok: boolean; error?: string };
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
  generateMonthlyInvoices: (month: string) => Promise<{ generated: number; errors: number }>;
  // Utility
  getContractsByCompany: (companyId: string) => Contract[];
  getInvoicesByContract: (contractId: string) => Invoice[];
  getActiveContractsForResidence: (residenceId: string) => Contract[];
};

export const AccommodationContext = createContext<AccommodationContextValue | undefined>(undefined);

export function AccommodationProvider({ children }: { children: React.ReactNode }) {
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [accommodationHistory, setAccommodationHistory] = useState<AccommodationHistory[]>([]); // NEW
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // New state for companies, contracts, invoices
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { toast } = useToast();
  const globalNotifications = useNotifications();
  const workersUnsubRef = useRef<Unsubscribe | null>(null);
  const workersPermissionWarnedRef = useRef(false);
  const historyUnsubRef = useRef<Unsubscribe | null>(null); // NEW
  const workersFirestoreDisabledRef = useRef(false);
  const companiesUnsubRef = useRef<Unsubscribe | null>(null);
  const contractsUnsubRef = useRef<Unsubscribe | null>(null);
  const invoicesUnsubRef = useRef<Unsubscribe | null>(null);

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
          } catch {}
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
            } catch {}
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

    console.log('📻 [startWorkersListener] Setting up onSnapshot listener...');
    const col = collection(db, "workers");
    workersUnsubRef.current = onSnapshot(
      col,
      (snap) => {
        console.log('📦 [startWorkersListener] Snapshot received:', snap.docs.length, 'documents');
        workersPermissionWarnedRef.current = false;
        const list: Worker[] = snap.docs.map((d) => {
          const data = d.data();
          const role = data?.role;
          const normalizedRole: Worker["role"] = role === "Supervisor" || role === "Engineer" ? role : "Worker";
          return {
            id: d.id,
            name: typeof data?.name === "string" ? data.name : "",
            employeeId: typeof data?.employeeId === "string" ? data.employeeId : undefined,
            idNumber: typeof data?.idNumber === "string" ? data.idNumber : undefined,
            nationaliy: typeof data?.nationaliy === "string" ? data.nationaliy : "",
            company: typeof data?.company === "string" ? data.company : undefined,
            role: normalizedRole,
          } satisfies Worker;
        });
        setWorkers(list);
        try {
          localStorage.setItem("ac_workers", JSON.stringify(list));
        } catch {}
      },
      handleWorkersSnapshotError
    );
  }, [handleWorkersSnapshotError]);

  function mapComplexToResidence(complex: any): Residence {
    return {
      id: complex.id,
      name: complex.name || complex.title || "Unnamed",
      address: complex.city || complex.address || "",
      location: complex.location || null,
      buildings: Array.isArray(complex.buildings)
        ? complex.buildings.map((b: any) => ({ id: b.id, name: b.name, floors: b.floors }))
        : undefined,
      rooms: undefined,
    };
  }

  // Load residences snapshot from localStorage (the canonical residences provider persists there)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("estatecare_residences") : null;
        if (stored) {
          const parsed = JSON.parse(stored || "[]");
          if (!mounted) return;
          setResidences((parsed || []).map(mapComplexToResidence));
        } else {
          if (mounted) setResidences([]);
        }
      } catch (e) {
        console.error("Accommodation: failed to load residences from provider", e);
        if (mounted) setResidences([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Provide a safe refresh function that re-runs the load logic when called.
  const refresh = async () => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("estatecare_residences") : null;
      if (stored) {
        const parsed = JSON.parse(stored || "[]");
        setResidences((parsed || []).map(mapComplexToResidence));
      }
    } catch (e) {
      console.error("Accommodation refresh failed", e);
    }
  };

  // Initialize additional domain data from localStorage if present.
  useEffect(() => {
    try {
      const w = typeof window !== "undefined" ? localStorage.getItem("ac_workers") : null;
      const o = typeof window !== "undefined" ? localStorage.getItem("ac_occupants") : null;
      const t = typeof window !== "undefined" ? localStorage.getItem("ac_transfers") : null;
      const n = typeof window !== "undefined" ? localStorage.getItem("ac_notifications") : null;
      if (w) setWorkers(JSON.parse(w));
      if (o) setOccupants(JSON.parse(o));
      if (t) setTransferRequests(JSON.parse(t));
      if (n) setNotifications(JSON.parse(n));
    } catch (e) {
      console.error("Accommodation: failed to init local domain data", e);
    }
  }, []);

  // If Firestore is available, subscribe to the workers collection and keep local state in sync.
  useEffect(() => {
    if (!db) {
      console.log('🔴 [Accommodation Context] Firestore DB not initialized');
      return;
    }

    const hasImmediateAccess = !auth || !!auth.currentUser;
    console.log('🔐 [Accommodation Context] Auth status:', {
      hasAuth: !!auth,
      hasCurrentUser: !!auth?.currentUser,
      currentUser: auth?.currentUser?.email,
      hasImmediateAccess
    });
    
    if (hasImmediateAccess) {
      console.log('✅ [Accommodation Context] Starting workers listener (immediate)');
      void startWorkersListener();
    }

    let authUnsubscribe: Unsubscribe | null = null;
    if (auth) {
      authUnsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('🔐 [Accommodation Context] Auth state changed:', {
          hasUser: !!user,
          userEmail: user?.email,
          uid: user?.uid
        });
        
        if (user) {
          workersFirestoreDisabledRef.current = false;
          console.log('✅ [Accommodation Context] Starting workers listener (after auth)');
          void startWorkersListener();
        } else {
          console.log('⚠️ [Accommodation Context] No user, loading from localStorage');
          if (workersUnsubRef.current) {
            try {
              workersUnsubRef.current();
            } catch {}
            workersUnsubRef.current = null;
          }
          loadWorkersFromLocalStorage();
        }
      });
    }

    return () => {
      if (authUnsubscribe) {
        try {
          authUnsubscribe();
        } catch {}
      }
      if (workersUnsubRef.current) {
        try {
          workersUnsubRef.current();
        } catch {}
        workersUnsubRef.current = null;
      }
    };
  }, [loadWorkersFromLocalStorage, startWorkersListener]);

  // Listen to storage events so changes made by other tabs / pages (legacy localStorage writes) reflect in context.
  useEffect(() => {
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'ac_workers' && typeof ev.newValue === 'string') {
        try {
          const parsed = JSON.parse(ev.newValue || '[]');
          setWorkers(parsed);
        } catch {}
      }
      if (ev.key === 'ac_companies' && typeof ev.newValue === 'string') {
        try { setCompanies(JSON.parse(ev.newValue || '[]')); } catch {}
      }
      if (ev.key === 'ac_contracts' && typeof ev.newValue === 'string') {
        try { setContracts(JSON.parse(ev.newValue || '[]')); } catch {}
      }
      if (ev.key === 'ac_invoices' && typeof ev.newValue === 'string') {
        try { setInvoices(JSON.parse(ev.newValue || '[]')); } catch {}
      }
    };
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
  }, []);

  // Setup Firestore listeners for companies, contracts, invoices, and occupants
  useEffect(() => {
    if (!db || !auth?.currentUser) return;

    // Companies listener
    const companiesCol = collection(db, 'companies');
    companiesUnsubRef.current = onSnapshot(companiesCol, (snap) => {
      const list: Company[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Company));
      setCompanies(list);
      try { localStorage.setItem('ac_companies', JSON.stringify(list)); } catch {}
    }, (err) => { console.error('Companies snapshot error:', err); });

    // Contracts listener
    const contractsCol = collection(db, 'contracts');
    contractsUnsubRef.current = onSnapshot(contractsCol, (snap) => {
      const list: Contract[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Contract));
      setContracts(list);
      try { localStorage.setItem('ac_contracts', JSON.stringify(list)); } catch {}
    }, (err) => { console.error('Contracts snapshot error:', err); });

    // Invoices listener
    const invoicesCol = collection(db, 'invoices');
    invoicesUnsubRef.current = onSnapshot(invoicesCol, (snap) => {
      const list: Invoice[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));
      setInvoices(list);
      try { localStorage.setItem('ac_invoices', JSON.stringify(list)); } catch {}
    }, (err) => { console.error('Invoices snapshot error:', err); });

    // Occupants listener
    const occupantsCol = collection(db, 'occupants');
    const occupantsUnsub = onSnapshot(occupantsCol, (snap) => {
      const list: Occupant[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setOccupants(list);
      try { localStorage.setItem('ac_occupants', JSON.stringify(list)); } catch {}
    }, (err) => { console.error('Occupants snapshot error:', err); });
    
    // Accommodation History listener - NEW!
    const historyCol = collection(db, 'accommodationHistory');
    historyUnsubRef.current = onSnapshot(historyCol, (snap) => {
      const list: AccommodationHistory[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as AccommodationHistory));
      setAccommodationHistory(list);
      try { localStorage.setItem('ac_history', JSON.stringify(list)); } catch {}
    }, (err) => { console.error('Accommodation History snapshot error:', err); });

    return () => {
      if (companiesUnsubRef.current) { try { companiesUnsubRef.current(); } catch {} }
      if (contractsUnsubRef.current) { try { contractsUnsubRef.current(); } catch {} }
      if (invoicesUnsubRef.current) { try { invoicesUnsubRef.current(); } catch {} }
      if (historyUnsubRef.current) { try { historyUnsubRef.current(); } catch {} } // NEW
      if (occupantsUnsub) { try { occupantsUnsub(); } catch {} }
    };
  }, []);

  // Helpers: persist domain data
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem("ac_workers", JSON.stringify(workers));
      localStorage.setItem("ac_occupants", JSON.stringify(occupants));
      localStorage.setItem("ac_history", JSON.stringify(accommodationHistory)); // NEW
      localStorage.setItem("ac_transfers", JSON.stringify(transferRequests));
      localStorage.setItem("ac_notifications", JSON.stringify(notifications));
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
        (w.nationaliy || "").toLowerCase().includes(norm) ||
        (w.company || "").toLowerCase().includes(norm)
    );
  }

  // Save (create/update) a worker. If Firestore is configured, persist there. Otherwise write to localStorage.
  async function saveWorker(worker: Worker | Omit<Worker, 'id'>) {
    try {
      if (db) {
        const id = ('id' in worker && worker.id) ? worker.id : `w_${Date.now()}`;
        const payload = { 
          name: (worker as any).name, 
          employeeId: (worker as any).employeeId || '',
          idNumber: (worker as any).idNumber || '',
          nationaliy: (worker as any).nationaliy || '', 
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
        nationaliy: (worker as any).nationaliy || '', 
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
      if (db) {
        await deleteDoc(doc(db, 'workers', id));
        return;
      }
    } catch (e) {
      console.error('deleteWorker (firestore) failed', e);
    }

    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('ac_workers') : null;
      const list: Worker[] = raw ? JSON.parse(raw) : [];
      const updated = list.filter(w => w.id !== id);
      if (typeof window !== 'undefined') localStorage.setItem('ac_workers', JSON.stringify(updated));
      setWorkers(updated);
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
            nationaliy: w.nationaliy || '', 
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
        try { localStorage.removeItem('ac_workers'); setWorkers([]); } catch {}
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
      if (firstWorker && firstWorker.nationaliy && w.nationaliy && firstWorker.nationaliy !== w.nationaliy) {
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

  function quickTransfer(workerId: string, fromResidenceId: string, fromRoomId: string, toResidenceId: string, toRoomId: string, checkInDate?: string) {
    // First, check out from current room
    const checkOutResult = checkOutWorker(workerId, fromResidenceId, fromRoomId);
    if (!checkOutResult.ok) return checkOutResult;
    // Then, assign to new room
    const assignResult = assignWorkerToRoom(workerId, toResidenceId, toRoomId, checkInDate);
    if (!assignResult.ok) return assignResult;
    return { ok: true };
  }

  function createTransferRequest(req: Omit<TransferRequest, "id" | "requestedAt" | "status">) {
    const tr: TransferRequest = { ...req, id: `trs_${Date.now()}`, requestedAt: new Date().toISOString(), status: "Pending" };
    setTransferRequests((prev) => [tr, ...prev]);
    
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

  function reviewTransferRequest(id: string, approve: boolean, reviewerId: string) {
    const tr = transferRequests.find((t) => t.id === id);
    if (!tr) return { ok: false, error: "not-found" };
    if (tr.status !== "Pending") return { ok: false, error: "already-reviewed" };
    const updated: TransferRequest = { ...tr, status: approve ? "Approved" : "Rejected", reviewedBy: reviewerId, reviewedAt: new Date().toISOString() };
    setTransferRequests((prev) => prev.map((p) => (p.id === id ? updated : p)));
    
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
          assignWorkerToRoom(wid, tr.to.residenceId, targetRoomId);
        }
      } else {
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
            const found = roomList.find(
              (r) =>
                r.spaceSqm &&
                r.roomType &&
                occupants.filter((o) => o.roomId === r.id && o.residenceId === tr.to.residenceId).length < calcCapacityFromSpace(r.spaceSqm, r.roomType) &&
                (occupants.filter((o) => o.roomId === r.id && o.residenceId === tr.to.residenceId).length === 0 ||
                  workers.find((x) => x.id === occupants.find((o) => o.roomId === r.id && o.residenceId === tr.to.residenceId)!.workerId)?.nationaliy === w.nationaliy)
            );
            if (found) assignWorkerToRoom(wid, tr.to.residenceId, found.id);
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
        const nat = w?.nationaliy || "Unknown";
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

  // ============ COMPANY CRUD ============
  async function saveCompany(company: Company | Omit<Company, 'id' | 'createdAt'>) {
    try {
      if (!db) throw new Error('Firestore not configured');
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
      await setDoc(doc(db, 'companies', id), payload, { merge: true } as any);
      toast({ title: 'Success', description: 'Company saved successfully' });
    } catch (e) {
      console.error('saveCompany failed:', e);
      toast({ title: 'Error', description: 'Failed to save company', variant: 'destructive' });
      throw e;
    }
  }

  async function deleteCompany(id: string) {
    try {
      if (!db) throw new Error('Firestore not configured');
      // Check if company has active contracts
      const activeContracts = contracts.filter(c => c.companyId === id && c.status === 'Active');
      if (activeContracts.length > 0) {
        toast({ title: 'Cannot delete', description: 'Company has active contracts', variant: 'destructive' });
        return;
      }
      await deleteDoc(doc(db, 'companies', id));
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
  async function generateMonthlyInvoices(month: string): Promise<{ generated: number; errors: number }> {
    // month format: YYYY-MM
    const result = { generated: 0, errors: 0 };
    try {
      if (!db) throw new Error('Firestore not configured');
      
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
      const endDate = new Date(Date.UTC(year, monthNum, 0)); // last day of month
      const daysInMonth = endDate.getDate();

      // Find all active contracts for this month
      const activeContracts = contracts.filter(c => {
        if (c.status !== 'Active') return false;
        const contractStart = new Date(c.startDate);
        const contractEnd = new Date(c.endDate);
        return contractStart <= endDate && contractEnd >= startDate;
      });

      for (const contract of activeContracts) {
        try {
          // Check if invoice already exists for this month
          const existing = invoices.find(inv => 
            inv.contractId === contract.id && inv.month === month
          );
          if (existing) {
            console.log(`Invoice already exists for contract ${contract.id} month ${month}`);
            continue;
          }

          // Count workers for this residence during this month
          const workersInResidence = occupants.filter(occ => {
            const occStart = new Date(occ.since);
            return occ.residenceId === contract.residenceId && occStart <= endDate;
          }).length;

          if (workersInResidence === 0) {
            console.log(`No workers found for contract ${contract.id} in month ${month}`);
            continue;
          }

          // Calculate total amount: (workers × rate × days) / 30
          const totalAmount = (workersInResidence * contract.ratePerPersonPerMonth * daysInMonth) / 30;

          const invoice: Invoice = {
            id: `inv_${contract.id}_${month.replace('-', '')}`,
            contractId: contract.id,
            companyId: contract.companyId,
            residenceId: contract.residenceId,
            month,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            numberOfWorkers: workersInResidence,
            numberOfDays: daysInMonth,
            ratePerPerson: contract.ratePerPersonPerMonth,
            totalAmount: Math.round(totalAmount * 100) / 100,
            status: 'Pending',
            generatedAt: new Date().toISOString(),
          };

          await saveInvoice(invoice);
          result.generated++;
        } catch (e) {
          console.error(`Failed to generate invoice for contract ${contract.id}:`, e);
          result.errors++;
        }
      }

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
      .filter(h => h.workerId === workerId)
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
  }): Promise<{ ok: boolean; error?: string; historyId?: string }> {
    try {
      console.log('🔵 [checkInWorker] Starting with params:', params);
      console.log('📊 [checkInWorker] Current state:', {
        workersCount: workers.length,
        residencesCount: residences.length,
        occupantsCount: occupants.length,
        hasDb: !!db,
        hasAuth: !!auth?.currentUser
      });
      
      // Re-validate workers list from Firestore if empty or not found
      if (workers.length === 0 && db) {
        console.warn('⚠️ [checkInWorker] Workers list is empty, attempting to reload from Firestore...');
        try {
          const workersSnapshot = await getDocs(collection(db, 'workers'));
          const freshWorkers = workersSnapshot.docs.map((d) => {
            const data = d.data();
            const role = data?.role;
            const normalizedRole: Worker["role"] = role === "Supervisor" || role === "Engineer" ? role : "Worker";
            return {
              id: d.id,
              name: typeof data?.name === "string" ? data.name : "",
              employeeId: typeof data?.employeeId === "string" ? data.employeeId : undefined,
              idNumber: typeof data?.idNumber === "string" ? data.idNumber : undefined,
              nationaliy: typeof data?.nationaliy === "string" ? data.nationaliy : "",
              company: typeof data?.company === "string" ? data.company : undefined,
              role: normalizedRole,
            } satisfies Worker;
          });
          setWorkers(freshWorkers);
          console.log('✅ [checkInWorker] Reloaded workers from Firestore:', freshWorkers.length);
        } catch (reloadErr) {
          console.error('❌ [checkInWorker] Failed to reload workers:', reloadErr);
        }
      }
      
      const w = workers.find(x => x.id === params.workerId);
      if (!w) {
        console.error('❌ [checkInWorker] Worker not found:', params.workerId);
        console.error('Available workers:', workers.map(w => ({ id: w.id, name: w.name })));
        toast({
          title: "خطأ: العامل غير موجود",
          description: `لم يتم العثور على العامل (ID: ${params.workerId}). الرجاء التحقق من قاعدة البيانات والمحاولة مرة أخرى.`,
          variant: "destructive",
        });
        return { ok: false, error: "worker-not-found" };
      }

      // Check if worker is already assigned
      const existing = occupants.find(o => o.workerId === params.workerId && !o.until);
      if (existing) {
        console.warn('⚠️ [checkInWorker] Worker already assigned:', existing);
        toast({
          title: "خطأ: العامل مسكّن بالفعل",
          description: `العامل ${w.name} مسكّن حالياً في غرفة أخرى. يجب إخراجه أولاً.`,
          variant: "destructive",
        });
        return { ok: false, error: "worker-already-assigned" };
      }

      // Re-validate residences if empty
      if (residences.length === 0) {
        console.warn('⚠️ [checkInWorker] Residences list is empty, attempting to reload from localStorage...');
        try {
          const stored = typeof window !== "undefined" ? localStorage.getItem("estatecare_residences") : null;
          if (stored) {
            const parsed = JSON.parse(stored || "[]");
            const freshResidences = (parsed || []).map(mapComplexToResidence);
            setResidences(freshResidences);
            console.log('✅ [checkInWorker] Reloaded residences from localStorage:', freshResidences.length);
          }
        } catch (reloadErr) {
          console.error('❌ [checkInWorker] Failed to reload residences:', reloadErr);
        }
      }

      const room = findRoom(params.residenceId, params.roomId);
      if (!room) {
        console.error('❌ [checkInWorker] Room not found:', { residenceId: params.residenceId, roomId: params.roomId });
        console.error('Available residences:', residences.map(r => ({ id: r.id, name: r.name })));
        toast({
          title: "خطأ: الغرفة غير موجودة",
          description: `لم يتم العثور على الغرفة (ID: ${params.roomId}) في المبنى (ID: ${params.residenceId}). الرجاء التحقق من البيانات.`,
          variant: "destructive",
        });
        return { ok: false, error: "room-not-found" };
      }
      
      // More lenient check - allow operation even if metadata is missing
      const spaceSqm = room.spaceSqm || 20; // Default 20 sqm
      const roomType = room.roomType || 'Worker'; // Default to Worker
      
      console.log('✅ [checkInWorker] Room found:', { roomId: room.id, spaceSqm, roomType });

      // Nationality check
      const roomOccupants = occupants.filter(o => 
        o.roomId === params.roomId && 
        o.residenceId === params.residenceId && 
        !o.until
      );
      
      console.log('👥 [checkInWorker] Current room occupants:', roomOccupants.length);
      
      if (roomOccupants.length > 0) {
        const firstWorker = workers.find(x => x.id === roomOccupants[0].workerId);
        if (firstWorker && firstWorker.nationaliy && w.nationaliy && firstWorker.nationaliy !== w.nationaliy) {
          console.warn('⚠️ [checkInWorker] Nationality mismatch:', { 
            roomNationality: firstWorker.nationaliy, 
            workerNationality: w.nationaliy 
          });
          return { ok: false, error: "nationality-mismatch" };
        }
      }

      // Capacity check
      const cap = calcCapacityFromSpace(spaceSqm, roomType);
      console.log('📊 [checkInWorker] Capacity check:', { capacity: cap, occupied: roomOccupants.length });
      
      if (roomOccupants.length >= cap) {
        console.warn('⚠️ [checkInWorker] Room is full');
        return { ok: false, error: "room-full" };
      }

      const checkInDate = params.checkInDate || new Date().toISOString();

      // Create occupant record
      const occupant: Occupant = {
        workerId: params.workerId,
        residenceId: params.residenceId,
        roomId: params.roomId,
        buildingId: params.buildingId,
        floorId: params.floorId,
        since: checkInDate,
        checkInBy: params.performedBy,
        notes: params.notes,
      };

      console.log('💾 [checkInWorker] Creating occupant record:', occupant);

      // Save occupant to Firestore first (if available)
      let occupantId = `occ_${params.workerId}_${Date.now()}`;
      
      try {
        if (db) {
          console.log('📤 [checkInWorker] Saving to Firestore...');
          await setDoc(doc(db, 'occupants', occupantId), occupant);
          console.log('✅ [checkInWorker] Saved to Firestore');
        } else {
          console.log('⏭️ [checkInWorker] Firestore not available, using local only');
        }
      } catch (firestoreError) {
        console.error('⚠️ [checkInWorker] Firestore save failed, continuing with local:', firestoreError);
      }

      // Update local state
      setOccupants(prev => [...prev, occupant]);
      console.log('✅ [checkInWorker] Updated local state');

      // Get residence name for history (optional - don't let it fail the operation)
      let historyId: string | undefined;
      try {
        const residence = residences.find(r => r.id === params.residenceId);
        
        // Create history record (don't fail if this errors)
        historyId = await createHistoryRecord({
          workerId: params.workerId,
          workerName: w.name,
          workerNationality: w.nationaliy,
          actionType: 'CHECK_IN',
          actionDate: checkInDate,
          actionBy: params.performedBy,
          residenceId: params.residenceId,
          residenceName: residence?.name,
          buildingId: params.buildingId,
          floorId: params.floorId,
          roomId: params.roomId,
          roomName: room?.name || params.roomId,
          notes: params.notes,
          createdAt: new Date().toISOString(),
        });
        console.log('✅ [checkInWorker] History record created:', historyId);
      } catch (historyError) {
        console.warn('⚠️ [checkInWorker] History record failed (non-critical):', historyError);
      }

      toast({
        title: "تم التسكين بنجاح ✅",
        description: `تم تسكين ${w.name} في ${room?.name || 'الغرفة ' + params.roomId}`,
      });

      console.log('🎉 [checkInWorker] Check-in completed successfully');
      return { ok: true, historyId };
    } catch (e: any) {
      console.error('❌ [checkInWorker] Failed with error:', e);
      
      toast({
        title: "فشل التسكين",
        description: e.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
      
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
  }): Promise<{ ok: boolean; error?: string; historyId?: string }> {
    try {
      console.log('🔵 [checkOutWorker] Starting with params:', params);
      console.log('📊 [checkOutWorker] Current state:', {
        workersCount: workers.length,
        occupantsCount: occupants.length,
        hasDb: !!db,
        hasAuth: !!auth?.currentUser
      });
      
      // Re-validate workers list if empty
      if (workers.length === 0 && db) {
        console.warn('⚠️ [checkOutWorker] Workers list is empty, attempting to reload from Firestore...');
        try {
          const workersSnapshot = await getDocs(collection(db, 'workers'));
          const freshWorkers = workersSnapshot.docs.map((d) => {
            const data = d.data();
            const role = data?.role;
            const normalizedRole: Worker["role"] = role === "Supervisor" || role === "Engineer" ? role : "Worker";
            return {
              id: d.id,
              name: typeof data?.name === "string" ? data.name : "",
              employeeId: typeof data?.employeeId === "string" ? data.employeeId : undefined,
              idNumber: typeof data?.idNumber === "string" ? data.idNumber : undefined,
              nationaliy: typeof data?.nationaliy === "string" ? data.nationaliy : "",
              company: typeof data?.company === "string" ? data.company : undefined,
              role: normalizedRole,
            } satisfies Worker;
          });
          setWorkers(freshWorkers);
          console.log('✅ [checkOutWorker] Reloaded workers from Firestore:', freshWorkers.length);
        } catch (reloadErr) {
          console.error('❌ [checkOutWorker] Failed to reload workers:', reloadErr);
        }
      }
      
      const w = workers.find(x => x.id === params.workerId);
      if (!w) {
        console.error('❌ [checkOutWorker] Worker not found:', params.workerId);
        console.error('Available workers:', workers.map(w => ({ id: w.id, name: w.name })));
        toast({
          title: "خطأ: العامل غير موجود",
          description: `لم يتم العثور على العامل (ID: ${params.workerId}). الرجاء التحقق من قاعدة البيانات.`,
          variant: "destructive",
        });
        return { ok: false, error: "worker-not-found" };
      }

      // Re-load occupants if needed
      if (occupants.length === 0 && db) {
        console.warn('⚠️ [checkOutWorker] Occupants list is empty, attempting to reload from Firestore...');
        try {
          const occupantsSnapshot = await getDocs(collection(db, 'occupants'));
          const freshOccupants = occupantsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
          setOccupants(freshOccupants);
          console.log('✅ [checkOutWorker] Reloaded occupants from Firestore:', freshOccupants.length);
        } catch (reloadErr) {
          console.error('❌ [checkOutWorker] Failed to reload occupants:', reloadErr);
        }
      }

      const occupant = occupants.find(o => o.workerId === params.workerId && !o.until);
      if (!occupant) {
        console.error('❌ [checkOutWorker] Worker is not currently assigned');
        console.error('Current occupants:', occupants.filter(o => !o.until).map(o => ({ workerId: o.workerId, roomId: o.roomId })));
        toast({
          title: "خطأ: العامل غير مسكّن",
          description: `العامل ${w.name} غير مسكّن حالياً في أي غرفة.`,
          variant: "destructive",
        });
        return { ok: false, error: "worker-not-assigned" };
      }

      const checkOutDate = params.checkOutDate || new Date().toISOString();
      const checkInDate = new Date(occupant.since);
      const checkOutDateObj = new Date(checkOutDate);
      const duration = Math.ceil((checkOutDateObj.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

      const room = findRoom(occupant.residenceId, occupant.roomId);
      const residence = residences.find(r => r.id === occupant.residenceId);

      // Create history record
      const historyId = await createHistoryRecord({
        workerId: params.workerId,
        workerName: w.name,
        workerNationality: w.nationaliy,
        actionType: 'CHECK_OUT',
        actionDate: checkOutDate,
        actionBy: params.performedBy,
        residenceId: occupant.residenceId,
        residenceName: residence?.name,
        buildingId: occupant.buildingId,
        floorId: occupant.floorId,
        roomId: occupant.roomId,
        roomName: room?.name,
        reason: params.reason,
        notes: params.notes,
        duration,
        createdAt: new Date().toISOString(),
      });

      // Update occupant record
      const updatedOccupant: Occupant = {
        ...occupant,
        until: checkOutDate,
        checkOutBy: params.performedBy,
        notes: params.notes ? `${occupant.notes || ''}\nCheck-out: ${params.notes}` : occupant.notes,
      };

      if (db) {
        // Find and update the occupant document
        const occupantsRef = collection(db, 'occupants');
        const q = query(occupantsRef);
        const snapshot = await getDocs(q);
        const occupantDoc = snapshot.docs.find(d => {
          const data = d.data();
          return data.workerId === params.workerId && !data.until;
        });
        
        if (occupantDoc) {
          await setDoc(doc(db, 'occupants', occupantDoc.id), updatedOccupant);
        }
      }

      setOccupants(prev => prev.map(o => 
        o.workerId === params.workerId && !o.until ? updatedOccupant : o
      ));

      toast({
        title: "تم الإخراج بنجاح",
        description: `تم إخراج ${w.name} بعد ${duration} يوم`,
      });

      return { ok: true, historyId };
    } catch (e: any) {
      console.error('checkOutWorkerEnhanced failed:', e);
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
      if (!toRoom.spaceSqm || !toRoom.roomType) return { ok: false, error: "target-room-metadata-missing" };

      // Nationality check
      const targetRoomOccupants = occupants.filter(o => 
        o.roomId === params.toRoomId && 
        o.residenceId === params.toResidenceId && 
        !o.until
      );
      
      if (targetRoomOccupants.length > 0) {
        const firstWorker = workers.find(x => x.id === targetRoomOccupants[0].workerId);
        if (firstWorker && firstWorker.nationaliy && w.nationaliy && firstWorker.nationaliy !== w.nationaliy) {
          return { ok: false, error: "nationality-mismatch" };
        }
      }

      // Capacity check
      const cap = calcCapacityFromSpace(toRoom.spaceSqm, toRoom.roomType);
      if (targetRoomOccupants.length >= cap) {
        return { ok: false, error: "target-room-full" };
      }

      const transferDate = params.transferDate || new Date().toISOString();

      // Get names for history
      const fromResidence = residences.find(r => r.id === currentOccupant.residenceId);
      const fromRoom = findRoom(currentOccupant.residenceId, currentOccupant.roomId);
      const toResidence = residences.find(r => r.id === params.toResidenceId);

      // Create history record
      const historyId = await createHistoryRecord({
        workerId: params.workerId,
        workerName: w.name,
        workerNationality: w.nationaliy,
        actionType: 'TRANSFER',
        actionDate: transferDate,
        actionBy: params.performedBy,
        fromResidenceId: currentOccupant.residenceId,
        fromResidenceName: fromResidence?.name,
        fromRoomId: currentOccupant.roomId,
        fromRoomName: fromRoom?.name,
        toResidenceId: params.toResidenceId,
        toResidenceName: toResidence?.name,
        toRoomId: params.toRoomId,
        toRoomName: toRoom?.name || params.toRoomId,
        residenceId: params.toResidenceId,
        roomId: params.toRoomId,
        reason: params.reason,
        notes: params.notes,
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
        checkInBy: params.performedBy,
        notes: params.notes,
      };

      if (db) {
        // Update old occupant
        const occupantsRef = collection(db, 'occupants');
        const q = query(occupantsRef);
        const snapshot = await getDocs(q);
        const occupantDoc = snapshot.docs.find(d => {
          const data = d.data();
          return data.workerId === params.workerId && !data.until;
        });
        
        if (occupantDoc) {
          await setDoc(doc(db, 'occupants', occupantDoc.id), updatedCurrentOccupant);
        }

        // Create new occupant
        const newOccupantId = `occ_${params.workerId}_${Date.now()}`;
        await setDoc(doc(db, 'occupants', newOccupantId), newOccupant);
      }

      setOccupants(prev => [
        ...prev.map(o => o.workerId === params.workerId && !o.until ? updatedCurrentOccupant : o),
        newOccupant,
      ]);

      toast({
        title: "تم النقل بنجاح",
        description: `تم نقل ${w.name} من ${fromRoom?.name || currentOccupant.roomId} إلى ${toRoom.name || params.toRoomId}`,
      });

      return { ok: true, historyId };
    } catch (e: any) {
      console.error('transferWorker failed:', e);
      return { ok: false, error: e.message || 'unknown-error' };
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

      // Create history records for both workers
      const history1Id = await createHistoryRecord({
        workerId: params.worker1Id,
        workerName: w1.name,
        workerNationality: w1.nationaliy,
        actionType: 'SWAP',
        actionDate: swapDate,
        actionBy: params.performedBy,
        fromResidenceId: occ1.residenceId,
        fromResidenceName: res1?.name,
        fromRoomId: occ1.roomId,
        fromRoomName: room1?.name,
        toResidenceId: occ2.residenceId,
        toResidenceName: res2?.name,
        toRoomId: occ2.roomId,
        toRoomName: room2?.name,
        residenceId: occ2.residenceId,
        roomId: occ2.roomId,
        swappedWithWorkerId: params.worker2Id,
        swappedWithWorkerName: w2.name,
        reason: params.reason,
        notes: params.notes,
        createdAt: new Date().toISOString(),
      });

      const history2Id = await createHistoryRecord({
        workerId: params.worker2Id,
        workerName: w2.name,
        workerNationality: w2.nationaliy,
        actionType: 'SWAP',
        actionDate: swapDate,
        actionBy: params.performedBy,
        fromResidenceId: occ2.residenceId,
        fromResidenceName: res2?.name,
        fromRoomId: occ2.roomId,
        fromRoomName: room2?.name,
        toResidenceId: occ1.residenceId,
        toResidenceName: res1?.name,
        toRoomId: occ1.roomId,
        toRoomName: room1?.name,
        residenceId: occ1.residenceId,
        roomId: occ1.roomId,
        swappedWithWorkerId: params.worker1Id,
        swappedWithWorkerName: w1.name,
        reason: params.reason,
        notes: params.notes,
        createdAt: new Date().toISOString(),
      });

      // Close old occupancies
      const updatedOcc1: Occupant = { ...occ1, until: swapDate, checkOutBy: params.performedBy };
      const updatedOcc2: Occupant = { ...occ2, until: swapDate, checkOutBy: params.performedBy };

      // Create new occupancies (swapped)
      const newOcc1: Occupant = {
        workerId: params.worker1Id,
        residenceId: occ2.residenceId,
        roomId: occ2.roomId,
        buildingId: occ2.buildingId,
        floorId: occ2.floorId,
        since: swapDate,
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
        checkInBy: params.performedBy,
        notes: params.notes,
      };

      if (db) {
        const occupantsRef = collection(db, 'occupants');
        const q = query(occupantsRef);
        const snapshot = await getDocs(q);
        
        // Update old occupancies
        const occ1Doc = snapshot.docs.find(d => {
          const data = d.data();
          return data.workerId === params.worker1Id && !data.until;
        });
        const occ2Doc = snapshot.docs.find(d => {
          const data = d.data();
          return data.workerId === params.worker2Id && !data.until;
        });

        if (occ1Doc) await setDoc(doc(db, 'occupants', occ1Doc.id), updatedOcc1);
        if (occ2Doc) await setDoc(doc(db, 'occupants', occ2Doc.id), updatedOcc2);

        // Create new occupancies
        await setDoc(doc(db, 'occupants', `occ_${params.worker1Id}_${Date.now()}`), newOcc1);
        await setDoc(doc(db, 'occupants', `occ_${params.worker2Id}_${Date.now() + 1}`), newOcc2);
      }

      setOccupants(prev => [
        ...prev.map(o => {
          if (o.workerId === params.worker1Id && !o.until) return updatedOcc1;
          if (o.workerId === params.worker2Id && !o.until) return updatedOcc2;
          return o;
        }),
        newOcc1,
        newOcc2,
      ]);

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

  // Bulk Check-In
  async function bulkCheckIn(params: {
    workerIds: string[];
    residenceId: string;
    roomId: string;
    buildingId?: string;
    floorId?: string;
    checkInDate?: string;
    notes?: string;
    performedBy: string;
  }): Promise<{ ok: boolean; results: Record<string, { success: boolean; error?: string; historyId?: string }> }> {
    const results: Record<string, { success: boolean; error?: string; historyId?: string }> = {};

    for (const workerId of params.workerIds) {
      const result = await checkInWorker({
        workerId,
        residenceId: params.residenceId,
        roomId: params.roomId,
        buildingId: params.buildingId,
        floorId: params.floorId,
        checkInDate: params.checkInDate,
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
    toast({
      title: "عملية التسكين الجماعي",
      description: `تم تسكين ${successCount} من ${params.workerIds.length} عامل بنجاح`,
    });

    return { ok: true, results };
  }

  // Bulk Check-Out
  async function bulkCheckOut(params: {
    workerIds: string[];
    checkOutDate?: string;
    reason?: string;
    notes?: string;
    performedBy: string;
  }): Promise<{ ok: boolean; results: Record<string, { success: boolean; error?: string; historyId?: string }> }> {
    const results: Record<string, { success: boolean; error?: string; historyId?: string }> = {};

    for (const workerId of params.workerIds) {
      const result = await checkOutWorkerEnhanced({
        workerId,
        checkOutDate: params.checkOutDate,
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
    toast({
      title: "عملية الإخراج الجماعي",
      description: `تم إخراج ${successCount} من ${params.workerIds.length} عامل بنجاح`,
    });

    return { ok: true, results };
  }

  // Bulk Transfer
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
    toast({
      title: "عملية النقل الجماعي",
      description: `تم نقل ${successCount} من ${params.workerIds.length} عامل بنجاح`,
    });

    return { ok: true, results };
  }

  const value: AccommodationContextValue = {
    residences,
    loading,
    refresh,
    workers,
    occupants,
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
    assignWorkerToRoom,
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
