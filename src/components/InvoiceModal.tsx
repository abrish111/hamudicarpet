"use client";

import React, { useRef } from "react";
import { Printer, Download, X, CheckCircle2, Building, Phone, Mail, MapPin } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types";

interface InvoiceModalProps {
  sale: Sale | null;
  currency: string;
  shopName: string;
  onClose: () => void;
}

export function InvoiceModal({
  sale,
  currency,
  shopName = "Hamudi Carpet",
  onClose,
}: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col justify-between pb-[env(safe-area-inset-bottom)] sm:pb-0">
        
        {/* Modal Action Bar (Hidden on print) */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-bold text-white">Sales Invoice Preview & Receipt</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="p-6 sm:p-8 bg-white text-slate-900 space-y-6">
          
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-black text-sm flex items-center justify-center">
                  HC
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{shopName}</h1>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Premium Readymade Carpets • Wall to Wall • PVC Flooring • Grass • Prayer Mats
              </p>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <p>Shop 14, Main Carpet Souq, Sharjah / Dubai, UAE</p>
                <p>Phone: +971 50 847 2910 | Email: hamudi.carpets@gmail.com</p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs uppercase tracking-wider rounded-md mb-1">
                Invoice
              </span>
              <h2 className="text-xl font-mono font-bold text-slate-900">{sale.invoiceNumber}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Date: <span className="font-semibold text-slate-800">{formatDate(sale.saleDate)}</span>
              </p>
              <p className="text-xs text-slate-500">
                Payment: <span className="font-bold text-emerald-700">{sale.paymentMethod} ({sale.paymentStatus})</span>
              </p>
            </div>
          </div>

          {/* Customer Info Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bill To Customer</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{sale.customerName}</p>
              {sale.customerPhone && <p className="text-slate-600 mt-0.5">{sale.customerPhone}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">Payment Received: {formatCurrency(sale.paidAmount, currency)}</p>
              <p className="text-[11px] text-slate-500">Issued by Hamudi Carpet</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Carpet Description / Size</th>
                  <th className="py-2.5 px-2 text-center">Unit</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-right">Unit Price</th>
                  <th className="py-2.5 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-2 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-2 font-semibold text-slate-900">
                        {item.productName}
                        {item.dimensions && (
                          <span className="block text-[11px] text-slate-500 font-normal">
                            Size: {item.dimensions}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600">{item.unit}</td>
                      <td className="py-3 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                      <td className="py-3 px-2 text-right text-slate-700">{formatCurrency(item.unitPrice, currency)}</td>
                      <td className="py-3 px-2 text-right font-bold text-slate-900">{formatCurrency(item.totalPrice, currency)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500">
                      Standard carpet transaction items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Calculations */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t-2 border-slate-900 gap-4 text-xs">
            <div className="max-w-xs space-y-1">
              <p className="font-bold text-slate-800">Terms & Conditions:</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Thank you for choosing Hamudi Carpet! Goods once sold can be exchanged within 7 days in original condition with invoice. Custom cut wall-to-wall carpets are non-refundable.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900">{formatCurrency(sale.subtotal, currency)}</span>
              </div>
              {parseFloat(sale.discount || "0") > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(sale.discount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                <span>Grand Total:</span>
                <span className="text-amber-700">{formatCurrency(sale.totalAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-800 pt-1">
                <span>Paid Amount:</span>
                <span>{formatCurrency(sale.paidAmount, currency)}</span>
              </div>
            </div>
          </div>

          {/* Footer barcode & signature */}
          <div className="pt-6 border-t border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left text-[11px] text-slate-400 gap-2">
            <div>
              <p className="font-mono tracking-widest text-slate-600 font-bold">||||| | |||| ||| |||||| |||| |</p>
              <p className="text-[9px]">{sale.invoiceNumber}</p>
            </div>
            <p>Authorized Signature: _______________________</p>
          </div>

        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
          >
            Print Receipt
          </button>
        </div>

      </div>
    </div>
  );
}
