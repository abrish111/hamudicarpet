"use client";

import React, { useRef } from "react";
import { Printer, X, Package } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Purchase } from "@/types";

interface PurchaseModalProps { purchase: Purchase | null; currency: string; shopName: string; onClose: () => void; }

export function PurchaseModal({ purchase, currency, shopName = "Hamudi Carpet", onClose }: PurchaseModalProps) {
  if (!purchase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between print:hidden">
          <h3 className="text-sm font-bold text-white">PO #{purchase.purchaseNumber}</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> Print</button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-white text-slate-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{shopName}</h1>
              <p className="text-xs text-slate-600 mt-1">Purchase Order</p>
            </div>
            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-extrabold text-xs uppercase rounded-md mb-1">Purchase Order</span>
              <h2 className="text-xl font-mono font-bold text-slate-900">{purchase.purchaseNumber}</h2>
              <p className="text-xs text-slate-500">Date: <span className="font-semibold">{formatDate(purchase.purchaseDate)}</span></p>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <p className="text-[10px] font-bold uppercase text-slate-400">Supplier</p>
            <p className="text-sm font-bold text-slate-900">{purchase.supplierName}</p>
            <p className="text-slate-600">{purchase.paymentMethod} • {purchase.paymentStatus}</p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-2">#</th><th className="py-2.5 px-2">Product</th><th className="py-2.5 px-2 text-center">Qty</th><th className="py-2.5 px-2 text-right">Cost</th><th className="py-2.5 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {purchase.items?.map((item, i) => (
                <tr key={i}>
                  <td className="py-2.5 px-2 text-slate-400">{i + 1}</td>
                  <td className="py-2.5 px-2 font-semibold">{item.productName}</td>
                  <td className="py-2.5 px-2 text-center font-bold">{item.quantity}</td>
                  <td className="py-2.5 px-2 text-right text-slate-700">{formatCurrency(item.unitCost, currency)}</td>
                  <td className="py-2.5 px-2 text-right font-bold">{formatCurrency(item.totalPrice, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span className="font-bold">{formatCurrency(purchase.subtotal, currency)}</span></div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300"><span>Total:</span><span className="text-emerald-700">{formatCurrency(purchase.totalAmount, currency)}</span></div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-end gap-2 print:hidden">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-300">Close</button>
          <button onClick={() => window.print()} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl">Print</button>
        </div>
      </div>
    </div>
  );
}
