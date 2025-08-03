
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useResidences } from '@/context/residences-context';
import { useUsers } from '@/context/users-context';
import { useInventory, type InventoryItem, type LocationWithItems as IVoucherLocation } from '@/context/inventory-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, Trash2, MapPin, PackagePlus, Loader2, History, ConciergeBell, Building, Archive, ChevronDown, ChevronUp, FileText, CheckCircle, XCircle, Clock, Truck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';
import { differenceInDays } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';


interface IssuedItem extends InventoryItem {
    issueQuantity: number;
}

interface VoucherLocation {
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
    serviceId?: string;
    serviceName?: string;
    subFacilityId?: string;
    subFacilityName?: string;
    serviceLocation?: string;
    items: IssuedItem[];
}


export default function IssueMaterialPage() {
    const { currentUser } = useUsers();
    const { residences, loading: residencesLoading } = useResidences();
    const { items: allItems, loading: inventoryLoading, getStockForResidence, issueItemsFromStock, getLastIssueDateForItemAtLocation, getMIVs } = useInventory();
    const { toast } = useToast();
    const router = useRouter();
    
    const [selectedComplexId, setSelectedComplexId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompletedOpen, setIsCompletedOpen] = useState(false);
    const [recentMIVs, setRecentMIVs] = useState<any[]>([]);
    const [loadingMIVs, setLoadingMIVs] = useState(false);

    // Load completed section state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('issue-completed-open');
        if (savedState !== null) {
            setIsCompletedOpen(JSON.parse(savedState));
        }
    }, []);

    // Save completed section state to localStorage
    const handleCompletedToggle = (open: boolean) => {
        setIsCompletedOpen(open);
        localStorage.setItem('issue-completed-open', JSON.stringify(open));
    };

    // Load recent MIVs
    useEffect(() => {
        const loadRecentMIVs = async () => {
            if (!currentUser) return;
            setLoadingMIVs(true);
            try {
                const allMIVs = await getMIVs();
                // Filter by user permissions and get recent ones
                let filteredMIVs = allMIVs;
                if (currentUser.role !== 'Admin') {
                    filteredMIVs = allMIVs.filter(miv => 
                        currentUser.assignedResidences.includes(miv.residenceId)
                    );
                }
                // Get last 10 MIVs
                setRecentMIVs(filteredMIVs.slice(0, 10));
            } catch (error) {
                console.error('Error loading MIVs:', error);
            } finally {
                setLoadingMIVs(false);
            }
        };

        loadRecentMIVs();
    }, [currentUser, getMIVs]);
    
    const [locationType, setLocationType] = useState<'unit' | 'facility' | 'service'>('unit');
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [selectedFloorId, setSelectedFloorId] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedFacilityId, setSelectedFacilityId] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [selectedSubFacilityId, setSelectedSubFacilityId] = useState('');

    const [voucherLocations, setVoucherLocations] = useState<VoucherLocation[]>([]);
    
    const userResidences = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === 'Admin') return residences;
        return residences.filter(r => currentUser.assignedResidences.includes(r.id));
    }, [currentUser, residences]);

    // Filter for dropdown (exclude main-warehouse)
    const filteredResidences = useMemo(() => {
        return userResidences.filter(r => r.id !== 'main-warehouse');
    }, [userResidences]);

    // Statistics
    const activeMIVs = recentMIVs.filter(miv => miv.status === 'Pending');
    const issuedMIVs = recentMIVs.filter(miv => miv.status === 'Issued');
    const cancelledMIVs = recentMIVs.filter(miv => miv.status === 'Cancelled');
    const totalMIVs = recentMIVs.length;

    const selectedComplex = useMemo(() => residences.find(c => c.id === selectedComplexId), [selectedComplexId, residences]);
    const selectedBuilding = useMemo(() => selectedComplex?.buildings.find(b => b.id === selectedBuildingId), [selectedBuildingId, selectedComplex]);
    const selectedFloor = useMemo(() => selectedBuilding?.floors.find(f => f.id === selectedFloorId), [selectedFloorId, selectedBuilding]);
    
    // Collect all services from all levels
    const allAvailableServices = useMemo(() => {
        if (!selectedComplex) return [];
        
        const services: any[] = [];
        
        // Complex-level services
        if (selectedComplex.services) {
            services.push(...selectedComplex.services);
        }
        
        // Building-level services
        selectedComplex.buildings?.forEach(building => {
            if (building.services) {
                services.push(...building.services.map(s => ({
                    ...s,
                    _location: `${building.name}`,
                    _locationId: `building-${building.id}`
                })));
            }
            
            // Floor-level services
            building.floors?.forEach(floor => {
                if (floor.services) {
                    services.push(...floor.services.map(s => ({
                        ...s,
                        _location: `${building.name} -> ${floor.name}`,
                        _locationId: `floor-${building.id}-${floor.id}`
                    })));
                }
                
                // Room-level services (only check selected room to keep it simple)
                if (selectedRoomId) {
                    const selectedRoom = floor.rooms?.find(r => r.id === selectedRoomId);
                    if (selectedRoom?.services) {
                        services.push(...selectedRoom.services.map(s => ({
                            ...s,
                            _location: `${building.name} -> ${floor.name} -> ${selectedRoom.name}`,
                            _locationId: `room-${building.id}-${floor.id}-${selectedRoom.id}`
                        })));
                    }
                }
            });
        });
        
        console.log('🔍 All available services:', services);
        return services;
    }, [selectedComplex, selectedRoomId]);
    
    const isLocationSelected = useMemo(() => {
        if (locationType === 'unit') {
            return !!(selectedBuildingId && selectedFloorId && selectedRoomId);
        } else if (locationType === 'facility') {
            return !!selectedFacilityId;
        } else if (locationType === 'service') {
            if (!selectedServiceId) return false;
            
            // Find the selected service
            const selectedService = allAvailableServices.find((s: any) => `${s._locationId || 'complex'}-${s.id}` === selectedServiceId);
            
            // If service has sub-facilities, require one to be selected
            if (selectedService?.subFacilities && selectedService.subFacilities.length > 0) {
                return !!selectedSubFacilityId;
            }
            
            // If service has no sub-facilities, just service selection is enough
            return true;
        }
        return false;
    }, [locationType, selectedBuildingId, selectedFloorId, selectedRoomId, selectedFacilityId, selectedServiceId, selectedSubFacilityId, allAvailableServices]);

    const availableInventory = useMemo(() => {
        if (!selectedComplexId) return [];
        return allItems.filter(item => getStockForResidence(item, selectedComplexId) > 0);
    }, [selectedComplexId, allItems, getStockForResidence]);


    useEffect(() => {
        setVoucherLocations([]);
        setSelectedBuildingId('');
        setSelectedFacilityId('');
        setSelectedServiceId('');
        setSelectedSubFacilityId('');
        setLocationType('unit');
    }, [selectedComplexId]);
    
    useEffect(() => {
        setSelectedFloorId('');
    }, [selectedBuildingId]);

    useEffect(() => {
        setSelectedRoomId('');
    }, [selectedFloorId]);

    // Reset selections when location type changes
    useEffect(() => {
        setSelectedBuildingId('');
        setSelectedFloorId('');
        setSelectedRoomId('');
        setSelectedFacilityId('');
        setSelectedServiceId('');
        setSelectedSubFacilityId('');
    }, [locationType]);
    
    const handleAddItemToLocation = async (itemToAdd: InventoryItem) => {
        if (!isLocationSelected || !selectedComplex) {
            toast({ title: "No Location Selected", description: "Please select a location or facility first.", variant: "destructive"});
            return;
        }

        const stock = getStockForResidence(itemToAdd, selectedComplexId);
        if (stock < 1) {
            toast({ title: "Out of stock", description: "This item is currently out of stock.", variant: "destructive" });
            return;
        }

        let locationId: string, locationName: string, isFacility: boolean;
        let newLocationDetails: Partial<VoucherLocation> = {};

        if (locationType === 'unit') {
            const selectedRoom = selectedFloor?.rooms.find(r => r.id === selectedRoomId);
            if (!selectedBuilding || !selectedFloor || !selectedRoom) {
                toast({ title: "Location not found", description: "An error occurred with the selected room.", variant: "destructive"});
                return;
            }
            locationId = `${selectedBuildingId}-${selectedFloorId}-${selectedRoomId}`;
            locationName = `${selectedBuilding.name} -> ${selectedFloor.name} -> ${selectedRoom.name}`;
            isFacility = false;
            newLocationDetails = {
                buildingId: selectedBuildingId,
                buildingName: selectedBuilding.name,
                floorId: selectedFloorId,
                floorName: selectedFloor.name,
                roomId: selectedRoomId,
                roomName: selectedRoom.name,
            };
        } else if (locationType === 'facility') {
            const selectedFacility = selectedComplex.facilities?.find(f => f.id === selectedFacilityId);
             if (!selectedFacility) {
                toast({ title: "Facility not found", description: "An error occurred with the selected facility.", variant: "destructive"});
                return;
            }
            locationId = selectedFacilityId;
            locationName = selectedFacility.name;
            isFacility = true;
            newLocationDetails = { facilityId: selectedFacilityId, locationId: selectedFacilityId };
        } else if (locationType === 'service') {
            const selectedService = allAvailableServices.find((s: any) => `${s._locationId || 'complex'}-${s.id}` === selectedServiceId);
            
            if (!selectedService) {
                toast({ title: "Service not found", description: "An error occurred with the selected service.", variant: "destructive"});
                return;
            }
            
            // Check if service has sub-facilities and one is selected
            if (selectedService.subFacilities && selectedService.subFacilities.length > 0) {
                const selectedSubFacility = selectedService.subFacilities.find((sf: any) => sf.id === selectedSubFacilityId);
                
                if (!selectedSubFacility) {
                    toast({ title: "Sub-facility required", description: "Please select a sub-facility for this service.", variant: "destructive"});
                    return;
                }
                
                locationId = `service-${selectedServiceId}-${selectedSubFacilityId}`;
                locationName = `${selectedService.name} -> ${selectedSubFacility.name}${selectedSubFacility.number ? ` (${selectedSubFacility.number})` : ''}`;
                newLocationDetails = {
                    serviceId: selectedServiceId,
                    serviceName: selectedService.name,
                    subFacilityId: selectedSubFacilityId,
                    subFacilityName: selectedSubFacility.name,
                    serviceLocation: selectedService._location || 'Complex Level'
                };
            } else {
                // Service without sub-facilities
                locationId = `service-${selectedServiceId}`;
                locationName = selectedService.name + (selectedService._location ? ` (${selectedService._location})` : '');
                newLocationDetails = {
                    serviceId: selectedServiceId,
                    serviceName: selectedService.name,
                    serviceLocation: selectedService._location || 'Complex Level'
                };
            }
            
            isFacility = false;
        } else {
            toast({ title: "Invalid Location Type", description: "Please select a valid location type.", variant: "destructive"});
            return;
        }
        
        // Lifespan check
        if (itemToAdd.lifespanDays && itemToAdd.lifespanDays > 0) {
            const lastIssueDate = await getLastIssueDateForItemAtLocation(itemToAdd.id, locationId);
            if (lastIssueDate) {
                const daysSinceLastIssue = differenceInDays(new Date(), lastIssueDate.toDate());
                if (daysSinceLastIssue < itemToAdd.lifespanDays) {
                    toast({
                        title: "Lifespan Warning",
                        description: `"${itemToAdd.nameEn}" was issued to this location ${daysSinceLastIssue} days ago. Its lifespan is ${itemToAdd.lifespanDays} days. Please ensure replacement is justified.`,
                        variant: "default",
                        duration: 8000,
                        className: "bg-yellow-100 border-yellow-400 text-yellow-800"
                    });
                }
            }
        }
        
        setVoucherLocations(prevLocations => {
            const existingLocationIndex = prevLocations.findIndex(l => l.locationId === locationId);
            
            if (existingLocationIndex > -1) {
                const newLocations = [...prevLocations];
                const targetLocation = newLocations[existingLocationIndex];
                const existingItemIndex = targetLocation.items.findIndex(i => i.id === itemToAdd.id);

                if (existingItemIndex > -1) {
                    const currentQty = targetLocation.items[existingItemIndex].issueQuantity;
                    if(currentQty < stock) {
                        targetLocation.items[existingItemIndex].issueQuantity += 1;
                    } else {
                         toast({ title: "Stock limit reached", description: `Cannot issue more than the available ${stock} units.`, variant: "destructive"});
                    }
                } else {
                    targetLocation.items.push({ ...itemToAdd, issueQuantity: 1 });
                }
                return newLocations;
            } else {
                const newLocation: VoucherLocation = {
                    ...newLocationDetails,
                    locationId,
                    locationName,
                    isFacility,
                    items: [{ ...itemToAdd, issueQuantity: 1 }]
                };
                return [...prevLocations, newLocation];
            }
        });
    };

    const handleQuantityChange = (locationId: string, itemId: string, newQuantity: number) => {
         const itemInfo = allItems.find(i => i.id === itemId);
        if (!itemInfo || !selectedComplexId) return;

        const stock = getStockForResidence(itemInfo, selectedComplexId);

        let quantity = newQuantity;
        if (quantity < 1) {
            quantity = 1;
        } else if (quantity > stock) {
            quantity = stock;
            toast({ title: "Stock limit reached", description: `Cannot issue more than the available ${stock} units.`, variant: "destructive"});
        }
        
        setVoucherLocations(prev => prev.map(loc => 
            loc.locationId === locationId 
            ? { ...loc, items: loc.items.map(item => item.id === itemId ? {...item, issueQuantity: quantity} : item) }
            : loc
        ));
    };

    const handleRemoveItem = (locationId: string, itemId: string) => {
        setVoucherLocations(prev => {
            const newLocations = prev.map(loc => {
                if (loc.locationId === locationId) {
                    return { ...loc, items: loc.items.filter(item => item.id !== itemId) };
                }
                return loc;
            });
            return newLocations.filter(loc => loc.items.length > 0);
        });
    };
    
    const handleSubmitVoucher = async () => {
        if (!selectedComplexId || !isVoucherSubmittable) {
            toast({ title: "Cannot Submit", description: "Voucher is empty or residence is not selected.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            await issueItemsFromStock(selectedComplexId, voucherLocations);
            toast({ title: "Success", description: "Material Issue Voucher has been processed and stock updated." });
            setVoucherLocations([]);
            setSelectedBuildingId('');
            setSelectedFloorId('');
            setSelectedRoomId('');
            setSelectedFacilityId('');
            setLocationType('unit');
            router.push('/inventory/issue-history');
        } catch (error) {
            console.error("Failed to submit voucher:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error has occurred";
            toast({ title: "Submission Error", description: `An error occurred: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isVoucherSubmittable = useMemo(() => {
        return voucherLocations.length > 0 && voucherLocations.every(loc => loc.items.length > 0);
    }, [voucherLocations]);

    if (residencesLoading || inventoryLoading) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Material Issue Voucher (MIV)</h1>
                    <p className="text-muted-foreground">Issue materials from a residence's storeroom to specific locations.</p>
                </div>
                 <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.push('/inventory/issue-history')}>
                        <History className="mr-2 h-4 w-4"/> View History
                    </Button>
                    <Button onClick={handleSubmitVoucher} disabled={!isVoucherSubmittable || isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Submit Voucher
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Issue</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeMIVs.length}</div>
                        <p className="text-xs text-muted-foreground">Vouchers awaiting issue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Issued Today</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{issuedMIVs.length}</div>
                        <p className="text-xs text-muted-foreground">Items distributed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cancelledMIVs.length}</div>
                        <p className="text-xs text-muted-foreground">Cancelled vouchers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vouchers</CardTitle>
                        <Archive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalMIVs}</div>
                        <p className="text-xs text-muted-foreground">All MIVs this period</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                 <CardHeader>
                     <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary"/> Add Items to a Location</CardTitle>
                            <CardDescription>First, select the location. Then, add items from the available inventory below.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="whitespace-nowrap">Issue From Residence:</Label>
                            <Select value={selectedComplexId} onValueChange={setSelectedComplexId} disabled={isSubmitting}>
                                <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select a residence..." /></SelectTrigger>
                                <SelectContent>
                                    {filteredResidences.map(res => <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                     </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1 space-y-4">
                            <h3 className="font-semibold">Select Location Type</h3>
                            <RadioGroup value={locationType} onValueChange={(value) => setLocationType(value as 'unit' | 'facility' | 'service')} className="flex gap-4" disabled={!selectedComplexId}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="unit" id="r_unit" />
                                    <Label htmlFor="r_unit" className="flex items-center gap-2"><Building className="h-4 w-4" /> Unit</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="facility" id="r_facility" />
                                    <Label htmlFor="r_facility" className="flex items-center gap-2"><ConciergeBell className="h-4 w-4" /> Facility</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="service" id="r_service" />
                                    <Label htmlFor="r_service" className="flex items-center gap-2"><ConciergeBell className="h-4 w-4" /> Services</Label>
                                </div>
                            </RadioGroup>
                            
                            {locationType === 'unit' ? (
                                <div className="space-y-2 pt-2">
                                    <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId} disabled={!selectedComplexId}>
                                        <SelectTrigger><SelectValue placeholder="Select Building" /></SelectTrigger>
                                        <SelectContent>
                                            {selectedComplex?.buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedFloorId} onValueChange={setSelectedFloorId} disabled={!selectedBuildingId}>
                                        <SelectTrigger><SelectValue placeholder="Select Floor" /></SelectTrigger>
                                        <SelectContent>
                                            {selectedBuilding?.floors.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedRoomId} onValueChange={setSelectedRoomId} disabled={!selectedFloorId}>
                                        <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                                        <SelectContent>
                                            {selectedFloor?.rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : locationType === 'facility' ? (
                                 <div className="space-y-2 pt-2">
                                    <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId} disabled={!selectedComplexId}>
                                        <SelectTrigger><SelectValue placeholder="Select Facility" /></SelectTrigger>
                                        <SelectContent>
                                            {selectedComplex?.facilities?.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                 </div>
                            ) : locationType === 'service' ? (
                                <div className="space-y-2 pt-2">
                                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId} disabled={!selectedComplexId || !allAvailableServices.length}>
                                        <SelectTrigger><SelectValue placeholder={!allAvailableServices.length ? "No services available" : "Select Service"} /></SelectTrigger>
                                        <SelectContent>
                                            {allAvailableServices.length > 0 ? (
                                                allAvailableServices.map((s: any) => (
                                                    <SelectItem key={`${s._locationId || 'complex'}-${s.id}`} value={`${s._locationId || 'complex'}-${s.id}`}>
                                                        {s.name} {s._location ? `(${s._location})` : ''}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    No services available - Add services in Residences page
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedSubFacilityId} onValueChange={setSelectedSubFacilityId} disabled={!selectedServiceId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={(() => {
                                                const selectedService = allAvailableServices.find((s: any) => `${s._locationId || 'complex'}-${s.id}` === selectedServiceId);
                                                if (!selectedServiceId) return "Select Sub-facility (Optional)";
                                                if (!selectedService?.subFacilities || selectedService.subFacilities.length === 0) {
                                                    return "No sub-facilities available";
                                                }
                                                return "Select Sub-facility (Required)";
                                            })()} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(() => {
                                                const selectedService = allAvailableServices.find((s: any) => `${s._locationId || 'complex'}-${s.id}` === selectedServiceId);
                                                return selectedService?.subFacilities?.length > 0 ? (
                                                    selectedService.subFacilities.map((sf: any) => (
                                                        <SelectItem key={sf.id} value={sf.id}>{sf.name} {sf.number ? `(${sf.number})` : ''}</SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                        {!selectedServiceId ? "Select a service first" : "✅ This service has no sub-facilities - You can proceed to add items"}
                                                    </div>
                                                );
                                            })()}
                                        </SelectContent>
                                    </Select>
                                    {/* Debug info */}
                                    {selectedComplexId && (
                                        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                                            <p>Services found: {allAvailableServices.length}</p>
                                            {allAvailableServices.length === 0 && (
                                                <p className="text-orange-600">⚠️ No services found. Add services in Residences page first.</p>
                                            )}
                                            {allAvailableServices.length > 0 && (
                                                <div className="mt-1">
                                                    <p className="text-green-600">✅ Available:</p>
                                                    {allAvailableServices.slice(0, 3).map((s: any, i: number) => (
                                                        <p key={i} className="text-xs">• {s.name} {s._location ? `(${s._location})` : ''}</p>
                                                    ))}
                                                    {allAvailableServices.length > 3 && <p className="text-xs">...and {allAvailableServices.length - 3} more</p>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                        <div className="lg:col-span-3">
                            <h3 className="font-semibold mb-4">Available Inventory</h3>
                             <ScrollArea className="h-[250px] border rounded-md">
                                {selectedComplexId ? (
                                    <div className="p-2 space-y-2">
                                        {availableInventory.length > 0 ? availableInventory.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 border">
                                                <div>
                                                    <p className="font-medium">{item.nameAr} / {item.nameEn}</p>
                                                    <p className="text-sm text-muted-foreground">{item.category} - Stock: {getStockForResidence(item, selectedComplexId)} {item.unit}</p>
                                                </div>
                                                <Button size="icon" variant="outline" onClick={() => handleAddItemToLocation(item)} disabled={!isLocationSelected}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )) : (
                                            <div className="text-center text-muted-foreground p-8">No inventory with stock found for this residence.</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Select a residence to see available items.
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5 text-primary"/> Voucher Items</CardTitle>
                    <CardDescription>Review all items and locations before submitting the voucher.</CardDescription>
                </CardHeader>
                <CardContent>
                    {voucherLocations.length > 0 ? (
                         <Accordion type="multiple" defaultValue={voucherLocations.map(l => l.locationId)}>
                            {voucherLocations.map(location => (
                                <AccordionItem key={location.locationId} value={location.locationId}>
                                    <AccordionTrigger className="font-semibold text-lg">
                                        {location.locationName}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Item</TableHead>
                                                    <TableHead className="w-[150px] text-center">Quantity</TableHead>
                                                    <TableHead className="w-[50px] text-right"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {location.items.map(item => (
                                                    <TableRow key={item.id}>
                                                         <TableCell className="font-medium">
                                                            <p>{item.nameAr} / {item.nameEn}</p>
                                                            <p className="text-xs text-muted-foreground">{item.category}</p>
                                                        </TableCell>
                                                         <TableCell>
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(location.locationId, item.id, item.issueQuantity - 1)}>
                                                                    <Minus className="h-4 w-4" />
                                                                </Button>
                                                                <Input type="number" value={item.issueQuantity} onChange={(e) => handleQuantityChange(location.locationId, item.id, parseInt(e.target.value, 10))} className="w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(location.locationId, item.id, item.issueQuantity + 1)}>
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(location.locationId, item.id)}>
                                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center text-muted-foreground p-8">
                            No items added to the voucher yet.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent MIVs History */}
            <Collapsible 
                open={isCompletedOpen} 
                onOpenChange={handleCompletedToggle}
            >
                <Card>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Archive className="h-5 w-5 text-muted-foreground" />
                                        Recent MIVs History
                                    </CardTitle>
                                    <CardDescription>
                                        View recently created material issue vouchers ({recentMIVs.length} total)
                                    </CardDescription>
                                </div>
                                <ChevronDown className={`h-4 w-4 transition-transform ${isCompletedOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent>
                            {loadingMIVs ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    <span className="ml-2 text-muted-foreground">Loading recent MIVs...</span>
                                </div>
                            ) : recentMIVs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No MIVs found for your assigned residences.</p>
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>MIV #</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Residence</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Created By</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentMIVs.map((miv) => (
                                                <TableRow key={miv.id}>
                                                    <TableCell className="font-medium">
                                                        #{miv.id.slice(-6)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(miv.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {residences.find(r => r.id === miv.residenceId)?.name || 'Unknown'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {miv.totalItems || 0} items
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            miv.status === 'Issued' ? 'default' :
                                                            miv.status === 'Pending' ? 'secondary' :
                                                            'destructive'
                                                        }>
                                                            {miv.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {miv.createdBy || 'Unknown'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

        </div>
    );
}
