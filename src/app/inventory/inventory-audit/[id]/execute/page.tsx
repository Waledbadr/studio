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
import { ArrowLeft, Save, CheckCircle, AlertTriangle, Eye, Edit, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface AuditItem {
  id: string;
  itemId: string;
  itemName: string;
  itemNameAr: string;
  category: string;
  unit: string;
  systemStock: number;
  physicalStock: number | null;
  difference: number;
  status: 'PENDING' | 'COUNTED' | 'VERIFIED' | 'DISCREPANCY';
  notes: string;
  locationId: string;
  locationName: string;
  lastCountedBy?: string;
  lastCountedAt?: Date;
}

interface AuditSession {
  id: string;
  name: string;
  residenceId: string;
  residenceName: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  startDate: Date;
  currentLocation: string;
  totalItems: number;
  completedItems: number;
  discrepancies: number;
  items: AuditItem[];
}

export default function StockReconciliationExecutePage() {
  const params = useParams();
  const router = useRouter();
  const { items } = useInventory();
  const { residences } = useResidences();

  const reconciliationId = params.id as string;
  
  const [reconciliationSession, setReconciliationSession] = useState<AuditSession | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<AuditItem | null>(null);
  const [physicalCount, setPhysicalCount] = useState<string>('');
  const [countNotes, setCountNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'pending' | 'discrepancies'>('pending');

  // Mock reconciliation session data
  useEffect(() => {
    const mockReconciliationSession: AuditSession = {
      id: reconciliationId,
      name: 'February 2025 Stock Reconciliation',
      residenceId: 'res-1',
      residenceName: 'Building A',
      status: 'IN_PROGRESS',
      startDate: new Date(),
      currentLocation: 'Floor 1 - Room 101',
      totalItems: 25,
      completedItems: 10,
      discrepancies: 2,
      items: [
        {
          id: '1',
          itemId: 'item-1',
          itemName: 'Office Chair',
          itemNameAr: 'كرسي مكتب',
          category: 'Furniture',
          unit: 'piece',
          systemStock: 5,
          physicalStock: 4,
          difference: -1,
          status: 'DISCREPANCY',
          notes: 'One chair found damaged',
          locationId: 'room-101',
          locationName: 'Room 101',
          lastCountedBy: 'Ahmed Mohamed',
          lastCountedAt: new Date()
        },
        {
          id: '2',
          itemId: 'item-2',
          itemName: 'Desk',
          itemNameAr: 'مكتب',
          category: 'Furniture',
          unit: 'piece',
          systemStock: 3,
          physicalStock: 3,
          difference: 0,
          status: 'VERIFIED',
          notes: '',
          locationId: 'room-101',
          locationName: 'Room 101',
          lastCountedBy: 'Ahmed Mohamed',
          lastCountedAt: new Date()
        },
        {
          id: '3',
          itemId: 'item-3',
          itemName: 'Computer',
          itemNameAr: 'حاسوب',
          category: 'Electronics',
          unit: 'piece',
          systemStock: 2,
          physicalStock: null,
          difference: 0,
          status: 'PENDING',
          notes: '',
          locationId: 'room-102',
          locationName: 'Room 102'
        }
      ]
    };

    setReconciliationSession(mockReconciliationSession);
  }, [reconciliationId]);

  // Filter items based on view mode
  const filteredItems = useMemo(() => {
    if (!reconciliationSession) return [];
    
    switch (viewMode) {
      case 'pending':
        return reconciliationSession.items.filter(item => item.status === 'PENDING');
      case 'discrepancies':
        return reconciliationSession.items.filter(item => item.status === 'DISCREPANCY');
      default:
        return reconciliationSession.items;
    }
  }, [reconciliationSession, viewMode]);

  // Get unique locations
  const locations = useMemo(() => {
    if (!reconciliationSession) return [];
    const uniqueLocations = [...new Set(reconciliationSession.items.map(item => item.locationName))];
    return uniqueLocations;
  }, [reconciliationSession]);

  const handleItemSelect = (item: AuditItem) => {
    setSelectedItem(item);
    setPhysicalCount(item.physicalStock?.toString() || '');
    setCountNotes(item.notes || '');
    setIsEditing(true);
  };

  const handleSaveCount = () => {
    if (!selectedItem || !reconciliationSession) return;

    const physicalStockValue = parseInt(physicalCount) || 0;
    const difference = physicalStockValue - selectedItem.systemStock;
    
    const updatedItems = reconciliationSession.items.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          physicalStock: physicalStockValue,
          difference,
          status: difference === 0 ? 'VERIFIED' as const : 'DISCREPANCY' as const,
          notes: countNotes,
          lastCountedBy: 'Current User',
          lastCountedAt: new Date()
        };
      }
      return item;
    });

    setReconciliationSession(prev => prev ? {
      ...prev,
      items: updatedItems,
      completedItems: updatedItems.filter(item => item.status !== 'PENDING').length,
      discrepancies: updatedItems.filter(item => item.status === 'DISCREPANCY').length
    } : null);

    setIsEditing(false);
    setSelectedItem(null);
    setPhysicalCount('');
    setCountNotes('');
  };

  const handleCompleteReconciliation = async () => {
    if (!reconciliationSession) return;

    // Check if all items are counted
    const pendingItems = reconciliationSession.items.filter(item => item.status === 'PENDING');
    
    if (pendingItems.length > 0) {
      alert(`There are ${pendingItems.length} items that have not been reconciled yet`);
      return;
    }

    // Navigate to review page
    router.push(`/inventory/inventory-audit/${reconciliationId}/review`);
  };

  const getStatusBadge = (status: AuditItem['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Pending</Badge>;
      case 'COUNTED':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Counted</Badge>;
      case 'VERIFIED':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Verified</Badge>;
      case 'DISCREPANCY':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Discrepancy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!reconciliationSession) {
    return <div className="p-6">Loading...</div>;
  }

  const progress = (reconciliationSession.completedItems / reconciliationSession.totalItems) * 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventory/inventory-audit">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{reconciliationSession.name}</h1>
          <p className="text-gray-600 dark:text-gray-300">{reconciliationSession.residenceName}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleCompleteReconciliation}
            className="bg-green-600 hover:bg-green-700"
            disabled={reconciliationSession.completedItems < reconciliationSession.totalItems}
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Overall Progress</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Reconciled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {reconciliationSession.completedItems} / {reconciliationSession.totalItems}
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Variances</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{reconciliationSession.discrepancies}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Locations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{locations.length}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('all')}
            >
              All Items ({reconciliationSession.items.length})
            </Button>
            <Button
              variant={viewMode === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('pending')}
            >
              Pending ({reconciliationSession.items.filter(i => i.status === 'PENDING').length})
            </Button>
            <Button
              variant={viewMode === 'discrepancies' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('discrepancies')}
            >
              Variances ({reconciliationSession.discrepancies})
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>System Stock</TableHead>
                      <TableHead>Physical Stock</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-sm text-gray-500">{item.category}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.locationName}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.systemStock} {item.unit}
                        </TableCell>
                        <TableCell>
                          {item.physicalStock !== null ? (
                            <span className="font-medium">
                              {item.physicalStock} {item.unit}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.physicalStock !== null ? (
                            <span className={`font-medium ${
                              item.difference === 0 ? 'text-green-600' : 
                              item.difference > 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {item.difference > 0 ? '+' : ''}{item.difference}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleItemSelect(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Count Entry Panel */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Count Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItem ? (
                <>
                  <div className="space-y-2">
                    <Label>Selected Item</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium">{selectedItem.itemName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{selectedItem.locationName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        System Stock: {selectedItem.systemStock} {selectedItem.unit}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="physicalCount">
                      Physical Stock <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="physicalCount"
                      type="number"
                      min="0"
                      value={physicalCount}
                      onChange={(e) => setPhysicalCount(e.target.value)}
                      placeholder="Enter actual count"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={countNotes}
                      onChange={(e) => setCountNotes(e.target.value)}
                      placeholder="Any notes about this item..."
                      rows={3}
                    />
                  </div>

                  {physicalCount && parseInt(physicalCount) !== selectedItem.systemStock && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Variance detected: {parseInt(physicalCount) - selectedItem.systemStock > 0 ? '+' : ''}
                        {parseInt(physicalCount) - selectedItem.systemStock} {selectedItem.unit}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleSaveCount} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedItem(null);
                        setPhysicalCount('');
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
                  <p className="text-gray-600 dark:text-gray-300">Select an item from the list to start counting</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
