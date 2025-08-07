'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useResidences } from '@/context/residences-context';

export default function ResidencesPage() {
  const { residences, buildings, rooms, loading } = useResidences();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Residences Management</h1>
          <p className="text-muted-foreground">
            Manage residential properties, locations, and facility information
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Residences</CardTitle>
            <CardDescription>Active residential properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : residences.length}</div>
            <p className="text-xs text-muted-foreground">{loading ? 'Loading...' : 'Properties loaded'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buildings</CardTitle>
            <CardDescription>Total buildings across all residences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : buildings.length}</div>
            <p className="text-xs text-muted-foreground">{loading ? 'Loading...' : 'Buildings loaded'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Units/Rooms</CardTitle>
            <CardDescription>Total residential units</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : rooms.length}</div>
            <p className="text-xs text-muted-foreground">{loading ? 'Loading...' : 'Units loaded'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Residences List</CardTitle>
            <CardDescription>
              View and manage all residential properties in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {loading ? 'Loading residences...' : residences.length === 0 ? 'Residences management functionality is being developed.' : `${residences.length} residences found in the system.`}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This page will include residence creation, editing, and location management features.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}