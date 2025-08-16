'use client';

import React, { useMemo } from 'react';
import { AccommodationProvider, useAccommodation } from '@/context/accommodation-context';
import { useUsers } from '@/context/users-context';

function TreeNode({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-4">
      {children}
    </div>
  );
}

function ResidencesTree() {
  const { residences, loading } = useAccommodation();
  const { currentUser } = useUsers();

  const isAdmin = currentUser?.role === 'Admin';

  const visibleResidences = useMemo(() => {
    if (!residences) return [];
    if (isAdmin) return residences;
    const assigned = new Set(currentUser?.assignedResidences || []);
    return residences.filter(r => assigned.has(r.id));
  }, [residences, currentUser, isAdmin]);

  if (loading) return <div>Loading...</div>;
  if (!visibleResidences || visibleResidences.length === 0) return (
    <div className="p-6">
      <div className="rounded-md border p-6 bg-white/70">
        <h3 className="text-lg font-semibold mb-2">لا توجد سكنات لعرضها</h3>
        <p className="text-sm text-muted-foreground">المستخدم الحالي لا يمتلك سكنات.</p>
      </div>
    </div>
  );

  // Group by region (use address as region; fallback 'Uncategorized')
  const byRegion = visibleResidences.reduce((acc: Record<string, typeof visibleResidences>, r) => {
    const region = (r.address || 'Uncategorized') as string;
    if (!acc[region]) acc[region] = [];
    acc[region].push(r);
    return acc;
  }, {} as Record<string, typeof visibleResidences>);

  return (
    <div className="space-y-4">
      {Object.entries(byRegion).map(([region, group]) => (
        <details key={region} className="border rounded-md bg-white/80">
          <summary className="px-4 py-3 cursor-pointer font-semibold flex justify-between items-center">
            <span>{region}</span>
            <span className="text-sm text-muted-foreground">{group.length} سكن</span>
          </summary>
          <TreeNode>
            {group.map(residence => (
              <details key={residence.id} className="mb-2">
                <summary className="cursor-pointer font-medium">{residence.name} <span className="text-sm text-muted-foreground">{residence.address ? `— ${residence.address}` : ''}</span></summary>
                <TreeNode>
                  {/* Buildings -> Floors -> Rooms */}
                  {Array.isArray(residence.buildings) && residence.buildings.length > 0 ? (
                    residence.buildings.map(building => (
                      <details key={building.id} className="mb-1">
                        <summary className="cursor-pointer">🏢 {building.name}</summary>
                        <TreeNode>
                          {Array.isArray(building.floors) && building.floors.length > 0 ? (
                            building.floors.map(floor => (
                              <details key={floor.id} className="mb-1">
                                <summary className="cursor-pointer">🧱 {floor.name}</summary>
                                <TreeNode>
                                  {Array.isArray(floor.rooms) && floor.rooms.length > 0 ? (
                                    <ul className="list-disc list-inside text-sm">
                                      {floor.rooms.map(room => (
                                        <li key={room.id} className="py-1">🚪 {room.name}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="text-xs text-muted-foreground">لا توجد غرف</div>
                                  )}
                                </TreeNode>
                              </details>
                            ))
                          ) : (
                            <div className="text-xs text-muted-foreground">لا توجد طوابق</div>
                          )}
                        </TreeNode>
                      </details>
                    ))
                  ) : (
                    // If there are top-level rooms (no buildings)
                    Array.isArray(residence.rooms) && residence.rooms.length > 0 ? (
                      <ul className="list-disc list-inside text-sm mt-2">
                        {residence.rooms.map(rm => (
                          <li key={rm.id} className="py-1">🚪 {rm.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-2">لا توجد مباني أو غرف</div>
                    )
                  )}
                </TreeNode>
              </details>
            ))}
          </TreeNode>
        </details>
      ))}
    </div>
  );
}

export default function AccommodationResidencesPage() {
  return (
    <AccommodationProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">الشجرية: السكنات</h1>
        </div>
        <ResidencesTree />
      </div>
    </AccommodationProvider>
  );
}
