'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Settings } from "lucide-react";
import { useResidences, type Service, type SubFacility, type ServiceLocation } from '@/context/residences-context';
import { useToast } from "@/hooks/use-toast";

interface ServiceManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  location: ServiceLocation;
  locationName: string;
  levelType: 'building' | 'floor' | 'room' | 'facility';
}

export function ServiceManagementDialog({
  isOpen,
  onOpenChange,
  location,
  locationName,
  levelType
}: ServiceManagementDialogProps) {
  const { toast } = useToast();
  const { 
    addServiceToBuilding, 
    addServiceToFloor, 
    addServiceToRoom, 
    addServiceToFacility,
    addSubFacilityToService,
    updateSubFacility,
    deleteSubFacility,
    updateService,
    deleteService
  } = useResidences();

  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');
  
  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: '',
    type: '',
    category: 'Essential' as 'Essential' | 'Amenity' | 'Utility',
    status: 'Active' as 'Active' | 'Inactive' | 'Maintenance',
    notes: ''
  });

  // Sub-facility form state
  const [subFacilityForm, setSubFacilityForm] = useState({
    name: '',
    number: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Maintenance',
    notes: ''
  });

  const [subFacilities, setSubFacilities] = useState<Omit<SubFacility, 'id'>[]>([]);

  const resetForms = () => {
    setServiceForm({
      name: '',
      type: '',
      category: 'Essential',
      status: 'Active',
      notes: ''
    });
    setSubFacilityForm({
      name: '',
      number: '',
      status: 'Active',
      notes: ''
    });
    setSubFacilities([]);
  };

  const addSubFacility = () => {
    if (!subFacilityForm.name.trim()) {
      toast({ title: "Error", description: "Sub-facility name is required.", variant: "destructive" });
      return;
    }

    const newSubFacility: Omit<SubFacility, 'id'> = {
      name: subFacilityForm.name.trim(),
      status: subFacilityForm.status,
    };

    // Only add optional fields if they have values
    const trimmedNumber = subFacilityForm.number.trim();
    if (trimmedNumber) {
      newSubFacility.number = trimmedNumber;
    }

    const trimmedNotes = subFacilityForm.notes.trim();
    if (trimmedNotes) {
      newSubFacility.notes = trimmedNotes;
    }

    setSubFacilities(prev => [...prev, newSubFacility]);
    setSubFacilityForm({
      name: '',
      number: '',
      status: 'Active',
      notes: ''
    });
  };

  const removeSubFacility = (index: number) => {
    setSubFacilities(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitService = async () => {
    if (!serviceForm.name.trim() || !serviceForm.type.trim()) {
      toast({ title: "Error", description: "Service name and type are required.", variant: "destructive" });
      return;
    }

    const service: Omit<Service, 'id' | 'addedDate'> = {
      name: serviceForm.name.trim(),
      type: serviceForm.type.trim(),
      category: serviceForm.category,
      status: serviceForm.status,
      subFacilities: subFacilities.map(sf => ({ ...sf, id: `temp-${Math.random()}` }))
    };

    // Only add notes if it has a value
    const trimmedNotes = serviceForm.notes.trim();
    if (trimmedNotes) {
      service.notes = trimmedNotes;
    }

    try {
      switch (levelType) {
        case 'building':
          if (location.buildingId) {
            await addServiceToBuilding(location.complexId, location.buildingId, service);
          }
          break;
        case 'floor':
          if (location.buildingId && location.floorId) {
            await addServiceToFloor(location.complexId, location.buildingId, location.floorId, service);
          }
          break;
        case 'room':
          if (location.buildingId && location.floorId && location.roomId) {
            await addServiceToRoom(location.complexId, location.buildingId, location.floorId, location.roomId, service);
          }
          break;
        case 'facility':
          if (location.facilityId) {
            await addServiceToFacility(location.complexId, location.facilityId, service);
          }
          break;
      }
      
      resetForms();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const serviceTypeOptions = [
    'Bathroom',
    'Kitchen',
    'Laundry',
    'Storage',
    'Elevator',
    'Emergency Exit',
    'Fire Safety',
    'Security',
    'Parking',
    'Garden',
    'Playground',
    'Swimming Pool',
    'Gym',
    'Meeting Room',
    'Reception',
    'Waste Management',
    'Electrical Room',
    'Water Supply',
    'HVAC',
    'Internet/Telecom',
    'Other'
  ];

  const categoryColors = {
    Essential: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Amenity: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Utility: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  };

  const statusColors = {
    Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    Maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage Services - {locationName}
          </DialogTitle>
          <DialogDescription>
            Add and manage services for this {levelType}. Services can include bathrooms, kitchens, utilities, and amenities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'add'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Add New Service
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'manage'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Manage Existing
            </button>
          </div>

          {activeTab === 'add' && (
            <div className="space-y-6">
              {/* Service Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service-name">Service Name *</Label>
                      <Input
                        id="service-name"
                        placeholder="e.g., Main Bathroom, Emergency Exit"
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="service-type">Service Type *</Label>
                      <Select 
                        onValueChange={(value) => setServiceForm(prev => ({ ...prev, type: value }))}
                        value={serviceForm.type}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypeOptions.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service-category">Category</Label>
                      <Select 
                        onValueChange={(value: 'Essential' | 'Amenity' | 'Utility') => 
                          setServiceForm(prev => ({ ...prev, category: value }))}
                        value={serviceForm.category}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Essential">Essential</SelectItem>
                          <SelectItem value="Amenity">Amenity</SelectItem>
                          <SelectItem value="Utility">Utility</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="service-status">Status</Label>
                      <Select 
                        onValueChange={(value: 'Active' | 'Inactive' | 'Maintenance') => 
                          setServiceForm(prev => ({ ...prev, status: value }))}
                        value={serviceForm.status}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="service-notes">Notes</Label>
                    <Textarea
                      id="service-notes"
                      placeholder="Additional notes about this service..."
                      value={serviceForm.notes}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sub-facilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sub-facilities</CardTitle>
                  <DialogDescription>
                    Add specific items within this service (e.g., individual bathroom stalls, storage units)
                  </DialogDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="sub-name">Name</Label>
                      <Input
                        id="sub-name"
                        placeholder="e.g., Stall, Unit"
                        value={subFacilityForm.name}
                        onChange={(e) => setSubFacilityForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sub-number">Number/ID</Label>
                      <Input
                        id="sub-number"
                        placeholder="e.g., 001, A1"
                        value={subFacilityForm.number}
                        onChange={(e) => setSubFacilityForm(prev => ({ ...prev, number: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sub-status">Status</Label>
                      <Select 
                        onValueChange={(value: 'Active' | 'Inactive' | 'Maintenance') => 
                          setSubFacilityForm(prev => ({ ...prev, status: value }))}
                        value={subFacilityForm.status}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addSubFacility} size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sub-notes">Notes</Label>
                    <Input
                      id="sub-notes"
                      placeholder="Additional notes..."
                      value={subFacilityForm.notes}
                      onChange={(e) => setSubFacilityForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  {subFacilities.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Added Sub-facilities</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {subFacilities.map((sf, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{sf.name}</span>
                                  {sf.number && (
                                    <Badge variant="outline" className="text-xs">#{sf.number}</Badge>
                                  )}
                                  <Badge className={`text-xs ${statusColors[sf.status]}`}>
                                    {sf.status}
                                  </Badge>
                                </div>
                                {sf.notes && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{sf.notes}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSubFacility(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Service Management</p>
                    <p className="text-sm">
                      This feature will allow you to edit and manage existing services.
                      <br />
                      Currently showing the add new service functionality.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === 'add' && (
            <Button onClick={handleSubmitService}>
              Add Service
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
