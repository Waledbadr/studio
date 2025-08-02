'use client';

import { useState, useEffect, useMemo } from 'react';
import { useInventory } from '@/context/inventory-context';
import { useResidences } from '@/context/residences-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText, Package, MapPin, Users, Calendar, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuditScope {
  residenceId: string;
  locations: string[];
  categories: string[];
  includeAllItems: boolean;
  specificItems: string[];
}

interface AuditSettings {
  name: string;
  description: string;
  scope: AuditScope;
  assignedUsers: string[];
  scheduledDate: Date;
  estimatedDuration: number; // in days
}

export default function NewInventoryAuditPage() {
  const { items, categories, loading } = useInventory();
  const { residences, buildings, floors, rooms } = useResidences();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [auditSettings, setAuditSettings] = useState<AuditSettings>({
    name: '',
    description: '',
    scope: {
      residenceId: '',
      locations: [],
      categories: [],
      includeAllItems: true,
      specificItems: []
    },
    assignedUsers: [],
    scheduledDate: new Date(),
    estimatedDuration: 1
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get available buildings based on selected residence
  const availableBuildings = useMemo(() => {
    if (!auditSettings.scope.residenceId) return [];
    const residence = residences.find(r => r.id === auditSettings.scope.residenceId);
    return residence?.buildings || [];
  }, [residences, auditSettings.scope.residenceId]);

  // Get items for selected residence
  const residenceItems = useMemo(() => {
    if (!auditSettings.scope.residenceId) return [];
    return items.filter(item => 
      item.stockByResidence && 
      item.stockByResidence[auditSettings.scope.residenceId] > 0
    );
  }, [items, auditSettings.scope.residenceId]);

  // Get filtered items based on selected categories
  const filteredItems = useMemo(() => {
    if (auditSettings.scope.categories.length === 0) return residenceItems;
    return residenceItems.filter(item => 
      auditSettings.scope.categories.includes(item.category)
    );
  }, [residenceItems, auditSettings.scope.categories]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!auditSettings.name.trim()) {
          newErrors.name = 'Reconciliation name is required';
        }
        if (!auditSettings.scope.residenceId) {
          newErrors.residence = 'Building must be selected';
        }
        break;
      case 2:
        if (auditSettings.scope.locations.length === 0) {
          newErrors.locations = 'At least one location must be selected';
        }
        break;
      case 3:
        if (!auditSettings.scope.includeAllItems && auditSettings.scope.specificItems.length === 0) {
          newErrors.items = 'Items must be selected for reconciliation';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleLocationToggle = (locationId: string, locationName: string) => {
    const locationKey = `${locationId}:${locationName}`;
    setAuditSettings(prev => ({
      ...prev,
      scope: {
        ...prev.scope,
        locations: prev.scope.locations.includes(locationKey)
          ? prev.scope.locations.filter(l => l !== locationKey)
          : [...prev.scope.locations, locationKey]
      }
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setAuditSettings(prev => ({
      ...prev,
      scope: {
        ...prev.scope,
        categories: prev.scope.categories.includes(category)
          ? prev.scope.categories.filter(c => c !== category)
          : [...prev.scope.categories, category]
      }
    }));
  };

  const handleItemToggle = (itemId: string) => {
    setAuditSettings(prev => ({
      ...prev,
      scope: {
        ...prev.scope,
        specificItems: prev.scope.specificItems.includes(itemId)
          ? prev.scope.specificItems.filter(i => i !== itemId)
          : [...prev.scope.specificItems, itemId]
      }
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      // Here you would save the audit to Firestore
      console.log('Creating audit with settings:', auditSettings);
      
      // Mock audit creation
      const auditId = `audit-${Date.now()}`;
      
      // Redirect to the audit execution page
      router.push(`/inventory/inventory-audit/${auditId}/execute`);
    } catch (error) {
      console.error('Error creating audit:', error);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Information', icon: FileText },
    { number: 2, title: 'Select Locations', icon: MapPin },
    { number: 3, title: 'Choose Items for Review', icon: Package },
    { number: 4, title: 'Final Settings', icon: Users },
    { number: 5, title: 'Review & Start', icon: CheckCircle }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventory/inventory-audit">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Start Stock Reconciliation</h1>
          <p className="text-gray-600">Compare physical inventory with system records and balance discrepancies</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex flex-col items-center gap-2 ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-full mt-2 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {steps[currentStep - 1]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Reconciliation Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={auditSettings.name}
                  onChange={(e) => setAuditSettings(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Example: February 2025 Stock Reconciliation"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Reconciliation Description</Label>
                <Textarea
                  id="description"
                  value={auditSettings.description}
                  onChange={(e) => setAuditSettings(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the reconciliation process and objectives"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="residence">Building <span className="text-red-500">*</span></Label>
                <select
                  id="residence"
                  className={`flex h-11 w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.residence ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={auditSettings.scope.residenceId}
                  onChange={(e) => setAuditSettings(prev => ({
                    ...prev,
                    scope: { ...prev.scope, residenceId: e.target.value, locations: [] }
                  }))}
                >
                  <option value="">Select Building</option>
                  {residences.map(residence => (
                    <option key={residence.id} value={residence.id}>
                      {residence.name}
                    </option>
                  ))}
                </select>
                {errors.residence && <p className="text-red-500 text-sm">{errors.residence}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Scheduled Start Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={auditSettings.scheduledDate.toISOString().split('T')[0]}
                    onChange={(e) => setAuditSettings(prev => ({
                      ...prev,
                      scheduledDate: new Date(e.target.value)
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Estimated Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={auditSettings.estimatedDuration}
                    onChange={(e) => setAuditSettings(prev => ({
                      ...prev,
                      estimatedDuration: parseInt(e.target.value) || 1
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Select the locations you want to audit in the selected building
              </div>

              {errors.locations && (
                <p className="text-red-500 text-sm">{errors.locations}</p>
              )}

              <div className="space-y-4">
                {availableBuildings.map(building => (
                  <Card key={building.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{building.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {building.floors?.map(floor => (
                          <div key={floor.id} className="border rounded-lg p-3">
                            <h4 className="font-medium mb-2">{floor.name}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {floor.rooms?.map(room => {
                                const locationKey = `${room.id}:${room.name}`;
                                return (
                                  <div
                                    key={room.id}
                                    className="flex items-center space-x-2 space-x-reverse"
                                  >
                                    <Checkbox
                                      id={room.id}
                                      checked={auditSettings.scope.locations.includes(locationKey)}
                                      onCheckedChange={() => handleLocationToggle(room.id, room.name)}
                                    />
                                    <Label htmlFor={room.id} className="text-sm">
                                      {room.name}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected Locations:</strong> {auditSettings.scope.locations.length} locations
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Item Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="includeAll"
                    checked={auditSettings.scope.includeAllItems}
                    onCheckedChange={(checked) => setAuditSettings(prev => ({
                      ...prev,
                      scope: {
                        ...prev.scope,
                        includeAllItems: checked as boolean,
                        specificItems: checked ? [] : prev.scope.specificItems
                      }
                    }))}
                  />
                  <Label htmlFor="includeAll" className="text-lg font-medium">
                    Review all items in the building for stock reconciliation
                  </Label>
                </div>

                {!auditSettings.scope.includeAllItems && (
                  <>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">Filter by Category</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                          {categories.map(category => (
                            <div key={category} className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id={`cat-${category}`}
                                checked={auditSettings.scope.categories.includes(category)}
                                onCheckedChange={() => handleCategoryToggle(category)}
                              />
                              <Label htmlFor={`cat-${category}`} className="text-sm">
                                {category}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <Label className="text-base font-medium">Available Items</Label>
                        <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                          {filteredItems.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                              No items available in this building
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {filteredItems.map(item => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                                >
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <Checkbox
                                      id={`item-${item.id}`}
                                      checked={auditSettings.scope.specificItems.includes(item.id)}
                                      onCheckedChange={() => handleItemToggle(item.id)}
                                    />
                                    <Label htmlFor={`item-${item.id}`} className="text-sm">
                                      {item.nameAr}
                                    </Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {item.category}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      System Stock: {item.stockByResidence?.[auditSettings.scope.residenceId] || 0}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {errors.items && <p className="text-red-500 text-sm">{errors.items}</p>}
                  </>
                )}
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Items to Audit:</strong>{' '}
                  {auditSettings.scope.includeAllItems
                    ? residenceItems.length
                    : auditSettings.scope.specificItems.length} items
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Final Settings */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Additional settings for the reconciliation process
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Users Assigned to Reconciliation</Label>
                  <div className="text-sm text-gray-600">
                    Users responsible for conducting the stock reconciliation can be added later
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Reconciliation Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox id="requireDouble" defaultChecked />
                        <Label htmlFor="requireDouble">Double verification for adjustments</Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox id="photoRequired" />
                        <Label htmlFor="photoRequired">Document discrepancies with photos</Label>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Reporting Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox id="autoReport" defaultChecked />
                        <Label htmlFor="autoReport">Generate reconciliation report</Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox id="emailReport" />
                        <Label htmlFor="emailReport">Email report</Label>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review and Confirm */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Review reconciliation settings before starting
              </div>

              <div className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Reconciliation Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Reconciliation Name:</strong> {auditSettings.name}
                    </div>
                    <div>
                      <strong>Building:</strong> {residences.find(r => r.id === auditSettings.scope.residenceId)?.name}
                    </div>
                    <div>
                      <strong>Number of Locations:</strong> {auditSettings.scope.locations.length}
                    </div>
                    <div>
                      <strong>Items to Review:</strong>{' '}
                      {auditSettings.scope.includeAllItems
                        ? residenceItems.length
                        : auditSettings.scope.specificItems.length}
                    </div>
                    <div>
                      <strong>Start Date:</strong> {auditSettings.scheduledDate.toLocaleDateString('en-US')}
                    </div>
                    <div>
                      <strong>Estimated Duration:</strong> {auditSettings.estimatedDuration} days
                    </div>
                  </div>
                  {auditSettings.description && (
                    <div className="mt-3">
                      <strong>Description:</strong> {auditSettings.description}
                    </div>
                  )}
                </Card>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">Important Notice</h4>
                  <p className="text-sm text-yellow-700">
                    Starting this reconciliation will compare physical inventory counts with system records. 
                    Any discrepancies found will be documented and can be adjusted to balance the inventory.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              Previous
            </Button>
          )}
        </div>
        <div>
          {currentStep < 5 ? (
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              Start Reconciliation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
