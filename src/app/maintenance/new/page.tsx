
'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useMemo, useState } from "react";

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

const formSchema = z.object({
  complex: z.string().min(1, { message: "Please select a complex." }),
  building: z.string().min(1, { message: "Please select a building." }),
  room: z.string().min(1, { message: "Please select a room." }),
  issueTitle: z.string().min(5, { message: "Title must be at least 5 characters." }),
  issueDescription: z.string().min(10, { message: "Description must be at least 10 characters." }),
  priority: z.string().min(1, { message: "Please select a priority level." }),
})

export default function NewMaintenanceRequestPage() {
  const { toast } = useToast();
  const { residences, loading } = useResidences();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      complex: "",
      building: "",
      room: "",
      issueTitle: "",
      issueDescription: "",
      priority: "",
    },
  })

  const selectedComplexId = form.watch("complex");
  const selectedBuildingId = form.watch("building");

  useEffect(() => {
    form.resetField("building", { defaultValue: "" });
    form.resetField("room", { defaultValue: "" });
  }, [selectedComplexId, form]);

  useEffect(() => {
    form.resetField("room", { defaultValue: "" });
  }, [selectedBuildingId, form]);

  const buildings = useMemo(() => {
    if (!selectedComplexId) return [];
    const complex = residences.find((c) => c.id === selectedComplexId);
    return complex ? complex.buildings : [];
  }, [selectedComplexId, residences]);

  const rooms = useMemo(() => {
    if (!selectedBuildingId) return [];
    const complex = residences.find((c) => c.id === selectedComplexId);
    const building = complex?.buildings.find((b) => b.id === selectedBuildingId);
    return building ? building.floors.flatMap(floor => floor.rooms) : [];
  }, [selectedComplexId, selectedBuildingId, residences]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
        title: "Request Submitted",
        description: "Your maintenance request has been successfully submitted.",
        variant: "default",
    })
    form.reset();
  }
  
  if (loading) {
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
                            name="complex"
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
                            name="building"
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
                            name="room"
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
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Submit Request</Button>
                </form>
            </Form>
        </CardContent>
    </Card>
  )
}
