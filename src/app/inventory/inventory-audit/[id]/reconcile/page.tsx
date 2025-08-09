'use client';

import { useState, useEffect, useMemo } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Save, CheckCircle, AlertTriangle, Eye, Edit, Package, Plus, Minus, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface ReconciliationItem {
  id: string;
  itemId: string;
  itemName: string;
  itemNameAr: string;
  category: string;
  unit: string;
  systemStock: number;
  physicalStock: number | null;
  variance: number;
  variancePercentage: number;
  status: 'PENDING' | 'COUNTED' | 'REVIEWED' | 'ADJUSTED';
  adjustmentReason: string;
  notes: string;
  locationId: string;
  locationName: string;
  lastCountedBy?: string;
  lastCountedAt?: Date;
  costPerUnit: number;
  totalCostVariance: number;
}

interface ReconciliationSession {
  id: string;
  name: string;
  residenceId: string;
  residenceName: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_APPROVAL';
  startDate: Date;
  currentLocation: string;
  totalItems: number;
  completedItems: number;
  itemsWithVariance: number;
  totalCostVariance: number;
  items: ReconciliationItem[];
}

export default function StockReconciliationPage() {
  const params = useParams();
  const router = useRouter();
  const { items } = useInventory();
  const { residences } = useResidences();

  const reconciliationId = params.id as string;
  
  const [session, setSession] = useState<ReconciliationSession | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [physicalCount, setPhysicalCount] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [countNotes, setCountNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'pending' | 'variances' | 'adjusted'>('pending');

  // Mock reconciliation session data
  useEffect(() => {
    const mockSession: ReconciliationSession = {
      id: reconciliationId,
      name: 'February 2025 Stock Reconciliation',
      residenceId: 'res-1',
      residenceName: 'Building A',
      status: 'IN_PROGRESS',
      startDate: new Date(),
      currentLocation: 'Floor 1 - Room 101',
      totalItems: 25,
      completedItems: 15,
      itemsWithVariance: 8,
      totalCostVariance: -2450.75,
      items: [
        {
          id: '1',
          itemId: 'item-1',
          itemName: 'Office Chair',
          itemNameAr: 'كرسي مكتب',
          category: 'Furniture',
          unit: 'piece',
          systemStock: 10,
          physicalStock: 8,
          variance: -2,
          variancePercentage: -20,
          status: 'REVIEWED',
          adjustmentReason: '',
          notes: '2 chairs found damaged',
          locationId: 'room-101',
          locationName: 'Room 101',
          lastCountedBy: 'Ahmed Mohamed',
          lastCountedAt: new Date(),
          costPerUnit: 450.50,
          totalCostVariance: -901.00
        },
        {
          id: '2',
          itemId: 'item-2',
          itemName: 'Desk',
          itemNameAr: 'مكتب',
          category: 'Furniture',
          unit: 'piece',
          systemStock: 5,
          physicalStock: 5,
          variance: 0,
          variancePercentage: 0,
          status: 'REVIEWED',
          adjustmentReason: '',
          notes: '',
          locationId: 'room-101',
          locationName: 'Room 101',
          lastCountedBy: 'Ahmed Mohamed',
          lastCountedAt: new Date(),
          costPerUnit: 1200.00,
          totalCostVariance: 0
        },
        {
          id: '3',
          itemId: 'item-3',
          itemName: 'Computer',
          itemNameAr: 'حاسوب',
          category: 'Electronics',
          unit: 'piece',
          systemStock: 8,
          physicalStock: null,
          variance: 0,
          variancePercentage: 0,
          status: 'PENDING',
          adjustmentReason: '',
          notes: '',
          locationId: 'room-102',
          locationName: 'Room 102',
          costPerUnit: 3500.00,
          totalCostVariance: 0
        }
      ]
    };

    setSession(mockSession);
  }, [reconciliationId]);

  // Filter items based on view mode
  const filteredItems = useMemo(() => {
    if (!session) return [];
    
    switch (viewMode) {
      case 'pending':
        return session.items.filter(item => item.status === 'PENDING');
      case 'variances':
        return session.items.filter(item => item.variance !== 0);
      case 'adjusted':
        return session.items.filter(item => item.status === 'ADJUSTED');
      default:
        return session.items;
    }
  }, [session, viewMode]);

  // Get unique locations
  const locations = useMemo(() => {
    if (!session) return [];
    const uniqueLocations = [...new Set(session.items.map(item => item.locationName))];
    return uniqueLocations;
  }, [session]);

  const handleItemSelect = (item: ReconciliationItem) => {
    setSelectedItem(item);
    setPhysicalCount(item.physicalStock?.toString() || '');
    setAdjustmentReason(item.adjustmentReason || '');
    setCountNotes(item.notes || '');
    setIsEditing(true);
  };

  const handleSaveCount = () => {
    if (!selectedItem || !session) return;

    const physicalStockValue = parseInt(physicalCount) || 0;
    const variance = physicalStockValue - selectedItem.systemStock;
    const variancePercentage = selectedItem.systemStock > 0 
      ? Math.round((variance / selectedItem.systemStock) * 100) 
      : 0;
    const itemCostVariance = variance * selectedItem.costPerUnit;
    
    const updatedItems = session.items.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          physicalStock: physicalStockValue,
          variance,
          variancePercentage,
          totalCostVariance: itemCostVariance,
          status: variance === 0 ? 'REVIEWED' : 'REVIEWED' as const,
          adjustmentReason,
          notes: countNotes,
          lastCountedBy: 'Current User',
          lastCountedAt: new Date()
        };
      }
      return item;
    });

    const completedItems = updatedItems.filter(item => item.status !== 'PENDING').length;
    const itemsWithVariance = updatedItems.filter(item => item.variance !== 0).length;
    const sessionCostVariance = updatedItems.reduce((sum, item) => sum + item.totalCostVariance, 0);

    setSession(prev => prev ? {
      ...prev,
      items: updatedItems,
      completedItems,
      itemsWithVariance,
      totalCostVariance: sessionCostVariance
    } : null);

    setIsEditing(false);
    setSelectedItem(null);
    setPhysicalCount('');
    setAdjustmentReason('');
    setCountNotes('');
  };

  const handleAdjustStock = async (item: ReconciliationItem) => {
    if (item.variance === 0) return;

    // Here you would call the inventory context to adjust the stock
    console.log('Adjusting stock for item:', item.itemName, 'by', item.variance);

    const updatedItems = session!.items.map(i => 
      i.id === item.id ? { ...i, status: 'ADJUSTED' as const } : i
    );

    setSession(prev => prev ? { ...prev, items: updatedItems } : null);
  };

  const handleCompleteReconciliation = async () => {
    if (!session) return;

    const pendingItems = session.items.filter(item => item.status === 'PENDING');
    
    if (pendingItems.length > 0) {
      alert(`There are ${pendingItems.length} items that have not been counted yet`);
      return;
    }

    // Navigate to review page
    router.push(`/inventory/inventory-audit/${reconciliationId}/review`);
  };

  const getStatusBadge = (status: ReconciliationItem['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Pending Count</Badge>;
      case 'COUNTED':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Counted</Badge>;
      case 'REVIEWED':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Reviewed</Badge>;
      case 'ADJUSTED':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Adjusted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVarianceBadge = (variance: number, percentage: number) => {
    if (variance === 0) {
      return <Badge className="bg-green-100 text-green-800">Balanced</Badge>;
    } else if (variance > 0) {
      return <Badge className="bg-blue-100 text-blue-800">+{variance} (+{percentage}%)</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">{variance} ({percentage}%)</Badge>;
    }
  };

  if (!session) {
    return <div className="p-6">Loading...</div>;
  }

  const progress = (session.completedItems / session.totalItems) * 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventory/inventory-audit">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reconciliations
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{session.name}</h1>
          <p className="text-gray-600 dark:text-gray-300">{session.residenceName}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleCompleteReconciliation}
            className="bg-green-600 hover:bg-green-700"
            disabled={session.completedItems < session.totalItems}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Reconciliation
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(progress)}%</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Items Reviewed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {session.completedItems} / {session.totalItems}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Variances Found</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{session.itemsWithVariance}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cost Variance</p>
                <p className={`text-2xl font-bold ${session.totalCostVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${session.totalCostVariance.toFixed(2)}
                </p>
              </div>
              <RotateCcw className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'pending', label: 'Pending Count', count: session.items.filter(i => i.status === 'PENDING').length },
          { key: 'variances', label: 'Variances', count: session.itemsWithVariance },
          { key: 'adjusted', label: 'Adjusted', count: session.items.filter(i => i.status === 'ADJUSTED').length },
          { key: 'all', label: 'All Items', count: session.totalItems }
        ].map(tab => (
          <Button
            key={tab.key}
            variant={viewMode === tab.key ? 'default' : 'outline'}
            onClick={() => setViewMode(tab.key as any)}
            className="flex items-center gap-2"
          >
            {tab.label}
            <Badge variant="secondary" className="text-xs">
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Stock Count & Reconciliation</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>System Stock</TableHead>
                    <TableHead>Physical Count</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-sm text-gray-500">{item.category} • {item.locationName}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.systemStock} {item.unit}
                      </TableCell>
                      <TableCell>
                        {item.physicalStock !== null ? (
                          <span className="font-medium">{item.physicalStock} {item.unit}</span>
                        ) : (
                          <span className="text-gray-500">Not counted</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.physicalStock !== null ? (
                          getVarianceBadge(item.variance, item.variancePercentage)
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleItemSelect(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {item.variance !== 0 && item.status === 'REVIEWED' && (
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={() => handleAdjustStock(item)}
                            >
                              Adjust
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Count Entry Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedItem ? 'Update Count' : 'Select Item to Count'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItem ? (
                <>
                  <div className="space-y-2">
                    <Label className="font-medium">{selectedItem.itemName}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedItem.category} • {selectedItem.locationName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>System Stock</Label>
                      <p className="font-medium">{selectedItem.systemStock} {selectedItem.unit}</p>
                    </div>
                    <div>
                      <Label>Unit Cost</Label>
                      <p className="font-medium">${selectedItem.costPerUnit}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="physicalCount">Physical Count *</Label>
                    <Input
                      id="physicalCount"
                      type="number"
                      min="0"
                      value={physicalCount}
                      onChange={(e) => setPhysicalCount(e.target.value)}
                      placeholder="Enter actual count"
                    />
                  </div>

                  {parseInt(physicalCount) !== selectedItem.systemStock && physicalCount && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Variance detected: {parseInt(physicalCount) - selectedItem.systemStock} units
                        ({Math.round(((parseInt(physicalCount) - selectedItem.systemStock) / selectedItem.systemStock) * 100)}%)
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="adjustmentReason">Adjustment Reason</Label>
                    <Input
                      id="adjustmentReason"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      placeholder="e.g., Damaged, Lost, Misplaced"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={countNotes}
                      onChange={(e) => setCountNotes(e.target.value)}
                      placeholder="Additional notes about this count..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveCount}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={!physicalCount}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Count
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedItem(null);
                        setPhysicalCount('');
                        setAdjustmentReason('');
                        setCountNotes('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Select an item from the table to start counting
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
