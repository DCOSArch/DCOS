'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConsumableItem, InventoryMovement, ConsumableCategory } from '@/types';
import {
  getConsumableInventory,
  saveConsumableInventory,
  getInventoryMovements,
  logInventoryMovement,
} from '@/lib/services';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  CheckCircle2,
  Boxes,
  Layers,
} from 'lucide-react';

const CATEGORY_MAP: Record<ConsumableCategory, { label: string; color: string }> = {
  RESTORATIVE: { label: 'Restorative & Composites', color: 'var(--primary)' },
  ENDODONTICS: { label: 'Endodontics & Rotary', color: '#F59E0B' },
  PROSTHODONTICS: { label: 'Prostho & Impression', color: '#8B5CF6' },
  SURGICAL: { label: 'Surgical & Anesthetics', color: '#EF4444' },
  PERIODONTICS: { label: 'Periodontics & Scalers', color: '#10B981' },
  PREVENTIVE: { label: 'Preventive & Sealants', color: '#06B6D4' },
  PPE_DISPOSABLES: { label: 'PPE & Sterilization', color: '#64748B' },
};

export function ConsumableInventoryHub() {
  const [items, setItems] = useState<ConsumableItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<ConsumableItem | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(1);
  const [stockAction, setStockAction] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');
  const [stockReason, setStockReason] = useState('');

  // Add Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ConsumableCategory>('RESTORATIVE');
  const [newItemBrand, setNewItemBrand] = useState('');
  const [newItemStock, setNewItemStock] = useState(10);
  const [newItemThreshold, setNewItemThreshold] = useState(5);
  const [newItemUnit, setNewItemUnit] = useState('Syringes');
  const [newItemCost, setNewItemCost] = useState(1200);

  useEffect(() => {
    setItems(getConsumableInventory());
    setMovements(getInventoryMovements());
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const lowStockItems = items.filter((item) => item.currentStock <= item.minThreshold);

  const handleStockUpdate = () => {
    if (!showStockModal) return;

    const previousStock = showStockModal.currentStock;
    const qty = Number(stockDelta);
    const newStock =
      stockAction === 'STOCK_IN'
        ? previousStock + qty
        : Math.max(0, previousStock - qty);

    const updatedItems = items.map((it) =>
      it.id === showStockModal.id ? { ...it, currentStock: newStock } : it
    );

    setItems(updatedItems);
    saveConsumableInventory(updatedItems);

    const newMovement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      itemId: showStockModal.id,
      itemName: showStockModal.name,
      movementType: stockAction,
      quantity: qty,
      previousStock,
      newStock,
      reason: stockReason || (stockAction === 'STOCK_IN' ? 'Manual Restock' : 'Clinical Procedure Usage'),
      timestamp: new Date().toISOString(),
      performedBy: 'Dr. Aryan Sharma',
    };

    logInventoryMovement(newMovement);
    setMovements([newMovement, ...movements]);
    setShowStockModal(null);
    setStockReason('');
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;

    const createdItem: ConsumableItem = {
      id: `cons-${Date.now()}`,
      dentistId: 'u1',
      name: newItemName.trim(),
      category: newItemCategory,
      brand: newItemBrand.trim() || 'Generic Dental',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      currentStock: Number(newItemStock),
      minThreshold: Number(newItemThreshold),
      unit: newItemUnit,
      costPerUnit: Number(newItemCost),
      lastRestocked: new Date().toISOString().slice(0, 10),
    };

    const nextItems = [createdItem, ...items];
    setItems(nextItems);
    saveConsumableInventory(nextItems);
    setShowAddModal(false);
    setNewItemName('');
  };

  return (
    <div className="space-y-6">
      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <Card className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {lowStockItems.length} Consumable Items at Reorder Threshold
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Items requiring restock: {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit} left)`).join(', ')}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-400">
              Low Stock
            </Badge>
          </div>
        </Card>
      )}

      {/* Action Bar & Category Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials, composites, anesthetics, burs..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(CATEGORY_MAP).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Clinical Item
          </Button>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isLow = item.currentStock <= item.minThreshold;
          const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.RESTORATIVE;

          return (
            <Card key={item.id} className="bg-card border-border hover:border-primary/50 transition-all shadow-xs">
              <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground">{item.sku}</span>
                  <CardTitle className="text-sm font-bold text-foreground mt-0.5 line-clamp-1">{item.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{item.brand}</CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium"
                  style={{ borderColor: catInfo.color, color: catInfo.color }}
                >
                  {catInfo.label.split(' ')[0]}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/40 border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Current Stock:</span>
                    <span className={`text-base font-extrabold font-mono ${isLow ? 'text-red-500' : 'text-foreground'}`}>
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[10px]">Min Reorder Level:</span>
                    <span className="font-mono text-muted-foreground">{item.minThreshold} {item.unit}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                  <span>Unit Cost: <strong className="text-foreground">₹{item.costPerUnit.toLocaleString('en-IN')}</strong></span>
                  {item.location && <span>Loc: <strong className="text-foreground">{item.location}</strong></span>}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowStockModal(item);
                      setStockAction('STOCK_IN');
                    }}
                    className="flex-1 text-xs h-7 border-border hover:border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  >
                    <ArrowDownLeft className="w-3 h-3 mr-1" /> Stock In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowStockModal(item);
                      setStockAction('STOCK_OUT');
                    }}
                    className="flex-1 text-xs h-7 border-border hover:border-red-500 text-red-500"
                  >
                    <ArrowUpRight className="w-3 h-3 mr-1" /> Dispense
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stock In / Dispense Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-card-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
                {stockAction === 'STOCK_IN' ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                {stockAction === 'STOCK_IN' ? 'Log Material Stock-In' : 'Dispense Material'}
              </h3>
              <button type="button" onClick={() => setShowStockModal(null)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs">
              <span className="text-muted-foreground">Target Consumable Item:</span>
              <p className="font-bold text-foreground text-sm mt-0.5">{showStockModal.name}</p>
              <p className="text-muted-foreground mt-0.5">Current Balance: {showStockModal.currentStock} {showStockModal.unit}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Quantity ({showStockModal.unit}):</label>
                <input
                  type="number"
                  min="1"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Procedure / Order Reason:</label>
                <input
                  type="text"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder={stockAction === 'STOCK_IN' ? 'e.g. Monthly replenishment PO' : 'e.g. Tooth 36 Endodontic Procedure'}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowStockModal(null)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleStockUpdate} className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold">
                Confirm {stockAction === 'STOCK_IN' ? 'Stock In' : 'Dispensation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Consumable Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-card-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
                <Plus className="w-4 h-4 text-primary" /> Add New Clinical Consumable Item
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Item / Material Name:</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. 3M ESPE Scotchbond Universal Adhesive"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground block mb-1 font-semibold">Category:</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as ConsumableCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                  >
                    {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                      <option key={key} value={key}>{info.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1 font-semibold">Brand / Manufacturer:</label>
                  <input
                    type="text"
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value)}
                    placeholder="e.g. 3M, Septodont, Dentsply"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-muted-foreground block mb-1 font-semibold">Initial Stock:</label>
                  <input
                    type="number"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-mono"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1 font-semibold">Reorder Alert Level:</label>
                  <input
                    type="number"
                    value={newItemThreshold}
                    onChange={(e) => setNewItemThreshold(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-mono"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1 font-semibold">Unit Type:</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="Syringe / Box"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddNewItem} className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs">
                Save Consumable
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
