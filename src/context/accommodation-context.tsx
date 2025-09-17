"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { db, auth, authReady } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDoc, Unsubscribe } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

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
  id: string;
  name: string;
  nationaliy?: string;
  role?: "Worker" | "Supervisor" | "Engineer";
};

export type Occupant = {
  workerId: string;
  residenceId: string;
  buildingId?: string;
  floorId?: string;
  roomId: string;
  since: string; // ISO date
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

type AccommodationContextValue = {
  residences: Residence[];
  loading: boolean;
  refresh: () => Promise<void>;
  // new exports
  workers: Worker[];
  occupants: Occupant[];
  transferRequests: TransferRequest[];
  notifications: Notification[];
  findWorkers: (q: string) => Worker[];
  // worker CRUD (firestore-backed when available)
  saveWorker: (worker: Worker | Omit<Worker, 'id'>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  migrateLocalWorkersToFirestore?: (opts?: { removeLocal?: boolean }) => Promise<{ migrated: number; skipped: number; errors: number }>;
  assignWorkerToRoom: (
    workerId: string,
    residenceId: string,
    roomId: string
  ) => { ok: boolean; error?: string };
  bulkAssign: (
    workerIds: string[],
    residenceId: string,
    roomId: string
  ) => { ok: boolean; results: Record<string, string | true> };
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
};

export const AccommodationContext = createContext<AccommodationContextValue | undefined>(undefined);

export function AccommodationProvider({ children }: { children: React.ReactNode }) {
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const workersUnsubRef = useRef<Unsubscribe | null>(null);

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
    if (!db) return;

    // If Firebase Auth is present but no currentUser, wait until auth is ready to avoid permission errors
    if (auth && !auth.currentUser) {
      const unsub = onAuthStateChanged(auth, (u) => {
        if (u) {
          // re-run subscription by triggering effect cleanup and re-run
          try { if (workersUnsubRef.current) { workersUnsubRef.current(); workersUnsubRef.current = null; } } catch {}
          // small timeout to allow re-entry
          setTimeout(() => {
            try {
              const col = collection(db, 'workers');
              workersUnsubRef.current = onSnapshot(col, (snap) => {
                const list: Worker[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Worker));
                setWorkers(list);
                try { localStorage.setItem('ac_workers', JSON.stringify(list)); } catch {}
              }, (err) => {
                console.error('Failed to subscribe to workers collection:', err);
                const msg = (err && (err as any).message) || '';
                if (/permission|insufficient permissions|Missing or insufficient permissions/i.test(msg)) {
                  console.warn('Firestore permission error - falling back to localStorage for workers');
                  try { const raw = typeof window !== 'undefined' ? localStorage.getItem('ac_workers') : null; setWorkers(raw ? JSON.parse(raw) : []); } catch {}
                  try { toast({ title: 'Firestore Permission', description: 'Unable to read workers from Firestore. Using local data only.', variant: 'destructive' }); } catch {}
                }
              });
            } catch (e) {
              console.error('Accommodation: workers listener init failed after auth ready', e);
            }
          }, 50);
        }
      });
      return () => { try { unsub(); } catch {} };
    }

    try {
      const col = collection(db, 'workers');
      // unsubscribe previous if any
      if (workersUnsubRef.current) {
        try { workersUnsubRef.current(); } catch {}
        workersUnsubRef.current = null;
      }
      workersUnsubRef.current = onSnapshot(col, (snap) => {
        const list: Worker[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Worker));
        setWorkers(list);
        try { localStorage.setItem('ac_workers', JSON.stringify(list)); } catch {}
      }, (err) => {
        console.error('Failed to subscribe to workers collection:', err);
        const msg = (err && (err as any).message) || '';
        if (/permission|insufficient permissions|Missing or insufficient permissions/i.test(msg)) {
          console.warn('Firestore permission error - falling back to localStorage for workers');
          try { const raw = typeof window !== 'undefined' ? localStorage.getItem('ac_workers') : null; setWorkers(raw ? JSON.parse(raw) : []); } catch {}
          try { toast({ title: 'Firestore Permission', description: 'Unable to read workers from Firestore. Using local data only.', variant: 'destructive' }); } catch {}
        }
      });
    } catch (e) {
      console.error('Accommodation: workers listener init failed', e);
    }

    return () => {
      if (workersUnsubRef.current) {
        try { workersUnsubRef.current(); } catch {}
        workersUnsubRef.current = null;
      }
    };
  }, []);

  // Listen to storage events so changes made by other tabs / pages (legacy localStorage writes) reflect in context.
  useEffect(() => {
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'ac_workers' && typeof ev.newValue === 'string') {
        try {
          const parsed = JSON.parse(ev.newValue || '[]');
          setWorkers(parsed);
        } catch {}
      }
    };
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
  }, []);

  // Helpers: persist domain data
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem("ac_workers", JSON.stringify(workers));
      localStorage.setItem("ac_occupants", JSON.stringify(occupants));
      localStorage.setItem("ac_transfers", JSON.stringify(transferRequests));
      localStorage.setItem("ac_notifications", JSON.stringify(notifications));
    } catch (e) {
      console.error("Accommodation: persist failed", e);
    }
  }, [workers, occupants, transferRequests, notifications]);

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

  // Search workers by name, id, nationality
  function findWorkers(q: string) {
    const norm = q.trim().toLowerCase();
    if (!norm) return workers;
    return workers.filter(
      (w) =>
        (w.name || "").toLowerCase().includes(norm) ||
        (w.id || "").toLowerCase().includes(norm) ||
        (w.nationaliy || "").toLowerCase().includes(norm)
    );
  }

  // Save (create/update) a worker. If Firestore is configured, persist there. Otherwise write to localStorage.
  async function saveWorker(worker: Worker | Omit<Worker, 'id'>) {
    try {
      if (db) {
        const id = ('id' in worker && worker.id) ? worker.id : `w_${Date.now()}`;
        const payload = { name: (worker as any).name, nationaliy: (worker as any).nationaliy || '', role: (worker as any).role || 'Worker' };
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
      const payload: Worker = { id, name: (worker as any).name, nationaliy: (worker as any).nationaliy || '', role: (worker as any).role || 'Worker' };
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
          await setDoc(doc(db, 'workers', id), { name: w.name, nationaliy: w.nationaliy || '', role: w.role || 'Worker' } as any);
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
  function assignWorkerToRoom(workerId: string, residenceId: string, roomId: string) {
    const w = workers.find((x) => x.id === workerId);
    if (!w) return { ok: false, error: "worker-not-found" };
    const room = findRoom(residenceId, roomId);
    if (!room) return { ok: false, error: "room-not-found" };
    if (!room.spaceSqm || !room.roomType) return { ok: false, error: "room-metadata-missing" };
    // nationality check: occupants in same room must share nationality
    const existing = occupants.filter((o) => o.roomId === roomId && o.residenceId === residenceId);
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
      since: new Date().toISOString(),
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

  function bulkAssign(workerIds: string[], residenceId: string, roomId: string) {
    const results: Record<string, string | true> = {};
    for (const wid of workerIds) {
      const r = assignWorkerToRoom(wid, residenceId, roomId);
      results[wid] = r.ok ? true : r.error || "error";
    }
    return { ok: true, results };
  }

  function createTransferRequest(req: Omit<TransferRequest, "id" | "requestedAt" | "status">) {
    const tr: TransferRequest = { ...req, id: `trs_${Date.now()}`, requestedAt: new Date().toISOString(), status: "Pending" };
    setTransferRequests((prev) => [tr, ...prev]);
    // notify destination responsible
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

  const value: AccommodationContextValue = {
    residences,
    loading,
    refresh,
    workers,
    occupants,
    transferRequests,
    notifications,
    findWorkers,
    saveWorker,
    deleteWorker,
    assignWorkerToRoom,
    bulkAssign,
    createTransferRequest,
    reviewTransferRequest,
    getDailyReport,
    getMonthlyReport,
  };

  return <AccommodationContext.Provider value={value}>{children}</AccommodationContext.Provider>;
}

export function useAccommodation() {
  const ctx = useContext(AccommodationContext);
  if (!ctx) throw new Error("useAccommodation must be used within AccommodationProvider");
  return ctx;
}
