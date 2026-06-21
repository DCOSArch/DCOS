/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Navbar from '@/src/components/Navbar';
import DentistDashboard from '@/src/pages/DentistDashboard';
import LabDashboard from '@/src/pages/LabDashboard';
import CaseDetails from '@/src/pages/CaseDetails';
import LabDirectory from '@/src/pages/LabDirectory';
import InventoryDashboard from '@/src/pages/InventoryDashboard';
import Login from '@/src/pages/Login';
import { mockUsers, mockCases as initialCases, mockInventory as initialInventory } from '@/src/mockData';
import { Case, InventoryItem, User } from '@/src/types';

import { supabase } from '@/src/lib/supabase';

export type CurrentPage = 
  | { name: 'login' }
  | { name: 'dashboard' } 
  | { name: 'case_details'; caseId: string }
  | { name: 'lab_directory' }
  | { name: 'inventory' };

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<CurrentPage>({ name: 'login' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchCases = async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq(currentUser.role === 'DENTIST' ? 'dentist_id' : 'lab_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (data) {
        const mappedCases: Case[] = data.map((dbCase: any) => ({
          id: dbCase.id,
          patientName: dbCase.patient_name,
          dentistId: dbCase.dentist_id,
          labId: dbCase.lab_id,
          status: dbCase.status,
          urgency: dbCase.urgency,
          requestedTreatment: dbCase.requested_treatment,
          material: dbCase.material,
          createdAt: dbCase.created_at,
          dueDate: dbCase.due_date,
        }));
        setCases(mappedCases);
      }
    };

    fetchCases();
  }, [currentUser]);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session: any) => {
    if (session?.user) {
      // Fetch public profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profile) {
        setCurrentUser({
          id: profile.id,
          name: profile.name,
          role: profile.role,
          labId: profile.lab_id,
          avatarUrl: profile.avatar_url
        });
        setCurrentPage({ name: 'dashboard' });
      }
    } else {
      setCurrentUser(null);
      setCurrentPage({ name: 'login' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleUser = () => {
    // Disabled in real auth mode, handled by logout/login instead
    alert("Switching users is disabled in real auth mode. Please logout and login as a different user.");
  };

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      {currentPage.name !== 'login' && currentUser && (
        <Navbar 
          currentUser={currentUser} 
          onToggleUser={toggleUser} 
          navigateTo={(page) => setCurrentPage(page as any)} 
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          cases={cases}
          onLogout={handleLogout}
        />
      )}
      
      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full relative">
        {currentPage.name === 'login' && (
          <Login />
        )}
        {currentPage.name === 'dashboard' && currentUser?.role === 'DENTIST' && (
           <DentistDashboard navigateTo={(page) => setCurrentPage(page as any)} cases={cases} setCases={setCases} currentUser={currentUser} />
        )}
        {currentPage.name === 'dashboard' && currentUser?.role === 'LAB_ADMIN' && (
           <LabDashboard navigateTo={(page) => setCurrentPage(page as any)} cases={cases} setCases={setCases} inventory={inventory} setInventory={setInventory} />
        )}
        {currentPage.name === 'case_details' && currentUser && (
           <CaseDetails 
             caseId={currentPage.caseId} 
             currentUser={currentUser} 
             goBack={() => setCurrentPage({ name: 'dashboard' })} 
             cases={cases}
           />
        )}
        {currentPage.name === 'lab_directory' && currentUser?.role === 'DENTIST' && (
           <LabDirectory />
        )}
        {currentPage.name === 'inventory' && currentUser?.role === 'LAB_ADMIN' && (
           <InventoryDashboard inventory={inventory} />
        )}
      </main>
    </div>
  );
}
