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
import { Box, ShoppingBag, Plus, CreditCard, Sparkles, Smartphone, Layers, Package, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
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
  { name: 'Zirconia HT Monolithic Block Credit', basePrice: 2450, unit: 'Crown' },
  { name: 'IPS e.max Lithium Disilicate Credit', basePrice: 3200, unit: 'Crown' },
  { name: 'PFM (Cobalt-Chromium Ceramic) Credit', basePrice: 1600, unit: 'Crown' },
  { name: 'Temporary High-Impact PMMA Credit', basePrice: 850, unit: 'Unit' },
];

export default function DentistInventoryClient({
  initialAllocations,
  currentUser,
  availableLabs,
}: DentistInventoryClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [allocations, setAllocations] = useState<DoctorInventoryItem[]>(initialAllocations);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('cad-blocks');

  // Form State
  const [selectedLabId, setSelectedLabId] = useState<string>(availableLabs[0]?.id || 'lab1');
  const [selectedMaterial, setSelectedMaterial] = useState<string>(MATERIALS[0].name);
  const [units, setUnits] = useState<number>(20);

  const selectedMaterialData = useMemo(() => {
    return MATERIALS.find((m) => m.name === selectedMaterial) || MATERIALS[0];
  }, [selectedMaterial]);

  const bulkDiscount = useMemo(() => {
    if (units >= 100) return 0.15; // 15% discount
    if (units >= 50) return 0.10; // 10% discount
    if (units >= 20) return 0.05; // 5% discount
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
      toast.error('Please select a partner laboratory.');
      return;
    }
    if (units <= 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }

    setIsConfirming(true);
    try {
      const lockedPricePerUnit = Math.round(pricePerUnit * (1 - bulkDiscount));

      // Update local state immediately for responsive UI
      const existingIndex = allocations.findIndex(
        (a) => a.materialName === selectedMaterialData.name && a.labId === selectedLabId
      );

      let updatedAllocations: DoctorInventoryItem[];

      if (existingIndex >= 0) {
        updatedAllocations = [...allocations];
        updatedAllocations[existingIndex] = {
          ...updatedAllocations[existingIndex],
          totalUnits: updatedAllocations[existingIndex].totalUnits + units,
          remainingUnits: updatedAllocations[existingIndex].remainingUnits + units,
          lockedPrice: `₹${lockedPricePerUnit.toLocaleString('en-IN')} / unit`,
        };
      } else {
        const newAllocation: DoctorInventoryItem = {
          id: `di-${Date.now()}`,
          dentistId: currentUser.id,
          labId: selectedLabId,
          materialName: selectedMaterialData.name,
          totalUnits: units,
          remainingUnits: units,
          lockedPrice: `₹${lockedPricePerUnit.toLocaleString('en-IN')} / unit`,
        };
        updatedAllocations = [newAllocation, ...allocations];
      }

      setAllocations(updatedAllocations);

      // Attempt Supabase persistence in background
      try {
        const { data: existing } = await supabase
          .from('doctor_inventory')
          .select('*')
          .eq('dentist_id', currentUser.id)
          .eq('lab_id', selectedLabId)
          .eq('material_name', selectedMaterialData.name)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('doctor_inventory')
            .update({
              total_units: existing.total_units + units,
              remaining_units: existing.remaining_units + units,
              locked_price: lockedPricePerUnit,
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('doctor_inventory').insert({
            dentist_id: currentUser.id,
            lab_id: selectedLabId,
            material_name: selectedMaterialData.name,
            total_units: units,
            remaining_units: units,
            locked_price: lockedPricePerUnit,
          });
        }
      } catch (dbErr) {
        console.warn('Database save note (persisted locally):', dbErr);
      }

      toast.success(`Successfully allocated ${units} units of ${selectedMaterialData.name}!`);
      setIsPurchaseModalOpen(false);
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error('Failed to allocate inventory: ' + error.message);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Package className="w-8 h-8 text-primary" />
            Clinic & CAD/CAM Inventory Hub
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            Monitor pre-paid virtual milling blocks, restorative consumables, and clinical reorder alerts.
          </p>
        </div>
        <Button
          onClick={() => setIsPurchaseModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-2 shadow-sm text-xs"
        >
          <Plus className="w-4 h-4" /> Purchase CAD Block Credits
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val || 'cad-blocks')} className="w-full space-y-6">
        <TabsList className="bg-muted/60 border border-border p-1 rounded-xl inline-flex w-fit max-w-full overflow-x-auto gap-1">
          <TabsTrigger value="cad-blocks" className="text-xs sm:text-sm flex items-center gap-1.5 px-4 py-2">
            <Box className="w-4 h-4" /> CAD/CAM Milling Blocks (Pre-Paid)
          </TabsTrigger>
          <TabsTrigger value="consumables" className="text-xs sm:text-sm flex items-center gap-1.5 px-4 py-2">
            <Layers className="w-4 h-4" /> Clinical Consumables & Materials
          </TabsTrigger>
        </TabsList>

        {/* 1. CAD/CAM BLOCKS TAB */}
        <TabsContent value="cad-blocks" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allocations.map((item) => {
              const usagePercent = item.totalUnits > 0 ? (item.remainingUnits / item.totalUnits) * 100 : 0;
              const isLow = item.remainingUnits <= 10;
              const labName = availableLabs.find((l) => l.id === item.labId)?.name || 'Advance Dental Export';

              return (
                <Card
                  key={item.id}
                  className={`shadow-xs border-border bg-card flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-md ${
                    isLow ? 'border-amber-500/40 bg-amber-500/[0.02]' : ''
                  }`}
                >
                  {isLow && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-amber-500 text-white border-none text-[10px] uppercase font-bold">
                        Low Units
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="p-4 pb-2 border-b border-border">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {labName}
                      </span>
                      <CardTitle className="text-base font-bold text-foreground line-clamp-1">
                        {item.materialName}
                      </CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                        <span className="text-muted-foreground">Available Credits:</span>
                        <span className={`font-mono text-sm font-bold ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`}>
                          {item.remainingUnits} / {item.totalUnits} Units
                        </span>
                      </div>
                      <Progress value={usagePercent} className="h-2 bg-muted" />
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-border pt-3">
                      <span className="text-muted-foreground">Locked Lab SLA:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {String(item.lockedPrice || '₹2,450 / unit')}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/20 border-t border-border p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        setSelectedLabId(item.labId);
                        setSelectedMaterial(item.materialName);
                        setIsPurchaseModalOpen(true);
                      }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Top-up This Block
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 2. CLINICAL CONSUMABLES TAB */}
        <TabsContent value="consumables">
          <ConsumableInventoryHub />
        </TabsContent>
      </Tabs>

      {/* Purchase Modal */}
      <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border shadow-2xl p-6 text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Plus className="w-5 h-5 text-primary" /> Purchase Virtual Milling Block Credits
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pre-pay for CAD/CAM milling units at partner laboratories to lock in wholesale rates and submit cases instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Partner Dental Laboratory</label>
              <Select value={selectedLabId} onValueChange={(val) => setSelectedLabId(val || '')}>
                <SelectTrigger className="w-full bg-background border-border text-foreground text-xs">
                  <SelectValue placeholder="Select partner lab" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-xl">
                  {availableLabs.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id} className="text-xs">
                      {lab.name}
                    </SelectItem>
                  ))}
                  {availableLabs.length === 0 && (
                    <SelectItem value="lab1" className="text-xs">Advance Dental Export</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Material Block Specification</label>
              <Select value={selectedMaterial} onValueChange={(val) => setSelectedMaterial(val || '')}>
                <SelectTrigger className="w-full bg-background border-border text-foreground text-xs">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-xl">
                  {MATERIALS.map((mat) => (
                    <SelectItem key={mat.name} value={mat.name} className="text-xs">
                      {mat.name} (₹{mat.basePrice}/{mat.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-foreground">Number of Block Credits</label>
                {bulkDiscount > 0 && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {(bulkDiscount * 100).toFixed(0)}% Bulk Discount Applied
                  </span>
                )}
              </div>
              <Input
                type="number"
                min="5"
                step="5"
                value={units}
                onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-background border-border text-foreground font-mono font-bold text-xs"
              />
            </div>

            {/* Pricing Breakdown Card */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Base Price ({units} × ₹{pricePerUnit}):</span>
                <span className="font-mono">₹{rawTotal.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Volume Savings:</span>
                  <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-border font-bold text-foreground">
                <span>Net Total Payable:</span>
                <span className="text-base font-mono text-primary">₹{netAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsPurchaseModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePurchaseSubmit}
              disabled={isConfirming}
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              {isConfirming ? 'Processing...' : 'Confirm & Allocate Block'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
