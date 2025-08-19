"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, TrendingUp, Download, Search, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface StockMovementFilters {
  residenceId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  facilityId: string;
  movementType: string;
  itemId: string;
  startDate?: Date;
  endDate?: Date;
}

export default function StockMovementReportPage() {
  const { getAllInventoryTransactions, items, getMRVById, getMIVById, getReconciliationItems, getTransferItems } = useInventory();
  const { residences } = useResidences();
  const { currentUser } = useUsers();
  const { dict } = useLanguage();

  const [filters, setFilters] = useState<StockMovementFilters>({
    residenceId: '',
    buildingId: '',
    floorId: '',
    roomId: '',
  facilityId: '',
    movementType: '',
    itemId: '',
    startDate: undefined,
    endDate: undefined
  });

  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [includeWithoutLocation, setIncludeWithoutLocation] = useState(true);

  // Details dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [docDetails, setDocDetails] = useState<any>(null);
  const [reconItems, setReconItems] = useState<any[]>([]);
  const [transferItems, setTransferItems] = useState<any[]>([]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchAllData = async () => {
      setIsFetchingInitial(true);
      const transactions = await getAllInventoryTransactions();
      setAllTransactions(transactions);
      setIsFetchingInitial(false);
    };
    fetchAllData();
  }, [getAllInventoryTransactions]);

  // Initialize filters from query params (e.g., ?itemId=abc&residenceId=xyz)
  useEffect(() => {
    const itemId = searchParams?.get('itemId') || '';
    const residenceId = searchParams?.get('residenceId') || '';
    const movementType = searchParams?.get('type') || '';
    if (itemId || residenceId || movementType) {
      setFilters(prev => ({
        ...prev,
        itemId: itemId || prev.itemId,
        residenceId: residenceId || prev.residenceId,
        movementType: movementType || prev.movementType,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userResidences = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return residences;
    return residences.filter(r => currentUser.assignedResidences.includes(r.id));
  }, [currentUser, residences]);

  // Handle filter changes
  const handleFilterChange = (key: keyof StockMovementFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset dependent filters when parent changes
      if (key === 'residenceId') {
        newFilters.buildingId = '';
        newFilters.floorId = '';
        newFilters.roomId = '';
  newFilters.facilityId = '';
      } else if (key === 'buildingId') {
        newFilters.floorId = '';
        newFilters.roomId = '';
  newFilters.facilityId = '';
      } else if (key === 'floorId') {
        newFilters.roomId = '';
  newFilters.facilityId = '';
      }
      
      return newFilters;
    });
  };

  // Get available options based on current filters
  const availableBuildings = useMemo(() => {
    if (!filters.residenceId) return [];
    const residence = userResidences.find(r => r.id === filters.residenceId);
    return residence?.buildings || [];
  }, [userResidences, filters.residenceId]);

  const availableFloors = useMemo(() => {
    if (!filters.buildingId) return [];
    const building = availableBuildings.find(b => b.id === filters.buildingId);
    return building?.floors || [];
  }, [availableBuildings, filters.buildingId]);

  const availableRooms = useMemo(() => {
    if (!filters.floorId) return [];
    const floor = availableFloors.find(f => f.id === filters.floorId);
    return floor?.rooms || [];
  }, [availableFloors, filters.floorId]);

  // Facilities available at the selected level (residence > building > floor)
  const availableFacilities = useMemo(() => {
    if (!filters.residenceId) return [];
    const residence = userResidences.find(r => r.id === filters.residenceId);
    if (!residence) return [];
    if (filters.floorId) {
      const building = (residence.buildings || []).find((b: any) => b.id === filters.buildingId);
      const floor = building?.floors?.find((f: any) => f.id === filters.floorId);
      return floor?.facilities || [];
    }
    if (filters.buildingId) {
      const building = (residence.buildings || []).find((b: any) => b.id === filters.buildingId);
      return building?.facilities || [];
    }
    return residence.facilities || [];
  }, [userResidences, filters.residenceId, filters.buildingId, filters.floorId]);

  const availableItems = useMemo(() => {
    const arr = (items || []) as any[];
    const collator = new Intl.Collator(['ar', 'en'], { sensitivity: 'base', numeric: true });
    return [...arr].sort((a, b) => {
      const aLabel = `${a?.nameAr || ''} ${a?.nameEn || ''}`.trim();
      const bLabel = `${b?.nameAr || ''} ${b?.nameEn || ''}`.trim();
      return collator.compare(aLabel, bLabel);
    });
  }, [items]);

  // Generate report
  const handleGenerateReport = useCallback(() => {
    setIsGenerating(true);
    setHasGenerated(false);
    
    // Get a list of residence IDs the user is allowed to see based on the filter
    const allowedResidenceIds = new Set(
        filters.residenceId 
        ? [filters.residenceId] 
        : userResidences.map(r => r.id)
    );

    // Build allowed location ids based on selected hierarchy (facility > room > floor > building)
    let allowedLocationIds: string[] | null = null;
    if (filters.facilityId) {
      allowedLocationIds = [filters.facilityId];
    } else if (filters.roomId) {
      allowedLocationIds = [filters.roomId];
    } else if (filters.floorId) {
      // availableRooms is already scoped to the selected floor; include floor facilities too
      const floor = availableFloors.find(f => f.id === filters.floorId);
      const floorFacilities = (floor?.facilities || []).map((f: any) => f.id).filter(Boolean) as string[];
      allowedLocationIds = [
        ...availableRooms.map(r => r.id).filter(Boolean) as string[],
        ...floorFacilities,
      ];
    } else if (filters.buildingId) {
      const building = availableBuildings.find(b => b.id === filters.buildingId);
      const buildingRooms = (building?.floors || []).flatMap(f => (f?.rooms || []).map(r => r.id)).filter(Boolean) as string[];
      // Include facilities at building level and within its floors
      const buildingFacilities = (building?.facilities || []).map((f: any) => f.id).filter(Boolean) as string[];
      const floorFacilities = (building?.floors || []).flatMap(f => (f?.facilities || []).map((fc: any) => fc.id)).filter(Boolean) as string[];
      allowedLocationIds = [...buildingRooms, ...buildingFacilities, ...floorFacilities];
    }

    const filtered = allTransactions.filter(transaction => {
        let keep = true;

        // Filter by user's assigned residences if no specific residence is selected
        if (!allowedResidenceIds.has(transaction.residenceId)) keep = false;
        
        if (filters.movementType && transaction.type !== filters.movementType) keep = false;
        if (filters.itemId && transaction.itemId !== filters.itemId) keep = false;

        // Date filtering
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            if (transaction.date.toDate() < startDate) keep = false;
        }
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            if (transaction.date.toDate() > endDate) keep = false;
        }
        
        // Location filtering by IDs when any of building/floor/room is selected
        if (allowedLocationIds && allowedLocationIds.length > 0) {
          const txLocId = transaction.locationId as string | undefined;
          if (txLocId) {
            if (!allowedLocationIds.includes(txLocId)) keep = false;
          } else {
            if (!includeWithoutLocation) keep = false;
          }
        }
        
        return keep;
    });

    // Newest first
    const sorted = [...filtered].sort((a, b) => {
      const aMs = typeof a.date?.toMillis === 'function' ? a.date.toMillis() : a.date?.toDate?.().getTime?.() ?? 0;
      const bMs = typeof b.date?.toMillis === 'function' ? b.date.toMillis() : b.date?.toDate?.().getTime?.() ?? 0;
      return bMs - aMs;
    });

    setFilteredTransactions(sorted);
    setIsGenerating(false);
    setHasGenerated(true);

  }, [filters, allTransactions, userResidences, availableRooms, availableFloors, availableBuildings, includeWithoutLocation]);

  // Auto-generate on first load after data is fetched, or when query params prefill filters
  useEffect(() => {
    if (!isFetchingInitial && !isGenerating && !hasGenerated) {
      handleGenerateReport();
    }
  }, [isFetchingInitial, isGenerating, hasGenerated, handleGenerateReport]);

  // Build deep links to original documents
  const canOpenDocLink = (tx: any) => {
    if (!tx?.referenceDocId) return null;
    if (tx.type === 'IN') return `/inventory/receive/receipts/${tx.referenceDocId}`;
    if (tx.type === 'OUT') {
      return typeof tx.referenceDocId === 'string' && tx.referenceDocId.startsWith('MIV-')
        ? `/inventory/issue-history/${tx.referenceDocId}`
        : null;
    }
    if (tx.type === 'ADJUSTMENT') {
      const id = tx.referenceDocId as string;
      return id.startsWith('CON-') ? `/inventory/reports/reconciliations/${id}` : null;
    }
    return null;
  };

  // Open row details dialog and fetch extra info depending on type
  const openTxDetails = async (tx: any) => {
    setSelectedTx(tx);
    setDocDetails(null);
  setReconItems([]);
  setTransferItems([]);
    setDetailOpen(true);
    try {
      setDetailLoading(true);
      if (tx.type === 'IN' && tx.referenceDocId) {
        const d = await getMRVById(tx.referenceDocId);
        setDocDetails(d);
      } else if (tx.type === 'OUT' && tx.referenceDocId && String(tx.referenceDocId).startsWith('MIV-')) {
        const d = await getMIVById(tx.referenceDocId);
        setDocDetails(d);
      } else if (tx.type === 'ADJUSTMENT' && tx.referenceDocId) {
        const items = await getReconciliationItems(tx.referenceDocId);
        setReconItems(items || []);
      } else if ((tx.type === 'TRANSFER_IN' || tx.type === 'TRANSFER_OUT') && tx.referenceDocId) {
        try {
          const rows = await getTransferItems(tx.referenceDocId);
          setTransferItems(rows || []);
        } catch {}
      }
    } catch (e) {
      // ignore, show minimal info
    } finally {
      setDetailLoading(false);
    }
  };


  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Item', 'Movement Type', 'Quantity', 'Residence', 'Location', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(transaction => [
        format(transaction.date.toDate(), 'yyyy-MM-dd HH:mm'),
        `"${transaction.itemNameEn || 'Unknown Item'}"`,
        getMovementTypeLabel(transaction.type),
        transaction.quantity,
        `"${getResidenceName(transaction.residenceId)}"`,
        `"${getLocationString(transaction)}"`,
        `"${transaction.referenceDocId || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-movement-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper functions
  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'IN': return dict.stockIn;
      case 'OUT': return dict.stockOut;
      case 'TRANSFER_IN': return (dict as any).transferIn;
      case 'TRANSFER_OUT': return (dict as any).transferOut;
      case 'ADJUSTMENT': return dict.adjustmentLabel;
      case 'RETURN': return dict.returnLabel;
      case 'DEPRECIATION': return dict.depreciationLabel;
      case 'AUDIT': return dict.auditAdjustmentLabel;
      case 'SCRAP': return dict.scrapLabel;
      default: return type;
    }
  };

  const getLocationString = (transaction: any) => {
    const text = transaction.locationName || dict.locationNotSpecified;
    // Replace any residence ID codes appearing in text with their human-friendly residence name
    // e.g. "Internal transfer from residence (6w8r1vh1h8xjpOsVULV5)" -> "... (Gypsum)"
    if (!text || !Array.isArray(residences) || residences.length === 0) return text;
    let result = text as string;
    for (const r of residences as any[]) {
      const id = r?.id as string | undefined;
      const name = r?.name as string | undefined;
      if (!id || !name) continue;
  // Replace all occurrences of the ID in the string
  // In TS/JS source, the proper escape pattern is /[.*+?^${}()|[\]\\]/g for string-based regex construction
      // But we want the final regex to see /[.*+?^${}()|[\]\\]/g -> so here we double-escape in string
      const safe = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(safe, 'g'), name);
    }
    return result;
  };

  const getResidenceName = (residenceId: string) => {
    const residence = residences.find(r => r.id === residenceId);
    return residence?.name || 'Unknown Residence';
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'TRANSFER_IN':
      case 'IN':
      case 'RETURN':
        return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20';
      case 'TRANSFER_OUT':
      case 'OUT':
      case 'DEPRECIATION':
      case 'SCRAP':
        return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20';
      case 'ADJUSTMENT':
      case 'AUDIT':
        return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700';
    }
  };

  if (isFetchingInitial) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header Section */}
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
        <div className="flex items-start justify-between">
          <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{dict.stockMovementReportTitle}</h1>
        <p className="text-muted-foreground text-lg">{dict.stockMovementReportDescription}</p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-muted/30 dark:bg-card border-b">
          <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
              <Filter className="mr-3 h-6 w-6 text-primary" />
              {dict.reportFilters}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-8">
              {/* Location Hierarchy Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                  <h3 className="text-lg font-semibold text-foreground">{dict.locationHierarchy || 'Location Hierarchy'}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Residence Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="residence" className="text-sm font-medium">{dict.residenceLabel}</Label>
                    <Select value={filters.residenceId || undefined} onValueChange={(v) => handleFilterChange('residenceId', v === '__ALL__' ? '' : v)}>
                      <SelectTrigger id="residence" className="h-11">
                        <SelectValue placeholder={dict.allAssignedResidences} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">{dict.allAssignedResidences}</SelectItem>
                        {userResidences.map(residence => {
                          if (!residence?.id) return null;
                          return (
                            <SelectItem key={residence.id} value={residence.id}>
                              {residence.name || `Residence ${residence.id}`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Building Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="building" className="text-sm font-medium">{dict.buildingLabel}</Label>
                    <Select value={filters.buildingId || undefined} onValueChange={(v) => handleFilterChange('buildingId', v === '__ALL__' ? '' : v)} disabled={!filters.residenceId}>
                      <SelectTrigger id="building" className="h-11" disabled={!filters.residenceId}>
                        <SelectValue placeholder={dict.allBuildings} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">{dict.allBuildings}</SelectItem>
                        {availableBuildings.map(building => {
                          if (!building?.id) return null;
                          return (
                            <SelectItem key={building.id} value={building.id}>
                              {building.name || `Building ${building.id}`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Floor Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="floor" className="text-sm font-medium">{dict.floorLabel}</Label>
                    <Select value={filters.floorId || undefined} onValueChange={(v) => handleFilterChange('floorId', v === '__ALL__' ? '' : v)} disabled={!filters.buildingId}>
                      <SelectTrigger id="floor" className="h-11" disabled={!filters.buildingId}>
                        <SelectValue placeholder={dict.allFloors} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">{dict.allFloors}</SelectItem>
                        {availableFloors.map(floor => {
                          if (!floor?.id) return null;
                          return (
                            <SelectItem key={floor.id} value={floor.id}>
                              {floor.name || `Floor ${floor.id}`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Room Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="room" className="text-sm font-medium">{dict.roomLabel}</Label>
                    <Select value={filters.roomId || undefined} onValueChange={(v) => handleFilterChange('roomId', v === '__ALL__' ? '' : v)} disabled={!filters.floorId}>
                      <SelectTrigger id="room" className="h-11" disabled={!filters.floorId}>
                        <SelectValue placeholder={dict.allRooms} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">{dict.allRooms}</SelectItem>
                        {availableRooms.map(room => {
                          if (!room?.id) return null;
                          return (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name || `Room ${room.id}`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Facilities Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="facility" className="text-sm font-medium">{(dict as any).facilitiesLabel || 'Facilities'}</Label>
                    <Select value={filters.facilityId || undefined} onValueChange={(v) => handleFilterChange('facilityId', v === '__ALL__' ? '' : v)} disabled={!filters.residenceId}>
                      <SelectTrigger id="facility" className="h-11" disabled={!filters.residenceId}>
                        <SelectValue placeholder={(dict as any).generalFacilitiesLabel || 'General Facilities'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">{(dict as any).generalFacilitiesLabel || 'General Facilities'}</SelectItem>
                        {availableFacilities.map((fac: any) => {
                          if (!fac?.id) return null;
                          return (
                            <SelectItem key={fac.id} value={fac.id}>
                              {fac.name || `Facility ${fac.id}`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Movement & Item Filters Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-foreground">{dict.movementAndItemFiltersLabel}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Movement Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="movementType" className="text-sm font-medium">{dict.movementTypeLabel}</Label>
                    <Select value={filters.movementType || undefined} onValueChange={(v) => handleFilterChange('movementType', v === '__ALL__' ? '' : v)}>
                      <SelectTrigger id="movementType" className="h-11">
                        <SelectValue placeholder={dict.all} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">{dict.all}</SelectItem>
                        <SelectItem value="IN">{dict.stockIn}</SelectItem>
                        <SelectItem value="OUT">{dict.stockOut}</SelectItem>
                        <SelectItem value="TRANSFER_IN">{(dict as any).transferIn}</SelectItem>
                        <SelectItem value="TRANSFER_OUT">{(dict as any).transferOut}</SelectItem>
                        <SelectItem value="ADJUSTMENT">{dict.adjustmentLabel}</SelectItem>
                        <SelectItem value="RETURN">{dict.returnLabel}</SelectItem>
                        <SelectItem value="DEPRECIATION">{dict.depreciationLabel}</SelectItem>
                        <SelectItem value="AUDIT">{dict.auditAdjustmentLabel}</SelectItem>
                        <SelectItem value="SCRAP">{dict.scrapLabel}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Item Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="itemId" className="text-sm font-medium">{dict.specificItemLabel}</Label>
                    <Select value={filters.itemId || undefined} onValueChange={(v) => handleFilterChange('itemId', v === '__ALL__' ? '' : v)}>
                      <SelectTrigger id="itemId" className="h-11">
                        <SelectValue placeholder={dict.allItems} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ALL__">{dict.allItems}</SelectItem>
        {availableItems.map((item: any) => {
                          if (!item?.id) return null;
                          return (
                            <SelectItem key={item.id} value={item.id}>
          {item?.nameAr ? `${item.nameAr} • ${item.nameEn}` : item.nameEn}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Date Range Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-foreground">{dict.dateRangeLabel}</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Quick Ranges */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      const now = new Date();
                      handleFilterChange('startDate', startOfDay(now));
                      handleFilterChange('endDate', endOfDay(now));
                    }}>{(dict as any).today || 'Today'}</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const d = subDays(new Date(), 1);
                      handleFilterChange('startDate', startOfDay(d));
                      handleFilterChange('endDate', endOfDay(d));
                    }}>{(dict as any).yesterday || 'Yesterday'}</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const now = new Date();
                      handleFilterChange('startDate', startOfWeek(now));
                      handleFilterChange('endDate', endOfWeek(now));
                    }}>{(dict as any).thisWeek || 'This Week'}</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const now = new Date();
                      const d = subWeeks(now, 1);
                      handleFilterChange('startDate', startOfWeek(d));
                      handleFilterChange('endDate', endOfWeek(d));
                    }}>{(dict as any).lastWeek || 'Last Week'}</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const now = new Date();
                      handleFilterChange('startDate', startOfMonth(now));
                      handleFilterChange('endDate', endOfMonth(now));
                    }}>{(dict as any).thisMonth || 'This Month'}</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const now = new Date();
                      const d = subMonths(now, 1);
                      handleFilterChange('startDate', startOfMonth(d));
                      handleFilterChange('endDate', endOfMonth(d));
                    }}>{(dict as any).lastMonth || 'Last Month'}</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const now = new Date();
                      handleFilterChange('startDate', startOfYear(now));
                      handleFilterChange('endDate', endOfYear(now));
                    }}>{(dict as any).thisYear || 'This Year'}</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const now = new Date();
                      const d = subYears(now, 1);
                      handleFilterChange('startDate', startOfYear(d));
                      handleFilterChange('endDate', endOfYear(d));
                    }}>{(dict as any).lastYear || 'Last Year'}</Button>
                  </div>
                  {/* Date Inputs (Glass Popovers) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm font-medium">{dict.startDate}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button id="startDate" variant="outline" className="w-full h-11 justify-between">
                            <span>{filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : 'Select date'}</span>
                            <CalendarIcon className="h-4 w-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.startDate}
                            onSelect={(date) => handleFilterChange('startDate', date ?? undefined)}
                            initialFocus
                          />
                          <div className="flex justify-end pt-2">
                            <Button variant="ghost" size="sm" onClick={() => handleFilterChange('startDate', undefined)}>
                              {'Clear'}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-medium">{dict.endDate}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button id="endDate" variant="outline" className="w-full h-11 justify-between">
                            <span>{filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : 'Select date'}</span>
                            <CalendarIcon className="h-4 w-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.endDate}
                            onSelect={(date) => handleFilterChange('endDate', date ?? undefined)}
                            initialFocus
                          />
                          <div className="flex justify-end pt-2">
                            <Button variant="ghost" size="sm" onClick={() => handleFilterChange('endDate', undefined)}>
                              {'Clear'}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                </div>
              </div>
        </CardContent>
        
        {/* Action Footer */}
        <div className="bg-muted/30 dark:bg-card px-6 py-4 border-t flex items-center justify-between rounded-b-lg">
    <div className="flex items-center gap-4">
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGenerating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 h-11 min-w-[160px] shadow-sm"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white" />
      {dict.generating}
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-5 w-5" />
      {dict.generateReport}
                </>
              )}
            </Button>
            
      {hasGenerated && filteredTransactions.length > 0 && (
              <Button variant="outline" onClick={exportToCSV} className="border-border hover:bg-accent h-11 shadow-sm">
                <Download className="mr-2 h-4 w-4" />
        {dict.exportCsvButton}
              </Button>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="text-green-600 flex items-center">
              ✓ {dict.readyToGenerate}
            </span>
          </div>
        </div>
      </Card>

      {/* Results Table */}
      {hasGenerated && !isGenerating && (
        <Card className="shadow-lg">
          <CardHeader className="bg-muted/30 dark:bg-card border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-foreground">
                {dict.reportResultsTitle} ({filteredTransactions.length} transactions)
              </CardTitle>
              <Badge variant="secondary">
                {format(new Date(), 'MMM dd, yyyy')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/50 dark:bg-card">
                      <TableRow>
                        <TableHead className="font-semibold">{dict.dateTimeLabel}</TableHead>
                        <TableHead className="font-semibold">{dict.itemLabel}</TableHead>
                        <TableHead className="font-semibold">{dict.movementTypeLabel}</TableHead>
                        <TableHead className="font-semibold text-right">{dict.quantity}</TableHead>
                        <TableHead className="font-semibold">{dict.residenceLabel}</TableHead>
                        <TableHead className="font-semibold">{dict.location}</TableHead>
                        <TableHead className="font-semibold">{dict.referenceLabel}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction, index) => (
                        <TableRow
                          key={`${transaction.id || transaction.referenceDocId || 'row'}-${transaction.residenceId || 'res'}-${transaction.date?.toMillis?.() || transaction.date?.toDate?.()?.getTime?.() || index}`}
                          className="hover:bg-muted/50 dark:hover:bg-muted/20 cursor-pointer"
                          onClick={() => openTxDetails(transaction)}
                        >
                          <TableCell className="font-mono text-sm">
                            {format(transaction.date.toDate(), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.itemNameEn || dict.itemNotFound}
                          </TableCell>
                          <TableCell>
                              <Badge className={`${getMovementTypeColor(transaction.type)} border-0 font-medium`}>
                              {getMovementTypeLabel(transaction.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.quantity}
                          </TableCell>
                          <TableCell className="font-medium text-primary">
                            {getResidenceName(transaction.residenceId)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {getLocationString(transaction) || dict.locationNotSpecified}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {transaction.referenceDocId || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
             ) : (
                <div className="p-8 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{dict.noResultsFoundTitle}</h3>
        <p className="text-muted-foreground">
        {dict.noResultsFoundMessage}
        </p>
                </div>
             )}
          </CardContent>
        </Card>
      )}
      
  {isGenerating && (
        <Card>
          <CardContent className="p-8 text-center">
              <div className="flex justify-center items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-b-transparent border-primary" />
      <p className="ml-4 text-lg font-semibold">{dict.generatingReport}</p>
              </div>
          </CardContent>
        </Card>
      )}

      {/* Details dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{dict.movementDetailsTitle}</DialogTitle>
          </DialogHeader>
          {selectedTx ? (
            <div className="text-sm text-muted-foreground space-y-1 mb-3">
              <div>
                {dict.typeLabel}: <span className="font-medium text-foreground">{selectedTx.type}</span>
              </div>
              <div>
                {dict.date}: {selectedTx.date?.toDate ? format(selectedTx.date.toDate(), 'PPP p') : ''}
              </div>
              <div>
                {dict.referenceLabel}: <span className="font-mono">{selectedTx.referenceDocId || '—'}</span>
              </div>
              <div>{dict.residenceLabel}: {getResidenceName(selectedTx.residenceId)}</div>
              {selectedTx.locationName ? <div>{dict.location}: {getLocationString(selectedTx)}</div> : null}
            </div>
          ) : null}

          {detailLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : selectedTx?.type === 'IN' && docDetails ? (
            <div className="space-y-3">
              <div className="text-sm">{dict.supplierLabel}: {docDetails.supplierName || '—'} · {dict.invoiceLabel}: {docDetails.invoiceNo || '—'}</div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{dict.itemLabel}</TableHead>
                      <TableHead className="text-right">{dict.quantity}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docDetails.items?.map((it: any, i: number) => (
                      <TableRow key={`${it.itemId}-${i}`}>
                        <TableCell>{it.itemNameEn || it.itemNameAr}</TableCell>
                        <TableCell className="text-right">{it.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
                  {canOpenDocLink(selectedTx) && (
                <div className="pt-2">
                  <Button asChild>
                    <Link href={canOpenDocLink(selectedTx)!}>{dict.openMrv}</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : selectedTx?.type === 'OUT' && docDetails ? (
            <div className="space-y-4">
              {/* Single table header; group rows by location with a section row */}
              {docDetails?.locations && Object.keys(docDetails.locations).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-2/3">{dict.itemLabel}</TableHead>
                        <TableHead className="text-right w-1/3">{dict.quantity}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(docDetails.locations).map(([locName, rows]: any, idx) => {
                        const totalForLocation = Array.isArray(rows)
                          ? rows.reduce((sum: number, r: any) => sum + (Number(r?.quantity) || 0), 0)
                          : 0;
                        return (
                          <Fragment key={`loc-${idx}`}>
                            <TableRow>
                              <TableCell colSpan={2} className="bg-muted/40 dark:bg-muted/10">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-foreground">{locName}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {dict.quantity}: <span className="font-semibold text-foreground">{totalForLocation}</span>
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                            {(rows as any[]).map((it: any, i: number) => (
                              <TableRow key={`${locName}-${it.itemId || i}`}>
                                <TableCell>{it.itemNameEn || it.itemNameAr || selectedTx.itemNameEn || '—'}</TableCell>
                                <TableCell className="text-right">{it.quantity}</TableCell>
                              </TableRow>
                            ))}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {/* Grand total across locations */}
                  <div className="flex justify-end text-sm text-muted-foreground mt-2">
                    <span className="mr-2">{dict.quantity}:</span>
                    <span className="font-semibold text-foreground">
                      {Object.values(docDetails.locations).reduce((grand: number, rows: any) => grand + (Array.isArray(rows) ? rows.reduce((s: number, r: any) => s + (Number(r?.quantity) || 0), 0) : 0), 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {dict.location}: {selectedTx.locationName || dict.locationNotSpecified}
                </div>
              )}

              {canOpenDocLink(selectedTx) && (
                <div className="pt-2">
                  <Button asChild>
                    <Link href={canOpenDocLink(selectedTx)!}>{dict.openMiv}</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : selectedTx?.type === 'ADJUSTMENT' ? (
            <div className="space-y-3">
              {reconItems.length === 0 ? (
                <div className="text-sm text-muted-foreground">{dict.noReconciliationLinesFound}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{dict.itemLabel}</TableHead>
                        <TableHead>{dict.directionLabel}</TableHead>
                        <TableHead className="text-right">{dict.quantity}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reconItems.map((it: any, i: number) => (
                        <TableRow key={`${it.id || it.itemId || 'row'}-${i}`}>
                          <TableCell>{it.itemNameEn || it.itemNameAr}</TableCell>
                          <TableCell>{it.adjustmentDirection || '—'}</TableCell>
                          <TableCell className="text-right">{it.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
      {!!selectedTx.referenceDocId && (
                <div className="pt-2">
                  <Button asChild variant="secondary">
        <Link href={`/inventory/reports/reconciliations/${selectedTx.referenceDocId}`}>{dict.openReconciliation}</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (selectedTx?.type === 'TRANSFER_IN' || selectedTx?.type === 'TRANSFER_OUT') && transferItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict.itemLabel}</TableHead>
                    <TableHead className="text-right">{dict.quantity}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferItems.map((it: any, i: number) => (
                    <TableRow key={`${it.itemId || it.id || 'row'}-${i}`}>
                      <TableCell>{it.itemNameEn || it.itemNameAr}</TableCell>
                      <TableCell className="text-right">{it.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">{dict.noAdditionalMovementDetails}</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
