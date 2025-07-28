
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Complex } from "@/context/residences-context";
import type { InventoryItem } from "@/context/inventory-context";
import type { OrderItem } from "@/context/orders-context";

export default function SetupPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    // This state is no longer strictly needed for stock but can be kept for other setup purposes.
    const [firstResidenceId, setFirstResidenceId] = useState<string | null>(null);
    const [firstResidenceName, setFirstResidenceName] = useState<string | null>(null);
    const [firstUserId, setFirstUserId] = useState<string | null>(null);


    const seedInitialData = async () => {
        if (!db) {
            toast({ title: "Firebase Error", description: "Firebase is not configured.", variant: "destructive" });
            return;
        }
        setIsLoading(true);

        try {
            const batch = writeBatch(db);

            // --- 1. SEED RESIDENCES (if empty) ---
            const residencesCollection = collection(db, "residences");
            const residencesSnapshot = await getDocs(residencesCollection);
            let residenceId = firstResidenceId;
            let residenceName = firstResidenceName;

            if (residencesSnapshot.empty) {
                const docRef = doc(residencesCollection);
                residenceId = docRef.id;
                residenceName = "Seaside Residences";
                const sampleComplex: Omit<Complex, 'id'> = {
                    name: residenceName,
                    city: "Dubai",
                    managerId: '', // Will be set later if needed
                    buildings: [
                        { id: 'building-1', name: "Building A", floors: [{ id: 'floor-a1', name: "Floor 1", rooms: [{ id: 'room-a101', name: 'A-101' }, { id: 'room-a102', name: 'A-102' }] }] }
                    ]
                };
                batch.set(docRef, { ...sampleComplex, id: residenceId });
                console.log("Residences data prepared for seeding.");
            } else {
                residenceId = residencesSnapshot.docs[0].id;
                residenceName = residencesSnapshot.docs[0].data().name;
                toast({ title: "Skipped", description: "Residences collection already has data." });
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
                    // Start with ZERO stock
                    const newItem = { ...item, id: docRef.id, stock: 0, stockByResidence: {} };
                    batch.set(docRef, newItem);
                    sampleItemsForOrder.push({ ...newItem, quantity: Math.floor(Math.random() * 100) + 50 });
                });
                console.log("Inventory data prepared for seeding (with zero stock).");
            } else {
                 toast({ title: "Skipped", description: "Inventory collection already has data." });
            }

            // Commit inventory and residences before creating order
            await batch.commit();

            // --- 3. SEED USERS (for order assignment) ---
            const usersCollection = collection(db, "users");
            const usersSnapshot = await getDocs(usersCollection);
            let userId = firstUserId;

            if (usersSnapshot.empty) {
                 toast({ title: "Warning", description: "No users found. Please create an Admin user to assign the initial order." });
            } else {
                // Find an admin or the first user
                const adminUser = usersSnapshot.docs.find(doc => doc.data().role === 'Admin');
                userId = adminUser ? adminUser.id : usersSnapshot.docs[0].id;
            }

            // --- 4. SEED INITIAL PURCHASE ORDER (if empty) ---
            const ordersCollection = collection(db, "orders");
            const ordersSnapshot = await getDocs(ordersCollection);
            
            if (ordersSnapshot.empty && sampleItemsForOrder.length > 0 && residenceId && residenceName && userId) {
                 const newOrder = {
                    date: Timestamp.now(),
                    residence: residenceName,
                    residenceId: residenceId,
                    requestedById: userId, // Assign to first available user
                    approvedById: '',
                    items: sampleItemsForOrder,
                    status: 'Approved', // Pre-approve it to be ready for receiving
                };
                const orderRef = doc(ordersCollection, "00-00-001"); // First order
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

    return (
        <div className="flex justify-center items-center h-full">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Initial Data Setup</CardTitle>
                    <CardDescription>
                        This process checks if your database is empty and adds sample data. It will create residences and inventory items (with 0 stock). It will then create an initial **approved** purchase order. You must go to "Receive Materials" to complete the process and add stock.
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
        </div>
    );
}
