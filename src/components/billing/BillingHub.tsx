'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClinicalInvoice, InvoiceLineItem, Patient } from '@/types';
import { getInvoices, saveInvoice } from '@/lib/services';
import { mockPatients } from '@/mockData';
import {
  DollarSign,
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Printer,
  Share2,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Trash2,
} from 'lucide-react';

export function BillingHub() {
  const [invoices, setInvoices] = useState<ClinicalInvoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<ClinicalInvoice | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [payMethodInput, setPayMethodInput] = useState<'UPI' | 'CASH' | 'CARD' | 'NETBANKING'>('UPI');

  // Create Invoice State
  const [selectedPatientId, setSelectedPatientId] = useState<string>(mockPatients[0].id);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: 'item-1', description: 'Comprehensive Dental Examination & Consultation', unitPrice: 500, quantity: 1, discount: 0, total: 500 },
  ]);
  const [initialPayment, setInitialPayment] = useState<number>(500);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'CASH' | 'CARD' | 'NETBANKING'>('UPI');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  useEffect(() => {
    setInvoices(getInvoices());
  }, []);

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAddLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      description: '',
      unitPrice: 1500,
      quantity: 1,
      discount: 0,
      total: 1500,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleUpdateLineItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          const price = Number(field === 'unitPrice' ? value : item.unitPrice) || 0;
          const qty = Number(field === 'quantity' ? value : item.quantity) || 1;
          const disc = Number(field === 'discount' ? value : item.discount) || 0;
          updated.total = Math.max(0, price * qty - disc);
          return updated;
        }
        return item;
      })
    );
  };

  const subtotal = lineItems.reduce((acc, it) => acc + it.total, 0);
  const calculatedGrandTotal = subtotal;
  const calculatedBalance = Math.max(0, calculatedGrandTotal - initialPayment);

  const handleCreateInvoice = () => {
    const targetPatient = mockPatients.find((p) => p.id === selectedPatientId) || mockPatients[0];

    const newInvoice: ClinicalInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: targetPatient.id,
      patientName: targetPatient.name,
      dentistId: 'u1',
      items: lineItems.filter((i) => i.description.trim()),
      subtotal,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: calculatedGrandTotal,
      paidAmount: Math.min(initialPayment, calculatedGrandTotal),
      balanceAmount: calculatedBalance,
      paymentStatus: calculatedBalance === 0 ? 'PAID' : initialPayment > 0 ? 'PARTIAL' : 'UNPAID',
      paymentMethod: selectedPaymentMethod,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      paidAt: initialPayment > 0 ? new Date().toISOString() : undefined,
      notes: invoiceNotes,
    };

    saveInvoice(newInvoice);
    setInvoices([newInvoice, ...invoices]);
    setShowCreateModal(false);
    setInvoiceNotes('');
  };

  const handleRecordPayment = () => {
    if (!showPayModal) return;

    const added = Number(payAmountInput);
    const newPaid = showPayModal.paidAmount + added;
    const newBalance = Math.max(0, showPayModal.grandTotal - newPaid);
    const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

    const updatedInv: ClinicalInvoice = {
      ...showPayModal,
      paidAmount: newPaid,
      balanceAmount: newBalance,
      paymentStatus: newStatus,
      paymentMethod: payMethodInput,
      paidAt: new Date().toISOString(),
    };

    saveInvoice(updatedInv);
    setInvoices(invoices.map((i) => (i.id === updatedInv.id ? updatedInv : i)));
    setShowPayModal(null);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-[#A6E22E]" />
            Clinic Billing & Revenue Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Itemized procedure invoices, patient statements, payment collections, and WhatsApp sharing.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#A6E22E] text-[#272822] hover:bg-[#A6E22E]/90 font-bold text-xs shadow-lg shadow-[#A6E22E]/20"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Create New Invoice
        </Button>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#1E1F1C] border-border p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Total Invoiced (Gross)</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5 font-mono">
              ₹{totalInvoiced.toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-[#66D9EF]/10 text-[#66D9EF]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>

        <Card className="bg-[#1E1F1C] border-border p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Collected Revenue</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#A6E22E] mt-0.5 font-mono">
              ₹{totalCollected.toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-[#A6E22E]/10 text-[#A6E22E]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="bg-[#1E1F1C] border-border p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Outstanding Patient Dues</span>
            <h3 className={`text-xl sm:text-2xl font-extrabold mt-0.5 font-mono ${totalOutstanding > 0 ? 'text-red-400' : 'text-[#A6E22E]'}`}>
              ₹{totalOutstanding.toLocaleString()}
            </h3>
          </div>
          <div className={`p-3 rounded-xl ${totalOutstanding > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number or patient name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#272822] border border-border text-foreground focus:ring-1 focus:ring-[#A6E22E]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-[#1E1F1C] p-1 rounded-lg border border-border">
          {(['ALL', 'UNPAID', 'PARTIAL', 'PAID'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                statusFilter === st
                  ? 'bg-[#A6E22E] text-[#272822]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.map((inv) => {
          const isPaid = inv.paymentStatus === 'PAID';
          const isPartial = inv.paymentStatus === 'PARTIAL';

          return (
            <Card key={inv.id} className="bg-[#1E1F1C] border-border overflow-hidden hover:border-[#A6E22E]/40 transition-all">
              <CardHeader className="p-4 bg-[#272822] flex flex-row items-center justify-between border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#A6E22E]/20 text-[#A6E22E]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-bold text-foreground">{inv.invoiceNumber}</CardTitle>
                      <Link href={`/patients/${inv.patientId}`} className="text-xs text-[#66D9EF] hover:underline font-semibold">
                        • {inv.patientName}
                      </Link>
                    </div>
                    <CardDescription className="text-[11px] text-muted-foreground">
                      Issued: {new Date(inv.createdAt).toLocaleDateString()} • Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-xs uppercase font-mono ${
                    isPaid
                      ? 'border-green-500 text-green-400 bg-green-500/10'
                      : isPartial
                      ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                      : 'border-red-500 text-red-400 bg-red-500/10'
                  }`}
                >
                  {inv.paymentStatus}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs">
                {/* Line Items */}
                <div className="divide-y divide-border/60">
                  {inv.items.map((item) => (
                    <div key={item.id} className="py-1.5 flex justify-between items-center">
                      <div>
                        <span className="font-medium text-foreground">{item.description}</span>
                        {item.toothNumber && (
                          <Badge variant="secondary" className="ml-2 text-[10px] py-0 bg-[#272822]">
                            Tooth #{item.toothNumber}
                          </Badge>
                        )}
                        {item.quantity > 1 && (
                          <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                        )}
                      </div>
                      <span className="font-mono text-foreground font-semibold">₹{item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Totals & Dues */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>
                      Grand Total: <strong className="text-foreground font-mono">₹{inv.grandTotal.toLocaleString()}</strong>
                    </span>
                    <span>
                      Paid ({inv.paymentMethod || 'Cash'}): <strong className="text-[#A6E22E] font-mono">₹{inv.paidAmount.toLocaleString()}</strong>
                    </span>
                    {inv.balanceAmount > 0 && (
                      <span className="text-red-400 font-bold">
                        Due: <strong className="font-mono">₹{inv.balanceAmount.toLocaleString()}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {inv.balanceAmount > 0 && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowPayModal(inv);
                          setPayAmountInput(inv.balanceAmount);
                        }}
                        className="bg-[#A6E22E] text-[#272822] hover:bg-[#A6E22E]/90 text-xs font-bold h-7"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1" /> Record Payment
                      </Button>
                    )}

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Dear ${inv.patientName}, here is your dental clinic invoice ${inv.invoiceNumber} for ₹${inv.grandTotal.toLocaleString()}. Balance Due: ₹${inv.balanceAmount.toLocaleString()}. Thank you!`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="icon" variant="outline" className="h-7 w-7 text-[#25D366] border-border hover:border-[#25D366]">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1E1F1C] border border-border rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 text-foreground max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#A6E22E]" /> Generate Clinical Invoice
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            {/* Select Patient */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-muted-foreground uppercase">Patient:</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#272822] border border-border text-foreground font-medium"
              >
                {mockPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id.toUpperCase()}) — {p.phone || p.contactInfo}
                  </option>
                ))}
              </select>
            </div>

            {/* Line Items */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-muted-foreground uppercase">Treatment & Procedure Items:</label>
                <Button size="sm" variant="outline" onClick={handleAddLineItem} className="text-xs h-7">
                  <Plus className="w-3 h-3 mr-1" /> Add Line Item
                </Button>
              </div>

              {lineItems.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-[#272822] border border-border space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-muted-foreground block">Procedure / Service Description:</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                        placeholder="e.g. Root Canal Therapy, Zirconia Crown, Scaling..."
                        className="w-full px-2 py-1.5 rounded bg-[#1E1F1C] border border-border text-foreground font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block">Tooth #:</label>
                      <input
                        type="number"
                        value={item.toothNumber || ''}
                        onChange={(e) => handleUpdateLineItem(item.id, 'toothNumber', parseInt(e.target.value) || undefined)}
                        placeholder="e.g. 36"
                        className="w-full px-2 py-1.5 rounded bg-[#1E1F1C] border border-border text-foreground font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block">Price (₹):</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded bg-[#1E1F1C] border border-border text-foreground font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground pt-1">
                    <span>Item Total: <strong className="text-[#A6E22E] font-mono">₹{item.total.toLocaleString()}</strong></span>
                    {lineItems.length > 1 && (
                      <Button size="icon" variant="ghost" onClick={() => handleRemoveLineItem(item.id)} className="h-6 w-6 text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Section */}
            <div className="p-3 rounded-lg bg-[#272822] border border-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Payment Method:</label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                  className="w-full p-2 rounded bg-[#1E1F1C] border border-border text-foreground"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="NETBANKING">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Amount Paid Today (₹):</label>
                <input
                  type="number"
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded bg-[#1E1F1C] border border-border text-foreground font-mono font-bold text-[#A6E22E]"
                />
              </div>
            </div>

            {/* Grand Summary */}
            <div className="flex justify-between items-center pt-2 font-bold text-sm">
              <span>Grand Total: <span className="font-mono text-[#66D9EF]">₹{calculatedGrandTotal.toLocaleString()}</span></span>
              <span>Balance Due: <span className="font-mono text-red-400">₹{calculatedBalance.toLocaleString()}</span></span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateInvoice} className="bg-[#A6E22E] text-[#272822] font-bold text-xs">
                Generate & Save Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1E1F1C] border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#A6E22E]" /> Record Payment Receipt
              </h3>
              <button type="button" onClick={() => setShowPayModal(null)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#272822] border border-border text-xs space-y-1">
              <p>Invoice: <strong className="text-foreground">{showPayModal.invoiceNumber}</strong></p>
              <p>Patient: <strong className="text-[#66D9EF]">{showPayModal.patientName}</strong></p>
              <p>Outstanding Balance: <strong className="text-red-400 font-mono">₹{showPayModal.balanceAmount.toLocaleString()}</strong></p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Payment Amount (₹):</label>
                <input
                  type="number"
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded bg-[#272822] border border-border text-foreground font-mono font-bold text-[#A6E22E]"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">Payment Method:</label>
                <select
                  value={payMethodInput}
                  onChange={(e) => setPayMethodInput(e.target.value as any)}
                  className="w-full px-3 py-2 rounded bg-[#272822] border border-border text-foreground"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="NETBANKING">Net Banking</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowPayModal(null)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleRecordPayment} className="bg-[#A6E22E] text-[#272822] font-bold text-xs">
                Confirm Payment Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
