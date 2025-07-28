
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, getDocs, setDoc, Timestamp, query, where } from "firebase/firestore";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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
    const [password, setPassword] = useState('');
    
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
            toast({ title: "Firebase Error", description: firebaseErrorMessage, variant: "destructive" });
            return;
        }
        if (password !== RESET_PASSWORD) {
            toast({ title: "Error", description: "Incorrect password.", variant: "destructive" });
            return;
        }
        setIsResetting(true);

        try {
            const batch = writeBatch(db);

            // 1. Reset all inventory item stocks to zero
            const inventorySnapshot = await getDocs(collection(db, "inventory"));
            inventorySnapshot.forEach(doc => {
                batch.update(doc.ref, { stockByResidence: {} });
            });
            console.log("Prepared to reset inventory stock.");

            // 2. Delete all orders
            const ordersSnapshot = await getDocs(collection(db, "orders"));
            ordersSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            console.log("Prepared to delete all orders.");

            // 3. Delete all inventory transactions
            const transactionsSnapshot = await getDocs(collection(db, "inventoryTransactions"));
            transactionsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            console.log("Prepared to delete all inventory transactions.");

            // Commit all batched writes
            await batch.commit();

            toast({ title: "Success", description: "System has been reset. All orders and transactions deleted, and inventory stock zeroed out." });
            setPassword('');
        } catch (error) {
            console.error("Error resetting system:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Error", description: `Failed to reset system: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsResetting(false);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center h-full gap-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Initial Data Setup</CardTitle>
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

            <Card className="w-full max-w-md border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Advanced Settings - System Reset</CardTitle>
                    <CardDescription>
                        This will permanently delete all orders and inventory transactions. It will also reset the stock of all inventory items to zero. User and residence data will not be affected. This action cannot be undone.
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
        </div>
    );
}
