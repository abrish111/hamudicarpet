"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Store, ArrowRightLeft, Link2, Upload, Download, ExternalLink, CheckCircle2, AlertCircle, RefreshCw, FileSpreadsheet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { exportToExcel } from "@/lib/excel-export";
import * as XLSX from "xlsx";
import type { Product } from "@/types";

export type StoreOverview = { id:number; name:string; currency:string; address?:string|null; totalProducts:number; stockValue:number; salesCount:number; purchaseCount:number; totalSales:number; totalPurchases:number; receivable:number; payable:number; lowStockCount:number; connection:{status:string;apiConfigured:boolean;lastSyncAt:string|null;sourceUrl:string;lastError:string} };
interface Props { stores:StoreOverview[]; activeStoreId:number; products:Product[]; onSelect:(id:number)=>void; onRefresh:()=>void; }
const SOURCE="https://v0.app/agabrish976-gmailcoms-projects/chat/carpet-shop-management-app-fax8wI0H7n6";

export function StoresView({stores,activeStoreId,products,onSelect,onRefresh}:Props){
  const active=stores.find(s=>s.id===activeStoreId);
  const other=stores.find(s=>s.id!==activeStoreId);
  const [name,setName]=useState(active?.name||"");const [address,setAddress]=useState(active?.address||"");
  const [apiUrl,setApiUrl]=useState("");const [envConfigured,setEnvConfigured]=useState(false);
  const [message,setMessage]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  const [productId,setProductId]=useState("");const [target,setTarget]=useState(other?.id||2);const [qty,setQty]=useState(1);
  const [file,setFile]=useState<File|null>(null);const [note,setNote]=useState("");
  useEffect(()=>{setName(active?.name||"");setAddress(active?.address||"");setTarget(other?.id||2);setProductId("");},[active?.name,active?.address,other?.id]);
  useEffect(()=>{fetch("/api/integrations").then(r=>r.json()).then(d=>{setApiUrl(d.connection?.apiUrl||"");setEnvConfigured(d.tokenConfigured||false)}).catch(()=>{});},[activeStoreId]);
  async function run(action:()=>Promise<Response>,success:string){setError("");setMessage("");setBusy(true);try{const res=await action();const data=await res.json();if(!res.ok)throw new Error(data.error||"Request failed");setMessage(success+(data.imported===true?". "+(data.products||0)+" products, "+(data.sales||0)+" sales and "+(data.purchases||0)+" purchases imported.":data.skipped?". This snapshot was already imported; nothing was duplicated.":""));onRefresh();return data;}catch(e){setError(e instanceof Error?e.message:"Request failed");}finally{setBusy(false);}}
  async function upload(){if(!file)return;const form=new FormData();form.append("file",file);await run(()=>fetch("/api/integrations/import",{method:"POST",body:form}),"Import completed");}
  function template(){
    const wb=XLSX.utils.book_new();
    for(const [name,rows] of Object.entries({Products:[{code:"RMC-STD",name:"Readmade Carpet",category:"Readymade Carpet",unit:"pcs",dimensions:"2m x 3m",costPrice:48,sellingPrice:85,stockQuantity:0}],Customers:[],Suppliers:[],Sales:[],Purchases:[]})){
      const sheet=XLSX.utils.json_to_sheet(rows.length?rows:[]);
      if(!rows.length)XLSX.utils.sheet_add_aoa(sheet,[name==="Customers"?["name","phone","email","address"]:name==="Suppliers"?["name","companyName","phone","email"]:name==="Sales"?["invoiceNumber","customerName","saleDate","totalAmount","paidAmount","paymentStatus"]:["purchaseNumber","supplierName","purchaseDate","totalAmount","paidAmount","paymentStatus"]],{origin:"A1"});
      XLSX.utils.book_append_sheet(wb,sheet,name);
    }
    XLSX.writeFile(wb,`Store_${activeStoreId}_Import_Template.xlsx`);
  }
  return <div className="space-y-4 sm:space-y-6">
    <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-amber-950 p-4 sm:p-5">
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300"><Store className="h-3 w-3"/> Two stores · one workspace</span>
      <h2 className="mt-2 text-lg sm:text-2xl font-extrabold text-white">Stores & Connection</h2>
      <p className="mt-1 text-xs text-slate-400">Record new sales, purchases and payments in the selected store. Each store keeps its own contacts, products, history and stock.</p>
    </div>
    {message&&<div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0"/>{message}</div>}
    {error&&<div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-start gap-2"><AlertCircle className="h-4 w-4 shrink-0"/>{error}</div>}
    <div className="grid gap-3 sm:grid-cols-2">
      {stores.map(store=><div key={store.id} className={`rounded-xl border p-4 shadow-md ${store.id===activeStoreId?"border-amber-500/50 bg-slate-900":"border-slate-800 bg-slate-900/80"}`}>
        <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><div className="rounded-lg bg-amber-500/10 p-2 text-amber-400"><Store className="h-4 w-4"/></div><div><h3 className="text-sm font-bold text-white">{store.name}</h3><p className="text-[10px] text-slate-400">{store.currency.trim()} · {store.totalProducts} items</p></div></div>{store.id===activeStoreId?<span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">Selected</span>:<button onClick={()=>onSelect(store.id)} className="text-xs font-bold text-amber-400 hover:underline">Switch</button>}</div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><span className="text-slate-400">Sales</span><p className="font-black text-amber-300">{formatCurrency(store.totalSales,store.currency)}</p></div><div><span className="text-slate-400">Purchases</span><p className="font-black text-emerald-300">{formatCurrency(store.totalPurchases,store.currency)}</p></div><div><span className="text-slate-400">Stock value</span><p className="font-black text-white">{formatCurrency(store.stockValue,store.currency)}</p></div><div><span className="text-slate-400">Outstanding</span><p className="text-[11px] text-rose-300">Due: {formatCurrency(store.receivable,store.currency)}<br/>Owe: {formatCurrency(store.payable,store.currency)}</p></div></div>
      </div>)}
    </div>
    <p className="text-[11px] text-slate-400">Currency amounts are shown per store. Different currencies are never added together or silently converted.</p>

    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
      <h3 className="text-sm font-bold text-white">Edit the selected store</h3>
      <div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-slate-400">Store name<input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"/></label><label className="text-xs text-slate-400">Address<input value={address} onChange={e=>setAddress(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"/></label></div>
      <button disabled={busy||!name.trim()} onClick={()=>run(()=>fetch("/api/stores",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,address})}),"Store updated")} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Save store</button>
    </div>

    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-white"><ArrowRightLeft className="h-4 w-4 text-amber-400"/>Transfer stock between stores</h3>
      <p className="text-[11px] text-slate-400">Sending from <span className="text-slate-200">{active?.name}</span>. The transfer is recorded in both stores’ stock audit trails.</p>
      <div className="grid gap-2 sm:grid-cols-3"><label className="text-xs text-slate-400">Product<select value={productId} onChange={e=>setProductId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-white"><option value="">Select carpet</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.stockQuantity} {p.unit}</option>)}</select></label><label className="text-xs text-slate-400">Receiving store<select value={target} onChange={e=>setTarget(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-white">{stores.filter(s=>s.id!==activeStoreId).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="text-xs text-slate-400">Quantity<input type="number" min="1" value={qty} onChange={e=>setQty(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-white"/></label></div>
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Transfer note (optional)" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"/>
      <button disabled={busy||!productId||qty<1} onClick={()=>run(()=>fetch("/api/stores/transfer",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({toStoreId:target,productId:Number(productId),quantity:qty,note})}),"Stock transferred") } className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Transfer stock</button>
    </div>

    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="flex items-center gap-1.5 text-sm font-bold text-white"><Link2 className="h-4 w-4 text-emerald-400"/>Other carpet shop app</h3><span className={`w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold ${active?.connection.status==="imported"?"border-emerald-500/30 bg-emerald-500/10 text-emerald-300":"border-slate-700 bg-slate-800 text-slate-300"}`}>{active?.connection.status==="imported"?"Data imported":active?.connection.status==="error"?"Connection needs attention":"Not connected"}</span></div>
      <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 text-[11px] text-slate-300">The v0 link is a private chat, not a data API. It cannot be automatically read here. Import an export from the other app, or connect its public/deployed API when available. No live synchronization is claimed.</div>
      <a href={SOURCE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline">Open the linked app <ExternalLink className="h-3 w-3"/></a>
      <div className="grid gap-2 sm:grid-cols-2"><button onClick={template} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5"><FileSpreadsheet className="h-4 w-4 text-emerald-400"/> Download Excel template</button><a href="/api/integrations/export" download className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5"><Download className="h-4 w-4 text-amber-400"/> Back up this store (JSON)</a></div>
      <div className="rounded-lg border border-dashed border-slate-700 bg-slate-800/40 p-3 space-y-2"><label className="text-xs font-bold text-white">Import into: {active?.name}</label><p className="text-[10px] text-slate-400">Excel or CSV: Products, Customers, Suppliers, Sales and Purchases sheets. JSON: same snapshot format. Maximum 10 MB. Existing invoices and stock activity are preserved.</p><input type="file" accept=".xlsx,.csv,.json" onChange={e=>setFile(e.target.files?.[0]||null)} className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-[11px] text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-amber-500/20 file:px-2 file:py-1 file:text-amber-300"/><button onClick={upload} disabled={busy||!file} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50 inline-flex items-center gap-1.5">{busy?<RefreshCw className="h-3 w-3 animate-spin"/>:<Upload className="h-3 w-3"/>}Import file</button></div>
      <details className="rounded-lg border border-slate-700 bg-slate-800/40 p-3"><summary className="cursor-pointer text-xs font-bold text-slate-300">Connect an accessible API (manual sync)</summary><div className="mt-3 space-y-2"><label className="block text-[11px] text-slate-400">HTTPS data endpoint<input value={apiUrl} onChange={e=>setApiUrl(e.target.value)} placeholder="https://your-deployed-app.com/api/export" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white"/></label><p className="text-[10px] text-slate-400">The endpoint must return this app’s JSON snapshot format. A bearer token, if needed, is read only from <code className="text-slate-300">STORE_{activeStoreId}_API_TOKEN</code> on the server. {envConfigured?"Token is configured.":"No token configured; public endpoints are still supported."}</p><div className="flex gap-2"><button disabled={busy||!apiUrl} onClick={()=>run(()=>fetch("/api/integrations",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({apiUrl})}),"API endpoint saved; not automatically syncing")} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Save endpoint</button><button disabled={busy||!active?.connection.apiConfigured} onClick={()=>run(()=>fetch("/api/integrations/sync",{method:"POST"}),"Snapshot imported from API")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Import from API</button></div></div></details>
    </div>
  </div>;
}
