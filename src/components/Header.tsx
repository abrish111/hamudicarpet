"use client";

import React from "react";
import {
  RefreshCw,
  ShoppingCart,
  Package, Store, ChevronDown,
} from "lucide-react";

interface HeaderProps {
  shopName: string;
  currency: string;
  onCurrencyChange: (c: string) => void;
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onRefreshData: () => void;
  isLoading: boolean;
  stores: {id:number;name:string}[];
  activeStoreId:number|null;
  onStoreChange:(id:number)=>void;
}

export function Header({
  shopName,
  currency,
  onCurrencyChange,
  onOpenNewSale,
  onOpenNewPurchase,
  onRefreshData,
  isLoading, stores, activeStoreId, onStoreChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow ring-1 ring-amber-400/40 shrink-0">
              <span className="text-sm sm:text-lg font-black text-white">HC</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-extrabold truncate bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                {shopName}
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 -mt-0.5 hidden sm:block">Shop Management</p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <label className="hidden items-center gap-1 sm:flex"><Store className="h-3.5 w-3.5 text-amber-400"/><select aria-label="Select store" value={activeStoreId||1} disabled={isLoading||stores.length===0} onChange={e=>onStoreChange(Number(e.target.value))} className="max-w-36 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white">{stores.length?stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>):<option value="1">Loading stores...</option>}</select></label>
            {/* Currency */}
            <select
              value={currency}
              disabled={isLoading}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] sm:text-xs font-bold text-amber-300 focus:outline-none"
            >
              <option value="ETB ">ETB</option>
              <option value="$">USD</option>
            </select>

            {/* Quick Actions - visible on sm+ */}
            <button
              onClick={onOpenNewSale}
              className="hidden sm:flex px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg items-center gap-1.5 shadow-md transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Sale
            </button>
            <button
              onClick={onOpenNewPurchase}
              className="hidden sm:flex px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg items-center gap-1.5 transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" /> Purchase
            </button>

            {/* Mobile quick action buttons */}
            <button
              onClick={onOpenNewSale}
              className="sm:hidden p-2 bg-amber-500 text-slate-950 rounded-lg shadow-md"
              title="New Sale"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenNewPurchase}
              className="sm:hidden p-2 bg-slate-800 text-emerald-400 border border-slate-700 rounded-lg"
              title="New Purchase"
            >
              <Package className="w-4 h-4" />
            </button>

            <button
              onClick={onRefreshData}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white rounded-lg disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex sm:hidden items-center gap-2 border-t border-slate-800 px-3 py-1.5 text-xs"><Store className="h-3.5 w-3.5 text-amber-400"/><span className="text-slate-400 text-[10px]">Store</span><select aria-label="Select store" value={activeStoreId||1} disabled={isLoading||stores.length===0} onChange={e=>onStoreChange(Number(e.target.value))} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white">{stores.length?stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>):<option value="1">Loading stores...</option>}</select></div>
    </header>
  );
}
