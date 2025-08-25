"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import type { Timestamp as TsType, Firestore } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';

export type DestinationType = "InternalMaintenance" | "ExternalWorkshop" | "Vendor";

export interface ServiceOrderItem {
  itemId: string;
  itemNameEn: string;
  itemNameAr: string;
  qtySent: number;
  qtyReturned: number;
  qtyScrapped: number;
  serials?: string[];
}

export interface ServiceOrderDestination {
  type: DestinationType;
  name: string;
  contact?: string;
}

export type ServiceOrderStatus =
  | "DRAFT"
  | "DISPATCHED"
  | "PARTIAL_RETURN"
  | "COMPLETED"
  | "CANCELLED";

export interface ServiceOrder {
  id: string; // Firestore doc id
  codeShort: string; // SVC-YYM#
  dateCreated: TsType;
  residenceId: string;
  residenceName: string;
  destination: ServiceOrderDestination;
  status: ServiceOrderStatus;
  dispatchedAt?: TsType;
  receivedAt?: TsType;
  createdById: string;
  dispatchedById?: string;
  receivedById?: string;
  transportInfo?: { driverName?: string; vehiclePlate?: string; notes?: string };
  notes?: string;
  items: ServiceOrderItem[];
  attachments?: { url: string; name?: string }[];
}

export interface CreateAndDispatchPayload {
  residenceId: string;
  residenceName: string;
  destination: ServiceOrderDestination;
  items: { id: string; nameEn: string; nameAr: string; quantity: number }[];
  createdById: string;
  dispatchedById: string;
  transportInfo?: { driverName?: string; vehiclePlate?: string; notes?: string };
  notes?: string;
}

export interface ReceiveLineUpdate {
  itemId: string;
  addReturned: number; // delta to add
  addScrapped: number; // delta to add
}

interface ServiceOrdersContextType {
  serviceOrders: ServiceOrder[];
  loading: boolean;
  createAndDispatchServiceOrder: (payload: CreateAndDispatchPayload) => Promise<string>;
  receiveServiceOrder: (orderId: string, updates: ReceiveLineUpdate[], receivedById: string) => Promise<void>;
  getServiceOrderById: (orderId: string) => Promise<ServiceOrder | null>;
  getServiceOrderByCode: (codeShort: string) => Promise<ServiceOrder | null>;
}

const ServiceOrdersContext = createContext<ServiceOrdersContextType | undefined>(undefined);

