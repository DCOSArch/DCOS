'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Case } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Stethoscope, Sun, Moon, Search, Bell, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/StatusBadge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface NavbarProps {
  currentUser: User;
  cases: Case[];
}

export default function Navbar({ currentUser, cases }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check local storage or system preference for dark mode
    if (typeof document !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    }
  }, []);

  const searchResults = cases.filter(c => 
    c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSelect = (caseId: string) => {
    setSearchQuery('');
    setShowResults(false);
    router.push(`/cases/${caseId}`);
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background border-border shadow-sm transition-colors duration-200">
      <div className="flex h-16 items-center px-4 md:px-6 lg:px-8 max-w-7xl mx-auto gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary cursor-pointer shrink-0">
          <Stethoscope className="w-6 h-6 text-primary" />
          <span className="hidden sm:inline">DentalConnect <span className="font-light text-muted-foreground">OS</span></span>
        </Link>
        
        <div className="flex-1 max-w-md ml-4 flex items-center gap-4">
          <div className="flex items-center gap-1 sm:gap-2 mr-2">
            {currentUser.role === 'DENTIST' && (
              <Link href="/lab-directory">
                <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground">
                  Lab Directory
                </Button>
              </Link>
            )}
            {currentUser.role === 'LAB_ADMIN' && (
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground">
                  Inventory
                </Button>
              </Link>
            )}
          </div>
          <div className="flex-1 relative" ref={searchRef}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients or case IDs..."
              className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1 focus-visible:ring-primary h-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
            />
            {showResults && searchQuery && (
              <div className="absolute top-full left-0 mt-1 w-full bg-background border border-border rounded-md shadow-lg py-2 max-h-80 overflow-y-auto z-50">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-2 text-sm text-muted-foreground text-center">No cases found.</p>
                ) : (
                  searchResults.map((c) => (
                    <div 
                      key={c.id} 
                      className="px-4 py-2 hover:bg-muted cursor-pointer flex items-center justify-between"
                      onClick={() => handleSearchSelect(c.id)}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.patientName}</p>
                        <p className="text-xs text-muted-foreground">ID: #{c.id.toUpperCase()}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-2 md:space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="relative text-muted-foreground hidden sm:flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground outline-none"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Notifications</div>
              <DropdownMenuSeparator />
              <div className="flex flex-col">
                {cases.filter(c => c.status === 'DELIVERED' || c.status === 'QUALITY_CHECK').slice(0, 3).map(c => (
                  <DropdownMenuItem key={c.id} className="cursor-pointer flex flex-col items-start gap-1 p-3" onClick={() => handleSearchSelect(c.id)}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-sm">{c.patientName}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <span className="text-xs text-muted-foreground">Case #{c.id.toUpperCase()} was updated.</span>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="w-full text-center text-sm font-medium text-primary justify-center cursor-pointer">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="text-muted-foreground hidden sm:flex">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Button variant="outline" size="sm" onClick={handleLogout} className="hidden lg:flex items-center gap-2 text-destructive border-destructive/20 hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="flex lg:hidden text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-border">
            <div className="flex flex-col text-right hidden md:flex">
              <span className="text-sm font-medium leading-none">{currentUser.name}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {currentUser.role === 'DENTIST' ? 'Dentist' : 'Laboratory Admin'}
              </span>
            </div>
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
}
