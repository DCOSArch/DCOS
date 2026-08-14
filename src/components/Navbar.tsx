'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Case } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Stethoscope, Sun, Moon, Search, Bell, LogOut, Mic } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/StatusBadge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MediaCaptureHub } from '@/components/media/MediaCaptureHub';

interface NavbarProps {
  currentUser: User;
  cases: Case[];
}

export default function Navbar({ currentUser, cases }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMediaHubOpen, setIsMediaHubOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const [liveNotifications, setLiveNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 1. Fetch initial notification-worthy timeline events
    const fetchInitialNotifications = async () => {
      let query = supabase
        .from('timeline_events')
        .select('id, status_update, notes, timestamp, case_id, cases!inner(patient_name, dentist_id, lab_id)');
      
      if (currentUser.role === 'DENTIST') {
        query = query
          .eq('cases.dentist_id', currentUser.id)
          .in('visibility', ['EXTERNAL', 'BOTH']);
      } else {
        // Find the lab ID. If role is LAB_ADMIN, use currentUser.labId or currentUser.id
        const userLabId = currentUser.labId || currentUser.id;
        query = query
          .eq('cases.lab_id', userLabId)
          .in('visibility', ['INTERNAL', 'BOTH']);
      }

      const { data } = await query
        .order('timestamp', { ascending: false })
        .limit(10);

      if (data) {
        setLiveNotifications(data.map((n: any) => ({
          id: n.id,
          statusUpdate: n.status_update,
          notes: n.notes,
          timestamp: n.timestamp,
          caseId: n.case_id,
          patientName: n.cases.patient_name
        })));
      }
    };
    fetchInitialNotifications();

    // 2. Play Audio chime using Web Audio API
    const playChime = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Osc 1 (lower note)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.12);
 
        // Osc 2 (higher note) after 150ms
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.18);
        }, 150);
      } catch (err) {
        console.error('Audio beep failed', err);
      }
    };

    // 3. Subscribe to real-time timeline events globally
    const channel = supabase.channel('global_timeline_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'timeline_events'
      }, async (payload) => {
        const newEvent = payload.new as any;
        
        // Fetch case info to verify ownership and visibility
        const { data: caseInfo } = await supabase
          .from('cases')
          .select('patient_name, dentist_id, lab_id')
          .eq('id', newEvent.case_id)
          .single();

        if (!caseInfo) return;

        let isAuthorized = false;
        if (currentUser.role === 'DENTIST') {
          isAuthorized = caseInfo.dentist_id === currentUser.id && (newEvent.visibility === 'EXTERNAL' || newEvent.visibility === 'BOTH');
        } else {
          const userLabId = currentUser.labId || currentUser.id;
          isAuthorized = caseInfo.lab_id === userLabId && (newEvent.visibility === 'INTERNAL' || newEvent.visibility === 'BOTH');
        }

        if (!isAuthorized) return;

        const newNotif = {
          id: newEvent.id,
          statusUpdate: newEvent.status_update,
          notes: newEvent.notes,
          timestamp: newEvent.timestamp,
          caseId: newEvent.case_id,
          patientName: caseInfo.patient_name
        };

        setLiveNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
        setUnreadCount(prev => prev + 1);
        playChime();
        
        // Trigger toast
        const toast = (await import('sonner')).toast;
        toast.info(`Case Update: ${newNotif.patientName} - ${newNotif.statusUpdate}`);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, currentUser.role, currentUser.labId, supabase]);

  useEffect(() => {
    // Initialize dark mode from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved === 'true') {
        document.documentElement.classList.add('dark');
        setIsDarkMode(true);
      } else if (saved === 'false') {
        document.documentElement.classList.remove('dark');
        setIsDarkMode(false);
      } else {
        // Default to dark (Monokai) mode on first visit
        document.documentElement.classList.add('dark');
        setIsDarkMode(true);
        localStorage.setItem('darkMode', 'true');
      }
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
    const newMode = !isDarkMode;
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
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
              <>
                <Link href="/flow">
                  <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground hover:text-foreground">
                    Flow
                  </Button>
                </Link>
                <Link href="/patients">
                  <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground">
                    Patients
                  </Button>
                </Link>
                <Link href="/inventory">
                  <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground hover:text-foreground">
                    Inventory
                  </Button>
                </Link>
                <Link href="/billing">
                  <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground hover:text-foreground">
                    Billing
                  </Button>
                </Link>
                <Link href="/lab-directory">
                  <Button variant="ghost" size="sm" className="hidden lg:flex text-muted-foreground hover:text-foreground">
                    Labs
                  </Button>
                </Link>
              </>
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
                        <p className="text-xs text-muted-foreground">ID: #{c.id.slice(-8).toUpperCase()}</p>
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
          {(() => {
            const hasNotifications = liveNotifications.length > 0 || unreadCount > 0;
            return (
              <>
                <DropdownMenu onOpenChange={(open) => { if (open) setUnreadCount(0); }}>
                  <DropdownMenuTrigger
                    className="relative text-muted-foreground hidden sm:flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground outline-none"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="px-1.5 py-1 text-xs font-semibold text-muted-foreground flex justify-between items-center bg-muted/10">
                      <span>Notifications</span>
                      {unreadCount > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount} new</span>}
                    </div>
                    <DropdownMenuSeparator />
                    <div className="flex flex-col max-h-[240px] overflow-y-auto">
                      {liveNotifications.length === 0 ? (
                        <div className="px-4 py-3 text-center text-xs text-muted-foreground">
                          No notifications
                        </div>
                      ) : (
                        liveNotifications.slice(0, 4).map(c => (
                          <DropdownMenuItem key={c.id} className="cursor-pointer flex flex-col items-start gap-1 p-3 border-b border-border/40 last:border-0 hover:bg-muted/60" onClick={() => handleSearchSelect(c.caseId)}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-semibold text-xs text-foreground truncate max-w-[120px]">{c.patientName}</span>
                              <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-1.5 py-0.5 rounded-md font-medium">{c.statusUpdate}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed text-left">{c.notes}</span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="w-full text-center text-xs font-medium text-primary justify-center cursor-pointer py-2 hover:bg-primary/5"
                      onSelect={(e) => {
                        e.preventDefault();
                        setIsNotificationsOpen(true);
                      }}
                    >
                      View all notifications
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                  <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-card border border-border shadow-2xl">
                    <div className="bg-muted/30 p-6 border-b border-border">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                          <Bell className="w-5 h-5 text-primary" /> Notifications
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                          Stay updated on critical status updates and quality checks for your cases.
                        </DialogDescription>
                      </DialogHeader>
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto p-4 flex flex-col gap-3">
                      {liveNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Bell className="w-6 h-6 text-muted-foreground/60" />
                          </div>
                          <p className="font-semibold text-foreground">All caught up!</p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                            You have no pending case updates or delivery notifications at this time.
                          </p>
                        </div>
                      ) : (
                        liveNotifications.map((c) => (
                          <div
                            key={`notif-modal-${c.id}`}
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              handleSearchSelect(c.caseId);
                            }}
                            className="group flex flex-col items-start gap-1.5 p-3 rounded-lg border border-border bg-background hover:bg-muted/55 hover:border-primary/20 cursor-pointer transition-all duration-200"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-semibold text-sm group-hover:text-primary transition-colors duration-150 text-foreground">
                                {c.patientName}
                              </span>
                              <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-1.5 py-0.5 rounded-md font-medium">{c.statusUpdate}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground flex flex-col gap-1 w-full text-left">
                              <p className="leading-relaxed">{c.notes}</p>
                              <div className="flex justify-between items-center mt-1 border-t border-border/50 pt-1 text-[9px]">
                                <span>Case ID: #{c.caseId.slice(-8).toUpperCase()}</span>
                                <span>{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-border bg-muted/10 flex justify-end">
                      <Button onClick={() => setIsNotificationsOpen(false)} variant="outline" size="sm">
                        Close
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            );
          })()}

          {currentUser.role === 'DENTIST' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMediaHubOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 transition-all hover:shadow-xs rounded-lg h-9"
            >
              <Mic className="w-3.5 h-3.5 text-primary animate-pulse" />
              Capture Hub
            </Button>
          )}

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

      {/* Multimodal Media Capture Cockpit Modal */}
      {isMediaHubOpen && (
        <MediaCaptureHub
          isOpen={isMediaHubOpen}
          onClose={() => setIsMediaHubOpen(false)}
          patientId="pat-active-session"
          patientName="Active Patient"
          encounterId="enc-active-session"
          dentistId={currentUser.id}
        />
      )}
    </nav>
  );
}
