import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InventoryItem } from '@/src/types';

interface InventoryDashboardProps {
  inventory: InventoryItem[];
}

export default function InventoryDashboard({ inventory }: InventoryDashboardProps) {
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
              <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white" onClick={() => alert(`Ordering ${item.name}...`)}>
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
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => alert(`Ordering ${item.name}...`)}>
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
    </div>
  );
}
