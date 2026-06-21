import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Star, Clock, DollarSign, Plus, X, Lock, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

// Define the Lab profile type matching DB schema
interface LabProfile {
  id: string;
  name: string;
  rating: number;
  reviews_count: number;
  services: string[];
  pricing: string;
  turnaround_time: string;
  contact_email: string | null;
  contact_phone: string | null;
}

export default function LabDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [labs, setLabs] = useState<LabProfile[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabName, setNewLabName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState<LabProfile | null>(null);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('lab_profiles')
      .select('*')
      .order('rating', { ascending: false });
      
    if (data) {
      setLabs(data);
    } else if (error) {
      console.error("Error fetching labs:", error);
    }
    setIsLoading(false);
  };

  const filteredLabs = labs.filter(lab => 
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (lab.services && lab.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleAddLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabName.trim()) return;
    
    // Perform real insert
    const newLabData = {
      name: newLabName,
      rating: 5.0, // Default for new
      reviews_count: 0,
      services: ['General Dentistry', 'Crowns'], // Defaults
      pricing: '$$',
      turnaround_time: '5-7 Business Days',
      contact_email: 'contact@' + newLabName.toLowerCase().replace(/\s+/g, '') + '.com',
      contact_phone: '(555) 000-0000'
    };

    const { data, error } = await supabase
      .from('lab_profiles')
      .insert([newLabData])
      .select()
      .single();

    if (data) {
      setLabs([data, ...labs]);
      setNewLabName('');
      setShowAddModal(false);
    } else if (error) {
      console.error("Error inserting lab:", error);
      alert("Failed to add lab.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Laboratory Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Discover and connect with top-rated dental laboratories.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add Lab
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search labs by name or service..." 
          className="pl-9 bg-background shadow-sm border-muted"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading laboratories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.map(lab => (
            <Card key={lab.id} className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-all duration-300 border border-muted group hover:border-primary/20 bg-card">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{lab.name}</CardTitle>
                  <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{lab.rating} <span className="font-normal opacity-70">({lab.reviews_count || 0})</span></span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 pt-4 pb-2 flex flex-col gap-4">
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Services</div>
                  <div className="flex flex-wrap gap-1.5">
                    {lab.services && lab.services.map((service, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-muted/50 text-xs font-medium text-foreground hover:bg-muted">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Turnaround
                    </div>
                    <div className="text-sm font-medium">{lab.turnaround_time}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Pricing
                    </div>
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{lab.pricing}</div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 flex flex-col gap-3">
                <div className="w-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md p-2 flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] font-medium leading-tight">Secure Chat Unlocks After Order</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSelectedLab(lab)}
                >
                  View Full Profile
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {filteredLabs.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
              <p className="font-medium text-foreground">No laboratories found</p>
              <p className="text-sm mt-1">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      )}

      {/* Lab Profile Modal */}
      {selectedLab && (
        <Dialog open={!!selectedLab} onOpenChange={(open) => !open && setSelectedLab(null)}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card">
            <div className="bg-muted/30 p-6 border-b border-border">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedLab.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-full text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{selectedLab.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({selectedLab.reviews_count || 0} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact Information</h3>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{selectedLab.contact_email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{selectedLab.contact_phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Turnaround Time
                  </h3>
                  <p className="text-sm font-medium">{selectedLab.turnaround_time}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Pricing Tier
                  </h3>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{selectedLab.pricing}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Available Services</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedLab.services && selectedLab.services.map((service, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 bg-muted/50 text-sm font-medium">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter className="p-4 border-t border-border bg-muted/10 sm:justify-between">
              <p className="text-xs text-muted-foreground text-left py-2">
                Use the Dentist Dashboard to place an order and unlock secure chat.
              </p>
              <Button onClick={() => setSelectedLab(null)}>Close Profile</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
