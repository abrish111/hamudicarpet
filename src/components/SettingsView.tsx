"use client";

import React, { useState } from "react";
import {
  Settings,
  Store,
  DollarSign,
  Percent,
  RefreshCw,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Download
} from "lucide-react";
import type { ShopSetting } from "@/types";

interface SettingsViewProps {
  settings: ShopSetting | null;
  onRefreshAll: () => void;
}

export function SettingsView({ settings, onRefreshAll }: SettingsViewProps) {
  const [shopName, setShopName] = useState(settings?.shopName || "Hamudi Carpet");
  const [phone, setPhone] = useState(settings?.phone || "+971 50 847 2910");
  const [email, setEmail] = useState(settings?.email || "hamudi.carpets@gmail.com");
  const [address, setAddress] = useState(settings?.address || "Shop 14, Main Carpet Souq, Sharjah / Dubai, UAE");
  const [currency, setCurrency] = useState(settings?.currency || "ETB");
  const [invoicePrefix, setInvoicePrefix] = useState(settings?.invoicePrefix || "HC-INV-");
  const [purchasePrefix, setPurchasePrefix] = useState(settings?.purchasePrefix || "HC-PO-");
  const [footerNote, setFooterNote] = useState(
    settings?.footerNote || "Hamudi Carpet - Quality carpets, rugs, and flooring for your home and office."
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          phone,
          email,
          address,
          currency,
          invoicePrefix,
          purchasePrefix,
          footerNote,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefreshAll();
    } catch (err) {
      alert("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceSeed = async () => {
    if (
      !confirm(
        "Are you sure you want to reload Hamudi Carpet demo data? This will re-populate the 12 items and 6 months of sales/purchase records."
      )
    ) {
      return;
    }

    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Hamudi Carpet sample catalog and monthly records reloaded successfully!");
        onRefreshAll();
      } else {
        alert("Failed to seed: " + data.error);
      }
    } catch (err) {
      alert("Failed to reset database");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              System Configuration
            </span>
            <span className="text-xs text-slate-400">Hamudi Carpet Store Preferences</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Shop Settings & Database Management
          </h2>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Shop settings updated successfully!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
        
        {/* General Store Details */}
        <div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400" /> Store Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Shop Name</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Store Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Physical Address / Souq Location</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Currency */}
        <div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Currency
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Default Currency Display</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
              >
                <option value="ETB">ETB (Ethiopian Birr)</option>
                <option value="$">USD (US Dollar)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Supported currencies: Ethiopian Birr (ETB) and US Dollar (USD).
              </p>
            </div>
          </div>
        </div>

        {/* Invoice & Footer */}
        <div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" /> Invoicing & Receipts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Sales Invoice Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Purchase Order Prefix</label>
              <input
                type="text"
                value={purchasePrefix}
                onChange={(e) => setPurchasePrefix(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-400 block mb-1">Invoice Receipt Footer Note</label>
              <textarea
                rows={2}
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Configuration</span>
          </button>
        </div>

      </form>

      {/* Demo Data Management */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-extrabold text-white">Database Seed & Demo Simulation</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          Reset or re-seed the Hamudi Carpet catalog with all 12 default items (Readmade Carpet, Wall to Wall, PVC Readymade, WA Carpet, Readymade 3*4, 2.5*3.5, 2*3, 1.5*2.2, 4*5, 4*6, Artificial Grass, Praying Mat 2*3) along with 6 months of rich sales and purchase history for testing.
        </p>

        <div>
          <button
            type="button"
            onClick={handleForceSeed}
            disabled={isSeeding}
            className="px-4 py-2.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? "animate-spin text-amber-400" : ""}`} />
            <span>{isSeeding ? "Reloading Hamudi Carpet Data..." : "Reset / Reload Sample Data"}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
