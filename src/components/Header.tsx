"use client";

import React from "react";
import {
  Store,
  ShoppingCart,
  PackagePlus,
  RefreshCw,
  Sliders,
  Banknote
} from "lucide-react";

interface HeaderProps {
  shopName: string;
  currency: string;
  onCurrencyChange: (c: string) => void;
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenQuickStock: () => void;
  onRefreshData: () => void;
  isLoading: boolean;
}

const CURRENCIES = [
  { symbol: "ETB", label: "ETB (Ethiopian Birr)" },
  { symbol: "$", label: "USD (US Dollar)" },
];

export function Header({
  shopName = "Hamudi Carpet",
  currency = "ETB",
  onCurrencyChange,
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenQuickStock,
  onRefreshData,
  isLoading,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-2">

          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30 ring-2 ring-amber-400/40 shrink-0">
              <span className="text-base sm:text-2xl font-black tracking-tighter text-white">HC</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent truncate">
                {shopName}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block truncate">
                Readymade Carpets • Wall to Wall • PVC Flooring • Artificial Grass
              </p>
            </div>
          </div>

          {/* Actions & Currency */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

            {/* Currency Selector - ETB / USD only (compact on mobile) */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg px-1.5 sm:px-2 py-1.5 sm:py-1">
              <Banknote className="w-3.5 h-3.5 text-amber-400 mr-1 hidden sm:inline" />
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-0 sm:pr-1 appearance-none"
                title="Select Currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.symbol} value={c.symbol} className="bg-slate-900 text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh (desktop only) */}
            <button
              onClick={onRefreshData}
              disabled={isLoading}
              title="Refresh Dashboard Data"
              className="hidden md:flex p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
              <span className="hidden lg:inline">Refresh</span>
            </button>

            {/* Quick Actions (icons on mobile, labels on desktop) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenQuickStock}
                className="hidden sm:flex px-2.5 sm:px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg items-center gap-1.5 transition-colors active:scale-95"
                title="Inventory Stock"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden lg:inline">Stock</span>
              </button>

              <button
                onClick={onOpenNewPurchase}
                className="p-2 sm:px-3 sm:py-2 text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/40 border border-emerald-500/50 transition-all hover:scale-[1.02] active:scale-95"
                title="New Purchase"
              >
                <PackagePlus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">+ Purchase</span>
              </button>

              <button
                onClick={onOpenNewSale}
                className="px-2.5 sm:px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-950/40 border border-amber-400/50 transition-all hover:scale-[1.02] active:scale-95"
                title="New Sale"
              >
                <ShoppingCart className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">+ Sale</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
