"use client";

import React, { useState } from "react";
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  AlertTriangle, Layers, Sparkles, PlusCircle, CheckCircle2,
  Clock, Receipt, Eye, BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid, AreaChart, Area,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardKPIs, MonthlyDataPoint, TopProduct, CategoryData, Sale, Purchase, Product } from "@/types";

interface DashboardViewProps {
  kpis: DashboardKPIs;
  monthlyData: MonthlyDataPoint[];
  topSellingProducts: TopProduct[];
  categoryDistribution: CategoryData[];
  lowStockItems: Product[];
  recentSales: Sale[];
  recentPurchases: Purchase[];
  currency: string;
  onOpenSaleModal: () => void;
  onOpenPurchaseModal: (productId?: number) => void;
  onViewSale: (sale: Sale) => void;
  onViewPurchase: (purchase: Purchase) => void;
  onSelectMonthsRange: (months: number) => void;
  selectedMonths: number;
}

const CATEGORY_COLORS = ["#f59e0b", "#10b981", "#06b6d4", "#8b5cf6", "#ec4899", "#f97316", "#6366f1"];

export function DashboardView({
  kpis, monthlyData, topSellingProducts, categoryDistribution,
  lowStockItems, recentSales, recentPurchases, currency,
  onOpenSaleModal, onOpenPurchaseModal, onViewSale, onViewPurchase,
  onSelectMonthsRange, selectedMonths,
}: DashboardViewProps) {
  const [chartType, setChartType] = useState<"bar" | "area" | "line">("bar");
  const [activeRecentTab, setActiveRecentTab] = useState<"sales" | "purchases">("sales");

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl text-[11px]">
          <p className="font-bold text-white mb-1">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} style={{ color: entry.color }} className="font-semibold">
              {entry.name}: {formatCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-4 sm:p-6 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
              <Sparkles className="w-3 h-3" /> Live
            </span>
            <h2 className="text-lg sm:text-2xl font-extrabold text-white mt-1">Hamudi Carpet Dashboard</h2>
            <p className="text-xs text-slate-300 mt-0.5 hidden sm:block">Track monthly/weekly sales, purchases, profits & stock levels.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onOpenSaleModal} className="px-3 sm:px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" /> Sale
            </button>
            <button onClick={() => onOpenPurchaseModal()} className="px-3 sm:px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-400" /> Restock
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { label: "Monthly Sales", value: kpis.currentMonthSales, icon: ShoppingCart, color: "amber", extra: `${kpis.currentMonthSalesCount} invoices`, growth: kpis.salesGrowth },
          { label: "Monthly Purchases", value: kpis.currentMonthPurchases, icon: Package, color: "emerald", extra: `${kpis.currentMonthPurchasesCount} POs`, growth: kpis.purchasesGrowth },
          { label: "Monthly Profit", value: kpis.currentMonthProfit, icon: TrendingUp, color: "cyan", extra: `${kpis.currentMonthMargin}% margin`, growth: null },
          { label: "Stock Value", value: kpis.totalStockValueCost, icon: Layers, color: "purple", extra: `Retail: ${formatCurrency(kpis.totalStockValueRetail, currency)}`, growth: null },
        ].map((card, i) => {
          const Icon = card.icon;
          const colors: Record<string, string> = {
            amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
            purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
          };
          const [textCol, bgCol, borderCol] = (colors[card.color] || colors.amber).split(" ");

          return (
            <div key={i} className="bg-slate-900/90 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</span>
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg ${bgCol} ${borderCol} border flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 ${textCol}`} />
                </div>
              </div>
              <div className="text-base sm:text-2xl font-black text-white tracking-tight">{formatCurrency(card.value, currency)}</div>
              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-800/80">
                <span className="text-[10px] sm:text-xs text-slate-400 truncate">{card.extra}</span>
                {card.growth !== null && (
                  <span className={`text-[10px] sm:text-xs font-bold flex items-center ${card.growth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {card.growth >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    {card.growth >= 0 ? `+${card.growth}%` : `${card.growth}%`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-slate-900/90 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">Monthly Purchases vs Sales</h3>
            <p className="text-[10px] sm:text-xs text-slate-400">Financial comparison over time</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[10px] sm:text-xs">
              {(["bar", "area", "line"] as const).map(t => (
                <button key={t} onClick={() => setChartType(t)} className={`px-2 py-1 rounded font-bold transition-all ${chartType === t ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[10px] sm:text-xs">
              {[3, 6, 12].map(m => (
                <button key={m} onClick={() => onSelectMonthsRange(m)} className={`px-2 py-1 rounded font-bold transition-all ${selectedMonths === m ? "bg-slate-700 text-white" : "text-slate-400"}`}>
                  {m}M
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 h-52 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="shortMonth" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="salesAmount" name="Sales" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="purchasesAmount" name="Purchases" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            ) : chartType === "area" ? (
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="shortMonth" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="salesAmount" name="Sales" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                <Area type="monotone" dataKey="purchasesAmount" name="Purchases" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
              </AreaChart>
            ) : (
              <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="shortMonth" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="salesAmount" name="Sales" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="purchasesAmount" name="Purchases" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products + Category + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 sm:gap-6">
        {/* Top Products */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-extrabold text-white">Top Selling Carpets</h3>
          </div>
          <div className="mt-3 space-y-2">
            {topSellingProducts.slice(0, 5).map((prod, idx) => (
              <div key={prod.id} className="flex items-center justify-between gap-2 bg-slate-800/40 p-2.5 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black shrink-0 ${idx === 0 ? "bg-amber-500 text-slate-950" : idx === 1 ? "bg-amber-700 text-white" : "bg-slate-700 text-slate-300"}`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                    <p className="text-[10px] text-slate-400">{prod.quantitySold} {prod.unit} sold • <span className="text-cyan-400">{prod.margin}%</span></p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-amber-400">{formatCurrency(prod.revenue, currency)}</p>
                  <p className="text-[10px] text-emerald-400">+{formatCurrency(prod.profit, currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category + Low Stock */}
        <div className="lg:col-span-3 space-y-4">
          {/* Category Pie */}
          <div className="bg-slate-900/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-400" /> By Category</h3>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryDistribution} dataKey="revenue" nameKey="category" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3}>
                    {categoryDistribution.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [formatCurrency(v, currency), "Revenue"]} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-1">
              {categoryDistribution.slice(0, 4).map((cat, i) => (
                <div key={cat.category} className="flex items-center justify-between text-[10px] py-0.5">
                  <span className="flex items-center gap-1.5 text-slate-300"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />{cat.category}</span>
                  <span className="font-bold text-white">{formatCurrency(cat.revenue, currency)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-slate-900/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Low Stock ({lowStockItems.length})</h3>
            {lowStockItems.length === 0 ? (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> All items in stock</p>
            ) : (
              <div className="space-y-1.5">
                {lowStockItems.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-amber-950/20 border border-amber-500/20 rounded-lg p-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-200 truncate">{item.name}</p>
                      <p className="text-[10px] text-amber-300">Left: {item.stockQuantity} {item.unit}</p>
                    </div>
                    <button onClick={() => onOpenPurchaseModal(item.id)} className="px-2 py-1 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-lg flex items-center gap-0.5 shrink-0">
                      <PlusCircle className="w-3 h-3" /> Restock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-slate-900/90 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-400" /> Recent</h3>
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px] sm:text-xs">
            <button onClick={() => setActiveRecentTab("sales")} className={`px-3 py-1.5 rounded-md font-bold transition-all ${activeRecentTab === "sales" ? "bg-amber-500 text-slate-950" : "text-slate-400"}`}>Sales</button>
            <button onClick={() => setActiveRecentTab("purchases")} className={`px-3 py-1.5 rounded-md font-bold transition-all ${activeRecentTab === "purchases" ? "bg-emerald-600 text-white" : "text-slate-400"}`}>Purchases</button>
          </div>
        </div>

        {/* Mobile: Card list. Desktop: Table */}
        {activeRecentTab === "sales" && (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden mt-3 space-y-2">
              {recentSales.slice(0, 5).map(s => (
                <div key={s.id} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-amber-400 text-xs">{s.invoiceNumber}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.paymentStatus === "Paid" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{s.paymentStatus}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">{s.customerName}</span>
                    <span className="text-sm font-black text-white">{formatCurrency(s.totalAmount, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-500">{formatDate(s.saleDate)}</span>
                    <button onClick={() => onViewSale(s)} className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5"><Receipt className="w-3 h-3" /> View</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <th className="py-2.5 px-3">Invoice #</th><th className="py-2.5 px-3">Customer</th><th className="py-2.5 px-3">Date</th><th className="py-2.5 px-3">Payment</th><th className="py-2.5 px-3 text-right">Total</th><th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentSales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">{s.invoiceNumber}</td>
                      <td className="py-3 px-3 font-bold text-white">{s.customerName}</td>
                      <td className="py-3 px-3 text-slate-300">{formatDate(s.saleDate)}</td>
                      <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.paymentStatus === "Paid" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{s.paymentMethod} • {s.paymentStatus}</span></td>
                      <td className="py-3 px-3 text-right font-black text-white">{formatCurrency(s.totalAmount, currency)}</td>
                      <td className="py-3 px-3 text-center"><button onClick={() => onViewSale(s)} className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"><Receipt className="w-3 h-3 text-amber-400" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeRecentTab === "purchases" && (
          <>
            <div className="sm:hidden mt-3 space-y-2">
              {recentPurchases.slice(0, 5).map(p => (
                <div key={p.id} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-emerald-400 text-xs">{p.purchaseNumber}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">{p.paymentStatus}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">{p.supplierName}</span>
                    <span className="text-sm font-black text-white">{formatCurrency(p.totalAmount, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-500">{formatDate(p.purchaseDate)}</span>
                    <button onClick={() => onViewPurchase(p)} className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5"><Eye className="w-3 h-3" /> View</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <th className="py-2.5 px-3">PO #</th><th className="py-2.5 px-3">Supplier</th><th className="py-2.5 px-3">Date</th><th className="py-2.5 px-3">Status</th><th className="py-2.5 px-3 text-right">Amount</th><th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentPurchases.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{p.purchaseNumber}</td>
                      <td className="py-3 px-3 font-bold text-white">{p.supplierName}</td>
                      <td className="py-3 px-3 text-slate-300">{formatDate(p.purchaseDate)}</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">{p.paymentStatus}</span></td>
                      <td className="py-3 px-3 text-right font-black text-white">{formatCurrency(p.totalAmount, currency)}</td>
                      <td className="py-3 px-3 text-center"><button onClick={() => onViewPurchase(p)} className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"><Eye className="w-3 h-3 text-emerald-400" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
