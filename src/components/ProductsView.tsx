"use client";

import React, { useState } from "react";
import {
  Layers, Plus, Search, Edit2, Trash2, Package, RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductsViewProps {
  products: Product[];
  currency: string;
  onRefresh: () => void;
  onQuickRestock: (productId: number) => void;
}

export function ProductsView({ products, currency, onRefresh, onQuickRestock }: ProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Readymade Carpet");
  const [unit, setUnit] = useState("pcs");
  const [dimensions, setDimensions] = useState("");
  const [costPrice, setCostPrice] = useState("50");
  const [sellingPrice, setSellingPrice] = useState("85");
  const [stockQuantity, setStockQuantity] = useState("20");
  const [minStockThreshold, setMinStockThreshold] = useState("5");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ["All", "Readymade Carpet", "Wall to Wall", "PVC Flooring", "Artificial Grass", "Praying Mat", "WA Carpet"];

  const openAddModal = () => {
    setEditingProduct(null);
    setCode(`HC-${Date.now().toString().slice(-4)}`);
    setName(""); setCategory("Readymade Carpet"); setUnit("pcs"); setDimensions("");
    setCostPrice("50"); setSellingPrice("85"); setStockQuantity("20"); setMinStockThreshold("5");
    setDescription(""); setImageUrl(""); setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setCode(p.code); setName(p.name); setCategory(p.category); setUnit(p.unit);
    setDimensions(p.dimensions || ""); setCostPrice(p.costPrice); setSellingPrice(p.sellingPrice);
    setStockQuantity(String(p.stockQuantity)); setMinStockThreshold(String(p.minStockThreshold));
    setDescription(p.description || ""); setImageUrl(p.imageUrl || ""); setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const payload = { code, name, category, unit, dimensions, costPrice, sellingPrice, stockQuantity: parseFloat(stockQuantity) || 0, minStockThreshold: parseInt(minStockThreshold) || 5, description, imageUrl };
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const res = await fetch(url, { method: editingProduct ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed");
      setIsModalOpen(false); onRefresh();
    } catch { alert("Error saving product"); } finally { setIsSubmitting(false); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Remove this product?")) return;
    try { await fetch(`/api/products/${id}`, { method: "DELETE" }); onRefresh(); } catch { alert("Error"); }
  };

  const filtered = products.filter(p => {
    const mc = selectedCategory === "All" || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const ms = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return mc && ms;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-xl">
        <div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Catalog</span>
          <h2 className="text-lg font-extrabold text-white mt-0.5">Carpet Products ({products.length})</h2>
        </div>
        <button onClick={openAddModal} className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none" />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(c => (
            <button key={c} onClick={() => setSelectedCategory(c)} className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap ${selectedCategory === c ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(p => {
          const cost = parseFloat(p.costPrice || "0");
          const price = parseFloat(p.sellingPrice || "0");
          const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
          const isLow = p.stockQuantity <= p.minStockThreshold;
          return (
            <div key={p.id} className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-md overflow-hidden">
              <div className="w-full h-28 sm:h-32 bg-slate-800 relative flex items-center justify-center overflow-hidden">
                {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Layers className="w-8 h-8 text-amber-500/40" />}
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-950/85 text-amber-300 backdrop-blur-sm">{p.code}</span>
                <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-black backdrop-blur-sm ${isLow ? "bg-rose-950/80 text-rose-300" : "bg-slate-950/80 text-emerald-300"}`}>{p.stockQuantity} {p.unit}</span>
              </div>
              <div className="p-3 space-y-1.5">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">{p.category}</span>
                  <h3 className="text-xs font-extrabold text-white">{p.name}</h3>
                  {p.dimensions && <p className="text-[10px] text-amber-400/80">{p.dimensions}</p>}
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-800/60 p-2 rounded-lg text-[10px]">
                  <div><span className="text-slate-400 block">Sell</span><span className="font-black text-amber-400 text-xs">{formatCurrency(p.sellingPrice, currency)}</span></div>
                  <div><span className="text-slate-400 block">Cost</span><span className="font-bold text-slate-300">{formatCurrency(p.costPrice, currency)}</span></div>
                </div>
                <p className="text-[10px] text-slate-400">Margin: <span className="font-bold text-cyan-400">{margin}%</span></p>
              </div>
              <div className="p-2.5 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between">
                <button onClick={() => onQuickRestock(p.id)} className="px-2 py-1 text-[10px] font-bold bg-emerald-600/90 text-white rounded-lg flex items-center gap-0.5"><Package className="w-3 h-3" /> Restock</button>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditModal(p)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 hover:bg-rose-500/20 rounded-lg text-rose-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white">{editingProduct ? "Edit" : "Add"} Product</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Code</label><input type="text" required value={code} onChange={e => setCode(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Name</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Category</label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"><option value="Readymade Carpet">Readymade</option><option value="Wall to Wall">Wall2Wall</option><option value="PVC Flooring">PVC</option><option value="Artificial Grass">Grass</option><option value="Praying Mat">Prayer</option><option value="WA Carpet">WA</option></select></div>
                <div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Size</label><input type="text" value={dimensions} onChange={e => setDimensions(e.target.value)} placeholder="3x4m" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Unit</label><select value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"><option value="pcs">pcs</option><option value="sqm">sqm</option><option value="rolls">rolls</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Cost Price</label><input type="number" step="0.01" required value={costPrice} onChange={e => setCostPrice(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Sell Price</label><input type="number" step="0.01" required value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Stock</label><input type="number" step="any" required value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Min Threshold</label><input type="number" required value={minStockThreshold} onChange={e => setMinStockThreshold(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /></div>
              </div>
              <div><label className="text-[10px] font-bold text-slate-400 block mb-0.5">Description</label><textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" /></div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-2 text-xs text-slate-400">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg">{isSubmitting ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
