"use client";

import React, { useState } from "react";
import { Settings, Store, RefreshCw, Sparkles, Save, CheckCircle2 } from "lucide-react";
import type { ShopSetting } from "@/types";

interface SettingsViewProps {
  settings: ShopSetting | null;
  onRefreshAll: () => void;
}

export function SettingsView({ settings, onRefreshAll }: SettingsViewProps) {
  const [shopName, setShopName] = useState(settings?.shopName || "Hamudi Carpet");
  const [phone, setPhone] = useState(settings?.phone || "");
  const [email, setEmail] = useState(settings?.email || "");
  const [address, setAddress] = useState(settings?.address || "");
  const [currency, setCurrency] = useState(settings?.currency || "ETB ");
  const [invoicePrefix, setInvoicePrefix] = useState(settings?.invoicePrefix || "HC-INV-");
  const [purchasePrefix, setPurchasePrefix] = useState(settings?.purchasePrefix || "HC-PO-");
  const [footerNote, setFooterNote] = useState(settings?.footerNote || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true); setSaveSuccess(false);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shopName, phone, email, address, currency, taxRate: "0", invoicePrefix, purchasePrefix, footerNote }) });
      if (!res.ok) throw new Error("Failed");
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); onRefreshAll();
    } catch { alert("Error saving settings"); } finally { setIsSaving(false); }
  };

  const handleForceSeed = async () => {
    if (!confirm("Reset all data and reload Hamudi Carpet sample records?")) return;
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force: true }) });
      const data = await res.json();
      if (data.success) { alert("Sample data reloaded!"); onRefreshAll(); } else alert("Failed: " + data.error);
    } catch { alert("Failed"); } finally { setIsSeeding(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Configuration</span>
        <h2 className="text-xl font-extrabold text-white mt-1">Shop Settings</h2>
      </div>

      {saveSuccess && <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-sm"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Settings saved!</div>}

      <form onSubmit={handleSave} className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2"><Store className="w-4 h-4 text-amber-400" /> Store Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs font-bold text-slate-400 block mb-1">Shop Name</label><input type="text" required value={shopName} onChange={e => setShopName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" /></div>
          <div><label className="text-xs font-bold text-slate-400 block mb-1">Phone</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" /></div>
          <div><label className="text-xs font-bold text-slate-400 block mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" /></div>
          <div><label className="text-xs font-bold text-slate-400 block mb-1">Address</label><input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" /></div>
        </div>

        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2"><Settings className="w-4 h-4 text-cyan-400" /> Currency & Invoicing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="text-xs font-bold text-slate-400 block mb-1">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              <option value="ETB ">Ethiopian Birr (ETB)</option><option value="$">US Dollar ($)</option>
            </select>
          </div>
          <div><label className="text-xs font-bold text-slate-400 block mb-1">Invoice Prefix</label><input type="text" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" /></div>
          <div><label className="text-xs font-bold text-slate-400 block mb-1">PO Prefix</label><input type="text" value={purchasePrefix} onChange={e => setPurchasePrefix(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" /></div>
        </div>

        <div><label className="text-xs font-bold text-slate-400 block mb-1">Invoice Footer Note</label><textarea rows={2} value={footerNote} onChange={e => setFooterNote(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" /></div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-800">
          <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2">
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </form>

      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /><h3 className="text-base font-extrabold text-white">Reset Sample Data</h3></div>
        <p className="text-xs text-slate-400">Reload the 12 Hamudi Carpet items and sample monthly records.</p>
        <button type="button" onClick={handleForceSeed} disabled={isSeeding} className="px-4 py-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${isSeeding ? "animate-spin" : ""}`} /> {isSeeding ? "Reloading..." : "Reset Data"}
        </button>
      </div>
    </div>
  );
}
