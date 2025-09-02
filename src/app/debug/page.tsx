'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useResidences } from '@/context/residences-context';
import { useToast } from '@/hooks/use-toast';

export default function DebugFacilityComponents() {
  const { residences, addFacilityComponent, addFacility } = useResidences();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const testAddComponent = async () => {
    if (residences.length === 0) {
      toast({
        title: "No residences",
        description: "Please add a residence first",
        variant: "destructive"
      });
      return;
    }

    const complex = residences[0];
    if (complex.buildings.length === 0) {
      toast({
        title: "No buildings",
        description: "Please add a building first",
        variant: "destructive"
      });
      return;
    }

    const building = complex.buildings[0];
    if (building.floors.length === 0) {
      toast({
        title: "No floors",
        description: "Please add a floor first",
        variant: "destructive"
      });
      return;
    }

    const floor = building.floors[0];
    
    // First create a facility if none exists
    let targetFacility = floor.facilities?.find(f => f.name.includes('test'));
    
    if (!targetFacility) {
      setLoading(true);
      try {
        await addFacility(
          complex.id,
          'floor',
          'Test Facility',
          'corridor',
          1,
          building.id,
          floor.id
        );
        
        // Refresh to get the new facility
        const updatedComplex = residences.find(r => r.id === complex.id);
        const updatedBuilding = updatedComplex?.buildings.find(b => b.id === building.id);
        const updatedFloor = updatedBuilding?.floors.find(f => f.id === floor.id);
        targetFacility = updatedFloor?.facilities?.find(f => f.name.includes('Test'));
        
        if (!targetFacility) {
          toast({
            title: "Error",
            description: "Failed to create facility",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error('Error creating facility:', error);
        toast({
          title: "Error",
          description: "Failed to create test facility",
          variant: "destructive"
        });
        return;
      } finally {
        setLoading(false);
      }
    }

    // Now add a component
    setLoading(true);
    try {
      await addFacilityComponent(
        complex.id,
        targetFacility.id,
        'floor',
        {
          name: 'Test Light',
          type: 'light',
          status: 'working'
        },
        building.id,
        floor.id
      );

      toast({
        title: "Success",
        description: "Component added successfully"
      });
    } catch (error) {
      console.error('Error adding component:', error);
      toast({
        title: "Error",
        description: "Failed to add component",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug Facility Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current Data:</h3>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(residences, null, 2)}
            </pre>
          </div>
          
          <Button 
            onClick={testAddComponent}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Working...' : 'Test Add Component'}
          </Button>
          
          <div className="text-xs text-muted-foreground">
            This will add a test facility and component to debug the issue.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
