"use client";

import React, { useState } from "react";
import {
  AlertCircle, Download, CreditCard, Banknote, CheckCircle2,
  RefreshCw, Search, TrendingDown, TrendingUp, ArrowDownRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportDebtsToExcel } from "@/lib/excel-export";
import type { Sale, Purchase } from "@/types";

interface DebtsAndCreditsViewProps {
  salesList: Sale[];
  purchasesList: Purchase[];
  currency: string;
  onRefresh: () => void;
}

export function DebtsAndCreditsView({
  salesList, purchasesList, currency, onRefresh,
}: DebtsAndCreditsViewProps) {
  const [activeTab, setActiveTab] = useState<"debts" | "credits">("debts");
  const [searchQuery, setSearchQuery] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Debts = unpaid/partial sales
  const debts = salesList.filter(s => s.paymentStatus === "Partial" || s.paymentStatus === "Unpaid");
  // Credits = unpaid/partial purchases
  const credits = purchasesList.filter(p => p.paymentStatus === "Partial" || p.paymentStatus === "Unpaid");

  const totalDebt = debts.reduce((s, d) => s + (parseFloat(d.totalAmount || "0") - parseFloat(d.paidAmount || "0")), 0);
  const totalCredit = credits.reduce((s, c) => s + (parseFloat(c.totalAmount || "0") - parseFloat(c.paidAmount || "0")), 0);

  const filteredDebts = debts.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.invoiceNumber.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q) || (d.customerPhone && d.customerPhone.toLowerCase().includes(q));
  });

  const filteredCredits = credits.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.purchaseNumber.toLowerCase().includes(q) || c.supplierName.toLowerCase().includes(q);
  });

  const handleRecordPayment = async (type: "sale" | "purchase", id: number) => {
    if (payAmount <= 0) return;
    setIsSubmitting(true);
    try {
      const url = type === "sale" ? `/api/sales/${id}` : `/api/purchases/${id}`;
      const record = type === "sale"
        ? salesList.find(s => s.id === id)
        : purchasesList.find(p => p.id === id);
      if (!record) return;

      const currentPaid = parseFloat(record.paidAmount || "0");
      const newPaid = currentPaid + payAmount;
      const total = parseFloat(record.totalAmount || "0");
      const newStatus = newPaid >= total ? "Paid" : newPaid > 0 ? "Partial" : "Unpaid";

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidAmount: newPaid.toFixed(2),
          paymentStatus: newStatus,
          paymentMethod: payMethod,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccessMsg("Payment recorded successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      setPayingId(null);
      setPayAmount(0);
      onRefresh();
    } catch { alert("Failed to record payment"); }
    finally { setIsSubmitting(false); }
  };

  const getRemaining = (total: string, paid: string) => {
    return Math.max(0, parseFloat(total || "0") - parseFloat(paid || "0"));
  };

  const openPayModal = (id: number) => {
    setPayingId(id);
    setPayAmount(0);
    setPayMethod("Cash");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-xl">
        <div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-6 text-rose-300 border border-rose-500/30">Receivables & Payables</span>
          <h2 className="text-lg font-extrabold text-white mt-0.5">Debts & Credits</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track partial payments, outstanding balances & settle debts</p>
        </div>
        <button
          onClick={() => exportDebtsToExcel(debts, credits)}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5"
        >
          <Download className="w-4 h-4 text-emerald-400" /> Export Excel
        </button>
      </div>

      {successMsg && <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center items-center gap-2 text-emerald-300 text-xs"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> {successMsg}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold text-slate-400">Customer Debts (Receivable)</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400">{formatCurrency(totalDebt, currency)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{debts.length} outstanding invoices</p>
        </div>
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-bold text-slate-400">Supplier Credits (Payable)</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-400">{formatCurrency(totalCredit, currency)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{credits.length} unpaid purchase orders</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs shrink-0">
          <button onClick={() => setActiveTab("debts")} className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1 ${activeTab === "debts" ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}>
            <Banknote className="w-3.5 h-3.5" /> Debts ({debts.length})
          </button>
          <button onClick={() => setActiveTab("credits")} className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1 ${activeTab === "credits" ? "bg-rose-600 text-white" : "text-slate-400"}`}>
            <CreditCard className="w-3.5 h-3.5" /> Credits ({credits.length})
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none" />
        </div>
      </div>

      {/* DEBTS LIST */}
      {activeTab === "debts" && (
        <div className="space-y-2">
          {filteredDebts.length === 0 && <div className="text-center py-10 text-slate-500 text-xs"><CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" /> All sales are fully paid!</div>}
          {filteredDebts.map(d => {
            const remaining = getRemaining(d.totalAmount, d.paidAmount);
            const total = parseFloat(d.totalAmount || "0");
            const paid = parseFloat(d.paidAmount || "0");
            const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;

            return (
              <div key={d.id} className="bg-slate-900/90 rounded-xl p-3 sm:p-4 border border-slate-800 shadow-md space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-xs">{d.invoiceNumber}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${d.paymentStatus === "Partial" ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"}`}>{d.paymentStatus}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">{d.customerName}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(d.saleDate)} {d.customerPhone ? "· " + d.customerPhone : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-white">{formatCurrency(remaining, currency)}</p>
                    <p className="text-[10px] text-slate-400">remaining of {formatCurrency(total, currency)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-400 rounded-full h-2 transition-all" style={{ width: paidPercent + "%" }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Paid: {formatCurrency(paid, currency)} ({paidPercent}%)</span>
                  <span>Remaining: {formatCurrency(remaining, currency)}</span>
                </div>

                {/* Receive Payment */}
                {payingId === d.id ? (
                  <div className="bg-slate-800/60 border border-amber-500/30 rounded-lg p-3 space-y-2">
                    <p className="text-[10px] font-bold text-amber-300">Receive Payment</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input type="number" step="0.01" min="0" max={remaining} placeholder="Amount" value={payAmount || ""} onChange={e => setPayAmount(parseFloat(e.target.value) || 0)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none col-span-2 sm:col-span-1" />
                      <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                        <option value="Cash">Cash</option><option value="Card">Card</option><option value="Bank Transfer">Transfer</option><option value="Cheque">Cheque</option>
                      </select>
                      <button onClick={() => handleRecordPayment("sale", d.id)} disabled={payAmount <= 0 || isSubmitting} className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg disabled:opacity-50 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {isSubmitting ? "..." : "Pay"}
                      </button>
                      <button onClick={() => setPayingId(null)} className="px-3 py-1.5 text-[10px] text-slate-400 hover:text-white">Cancel</button>
                    </div>
                    {payAmount > 0 && (
                      <p className="text-[10px] text-slate-300">
                        After: <span className="font-bold text-emerald-400">{formatCurrency(remaining - payAmount, currency)}</span> remaining
                      </p>
                    )}
                  </div>
                ) : (
                  <button onClick={() => openPayModal(d.id)} className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-[10px] rounded-lg border border-amber-500/30 flex items-center gap-1 w-fit">
                    <Banknote className="w-3 h-3" /> Receive Payment
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREDITS LIST */}
      {activeTab === "credits" && (
        <div className="space-y-2">
          {filteredCredits.length === 0 && <div className="text-center py-10 text-slate-500 text-xs"><CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" /> All purchases are fully paid!</div>}
          {filteredCredits.map(c => {
            const remaining = getRemaining(c.totalAmount, c.paidAmount);
            const total = parseFloat(c.totalAmount || "0");
            const paid = parseFloat(c.paidAmount || "0");
            const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;

            return (
              <div key={c.id} className="bg-slate-900/90 rounded-xl p-3 sm:p-4 border border-slate-800 shadow-md space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400 text-xs">{c.purchaseNumber}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${c.paymentStatus === "Partial" ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"}`}>{c.paymentStatus}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">{c.supplierName}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(c.purchaseDate)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-white">{formatCurrency(remaining, currency)}</p>
                    <p className="text-[10px] text-slate-400">remaining of {formatCurrency(total, currency)}</p>
                  </div>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full h-2 transition-all" style={{ width: paidPercent + "%" }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Paid: {formatCurrency(paid, currency)} ({paidPercent}%)</span>
                  <span>Remaining: {formatCurrency(remaining, currency)}</span>
                </div>

                {payingId === c.id ? (
                  <div className="bg-slate-800/60 border border-emerald-500/30 rounded-lg p-' p-3 space-y-2">
                    <p className="text-[10px] font-bold text-emerald-300">Make Payment</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input type="number" step="0.01" min="0" max={remaining} placeholder="Amount" value={payAmount || ""} onChange={e => setPayAmount(parseFloat(e.target.value) || 0)} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none col-span-2 sm:col-span-1" />
                      <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                        <option value="Bank Transfer">Transfer</option><option value="Cash">Cash</option><option value="Cheque">Cheque</option>
                      </select>
                      <button onClick={() => handleRecordPayment("purchase", c.id)} disabled={payAmount <= 0 || isSubmitting} className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-[10px] rounded-lg disabled:opacity-50 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {isSubmitting ? "..." : "Pay"}
                      </button>
                      <button onClick={() => setPayingId(null)} className="px-3 py-1.5 text-[10px] text-slate-400 hover:text-white">Cancel</button>
                    </div>
                    {payAmount > 0 && (
                      <p className="text-[10px] text-slate-300">
                        After: <span className="font-bold text-emerald-400">{formatCurrency(remaining - payAmount, currency)}</span> remaining
                      </p>
                    )}
                  </div>
                ) : (
                  <button onClick={() => openPayModal(c.id)} className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-bold text-[10px] rounded-lg border border-emerald-600/30 flex items-center gap-1 w-fit">
                    <CreditCard className="w-3 h-3" /> Make Payment
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
