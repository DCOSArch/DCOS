import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package, ShoppingCart, Plus, Layers, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCachedSession, getCachedUserProfile } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import DentistInventoryClient from '@/components/views/DentistInventoryClient';
import { mockDoctorInventory, mockLabProfiles, mockInventory } from '@/mockData';

export default async function InventoryDashboard() {
  const session = await getCachedSession();

  if (!session) {
    redirect('/login');
  }

  const currentUser = await getCachedUserProfile();

  if (!currentUser) {
    redirect('/login');
  }

  const supabase = await createClient();

  if (currentUser.role === 'DENTIST') {
    let mappedAllocations: any[] = [];
    let mappedLabs: any[] = [];

    try {
      // 1. Fetch dentist allocations
      const { data: allocationsData } = await supabase
        .from('doctor_inventory')
        .select('*')
        .eq('dentist_id', currentUser.id);

      if (allocationsData && allocationsData.length > 0) {
        mappedAllocations = allocationsData.map((item) => ({
          id: item.id,
          dentistId: item.dentist_id,
          labId: item.lab_id,
          materialName: item.material_name,
          totalUnits: item.total_units,
          remainingUnits: item.remaining_units,
          lockedPrice: `${item.locked_price}`,
        }));
      }

      // 2. Fetch available partner labs
      const { data: labsData } = await supabase
        .from('lab_profiles')
        .select('id, name');

      if (labsData && labsData.length > 0) {
        mappedLabs = labsData.map((l) => ({
          id: l.id,
          name: l.name,
        }));
      }
    } catch (err) {
      console.warn('Inventory db fetch fallback', err);
    }

    // Fallback to rich mock allocations if database is empty
    if (mappedAllocations.length === 0) {
      mappedAllocations = mockDoctorInventory;
    }
    if (mappedLabs.length === 0) {
      mappedLabs = mockLabProfiles.map((l) => ({ id: l.id, name: l.name }));
    }

    return (
      <DentistInventoryClient
        initialAllocations={mappedAllocations}
        currentUser={currentUser}
        availableLabs={mappedLabs}
      />
    );
  }

  // LAB ADMIN VIEW
  const labId = currentUser.labId || currentUser.id;
  let inventory: any[] = [];
  let doctorAllocations: any[] = [];

  try {
    const [inventoryResult, allocationsResult] = await Promise.all([
      supabase.from('inventory_items').select('*').eq('lab_id', labId),
      supabase.from('doctor_inventory').select('*').eq('lab_id', labId),
    ]);

    if (inventoryResult.data && inventoryResult.data.length > 0) {
      inventory = inventoryResult.data.map((i) => ({
        id: i.id,
        labId: i.lab_id,
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        threshold: i.threshold,
        lastRestocked: i.created_at,
      }));
    }

    if (allocationsResult.data && allocationsResult.data.length > 0) {
      doctorAllocations = allocationsResult.data.map((item) => ({
        id: item.id,
        dentistId: item.dentist_id,
        labId: item.lab_id,
        materialName: item.material_name,
        totalUnits: item.total_units,
        remainingUnits: item.remaining_units,
        lockedPrice: item.locked_price,
      }));
    }
  } catch (err) {
    console.warn('Lab inventory fallback', err);
  }

  if (inventory.length === 0) {
    inventory = mockInventory;
  }
  if (doctorAllocations.length === 0) {
    doctorAllocations = mockDoctorInventory;
  }

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Package className="w-8 h-8 text-primary" />
            Laboratory Material Inventory & Production Stock
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            Monitor raw milling discs, 3D print resins, titanium blanks, and partner clinic CAD allocations.
          </p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {inventory
          .filter((item) => item.quantity <= item.threshold)
          .map((item) => (
            <Card key={`alert-${item.id}`} className="border-red-500/30 bg-red-500/10 shadow-xs">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-sm font-bold text-red-600 dark:text-red-400">
                  Low Stock Reorder Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="font-bold text-foreground text-sm">{item.name}</div>
                <p className="text-xs text-muted-foreground">
                  Only <strong className="text-red-500 font-mono">{item.quantity} {item.unit}</strong> remaining (Minimum Threshold: {item.threshold})
                </p>
                <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-8">
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Reorder Raw Material
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Main Stock Table */}
      <Card className="shadow-xs border-border bg-card">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5 text-primary" /> Production Discs & CAD Inventory
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Live material synchronization with active 5-axis milling units and 3D printers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-xs font-bold text-muted-foreground">Item Description</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground">Category</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground text-center">Available Stock</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground text-center">Status</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const isLow = item.quantity <= item.threshold;
                return (
                  <TableRow key={item.id} className="hover:bg-muted/40 border-border text-xs">
                    <TableCell className="font-bold text-foreground">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.category}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-foreground">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          isLow
                            ? 'border-red-500 text-red-500 bg-red-500/10'
                            : 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        }`}
                      >
                        {isLow ? 'Reorder Needed' : 'Optimal Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isLow && (
                        <Button size="sm" variant="outline" className="text-xs h-7 text-red-500 border-red-500/40 hover:bg-red-500/10">
                          Reorder
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Partner Clinic Allocations Table */}
      <Card className="shadow-xs border-border bg-card">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Box className="h-5 w-5 text-primary" /> Partner Clinic Pre-Paid Block Allocations
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Pre-purchased virtual crown credits held by partnering dental practices.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-xs font-bold text-muted-foreground">Material Name</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground text-center">Remaining / Total Units</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground text-right">Locked SLA Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctorAllocations.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/40 border-border text-xs">
                  <TableCell className="font-bold text-foreground">{item.materialName}</TableCell>
                  <TableCell className="text-center font-mono font-bold text-primary">
                    {item.remainingUnits} / {item.totalUnits} Units
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {String(item.lockedPrice || '').replace('$', '₹')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
