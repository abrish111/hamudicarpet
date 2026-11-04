"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Layers,
  Calendar,
  Sparkles,
  Award,
  Eye,
  PlusCircle,
  Clock,
  CheckCircle2,
  Receipt
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
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

const CATEGORY_COLORS = ["#d97706", "#059669", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#475569"];

export function DashboardView({
  kpis,
  monthlyData,
  topSellingProducts,
  categoryDistribution,
  lowStockItems,
  recentSales,
  recentPurchases,
  currency,
  onOpenSaleModal,
  onOpenPurchaseModal,
  onViewSale,
  onViewPurchase,
  onSelectMonthsRange,
  selectedMonths,
}: DashboardViewProps) {
  const [chartType, setChartType] = useState<"bar" | "area" | "line">("bar");
  const [activeRecentTab, setActiveRecentTab] = useState<"sales" | "purchases">("sales");

  // Format custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs z-50">
          <p className="font-bold text-slate-200 mb-2 border-b border-slate-800 pb-1">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-bold text-slate-100">
                  {formatCurrency(entry.value, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome & Quick Highlights */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Business Performance
              </span>
              <span className="text-xs text-slate-400">Monthly Financial Overview</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hamudi Carpet Monthly Dashboard
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Track real-time monthly sales, inventory purchases, gross profit margins, and bestselling carpet rolls & readymade sizes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenSaleModal}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Record Sale</span>
            </button>
            <button
              onClick={() => onOpenPurchaseModal()}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl flex items-center gap-2 transition-all hover:scale-105"
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Restock Carpets</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Monthly Sales */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-amber-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Monthly Sales
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatCurrency(kpis.currentMonthSales, currency)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">
                {kpis.currentMonthSalesCount} sales invoices
              </span>
              <span className={`inline-flex items-center text-xs font-bold ${kpis.salesGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {kpis.salesGrowth >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                {kpis.salesGrowth >= 0 ? `+${kpis.salesGrowth}%` : `${kpis.salesGrowth}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Purchases */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Monthly Purchases
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatCurrency(kpis.currentMonthPurchases, currency)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">
                {kpis.currentMonthPurchasesCount} purchase orders
              </span>
              <span className={`inline-flex items-center text-xs font-bold ${kpis.purchasesGrowth <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                {kpis.purchasesGrowth >= 0 ? `+${kpis.purchasesGrowth}%` : `${kpis.purchasesGrowth}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Gross Profit */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Monthly Profit
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatCurrency(kpis.currentMonthProfit, currency)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">Net Gross Margin</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {kpis.currentMonthMargin}% margin
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Inventory Valuation */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-purple-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Stock Valuation
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatCurrency(kpis.totalStockValueCost, currency)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">
                Retail: {formatCurrency(kpis.totalStockValueRetail, currency)}
              </span>
              {kpis.lowStockCount > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {kpis.lowStockCount} low stock
                </span>
              ) : (
                <span className="text-xs text-emerald-400 font-medium flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Main Interactive Chart: Monthly Purchases vs Sales */}
      <div className="bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-white">Monthly Purchase vs Sales Comparison</h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-amber-400 border border-slate-700">
                Interactive Chart
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual financial comparison of carpet stock procurement vs sales revenue
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Chart Type Toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setChartType("bar")}
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  chartType === "bar" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Bar Chart
              </button>
              <button
                onClick={() => setChartType("area")}
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  chartType === "area" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  chartType === "line" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Line
              </button>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => onSelectMonthsRange(m)}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    selectedMonths === m ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Recharts Component */}
        <div className="h-72 sm:h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="shortMonth" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(val) => `${currency}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                <Bar dataKey="salesAmount" name="Sales Revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="purchasesAmount" name="Purchases / Restock" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="profitAmount" name="Gross Profit" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            ) : chartType === "area" ? (
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="shortMonth" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(val) => `${currency}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="salesAmount" name="Sales Revenue" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="purchasesAmount" name="Purchases / Restock" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPurchases)" />
                <Area type="monotone" dataKey="profitAmount" name="Gross Profit" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            ) : (
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="shortMonth" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(val) => `${currency}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="salesAmount" name="Sales Revenue" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="purchasesAmount" name="Purchases / Restock" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="profitAmount" name="Gross Profit" stroke="#06b6d4" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Quick monthly summary pills below chart */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 pt-4 border-t border-slate-800">
          {monthlyData.slice(-6).map((item) => (
            <div key={item.monthKey} className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60 text-center">
              <p className="text-[11px] font-bold text-slate-300">{item.monthLabel}</p>
              <p className="text-xs font-black text-amber-400 mt-0.5">{formatCurrency(item.salesAmount, currency)}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] text-slate-400">
                <span className="text-emerald-400">PO: {formatCurrency(item.purchasesAmount, currency)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Top Products Leaderboard & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Selling Products (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Top Selling Carpet Products
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Ranked by revenue</span>
          </div>

          <div className="mt-4 space-y-3">
            {topSellingProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No product sales recorded yet.</p>
            ) : (
              topSellingProducts.map((prod, index) => (
                <div
                  key={prod.id}
                  className="bg-slate-800/60 hover:bg-slate-800 rounded-xl p-3 border border-slate-700/60 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        index === 0
                          ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300/40"
                          : index === 1
                          ? "bg-slate-300 text-slate-950"
                          : index === 2
                          ? "bg-amber-700 text-white"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{prod.name}</span>
                        {prod.dimensions && (
                          <span className="hidden sm:inline px-1.5 py-0.5 text-[10px] rounded bg-slate-700 text-slate-300">
                            {prod.dimensions}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{prod.quantitySold} {prod.unit} sold</span>
                        <span>•</span>
                        <span className="text-cyan-400">{prod.margin}% margin</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-amber-400">
                      {formatCurrency(prod.revenue, currency)}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      +{formatCurrency(prod.profit, currency)} profit
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Breakdown & Low Stock Alerts (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Category Distribution Card */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">Sales by Carpet Category</h3>
              </div>
            </div>

            <div className="h-44 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value, currency), "Revenue"]}
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "10px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 mt-1 max-h-36 overflow-y-auto pr-1">
              {categoryDistribution.map((cat, idx) => (
                <div key={cat.category} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                    <span className="text-slate-300 font-medium">{cat.category}</span>
                  </div>
                  <span className="font-bold text-white">{formatCurrency(cat.revenue, currency)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Warning Card */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Low Stock Warning</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {lowStockItems.length} items
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-4 text-xs text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All carpet items have sufficient stock levels.</span>
                </div>
              ) : (
                lowStockItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-amber-950/20 border border-amber-500/30 rounded-xl p-2.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">{item.name}</p>
                      <p className="text-[11px] text-amber-300">
                        Remaining: <span className="font-black">{item.stockQuantity} {item.unit}</span> (Min: {item.minStockThreshold})
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenPurchaseModal(item.id)}
                      className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Restock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Recent Activity Table (Sales & Purchases) */}
      <div className="bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-extrabold text-white">Recent Shop Transactions</h3>
          </div>

          {/* Toggle Tab */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveRecentTab("sales")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                activeRecentTab === "sales" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Latest Sales ({recentSales.length})
            </button>
            <button
              onClick={() => setActiveRecentTab("purchases")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                activeRecentTab === "purchases" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Latest Purchases ({recentPurchases.length})
            </button>
          </div>
        </div>

        {/* Sales - Mobile Cards */}
        {activeRecentTab === "sales" && (
          <div className="md:hidden mt-4 space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="bg-slate-800/50 rounded-2xl border border-slate-700/60 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-amber-400 text-xs">{sale.invoiceNumber}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                    sale.paymentStatus === "Paid" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                  }`}>
                    {sale.paymentStatus}
                  </span>
                </div>
                <p className="text-sm font-bold text-white">{sale.customerName}</p>
                <p className="text-[11px] text-slate-400">{formatDate(sale.saleDate)} • {sale.paymentMethod}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/70">
                  <span className="text-base font-black text-amber-400">{formatCurrency(sale.totalAmount, currency)}</span>
                  <button
                    onClick={() => onViewSale(sale)}
                    className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-400" /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sales Table (desktop) */}
        {activeRecentTab === "sales" && (
          <div className="hidden md:block overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{sale.invoiceNumber}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-white">{sale.customerName}</span>
                      {sale.customerPhone && <p className="text-[11px] text-slate-400">{sale.customerPhone}</p>}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{formatDate(sale.saleDate)}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        sale.paymentStatus === "Paid" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}>
                        {sale.paymentMethod} • {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-white text-sm">
                      {formatCurrency(sale.totalAmount, currency)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onViewSale(sale)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg inline-flex items-center gap-1 transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5 text-amber-400" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Purchases - Mobile Cards */}
        {activeRecentTab === "purchases" && (
          <div className="md:hidden mt-4 space-y-3">
            {recentPurchases.map((po) => (
              <div key={po.id} className="bg-slate-800/50 rounded-2xl border border-slate-700/60 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-emerald-400 text-xs">{po.purchaseNumber}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    {po.paymentStatus}
                  </span>
                </div>
                <p className="text-sm font-bold text-white">{po.supplierName}</p>
                <p className="text-[11px] text-slate-400">{formatDate(po.purchaseDate)}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/70">
                  <span className="text-base font-black text-emerald-400">{formatCurrency(po.totalAmount, currency)}</span>
                  <button
                    onClick={() => onViewPurchase(po)}
                    className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" /> Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Purchases Table (desktop) */}
        {activeRecentTab === "purchases" && (
          <div className="hidden md:block overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3">PO Number</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">{po.purchaseNumber}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-white">{po.supplierName}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{formatDate(po.purchaseDate)}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {po.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-white text-sm">
                      {formatCurrency(po.totalAmount, currency)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onViewPurchase(po)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
