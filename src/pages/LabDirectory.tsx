import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Clock, DollarSign, Mail, Phone, Plus, X } from 'lucide-react';
import { mockLabProfiles } from '@/src/mockData';

export default function LabDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [labs, setLabs] = useState(mockLabProfiles);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabName, setNewLabName] = useState('');

  const filteredLabs = labs.filter(lab => 
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    lab.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabName.trim()) return;
    
    const newLab = {
      id: `lab-${Date.now()}`,
      name: newLabName,
      rating: 5.0,
      reviewsCount: 0,
      services: ['General Dentistry', 'Crowns'],
      pricing: '$$',
      turnaroundTime: '5-7 Business Days',
      contactEmail: 'contact@' + newLabName.toLowerCase().replace(/\s+/g, '') + '.com',
      contactPhone: '(555) 000-0000'
    };
    
    setLabs([newLab, ...labs]);
    setNewLabName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Laboratory Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm">Discover and connect with top-rated dental laboratories.</p>
        </div>
        <Button className="flex items-center gap-2" variant="default" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Lab
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search labs by name or service..." 
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {filteredLabs.map(lab => (
          <Card key={lab.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl flex justify-between items-start">
                <span className="font-semibold text-foreground">{lab.name}</span>
                <div className="flex items-center gap-1 text-sm font-medium text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {lab.rating} ({lab.reviewsCount})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Services</h4>
                <div className="flex flex-wrap gap-1.5">
                  {lab.services.map(service => (
                    <Badge key={service} variant="secondary" className="font-normal">{service}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-2 border-t border-border">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Turnaround</h4>
                  <p className="text-sm font-medium">{lab.turnaroundTime}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Pricing</h4>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{lab.pricing}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3 bg-muted/30 pt-4 rounded-b-xl border-t border-border">
              <div className="flex justify-between items-center text-xs text-muted-foreground w-full px-1">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lab.contactEmail}</span>
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lab.contactPhone}</span>
              </div>
              <Button className="w-full" variant="outline">View Full Profile</Button>
            </CardFooter>
          </Card>
        ))}
        
        {filteredLabs.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">No laboratories found matching your search.</p>
          </div>
        )}
      </div>

      {/* Add Lab Modal overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <form onSubmit={handleAddLab}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Register New Laboratory</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Add a new lab to the directory ecosystem.</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="-mr-2">
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Laboratory Name</label>
                  <Input 
                    placeholder="e.g. Apex Dental Systems" 
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                    autoFocus
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border bg-muted/30 pt-4 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" disabled={!newLabName.trim()}>Add Lab</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
