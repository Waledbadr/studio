
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useToast } from "../hooks/use-toast";
import { useUsers } from './users-context';
import type { User } from './users-context';
import { useResidences } from './residences-context';
import { useNotifications } from './notifications-context';

// Type definitions for API-based inventory system
type Timestamp = Date;

export type ItemCategory = string;

export interface InventoryItem {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  category: ItemCategory;
  unit: string;
  stock: number; // This will now represent total stock across all residences.
  stockByResidence?: { [residenceId: string]: number };
  lifespanDays?: number;
  variants?: string[];
}

export interface InventoryTransaction {
    id: string;
    itemId: string;
    itemNameEn: string;
    itemNameAr: string;
    residenceId: string;
    date: Timestamp;
    type: 'RECEIVE' | 'ISSUE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'RETURN' | 'IN' | 'OUT' | 'DEPRECIATION' | 'AUDIT' | 'SCRAP';
    quantity: number;
    referenceDocId: string; // e.g., Order ID or MIV ID
    locationId?: string;
    locationName?: string;
    relatedResidenceId?: string; // For transfers
    depreciationReason?: string; // For depreciation transactions
}

export interface DepreciationRequest {
    itemId: string;
    residenceId: string;
    locationId: string;
    locationName: string;
    quantity: number;
    reason: string;
    notes?: string;
}

export interface LocationWithItems<T> {
    locationId: string;
    locationName: string;
    isFacility: boolean;
    buildingId?: string;
    buildingName?: string;
    floorId?: string;
    floorName?: string;
    roomId?: string;
    roomName?: string;
    facilityId?: string;
    items: T[];
}

export interface MIV {
    id: string;
    date: Timestamp;
    residenceId: string;
    itemCount: number;
    locationName: string;
}

export interface MIVDetails {
    id: string;
    date: Timestamp;
    residenceId: string;
    locations: {
        [locationName: string]: {
            itemId: string;
            itemNameEn: string;
            itemNameAr: string;
            quantity: number;
        }[];
    }
}

export interface StockTransfer {
  id: string;
  date: Timestamp;
  fromResidenceId: string;
  fromResidenceName: string;
  toResidenceId: string;
  toResidenceName: string;
  requestedById: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  items: { id: string; nameEn: string; nameAr: string; quantity: number; }[];
  approvedById?: string;
  approvedAt?: Timestamp;
  rejectedById?: string;
  rejectedAt?: Timestamp;
}

export type NewStockTransferPayload = Omit<StockTransfer, 'id' | 'date' | 'status'>;

// Inventory Audit interfaces
export interface InventoryAudit {
  id: string;
  name: string;
  description?: string;
  residenceId: string;
  residenceName: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: Timestamp;
  startDate?: Timestamp;
  endDate?: Timestamp;
  scope: {
    locations: string[]; // locationId:locationName format
    categories: string[];
    includeAllItems: boolean;
    specificItems: string[];
  };
  settings: {
    requireDoubleCheck: boolean;
    requirePhotos: boolean;
    autoGenerateReport: boolean;
    emailReport: boolean;
  };
  summary?: {
    totalItems: number;
    completedItems: number;
    discrepanciesCount: number;
    adjustmentsMade: number;
  };
}

export interface AuditItem {
  id: string;
  auditId: string;
  itemId: string;
  itemName: string;
  itemNameAr: string;
  category: string;
  unit: string;
  locationId: string;
  locationName: string;
  systemStock: number;
  physicalStock: number | null;
  difference: number;
  status: 'PENDING' | 'COUNTED' | 'VERIFIED' | 'DISCREPANCY' | 'ADJUSTED';
  notes: string;
  countedBy?: string;
  countedAt?: Timestamp;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  adjustmentAction?: 'APPROVE' | 'REJECT' | 'MODIFY';
  adjustmentReason?: string;
  newPhysicalCount?: number;
}

export interface AuditAdjustment {
  id: string;
  auditId: string;
  itemId: string;
  itemNameAr: string;
  locationId: string;
  locationName: string;
  oldStock: number;
  newStock: number;
  difference: number;
  unit: string;
  reason: string;
  adjustedBy: string;
  adjustedAt: Timestamp;
}


