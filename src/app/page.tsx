"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Package,
  Layers,
  Boxes,
  Users,
  Settings as SettingsIcon,
  RefreshCw,
  CreditCard, Store,
} from "lucide-react";
import { Header } from "@/components/Header";
import { DashboardView } from "@/components/DashboardView";
import { MonthlyReportsView } from "@/components/MonthlyReportsView";
import { SalesPosView } from "@/components/SalesPosView";
import { PurchasesView } from "@/components/PurchasesView";
import { ProductsView } from "@/components/ProductsView";
import { InventoryView } from "@/components/InventoryView";
import { ContactsView } from "@/components/ContactsView";
import { SettingsView } from "@/components/SettingsView";
import { DebtsAndCreditsView } from "@/components/DebtsAndCreditsView";
import { StoresView, type StoreOverview } from "@/components/StoresView";
import { InvoiceModal } from "@/components/InvoiceModal";
import { PurchaseModal } from "@/components/PurchaseModal";
import type {
  DashboardKPIs,
  MonthlyDataPoint,
  TopProduct,
  CategoryData,
  Product,
  Sale,
  Purchase,
  Customer,
  Supplier,
  ShopSetting,
} from "@/types";

type TabKey = "dashboard" | "reports" | "pos" | "purchases" | "products" | "inventory" | "debts" | "stores" | "contacts" | "settings";

const DEFAULT_KPIS: DashboardKPIs = {
  currentMonthSales: 0, currentMonthPurchases: 0, currentMonthProfit: 0, currentMonthMargin: 0,
  salesGrowth: 0, purchasesGrowth: 0, currentMonthSalesCount: 0, currentMonthPurchasesCount: 0,
  totalStockValueCost: 0, totalStockValueRetail: 0, lowStockCount: 0, outOfStockCount: 0,
  totalProducts: 0, totalAllTimeSales: 0, totalAllTimePurchases: 0, totalAllTimeProfit: 0,
};

