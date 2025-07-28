
'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast";
import { useResidences } from "@/context/residences-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useMaintenance } from "@/context/maintenance-context";
import { Loader2 } from "lucide-react";
import { useUsers } from "@/context/users-context";


const formSchema = z.object({
  complexId: z.string().min(1, { message: "Please select a complex." }),
  buildingId: z.string().min(1, { message: "Please select a building." }),
  roomId: z.string().min(1, { message: "Please select a room." }),
  issueTitle: z.string().min(5, { message: "Title must be at least 5 characters." }),
  issueDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  priority: z.enum(["Low", "Medium", "High"]),
})

export default function NewMaintenanceRequestPage() {
  const { toast } = useToast();
  const { residences, loading: residencesLoading, loadResidences } = useResidences();
  const { createRequest, loading: maintenanceLoading } = useMaintenance();
  const { currentUser } = useUsers();
  const router = useRouter();

   useEffect(() => {
    if (residences.length === 0) {
      loadResidences();
    }
  }, [loadResidences, residences.length]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      complexId: "",
      buildingId: "",
      roomId: "",
      issueTitle: "",
      issueDescription: "",
      priority: "Medium",
    },
  })

  const selectedComplexId = form.watch("complexId");
  const selectedBuildingId = form.watch("buildingId");

  useEffect(() => {
    form.resetField("buildingId", { defaultValue: "" });
    form.resetField("roomId", { defaultValue: "" });
  }, [selectedComplexId, form]);

  useEffect(() => {
    form.resetField("roomId", { defaultValue: "" });
  }, [selectedBuildingId, form]);

  const selectedComplex = useMemo(() => residences.find((c) => c.id === selectedComplexId), [selectedComplexId, residences]);
  const buildings = useMemo(() => selectedComplex?.buildings || [], [selectedComplex]);
  const selectedBuilding = useMemo(() => buildings.find((b) => b.id === selectedBuildingId), [selectedBuildingId, buildings]);
  const rooms = useMemo(() => selectedBuilding?.floors.flatMap(floor => floor.rooms) || [], [selectedBuilding]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) {
        toast({ title: "Error", description: "You must be logged in to create a request.", variant: "destructive" });
        return;
    }
    const complex = selectedComplex;
    const building = selectedBuilding;
    const room = rooms.find(r => r.id === values.roomId);

    if (!complex || !building || !room) {
        toast({ title: "Error", description: "Invalid location selected. Please try again.", variant: "destructive" });
        return;
    }
    
    await createRequest({
        ...values,
        complexName: complex.name,
        buildingName: building.name,
        roomName: room.name,
        requestedById: currentUser.id,
    });
    
    toast({
        title: "Request Submitted",
        description: "Your maintenance request has been successfully submitted.",
        variant: "default",
    })
    form.reset();
    router.push("/maintenance");
  }
  
  if (residencesLoading) {
    return (
       <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-32" />
        </CardContent>
    </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle>New Maintenance Request</CardTitle>
            <CardDescription>Fill out the form below to submit a new maintenance request.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FormField
                            control={form.control}
                            name="complexId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Complex</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a complex" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {residences.map(complex => (
                                                <SelectItem key={complex.id} value={complex.id}>{complex.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="buildingId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Building</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedComplexId}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a building" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {buildings.map(building => (
                                                <SelectItem key={building.id} value={building.id}>{building.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="roomId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Room / Unit</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBuildingId}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {rooms.map(room => (
                                                 <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="issueTitle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Issue Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Leaky Faucet in Kitchen" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="issueDescription"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Issue Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Provide a detailed description of the issue..." className="min-h-[150px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select priority level" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={maintenanceLoading}>
                        {maintenanceLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Submit Request
                    </Button>
                </form>
            </Form>
        </CardContent>
    </Card>
  )
}
