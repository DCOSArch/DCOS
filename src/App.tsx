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
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Polling simulation every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      // Just re-set cases to trigger a subtle re-render / simulated refresh
      setCases([...cases]);
    }, 60000);
    return () => clearInterval(interval);
  }, [cases]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage({ name: 'dashboard' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage({ name: 'login' });
  };

  const toggleUser = () => {
    if (!currentUser) return;
    setCurrentUser(currentUser.id === mockUsers[0].id ? mockUsers[1] : mockUsers[0]);
    setCurrentPage({ name: 'dashboard' });
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
          <Login onLogin={handleLogin} />
        )}
        {currentPage.name === 'dashboard' && currentUser?.role === 'DENTIST' && (
           <DentistDashboard navigateTo={(page) => setCurrentPage(page as any)} cases={cases} setCases={setCases} />
        )}
        {currentPage.name === 'dashboard' && currentUser?.role === 'LAB_ADMIN' && (
           <LabDashboard navigateTo={(page) => setCurrentPage(page as any)} cases={cases} setCases={setCases} inventory={inventory} setInventory={setInventory} />
        )}
        {currentPage.name === 'case_details' && currentUser && (
           <CaseDetails 
             caseId={currentPage.caseId} 
             currentUser={currentUser} 
             goBack={() => setCurrentPage({ name: 'dashboard' })} 
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
