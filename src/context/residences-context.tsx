
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define types for our data structure
interface Room {
  id: string;
  name: string;
}

interface Floor {
  id: string;
  name: string;
  rooms: Room[];
}

interface Building {
  id: string;
  name: string;
  floors: Floor[];
}

interface Complex {
  id: string;
  name: string;
  buildings: Building[];
}

// Define the shape of our context
interface ResidencesContextType {
  residences: Complex[];
  setResidences: React.Dispatch<React.SetStateAction<Complex[]>>;
}

// Initial data
const initialResidencesData: Complex[] = [
  {
    id: 'complex-1',
    name: 'Seaside Residences',
    buildings: [
      {
        id: 'building-a',
        name: 'Building A',
        floors: [
          {
            id: 'floor-1',
            name: 'Floor 1',
            rooms: [
              { id: 'room-101', name: 'Room 101' },
              { id: 'room-102', name: 'Room 102' },
              { id: 'facility-bath', name: 'Main Bathroom' },
            ],
          },
          {
            id: 'floor-2',
            name: 'Floor 2',
            rooms: [{ id: 'room-201', name: 'Room 201' }],
          },
        ],
      },
      {
        id: 'building-b',
        name: 'Building B',
        floors: [
          {
            id: 'floor-1b',
            name: 'Floor 1',
            rooms: [{ id: 'room-101b', name: 'Room 101' }],
          },
        ],
      },
    ],
  },
];

// Create the context with a default value
const ResidencesContext = createContext<ResidencesContextType | undefined>(undefined);

// Create a provider component
export const ResidencesProvider = ({ children }: { children: ReactNode }) => {
  const [residences, setResidences] = useState<Complex[]>(() => {
    if (typeof window === 'undefined') {
      return initialResidencesData;
    }
    try {
      const storedResidences = window.localStorage.getItem('residences');
      return storedResidences ? JSON.parse(storedResidences) : initialResidencesData;
    } catch (error) {
      console.error("Error reading residences from localStorage", error);
      return initialResidencesData;
    }
  });

  useEffect(() => {
    try {
        window.localStorage.setItem('residences', JSON.stringify(residences));
    } catch (error) {
        console.error("Error writing residences to localStorage", error);
    }
  }, [residences]);


  return (
    <ResidencesContext.Provider value={{ residences, setResidences }}>
      {children}
    </ResidencesContext.Provider>
  );
};

// Create a custom hook to use the context
export const useResidences = () => {
  const context = useContext(ResidencesContext);
  if (context === undefined) {
    throw new Error('useResidences must be used within a ResidencesProvider');
  }
  return context;
};