interface InventoryContextType {
  items: InventoryItem[];
  categories: string[];
  transfers: StockTransfer[];
  audits: InventoryAudit[];
  loading: boolean;
  addItem: (item: Omit<InventoryItem, 'id' | 'stock'>) => Promise<InventoryItem | void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loadInventory: () => void;
  addCategory: (category: string) => Promise<void>;
  updateCategory: (oldName: string, newName: string) => Promise<void>;
  getStockForResidence: (item: InventoryItem, residenceId: string) => number;
  createTransferRequest: (payload: NewStockTransferPayload, currentUser: User) => Promise<void>;
  approveTransfer: (transferId: string, approverId: string) => Promise<void>;
  rejectTransfer: (transferId: string, rejecterId: string) => Promise<void>;
  issueItemsFromStock: (residenceId: string, voucherLocations: LocationWithItems<{id: string, nameEn: string, nameAr: string, issueQuantity: number}>[]) => Promise<void>;
  getInventoryTransactions: (itemId: string, residenceId: string) => Promise<InventoryTransaction[]>;
  getAllInventoryTransactions: () => Promise<InventoryTransaction[]>;
  getAllIssueTransactions: () => Promise<InventoryTransaction[]>;
  getMIVs: () => Promise<MIV[]>;
  getMIVById: (mivId: string) => Promise<MIVDetails | null>;
  getLastIssueDateForItemAtLocation: (itemId: string, locationId: string) => Promise<Timestamp | null>;
  depreciateItems: (depreciationRequest: DepreciationRequest) => Promise<void>;
  createAudit: (auditData: Omit<InventoryAudit, 'id' | 'createdAt' | 'summary'>) => Promise<string>;
  getAudits: () => Promise<InventoryAudit[]>;
  getAuditById: (auditId: string) => Promise<InventoryAudit | null>;
  updateAuditStatus: (auditId: string, status: InventoryAudit['status']) => Promise<void>;
  getAuditItems: (auditId: string) => Promise<AuditItem[]>;
  updateAuditItem: (auditItem: AuditItem) => Promise<void>;
  submitAuditCount: (auditId: string, itemId: string, physicalStock: number, notes: string, countedBy: string) => Promise<void>;
  completeAudit: (auditId: string, adjustments: AuditAdjustment[], generalNotes: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// API-based inventory system
const API_BASE = '/api/inventory';

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [audits, setAudits] = useState<InventoryAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isLoaded = useRef(false);
  const { residences } = useResidences();
  const { addNotification } = useNotifications();

  const loadInventory = useCallback(async () => {
    if (isLoaded.current) return;

    try {
      setLoading(true);

      // Load inventory items
      const itemsResponse = await fetch(`${API_BASE}`);
      if (itemsResponse.ok) {
        const inventoryData = await itemsResponse.json();
        setItems(inventoryData);
      }

      // Load categories
      const categoriesResponse = await fetch(`${API_BASE}/categories`);
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }

      // Load transfers
      const transfersResponse = await fetch(`${API_BASE}/transfers`);
      if (transfersResponse.ok) {
        const transfersData = await transfersResponse.json();
        setTransfers(transfersData);
      }

      // Load audits
      const auditsResponse = await fetch(`${API_BASE}/audits`);
      if (auditsResponse.ok) {
        const auditsData = await auditsResponse.json();
        setAudits(auditsData);
      }

      setLoading(false);
      isLoaded.current = true;
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast({
        title: "Error",
        description: "Could not fetch inventory data.",
        variant: "destructive"
      });
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);
  
  const getStockForResidence = (item: InventoryItem, residenceId: string) => {
    if (!item.stockByResidence) return 0;
    return item.stockByResidence[residenceId] || 0;
  };

  const addCategory = async (newCategory: string) => {
    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory }),
      });

      if (!response.ok) throw new Error('Failed to add category');

      toast({ title: "Success", description: "Category added." });
      await loadInventory(); // Reload to get updated data
    } catch (error) {
      console.error("Error adding category:", error);
      toast({ title: "Error", description: "Failed to add category.", variant: "destructive" });
    }
  };

  const updateCategory = async (oldName: string, newName: string) => {
    try {
      const response = await fetch(`${API_BASE}/categories/${oldName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error('Failed to update category');

      toast({ title: "Success", description: "Category updated successfully." });
      await loadInventory(); // Reload to get updated data
    } catch (error) {
      console.error("Error updating category:", error);
      toast({ title: "Error", description: "Failed to update category.", variant: "destructive" });
    }
  };

  const addItem = async (newItem: Omit<InventoryItem, 'id' | 'stock'>): Promise<InventoryItem | void> => {
    const isDuplicate = items.some(item =>
      item.nameEn.toLowerCase() === newItem.nameEn.toLowerCase() ||
      item.nameAr === newItem.nameAr
    );

    if (isDuplicate) {
      toast({ title: "Error", description: "An item with this name already exists.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) throw new Error('Failed to add item');

      const createdItem = await response.json();
      toast({ title: "Success", description: "New item added to inventory." });

      // Add to local state
      setItems(prev => [...prev, createdItem]);

      // Add category if it doesn't exist
      const newCategory = newItem.category.toLowerCase();
      if (!categories.map(c => c.toLowerCase()).includes(newCategory)) {
        await addCategory(newItem.category);
      }

      return createdItem;
    } catch (error) {
      console.error("Error adding item:", error);
      toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
    }
  };

  const updateItem = async (itemToUpdate: InventoryItem) => {
    try {
      const response = await fetch(`${API_BASE}/${itemToUpdate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToUpdate),
      });

      if (!response.ok) throw new Error('Failed to update item');

      toast({ title: "Success", description: "Item updated." });

      // Update local state
      setItems(prev => prev.map(item =>
        item.id === itemToUpdate.id ? itemToUpdate : item
      ));
    } catch (error) {
      console.error("Error updating item:", error);
      toast({ title: "Error", description: "Failed to update item.", variant: "destructive" });
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete item');

      toast({ title: "Success", description: "Item has been deleted." });

      // Update local state
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
    }
  };
  
    const generateNewMivId = async (): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE}/mivs/generate-id`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to generate MIV ID');

      const data = await response.json();
      return data.mivId;
    } catch (error) {
      console.error("Error generating MIV ID:", error);
      throw error;
    }
  };

  const issueItemsFromStock = async (residenceId: string, voucherLocations: LocationWithItems<{id: string, nameEn: string, nameAr: string, issueQuantity: number}>[]) => {
    try {
      const response = await fetch(`${API_BASE}/mivs/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residenceId,
          voucherLocations
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to issue items');
      }

      toast({ title: "Success", description: "Voucher submitted successfully." });

      // Reload inventory to get updated stock
      await loadInventory();
    } catch (error) {
      console.error("Transaction failed: ", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to issue items", variant: "destructive" });
      throw error;
    }
  };


   const getInventoryTransactions = async (itemId: string, residenceId: string): Promise<InventoryTransaction[]> => {
    try {
      const response = await fetch(`${API_BASE}/transactions?itemId=${itemId}&residenceId=${residenceId}`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');

      const transactions = await response.json();

      // Sort by date (assuming date is a string or timestamp)
      transactions.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return transactions;
    } catch (error) {
      console.error("Error fetching inventory transactions:", error);
      toast({ title: "Error", description: "Failed to fetch item history.", variant: "destructive" });
      return [];
    }
  };

  const getAllIssueTransactions = async (): Promise<InventoryTransaction[]> => {
    try {
      const response = await fetch(`${API_BASE}/transactions?type=OUT`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to fetch issue transactions');

      const transactions = await response.json();

      // Sort by date descending
      transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return transactions;
    } catch (error) {
      console.error("Error fetching issue transactions:", error);
      toast({ title: "Error", description: "Failed to fetch issue transactions.", variant: "destructive" });
      return [];
    }
  };

  const getAllInventoryTransactions = async (): Promise<InventoryTransaction[]> => {
    try {
      const response = await fetch(`${API_BASE}/transactions`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to fetch all transactions');

      const transactions = await response.json();

      // Sort by date descending
      transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return transactions;
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      toast({
        title: "Error",
        description: `Error fetching transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      return [];
    }
  };

  const getMIVs = async (): Promise<MIV[]> => {
    try {
      const response = await fetch(`${API_BASE}/mivs`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to fetch MIVs');

      const mivs = await response.json();
      return mivs;
    } catch (error) {
      console.error("Error fetching MIVs:", error);
      toast({ title: "Error", description: "Failed to fetch MIVs.", variant: "destructive" });
      return [];
    }
  };

  const getMIVById = async (mivId: string): Promise<MIVDetails | null> => {
    try {
      const response = await fetch(`${API_BASE}/mivs/${mivId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch MIV details');
      }

      const mivDetails = await response.json();
      return mivDetails;
    } catch (error) {
      console.error("Error fetching MIV details:", error);
      toast({ title: "Error", description: "Failed to fetch MIV details.", variant: "destructive" });
      return null;
    }
  };

  const getLastIssueDateForItemAtLocation = async (itemId: string, locationId: string): Promise<Date | null> => {
    try {
      const response = await fetch(`${API_BASE}/transactions/last-issue?itemId=${itemId}&locationId=${locationId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch last issue date');
      }

      const data = await response.json();
      return data.lastIssueDate ? new Date(data.lastIssueDate) : null;
    } catch (error) {
      console.error('Error fetching last issue date:', error);
      return null;
    }
  };

  const createTransferRequest = async (payload: NewStockTransferPayload, currentUser: User) => {
    if (!payload) {
      const msg = "Transfer payload is missing.";
      toast({ title: "Error", description: msg, variant: "destructive" });
      throw new Error(msg);
    }

    const { fromResidenceId, toResidenceId, items: itemsToTransfer } = payload;

    const isInternalTransfer = currentUser.assignedResidences.includes(fromResidenceId) &&
                               currentUser.assignedResidences.includes(toResidenceId);

    if (isInternalTransfer) {
      // Direct transfer, no approval needed
      try {
        const response = await fetch(`${API_BASE}/transfers/internal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromResidenceId,
            toResidenceId,
            items: itemsToTransfer,
            currentUserId: currentUser.id
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to execute direct transfer');
        }

        toast({ title: "Success", description: "Internal transfer completed successfully." });

        // Reload inventory to get updated stock
        await loadInventory();
      } catch (error) {
        const err = error as Error;
        console.error("Failed to execute direct transfer:", err);
        toast({ title: "Error", description: `Transfer failed: ${err.message}`, variant: "destructive" });
        throw err;
      }
    } else {
      // External transfer, requires approval
      try {
        const response = await fetch(`${API_BASE}/transfers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            currentUserId: currentUser.id
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create transfer request');
        }

        const newTransfer = await response.json();

        // Create notification for the destination residence manager
        const toResidence = residences.find(r => r.id === toResidenceId);
        if (toResidence && toResidence.managerId && addNotification) {
          await addNotification({
            userId: toResidence.managerId,
            title: 'New Stock Transfer Request',
            message: `You have a new transfer request from ${payload.fromResidenceName}.`,
            type: 'transfer_request',
            href: `/inventory/transfer`,
            referenceId: newTransfer.id,
          });
        }

        toast({ title: "Success", description: "Transfer request created and pending approval." });
      } catch (error) {
        console.error("Failed to create transfer request:", error);
        throw error;
      }
    }
  };

  const approveTransfer = async (transferId: string, approverId: string) => {
    try {
      const response = await fetch(`${API_BASE}/transfers/${transferId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve transfer');
      }

      toast({ title: "Success", description: "Transfer approved and stock updated." });

      // Reload inventory to get updated stock
      await loadInventory();
    } catch (error) {
      console.error("Failed to approve transfer:", error);
      const err = error as Error;
      toast({ title: "Error", description: `Approval failed: ${err.message}`, variant: "destructive" });
    }
  };

  const rejectTransfer = async (transferId: string, rejecterId: string) => {
    try {
      const response = await fetch(`${API_BASE}/transfers/${transferId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejecterId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject transfer');
      }

      toast({ title: "Success", description: "Transfer request has been rejected." });
    } catch (error) {
      console.error("Failed to reject transfer:", error);
      toast({ title: "Error", description: "Failed to reject transfer.", variant: "destructive" });
    }
  };

  const depreciateItems = async (depreciationRequest: DepreciationRequest) => {
    try {
      const response = await fetch(`${API_BASE}/depreciation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depreciationRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to depreciate items');
      }

      toast({
        title: "Success",
        description: `Successfully depreciated ${depreciationRequest.quantity} items. Reason: ${depreciationRequest.reason}`
      });

      // Reload inventory to get updated stock
      await loadInventory();
    } catch (error) {
      console.error("Failed to depreciate items:", error);
      const err = error as Error;
      toast({
        title: "Error",
        description: `Depreciation failed: ${err.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const createAudit = async (auditData: Omit<InventoryAudit, 'id' | 'createdAt' | 'summary'>): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE}/audits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create audit');
      }

      const createdAudit = await response.json();
      toast({ title: "Success", description: "Audit created successfully." });
      return createdAudit.id;
    } catch (error) {
      console.error("Error creating audit:", error);
      toast({ title: "Error", description: "Failed to create audit.", variant: "destructive" });
      throw error;
    }
  };

  const getAudits = async (): Promise<InventoryAudit[]> => {
    try {
      const response = await fetch(`${API_BASE}/audits`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to fetch audits');

      const audits = await response.json();
      return audits;
    } catch (error) {
      console.error('Error fetching audits:', error);
      toast({ title: "Error", description: "Failed to fetch audits.", variant: "destructive" });
      return [];
    }
  };

  const getAuditById = async (auditId: string): Promise<InventoryAudit | null> => {
    try {
      const response = await fetch(`${API_BASE}/audits/${auditId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch audit');
      }

      const audit = await response.json();
      return audit;
    } catch (error) {
      console.error('Error fetching audit:', error);
      toast({ title: "Error", description: "Failed to fetch audit.", variant: "destructive" });
      return null;
    }
  };

  const updateAuditStatus = async (auditId: string, status: InventoryAudit['status']): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/audits/${auditId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update audit status');
      }

      toast({ title: "Success", description: "Audit status updated." });
    } catch (error) {
      console.error('Error updating audit status:', error);
      toast({ title: "Error", description: "Failed to update audit status.", variant: "destructive" });
      throw error;
    }
  };

  const getAuditItems = async (auditId: string): Promise<AuditItem[]> => {
    try {
      const response = await fetch(`${API_BASE}/audits/${auditId}/items`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to fetch audit items');

      const auditItems = await response.json();
      return auditItems;
    } catch (error) {
      console.error('Error fetching audit items:', error);
      toast({ title: "Error", description: "Failed to fetch audit items.", variant: "destructive" });
      return [];
    }
  };

  const updateAuditItem = async (auditItem: AuditItem): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/audits/items/${auditItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditItem),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update audit item');
      }
    } catch (error) {
      console.error('Error updating audit item:', error);
      toast({ title: "Error", description: "Failed to update audit item.", variant: "destructive" });
      throw error;
    }
  };

  const submitAuditCount = async (
    auditId: string,
    itemId: string,
    physicalStock: number,
    notes: string,
    countedBy: string
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/audits/${auditId}/count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          physicalStock,
          notes,
          countedBy
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit audit count');
      }

      toast({ title: "Success", description: "Count submitted successfully." });
    } catch (error) {
      console.error('Error submitting audit count:', error);
      toast({ title: "Error", description: "Failed to submit count.", variant: "destructive" });
      throw error;
    }
  };

  const completeAudit = async (
    auditId: string,
    adjustments: AuditAdjustment[],
    generalNotes: string
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/audits/${auditId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustments,
          generalNotes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete audit');
      }

      toast({
        title: "Success",
        description: `Audit completed successfully. ${adjustments.length} adjustments applied.`
      });

      // Reload inventory to get updated stock
      await loadInventory();
    } catch (error) {
      console.error('Error completing audit:', error);
      toast({ title: "Error", description: "Failed to complete audit.", variant: "destructive" });
      throw error;
    }
  };


  return (
    <InventoryContext.Provider value={{ 
      items, 
      categories, 
      transfers, 
      audits, 
      loading, 
      addItem, 
      updateItem, 
      deleteItem, 
      loadInventory, 
      addCategory, 
      updateCategory, 
      getStockForResidence, 
      issueItemsFromStock, 
      getInventoryTransactions, 
      getAllInventoryTransactions, 
      getMIVs, 
      getMIVById, 
      getLastIssueDateForItemAtLocation, 
      getAllIssueTransactions, 
      createTransferRequest, 
      approveTransfer, 
      rejectTransfer, 
      depreciateItems,
      createAudit,
      getAudits,
      getAuditById,
      updateAuditStatus,
      getAuditItems,
      updateAuditItem,
      submitAuditCount,
      completeAudit
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
