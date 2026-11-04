"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Truck,
  Building,
  Calendar,
  DollarSign,
  Layers,
  Eye,
  RefreshCw,
  Hash,
  X,
  Banknote,
  FileSpreadsheet
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToExcel } from "@/lib/excel";
import type { Product, Purchase, Supplier, PurchaseItem } from "@/types";

interface PurchasesViewProps {
  products: Product[];
  purchasesList: Purchase[];
  suppliers: Supplier[];
  currency: string;
  onPurchaseCreated: () => void;
  onViewPurchase: (purchase: Purchase) => void;
  onDeletePurchase: (purchaseId: number) => void;
}

export function PurchasesView({
  products,
  purchasesList,
  suppliers,
  currency,
  onPurchaseCreated,
  onViewPurchase,
  onDeletePurchase,
}: PurchasesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const generateNewPONumber = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `HC-PO-${randomSuffix}`;
  };

  // New PO Form State
  const [purchaseNumber, setPurchaseNumber] = useState<string>(generateNewPONumber());
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [supplierMode, setSupplierMode] = useState<"existing" | "new">("existing");
  const [supplierName, setSupplierName] = useState(suppliers[0]?.name || "Silk Route Carpet Mills Ltd");
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(suppliers[0]?.id || null);
  const [newSupplierCompany, setNewSupplierCompany] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [paidAmountInput, setPaidAmountInput] = useState("0");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [poItems, setPoItems] = useState<
    Array<{
      productId: number;
      productName: string;
      unit: string;
      dimensions?: string | null;
      quantity: number;
      unitCost: number;
    }>
  >([
    {
      productId: products[0]?.id || 1,
      productName: products[0]?.name || "Readmade Carpet",
      unit: products[0]?.unit || "pcs",
      dimensions: products[0]?.dimensions || "",
      quantity: 10,
      unitCost: parseFloat(products[0]?.costPrice || "48.00"),
    },
  ]);

  const openNewPurchaseModal = () => {
    setPurchaseNumber(generateNewPONumber());
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setSupplierMode("existing");
    setSupplierName(suppliers[0]?.name || "Silk Route Carpet Mills Ltd");
    setSelectedSupplierId(suppliers[0]?.id || null);
    setNewSupplierCompany("");
    setNewSupplierPhone("");
    setNewSupplierEmail("");
    setNewSupplierAddress("");
    setPaymentStatus("Paid");
    setPaidAmountInput("0");
    if (products.length > 0) {
      setPoItems([
        {
          productId: products[0].id,
          productName: products[0].name,
          unit: products[0].unit,
          dimensions: products[0].dimensions,
          quantity: 10,
          unitCost: parseFloat(products[0].costPrice || "48.00"),
        },
      ]);
    }
    setIsModalOpen(true);
  };

  const addPoItem = () => {
    const defaultProd = products[0];
    if (!defaultProd) return;
    setPoItems((prev) => [
      ...prev,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        unit: defaultProd.unit,
        dimensions: defaultProd.dimensions,
        quantity: 5,
        unitCost: parseFloat(defaultProd.costPrice || "0"),
      },
    ]);
  };

  const updateItemProduct = (index: number, productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setPoItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        productName: prod.name,
        unit: prod.unit,
        dimensions: prod.dimensions,
        unitCost: parseFloat(prod.costPrice || "0"),
      };
      return updated;
    });
  };

  const updateItemQty = (index: number, qty: number) => {
    setPoItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = Math.max(0, qty);
      return updated;
    });
  };

  const updateItemCost = (index: number, cost: number) => {
    setPoItems((prev) => {
      const updated = [...prev];
      updated[index].unitCost = Math.max(0, cost);
      return updated;
    });
  };

  const removePoItem = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const poSubtotal = poItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const poTotal = poSubtotal;
  const paidAmount = Math.min(poTotal, Math.max(0, parseFloat(paidAmountInput) || 0));
  const poRemaining = Math.max(0, poTotal - paidAmount);

  const handlePoPaymentStatusChange = (status: string) => {
    setPaymentStatus(status);
    if (status === "Paid") {
      setPaidAmountInput(poTotal.toFixed(2));
    } else if (status === "Unpaid") {
      setPaidAmountInput("0");
    } else if (status === "Partial") {
      setPaidAmountInput((poTotal / 2).toFixed(2));
    }
  };

  const handleSubmitPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) return;
    setIsSubmitting(true);

    try {
      const finalPONumber = (purchaseNumber || "").trim() || generateNewPONumber();

      // If the user chose to enter a new supplier, save it first and link its ID
      let linkedSupplierId: number | null = null;
      if (supplierMode === "new") {
        const newName = supplierName.trim();
        if (!newName) {
          alert("Please enter the new supplier's name.");
          setIsSubmitting(false);
          return;
        }
        const supRes = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newName,
            companyName: newSupplierCompany || newName,
            phone: newSupplierPhone || "",
            email: newSupplierEmail || "",
            address: newSupplierAddress || "",
            notes: "Added from purchase invoice record",
          }),
        });
        if (!supRes.ok) throw new Error("Failed to create supplier");
        const newSup = await supRes.json();
        linkedSupplierId = newSup.id;
      } else {
        linkedSupplierId = selectedSupplierId;
      }

      const payload = {
        purchaseNumber: finalPONumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        supplierId: linkedSupplierId,
        supplierName,
        subtotal: poSubtotal.toFixed(2),
        tax: "0.00",
        shippingFee: "0.00",
        totalAmount: poTotal.toFixed(2),
        paidAmount:
          paymentStatus === "Paid"
            ? poTotal.toFixed(2)
            : paymentStatus === "Unpaid"
            ? "0.00"
            : paidAmount.toFixed(2),
        paymentStatus,
        paymentMethod,
        notes,
        items: poItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unit: item.unit,
          dimensions: item.dimensions,
          quantity: item.quantity,
          unitCost: item.unitCost.toFixed(2),
          totalPrice: (item.quantity * item.unitCost).toFixed(2),
        })),
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create purchase order");

      setIsModalOpen(false);
      onPurchaseCreated();
    } catch (err) {
      console.error(err);
      alert("Failed to save purchase order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPurchases = purchasesList.filter((po) => {
    const matchStatus = statusFilter === "All" || po.paymentStatus.toLowerCase() === statusFilter.toLowerCase();
    const matchSearch =
      po.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPoValue = purchasesList.reduce((sum, po) => sum + parseFloat(po.totalAmount || "0"), 0);
  const totalPaidToSuppliers = purchasesList.reduce((sum, po) => sum + parseFloat(po.paidAmount || "0"), 0);
  const totalPayable = purchasesList.reduce(
    (sum, po) => sum + Math.max(0, parseFloat(po.totalAmount || "0") - parseFloat(po.paidAmount || "0")),
    0
  );

  const handleExportExcel = () => {
    const rows = purchasesList.map((po) => ({
      "Purchase #": po.purchaseNumber,
      Supplier: po.supplierName,
      Date: formatDate(po.purchaseDate),
      Subtotal: parseFloat(po.subtotal || "0"),
      Total: parseFloat(po.totalAmount || "0"),
      Paid: parseFloat(po.paidAmount || "0"),
      Remaining: Math.max(0, parseFloat(po.totalAmount || "0") - parseFloat(po.paidAmount || "0")),
      "Payment Method": po.paymentMethod,
      Status: po.paymentStatus,
    }));
    exportToExcel(`Hamudi_Carpet_Purchases_${new Date().toISOString().slice(0, 10)}`, "Purchases", rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Procurement & Inventory Inflow
            </span>
            <span className="text-xs text-slate-400">Supplier Purchase Invoices & Orders</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Hamudi Carpet Stock Purchases
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record supplier invoice / PO replenishment orders from carpet mills.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={purchasesList.length === 0}
            className="px-3.5 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            title="Export all purchase records to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button
            onClick={openNewPurchaseModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <Package className="w-4 h-4" />
            <span>+ Record Purchase</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase Invoices</p>
          <p className="text-2xl font-black text-white mt-1">{purchasesList.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">All purchase records</p>
        </div>
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Purchases</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(totalPoValue, currency)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Stock procurement cost</p>
        </div>
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid to Suppliers</p>
          <p className="text-2xl font-black text-cyan-400 mt-1">{formatCurrency(totalPaidToSuppliers, currency)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Amount settled</p>
        </div>
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier Credits</p>
          <p className={`text-2xl font-black mt-1 ${totalPayable > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {formatCurrency(totalPayable, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Remaining to pay</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Purchase Invoice # (e.g. HC-PO-201) or supplier name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="All">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Unpaid">Unpaid</option>
        </select>
      </div>

      {/* Purchases - Mobile Card List */}
      <div className="md:hidden space-y-3">
        {filteredPurchases.length === 0 ? (
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-8 text-center text-slate-400 text-xs">
            No purchase orders found.
          </div>
        ) : (
          filteredPurchases.map((po) => (
            <div key={po.id} className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-emerald-400 text-xs">{po.purchaseNumber}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {po.paymentStatus}
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-white">{po.supplierName}</p>
                <p className="text-[11px] text-slate-400">
                  {formatDate(po.purchaseDate)} • {po.paymentMethod}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/70">
                <div>
                  <span className="text-lg font-black text-emerald-400">{formatCurrency(po.totalAmount, currency)}</span>
                  <p className="text-[10px] text-slate-400">Subtotal: {formatCurrency(po.subtotal, currency)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewPurchase(po)}
                    className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" /> View
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete PO #${po.purchaseNumber}? Stock added from this PO will be removed.`)) {
                        onDeletePurchase(po.id);
                      }
                    }}
                    className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl active:scale-95 transition-transform"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Purchases List Table (desktop) */}
      <div className="hidden md:block bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold bg-slate-800/40">
                <th className="py-3 px-4">Invoice / PO #</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {po.purchaseNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white">{po.supplierName}</span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-300">
                      {formatDate(po.purchaseDate)}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {po.paymentMethod} • {po.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right text-slate-300">
                      {formatCurrency(po.subtotal, currency)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-white text-sm">
                      {formatCurrency(po.totalAmount, currency)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onViewPurchase(po)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete PO #${po.purchaseNumber}? Stock added from this PO will be removed.`)) {
                              onDeletePurchase(po.id);
                            }
                          }}
                          className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PURCHASE ORDER / INVOICE MODAL (bottom sheet on mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:pb-6">
            
            <div className="mx-auto w-10 h-1 rounded-full bg-slate-700 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-extrabold text-white">Record Carpet Purchase Invoice</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition-transform">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="space-y-4">
              
              {/* PURCHASE INVOICE / BILL NUMBER & DATE */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" /> Purchase Invoice / PO Number
                  </label>
                  <button
                    type="button"
                    onClick={() => setPurchaseNumber(generateNewPONumber())}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    title="Generate New PO Number"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto Gen
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={purchaseNumber}
                      onChange={(e) => setPurchaseNumber(e.target.value)}
                      placeholder="e.g. HC-PO-205 or Mill Bill #1049"
                      className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div className="relative">
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier info */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" /> Supplier / Carpet Mill
                  </label>
                  {supplierMode === "new" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierMode("existing");
                        setSupplierName(suppliers[0]?.name || "");
                        setSelectedSupplierId(suppliers[0]?.id || null);
                        setNewSupplierCompany("");
                        setNewSupplierPhone("");
                        setNewSupplierEmail("");
                        setNewSupplierAddress("");
                      }}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Cancel new supplier
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={supplierMode === "new" ? "new" : String(selectedSupplierId || "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "new") {
                        setSupplierMode("new");
                        setSelectedSupplierId(null);
                        setSupplierName("");
                      } else {
                        const s = suppliers.find((sup) => sup.id === parseInt(val, 10));
                        setSupplierMode("existing");
                        setSelectedSupplierId(s?.id ?? null);
                        setSupplierName(s?.name || "");
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} {sup.companyName ? `(${sup.companyName})` : ""}
                      </option>
                    ))}
                    <option value="new">+ Enter New Supplier...</option>
                  </select>
                </div>

                {/* New supplier details */}
                {supplierMode === "new" && (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                      New Supplier Details (will be saved to directory)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        placeholder="Supplier / Mill Name *"
                        className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newSupplierCompany}
                        onChange={(e) => setNewSupplierCompany(e.target.value)}
                        placeholder="Company Name (optional)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        placeholder="Phone (optional)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="email"
                        value={newSupplierEmail}
                        onChange={(e) => setNewSupplierEmail(e.target.value)}
                        placeholder="Email (optional)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newSupplierAddress}
                        onChange={(e) => setNewSupplierAddress(e.target.value)}
                        placeholder="Address (optional)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none sm:col-span-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300">Carpet Products to Restock</label>
                  <button
                    type="button"
                    onClick={addPoItem}
                    className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {poItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-5">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItemProduct(index, parseInt(e.target.value, 10))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.dimensions ? `(${p.dimensions})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateItemQty(index, parseFloat(e.target.value) || 0)}
                          placeholder="Qty"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) => updateItemCost(index, parseFloat(e.target.value) || 0)}
                          placeholder="Cost Price"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        {poItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePoItem(index)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment to Supplier */}
              <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-3 space-y-2.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" /> Payment to Supplier
                </label>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => handlePoPaymentStatusChange(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="Paid">Paid (Full)</option>
                      <option value="Partial">Partial Payment</option>
                      <option value="Unpaid">Unpaid (Credit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Credit Term">Credit 30 Days</option>
                    </select>
                  </div>
                </div>

                {paymentStatus !== "Paid" && (
                  <div className="bg-slate-900/70 border border-emerald-500/30 rounded-xl p-2.5 space-y-1.5">
                    <label className="text-[10px] font-bold text-emerald-300 block">
                      {paymentStatus === "Partial" ? "Amount Paying Now" : "Amount Paying Now (optional)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={poTotal}
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaidAmountInput(poTotal.toFixed(2))}
                        className="flex-1 py-1 text-[10px] font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30"
                      >
                        Full ({formatCurrency(poTotal, currency)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaidAmountInput((poTotal / 2).toFixed(2))}
                        className="flex-1 py-1 text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700"
                      >
                        Half ({formatCurrency(poTotal / 2, currency)})
                      </button>
                    </div>
                    <div className="flex justify-between text-xs pt-1.5 border-t border-emerald-500/20">
                      <span className="text-emerald-200 font-bold">Remaining to Pay</span>
                      <span className="font-black text-rose-400">{formatCurrency(poRemaining, currency)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Purchase Invoice #</span>
                  <span className="font-mono font-bold text-emerald-400">{purchaseNumber || "Auto Assigned"}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">{formatCurrency(poSubtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Paid to Supplier</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(paymentStatus === "Paid" ? poTotal : paidAmount, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Remaining</span>
                  <span className="font-bold text-rose-400">{formatCurrency(paymentStatus === "Paid" ? 0 : poRemaining, currency)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-emerald-400 pt-1.5 border-t border-slate-700">
                  <span>Total Purchase Cost</span>
                  <span>{formatCurrency(poTotal, currency)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm & Save PO ({purchaseNumber})
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
