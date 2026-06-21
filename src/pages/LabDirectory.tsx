import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Clock, DollarSign, Plus, X, Lock } from 'lucide-react';
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
                <Button variant="outline" className="w-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
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

      {/* Add Lab Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-semibold">Add New Laboratory</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowAddModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleAddLab} className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Laboratory Name</label>
                  <Input 
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                    placeholder="e.g. Precision Dental Arts"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">Additional details will be set to defaults and can be edited later.</p>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit">Add Lab</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
