import { useState, useRef, useEffect } from 'react';
import { User, Case } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ArrowLeftRight, Stethoscope, Sun, Moon, Search, Bell, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { mockCases } from '@/src/mockData';
import { StatusBadge } from '@/src/components/StatusBadge';

interface NavbarProps {
  currentUser: User;
  onToggleUser: () => void;
  navigateTo: (page: { name: 'dashboard' } | { name: 'case_details'; caseId: string } | { name: 'lab_directory' } | { name: 'inventory' }) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  cases: Case[];
  onLogout: () => void;
}

export default function Navbar({ currentUser, onToggleUser, navigateTo, isDarkMode, toggleDarkMode, cases, onLogout }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
    navigateTo({ name: 'case_details', caseId });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background border-border shadow-sm transition-colors duration-200">
      <div className="flex h-16 items-center px-4 md:px-6 lg:px-8 max-w-7xl mx-auto gap-4">
        <div 
          className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary cursor-pointer shrink-0"
          onClick={() => navigateTo({ name: 'dashboard' })}
        >
          <Stethoscope className="w-6 h-6 text-primary" />
          <span className="hidden sm:inline">DentalConnect <span className="font-light text-muted-foreground">OS</span></span>
        </div>
        
        <div className="flex-1 max-w-md ml-4 flex items-center gap-4">
          <div className="flex items-center gap-1 sm:gap-2 mr-2">
            {currentUser.role === 'DENTIST' && (
              <Button variant="ghost" size="sm" onClick={() => navigateTo({ name: 'lab_directory' })} className="hidden sm:flex text-muted-foreground hover:text-foreground">
                Lab Directory
              </Button>
            )}
            {currentUser.role === 'LAB_ADMIN' && (
              <Button variant="ghost" size="sm" onClick={() => navigateTo({ name: 'inventory' })} className="hidden sm:flex text-muted-foreground hover:text-foreground">
                Inventory
              </Button>
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

          <Button variant="outline" size="sm" onClick={onLogout} className="hidden lg:flex items-center gap-2 text-destructive border-destructive/20 hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout} className="flex lg:hidden text-destructive hover:text-destructive hover:bg-destructive/10">
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
