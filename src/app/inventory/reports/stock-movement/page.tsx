'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
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
  const { currentUser } = useUsers();

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
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsFetchingInitial(true);
      const transactions = await getAllInventoryTransactions();
      setAllTransactions(transactions);
      setIsFetchingInitial(false);
    };
    fetchAllData();
  }, [getAllInventoryTransactions]);

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

  const availableItems = useMemo(() => {
    return items || [];
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
        
        // Location filtering (only if a specific residence is selected)
        if (filters.residenceId) {
            const roomName = filters.roomId ? availableRooms.find(r => r.id === filters.roomId)?.name : '';
            const floorName = filters.floorId ? availableFloors.find(f => f.id === filters.floorId)?.name : '';
            const buildingName = filters.buildingId ? availableBuildings.find(b => b.id === filters.buildingId)?.name : '';
            
            // These filters should only apply if a value is selected
            if (roomName && !transaction.locationName?.includes(roomName)) keep = false;
            else if (floorName && !roomName && !transaction.locationName?.includes(floorName)) keep = false;
            else if (buildingName && !floorName && !roomName && !transaction.locationName?.includes(buildingName)) keep = false;
        }
        
        return keep;
    });

    setFilteredTransactions(filtered);
    setIsGenerating(false);
    setHasGenerated(true);

  }, [filters, allTransactions, userResidences, availableRooms, availableFloors, availableBuildings]);


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
      case 'IN': return 'Stock In';
      case 'OUT': return 'Stock Out';
      case 'TRANSFER_IN': return 'Transfer In';
      case 'TRANSFER_OUT': return 'Transfer Out';
      case 'ADJUSTMENT': return 'Adjustment';
      case 'RETURN': return 'Return';
      case 'DEPRECIATION': return 'Depreciation';
      case 'AUDIT': return 'Audit Adjustment';
      case 'SCRAP': return 'Scrap';
      default: return type;
    }
  };

  const getLocationString = (transaction: any) => {
    return transaction.locationName || 'Location not specified';
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
        <CardHeader className="bg-muted/30 dark:bg-card border-b">
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Residence Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="residence" className="text-sm font-medium">
                      Residence
                    </Label>
                    <select 
                      id="residence"
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={filters.residenceId} 
                      onChange={(e) => handleFilterChange('residenceId', e.target.value)}
                    >
                      <option value="">All Assigned Residences</option>
                      {userResidences.map(residence => {
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
                      <option value="IN">Stock In</option>
                      <option value="OUT">Stock Out</option>
                      <option value="TRANSFER_IN">Transfer In</option>
                      <option value="TRANSFER_OUT">Transfer Out</option>
                      <option value="ADJUSTMENT">Adjustment</option>
                      <option value="RETURN">Return</option>
                      <option value="DEPRECIATION">Depreciation</option>
                      <option value="AUDIT">Audit Adjustment</option>
                      <option value="SCRAP">Scrap</option>
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
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Generate Report
                </>
              )}
            </Button>
            
            {hasGenerated && filteredTransactions.length > 0 && (
              <Button variant="outline" onClick={exportToCSV} className="border-border hover:bg-accent h-11 shadow-sm">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="text-green-600 flex items-center">
              ✓ Ready to generate report
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
                Report Results ({filteredTransactions.length} transactions)
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
                        <TableRow key={index} className="hover:bg-muted/50 dark:hover:bg-muted/20">
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
             ) : (
                <div className="p-8 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                    <p className="text-muted-foreground">
                    No transactions were found matching the specified criteria. Try adjusting the filters.
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
                  <p className="ml-4 text-lg font-semibold">Generating Report...</p>
              </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
