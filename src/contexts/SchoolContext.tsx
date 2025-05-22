'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { schoolsCollection } from '@/lib/firestore';
import { School } from '@/types';

interface SchoolContextType {
  schools: School[];
  currentSchool: School | null;
  setCurrentSchool: (school: School | null) => void;
  loading: boolean;
  error: string | null;
  refreshSchools: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = async () => {
    if (!currentUser) {
      setSchools([]);
      setCurrentSchool(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedSchools = await schoolsCollection.getAll<School>(currentUser.uid);
      setSchools(fetchedSchools);
      
      // Set current school to the first one if none is selected
      if (fetchedSchools.length > 0 && !currentSchool) {
        setCurrentSchool(fetchedSchools[0]);
      } else if (currentSchool) {
        // Make sure the current school is still in the list
        const stillExists = fetchedSchools.some(school => school.id === currentSchool.id);
        if (!stillExists && fetchedSchools.length > 0) {
          setCurrentSchool(fetchedSchools[0]);
        } else if (!stillExists) {
          setCurrentSchool(null);
        }
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError('Failed to load schools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [currentUser]);

  const value = {
    schools,
    currentSchool,
    setCurrentSchool,
    loading,
    error,
    refreshSchools: fetchSchools,
  };

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
}
