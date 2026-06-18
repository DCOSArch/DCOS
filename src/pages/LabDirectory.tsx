import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Clock, DollarSign, Mail, Phone } from 'lucide-react';
import { mockLabProfiles } from '@/src/mockData';

export default function LabDirectory() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLabs = mockLabProfiles.filter(lab => 
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    lab.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Laboratory Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm">Discover and connect with top-rated dental laboratories.</p>
        </div>
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
    </div>
  );
}
