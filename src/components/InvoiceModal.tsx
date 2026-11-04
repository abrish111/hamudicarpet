"use client";

import React, { useRef } from "react";
import { Printer, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types";

interface InvoiceModalProps { sale: Sale | null; currency: string; shopName: string; onClose: () => void; }

export function InvoiceModal({ sale, currency, shopName = "Hamudi Carpet", onClose }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  if (!sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between print:hidden">
          <h3 className="text-sm font-bold text-white">Invoice #{sale.invoiceNumber}</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> Print</button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div ref={printRef} className="p-6 sm:p-8 bg-white text-slate-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{shopName}</h1>
              <p className="text-xs text-slate-600 mt-1">Carpet & Flooring Sales Invoice</p>
            </div>
            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs uppercase rounded-md mb-1">Invoice</span>
              <h2 className="text-xl font-mono font-bold text-slate-900">{sale.invoiceNumber}</h2>
              <p className="text-xs text-slate-500">Date: <span className="font-semibold">{formatDate(sale.saleDate)}</span></p>
              <p className="text-xs text-slate-500">Payment: <span className="font-bold text-emerald-700">{sale.paymentMethod} ({sale.paymentStatus})</span></p>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <p className="text-[10px] font-bold uppercase text-slate-400">Bill To</p>
            <p className="text-sm font-bold text-slate-900">{sale.customerName}</p>
            {sale.customerPhone && <p className="text-slate-600">{sale.customerPhone}</p>}
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-2">#</th><th className="py-2.5 px-2">Item</th><th className="py-2.5 px-2 text-center">Qty</th><th className="py-2.5 px-2 text-right">Price</th><th className="py-2.5 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sale.items?.map((item, i) => (
                <tr key={i}>
                  <td className="py-2.5 px-2 text-slate-400">{i + 1}</td>
                  <td className="py-2.5 px-2 font-semibold">{item.productName}{item.dimensions && <span className="block text-[11px] text-slate-500 font-normal">{item.dimensions}</span>}</td>
                  <td className="py-2.5 px-2 text-center font-bold">{item.quantity}</td>
                  <td className="py-2.5 px-2 text-right text-slate-700">{formatCurrency(item.unitPrice, currency)}</td>
                  <td className="py-2.5 px-2 text-right font-bold">{formatCurrency(item.totalPrice, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span className="font-bold">{formatCurrency(sale.subtotal, currency)}</span></div>
              {parseFloat(sale.discount || "0") > 0 && <div className="flex justify-between text-rose-600"><span>Discount:</span><span>-{formatCurrency(sale.discount, currency)}</span></div>}
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300"><span>Total:</span><span className="text-amber-700">{formatCurrency(sale.totalAmount, currency)}</span></div>
              <div className="flex justify-between font-semibold text-emerald-800"><span>Paid:</span><span>{formatCurrency(sale.paidAmount, currency)}</span></div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-end gap-2 print:hidden">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-300">Close</button>
          <button onClick={() => window.print()} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl">Print</button>
        </div>
      </div>
    </div>
  );
}
