"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  FileSpreadsheet
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToExcel } from "@/lib/excel";
import type { MonthReportItem } from "@/types";

interface MonthlyReportsViewProps {
  currency: string;
  shopName: string;
}

export function MonthlyReportsView({ currency, shopName }: MonthlyReportsViewProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [reportData, setReportData] = useState<{
    year: number;
    availableYears: number[];
    summary: {
      totalSales: number;
      totalPurchases: number;
      grossProfit: number;
      marginPercent: number;
      salesCount: number;
      purchasesCount: number;
    };
    months: MonthReportItem[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const fetchReports = async (targetYear: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/monthly-reports?year=${targetYear}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to load monthly reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(year);
  }, [year]);

  const toggleMonthExpand = (monthKey: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  const handleExportExcel = () => {
    if (!reportData) return;

    const exportRows = reportData.months.map((m) => ({
      Month: m.monthName,
      "Sales Revenue": m.totalSalesRevenue,
      "Cost of Goods": m.totalCostOfSales,
      "Gross Profit": m.grossProfit,
      "Profit Margin %": m.marginPercent,
      "Purchases Cost": m.totalPurchasesCost,
      "Net Cashflow": m.netCashflow,
      "Sales Count": m.salesCount,
      "Purchases Count": m.purchasesCount,
      "Average Ticket": m.avgSaleTicket,
    }));

    exportToExcel(`Hamudi_Carpet_Monthly_Report_${year}`, "Monthly Report", exportRows);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !reportData) {
    return (
      <div className="bg-slate-900/90 rounded-2xl p-12 border border-slate-800 text-center">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-300">Generating Monthly Financial Reports...</p>
      </div>
    );
  }

  const { summary, months } = reportData;

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Financial Audit & Analytics
            </span>
            <span className="text-xs text-slate-400">Yearly & Monthly Breakdown</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Hamudi Carpet Monthly Sales & Purchases Report
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed month-by-month financial statement, carpet units sold vs purchased, and margins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Year Selector */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-amber-400 mr-2" />
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value={2026} className="bg-slate-900">Year 2026</option>
              <option value={2025} className="bg-slate-900">Year 2025</option>
              <option value={2024} className="bg-slate-900">Year 2024</option>
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-amber-950/40"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Yearly Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800 shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales ({year})</p>
          <p className="text-2xl font-black text-amber-400 mt-1">
            {formatCurrency(summary.totalSales, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">{summary.salesCount} total sales transactions</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800 shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Purchases ({year})</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(summary.totalPurchases, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">{summary.purchasesCount} supplier PO orders</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800 shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Annual Gross Profit</p>
          <p className="text-2xl font-black text-cyan-400 mt-1">
            {formatCurrency(summary.grossProfit, currency)}
          </p>
          <p className="text-xs text-cyan-300/80 mt-1 font-semibold">{summary.marginPercent}% overall margin</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800 shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Cash Flow ({year})</p>
          <p className={`text-2xl font-black mt-1 ${summary.totalSales - summary.totalPurchases >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {formatCurrency(summary.totalSales - summary.totalPurchases, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Sales minus purchase outflow</p>
        </div>

      </div>

      {/* Main Monthly Statement Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">Month-by-Month Statement ({year})</h3>
            <p className="text-xs text-slate-400 mt-0.5">Click any row to view product-level sales and purchase details for that month.</p>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
            12 Months Report
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-700">
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-3 text-right">Sales Revenue</th>
                <th className="py-3 px-3 text-right">Purchases (PO)</th>
                <th className="py-3 px-3 text-right">Cost of Goods</th>
                <th className="py-3 px-3 text-right">Gross Profit</th>
                <th className="py-3 px-3 text-center">Margin</th>
                <th className="py-3 px-3 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Net Flow</th>
                <th className="py-3 px-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {months.map((m) => {
                const isExpanded = !!expandedMonths[m.monthKey];
                const hasActivity = m.salesCount > 0 || m.purchasesCount > 0;

                return (
                  <React.Fragment key={m.monthKey}>
                    <tr
                      onClick={() => toggleMonthExpand(m.monthKey)}
                      className={`cursor-pointer transition-colors ${
                        isExpanded ? "bg-slate-800/90" : hasActivity ? "hover:bg-slate-800/40" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                        <span>{m.monthName}</span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-black text-amber-400 text-sm">
                        {formatCurrency(m.totalSalesRevenue, currency)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-emerald-400">
                        {formatCurrency(m.totalPurchasesCost, currency)}
                      </td>

                      <td className="py-3.5 px-3 text-right text-slate-300">
                        {formatCurrency(m.totalCostOfSales, currency)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-black text-cyan-400">
                        {formatCurrency(m.grossProfit, currency)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.marginPercent >= 30 ? "bg-emerald-500/20 text-emerald-300" : m.marginPercent > 0 ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-400"
                        }`}>
                          {m.marginPercent}%
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center text-slate-300">
                        <span className="font-semibold text-white">{m.salesCount}</span> sales / <span className="text-emerald-400 font-semibold">{m.purchasesCount}</span> PO
                      </td>

                      <td className={`py-3.5 px-4 text-right font-bold ${m.netCashflow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatCurrency(m.netCashflow, currency)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          className="px-2 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded"
                        >
                          {isExpanded ? "Hide" : "Breakdown"}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row: Product by Product breakdown in this month */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="p-0 bg-slate-950/80 border-y border-amber-500/20">
                          <div className="p-4 sm:p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-amber-400" />
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                  {m.monthName} — Item Performance Matrix (Hamudi Carpet Catalog)
                                </h4>
                              </div>
                              <span className="text-[11px] text-slate-400">12 Catalog Items Performance</span>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-800">
                              <table className="w-full min-w-[720px] text-left text-xs bg-slate-900/60">
                                <thead>
                                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[9px] font-semibold tracking-wider">
                                    <th className="py-2 px-3">Item Name</th>
                                    <th className="py-2 px-2">Category</th>
                                    <th className="py-2 px-2 text-right">Units Sold</th>
                                    <th className="py-2 px-2 text-right">Sales Revenue</th>
                                    <th className="py-2 px-2 text-right">Units Purchased</th>
                                    <th className="py-2 px-2 text-right">Purchase Cost</th>
                                    <th className="py-2 px-3 text-right">Item Profit</th>
                                    <th className="py-2 px-3 text-center">Stock</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                  {m.productPerformance.map((p) => (
                                    <tr key={p.productId} className="hover:bg-slate-800/40">
                                      <td className="py-2.5 px-3 font-semibold text-white">
                                        {p.productName}
                                        {p.dimensions && <span className="text-[10px] text-slate-400 ml-1">({p.dimensions})</span>}
                                      </td>
                                      <td className="py-2.5 px-2 text-slate-400 text-[11px]">{p.category}</td>
                                      <td className="py-2.5 px-2 text-right font-bold text-white">
                                        {p.unitsSold} {p.unit}
                                      </td>
                                      <td className="py-2.5 px-2 text-right font-bold text-amber-400">
                                        {formatCurrency(p.salesRevenue, currency)}
                                      </td>
                                      <td className="py-2.5 px-2 text-right font-semibold text-emerald-400">
                                        {p.unitsPurchased > 0 ? `${p.unitsPurchased} ${p.unit}` : "-"}
                                      </td>
                                      <td className="py-2.5 px-2 text-right text-slate-300">
                                        {p.purchaseCost > 0 ? formatCurrency(p.purchaseCost, currency) : "-"}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-bold text-cyan-400">
                                        {p.salesRevenue > 0 ? formatCurrency(p.grossProfit, currency) : "-"}
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          p.currentStock <= 5 ? "bg-rose-500/20 text-rose-300" : "bg-slate-800 text-slate-300"
                                        }`}>
                                          {p.currentStock} {p.unit}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
