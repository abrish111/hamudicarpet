"use client";

import React, { useState } from "react";
import { Users, Truck, Plus, Search, Phone, Mail, MapPin, Building, CheckCircle2 } from "lucide-react";
import type { Customer, Supplier } from "@/types";

interface ContactsViewProps {
  customers: Customer[];
  suppliers: Supplier[];
  onRefresh: () => void;
}

export function ContactsView({ customers, suppliers, onRefresh }: ContactsViewProps) {
  const [activeTab, setActiveTab] = useState<"customers" | "suppliers">("customers");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setName("");
    setCompanyName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = activeTab === "customers" ? "/api/customers" : "/api/suppliers";
      const payload = {
        name,
        companyName: activeTab === "suppliers" ? companyName : undefined,
        phone,
        email,
        address,
        notes,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save contact");

      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      alert("Error saving contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.companyName && s.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Directory & CRM
            </span>
            <span className="text-xs text-slate-400">Buyers & Carpet Mills</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Hamudi Carpet Contacts Directory
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab("customers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "customers" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers ({customers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("suppliers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "suppliers" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:text-white"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Suppliers ({suppliers.length})</span>
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeTab === "customers" ? "Customer" : "Supplier"}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab} by name, phone, or email...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* CUSTOMERS GRID */}
      {activeTab === "customers" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => (
            <div key={c.id} className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{c.name}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                  Customer
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                {c.phone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-amber-400" /> {c.phone}</p>}
                {c.email && <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}</p>}
                {c.address && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.address}</p>}
                {c.notes && <p className="text-[11px] text-slate-400 bg-slate-800/60 p-2 rounded-lg mt-2">{c.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUPPLIERS GRID */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((s) => (
            <div key={s.id} className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{s.name}</h4>
                  {s.companyName && <p className="text-xs text-emerald-400 font-medium">{s.companyName}</p>}
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  Carpet Mill
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                {s.phone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-400" /> {s.phone}</p>}
                {s.email && <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {s.email}</p>}
                {s.address && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.address}</p>}
                {s.notes && <p className="text-[11px] text-slate-400 bg-slate-800/60 p-2 rounded-lg mt-2">{s.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white">
                Add New {activeTab === "customers" ? "Customer" : "Supplier"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tariq Carpet Traders"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {activeTab === "suppliers" && (
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Company / Mill Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Silk Route Carpet Mills"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@example.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Address / Location</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Emirate"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferences, typical order volume..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  {isSubmitting ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
