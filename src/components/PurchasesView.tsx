"use client";

import React, { useState } from "react";
import {
  Package, Plus, Search, Trash2, CheckCircle2, Eye, RefreshCw, Hash,
  UserPlus, Building2, Download,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportPurchasesToExcel } from "@/lib/excel-export";
import type { Product, Purchase, Supplier, Customer } from "@/types";

interface PurchasesViewProps {
  products: Product[];
  purchasesList: Purchase[];
  suppliers: Supplier[];
  customers: Customer[];
  currency: string;
  onPurchaseCreated: () => void;
  onViewPurchase: (purchase: Purchase) => void;
  onDeletePurchase: (purchaseId: number) => void;
}

export function PurchasesView({
  products, purchasesList, suppliers, customers, currency, onPurchaseCreated, onViewPurchase, onDeletePurchase,
}: PurchasesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const genPO = () => "HC-PO-" + Math.floor(100 + Math.random() * 900);

  const [purchaseNumber, setPurchaseNumber] = useState(genPO());
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [supplierName, setSupplierName] = useState(suppliers[0]?.name || "");
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(suppliers[0]?.id || null);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState("");
  const [newSupCompany, setNewSupCompany] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paidAmountInput, setPaidAmountInput] = useState(0);
  const [savingContact, setSavingContact] = useState(false);

  const defaultItem = () => ({
    productId: products[0]?.id || 1, productName: products[0]?.name || "",
    unit: products[0]?.unit || "pcs", dimensions: products[0]?.dimensions || "",
    quantity: 10, unitCost: parseFloat(products[0]?.costPrice || "0"),
  });
  const [poItems, setPoItems] = useState<Array<{
    productId: number; productName: string; unit: string; dimensions?: string | null; quantity: number; unitCost: number;
  }>>([defaultItem()]);

  const openModal = () => {
    setPurchaseNumber(genPO()); setPurchaseDate(new Date().toISOString().split("T")[0]);
    setCustomerName(""); setSelectedCustomerId(null); setShowNewCustomer(false);
    setPoItems([defaultItem()]); setPaidAmountInput(0); setIsModalOpen(true);
  };

  const addItem = () => { const p = products[0]; if (!p) return; setPoItems(prev => [...prev, { productId: p.id, productName: p.name, unit: p.unit, dimensions: p.dimensions, quantity: 5, unitCost: parseFloat(p.costPrice || "0") }]); };
  const updateItemProduct = (i: number, productId: number) => { const p = products.find(x => x.id === productId); if (!p) return; setPoItems(prev => { const u = [...prev]; u[i] = { ...u[i], productId: p.id, productName: p.name, unit: p.unit, dimensions: p.dimensions, unitCost: parseFloat(p.costPrice || "0") }; return u; }); };
  const updateItem = (i: number, field: string, value: any) => { setPoItems(prev => { const u = [...prev]; (u[i] as any)[field] = value; return u; }); };
  const removeItem = (i: number) => setPoItems(prev => prev.filter((_, x) => x !== i));
  const poSubtotal = poItems.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  const saveNewSupplier = async () => {
    if (!newSupName.trim()) return; setSavingContact(true);
    try {
      const res = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newSupName.trim(), companyName: newSupCompany, phone: newSupPhone }) });
      if (!res.ok) throw new Error("Failed");
      const sup = await res.json();
      setSupplierName(sup.name); setSelectedSupplierId(sup.id); setShowNewSupplier(false);
      setNewSupName(""); setNewSupCompany(""); setNewSupPhone(""); onPurchaseCreated();
    } catch { alert("Failed to save supplier"); } finally { setSavingContact(false); }
  };

  const saveNewCustomer = async () => {
    if (!newCustName.trim()) return; setSavingContact(true);
    try {
      const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCustName.trim(), phone: newCustPhone }) });
      if (!res.ok) throw new Error("Failed");
      const c = await res.json();
      setCustomerName(c.name); setSelectedCustomerId(c.id); setShowNewCustomer(false);
      setNewCustName(""); setNewCustPhone(""); onPurchaseCreated();
    } catch { alert("Failed to save customer"); } finally { setSavingContact(false); }
  };

  const handleSupplierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "new") { setShowNewSupplier(true); setSupplierName(""); setSelectedSupplierId(null); }
    else { const s = suppliers.find(x => x.id === parseInt(val, 10)); if (s) { setShowNewSupplier(false); setSupplierName(s.name); setSelectedSupplierId(s.id); } }
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "new") { setShowNewCustomer(true); setCustomerName(""); setSelectedCustomerId(null); }
    else if (val === "none") { setShowNewCustomer(false); setCustomerName(""); setSelectedCustomerId(null); }
    else { const c = customers.find(x => x.id === parseInt(val, 10)); if (c) { setShowNewCustomer(false); setCustomerName(c.name); setSelectedCustomerId(c.id); } }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (poItems.length === 0) return; setIsSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseNumber: (purchaseNumber || "").trim() || genPO(),
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          supplierId: selectedSupplierId, supplierName, customerName, customerId: selectedCustomerId,
          subtotal: poSubtotal.toFixed(2), tax: "0.00", shippingFee: "0.00", totalAmount: poSubtotal.toFixed(2),
          paidAmount: paymentStatus === "Paid" ? poSubtotal.toFixed(2) : paymentStatus === "Partial" ? Math.min(paidAmountInput,poSubtotal).toFixed(2) : "0.00",
          paymentStatus, paymentMethod, notes,
          items: poItems.map(i => ({ productId: i.productId, productName: i.productName, unit: i.unit, dimensions: i.dimensions, quantity: i.quantity, unitCost: i.unitCost.toFixed(2), totalPrice: (i.quantity * i.unitCost).toFixed(2) })),
        }),
      });
      if (!res.ok) throw new Error("Failed"); setIsModalOpen(false); onPurchaseCreated();
    } catch { alert("Failed"); } finally { setIsSubmitting(false); }
  };

  const filtered = purchasesList.filter(po => {
    const ms = statusFilter === "All" || po.paymentStatus.toLowerCase() === statusFilter.toLowerCase();
    const mq = po.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) || po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    return ms && mq;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-xl">
        <div><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Purchases</span><h2 className="text-lg font-extrabold text-white mt-0.5">Record Purchase Invoices</h2></div>
        <button onClick={openModal} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"><Package className="w-4 h-4" /> + New Purchase</button>
        <button onClick={() => exportPurchasesToExcel(purchasesList)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5"><Download className="w-4 h-4" /> Excel</button>
      </div>

      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Search invoice # or supplier..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"><option value="All">All</option><option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Unpaid">Unpaid</option></select>
      </div>

      <div className="sm:hidden space-y-2">{filtered.slice(0, 20).map(po => (<div key={po.id} className="bg-slate-900/90 rounded-lg p-3 border border-slate-800"><div className="flex items-center justify-between mb-1"><span className="font-mono font-bold text-emerald-400 text-[11px]">{po.purchaseNumber}</span><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">{po.paymentStatus}</span></div><div className="flex items-center justify-between"><span className="text-xs text-slate-300">{po.supplierName}</span><span className="text-sm font-black text-white">{formatCurrency(po.totalAmount, currency)}</span></div><div className="flex items-center justify-between mt-1"><span className="text-[10px] text-slate-500">{formatDate(po.purchaseDate)}</span><div className="flex items-center gap-2"><button onClick={() => onViewPurchase(po)} className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5"><Eye className="w-3 h-3" /> View</button><button onClick={() => { if (confirm("Delete?")) onDeletePurchase(po.id); }} className="text-rose-400"><Trash2 className="w-3 h-3" /></button></div></div></div>))}</div>

      <div className="hidden sm:block bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold bg-slate-800/40"><th className="py-3 px-4">Invoice #</th><th className="py-3 px-4">Supplier</th><th className="py-3 px-3">Date</th><th className="py-3 px-3">Payment</th><th className="py-3 px-4 text-right">Total</th><th className="py-3 px-4 text-center">Actions</th></tr></thead><tbody className="divide-y divide-slate-800/60">{filtered.map(po => (<tr key={po.id} className="hover:bg-slate-800/40"><td className="py-3 px-4 font-mono font-bold text-emerald-400">{po.purchaseNumber}</td><td className="py-3 px-4 font-bold text-white">{po.supplierName}</td><td className="py-3 px-3 text-slate-300">{formatDate(po.purchaseDate)}</td><td className="py-3 px-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">{po.paymentMethod} - {po.paymentStatus}</span></td><td className="py-3 px-4 text-right font-black text-white">{formatCurrency(po.totalAmount, currency)}</td><td className="py-3 px-4 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => onViewPurchase(po)} className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded"><Eye className="w-3 h-3 text-emerald-400" /></button><button onClick={() => { if (confirm("Delete?")) onDeletePurchase(po.id); }} className="p-1 text-rose-400 hover:bg-rose-500/20 rounded"><Trash2 className="w-3 h-3" /></button></div></td></tr>))}</tbody></table></div></div>

      {isModalOpen && (<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4"><div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800"><div className="flex items-center gap-2"><Package className="w-4 h-4 text-emerald-400" /><h3 className="text-sm font-extrabold text-white">Record Purchase Invoice</h3></div><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">X</button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3 space-y-2"><div className="flex items-center justify-between"><label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> Invoice #</label><button type="button" onClick={() => setPurchaseNumber(genPO())} className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 font-semibold"><RefreshCw className="w-3 h-3" /> Auto</button></div><div className="grid grid-cols-2 gap-2"><input type="text" required value={purchaseNumber} onChange={e => setPurchaseNumber(e.target.value)} placeholder="HC-PO-205" className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none" /><input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /></div></div>

          <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> Supplier</label><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><select onChange={handleSupplierSelect} value={showNewSupplier ? "new" : selectedSupplierId ? String(selectedSupplierId) : ""} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"><option value="">-- Select --</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
<option value="new">+ New Supplier</option></select>{!showNewSupplier && <input type="text" placeholder="Supplier" value={supplierName} onChange={e => { setSupplierName(e.target.value); setSelectedSupplierId(null); }} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none" />}</div>{showNewSupplier && (<div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2"><p className="text-[10px] font-bold text-emerald-300">New Supplier</p><div className="grid grid-cols-3 gap-2"><input type="text" placeholder="Name *" value={newSupName} onChange={e => setNewSupName(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /><input type="text" placeholder="Company" value={newSupCompany} onChange={e => setNewSupCompany(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /><input type="text" placeholder="Phone" value={newSupPhone} onChange={e => setNewSupPhone(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /></div><div className="flex items-center gap-2"><button type="button" onClick={saveNewSupplier} disabled={!newSupName.trim() || savingContact} className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-[10px] rounded-lg disabled:opacity-50">{savingContact ? "Saving..." : "Save Supplier"}</button><button type="button" onClick={() => setShowNewSupplier(false)} className="text-[10px] text-slate-400">Cancel</button></div></div>)}</div>

          <div className="space-y-2"><label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><UserPlus className="w-3 h-3" /> Customer <span className="text-slate-500 normal-case">(optional)</span></label><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><select onChange={handleCustomerSelect} value={showNewCustomer ? "new" : selectedCustomerId ? String(selectedCustomerId) : "none"} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"><option value="none">-- No Customer --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}<option value="new">+ New Customer</option></select>{!showNewCustomer && customerName && <input type="text" placeholder="Customer" value={customerName} onChange={e => { setCustomerName(e.target.value); setSelectedCustomerId(null); }} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none" />}</div>{showNewCustomer && (<div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2"><p className="text-[10px] font-bold text-amber-300">New Customer</p><div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Name *" value={newCustName} onChange={e => setNewCustName(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /><input type="text" placeholder="Phone" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /></div><div className="flex items-center gap-2"><button type="button" onClick={saveNewCustomer} disabled={!newCustName.trim() || savingContact} className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg disabled:opacity-50">{savingContact ? "Saving..." : "Save Customer"}</button><button type="button" onClick={() => { setShowNewCustomer(false); setCustomerName(""); }} className="text-[10px] text-slate-400">Cancel</button></div></div>)}</div>

          <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Payment</label><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"><option value="Bank Transfer">Transfer</option><option value="Cash">Cash</option><option value="Cheque">Cheque</option></select></div><div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Status</label><select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"><option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Unpaid">Unpaid</option></select></div></div>

          {(paymentStatus==="Partial"||paymentStatus==="Unpaid")&&<div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-2"><p className="text-[11px] font-bold text-emerald-300">Partial payment</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2"><label className="text-[10px] text-slate-400">Amount paid now<input type="number" min="0" max={poSubtotal} step="0.01" value={paymentStatus==="Unpaid"?0:paidAmountInput||""} onChange={e=>setPaidAmountInput(Math.max(0,Math.min(Number(e.target.value)||0,poSubtotal)))} className="mt-1 w-full rounded-lg border border-emerald-500/40 bg-slate-900 px-2 py-2 text-xs text-emerald-300"/></label><div><p className="text-[10px] text-slate-400">Total</p><p className="mt-2 text-sm font-bold text-white">{formatCurrency(poSubtotal,currency)}</p></div><div><p className="text-[10px] text-slate-400">Remaining</p><p className="mt-2 text-sm font-bold text-rose-300">{formatCurrency(Math.max(0,poSubtotal-(paymentStatus==="Unpaid"?0:paidAmountInput)),currency)}</p></div></div></div>}

          <div><div className="flex items-center justify-between mb-2"><label className="text-xs font-bold text-slate-300">Items</label><button type="button" onClick={addItem} className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add</button></div><div className="space-y-2">{poItems.map((item, idx) => (<div key={idx} className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 grid grid-cols-12 gap-1.5 items-center"><div className="col-span-5"><select value={item.productId} onChange={e => updateItemProduct(idx, parseInt(e.target.value, 10))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-[10px] text-white focus:outline-none">{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="col-span-3"><input type="number" min="0.01" step="any" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1 py-1.5 text-[10px] text-white text-center focus:outline-none" /></div><div className="col-span-3"><input type="number" step="0.01" min="0" value={item.unitCost} onChange={e => updateItem(idx, "unitCost", parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1 py-1.5 text-[10px] text-white text-right focus:outline-none" /></div><div className="col-span-1 text-center">{poItems.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>}</div></div>))}</div></div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-xs space-y-1"><div className="flex justify-between text-slate-400"><span>Invoice #</span><span className="font-mono font-bold text-emerald-400">{purchaseNumber}</span></div>{supplierName && <div className="flex justify-between text-slate-400"><span>Supplier</span><span className="font-bold text-white">{supplierName}</span></div>}{customerName && <div className="flex justify-between text-slate-400"><span>Customer</span><span className="font-bold text-white">{customerName}</span></div>}<div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="font-bold text-white">{formatCurrency(poSubtotal, currency)}</span></div><div className="flex justify-between text-sm font-black text-emerald-400 pt-1 border-t border-slate-700"><span>Total</span><span>{formatCurrency(poSubtotal, currency)}</span></div></div>

          <div className="flex items-center justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-2 text-xs text-slate-400">Cancel</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1">{isSubmitting ? "Saving..." : "Save (" + purchaseNumber + ")"}</button></div>
        </form>
      </div></div>)}
    </div>
  );
}
