'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, TrendingUp, Download, Search } from 'lucide-react';
import { format } from 'date-fns';

interface StockMovementFilters {
  residenceId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  movementType: string;
  itemId: string;
  startDate?: Date;
  endDate?: Date;
}

export default function StockMovementReportPage() {
  const { getAllInventoryTransactions, items } = useInventory();
  const { residences } = useResidences();

  const [filters, setFilters] = useState<StockMovementFilters>({
    residenceId: '',
    buildingId: '',
    floorId: '',
    roomId: '',
    movementType: '',
    itemId: '',
    startDate: undefined,
    endDate: undefined
  });

  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all transactions once
  useEffect(() => {
    const fetchAll = async () => {
        setIsGenerating(true);
        try {
            const all = await getAllInventoryTransactions();
            setAllTransactions(all);
        } catch(e) {
            setError('Failed to load transaction data.');
        } finally {
            setIsGenerating(false);
        }
    }
    fetchAll();
  }, [getAllInventoryTransactions]);


  // Handle filter changes
  const handleFilterChange = (key: keyof StockMovementFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset dependent filters when parent changes
      if (key === 'residenceId') {
        newFilters.buildingId = '';
        newFilters.floorId = '';
        newFilters.roomId = '';
      } else if (key === 'buildingId') {
        newFilters.floorId = '';
        newFilters.roomId = '';
      } else if (key === 'floorId') {
        newFilters.roomId = '';
      }
      
      return newFilters;
    });
  };

  // Get available options based on current filters
  const availableBuildings = useMemo(() => {
    if (!filters.residenceId) return [];
    const residence = residences.find(r => r.id === filters.residenceId);
    return residence?.buildings || [];
  }, [residences, filters.residenceId]);

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

  const availableItems = useMemo(() => {
    return items || [];
  }, [items]);

  // Generate report
  const handleGenerateReport = useCallback(async () => {
    if (!filters.residenceId) {
      setError('Please select a residence');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    // Client-side filtering
    const filtered = allTransactions.filter(transaction => {
        let keep = true;

        if (filters.residenceId && transaction.residenceId !== filters.residenceId) keep = false;
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
        
        // Note: Building/Floor/Room filtering would require more data on the transaction object
        // This is a limitation of the current data model. We can filter by locationName if available.
        if (filters.roomId) {
            if (!transaction.locationName?.includes(availableRooms.find(r => r.id === filters.roomId)?.name || '')) keep = false;
        } else if (filters.floorId) {
             if (!transaction.locationName?.includes(availableFloors.find(f => f.id === filters.floorId)?.name || '')) keep = false;
        } else if (filters.buildingId) {
             if (!transaction.locationName?.includes(availableBuildings.find(b => b.id === filters.buildingId)?.name || '')) keep = false;
        }
        
        return keep;
    });

    setFilteredTransactions(filtered);
    setIsGenerating(false);

  }, [filters, allTransactions, availableRooms, availableFloors, availableBuildings]);


  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Item', 'Movement Type', 'Quantity', 'Location', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(transaction => [
        format(transaction.date.toDate(), 'yyyy-MM-dd HH:mm'),
        `"${transaction.itemNameEn || 'Unknown Item'}"`,
        getMovementTypeLabel(transaction.type),
        transaction.quantity,
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
      case 'RECEIVE': return 'Receive';
      case 'ISSUE': return 'Issue';
      case 'TRANSFER_IN': return 'Transfer In';
      case 'TRANSFER_OUT': return 'Transfer Out';
      case 'ADJUSTMENT': return 'Adjustment';
      case 'RETURN': return 'Return';
      case 'IN': return 'Stock In';
      case 'OUT': return 'Stock Out';
      case 'DEPRECIATION': return 'Depreciation';
      case 'AUDIT': return 'Audit Adjustment';
      default: return type;
    }
  };

  const getLocationString = (transaction: any) => {
    return transaction.locationName || 'Location not specified';
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'RECEIVE':
      case 'TRANSFER_IN':
      case 'IN':
      case 'RETURN':
        return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20';
      case 'ISSUE':
      case 'TRANSFER_OUT':
      case 'OUT':
      case 'DEPRECIATION':
        return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20';
      case 'ADJUSTMENT':
      case 'AUDIT':
        return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700';
    }
  };

  if (!residences.length && !isGenerating) {
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Stock Movement Report</h1>
            <p className="text-muted-foreground text-lg">
              Comprehensive analysis of inventory movements with advanced filtering capabilities
            </p>
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
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-foreground flex items-center">
              <Filter className="mr-3 h-6 w-6 text-primary" />
              Report Filters
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-8">
              {/* Location Hierarchy Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                  <h3 className="text-lg font-semibold text-foreground">Location Hierarchy</h3>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">Required</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Residence Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="residence" className="text-sm font-medium">
                      Residence <span className="text-red-500">*</span>
                    </Label>
                    <select 
                      id="residence"
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={filters.residenceId} 
                      onChange={(e) => handleFilterChange('residenceId', e.target.value)}
                    >
                      <option value="">Select Residence</option>
                      {residences.map(residence => {
                        if (!residence?.id) return null;
                        return (
                          <option key={residence.id} value={residence.id}>
                            {residence.name || `Residence ${residence.id}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Building Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="building" className="text-sm font-medium">Building</Label>
                    <select
                      id="building"
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted/50 disabled:text-muted-foreground"
                      value={filters.buildingId} 
                      onChange={(e) => handleFilterChange('buildingId', e.target.value)}
                      disabled={!filters.residenceId}
                    >
                      <option value="">All Buildings</option>
                      {availableBuildings.map(building => {
                        if (!building?.id) return null;
                        return (
                          <option key={building.id} value={building.id}>
                            {building.name || `Building ${building.id}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Floor Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="floor" className="text-sm font-medium">Floor</Label>
                    <select
                      id="floor"
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted/50 disabled:text-muted-foreground"
                      value={filters.floorId} 
                      onChange={(e) => handleFilterChange('floorId', e.target.value)}
                      disabled={!filters.buildingId}
                    >
                      <option value="">All Floors</option>
                      {availableFloors.map(floor => {
                        if (!floor?.id) return null;
                        return (
                          <option key={floor.id} value={floor.id}>
                            {floor.name || `Floor ${floor.id}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Room Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="room" className="text-sm font-medium">Room</Label>
                    <select
                      id="room"
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted/50 disabled:text-muted-foreground"
                      value={filters.roomId} 
                      onChange={(e) => handleFilterChange('roomId', e.target.value)}
                      disabled={!filters.floorId}
                    >
                      <option value="">All Rooms</option>
                      {availableRooms.map(room => {
                        if (!room?.id) return null;
                        return (
                          <option key={room.id} value={room.id}>
                            {room.name || `Room ${room.id}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Movement & Item Filters Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-foreground">Movement & Item Filters</h3>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">Optional</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Movement Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="movementType" className="text-sm font-medium">Movement Type</Label>
                    <select
                      id="movementType"
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={filters.movementType} 
                      onChange={(e) => handleFilterChange('movementType', e.target.value)}
                    >
                      <option value="">All Movement Types</option>
                      <option value="RECEIVE">Receive</option>
                      <option value="ISSUE">Issue</option>
                      <option value="TRANSFER_IN">Transfer In</option>
                      <option value="TRANSFER_OUT">Transfer Out</option>
                      <option value="ADJUSTMENT">Adjustment</option>
                      <option value="RETURN">Return</option>
                      <option value="IN">Stock In</option>
                      <option value="OUT">Stock Out</option>
                      <option value="DEPRECIATION">Depreciation</option>
                      <option value="AUDIT">Audit Adjustment</option>
                    </select>
                  </div>

                  {/* Item Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="itemId" className="text-sm font-medium">Specific Item</Label>
                    <select
                      id="itemId"
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={filters.itemId} 
                      onChange={(e) => handleFilterChange('itemId', e.target.value)}
                    >
                      <option value="">All Items</option>
                      {availableItems.map((item: any) => {
                        if (!item?.id) return null;
                        return (
                          <option key={item.id} value={item.id}>
                            {item.nameEn}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Date Range Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-foreground">Date Range</h3>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">Optional</span>
                </div>
                
                <div className="space-y-4">
                  {/* Date Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                      <input
                        id="startDate"
                        type="date"
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                      <input
                        id="endDate"
                        type="date"
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                  
                </div>
              </div>
        </CardContent>
        
        {/* Action Footer */}
        <div className="bg-muted/30 px-6 py-4 border-t flex items-center justify-between rounded-b-lg">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGenerating || !filters.residenceId}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 h-11 min-w-[160px] shadow-sm"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Generate Report
                </>
              )}
            </Button>
            
            {filteredTransactions.length > 0 && (
              <Button variant="outline" onClick={exportToCSV} className="border-border hover:bg-accent h-11 shadow-sm">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {!filters.residenceId ? (
              <>
                <span className="text-red-500 text-lg">*</span>
                <span>Please select a residence to proceed</span>
              </>
            ) : (
              <span className="text-green-600 flex items-center">
                ✓ Ready to generate report
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {filteredTransactions.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-foreground">
                Report Results ({filteredTransactions.length} transactions)
              </CardTitle>
              <Badge variant="secondary">
                {format(new Date(), 'MMM dd, yyyy')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">Item</TableHead>
                    <TableHead className="font-semibold">Movement Type</TableHead>
                    <TableHead className="font-semibold text-right">Quantity</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {format(transaction.date.toDate(), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.itemNameEn || 'Unknown Item'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getMovementTypeColor(transaction.type)} border-0 font-medium`}>
                          {getMovementTypeLabel(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {transaction.quantity}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getLocationString(transaction)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {transaction.referenceDocId || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!isGenerating && filteredTransactions.length === 0 && filters.residenceId && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              No transactions were found matching the specified criteria. Try adjusting the filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