const navItems: Array<{
  key: TabKey;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}> = [
  { key: "dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { key: "reports", label: "Monthly Reports", shortLabel: "Reports", icon: BarChart3 },
  { key: "pos", label: "Sales & Invoices", shortLabel: "Sales", icon: ShoppingCart },
  { key: "purchases", label: "Purchases", shortLabel: "Purchases", icon: Package },
  { key: "products", label: "Catalog", shortLabel: "Catalog", icon: Layers },
  { key: "inventory", label: "Inventory", shortLabel: "Stock", icon: Boxes },
  { key: "debts", label: "Debts & Credits", shortLabel: "Debts", icon: CreditCard },
  { key: "stores", label: "Stores & Connection", shortLabel: "Stores", icon: Store },
  { key: "contacts", label: "Contacts", shortLabel: "Contacts", icon: Users },
  { key: "settings", label: "Settings", shortLabel: "Settings", icon: SettingsIcon },
];

// Show first 5 on mobile bottom bar, rest in "more" accessed via settings
const mobileNavItems = navItems.slice(0, 5);
const moreNavItems = navItems.slice(5);

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [stores, setStores] = useState<StoreOverview[]>([]);
  const [storeId, setStoreId] = useState<number|null>(null);
  const selectedStoreRef=useRef<number|null>(null);
  const storeGeneration=useRef(0);
  const requests=useRef(new Set<AbortController>());
  const [loadError, setLoadError] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<number>(6);
  const [currency, setCurrency] = useState<string>("ETB ");
  const [shopSettings, setShopSettings] = useState<ShopSetting | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [kpis, setKpis] = useState<DashboardKPIs>(DEFAULT_KPIS);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<TopProduct[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryData[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [salesList, setSalesList] = useState<Sale[]>([]);
  const [purchasesList, setPurchasesList] = useState<Purchase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const scopedFetch=useCallback(async(path:string,options:RequestInit={})=>{
    if(!storeId||storeId!==selectedStoreRef.current)throw new DOMException("Store changed","AbortError");
    const generation=storeGeneration.current;const controller=new AbortController();requests.current.add(controller);
    try{const response=await fetch(path,{...options,headers:{...Object.fromEntries(new Headers(options.headers).entries()),"X-Store-ID":String(storeId)},signal:controller.signal});
      const data=await response.arrayBuffer();
      if(storeId!==selectedStoreRef.current||generation!==storeGeneration.current)throw new DOMException("Store changed","AbortError");
      return new Response(data,{status:response.status,headers:response.headers});
    }finally{requests.current.delete(controller);}
  },[storeId]);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Sale | null>(null);
  const [selectedPurchaseForModal, setSelectedPurchaseForModal] = useState<Purchase | null>(null);

  const loadDashboardData = useCallback(async (months = selectedMonths) => {
    try {
      const res = await scopedFetch(`/api/dashboard?months=${months}`);
      const data = await res.json();
      if (data?.kpis) {
        setKpis(data.kpis);
        setMonthlyData(data.monthlyData || []);
        setTopSellingProducts(data.topSellingProducts || []);
        setCategoryDistribution(data.categoryDistribution || []);
        setLowStockItems(data.lowStockItems || []);
        setRecentSales(data.recentSales || []);
        setRecentPurchases(data.recentPurchases || []);
      }
    } catch {}
  }, [selectedMonths, scopedFetch]);

  const loadProducts = useCallback(async () => {
    try { const d = await (await scopedFetch("/api/products")).json(); if (Array.isArray(d)) setProducts(d); } catch {}
  }, [scopedFetch]);

  const loadSales = useCallback(async () => {
    try { const d = await (await scopedFetch("/api/sales")).json(); if (Array.isArray(d)) setSalesList(d); } catch {}
  }, [scopedFetch]);

  const loadPurchases = useCallback(async () => {
    try { const d = await (await scopedFetch("/api/purchases")).json(); if (Array.isArray(d)) setPurchasesList(d); } catch {}
  }, [scopedFetch]);

  const loadContacts = useCallback(async () => {
    try {
      const [cd, sd] = await Promise.all([(await scopedFetch("/api/customers")).json(), (await scopedFetch("/api/suppliers")).json()]);
      if (Array.isArray(cd)) setCustomers(cd);
      if (Array.isArray(sd)) setSuppliers(sd);
    } catch {}
  }, [scopedFetch]);

  const loadSettings = useCallback(async () => {
    try {
      const d = await (await scopedFetch("/api/settings")).json();
      if (d?.shopName) { setShopSettings(d); if (d.currency) setCurrency(d.currency); }
    } catch {}
  }, [scopedFetch]);

  const loadStores=useCallback(async()=>{const res=await fetch("/api/stores");if(!res.ok)throw new Error("Store data could not load. Please retry.");const data=await res.json();setStores(data.stores||[]);return data;},[]);
  const refreshAllData = useCallback(async () => {
    if(!storeId||storeId!==selectedStoreRef.current)return;
    const generation=storeGeneration.current;
    setIsLoading(true);
    await Promise.all([loadDashboardData(selectedMonths), loadProducts(), loadSales(), loadPurchases(), loadContacts(), loadSettings(), loadStores().catch(()=>{})]);
    if(generation===storeGeneration.current&&storeId===selectedStoreRef.current)setIsLoading(false);
  }, [loadDashboardData, loadProducts, loadSales, loadPurchases, loadContacts, loadSettings, selectedMonths, storeId, loadStores]);

  useEffect(() => {loadStores().then(data=>{selectedStoreRef.current=data.selectedStoreId;setStoreId(data.selectedStoreId);}).catch(e=>setLoadError(e.message));return()=>requests.current.forEach(c=>c.abort());},[loadStores]);
  useEffect(() => {if(storeId){setSelectedInvoiceForModal(null);setSelectedPurchaseForModal(null);refreshAllData();}},[refreshAllData,storeId]);

  const handleViewSale = async (sale: Sale) => {
    try { const d = await (await scopedFetch(`/api/sales/${sale.id}`)).json(); setSelectedInvoiceForModal(d || sale); }
    catch { setSelectedInvoiceForModal(sale); }
  };

  const handleViewPurchase = async (purchase: Purchase) => {
    try { const d = await (await scopedFetch(`/api/purchases/${purchase.id}`)).json(); setSelectedPurchaseForModal(d || purchase); }
    catch { setSelectedPurchaseForModal(purchase); }
  };

  const handleDeleteSale = async (id: number) => {
    try { await scopedFetch(`/api/sales/${id}`, { method: "DELETE" }); refreshAllData(); } catch {}
  };

  const handleDeletePurchase = async (id: number) => {
    try { await scopedFetch(`/api/purchases/${id}`, { method: "DELETE" }); refreshAllData(); } catch {}
  };

  const handleStoreChange=async(id:number)=>{if(id===storeId)return;setIsLoading(true);setLoadError("");storeGeneration.current++;requests.current.forEach(c=>c.abort());requests.current.clear();try{const res=await fetch("/api/stores/select",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({storeId:id})});if(!res.ok)throw new Error("Could not switch store");setSelectedInvoiceForModal(null);setSelectedPurchaseForModal(null);selectedStoreRef.current=id;setStoreId(id);setKpis(DEFAULT_KPIS);setMonthlyData([]);setRecentSales([]);setRecentPurchases([]);setProducts([]);setSalesList([]);setPurchasesList([]);setCustomers([]);setSuppliers([]);setShopSettings(null);}catch(e){setLoadError(e instanceof Error?e.message:"Store switching failed");setIsLoading(false);}};
  const handleCurrencyChange=async(currency:string)=>{const res=await scopedFetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...shopSettings,currency,shopName:shopSettings?.shopName||"Hamudi Carpet",taxRate:"0.00"})});if(res.ok){const settings=await res.json();if(storeId===selectedStoreRef.current)setShopSettings(settings);refreshAllData();}else setLoadError("Could not save the currency");};
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        shopName={shopSettings?.shopName || "Hamudi Carpet"}
        currency={shopSettings?.currency||currency}
        onCurrencyChange={handleCurrencyChange}
        onOpenNewSale={() => setActiveTab("pos")}
        onOpenNewPurchase={() => setActiveTab("purchases")}
        onRefreshData={refreshAllData}
        isLoading={isLoading}
        stores={stores}
        activeStoreId={storeId}
        onStoreChange={handleStoreChange}
      />

      {/* Desktop Navigation Tabs - hidden on mobile */}
      <div className="hidden sm:block bg-slate-900 border-b border-slate-800 sticky top-16 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-md scale-[1.02]"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-950" : "text-amber-400"}`} />
                  <span>{tab.label}</span>
                  {tab.key === "products" && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${isActive ? "bg-slate-950 text-amber-300" : "bg-slate-800 text-slate-300"}`}>{products.length}</span>}
                  {tab.key === "inventory" && kpis.lowStockCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">{kpis.lowStockCount}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main key={storeId} className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 sm:pb-6">
        {loadError&&<div role="alert" className="mb-4 rounded-lg bg-rose-950/30 p-3 text-xs text-rose-300">{loadError}</div>}
        {!storeId&&<div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-300">{loadError||"Loading your two stores..."}</div>}
        {storeId&&isLoading&&<div role="status" className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center text-xs text-amber-300 mb-3">Loading {stores.find(s=>s.id===storeId)?.name||"store"}...</div>}
        {storeId&&!isLoading&&activeTab === "dashboard" && (
          <DashboardView kpis={kpis} monthlyData={monthlyData} topSellingProducts={topSellingProducts}
            categoryDistribution={categoryDistribution} lowStockItems={lowStockItems} recentSales={recentSales}
            recentPurchases={recentPurchases} currency={currency} onOpenSaleModal={() => setActiveTab("pos")}
            onOpenPurchaseModal={() => setActiveTab("purchases")} onViewSale={handleViewSale} onViewPurchase={handleViewPurchase}
            onSelectMonthsRange={(m) => { setSelectedMonths(m); loadDashboardData(m); }} selectedMonths={selectedMonths}
          />
        )}
        {storeId&&!isLoading&&activeTab === "reports" && <MonthlyReportsView currency={currency} shopName={shopSettings?.shopName || "Hamudi Carpet"} />}
        {storeId&&!isLoading&&activeTab === "pos" && <SalesPosView products={products} salesList={salesList} customers={customers} suppliers={suppliers} currency={currency} onSaleCreated={refreshAllData} onViewInvoice={handleViewSale} onDeleteSale={handleDeleteSale} />}
        {storeId&&!isLoading&&activeTab === "purchases" && <PurchasesView products={products} purchasesList={purchasesList} suppliers={suppliers} customers={customers} currency={currency} onPurchaseCreated={refreshAllData} onViewPurchase={handleViewPurchase} onDeletePurchase={handleDeletePurchase} />}
        {storeId&&!isLoading&&activeTab === "products" && <ProductsView products={products} currency={currency} onRefresh={refreshAllData} onQuickRestock={() => setActiveTab("purchases")} />}
        {storeId&&!isLoading&&activeTab === "inventory" && <InventoryView products={products} currency={currency} onRefresh={refreshAllData} />}
        {storeId&&!isLoading&&activeTab === "debts" && <DebtsAndCreditsView salesList={salesList} purchasesList={purchasesList} currency={currency} onRefresh={refreshAllData} />}
        {storeId&&!isLoading&&activeTab === "contacts" && <ContactsView customers={customers} suppliers={suppliers} onRefresh={refreshAllData} />}
        {storeId&&!isLoading&&activeTab === "settings" && <SettingsView settings={shopSettings} onRefreshAll={refreshAllData} />}
        {storeId&&activeTab==="stores"&&<StoresView stores={stores} activeStoreId={storeId} products={products} onSelect={handleStoreChange} onRefresh={refreshAllData}/>}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,#0,0,0.3)]">
        <div className="flex items-center justify-around px-1 py-1">
          {mobileNavItems.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg min-w-[56px] transition-all ${
                  isActive ? "text-amber-400" : "text-slate-500 active:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-amber-400" : ""}`} />
                <span className={`text-[10px] mt-0.5 font-semibold ${isActive ? "text-amber-400" : ""}`}>{tab.shortLabel}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
              </button>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-lg min-w-[56px] text-slate-500 active:text-white"
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-semibold">More</span>
          </button>
        </div>

        {/* More Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute bottom-full right-0 left-0 bg-slate-900 border-t border-slate-800 shadow-lg p-2 grid grid-cols-3 gap-1">
            {moreNavItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all ${
                    isActive ? "bg-amber-500/20 text-amber-400" : "text-slate-400 active:bg-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-semibold">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Modals */}
      <InvoiceModal sale={selectedInvoiceForModal} currency={currency} shopName={shopSettings?.shopName || "Hamudi Carpet"} onClose={() => setSelectedInvoiceForModal(null)} />
      <PurchaseModal purchase={selectedPurchaseForModal} currency={currency} shopName={shopSettings?.shopName || "Hamudi Carpet"} onClose={() => setSelectedPurchaseForModal(null)} />

      {/* Desktop Footer */}
      <footer className="hidden sm:block mt-auto bg-slate-900 border-t border-slate-800/80 py-4 text-slate-500 text-[10px] print:hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          Hamudi Carpet Shop Management • Readymade Carpets, Wall to Wall, PVC, WA Carpet, Artificial Grass & Prayer Mats
        </div>
      </footer>
    </div>
  );
}
