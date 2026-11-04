"use client";

import React, { useState } from "react";
import {
  Search,
  Receipt,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Hash,
  Eye,
  X,
  User,
  Banknote,
  FileSpreadsheet
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToExcel } from "@/lib/excel";
import type { Product, Sale, Customer } from "@/types";

interface SalesViewProps {
  products: Product[];
  salesList: Sale[];
  customers: Customer[];
  currency: string;
  onSaleCreated: () => void;
  onViewInvoice: (sale: Sale) => void;
  onDeleteSale: (saleId: number) => void;
}

interface SaleFormItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export function SalesView({
  products,
  salesList,
  customers,
  currency,
  onSaleCreated,
  onViewInvoice,
  onDeleteSale,
}: SalesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [customerMode, setCustomerMode] = useState<"walkin" | "existing" | "new">("walkin");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [receivedAmount, setReceivedAmount] = useState("0");
  const [discount, setDiscount] = useState<number>(0);
  const [items, setItems] = useState<SaleFormItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateInvoiceNumber = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `HC-INV-${randomSuffix}`;
  };

  const openModal = () => {
    setInvoiceNumber(generateInvoiceNumber());
    setSaleDate(new Date().toISOString().split("T")[0]);
    setCustomerMode("walkin");
    setSelectedCustomerId(null);
    setCustomerName("Walk-in Customer");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setPaymentMethod("Cash");
    setPaymentStatus("Paid");
    setReceivedAmount("0");
    setDiscount(0);
    setItems(
      products.length > 0
        ? [{ productId: products[0].id, quantity: 1, unitPrice: parseFloat(products[0].sellingPrice || "0") }]
        : []
    );
    setIsModalOpen(true);
  };

  const updateItem = (index: number, patch: Partial<SaleFormItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleProductChange = (index: number, productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      updateItem(index, { productId, unitPrice: parseFloat(prod.sellingPrice || "0") });
    }
  };

  const addItem = () => {
    if (products.length === 0) return;
    setItems((prev) => [
      ...prev,
      { productId: products[0].id, quantity: 1, unitPrice: parseFloat(products[0].sellingPrice || "0") },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - (discount || 0));
  const received = Math.min(total, Math.max(0, parseFloat(receivedAmount) || 0));
  const remainingBalance = Math.max(0, total - received);

  const handlePaymentStatusChange = (status: string) => {
    setPaymentStatus(status);
    if (status === "Paid") {
      setReceivedAmount(total.toFixed(2));
    } else if (status === "Unpaid") {
      setReceivedAmount("0");
    } else if (status === "Partial") {
      // Default: suggest half payment, user can adjust
      setReceivedAmount((total / 2).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      const finalInvoice = (invoiceNumber || "").trim() || generateInvoiceNumber();

      // If the user chose to create a new customer, save it first and link its ID
      let linkedCustomerId: number | null = null;
      if (customerMode === "new") {
        const custName = customerName.trim();
        if (!custName) {
          alert("Please enter the new customer's name.");
          setIsSubmitting(false);
          return;
        }
        const custRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: custName,
            phone: customerPhone || "",
            email: customerEmail || "",
            address: customerAddress || "",
            notes: "Added from sale invoice record",
          }),
        });
        if (!custRes.ok) throw new Error("Failed to create customer");
        const newCust = await custRes.json();
        linkedCustomerId = newCust.id;
      } else if (customerMode === "existing") {
        linkedCustomerId = selectedCustomerId;
      }

      const payload = {
        invoiceNumber: finalInvoice,
        saleDate: saleDate ? new Date(saleDate) : new Date(),
        customerId: linkedCustomerId,
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || "",
        subtotal: subtotal.toFixed(2),
        discount: (discount || 0).toFixed(2),
        totalAmount: total.toFixed(2),
        totalCost: items
          .reduce((sum, item) => {
            const prod = products.find((p) => p.id === item.productId);
            return sum + item.quantity * parseFloat(prod?.costPrice || "0");
          }, 0)
          .toFixed(2),
        paidAmount:
          paymentStatus === "Paid"
            ? total.toFixed(2)
            : paymentStatus === "Unpaid"
            ? "0.00"
            : received.toFixed(2),
        paymentMethod,
        paymentStatus,
        amountReceived: received.toFixed(2),
        remainingBalance: remainingBalance.toFixed(2),
        notes: "",
        items: items.map((item) => {
          const prod = products.find((p) => p.id === item.productId);
          return {
            productId: item.productId,
            productName: prod?.name || "Unknown Product",
            unit: prod?.unit || "pcs",
            dimensions: prod?.dimensions || "",
            quantity: item.quantity,
            unitPrice: item.unitPrice.toFixed(2),
            unitCost: prod?.costPrice || "0.00",
            totalPrice: (item.quantity * item.unitPrice).toFixed(2),
          };
        }),
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to record sale");

      const createdSale = await res.json();
      setSuccessMessage(`Invoice #${createdSale.invoiceNumber} recorded successfully!`);
      setIsModalOpen(false);
      onSaleCreated();
      onViewInvoice(createdSale);
    } catch (err) {
      console.error(err);
      alert("Error recording sale. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSales = salesList.filter((s) => {
    const matchStatus = statusFilter === "All" || s.paymentStatus.toLowerCase() === statusFilter.toLowerCase();
    const matchSearch =
      s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerPhone && s.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const totalRevenue = salesList.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);
  const totalCollected = salesList.reduce((sum, s) => sum + parseFloat(s.paidAmount || "0"), 0);
  const unpaidBalance = salesList.reduce(
    (sum, s) => sum + (parseFloat(s.totalAmount || "0") - parseFloat(s.paidAmount || "0")),
    0
  );

  const handleExportExcel = () => {
    const rows = salesList.map((s) => ({
      "Invoice #": s.invoiceNumber,
      Customer: s.customerName,
      Phone: s.customerPhone || "",
      Date: formatDate(s.saleDate),
      Subtotal: parseFloat(s.subtotal || "0"),
      Discount: parseFloat(s.discount || "0"),
      Total: parseFloat(s.totalAmount || "0"),
      Paid: parseFloat(s.paidAmount || "0"),
      Remaining: Math.max(0, parseFloat(s.totalAmount || "0") - parseFloat(s.paidAmount || "0")),
      "Payment Method": s.paymentMethod,
      Status: s.paymentStatus,
    }));
    exportToExcel(`Hamudi_Carpet_Sales_${new Date().toISOString().slice(0, 10)}`, "Sales", rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Hamudi Carpet Sales
            </span>
            <span className="text-xs text-slate-400">Sales Records & Invoices</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Hamudi Carpet Sales Records
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record a sale with its invoice number and keep a full history of every transaction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={salesList.length === 0}
            className="px-3.5 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            title="Export all sales records to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button
            onClick={openModal}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Sale</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-emerald-300 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoices</p>
          <p className="text-2xl font-black text-white mt-1">{salesList.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">All recorded sales</p>
        </div>
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(totalRevenue, currency)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Invoice value</p>
        </div>
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount Collected</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(totalCollected, currency)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Received from customers</p>
        </div>
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding</p>
          <p className={`text-2xl font-black mt-1 ${unpaidBalance > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {formatCurrency(unpaidBalance, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Customer debts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice number (e.g. HC-INV-1002), customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Unpaid">Unpaid</option>
        </select>
      </div>

      {/* Sales History - Mobile Card List */}
      <div className="md:hidden space-y-3">
        {filteredSales.length === 0 ? (
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-8 text-center text-slate-400 text-xs">
            No sales invoices found.
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div key={sale.id} className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-amber-400 text-xs">{sale.invoiceNumber}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                  sale.paymentStatus === "Paid"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  {sale.paymentStatus}
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-white">{sale.customerName}</p>
                <p className="text-[11px] text-slate-400">
                  {formatDate(sale.saleDate)} • {sale.paymentMethod}
                  {parseFloat(sale.discount || "0") > 0 && ` • Disc: -${formatCurrency(sale.discount, currency)}`}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/70">
                <span className="text-lg font-black text-amber-400">{formatCurrency(sale.totalAmount, currency)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewInvoice(sale)}
                    className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" /> View
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete invoice #${sale.invoiceNumber}? Stock will be restored.`)) {
                        onDeleteSale(sale.id);
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

      {/* Sales History Table (desktop) */}
      <div className="hidden md:block bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold bg-slate-800/40">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Sale Date</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No sales invoices found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {sale.invoiceNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white">{sale.customerName}</span>
                      {sale.customerPhone && (
                        <p className="text-[11px] text-slate-400">{sale.customerPhone}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-slate-300">
                      {formatDate(sale.saleDate)}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        sale.paymentStatus === "Paid"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}>
                        {sale.paymentMethod} • {sale.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right text-rose-400">
                      {parseFloat(sale.discount || "0") > 0 ? `-${formatCurrency(sale.discount, currency)}` : "-"}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-white text-sm">
                      {formatCurrency(sale.totalAmount, currency)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewInvoice(sale)}
                          title="View / Print Invoice"
                          className="p-1.5 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete invoice #${sale.invoiceNumber}? Stock will be restored.`)) {
                              onDeleteSale(sale.id);
                            }
                          }}
                          title="Delete Sale"
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
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

      {/* RECORD SALE MODAL (bottom sheet on mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:pb-6">
            
            <div className="mx-auto w-10 h-1 rounded-full bg-slate-700 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-extrabold text-white">Record New Sale</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition-transform">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Invoice Number & Date */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" /> Invoice Number
                  </label>
                  <button
                    type="button"
                    onClick={() => setInvoiceNumber(generateInvoiceNumber())}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto Gen
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. HC-INV-1025"
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Customer */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" /> Customer
                  </label>
                  {customerMode === "new" && (
                    <button
                      type="button"
                      onClick={() => { setCustomerMode("walkin"); setSelectedCustomerId(null); setCustomerName("Walk-in Customer"); setCustomerPhone(""); setCustomerEmail(""); setCustomerAddress(""); }}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Cancel new customer
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={customerMode === "walkin" ? "walkin" : customerMode === "new" ? "new" : String(selectedCustomerId || "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "walkin") {
                        setCustomerMode("walkin");
                        setSelectedCustomerId(null);
                        setCustomerName("Walk-in Customer");
                        setCustomerPhone("");
                        setCustomerEmail("");
                        setCustomerAddress("");
                      } else if (val === "new") {
                        setCustomerMode("new");
                        setSelectedCustomerId(null);
                        setCustomerName("");
                        setCustomerPhone("");
                        setCustomerEmail("");
                        setCustomerAddress("");
                      } else {
                        const cust = customers.find((c) => c.id === parseInt(val, 10));
                        setCustomerMode("existing");
                        setSelectedCustomerId(cust?.id ?? null);
                        setCustomerName(cust?.name || "");
                        setCustomerPhone(cust?.phone || "");
                        setCustomerEmail(cust?.email || "");
                        setCustomerAddress(cust?.address || "");
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="walkin">Walk-in Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.phone ? ` — ${c.phone}` : ""}
                      </option>
                    ))}
                    <option value="new">+ Enter New Customer...</option>
                  </select>

                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone (+251 9xx xxx xxx)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* New customer details */}
                {customerMode === "new" && (
                  <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                      New Customer Details (will be saved to directory)
                    </p>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name *"
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Email (optional)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Address (optional)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300">Items Sold</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-5">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, parseInt(e.target.value, 10))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.dimensions ? `(${p.dimensions})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(index)} className="text-slate-500 hover:text-rose-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Totals */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 space-y-2.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-amber-400" /> Payment
                </label>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => handlePaymentStatusChange(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="Paid">Paid (Full)</option>
                      <option value="Partial">Partial Payment</option>
                      <option value="Unpaid">Unpaid (Credit)</option>
                    </select>
                  </div>
                </div>

                {paymentStatus !== "Paid" && (
                  <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-2.5 space-y-1.5">
                    <label className="text-[10px] font-bold text-amber-300 block">
                      {paymentStatus === "Partial" ? "Amount Received Now" : "Amount Received Now (optional)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={total}
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReceivedAmount(total.toFixed(2))}
                        className="flex-1 py-1 text-[10px] font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30"
                      >
                        Full ({formatCurrency(total, currency)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceivedAmount((total / 2).toFixed(2))}
                        className="flex-1 py-1 text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700"
                      >
                        Half ({formatCurrency(total / 2, currency)})
                      </button>
                    </div>
                    <div className="flex justify-between text-xs pt-1.5 border-t border-amber-500/20">
                      <span className="text-amber-200 font-bold">Remaining Balance</span>
                      <span className="font-black text-rose-400">{formatCurrency(remainingBalance, currency)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Discount & Totals */}
              <div className="bg-slate-800/60 rounded-xl p-3 space-y-1.5 text-xs border border-slate-700/60">
                <div className="flex justify-between text-slate-400">
                  <span>Discount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount || ""}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-right focus:outline-none"
                  />
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Received</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(paymentStatus === "Paid" ? total : received, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Remaining</span>
                  <span className="font-bold text-rose-400">{formatCurrency(paymentStatus === "Paid" ? 0 : remainingBalance, currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-amber-400 pt-1.5 border-t border-slate-700">
                  <span>Grand Total</span>
                  <span className="text-base">{formatCurrency(total, currency)}</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={items.length === 0 || isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving Invoice...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Record Invoice {invoiceNumber || ""}
                  </>
                )}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
