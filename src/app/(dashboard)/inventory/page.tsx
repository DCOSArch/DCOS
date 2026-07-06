import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Package, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCachedSession, getCachedUserProfile } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export default async function InventoryDashboard() {
  const session = await getCachedSession()

  if (!session) {
    redirect('/login')
  }

  const currentUser = await getCachedUserProfile()

  if (currentUser?.role !== 'LAB_ADMIN') {
    redirect('/')
  }

  const supabase = await createClient()
  const labId = currentUser.lab_id || currentUser.id

  // Fetch inventory items and allocations in parallel
  const [inventoryResult, allocationsResult] = await Promise.all([
    supabase
      .from('inventory_items')
      .select('*')
      .eq('lab_id', labId),
    supabase
      .from('doctor_inventory')
      .select('*')
      .eq('lab_id', labId)
  ])

  const inventoryData = inventoryResult.data
  const allocationsData = allocationsResult.data

  const inventory = inventoryData?.map(i => ({
    id: i.id,
    labId: i.lab_id,
    name: i.name,
    category: i.category,
    quantity: i.quantity,
    unit: i.unit,
    threshold: i.threshold,
    lastRestocked: i.created_at
  })) || []

  const doctorAllocations = allocationsData?.map(item => ({
    id: item.id,
    dentistId: item.dentist_id,
    labId: item.lab_id,
    materialName: item.material_name,
    totalUnits: item.total_units,
    remainingUnits: item.remaining_units,
    lockedPrice: item.locked_price
  })) || []

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Material Inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track materials and get alerts for low stock levels.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {inventory.filter(item => item.quantity <= item.threshold).map(item => (
          <Card key={`alert-${item.id}`} className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-sm font-medium text-red-900 dark:text-red-200">Low Stock Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-red-800 dark:text-red-300">{item.name}</div>
              <p className="text-sm text-red-600/80 dark:text-red-400 mt-1">
                Only {item.quantity} {item.unit} remaining (Threshold: {item.threshold})
              </p>
              <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white">
                <ShoppingCart className="w-4 h-4 mr-2" /> Order Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Current Stock</CardTitle>
          <CardDescription>Live sync with production cases.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const isLow = item.quantity <= item.threshold;
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.category}</TableCell>
                      <TableCell className="text-center font-mono">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isLow ? "destructive" : "secondary"} className={!isLow ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}>
                          {isLow ? 'Reorder Needed' : 'In Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isLow && (
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                            Order
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Partner Clinic Allocations (Bulk Orders)</CardTitle>
          <CardDescription>View inventory blocks pre-purchased by dentists.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead className="text-center">Remaining / Total</TableHead>
                  <TableHead className="text-right">Locked Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorAllocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                      No partner clinic allocations found.
                    </TableCell>
                  </TableRow>
                ) : doctorAllocations.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{item.materialName}</TableCell>
                    <TableCell className="text-center font-mono">
                      {item.remainingUnits} / {item.totalUnits}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {item.lockedPrice.replace('$', '₹')}/unit
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
