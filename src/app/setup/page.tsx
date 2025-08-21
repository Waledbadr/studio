'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSelector } from "@/components/theme-selector";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, getDocs, setDoc, Timestamp, query, where, updateDoc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Loader2, Palette, Database, Home } from "lucide-react";
import type { Complex } from "@/context/residences-context";
import type { InventoryItem } from "@/context/inventory-context";
import type { OrderItem } from "@/context/orders-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUsers } from "@/context/users-context";


export default function SetupPage() {
    const { toast } = useToast();
    const { currentUser } = useUsers();
    const isAdmin = currentUser?.role === 'Admin';
    const dangerousEnabled = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DANGEROUS_TOOLS === 'true';
    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isAddingRooms, setIsAddingRooms] = useState(false);
    const [isFixingStock, setIsFixingStock] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('database');
    
    // Check for theme tab in URL hash
    useEffect(() => {
        // If themes hash present or user is not Admin, default to themes tab
        if (window.location.hash === '#themes' || !isAdmin) {
            setActiveTab('themes');
        } else {
            setActiveTab('database');
        }
    }, [isAdmin]);
    
    // In a real app, this should be an environment variable.
    const RESET_PASSWORD = "RESET123";

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
                        // Admin emails to keep
                        const keepEmails = [
                            'm.alabdali@sacodeco.net',
                            'abdalim2@gmail.com',
                        ].map(e => e.trim().toLowerCase());

                        // Simple helper to commit in chunks to avoid 500 ops limit
                        let batch = writeBatch(db);
                        let ops = 0;
                        const commitIfNeeded = async (force = false) => {
                            if (ops >= 400 || force) {
                                await batch.commit();
                                batch = writeBatch(db);
                                ops = 0;
                            }
                        };

                        const collectionsToDelete = [
                                'orders',
                                'inventoryTransactions',
                                'mivs',
                                'mrvs',
                                'mrvRequests',
                                'stockTransfers',
                                'inventoryAudits',
                                'auditItems',
                                'auditAdjustments',
                                'stockReconciliations',
                            'reconciliationRequests',
                                'maintenanceRequests',
                                'serviceOrders',
                                'notifications',
                                'fcmTokens',
                            'feedback',
                        ];

            // 1. Reset all inventory item stocks to zero
                        const inventorySnapshot = await getDocs(collection(db, 'inventory'));
                        for (const d of inventorySnapshot.docs) {
                            batch.update(d.ref, { stockByResidence: {}, stock: 0 });
                            ops++; await commitIfNeeded();
                        }
            console.log("Prepared to reset inventory stock.");

            // 2. Delete all documents from operational collections
                                    for (const collectionName of collectionsToDelete) {
                            const snapshot = await getDocs(collection(db, collectionName));
                                        for (const d of snapshot.docs) {
                                            // Special case: feedback has subcollection 'updates'
                                            if (collectionName === 'feedback') {
                                                const updatesSnap = await getDocs(collection(db, `feedback/${d.id}/updates`));
                                                for (const u of updatesSnap.docs) {
                                                    batch.delete(u.ref);
                                                    ops++; await commitIfNeeded();
                                                }
                                            }
                                            batch.delete(d.ref);
                                            ops++; await commitIfNeeded();
                                        }
                            console.log(`Prepared to delete all documents from: ${collectionName}`);
                        }

            // 3. Clear monthly counters (MR, MIV, MRV, Reconciliation)
                        const countersSnap = await getDocs(collection(db, 'counters'));
                        for (const d of countersSnap.docs) {
                            const id = d.id || '';
                            if (/^(mr|miv|mrv|con|svc|trs)-\d{2}-\d{2}$/i.test(id) || /^(mr|miv|mrv|con|svc|trs)-/i.test(id)) {
                                batch.delete(d.ref);
                                ops++; await commitIfNeeded();
                            }
                        }
            console.log('Prepared to clear monthly counters.');

                        // 4. Delete users except keepEmails
                        const usersSnap = await getDocs(collection(db, 'users'));
                        let kept = 0, removed = 0;
                        for (const d of usersSnap.docs) {
                            const data: any = d.data() || {};
                            const email = String(data.email || '').trim().toLowerCase();
                            if (keepEmails.includes(email)) {
                                kept++;
                                continue;
                            }
                            batch.delete(d.ref);
                            removed++; ops++; await commitIfNeeded();
                        }
                        console.log(`Prepared users deletion. kept=${kept}, removed=${removed}`);

                                                // 5. Clean unique_users_emails entirely (collection no longer used)
                                                try {
                                                    const emailsSnap = await getDocs(collection(db, 'unique_users_emails'));
                                                    for (const d of emailsSnap.docs) {
                                                        batch.delete(d.ref);
                                                        ops++; await commitIfNeeded();
                                                    }
                                                    console.log('Prepared to remove unique_users_emails.');
                                                } catch {}

            // Commit all batched writes
                        await commitIfNeeded(true);

                        // Optional: delete Firebase Auth users (server-side) except keepEmails
                        try {
                            const res = await fetch('/api/setup/reset-auth', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ keepEmails, password: RESET_PASSWORD })
                            });
                            if (res.ok) {
                                const info = await res.json();
                                console.log('Auth reset:', info);
                            } else {
                                console.warn('Auth reset skipped or failed:', await res.text());
                            }
                        } catch (e) {
                            console.warn('Auth reset request failed:', e);
                        }

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

    const fixStockData = async () => {
        if (!db) {
            toast({ title: "Firebase Error", description: "Firebase not configured.", variant: "destructive" });
            return;
        }
        setIsFixingStock(true);
        toast({ title: "Starting", description: "Checking inventory for stock issues..." });

        try {
            const batch = writeBatch(db);
            const inventorySnapshot = await getDocs(collection(db, "inventory"));
            let itemsFixed = 0;

            inventorySnapshot.forEach(docSnap => {
                const itemData = docSnap.data() as InventoryItem;
                const stockByResidence = itemData.stockByResidence || {};
                let needsUpdate = false;

                const fixedStock: { [residenceId: string]: number } = {};
                for (const residenceId in stockByResidence) {
                    const stockValue = stockByResidence[residenceId];
                    const numericStock = Number(stockValue);

                    if (isNaN(numericStock) || numericStock < 0) {
                        fixedStock[residenceId] = 0; // Reset invalid or negative values
                        needsUpdate = true;
                    } else {
                        fixedStock[residenceId] = numericStock;
                    }
                }

                if (needsUpdate) {
                    itemsFixed++;
                    batch.update(docSnap.ref, { stockByResidence: fixedStock });
                }
            });
            
            if (itemsFixed > 0) {
                await batch.commit();
                toast({ title: "Success", description: `Corrected stock data for ${itemsFixed} items.` });
            } else {
                toast({ title: "No Issues Found", description: "All inventory stock data appears to be correct." });
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Error", description: `Failed to fix stock data: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsFixingStock(false);
        }
    };


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">System Setup & Configuration</h1>
                <p className="text-muted-foreground">Configure your system settings and manage data</p>
            </div>
            
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        {isAdmin && (
                                            <TabsTrigger value="database" className="flex items-center gap-2">
                                                    <Database className="h-4 w-4" />
                                                    Database Setup
                                            </TabsTrigger>
                                        )}
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
                
                {isAdmin && (
                <TabsContent value="database" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {dangerousEnabled && (
                          <Card>
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                      <Database className="h-5 w-5" />
                                      Initial Data Setup
                                  </CardTitle>
                                  <CardDescription>
                                      This checks if your database is empty and adds sample data for development.
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
                        )}

                        {dangerousEnabled && (
                          <Card>
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                      <Home className="h-5 w-5" />
                                      Add Specific Rooms
                                  </CardTitle>
                                  <CardDescription>
                                      Adds a predefined list of rooms to a specific floor/building. Intended for one-off setup.
                                  </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                  <Button onClick={handleAddRooms} disabled={isAddingRooms} className="w-full">
                                      {isAddingRooms ? (
                                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding Rooms...</>
                                      ) : (
                                          'Add Rooms to B1'
                                      )}
                                  </Button>
                              </CardContent>
                          </Card>
                        )}

                        {dangerousEnabled && (
                          <Card>
                              <CardHeader>
                                  <CardTitle className="text-destructive">Reset Database</CardTitle>
                                  <CardDescription>
                                      <strong>Warning:</strong> Permanently deletes all data. Use only in development or with explicit enable flag.
                                  </CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                          <Button variant="destructive" className="w-full">
                                              Reset All Data
                                          </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                  This action cannot be undone. This will permanently delete all data from the database, including inventory, orders, transfers, and all other records.
                                                  <br /><br />
                                                  Please type <strong>RESET123</strong> to confirm:
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <div className="grid gap-4 py-4">
                                              <Label htmlFor="reset-password">Confirmation Password</Label>
                                              <Input
                                                  id="reset-password"
                                                  type="password"
                                                  value={password}
                                                  onChange={(e) => setPassword(e.target.value)}
                                                  placeholder="Type RESET123 to confirm"
                                              />
                                          </div>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                  onClick={handleResetSystem}
                                                  disabled={isResetting || password !== RESET_PASSWORD}
                                                  className="bg-destructive hover:bg-destructive/90"
                                              >
                                                  {isResetting ? (
                                                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
                                                  ) : (
                                                      'Reset Database'
                                                  )}
                                              </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              </CardContent>
                          </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-yellow-600">Fix Stock Issues</CardTitle>
                                <CardDescription>
                                    Use this tool if you're experiencing stock calculation issues. It will recalculate stock levels based on transaction history.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={fixStockData} disabled={isFixingStock} className="w-full" variant="outline">
                                    {isFixingStock ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fixing Stock...</>
                                    ) : (
                                        'Fix Stock Issues'
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
