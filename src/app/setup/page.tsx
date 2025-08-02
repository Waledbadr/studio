
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSelector } from "@/components/theme-selector";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, getDocs, setDoc, Timestamp, query, where, updateDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Loader2, Palette, Database, Home } from "lucide-react";
import type { Complex } from "@/context/residences-context";
import type { InventoryItem } from "@/context/inventory-context";
import type { OrderItem } from "@/context/orders-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function SetupPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isAddingRooms, setIsAddingRooms] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('database');
    
    // Check for theme tab in URL hash
    useEffect(() => {
        if (window.location.hash === '#themes') {
            setActiveTab('themes');
        }
    }, []);
    
    // In a real app, this should be an environment variable.
    const RESET_PASSWORD = "reset123";

    const seedInitialData = async () => {
        if (!db) {
            toast({ title: "Firebase Error", description: "Firebase is not configured.", variant: "destructive" });
            return;
        }
        setIsLoading(true);

        try {
            const batch = writeBatch(db);
            let residenceId: string | null = null;
            let residenceName: string | null = null;
            let userId: string | null = null;
            
            // --- 1. CHECK RESIDENCES & USERS ---
            const residencesCollection = collection(db, "residences");
            const residencesSnapshot = await getDocs(residencesCollection);
             if (residencesSnapshot.empty) {
                 toast({ title: "Warning", description: "No residences found. Please create at least one residence before seeding.", variant: "destructive" });
                 setIsLoading(false);
                 return;
            } else {
                residenceId = residencesSnapshot.docs[0].id;
                residenceName = residencesSnapshot.docs[0].data().name;
            }

            const usersCollection = collection(db, "users");
            const usersSnapshot = await getDocs(usersCollection);
            if (usersSnapshot.empty) {
                 toast({ title: "Warning", description: "No users found. Please create an Admin user to assign the initial order.", variant: "destructive" });
                 setIsLoading(false);
                 return;
            } else {
                const adminUser = usersSnapshot.docs.find(doc => doc.data().role === 'Admin');
                userId = adminUser ? adminUser.id : usersSnapshot.docs[0].id;
            }

            // --- 2. SEED INVENTORY ITEMS (if empty) ---
            const inventoryCollection = collection(db, "inventory");
            const inventorySnapshot = await getDocs(inventoryCollection);
            const sampleItemsForOrder: OrderItem[] = [];

            if (inventorySnapshot.empty) {
                const sampleItems: Omit<InventoryItem, 'id' | 'stock' | 'stockByResidence'>[] = [
                    { name: "Light Bulb", nameAr: "لمبة إضاءة", nameEn: "Light Bulb", category: "electrical", unit: "Piece" },
                    { name: "Cleaning Spray", nameAr: "بخاخ تنظيف", nameEn: "Cleaning Spray", category: "cleaning", unit: "Bottle" },
                    { name: "Water Tap", nameAr: "صنبور ماء", nameEn: "Water Tap", category: "plumbing", unit: "Piece" },
                    { name: "Power Socket", nameAr: "مقبس كهربائي", nameEn: "Power Socket", category: "electrical", unit: "Piece" },
                    { name: "Trash Bags", nameAr: "أكياس قمامة", nameEn: "Trash Bags", category: "cleaning", unit: "Roll" },
                ];
                
                sampleItems.forEach(item => {
                    const docRef = doc(inventoryCollection);
                    const newItem = { ...item, id: docRef.id, stock: 0, stockByResidence: {} };
                    batch.set(docRef, newItem);
                    sampleItemsForOrder.push({ ...newItem, quantity: Math.floor(Math.random() * 100) + 50 });
                });
                console.log("Inventory data prepared for seeding (with zero stock).");
                 await batch.commit(); // Commit inventory items first
            } else {
                 toast({ title: "Skipped", description: "Inventory collection already has data." });
            }

            // --- 3. SEED INITIAL PURCHASE ORDER (if empty) ---
            const ordersCollection = collection(db, "orders");
            const ordersSnapshot = await getDocs(ordersCollection);
            
            if (ordersSnapshot.empty && sampleItemsForOrder.length > 0 && residenceId && residenceName && userId) {
                 const newOrder = {
                    date: Timestamp.now(),
                    residence: residenceName,
                    residenceId: residenceId,
                    requestedById: userId,
                    approvedById: '',
                    items: sampleItemsForOrder,
                    status: 'Approved', 
                };
                const orderRef = doc(ordersCollection, "00-00-001");
                await setDoc(orderRef, newOrder);
                toast({ title: "Action Required", description: "An initial 'Approved' purchase order has been created. Please go to 'Receive Materials' to populate your stock." });
            } else if (!ordersSnapshot.empty) {
                toast({ title: "Skipped", description: "Orders collection already has data." });
            }

            toast({ title: "Success", description: "Database setup check complete." });
        } catch (error) {
            console.error("Error seeding data:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Error", description: `Failed to seed database: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleResetSystem = async () => {
        if (!db) {
            toast({ title: "Firebase Error", description: "Firebase not configured", variant: "destructive" });
            return;
        }
        if (password !== RESET_PASSWORD) {
            toast({ title: "Error", description: "Incorrect password.", variant: "destructive" });
            return;
        }
        setIsResetting(true);

        try {
            const batch = writeBatch(db);
            const collectionsToDelete = [
                "orders",
                "inventoryTransactions",
                "mivs",
                "maintenanceRequests",
                "stockTransfers",
                "notifications"
            ];

            // 1. Reset all inventory item stocks to zero
            const inventorySnapshot = await getDocs(collection(db, "inventory"));
            inventorySnapshot.forEach(doc => {
                batch.update(doc.ref, { stockByResidence: {} });
            });
            console.log("Prepared to reset inventory stock.");

            // 2. Delete all documents from operational collections
            for (const collectionName of collectionsToDelete) {
                const snapshot = await getDocs(collection(db, collectionName));
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                console.log(`Prepared to delete all documents from: ${collectionName}`);
            }

            // Commit all batched writes
            await batch.commit();

            toast({ title: "Success", description: "System has been reset. All operational data deleted, and inventory stock zeroed out." });
            setPassword('');
        } catch (error) {
            console.error("Error resetting system:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Error", description: `Failed to reset system: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsResetting(false);
        }
    };

    const handleAddRooms = async () => {
        if (!db) {
            toast({ title: "Firebase Error", description: "Firebase not configured", variant: "destructive" });
            return;
        }
        setIsAddingRooms(true);

        const complexName = "um alsalam";
        const buildingName = "B1";
        const floorName = "floor 1";
        const roomsToAdd = ["32", "33", "34", "35", "37", "38", "39", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "89", "201", "202"];

        try {
            const q = query(collection(db, "residences"), where("name", "==", complexName));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ title: "Error", description: `Complex "${complexName}" not found.`, variant: "destructive" });
                setIsAddingRooms(false);
                return;
            }

            const complexDoc = querySnapshot.docs[0];
            const complexData = complexDoc.data() as Complex;
            const complexId = complexDoc.id;

            let buildingFound = false;
            const updatedBuildings = complexData.buildings.map(building => {
                if (building.name === buildingName) {
                    buildingFound = true;
                    let floorFound = false;
                    building.floors = building.floors.map(floor => {
                        if (floor.name === floorName) {
                            floorFound = true;
                            const existingRoomNames = new Set(floor.rooms.map(r => r.name));
                            const newRooms = roomsToAdd
                                .filter(roomName => !existingRoomNames.has(roomName))
                                .map(roomName => ({ id: `room-${Date.now()}-${Math.random()}`, name: roomName }));

                            if (newRooms.length > 0) {
                                floor.rooms.push(...newRooms);
                                toast({ title: "Info", description: `Added ${newRooms.length} new rooms.` });
                            } else {
                                toast({ title: "Info", description: `All specified rooms already exist.` });
                            }
                        }
                        return floor;
                    });
                    if (!floorFound) {
                        toast({ title: "Error", description: `Floor "${floorName}" not found in building "${buildingName}".`, variant: "destructive" });
                    }
                }
                return building;
            });

            if (!buildingFound) {
                toast({ title: "Error", description: `Building "${buildingName}" not found in complex "${complexName}".`, variant: "destructive" });
                setIsAddingRooms(false);
                return;
            }
            
            await updateDoc(doc(db, "residences", complexId), { buildings: updatedBuildings });
            toast({ title: "Success", description: "Room list updated successfully." });

        } catch (error) {
            console.error("Error adding rooms:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Error", description: `Failed to add rooms: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsAddingRooms(false);
        }
    };


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">System Setup & Configuration</h1>
                <p className="text-muted-foreground">Configure your system settings and manage data</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="database" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Database Setup
                    </TabsTrigger>
                    <TabsTrigger value="themes" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Theme Settings
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="themes" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Personalization Settings
                            </CardTitle>
                            <CardDescription>
                                Customize the appearance of your application with different color themes and modes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ThemeSelector />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="database" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Initial Data Setup
                                </CardTitle>
                                <CardDescription>
                                    This process checks if your database is empty and adds sample data. It creates sample inventory items and an initial **approved** purchase order. You must go to "Receive Materials" to complete the process and add stock.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={seedInitialData} disabled={isLoading} className="w-full">
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding...</>
                                    ) : (
                                        'Seed Database'
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Home className="h-5 w-5" />
                                    Add Specific Rooms
                                </CardTitle>
                                <CardDescription>
                                    This will add a list of rooms to Floor 1, Building B1, in the "um alsalam" complex.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={handleAddRooms} disabled={isAddingRooms} className="w-full">
                                    {isAddingRooms ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding Rooms...</>
                                    ) : (
                                        'Add Rooms to Um Al-Salam'
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Advanced Settings - System Reset</CardTitle>
                            <CardDescription>
                                This will permanently delete all orders, transfers, maintenance requests, notifications and inventory transactions. It will also reset the stock of all inventory items to zero. User and residence data will not be affected. This action cannot be undone.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="destructive" className="w-full">Reset System Data</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action is irreversible. To confirm, please type the administrator password below.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                     <div className="grid gap-2">
                                        <Label htmlFor="reset-password">Password</Label>
                                        <Input 
                                            id="reset-password"
                                            type="password"
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setPassword('')}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={handleResetSystem}
                                            disabled={isResetting || password !== RESET_PASSWORD}
                                            className="bg-destructive hover:bg-destructive/90"
                                        >
                                            {isResetting ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
                                            ) : (
                                                "Confirm Reset"
                                            )}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
