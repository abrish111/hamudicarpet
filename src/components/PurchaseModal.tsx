"use client";

import React, { useRef } from "react";
import { Printer, X, Package, Building } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Purchase } from "@/types";

interface PurchaseModalProps {
  purchase: Purchase | null;
  currency: string;
  shopName: string;
  onClose: () => void;
}

export function PurchaseModal({
  purchase,
  currency,
  shopName = "Hamudi Carpet",
  onClose,
}: PurchaseModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!purchase) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col justify-between pb-[env(safe-area-inset-bottom)] sm:pb-0">
        
        {/* Modal Action Bar */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-bold text-white">Purchase Order Details</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PO</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable PO Body */}
        <div ref={printRef} className="p-6 sm:p-8 bg-white text-slate-900 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                  HC
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{shopName}</h1>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Procurement & Stock Replenishment Order
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-extrabold text-xs uppercase tracking-wider rounded-md mb-1">
                Purchase Order
              </span>
              <h2 className="text-xl font-mono font-bold text-slate-900">{purchase.purchaseNumber}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Date: <span className="font-semibold text-slate-800">{formatDate(purchase.purchaseDate)}</span></p>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supplier / Carpet Mill</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{purchase.supplierName}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Status</p>
              <p className="text-xs font-bold text-emerald-800 mt-0.5">{purchase.paymentStatus} via {purchase.paymentMethod}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Product</th>
                  <th className="py-2.5 px-2 text-center">Unit</th>
                  <th className="py-2.5 px-2 text-center">Quantity</th>
                  <th className="py-2.5 px-2 text-right">Cost Price</th>
                  <th className="py-2.5 px-2 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {purchase.items && purchase.items.length > 0 ? (
                  purchase.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-2 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-2 font-semibold text-slate-900">
                        {item.productName}
                        {item.dimensions && <span className="block text-[11px] text-slate-500">{item.dimensions}</span>}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600">{item.unit}</td>
                      <td className="py-3 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                      <td className="py-3 px-2 text-right text-slate-700">{formatCurrency(item.unitCost, currency)}</td>
                      <td className="py-3 px-2 text-right font-bold text-slate-900">{formatCurrency(item.totalPrice, currency)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500">Standard purchase order batch</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-4 border-t-2 border-slate-900 text-xs">
            <div className="w-full sm:w-64 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900">{formatCurrency(purchase.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                <span>Total PO Cost:</span>
                <span className="text-emerald-700">{formatCurrency(purchase.totalAmount, currency)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-end gap-2 print:hidden">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white">
            Close
          </button>
          <button onClick={handlePrint} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md">
            Print PO
          </button>
        </div>

      </div>
    </div>
  );
}
