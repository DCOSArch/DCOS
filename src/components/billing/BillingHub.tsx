'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClinicalInvoice, InvoiceLineItem, Patient } from '@/types';
import { mockPatients } from '@/mockData';
import { getInvoices, saveInvoice } from '@/lib/services';
import { formatDate } from '@/lib/datetime';
import {
  DollarSign,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  MessageSquare,
  Sparkles,
  Layers,
  Trash2,
  TrendingUp,
} from 'lucide-react';

export function BillingHub() {
  const [invoices, setInvoices] = useState<ClinicalInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Invoice form state
  const [selectedPatientId, setSelectedPatientId] = useState('p1');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: 'li-1',
      description: 'Zirconia Monolithic Crown Placement',
      toothNumber: 46,
      quantity: 1,
      unitPrice: 8500,
      total: 8500,
    },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(8500);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'CARD' | 'NETBANKING'>('UPI');

  useEffect(() => {
    setInvoices(getInvoices());
  }, []);

  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

  const filteredInvoices = invoices.filter((inv) =>
    inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: `li-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 1500,
      total: 1500,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateLineItem = (id: string, field: keyof InvoiceLineItem, val: any) => {
    const updated = lineItems.map((item) => {
      if (item.id === id) {
        const next = { ...item, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          next.total = Number(next.quantity) * Number(next.unitPrice);
        }
        return next;
      }
      return item;
    });
    setLineItems(updated);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const subtotal = lineItems.reduce((acc, it) => acc + Number(it.total || 0), 0);
  const grandTotal = Math.max(0, subtotal - Number(discount));
  const balanceDue = Math.max(0, grandTotal - Number(paidAmount));

  const handleCreateInvoice = () => {
    const targetPatient = mockPatients.find((p) => p.id === selectedPatientId) || mockPatients[0];

    const newInvoice: ClinicalInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      patientId: targetPatient.id,
      patientName: targetPatient.name,
      dentistId: 'u1',
      items: lineItems.filter((it) => it.description.trim()),
      subtotal,
      discountTotal: Number(discount),
      taxTotal: 0,
      grandTotal,
      paidAmount: Number(paidAmount),
      balanceAmount: balanceDue,
      paymentStatus: balanceDue === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID',
      paymentMethod,
      dueDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    saveInvoice(newInvoice);
    setInvoices([newInvoice, ...invoices]);
    setShowCreateModal(false);
  };

  const generateWhatsAppInvoice = (inv: ClinicalInvoice) => {
    const targetPatient = mockPatients.find((p) => p.id === inv.patientId);
    const phone = (targetPatient?.phone || '').replace(/[^0-9]/g, '');
    const message = `Hello ${inv.patientName}, your invoice #${inv.invoiceNumber} for ₹${inv.grandTotal.toLocaleString('en-IN')} has been generated. Paid: ₹${inv.paidAmount.toLocaleString('en-IN')}, Balance Due: ₹${inv.balanceAmount.toLocaleString('en-IN')}. Thank you!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <DollarSign className="w-7 h-7 text-primary" />
            Clinical Invoicing & Revenue Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Generate itemized treatment bills, collect UPI/Card payments, and track practice collections.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Create Treatment Invoice
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">Total Invoiced Treatment</span>
          <h3 className="text-2xl font-extrabold font-mono text-foreground mt-1">
            ₹{totalInvoiced.toLocaleString('en-IN')}
          </h3>
        </Card>

        <Card className="bg-card border-border p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">Collections Received</span>
          <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{totalCollected.toLocaleString('en-IN')}
          </h3>
        </Card>

        <Card className="bg-card border-border p-4 shadow-xs">
          <span className="text-xs text-muted-foreground">Outstanding Patient Dues</span>
          <h3 className="text-2xl font-extrabold font-mono text-red-500 mt-1">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </h3>
        </Card>
      </div>

      {/* Invoice Search Bar */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name or invoice #..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {filteredInvoices.map((inv) => (
          <Card key={inv.id} className="bg-card border-border hover:border-primary/50 transition-all shadow-xs">
            <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-foreground">{inv.invoiceNumber}</CardTitle>
                    <span className="text-xs text-muted-foreground">&bull;</span>
                    <Link href={`/patients/${inv.patientId}`} className="text-xs font-semibold text-primary hover:underline">
                      {inv.patientName}
                    </Link>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Date: {formatDate(inv.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-xs font-semibold ${
                  inv.paymentStatus === 'PAID'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : inv.paymentStatus === 'PARTIAL'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                    : 'border-red-500 text-red-500 bg-red-500/10'
                }`}
              >
                {inv.paymentStatus}
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs">
              <div className="divide-y divide-border">
                {inv.items.map((it) => (
                  <div key={it.id} className="py-1.5 flex justify-between items-center">
                    <span className="text-foreground">
                      {it.description} {it.toothNumber && <strong className="text-primary">(Tooth #{it.toothNumber})</strong>}
                    </span>
                    <span className="font-mono text-foreground font-semibold">₹{it.total.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>Grand Total: <strong className="text-foreground font-mono">₹{inv.grandTotal.toLocaleString('en-IN')}</strong></span>
                  <span>Paid: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₹{inv.paidAmount.toLocaleString('en-IN')}</strong></span>
                  {inv.balanceAmount > 0 && (
                    <span className="text-red-500 font-bold">Due: ₹{inv.balanceAmount.toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a href={generateWhatsAppInvoice(inv)} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="text-xs h-7 text-emerald-600 dark:text-emerald-400 border-border hover:border-emerald-500">
                      <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp Receipt
                    </Button>
                  </a>
                  <Button size="sm" variant="outline" onClick={() => window.print()} className="text-xs h-7">
                    <Printer className="w-3 h-3 mr-1" /> Print
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 text-card-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
                <Plus className="w-4 h-4 text-primary" /> Create Treatment Invoice
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Select Patient:</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-semibold"
                >
                  {mockPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id.toUpperCase()}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-muted-foreground font-semibold">Treatment Procedures & Units:</label>
                  <Button size="sm" variant="outline" onClick={handleAddLineItem} className="text-[11px] h-6 px-2">
                    <Plus className="w-3 h-3 mr-1" /> Add Procedure
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {lineItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/40 border border-border">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Procedure name"
                        className="col-span-6 px-2 py-1 rounded bg-background border border-border text-foreground"
                      />
                      <input
                        type="number"
                        value={item.toothNumber || ''}
                        onChange={(e) => handleUpdateLineItem(item.id, 'toothNumber', parseInt(e.target.value) || undefined)}
                        placeholder="Tooth #"
                        className="col-span-2 px-2 py-1 rounded bg-background border border-border text-foreground font-mono"
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateLineItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                        placeholder="Price"
                        className="col-span-3 px-2 py-1 rounded bg-background border border-border text-foreground font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="col-span-1 text-muted-foreground hover:text-red-500 flex justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Calculations */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-mono font-bold text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-muted-foreground block text-[10px]">Discount (₹):</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded bg-background border border-border text-foreground font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block text-[10px]">Payment Received (₹):</label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded bg-background border border-border text-foreground font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border font-bold">
                  <span>Balance Due:</span>
                  <span className={`font-mono text-sm ${balanceDue > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateInvoice} className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs">
                Save & Issue Invoice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
