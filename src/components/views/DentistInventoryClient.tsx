'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Box, ShoppingBag, Plus, CreditCard, Sparkles, Smartphone, Layers, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { User, DoctorInventoryItem } from '@/types';
import { ConsumableInventoryHub } from '@/components/inventory/ConsumableInventoryHub';

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
  const [activeTab, setActiveTab] = useState<string>('cad-blocks');

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
  const upiId = 'dcos@upi';
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
      const { data: existing } = await supabase
        .from('doctor_inventory')
        .select('*')
        .eq('dentist_id', currentUser.id)
        .eq('lab_id', selectedLabId)
        .eq('material_name', selectedMaterialData.name)
        .maybeSingle();

      if (existing) {
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out text-foreground">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-7 h-7 text-[#F92672]" />
            Clinic & CAD/CAM Inventory Hub
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            Monitor pre-paid virtual milling blocks, restorative consumables, and clinical reorder alerts.
          </p>
        </div>
        <Button onClick={() => setIsPurchaseModalOpen(true)} className="bg-primary hover:bg-primary/95 text-primary-foreground gap-2 shadow-md text-xs">
          <Plus className="w-4 h-4" /> Purchase CAD Blocks
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#1E1F1C] border border-border p-1 rounded-xl">
          <TabsTrigger value="cad-blocks" className="text-xs sm:text-sm data-[state=active]:bg-[#F92672] data-[state=active]:text-white flex items-center gap-1.5">
            <Box className="w-4 h-4" /> CAD/CAM Milling Blocks (Pre-Paid)
          </TabsTrigger>
          <TabsTrigger value="consumables" className="text-xs sm:text-sm data-[state=active]:bg-[#F92672] data-[state=active]:text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Clinical Consumables & Stock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cad-blocks" className="space-y-6">
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
                          ₹{parseFloat(item.lockedPrice || '2450').toLocaleString('en-IN')}/crown
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
                        <ShoppingBag className="w-3.5 h-3.5 mr-2" /> Top-up This Block
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="consumables">
          <ConsumableInventoryHub />
        </TabsContent>
      </Tabs>

      {/* Purchase Modal */}
      <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="w-5 h-5 text-primary" /> Purchase CAD/CAM Material Blocks
            </DialogTitle>
            <DialogDescription>
              Buy pre-paid milling credits in bulk. Units are automatically debited when cases transition to in-production.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Partner Dental Laboratory</label>
              <Select value={selectedLabId} onValueChange={(val) => setSelectedLabId(val || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select partner lab" />
                </SelectTrigger>
                <SelectContent>
                  {availableLabs.map(lab => (
                    <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>
                  ))}
                  {availableLabs.length === 0 && (
                    <SelectItem value="lab1">Advance Dental Export</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Material Type</label>
              <Select value={selectedMaterial} onValueChange={(val) => setSelectedMaterial(val || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS.map(mat => (
                    <SelectItem key={mat.name} value={mat.name}>
                      {mat.name} (Base: ₹{mat.basePrice}/{mat.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Quantity (Units/Crowns)</label>
                {bulkDiscount > 0 && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                    {(bulkDiscount * 100)}% Bulk Discount Applied
                  </Badge>
                )}
              </div>
              <Input 
                type="number" 
                min={1} 
                max={500} 
                value={units} 
                onChange={(e) => setUnits(parseInt(e.target.value) || 0)}
                className="font-mono text-base"
              />
            </div>

            <div className="bg-muted/40 p-4 rounded-xl space-y-2 text-sm border border-border/50">
              <div className="flex justify-between text-muted-foreground">
                <span>Base Subtotal:</span>
                <span className="font-mono">₹{rawTotal.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Bulk Tier Savings:</span>
                  <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-border/60 pt-2 text-foreground">
                <span>Total Amount:</span>
                <span className="font-mono text-primary">₹{netAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsPurchaseModalOpen(false)} disabled={isConfirming}>
              Cancel
            </Button>
            <Button onClick={handlePurchaseSubmit} disabled={isConfirming} className="bg-primary hover:bg-primary/95 text-primary-foreground gap-2 font-semibold">
              <CreditCard className="w-4 h-4" />
              {isConfirming ? "Processing..." : `Pay ₹${netAmount.toLocaleString('en-IN')}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
