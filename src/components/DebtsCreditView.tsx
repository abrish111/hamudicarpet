"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Landmark,
  RefreshCw,
  Download,
  Banknote,
  CheckCircle2,
  X,
  Scale
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToExcel } from "@/lib/excel";

interface DebtRow {
  id: number;
  reference: string;
  partyName: string;
  partyPhone?: string;
  date: string;
  total: number;
  paid: number;
  remaining: number;
  paymentMethod: string;
  paymentStatus: string;
}

interface DebtsCreditViewProps {
  currency: string;
  refreshKey?: number;
}

interface PaymentTarget {
  type: "sale" | "purchase";
  row: DebtRow;
}

export function DebtsCreditView({ currency, refreshKey = 0 }: DebtsCreditViewProps) {
  const [activeTab, setActiveTab] = useState<"receivables" | "payables">("receivables");
  const [data, setData] = useState<{
    summary: {
      totalReceivable: number;
      totalPayable: number;
      netPosition: number;
      receivableCount: number;
      payableCount: number;
      debtorCustomers: number;
      creditorSuppliers: number;
    };
    receivables: DebtRow[];
    payables: DebtRow[];
    receivableByCustomer: { name: string; phone: string; remaining: number; count: number }[];
    payableBySupplier: { name: string; remaining: number; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isRecording, setIsRecording] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/debts");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load debts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const openPayment = (type: "sale" | "purchase", row: DebtRow) => {
    setPaymentTarget({ type, row });
    setPaymentAmount(row.remaining.toFixed(2));
    setPaymentMethod(row.paymentMethod === "Bank Transfer" ? "Bank Transfer" : "Cash");
    setSuccessMsg(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;
    setIsRecording(true);

    const amount = parseFloat(paymentAmount || "0");
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      setIsRecording(false);
      return;
    }

    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: paymentTarget.type,
          id: paymentTarget.row.id,
          amount: amount > paymentTarget.row.remaining ? paymentTarget.row.remaining : amount,
          method: paymentMethod,
        }),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      const json = await res.json();

      const isSale = paymentTarget.type === "sale";
      setSuccessMsg(
        `${isSale ? "Payment received" : "Payment made"} for ${paymentTarget.row.reference} — Remaining: ${formatCurrency(json.remaining, currency)}`
      );
      setPaymentTarget(null);
      fetchData();
    } catch (err) {
      alert("Error recording payment");
    } finally {
      setIsRecording(false);
    }
  };

  // Excel export helpers
  const exportReceivablesExcel = () => {
    if (!data) return;
    const rows = data.receivables.map((r) => ({
      "Invoice #": r.reference,
      Customer: r.partyName,
      Phone: r.partyPhone || "",
      Date: formatDate(r.date),
      "Total (ETB)": r.total,
      "Paid (ETB)": r.paid,
      "Remaining (ETB)": r.remaining,
      Status: r.paymentStatus,
      "Payment Method": r.paymentMethod,
    }));
    exportToExcel(`Hamudi_Customer_Debts_${new Date().toISOString().slice(0, 10)}`, "Customer Debts", rows);
  };

  const exportPayablesExcel = () => {
    if (!data) return;
    const rows = data.payables.map((p) => ({
      "Purchase #": p.reference,
      Supplier: p.partyName,
      Date: formatDate(p.date),
      "Total (ETB)": p.total,
      "Paid (ETB)": p.paid,
      "Remaining (ETB)": p.remaining,
      Status: p.paymentStatus,
      "Payment Method": p.paymentMethod,
    }));
    exportToExcel(`Hamudi_Supplier_Credits_${new Date().toISOString().slice(0, 10)}`, "Supplier Credits", rows);
  };

  const exportSummaryExcel = () => {
    if (!data) return;
    const summaryRows = [
      { "Metric": "Total Customer Debts (Receivables)", "Amount (ETB)": data.summary.totalReceivable },
      { "Metric": "Total Supplier Credits (Payables)", "Amount (ETB)": data.summary.totalPayable },
      { "Metric": "Net Position", "Amount (ETB)": data.summary.netPosition },
    ];
    exportToExcel(`Hamudi_Debt_Credit_Summary_${new Date().toISOString().slice(0, 10)}`, "Summary", summaryRows);
  };

  if (loading && !data) {
    return (
      <div className="bg-slate-900/90 rounded-2xl p-12 border border-slate-800 text-center">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-300">Loading Debts & Credit Ledger...</p>
      </div>
    );
  }

  const summary = data?.summary;
  const rows = activeTab === "receivables" ? data?.receivables ?? [] : data?.payables ?? [];
  const grouped =
    activeTab === "receivables" ? data?.receivableByCustomer ?? [] : data?.payableBySupplier ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Money In & Money Out
            </span>
            <span className="text-xs text-slate-400">Debtors (Customers) & Creditors (Suppliers)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Hamudi Carpet Debts & Credit Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track unpaid customer invoices and unpaid supplier purchase bills.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSummaryExcel}
            className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export Summary
          </button>
          <button
            onClick={fetchData}
            className="px-3 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-emerald-300 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs underline hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-amber-400" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Debts (Receivables)</p>
            </div>
            <p className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(summary.totalReceivable, currency)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{summary.receivableCount} invoices • {summary.debtorCustomers} customers</p>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Landmark className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier Credits (Payables)</p>
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(summary.totalPayable, currency)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{summary.payableCount} bills • {summary.creditorSuppliers} suppliers</p>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-cyan-400" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Position</p>
            </div>
            <p className={`text-2xl font-black mt-1 ${summary.netPosition >= 0 ? "text-cyan-400" : "text-rose-400"}`}>
              {formatCurrency(summary.netPosition, currency)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Receivables minus payables</p>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Items</p>
            <p className="text-2xl font-black text-white mt-1">{summary.receivableCount + summary.payableCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="text-amber-300">{summary.receivableCount} to collect</span> • <span className="text-emerald-300">{summary.payableCount} to pay</span>
            </p>
          </div>
        </div>
      )}

      {/* Tab Switcher + Export */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab("receivables")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "receivables" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Customer Debts ({rows.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("payables")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "payables" ? "bg-emerald-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Supplier Credits ({rows.length || 0})</span>
          </button>
        </div>

        <button
          onClick={activeTab === "receivables" ? exportReceivablesExcel : exportPayablesExcel}
          className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Export {activeTab === "receivables" ? "Debts" : "Credits"} to Excel
        </button>
      </div>

      {/* Grouped party summary chips */}
      {grouped.length > 0 && (
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
          <p className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2.5">
            {activeTab === "receivables" ? "Per Customer" : "Per Supplier"}
          </p>
          <div className="flex flex-wrap gap-2">
            {grouped.map((g) => (
              <div key={g.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 border border-slate-700 text-xs">
                <span className="font-bold text-white">{g.name}</span>
                <span className="text-[10px] text-slate-400">{g.count} item(s)</span>
                <span className={`font-black ${activeTab === "receivables" ? "text-amber-400" : "text-emerald-400"}`}>
                  {formatCurrency(g.remaining, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold bg-slate-800/40">
                <th className="py-3 px-4">{activeTab === "receivables" ? "Invoice #" : "Purchase #"}</th>
                <th className="py-3 px-4">{activeTab === "receivables" ? "Customer" : "Supplier"}</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Remaining</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    {activeTab === "receivables"
                      ? "🎉 No customer debts! All invoices are fully paid."
                      : "🎉 No supplier credits! All purchase bills are fully paid."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${activeTab}-${row.id}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{row.reference}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white">{row.partyName}</span>
                      {row.partyPhone && <p className="text-[11px] text-slate-400">{row.partyPhone}</p>}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">{formatDate(row.date)}</td>
                    <td className="py-3.5 px-3 text-right text-slate-300">{formatCurrency(row.total, currency)}</td>
                    <td className="py-3.5 px-3 text-right text-emerald-400 font-semibold">{formatCurrency(row.paid, currency)}</td>
                    <td className="py-3.5 px-3 text-right font-black text-rose-400">{formatCurrency(row.remaining, currency)}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.paymentStatus === "Partial" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}>
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openPayment(activeTab === "receivables" ? "sale" : "purchase", row)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition-all active:scale-95 ${
                          activeTab === "receivables"
                            ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        {activeTab === "receivables" ? "Receive" : "Pay"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {rows.length === 0 ? (
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-8 text-center text-slate-400 text-xs">
            {activeTab === "receivables"
              ? "🎉 No customer debts! All invoices are fully paid."
              : "🎉 No supplier credits! All purchase bills are fully paid."}
          </div>
        ) : (
          rows.map((row) => (
            <div key={`${activeTab}-${row.id}`} className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-amber-400 text-xs">{row.reference}</span>
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                  row.paymentStatus === "Partial" ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"
                }`}>
                  {row.paymentStatus}
                </span>
              </div>
              <p className="text-sm font-bold text-white">{row.partyName}</p>
              <p className="text-[11px] text-slate-400">{formatDate(row.date)}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/60 rounded-xl py-1.5">
                  <p className="text-[9px] text-slate-400">Total</p>
                  <p className="text-xs font-bold text-slate-200">{formatCurrency(row.total, currency)}</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl py-1.5">
                  <p className="text-[9px] text-slate-400">Paid</p>
                  <p className="text-xs font-bold text-emerald-400">{formatCurrency(row.paid, currency)}</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl py-1.5">
                  <p className="text-[9px] text-slate-400">Remaining</p>
                  <p className="text-xs font-black text-rose-400">{formatCurrency(row.remaining, currency)}</p>
                </div>
              </div>
              <button
                onClick={() => openPayment(activeTab === "receivables" ? "sale" : "purchase", row)}
                className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform ${
                  activeTab === "receivables"
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                <Banknote className="w-4 h-4" />
                {activeTab === "receivables" ? `Receive ${formatCurrency(row.remaining, currency)}` : `Pay ${formatCurrency(row.remaining, currency)}`}
              </button>
            </div>
          ))
        )}
      </div>

      {/* PAYMENT MODAL */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-5 sm:p-6 shadow-2xl space-y-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:pb-6">
            <div className="mx-auto w-10 h-1 rounded-full bg-slate-700 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {paymentTarget.type === "sale" ? (
                  <Wallet className="w-5 h-5 text-amber-400" />
                ) : (
                  <Landmark className="w-5 h-5 text-emerald-400" />
                )}
                <h3 className="text-base font-extrabold text-white">
                  {paymentTarget.type === "sale" ? "Receive Payment from Customer" : "Make Payment to Supplier"}
                </h3>
              </div>
              <button onClick={() => setPaymentTarget(null)} className="p-2 rounded-lg bg-slate-800 text-slate-300 active:scale-95 transition-transform">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="bg-slate-800/60 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Reference</span>
                  <span className="font-mono font-bold text-white">{paymentTarget.row.reference}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{paymentTarget.type === "sale" ? "Customer" : "Supplier"}</span>
                  <span className="font-bold text-white">{paymentTarget.row.partyName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Due</span>
                  <span className="font-black text-white">{formatCurrency(paymentTarget.row.total, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Already Paid</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(paymentTarget.row.paid, currency)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-slate-700">
                  <span className="font-bold text-rose-300">Remaining Balance</span>
                  <span className="font-black text-rose-400">{formatCurrency(paymentTarget.row.remaining, currency)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  {paymentTarget.type === "sale" ? "Amount Received" : "Amount Paying"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={paymentTarget.row.remaining}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-base text-white font-bold focus:outline-none focus:border-amber-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(paymentTarget.row.remaining.toFixed(2))}
                    className="flex-1 py-1.5 text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition-colors"
                  >
                    Full Remaining ({formatCurrency(paymentTarget.row.remaining, currency)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount((paymentTarget.row.remaining / 2).toFixed(2))}
                    className="flex-1 py-1.5 text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Half
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecording}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 ${
                    paymentTarget.type === "sale"
                      ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  {isRecording ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                  ) : (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Confirm {paymentTarget.type === "sale" ? "Receipt" : "Payment"}</>
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
