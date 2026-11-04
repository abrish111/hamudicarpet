"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Minus,
  Sliders,
  Search,
  History,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  FileSpreadsheet,
  X
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Product, InventoryLog } from "@/types";

interface InventoryViewProps {
  products: Product[];
  currency: string;
  onRefresh: () => void;
}

export function InventoryView({ products, currency, onRefresh }: InventoryViewProps) {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"stocks" | "logs">("stocks");

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "subtract" | "set">("add");
  const [adjustQty, setAdjustQty] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState("Showroom Stock Audit Correction");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/inventory?mode=logs");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab]);

  const openAdjustModal = (prod: Product) => {
    setSelectedProduct(prod);
    setAdjustType("add");
    setAdjustQty(5);
    setAdjustReason("Showroom Stock Audit Correction");
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: adjustType,
          quantity: adjustQty,
          reason: adjustReason,
        }),
      });

      if (!res.ok) throw new Error("Failed to adjust stock");

      setIsAdjustModalOpen(false);
      onRefresh();
      if (activeTab === "logs") fetchLogs();
    } catch (err) {
      alert("Error saving stock adjustment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalStockUnits = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const totalCostVal = products.reduce((sum, p) => sum + p.stockQuantity * parseFloat(p.costPrice || "0"), 0);
  const totalRetailVal = products.reduce((sum, p) => sum + p.stockQuantity * parseFloat(p.sellingPrice || "0"), 0);
  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStockThreshold);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Inventory Warehouse Control
            </span>
            <span className="text-xs text-slate-400">Live Stock & Audit Logs</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Hamudi Carpet Inventory Management
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab("stocks")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "stocks" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:text-white"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Stock Levels ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "logs" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail Logs</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stock Count</p>
          <p className="text-2xl font-black text-white mt-1">{totalStockUnits.toLocaleString()} units</p>
          <p className="text-xs text-slate-400 mt-0.5">Across {products.length} product lines</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cost Valuation</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(totalCostVal, currency)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Inventory procurement value</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retail Valuation</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(totalRetailVal, currency)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Potential revenue at selling price</p>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-4.5 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Warnings</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{lowStockProducts.length} items</p>
          <p className="text-xs text-slate-400 mt-0.5">Below alert threshold</p>
        </div>
      </div>

      {/* TAB 1: STOCKS */}
      {activeTab === "stocks" && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden space-y-4 p-5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter stock by carpet name, code, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Mobile stock cards */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((p) => {
              const isLow = p.stockQuantity <= p.minStockThreshold;
              const itemCost = parseFloat(p.costPrice || "0");
              const itemValue = p.stockQuantity * itemCost;

              return (
                <div key={p.id} className="bg-slate-800/50 rounded-2xl border border-slate-700/60 p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono font-bold text-amber-400">{p.code}</p>
                      <p className="text-sm font-bold text-white leading-tight">{p.name}</p>
                      {p.dimensions && <p className="text-[11px] text-slate-400">{p.dimensions}</p>}
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        isLow
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {isLow ? "Low Stock" : "Sufficient"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/70 rounded-xl py-2">
                      <p className="text-[10px] text-slate-400">In Stock</p>
                      <p className="text-sm font-black text-white">{p.stockQuantity} <span className="text-[10px] font-normal text-slate-400">{p.unit}</span></p>
                    </div>
                    <div className="bg-slate-900/70 rounded-xl py-2">
                      <p className="text-[10px] text-slate-400">Unit Cost</p>
                      <p className="text-sm font-bold text-slate-200">{formatCurrency(p.costPrice, currency)}</p>
                    </div>
                    <div className="bg-slate-900/70 rounded-xl py-2">
                      <p className="text-[10px] text-slate-400">Value</p>
                      <p className="text-sm font-bold text-amber-400">{formatCurrency(itemValue, currency)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => openAdjustModal(p)}
                    className="w-full py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Adjust Stock
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop stock table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold bg-slate-800/40">
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Item Name & Size</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Stock Value</th>
                  <th className="py-3 px-3 text-center">In Stock</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.minStockThreshold;
                  const itemCost = parseFloat(p.costPrice || "0");
                  const itemValue = p.stockQuantity * itemCost;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-amber-400">{p.code}</td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-white">{p.name}</span>
                        {p.dimensions && <p className="text-[11px] text-slate-400">{p.dimensions}</p>}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">{p.category}</td>
                      <td className="py-3.5 px-3 text-right text-slate-300">{formatCurrency(p.costPrice, currency)}</td>
                      <td className="py-3.5 px-3 text-right font-bold text-amber-400">{formatCurrency(itemValue, currency)}</td>
                      <td className="py-3.5 px-3 text-center font-black text-white text-sm">
                        {p.stockQuantity} <span className="text-xs text-slate-400 font-normal">{p.unit}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isLow
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {isLow ? "Low Stock" : "Sufficient"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => openAdjustModal(p)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5 text-amber-400" />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === "logs" && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-extrabold text-white">Stock Audit Trail (Sales, POs & Adjustments)</h3>
            <button
              onClick={fetchLogs}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-center">Quantity Change</th>
                  <th className="py-2.5 px-3 text-center">Stock Flow</th>
                  <th className="py-2.5 px-3">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500">
                      No stock audit logs available yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 text-slate-300">{formatDateTime(log.createdAt)}</td>
                      <td className="py-3 px-3 font-semibold text-white">{log.productName}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.changeType === "sale"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : log.changeType === "purchase"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        }`}>
                          {log.changeType.toUpperCase()}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${log.quantityChange > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400">
                        {log.previousStock} → <span className="text-white font-bold">{log.newStock}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {log.reason} {log.referenceNumber ? `(#${log.referenceNumber})` : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL (bottom sheet on mobile) */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-5 sm:p-6 shadow-2xl space-y-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:pb-6">
            <div className="mx-auto w-10 h-1 rounded-full bg-slate-700 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">Stock Adjustment: {selectedProduct.name}</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition-transform">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <p className="text-xs text-slate-400">Current Stock: <span className="font-bold text-white">{selectedProduct.stockQuantity} {selectedProduct.unit}</span></p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Adjustment Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("add")}
                    className={`py-2 text-xs font-bold rounded-xl border ${adjustType === "add" ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-800 text-slate-300 border-slate-700"}`}
                  >
                    + Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("subtract")}
                    className={`py-2 text-xs font-bold rounded-xl border ${adjustType === "subtract" ? "bg-rose-600 text-white border-rose-500" : "bg-slate-800 text-slate-300 border-slate-700"}`}
                  >
                    - Reduce Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("set")}
                    className={`py-2 text-xs font-bold rounded-xl border ${adjustType === "set" ? "bg-amber-600 text-white border-amber-500" : "bg-slate-800 text-slate-300 border-slate-700"}`}
                  >
                    = Set Exact
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Reason / Note</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none mb-2"
                >
                  <option value="Showroom Stock Audit Correction">Showroom Stock Audit Correction</option>
                  <option value="Damaged / Scratched Carpet Roll">Damaged / Scratched Carpet Roll</option>
                  <option value="Customer Return Stock Inflow">Customer Return Stock Inflow</option>
                  <option value="Display Sample Allocation">Display Sample Allocation</option>
                  <option value="Warehouse Transfer / Recount">Warehouse Transfer / Recount</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg"
                >
                  {isSubmitting ? "Updating..." : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
