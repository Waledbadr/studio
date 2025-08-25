'use client';

import { useState, useEffect, useMemo } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Trash2, Package, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { DepreciationRequest } from '@/context/inventory-context';

interface DepreciationForm extends Omit<DepreciationRequest, 'locationId' | 'locationName'> {
  buildingId: string;
  floorId: string;
  roomId: string;
}

export default function DepreciationPage() {
  const { items, depreciateItems, getStockForResidence, getAllInventoryTransactions, loading: inventoryLoading } = useInventory();
  const { residences, loading: residencesLoading } = useResidences();
  const { currentUser, loading: usersLoading } = useUsers();

  const [form, setForm] = useState<DepreciationForm>({
    itemId: '',
    residenceId: '',
    buildingId: '',
    floorId: '',
    roomId: '',
    quantity: 0,
    reason: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentDepreciations, setRecentDepreciations] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const userResidences = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return residences;
    
    const filtered = residences.filter(r => currentUser.assignedResidences.includes(r.id));
    
    return filtered;
  }, [currentUser, residences]);

  // Get available options based on current selections
  const availableBuildings = useMemo(() => {
    if (!form.residenceId) return [];
    const residence = userResidences.find(r => r.id === form.residenceId);
    return residence?.buildings || [];
  }, [userResidences, form.residenceId]);

  const availableFloors = useMemo(() => {
    if (!form.buildingId) return [];
    const building = availableBuildings.find(b => b.id === form.buildingId);
    return building?.floors || [];
  }, [availableBuildings, form.buildingId]);

  const availableRooms = useMemo(() => {
    if (!form.floorId) return [];
    const floor = availableFloors.find(f => f.id === form.floorId);
    return floor?.rooms || [];
  }, [availableFloors, form.floorId]);

  // Get current stock for selected item and residence
  const currentStock = useMemo(() => {
    if (!form.itemId || !form.residenceId) return 0;
    const item = items.find(i => i.id === form.itemId);
    if (!item) return 0;
    return getStockForResidence(item, form.residenceId);
  }, [form.itemId, form.residenceId, items, getStockForResidence]);

  // Get selected item details
  const selectedItem = useMemo(() => {
    return items.find(i => i.id === form.itemId);
  }, [form.itemId, items]);

  // Get available items for the selected residence (items with stock > 0)
  const availableItems = useMemo(() => {
    if (!form.residenceId) return [];
    
    return items.filter(item => {
      const stock = getStockForResidence(item, form.residenceId);
      return stock > 0;
    });
  }, [items, form.residenceId, getStockForResidence]);

  // Load recent depreciation history for user's residences only
  useEffect(() => {
    const loadHistory = async () => {
      if (!currentUser || userResidences.length === 0) {
        setRecentDepreciations([]);
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const transactions = await getAllInventoryTransactions();
        const userResidenceIds = userResidences.map(r => r.id);
        
        const depreciationTransactions = transactions
          .filter(t => 
            t.type === 'DEPRECIATION' && 
            userResidenceIds.includes(t.residenceId)
          )
          .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
          .slice(0, 10);
        setRecentDepreciations(depreciationTransactions);
      } catch (error) {
        console.error('Failed to load depreciation history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [getAllInventoryTransactions, currentUser, userResidences]);

  const handleFormChange = (field: keyof DepreciationForm, value: any) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // Reset dependent fields when parent changes
      if (field === 'residenceId') {
        newForm.buildingId = '';
        newForm.floorId = '';
        newForm.roomId = '';
        newForm.itemId = ''; // Reset item selection when residence changes
      } else if (field === 'buildingId') {
        newForm.floorId = '';
        newForm.roomId = '';
      } else if (field === 'floorId') {
        newForm.roomId = '';
      }
      
      return newForm;
    });
  };

  const getLocationString = () => {
    const parts = [];
    const residence = userResidences.find(r => r.id === form.residenceId);
    const building = availableBuildings.find(b => b.id === form.buildingId);
    const floor = availableFloors.find(f => f.id === form.floorId);
    const room = availableRooms.find(r => r.id === form.roomId);
    
    if (residence) parts.push(residence.name);
    if (building) parts.push(building.name);
    if (floor) parts.push(floor.name);
    if (room) parts.push(room.name);
    
    return parts.join(' > ');
  };

  const getLocationId = () => {
    if (form.roomId) return `room_${form.roomId}`;
    if (form.floorId) return `floor_${form.floorId}`;
    if (form.buildingId) return `building_${form.buildingId}`;
    return `residence_${form.residenceId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.itemId || !form.residenceId || !form.reason || form.quantity <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    if (form.quantity > currentStock) {
      alert(`Cannot depreciate ${form.quantity} items. Only ${currentStock} available in stock.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const depreciationRequest: DepreciationRequest = {
        itemId: form.itemId,
        residenceId: form.residenceId,
        locationId: getLocationId(),
        locationName: getLocationString(),
        quantity: form.quantity,
        reason: form.reason,
        notes: form.notes
      };

      await depreciateItems(depreciationRequest);
      
      // Reset form
      setForm({
        itemId: '',
        residenceId: '',
        buildingId: '',
        floorId: '',
        roomId: '',
        quantity: 0,
        reason: '',
        notes: ''
      });

      // Reload history for user's residences only
      const transactions = await getAllInventoryTransactions();
      const userResidenceIds = userResidences.map(r => r.id);
      
      const depreciationTransactions = transactions
        .filter(t => 
          t.type === 'DEPRECIATION' && 
          userResidenceIds.includes(t.residenceId)
        )
        .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
        .slice(0, 10);
      setRecentDepreciations(depreciationTransactions);

    } catch (error) {
      console.error('Depreciation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonReasons = [
    'Expired',
    'Damaged',
    'Contaminated',
    'Quality Issues',
    'Regulatory Compliance',
    'Storage Issues',
    'Manufacturing Defect',
    'End of Life Cycle',
    'Other'
  ];

  if (inventoryLoading || residencesLoading || usersLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-red-100 dark:border-red-800">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!userResidences.length) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-red-100 dark:border-red-800">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Item Depreciation</h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Depreciate items from inventory with detailed reasons and documentation
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="text-center py-10">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-xl text-gray-600 dark:text-gray-400">No residences assigned to your account.</p>
          <p className="text-gray-500 dark:text-gray-500">Please contact your administrator to assign residences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-red-100 dark:border-red-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Item Depreciation</h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Depreciate items from inventory with detailed reasons and documentation
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Depreciation Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <Trash2 className="mr-3 h-6 w-6 text-red-600" />
                Depreciate Items
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Item Selection */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Item Selection</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="residence" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Residence <span className="text-red-500">*</span>
                      </Label>
                      <Select value={form.residenceId} onValueChange={(v) => handleFormChange('residenceId', v)}>
                        <SelectTrigger id="residence">
                          <SelectValue placeholder={userResidences.length === 0 ? 'No assigned residences' : 'Select Residence'} />
                        </SelectTrigger>
                        <SelectContent>
                          {userResidences.map((residence) => (
                            <SelectItem key={residence.id} value={residence.id}>
                              {residence.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item" className="text-sm font-medium text-gray-700">
                        Item <span className="text-red-500">*</span>
                      </Label>
                      <Select value={form.itemId} onValueChange={(v) => handleFormChange('itemId', v)}>
                        <SelectTrigger id="item" disabled={!form.residenceId || availableItems.length === 0}>
                          <SelectValue placeholder={!form.residenceId ? 'Select Residence First' : availableItems.length === 0 ? 'No items with stock available' : 'Select Item'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableItems.map((item) => {
                            const stock = getStockForResidence(item, form.residenceId);
                            return (
                              <SelectItem key={item.id} value={item.id}>
                                {item.nameEn} ({item.nameAr}) - Stock: {stock}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* No Items Available Message */}
                  {form.residenceId && availableItems.length === 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <span className="font-medium text-yellow-900 dark:text-yellow-200">No items available</span>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                        There are no items with available stock in the selected residence.
                      </p>
                    </div>
                  )}

                  {/* Stock Info */}
                  {selectedItem && form.residenceId && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-blue-900 dark:text-blue-200">Current Stock</span>
                        </div>
                        <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-lg px-3 py-1">
                          {currentStock} {selectedItem.unit}
                        </Badge>
                      </div>
                      {selectedItem.lifespanDays && (
                        <div className="mt-2 flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
                          <Clock className="h-4 w-4" />
                          <span>Lifespan: {selectedItem.lifespanDays} days</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Location Selection */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Location (Optional)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="building" className="dark:text-gray-300">Building</Label>
                      <Select value={form.buildingId} onValueChange={(v) => handleFormChange('buildingId', v === '__all__' ? '' : v)}>
                        <SelectTrigger id="building" disabled={!form.residenceId}>
                          <SelectValue placeholder="All Buildings" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Buildings</SelectItem>
                          {availableBuildings
                            .filter((building) => !!building?.id)
                            .map((building) => (
                              <SelectItem key={building.id} value={building.id}>
                                {building.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="floor" className="dark:text-gray-300">Floor</Label>
                      <Select value={form.floorId} onValueChange={(v) => handleFormChange('floorId', v === '__all__' ? '' : v)}>
                        <SelectTrigger id="floor" disabled={!form.buildingId}>
                          <SelectValue placeholder="All Floors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Floors</SelectItem>
                          {availableFloors
                            .filter((floor) => !!floor?.id)
                            .map((floor) => (
                              <SelectItem key={floor.id} value={floor.id}>
                                {floor.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="room" className="dark:text-gray-300">Room</Label>
                      <Select value={form.roomId} onValueChange={(v) => handleFormChange('roomId', v === '__all__' ? '' : v)}>
                        <SelectTrigger id="room" disabled={!form.floorId}>
                          <SelectValue placeholder="All Rooms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Rooms</SelectItem>
                          {availableRooms
                            .filter((room) => !!room?.id)
                            .map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Depreciation Details */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-1 h-6 bg-yellow-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Depreciation Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quantity <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={currentStock}
                        className="h-11 focus:ring-yellow-500 focus:border-transparent"
                        value={form.quantity || ''}
                        onChange={(e) => handleFormChange('quantity', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reason <span className="text-red-500">*</span>
                      </Label>
                      <Select value={form.reason} onValueChange={(v) => handleFormChange('reason', v)}>
                        <SelectTrigger id="reason">
                          <SelectValue placeholder="Select Reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonReasons.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="dark:text-gray-300">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      className="min-h-[100px] focus:ring-yellow-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                      placeholder="Add any additional details about the depreciation..."
                      value={form.notes}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !form.itemId || !form.residenceId || !form.reason || form.quantity <= 0 || availableItems.length === 0}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-b-transparent border-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Depreciate Items
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recent Depreciation History */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                My Recent Depreciations
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              {isLoadingHistory ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentDepreciations.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                      <TableRow>
                        <TableHead className="text-xs">Item</TableHead>
                        <TableHead className="text-xs">Ref</TableHead>
                        <TableHead className="text-xs">Residence</TableHead>
                        <TableHead className="text-xs">Qty</TableHead>
                        <TableHead className="text-xs">Reason</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentDepreciations.map((transaction, index) => (
                        <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell className="font-medium text-xs p-2">
                            {transaction.itemNameEn}
                          </TableCell>
                          <TableCell className="text-[11px] p-2 font-mono text-muted-foreground">
                            {transaction.referenceDocId || '-'}
                          </TableCell>
                          <TableCell className="text-xs p-2 text-gray-600 dark:text-gray-400">
                            {userResidences.find(r => r.id === transaction.residenceId)?.name || transaction.residenceId}
                          </TableCell>
                          <TableCell className="text-xs p-2">
                            {transaction.quantity}
                          </TableCell>
                          <TableCell className="text-xs p-2">
                            <Badge className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                              {transaction.depreciationReason}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs p-2 text-gray-500 dark:text-gray-400">
                            {format(transaction.date.toDate(), 'MMM dd')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>No depreciation history found for your residences</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
