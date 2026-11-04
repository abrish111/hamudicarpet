"use client";

import React, { useState } from "react";
import {
  Search, Plus, Minus, Trash2, CheckCircle2, Receipt, RefreshCw, Hash,
  ShoppingCart, Printer, Download, UserPlus, Building2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportSalesToExcel } from "@/lib/excel-export";
import type { Product, Sale, Customer, Supplier } from "@/types";

interface SalesPosViewProps {
  products: Product[];
  salesList: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  currency: string;
  onSaleCreated: () => void;
  onViewInvoice: (sale: Sale) => void;
  onDeleteSale: (saleId: number) => void;
}

interface FormItem {
  productId: number; productName: string; unit: string; dimensions?: string | null;
  quantity: number; unitPrice: number; unitCost: number;
}

export function SalesPosView({
  products, salesList, customers, suppliers, currency, onSaleCreated, onViewInvoice, onDeleteSale,
}: SalesPosViewProps) {
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [historySearch, setHistorySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const genInv = () => `HC-INV-${Math.floor(1000 + Math.random() * 9000)}`;

  const [invoiceNumber, setInvoiceNumber] = useState(genInv());
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);

  // Customer state
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Supplier state
  const [supplierName, setSupplierName] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState("");
  const [newSupCompany, setNewSupCompany] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [paidAmountState, setPaidAmountState] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [items, setItems] = useState<FormItem[]>([{
    productId: products[0]?.id || 1, productName: products[0]?.name || "",
    unit: products[0]?.unit || "pcs", dimensions: products[0]?.dimensions || "",
    quantity: 1, unitPrice: parseFloat(products[0]?.sellingPrice || "0"), unitCost: parseFloat(products[0]?.costPrice || "0"),
  }]);

  const addItem = () => { const p = products[0]; if (!p) return; setItems(prev => [...prev, { productId: p.id, productName: p.name, unit: p.unit, dimensions: p.dimensions, quantity: 1, unitPrice: parseFloat(p.sellingPrice || "0"), unitCost: parseFloat(p.costPrice || "0") }]); };
  const updateItemProduct = (i: number, productId: number) => { const p = products.find(x => x.id === productId); if (!p) return; setItems(prev => { const u = [...prev]; u[i] = { ...u[i], productId: p.id, productName: p.name, unit: p.unit, dimensions: p.dimensions, unitPrice: parseFloat(p.sellingPrice || "0"), unitCost: parseFloat(p.costPrice || "0") }; return u; }); };
  const updateItem = (i: number, field: string, value: any) => { setItems(prev => { const u = [...prev]; (u[i] as any)[field] = value; return u; }); };
  const removeItem = (i: number) => setItems(prev => prev.filter((_, x) => x !== i));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalCost = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const discount = discountType === "percent" ? (subtotal * discountAmount) / 100 : discountAmount;
  const grandTotal = Math.max(0, subtotal - discount);

  // Save new customer inline
  const saveNewCustomer = async () => {
    if (!newCustName.trim()) return;
    setSavingCustomer(true);
    try {
      const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCustName.trim(), phone: newCustPhone, email: newCustEmail, address: newCustAddress }) });
      if (!res.ok) throw new Error("Failed");
      const cust = await res.json();
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone || "");
      setSelectedCustomerId(cust.id);
      setShowNewCustomer(false);
      setNewCustName(""); setNewCustPhone(""); setNewCustEmail(""); setNewCustAddress("");
      onSaleCreated(); // refresh data
    } catch { alert("Failed to save customer"); }
    finally { setSavingCustomer(false); }
  };

  // Save new supplier inline
  const saveNewSupplier = async () => {
    if (!newSupName.trim()) return;
    setSavingCustomer(true);
    try {
      const res = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newSupName.trim(), companyName: newSupCompany, phone: newSupPhone }) });
      if (!res.ok) throw new Error("Failed");
      const sup = await res.json();
      setSupplierName(sup.name);
      setSelectedSupplierId(sup.id);
      setShowNewSupplier(false);
      setNewSupName(""); setNewSupCompany(""); setNewSupPhone("");
      onSaleCreated(); // refresh data
    } catch { alert("Failed to save supplier"); }
    finally { setSavingCustomer(false); }
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "new") { setShowNewCustomer(true); setSelectedCustomerId(null); setCustomerName(""); setCustomerPhone(""); }
    else if (val === "walk-in") { setShowNewCustomer(false); setSelectedCustomerId(null); setCustomerName("Walk-in Customer"); setCustomerPhone(""); }
    else { const c = customers.find(x => x.id === parseInt(val, 10)); if (c) { setShowNewCustomer(false); setSelectedCustomerId(c.id); setCustomerName(c.name); setCustomerPhone(c.phone || ""); } }
  };

  const handleSupplierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "new") { setShowNewSupplier(true); setSupplierName(""); setSelectedSupplierId(null); }
    else if (val === "none") { setShowNewSupplier(false); setSupplierName(""); setSelectedSupplierId(null); }
    else { const s = suppliers.find(x => x.id === parseInt(val, 10)); if (s) { setShowNewSupplier(false); setSupplierName(s.name); setSelectedSupplierId(s.id); } }
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true); setSuccessMessage(null);
    try {
      const res = await fetch("/api/sales", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: (invoiceNumber || "").trim() || genInv(),
          saleDate: saleDate ? new Date(saleDate) : new Date(),
          customerName: customerName || "Walk-in Customer", customerPhone, customerId: selectedCustomerId,
          supplierName, supplierId: selectedSupplierId,
          subtotal: subtotal.toFixed(2), discount: discount.toFixed(2), tax: "0.00",
          totalAmount: grandTotal.toFixed(2), totalCost: totalCost.toFixed(2),
          paidAmount: paymentStatus === "Paid" ? grandTotal.toFixed(2) : paymentStatus === "Partial" ? Math.min(paidAmountState, grandTotal).toFixed(2) : "0.00",
          paymentMethod, paymentStatus, notes,
          items: items.map(i => ({ productId: i.productId, productName: i.productName, unit: i.unit, dimensions: i.dimensions, quantity: i.quantity, unitPrice: i.unitPrice.toFixed(2), unitCost: i.unitCost.toFixed(2), totalPrice: (i.quantity * i.unitPrice).toFixed(2) })),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const sale = await res.json();
      setSuccessMessage(`Invoice #${sale.invoiceNumber} recorded!`);
      setItems([{ productId: products[0]?.id || 1, productName: products[0]?.name || "", unit: products[0]?.unit || "pcs", dimensions: products[0]?.dimensions || "", quantity: 1, unitPrice: parseFloat(products[0]?.sellingPrice || "0"), unitCost: parseFloat(products[0]?.costPrice || "0") }]);
      setInvoiceNumber(genInv()); setDiscountAmount(0); setNotes(""); setPaidAmountState(0);
      setSupplierName(""); setSelectedSupplierId(null);
      onSaleCreated(); onViewInvoice(sale);
    } catch { alert("Error recording sale"); } finally { setIsSubmitting(false); }
  };

  const filteredSales = salesList.filter(s => {
    const ms = statusFilter === "All" || s.paymentStatus.toLowerCase() === statusFilter.toLowerCase();
    const mq = s.invoiceNumber.toLowerCase().includes(historySearch.toLowerCase()) || s.customerName.toLowerCase().includes(historySearch.toLowerCase()) || (s.customerPhone && s.customerPhone.toLowerCase().includes(historySearch.toLowerCase()));
    return ms && mq;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-xl">
        <div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Sales</span>
          <h2 className="text-lg font-extrabold text-white mt-0.5">Record Sale & Invoices</h2>
        </div>
        <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button onClick={() => setActiveTab("form")} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 ${activeTab === "form" ? "bg-amber-500 text-slate-950" : "text-slate-300"}`}>
            <ShoppingCart className="w-3.5 h-3.5" /> New Sale
          </button>
          <button onClick={() => setActiveTab("history")} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 ${activeTab === "history" ? "bg-amber-500 text-slate-950" : "text-slate-300"}`}>
            <Receipt className="w-3.5 h-3.5" /> History ({salesList.length})
          </button>
          <button onClick={() => exportSalesToExcel(salesList)} className="px-3 py-1.5 text-xs font-bold text-emerald-400 hover:text-white flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
        </div>
      </div>

      {successMessage && <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center gap-2 text-emerald-300 text-xs"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> {successMessage}</div>}

      {/* NEW SALE FORM */}
      {activeTab === "form" && (
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-xl space-y-4">
          {/* Invoice # & Date */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> Invoice Number</label>
              <button type="button" onClick={() => setInvoiceNumber(genInv())} className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 font-semibold"><RefreshCw className="w-3 h-3" /> Auto</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" required value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="HC-INV-1025" className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400" />
              <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" />
            </div>
          </div>

          {/* CUSTOMER SECTION */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><UserPlus className="w-3 h-3" /> Customer</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select onChange={handleCustomerSelect} value={showNewCustomer ? "new" : selectedCustomerId ? String(selectedCustomerId) : (customerName === "Walk-in Customer" ? "walk-in" : "new")} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none">
                <option value="walk-in">Walk-in Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` • ${c.phone}` : ""}</option>)}
                <option value="new">+ Add New Customer</option>
              </select>
              {!showNewCustomer && (
                <>
                  <input type="text" placeholder="Name" value={customerName} onChange={e => { setCustomerName(e.target.value); setSelectedCustomerId(null); }} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none" />
                  <input type="text" placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none" />
                </>
              )}
            </div>
            {/* New customer fields */}
            {showNewCustomer && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-bold text-amber-300">New Customer Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Full Name *" value={newCustName} onChange={e => setNewCustName(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                  <input type="text" placeholder="Phone" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                  <input type="text" placeholder="Email" value={newCustEmail} onChange={e => setNewCustEmail(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                  <input type="text" placeholder="Address" value={newCustAddress} onChange={e => setNewCustAddress(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={saveNewCustomer} disabled={!newCustName.trim() || savingCustomer} className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg disabled:opacity-50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {savingCustomer ? "Saving..." : "Save Customer"}
                  </button>
                  <button type="button" onClick={() => { setShowNewCustomer(false); setCustomerName("Walk-in Customer"); }} className="text-[10px] text-slate-400 hover:text-white">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* SUPPLIER SECTION */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> Supplier <span className="text-slate-500 normal-case">(optional)</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select onChange={handleSupplierSelect} value={showNewSupplier ? "new" : selectedSupplierId ? String(selectedSupplierId) : (supplierName ? "none" : "none")} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none">
                <option value="none">— No Supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}{s.companyName ? ` (${s.companyName})` : ""}</option>)}
                <option value="new">+ Add New Supplier</option>
              </select>
              {!showNewSupplier && supplierName && (
                <input type="text" placeholder="Supplier name" value={supplierName} onChange={e => { setSupplierName(e.target.value); setSelectedSupplierId(null); }} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none" />
              )}
            </div>
            {showNewSupplier && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-bold text-emerald-300">New Supplier Details</p>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="Name *" value={newSupName} onChange={e => setNewSupName(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                  <input type="text" placeholder="Company" value={newSupCompany} onChange={e => setNewSupCompany(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                  <input type="text" placeholder="Phone" value={newSupPhone} onChange={e => setNewSupPhone(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={saveNewSupplier} disabled={!newSupName.trim() || savingCustomer} className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-[10px] rounded-lg disabled:opacity-50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {savingCustomer ? "Saving..." : "Save Supplier"}
                  </button>
                  <button type="button" onClick={() => { setShowNewSupplier(false); setSupplierName(""); }} className="text-[10px] text-slate-400 hover:text-white">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">Items</label>
              <button type="button" onClick={addItem} className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 grid grid-cols-12 gap-1.5 items-center">
                  <div className="col-span-5 sm:col-span-4">
                    <select value={item.productId} onChange={e => updateItemProduct(idx, parseInt(e.target.value, 10))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-[10px] sm:text-xs text-white focus:outline-none">
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><input type="number" min="0.01" step="any" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1 py-1.5 text-[10px] sm:text-xs text-white text-center focus:outline-none" /></div>
                  <div className="col-span-3 sm:col-span-3"><input type="number" step="0.01" min="0" value={item.unitPrice} onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1 py-1.5 text-[10px] sm:text-xs text-white text-right focus:outline-none" /></div>
                  <div className="col-span-1 sm:col-span-2 text-right"><span className="text-[10px] sm:text-xs font-bold text-amber-400">{formatCurrency(item.quantity * item.unitPrice, currency)}</span></div>
                  <div className="col-span-1 text-center">{items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-12 gap-1.5 mt-1 px-1 text-[9px] text-slate-500 font-bold uppercase hidden sm:grid">
              <span className="col-span-4">Product</span><span className="col-span-2 text-center">Qty</span><span className="col-span-3 text-right">Price</span><span className="col-span-2 text-right">Total</span><span className="col-span-1"></span>
            </div>
          </div>

          {/* Discount, Payment */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Discount</label>
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5">
                <input type="number" min="0" value={discountAmount || ""} onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)} placeholder="0" className="w-full bg-transparent text-white font-bold text-xs focus:outline-none" />
                <button type="button" onClick={() => setDiscountType(discountType === "fixed" ? "percent" : "fixed")} className="text-[10px] font-bold text-amber-400 px-1 hover:underline">{discountType === "fixed" ? currency : "%"}</button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Payment</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none">
                <option value="Cash">Cash</option><option value="Card">Card</option><option value="Bank Transfer">Transfer</option><option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Status</label>
              <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none">
                <option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          {/* Partial Payment: Amount Received & Remaining */}
          {(paymentStatus === "Partial" || paymentStatus === "Unpaid") && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-bold text-amber-300">Partial Payment Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Amount Received Now</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={grandTotal}
                    value={paymentStatus === "Unpaid" ? 0 : paidAmountState || ""}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setPaidAmountState(Math.min(val, grandTotal));
                    }}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <p className="text-[10px] text-slate-400">Total Invoice</p>
                  <p className="text-sm font-black text-white">{formatCurrency(grandTotal, currency)}</p>
                </div>
                <div className="flex flex-col justify-end">
                  <p className="text-[10px] text-slate-400">Remaining Balance</p>
                  <p className="text-sm font-black text-rose-400">{formatCurrency(grandTotal - (paymentStatus === "Unpaid" ? 0 : paidAmountState), currency)}</p>
                </div>
              </div>
            </div>
          )}

          <input type="text" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none" />

          {/* Totals */}
          <div className="bg-slate-800/60 rounded-lg p-3 space-y-1 text-xs border border-slate-700/60">
            <div className="flex justify-between text-slate-400"><span>Invoice</span><span className="font-mono font-bold text-amber-400">{invoiceNumber}</span></div>
            <div className="flex justify-between text-slate-400"><span>Customer</span><span className="font-bold text-white truncate ml-2">{customerName}</span></div>
            {supplierName && <div className="flex justify-between text-slate-400"><span>Supplier</span><span className="font-bold text-white truncate ml-2">{supplierName}</span></div>}
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="font-bold text-white">{formatCurrency(subtotal, currency)}</span></div>
            {discount > 0 && <div className="flex justify-between text-rose-400"><span>Discount</span><span>-{formatCurrency(discount, currency)}</span></div>}
            <div className="flex justify-between text-sm font-black text-amber-400 pt-1 border-t border-slate-700"><span>Total</span><span>{formatCurrency(grandTotal, currency)}</span></div>
          </div>

          <button disabled={items.length === 0 || isSubmitting} onClick={handleSubmit} className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2">
            {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Receipt className="w-4 h-4" /> Save Invoice ({invoiceNumber})</>}
          </button>
        </div>
      )}

      {/* SALES HISTORY */}
      {activeTab === "history" && (
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search invoice # or customer..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none">
              <option value="All">All</option><option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2">
            {filteredSales.slice(0, 20).map(s => (
              <div key={s.id} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-amber-400 text-[11px]">{s.invoiceNumber}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.paymentStatus === "Paid" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{s.paymentStatus}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">{s.customerName}</span>
                  <span className="text-sm font-black text-white">{formatCurrency(s.totalAmount, currency)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-500">{formatDate(s.saleDate)}</span>
                  <button onClick={() => onViewInvoice(s)} className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5"><Printer className="w-3 h-3" /> View</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold"><th className="py-2.5 px-3">Invoice #</th><th className="py-2.5 px-3">Customer</th><th className="py-2.5 px-3">Date</th><th className="py-2.5 px-3">Payment</th><th className="py-2.5 px-3 text-right">Total</th><th className="py-2.5 px-3 text-center">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{s.invoiceNumber}</td>
                    <td className="py-3 px-3 font-bold text-white">{s.customerName}</td>
                    <td className="py-3 px-3 text-slate-300">{formatDate(s.saleDate)}</td>
                    <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.paymentStatus === "Paid" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{s.paymentMethod} • {s.paymentStatus}</span></td>
                    <td className="py-3 px-3 text-right font-black text-white">{formatCurrency(s.totalAmount, currency)}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => onViewInvoice(s)} className="p-1 bg-slate-800 hover:bg-slate-700 rounded"><Printer className="w-3 h-3 text-amber-400" /></button>
                        <button onClick={() => { if (confirm(`Void #${s.invoiceNumber}?`)) onDeleteSale(s.id); }} className="p-1 text-rose-400 hover:bg-rose-500/20 rounded"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