export const ServiceOrdersProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const subRef = useRef<() => void>();
  const isLoaded = useRef(false);

  const load = useCallback(() => {
    if (isLoaded.current) return;
    if (!db) {
      setLoading(false);
      toast({ title: "Config error", description: "Firebase not configured.", variant: "destructive" });
      return;
    }
    // Wait for auth to satisfy Firestore rules
    if (auth && !auth.currentUser) {
      setLoading(false);
      return;
    }
    isLoaded.current = true;
    setLoading(true);
  const fdb = db as Firestore;
  const qRef = query(collection(fdb, "serviceOrders"), orderBy("dateCreated", "desc"));
    subRef.current = onSnapshot(
      qRef,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ServiceOrder[];
        setServiceOrders(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching service orders:", err);
        toast({ title: "Error", description: "Could not fetch service orders.", variant: "destructive" });
        setLoading(false);
      }
    );
  }, [toast]);

  useEffect(() => {
    load();
    const unsub = auth ? onAuthStateChanged(auth, (u) => {
      if (u) {
        if (!isLoaded.current) load();
      } else {
        subRef.current?.();
        isLoaded.current = false;
        setServiceOrders([]);
        setLoading(false);
      }
    }) : undefined;
    return () => {
      subRef.current?.();
      isLoaded.current = false;
      unsub?.();
    };
  }, [load]);

  const reserveNewSvcId = async (): Promise<string> => {
    if (!db) throw new Error("Firebase not initialized");
  const fdb = db as Firestore;
    // Use counters/svc-YY-MM similar to other counters
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, "0");
    const mmNoPad = (now.getMonth() + 1).toString();
    const counterId = `svc-${yy}-${mm}`;
  const counterRef = doc(fdb, "counters", counterId);

    let nextSeq = 0;
  await runTransaction(fdb, async (trx) => {
      const snap = await trx.get(counterRef);
      const current = (snap.exists() ? (snap.data() as any).seq : 0) || 0;
      nextSeq = current + 1;
      trx.set(counterRef, { seq: nextSeq, yy, mm, updatedAt: Timestamp.now() }, { merge: true });
    });
    return `SVC-${yy}${mmNoPad}${nextSeq}`; // e.g., SVC-2583
  };

  const createAndDispatchServiceOrder = async (payload: CreateAndDispatchPayload): Promise<string> => {
    if (!db) throw new Error("Firebase not configured");
  const fdb = db as Firestore;
    const validItems = (payload.items || []).filter((i) => i.quantity && i.quantity > 0);
    if (!payload.residenceId || validItems.length === 0) {
  throw new Error("يرجى اختيار السكن وإضافة صنف واحد على الأقل بكمية أكبر من 0.");
    }

    const codeShort = await reserveNewSvcId();

  await runTransaction(fdb, async (trx) => {
      const now = Timestamp.now();
      // 1) Read all inventory items first and validate stock
  const uniqueItemIds = [...new Set(validItems.map((i) => i.id))];
  const itemRefs = uniqueItemIds.map((id) => doc(fdb, "inventory", id));
      const itemSnaps = await Promise.all(itemRefs.map((r) => trx.get(r)));

      for (let i = 0; i < uniqueItemIds.length; i++) {
        if (!itemSnaps[i].exists()) throw new Error(`الصنف غير موجود: ${uniqueItemIds[i]}`);
      }

      // Aggregate quantities per item to validate once
      const totals = new Map<string, number>();
      for (const line of validItems) {
        const prev = totals.get(line.id) || 0;
        totals.set(line.id, prev + Number(line.quantity || 0));
      }

      // Validate available stock per item
      for (const [itemId, totalToSend] of totals.entries()) {
        const idx = uniqueItemIds.indexOf(itemId);
        const snap = itemSnaps[idx];
        const data: any = snap.data();
        const currentStock = Math.max(0, Number(data?.stockByResidence?.[payload.residenceId] || 0));
        if (currentStock < totalToSend) {
          const name = data?.nameEn || data?.nameAr || data?.name || itemId;
          throw new Error(`الكمية غير متوفرة للصنف ${name}. المتاح: ${currentStock} | المطلوب: ${totalToSend}`);
        }
      }

      // 2) Compute updates and prepare writes
      // Update inventory stocks (OUT)
      for (const [itemId, totalToSend] of totals.entries()) {
        const idx = uniqueItemIds.indexOf(itemId);
        const itemRef = itemRefs[idx];
        const snap = itemSnaps[idx];
        const data: any = snap.data();
        const current = Math.max(0, Number(data?.stockByResidence?.[payload.residenceId] || 0));
        const sbr = { ...(data?.stockByResidence || {}) } as Record<string, number>;
        sbr[payload.residenceId] = Math.max(0, current - totalToSend);
        const newTotal = Object.values(sbr).reduce((sum, v: any) => sum + (isNaN(Number(v)) ? 0 : Math.max(0, Number(v))), 0);
        trx.update(itemRef, { stockByResidence: sbr, stock: newTotal });
      }

      // Log OUT transactions per line
      for (const line of validItems) {
  const txRef = doc(collection(fdb, "inventoryTransactions"));
        trx.set(txRef, {
          itemId: line.id,
          itemNameEn: line.nameEn,
          itemNameAr: line.nameAr,
          residenceId: payload.residenceId,
          date: now,
          type: "OUT",
          quantity: line.quantity,
          referenceDocId: codeShort,
          locationName: `Sent to maintenance/workshop: ${payload.destination?.name || "N/A"}`,
        } as any);
      }

      // Create service order master document
  const orderRef = doc(collection(fdb, "serviceOrders"));
      const order: ServiceOrder = {
        id: orderRef.id,
        codeShort,
        dateCreated: now,
        residenceId: payload.residenceId,
        residenceName: payload.residenceName,
        destination: payload.destination,
        status: "DISPATCHED",
        dispatchedAt: now,
        createdById: payload.createdById,
        dispatchedById: payload.dispatchedById,
        transportInfo: payload.transportInfo,
        notes: payload.notes,
        items: validItems.map((i) => ({
          itemId: i.id,
          itemNameEn: i.nameEn,
          itemNameAr: i.nameAr,
          qtySent: i.quantity,
          qtyReturned: 0,
          qtyScrapped: 0,
        })),
      };
      trx.set(orderRef, order as any);
    });

    toast({ title: "Dispatched", description: "Service order created and dispatched." });
    return codeShort;
  };

  const receiveServiceOrder = async (
    orderId: string,
    updates: ReceiveLineUpdate[],
    receivedById: string
  ) => {
    if (!db) throw new Error("Firebase not configured");
    const fdb = db as Firestore;

    await runTransaction(fdb, async (trx) => {
      const orderRef = doc(fdb, "serviceOrders", orderId);
      const orderSnap = await trx.get(orderRef);
      if (!orderSnap.exists()) throw new Error("Service order not found");
      const order = orderSnap.data() as ServiceOrder;

      const now = Timestamp.now();

      // Build a map of updates by itemId
      const updMap = new Map<string, { addReturned: number; addScrapped: number }>();
      for (const u of updates) {
        const addR = Math.max(0, Number(u.addReturned || 0));
        const addS = Math.max(0, Number(u.addScrapped || 0));
        if (addR === 0 && addS === 0) continue;
        const existing = updMap.get(u.itemId) || { addReturned: 0, addScrapped: 0 };
        updMap.set(u.itemId, {
          addReturned: existing.addReturned + addR,
          addScrapped: existing.addScrapped + addS,
        });
      }

      if (updMap.size === 0) return; // nothing to do

      // Validate lines and compute deltas
      const newItems: ServiceOrderItem[] = order.items.map((ln) => ({ ...ln }));

      for (const [itemId, data] of updMap.entries()) {
        const line = newItems.find((l) => l.itemId === itemId);
        if (!line) throw new Error(`Item not found in order: ${itemId}`);
        const newReturned = line.qtyReturned + data.addReturned;
        const newScrapped = line.qtyScrapped + data.addScrapped;
        if (newReturned + newScrapped > line.qtySent) {
          throw new Error(
            `Invalid quantities for ${line.itemNameEn}: returned+scrapped exceeds sent (sent=${line.qtySent})`
          );
        }
      }

      // Perform inventory updates and transaction logs based on deltas
      for (const [itemId, data] of updMap.entries()) {
        const line = newItems.find((l) => l.itemId === itemId)!;
        // Return delta
        if (data.addReturned > 0) {
          const itemRef = doc(fdb, "inventory", itemId);
          const invSnap = await trx.get(itemRef);
          if (!invSnap.exists()) throw new Error("Inventory item missing");
          const inv = invSnap.data() as any;
          const sbr = { ...(inv?.stockByResidence || {}) } as Record<string, number>;
          const cur = Math.max(0, Number(sbr[order.residenceId] || 0));
          sbr[order.residenceId] = cur + data.addReturned;
          const newTotal = Object.values(sbr).reduce((sum, v: any) => sum + (isNaN(Number(v)) ? 0 : Math.max(0, Number(v))), 0);
          trx.update(itemRef, { stockByResidence: sbr, stock: newTotal });

          const txRef = doc(collection(fdb, "inventoryTransactions"));
          trx.set(txRef, {
            itemId,
            itemNameEn: line.itemNameEn,
            itemNameAr: line.itemNameAr,
            residenceId: order.residenceId,
            date: now,
            type: "IN",
            quantity: data.addReturned,
            referenceDocId: order.codeShort,
            locationName: `Returned from maintenance/workshop: ${order.destination?.name || "N/A"}`,
          } as any);

          line.qtyReturned += data.addReturned;
        }
        // Scrap delta
        if (data.addScrapped > 0) {
          // For scrapped: just log depreciation, stock was already reduced on dispatch
          const txRef = doc(collection(fdb, "inventoryTransactions"));
          trx.set(txRef, {
            itemId,
            itemNameEn: line.itemNameEn,
            itemNameAr: line.itemNameAr,
            residenceId: order.residenceId,
            date: now,
            type: "DEPRECIATION",
            quantity: data.addScrapped,
            referenceDocId: order.codeShort,
            locationName: `Scrapped at workshop: ${order.destination?.name || "N/A"}`,
            depreciationReason: "Scrapped at workshop",
          } as any);

          line.qtyScrapped += data.addScrapped;
        }
      }

      // Determine new status
      let allClosed = true;
      for (const ln of newItems) {
        if (ln.qtyReturned + ln.qtyScrapped < ln.qtySent) {
          allClosed = false;
          break;
        }
      }

      const newStatus: ServiceOrderStatus = allClosed ? "COMPLETED" : "PARTIAL_RETURN";

      trx.update(orderRef, {
        items: newItems,
        status: newStatus,
        receivedById,
        receivedAt: now,
      });
    });

    toast({ title: "Received", description: "Service order receipt posted." });
  };

  const getServiceOrderById = async (orderId: string): Promise<ServiceOrder | null> => {
    if (!db) return null;
  const fdb = db as Firestore;
  const ref = doc(fdb, "serviceOrders", orderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return { id: snap.id, ...(data as any) } as ServiceOrder;
  };

  const getServiceOrderByCode = async (codeShort: string): Promise<ServiceOrder | null> => {
    if (!db) return null;
    const fdb = db as Firestore;
    const qRef = query(collection(fdb, "serviceOrders"), where("codeShort", "==", codeShort));
    const res = await getDocs(qRef);
    if (res.empty) return null;
    const d = res.docs[0];
    return { id: d.id, ...(d.data() as any) } as ServiceOrder;
  };

  return (
    <ServiceOrdersContext.Provider
  value={{ serviceOrders, loading, createAndDispatchServiceOrder, receiveServiceOrder, getServiceOrderById, getServiceOrderByCode }}
    >
      {children}
    </ServiceOrdersContext.Provider>
  );
};

export const useServiceOrders = () => {
  const ctx = useContext(ServiceOrdersContext);
  if (!ctx) throw new Error("useServiceOrders must be used within a ServiceOrdersProvider");
  return ctx;
};
