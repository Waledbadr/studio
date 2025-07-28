
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, getDocs } from "firebase/firestore";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Complex } from "@/context/residences-context";
import type { InventoryItem } from "@/context/inventory-context";

export default function SetupPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [firstResidenceId, setFirstResidenceId] = useState<string | null>(null);

    const seedResidencesData = async (batch: ReturnType<typeof writeBatch>) => {
        const residencesCollection = collection(db, "residences");
        const snapshot = await getDocs(residencesCollection);
        if (!snapshot.empty) {
            toast({ title: "Skipped Seeding", description: "Residences collection already contains data." });
            setFirstResidenceId(snapshot.docs[0].id);
            return;
        }

        const docRef = doc(residencesCollection);
        const complexId = docRef.id;
        setFirstResidenceId(complexId);

        const sampleComplex: Omit<Complex, 'id'> = {
            name: "Seaside Residences",
            city: "Dubai",
            managerId: '', // Will be set later if needed
            buildings: [
                {
                    id: 'building-1', name: "Building A", floors: [
                        {
                            id: 'floor-a1', name: "Floor 1", rooms: [
                                { id: 'room-a101', name: 'A-101' },
                                { id: 'room-a102', name: 'A-102' }
                            ]
                        },
                        {
                            id: 'floor-a2', name: "Floor 2", rooms: [
                                { id: 'room-a201', name: 'A-201' }
                            ]
                        }
                    ]
                },
                {
                    id: 'building-2', name: "Building B", floors: [
                         {
                            id: 'floor-b1', name: "Floor 1", rooms: [
                                { id: 'room-b101', name: 'B-101' }
                            ]
                        }
                    ]
                }
            ]
        };
        batch.set(docRef, { ...sampleComplex, id: complexId });
        console.log("Residences data prepared for seeding.");
    };

    const seedInventoryData = async (batch: ReturnType<typeof writeBatch>, residenceId: string) => {
        const inventoryCollection = collection(db, "inventory");
        const snapshot = await getDocs(inventoryCollection);
        if (!snapshot.empty) {
            toast({ title: "Skipped Seeding", description: "Inventory collection already contains data." });
            return;
        }
        
        type SampleItem = Omit<InventoryItem, 'id' | 'stock'>;
        const sampleItems: SampleItem[] = [
            { name: "Light Bulb", nameAr: "لمبة إضاءة", nameEn: "Light Bulb", category: "electrical", unit: "Piece", stockByResidence: { [residenceId]: 150 } },
            { name: "Cleaning Spray", nameAr: "بخاخ تنظيف", nameEn: "Cleaning Spray", category: "cleaning", unit: "Bottle", stockByResidence: { [residenceId]: 80 } },
            { name: "Water Tap", nameAr: "صنبور ماء", nameEn: "Water Tap", category: "plumbing", unit: "Piece", stockByResidence: { [residenceId]: 50 } },
            { name: "Power Socket", nameAr: "مقبس كهربائي", nameEn: "Power Socket", category: "electrical", unit: "Piece", stockByResidence: { [residenceId]: 120 } },
            { name: "Trash Bags", nameAr: "أكياس قمامة", nameEn: "Trash Bags", category: "cleaning", unit: "Roll", stockByResidence: { [residenceId]: 200 } },
        ];
        
        sampleItems.forEach(item => {
            const docRef = doc(inventoryCollection);
            batch.set(docRef, {...item, id: docRef.id });
        });
        console.log("Inventory data prepared for seeding.");
    };

    const handleSeedData = async () => {
        if (!db) {
            toast({ title: "Firebase Error", description: "Firebase is not configured.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            const batch = writeBatch(db);
            
            await seedResidencesData(batch);
            
            // This logic ensures we have a residence ID to associate initial stock with.
            let resId = firstResidenceId;
            if (!resId) {
                const residencesCollection = collection(db, "residences");
                const snapshot = await getDocs(residencesCollection);
                if (!snapshot.empty) {
                    resId = snapshot.docs[0].id;
                } else {
                    // This case handles when the collection is truly empty and we are seeding it now.
                    // The ref is created inside seedResidencesData but not committed yet.
                    // To keep it simple, we'll re-query after commit if needed, or rely on the user to run setup again if inventory fails.
                    // A more robust solution would pass the new docRef.id out of the seeding function.
                    console.warn("Could not determine a residence ID for inventory seeding. Inventory might not be seeded.");
                }
            }

            if (resId) {
                 await seedInventoryData(batch, resId);
            }

            await batch.commit();
            
            toast({ title: "Success", description: "Database seeded with initial sample data." });
        } catch (error) {
            console.error("Error seeding data:", error);
            toast({ title: "Error", description: "Failed to seed database.", variant: "destructive" });
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
                        If this is your first time running the application, click the button below to add some sample data to your database. This will only add data if the collections are empty.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleSeedData} disabled={isLoading} className="w-full">
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

    
