'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Box, ShoppingBag, Plus, CreditCard, Sparkles, QrCode, Smartphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { User, DoctorInventoryItem } from '@/types';

interface DentistInventoryClientProps {
  initialAllocations: DoctorInventoryItem[];
  currentUser: User;
  availableLabs: { id: string; name: string }[];
}

const MATERIALS = [
  { name: 'Zirconia Premium', basePrice: 1200, unit: 'Crown' },
  { name: 'E-Max (Lithium Disilicate)', basePrice: 1500, unit: 'Crown' },
  { name: 'PFM (Cobalt-Chromium)', basePrice: 800, unit: 'Crown' },
  { name: 'Temporary PMMA', basePrice: 400, unit: 'Unit' }
];

export default function DentistInventoryClient({
  initialAllocations,
  currentUser,
  availableLabs
}: DentistInventoryClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [allocations, setAllocations] = useState<DoctorInventoryItem[]>(initialAllocations);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Form State
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>(MATERIALS[0].name);
  const [units, setUnits] = useState<number>(20);

  const selectedMaterialData = useMemo(() => {
    return MATERIALS.find(m => m.name === selectedMaterial) || MATERIALS[0];
  }, [selectedMaterial]);

  const bulkDiscount = useMemo(() => {
    if (units >= 100) return 0.15; // 15% discount
    if (units >= 50) return 0.10;  // 10% discount
    if (units >= 20) return 0.05;  // 5% discount
    return 0;
  }, [units]);

  const pricePerUnit = selectedMaterialData.basePrice;
  const rawTotal = pricePerUnit * units;
  const discountAmount = rawTotal * bulkDiscount;
  const netAmount = rawTotal - discountAmount;

  // UPI Deep Link Generation
  const upiId = 'dcos@upi'; // Default clinical UPI Gateway ID
  const payeeName = 'DentalConnect OS Lab JV';
  const transactionNote = `DCOS ${units}x ${selectedMaterialData.name} credit`;
  const upiIntentUrl = useMemo(() => {
    const encodedName = encodeURIComponent(payeeName);
    const encodedNote = encodeURIComponent(transactionNote);
    return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${netAmount.toFixed(2)}&cu=INR&tn=${encodedNote}`;
  }, [netAmount, selectedMaterialData.name, units]);

  const handlePurchaseSubmit = async () => {
    if (!selectedLabId) {
      toast.error("Please select a partner laboratory.");
      return;
    }
    if (units <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }

    setIsConfirming(true);
    try {
      // 1. Check if allocation already exists
      const { data: existing } = await supabase
        .from('doctor_inventory')
        .select('*')
        .eq('dentist_id', currentUser.id)
        .eq('lab_id', selectedLabId)
        .eq('material_name', selectedMaterialData.name)
        .maybeSingle();

      if (existing) {
        // Update existing allocation
        const { error } = await supabase
          .from('doctor_inventory')
          .update({
            total_units: existing.total_units + units,
            remaining_units: existing.remaining_units + units,
            locked_price: pricePerUnit * (1 - bulkDiscount)
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new allocation record
        const { error } = await supabase
          .from('doctor_inventory')
          .insert({
            dentist_id: currentUser.id,
            lab_id: selectedLabId,
            material_name: selectedMaterialData.name,
            total_units: units,
            remaining_units: units,
            locked_price: pricePerUnit * (1 - bulkDiscount)
          });

        if (error) throw error;
      }

      // Re-fetch doctor_inventory to update state
      const { data: refreshed } = await supabase
        .from('doctor_inventory')
        .select('*')
        .eq('dentist_id', currentUser.id);

      if (refreshed) {
        setAllocations(refreshed.map((item: any) => ({
          id: item.id,
          dentistId: item.dentist_id,
          labId: item.lab_id,
          materialName: item.material_name,
          totalUnits: item.total_units,
          remainingUnits: item.remaining_units,
          lockedPrice: `${item.locked_price}`
        })));
      }

      toast.success(`Successfully credited ${units} units of ${selectedMaterialData.name}!`);
      setIsPurchaseModalOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error("Failed to allocate inventory: " + error.message);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Virtual Inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm">Purchase and monitor pre-paid materials for production crowns.</p>
        </div>
        <Button onClick={() => setIsPurchaseModalOpen(true)} className="bg-primary hover:bg-primary/95 text-primary-foreground gap-2 shadow-md">
          <Plus className="w-4 h-4" /> Purchase Materials
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allocations.length === 0 ? (
          <Card className="col-span-full border-dashed border-border py-12 flex flex-col items-center justify-center text-center">
            <Box className="w-12 h-12 text-muted-foreground/60 mb-3" />
            <h3 className="font-semibold text-lg text-foreground">No active material blocks</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Purchase pre-paid zirconia or composite blocks to submit cases instantly.
            </p>
            <Button onClick={() => setIsPurchaseModalOpen(true)} className="mt-4" variant="outline">
              Buy First Block
            </Button>
          </Card>
        ) : (
          allocations.map(item => {
            const usagePercent = item.totalUnits > 0 ? (item.remainingUnits / item.totalUnits) * 100 : 0;
            const isLow = item.remainingUnits <= 5;
            const labName = availableLabs.find(l => l.id === item.labId)?.name || 'Partner Lab';

            return (
              <Card key={item.id} className={`shadow-sm border-border flex flex-col relative overflow-hidden transition-all duration-200 hover:shadow-md ${isLow ? 'border-amber-500/30 bg-amber-500/[0.02]' : ''}`}>
                {isLow && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-amber-600 hover:bg-amber-600 text-white border-none text-[10px] uppercase font-bold">Low Balance</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{labName}</div>
                    <CardTitle className="text-lg font-bold flex items-center justify-between text-foreground">
                      {item.materialName}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold text-foreground">
                      <span>Available Balance:</span>
                      <span className={isLow ? 'text-amber-600 font-bold' : 'text-primary'}>
                        {item.remainingUnits} / {item.totalUnits} Units
                      </span>
                    </div>
                    <Progress value={usagePercent} className={`h-2 ${isLow ? 'bg-amber-100 dark:bg-amber-950/40' : ''}`} />
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-border/60 pt-3">
                    <span className="text-muted-foreground">Locked Price:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{parseFloat(item.lockedPrice).toLocaleString('en-IN')}/crown
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t border-border/40 p-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5"
                    onClick={() => {
                      setSelectedLabId(item.labId);
                      setSelectedMaterial(item.materialName);
                      setIsPurchaseModalOpen(true);
                    }}
                  >
                    Top Up Materials
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* UPI Intent Top-up Modal Dialog */}
      <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ShoppingBag className="w-5 h-5 text-primary" /> Purchase Inventory Block
            </DialogTitle>
            <DialogDescription>
              Buy pre-paid material credits to lock in joint-venture crown rates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-foreground">Select Lab Partner</label>
              <Select value={selectedLabId} onValueChange={(val) => setSelectedLabId(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Laboratory" />
                </SelectTrigger>
                <SelectContent>
                  {availableLabs.map(lab => (
                    <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-foreground">Select Material</label>
              <Select value={selectedMaterial} onValueChange={(val) => setSelectedMaterial(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Material Type" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS.map(mat => (
                    <SelectItem key={mat.name} value={mat.name}>
                      {mat.name} (₹{mat.basePrice}/{mat.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">Number of Crowns / Units</label>
                {bulkDiscount > 0 && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 border-none font-bold text-[10px]">
                    <Sparkles className="w-3 h-3 mr-1" /> {bulkDiscount * 100}% Bulk Discount
                  </Badge>
                )}
              </div>
              <Input 
                type="number" 
                min={5} 
                max={500} 
                value={units} 
                onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 0))}
              />
              <p className="text-[10px] text-muted-foreground">Bulk breaks: 20 units (5% off), 50 units (10% off), 100 units (15% off).</p>
            </div>

            {/* Price Calculations */}
            <div className="bg-muted/40 rounded-lg p-3.5 space-y-2 border border-border">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Base Cost ({units} x ₹{pricePerUnit}):</span>
                <span>₹{rawTotal.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-medium">
                  <span>Bulk Discount:</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold border-t border-border pt-2 text-foreground">
                <span>Total Amount Payable:</span>
                <span className="text-primary text-base">₹{netAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* UPI Intent deep-linking & payment details */}
            <div className="border border-border/80 rounded-lg overflow-hidden">
              <div className="bg-muted/50 p-2.5 text-xs font-semibold text-muted-foreground border-b border-border flex items-center justify-between">
                <span>UPI SECURE DEEP-LINK GATEWAY</span>
                <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-600 bg-emerald-50 font-bold">ACTIVE</Badge>
              </div>
              <div className="p-4 space-y-3 bg-background">
                {/* Mobile Intent Direct Link */}
                <div className="sm:hidden w-full">
                  <a 
                    href={upiIntentUrl}
                    className="flex w-full items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md h-10 font-medium text-sm transition-colors shadow-sm"
                  >
                    <Smartphone className="w-4 h-4" />
                    Open Native UPI App (Pay ₹{netAmount.toLocaleString('en-IN')})
                  </a>
                  <p className="text-[10px] text-center text-muted-foreground mt-1">Triggers PhonePe, GPay, Paytm, or BHIM instantly.</p>
                </div>

                {/* Desktop QR representation */}
                <div className="hidden sm:flex flex-col items-center py-2 bg-zinc-50 dark:bg-zinc-950/20 rounded border border-dashed border-border">
                  <div className="w-32 h-32 bg-white p-2 rounded shadow-sm border border-zinc-200 flex items-center justify-center relative">
                    <QrCode className="w-full h-full text-slate-800" strokeWidth={1} />
                    <div className="absolute inset-0 flex items-center justify-center bg-white/95 opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-[9px] font-bold text-center text-slate-800 p-2">Scan with PhonePe, BHIM, Paytm, or GPay</p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-foreground mt-3">Scan QR Code to Pay</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{upiId} • ₹{netAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-9" onClick={() => setIsPurchaseModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handlePurchaseSubmit} 
              disabled={isConfirming || !selectedLabId} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
            >
              {isConfirming ? 'Crediting Account...' : 'Confirm UPI Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
