"use client";

import React, { useState } from "react";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  DollarSign,
  Package,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Image as ImageIcon,
  X
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductsViewProps {
  products: Product[];
  currency: string;
  onRefresh: () => void;
  onQuickRestock: (productId: number) => void;
}

export function ProductsView({
  products,
  currency,
  onRefresh,
  onQuickRestock,
}: ProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Readymade Carpet");
  const [unit, setUnit] = useState("pcs");
  const [dimensions, setDimensions] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [sellingPrice, setSellingPrice] = useState("0");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [minStockThreshold, setMinStockThreshold] = useState("5");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "All",
    "Readymade Carpet",
    "Wall to Wall",
    "PVC Flooring",
    "Artificial Grass",
    "Praying Mat",
    "WA Carpet",
  ];

  const openAddModal = () => {
    setEditingProduct(null);
    setCode(`HC-${Date.now().toString().slice(-4)}`);
    setName("");
    setCategory("Readymade Carpet");
    setUnit("pcs");
    setDimensions("");
    setCostPrice("50.00");
    setSellingPrice("85.00");
    setStockQuantity("20");
    setMinStockThreshold("5");
    setDescription("");
    setImageUrl("/images/carpet-classic.jpg");
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setCode(prod.code);
    setName(prod.name);
    setCategory(prod.category);
    setUnit(prod.unit);
    setDimensions(prod.dimensions || "");
    setCostPrice(prod.costPrice);
    setSellingPrice(prod.sellingPrice);
    setStockQuantity(String(prod.stockQuantity));
    setMinStockThreshold(String(prod.minStockThreshold));
    setDescription(prod.description || "");
    setImageUrl(prod.imageUrl || "");
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        code,
        name,
        category,
        unit,
        dimensions,
        costPrice,
        sellingPrice,
        stockQuantity: parseFloat(stockQuantity) || 0,
        minStockThreshold: parseInt(minStockThreshold, 10) || 5,
        description,
        imageUrl,
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save product");

      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to remove this product from the catalog?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      onRefresh();
    } catch (err) {
      alert("Error deleting product");
    }
  };

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.dimensions && p.dimensions.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Hamudi Carpet Catalog
            </span>
            <span className="text-xs text-slate-400">12 Core Carpet Items & Custom Sizes</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Carpet Products & Inventory Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage unit prices, cost of goods, stock thresholds, and dimensions.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Product</span>
        </button>
      </div>

      {/* Filters & Mode Switcher */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search carpets by name, dimensions (e.g. 3*4, 4*6), or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "grid" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              Card Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "table" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              Table View
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS CARD GRID VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((prod) => {
            const cost = parseFloat(prod.costPrice || "0");
            const price = parseFloat(prod.sellingPrice || "0");
            const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
            const isLow = prod.stockQuantity <= prod.minStockThreshold;

            return (
              <div
                key={prod.id}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-amber-500/50 shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image banner */}
                  <div className="w-full h-24 sm:h-36 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Layers className="w-10 h-10 text-amber-500/40" />
                    )}

                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950/85 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                      {prod.code}
                    </span>

                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black backdrop-blur-sm ${
                        isLow
                          ? "bg-rose-950/80 text-rose-300 border border-rose-500/40"
                          : "bg-slate-950/80 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {prod.stockQuantity} {prod.unit}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {prod.category}
                      </span>
                      <h3 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">
                        {prod.name}
                      </h3>
                      {prod.dimensions && (
                        <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                          Size: {prod.dimensions}
                        </p>
                      )}
                    </div>

                    {prod.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {prod.description}
                      </p>
                    )}

                    {/* Price and Cost Grid */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Selling Price</span>
                        <span className="font-black text-amber-400 text-sm">
                          {formatCurrency(prod.sellingPrice, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Unit Cost</span>
                        <span className="font-bold text-slate-300 text-xs">
                          {formatCurrency(prod.costPrice, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Gross Margin:</span>
                      <span className="font-bold text-cyan-400">{margin}% margin</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onQuickRestock(prod.id)}
                    className="px-2.5 py-1 text-xs font-bold bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Restock</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRODUCTS TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold bg-slate-800/40">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Dimensions / Unit</th>
                  <th className="py-3 px-3 text-right">Cost</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {prod.code}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      {prod.name}
                    </td>

                    <td className="py-3.5 px-3 text-slate-400">
                      {prod.category}
                    </td>

                    <td className="py-3.5 px-3 text-slate-300">
                      {prod.dimensions || "-"} ({prod.unit})
                    </td>

                    <td className="py-3.5 px-3 text-right text-slate-300">
                      {formatCurrency(prod.costPrice, currency)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-amber-400">
                      {formatCurrency(prod.sellingPrice, currency)}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          prod.stockQuantity <= prod.minStockThreshold
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {prod.stockQuantity} {prod.unit}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL (bottom sheet on mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:pb-6">
            
            <div className="mx-auto w-10 h-1 rounded-full bg-slate-700 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-extrabold text-white">
                  {editingProduct ? "Edit Carpet Product" : "Add New Carpet Product"}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition-transform">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Product Code / SKU</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Readymade 3*4"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Readymade Carpet">Readymade Carpet</option>
                    <option value="Wall to Wall">Wall to Wall</option>
                    <option value="PVC Flooring">PVC Flooring</option>
                    <option value="Artificial Grass">Artificial Grass</option>
                    <option value="Praying Mat">Praying Mat</option>
                    <option value="WA Carpet">WA Carpet</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Dimensions / Size</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="e.g. 3.0m x 4.0m"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="sqm">sqm (Square Meters)</option>
                    <option value="rolls">rolls (Rolls)</option>
                    <option value="sqft">sqft (Square Feet)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Purchase / Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    step="any"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minStockThreshold}
                    onChange={(e) => setMinStockThreshold(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Carpet weave, thickness, usage recommendations..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg"
                >
                  {isSubmitting ? "Saving..." : "Save Product"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
