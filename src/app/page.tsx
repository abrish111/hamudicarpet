"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Plus,
  X,
  ChevronRight,
  PackagePlus,
  Sliders,
  HandCoins
} from "lucide-react";
import { Header } from "@/components/Header";
import { DashboardView } from "@/components/DashboardView";
import { MonthlyReportsView } from "@/components/MonthlyReportsView";
import { SalesView } from "@/components/SalesView";
import { PurchasesView } from "@/components/PurchasesView";
import { DebtsCreditView } from "@/components/DebtsCreditView";
import { ProductsView } from "@/components/ProductsView";
import { InventoryView } from "@/components/InventoryView";
import { ContactsView } from "@/components/ContactsView";
import { SettingsView } from "@/components/SettingsView";
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

type TabKey = "dashboard" | "reports" | "sales" | "purchases" | "debts" | "products" | "inventory" | "contacts" | "settings";

const DEFAULT_KPIS: DashboardKPIs = {
  currentMonthSales: 0,
  currentMonthPurchases: 0,
  currentMonthProfit: 0,
  currentMonthMargin: 0,
  salesGrowth: 0,
  purchasesGrowth: 0,
  currentMonthSalesCount: 0,
  currentMonthPurchasesCount: 0,
  totalStockValueCost: 0,
  totalStockValueRetail: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  totalProducts: 0,
  totalAllTimeSales: 0,
  totalAllTimePurchases: 0,
  totalAllTimeProfit: 0,
};

// Main tabs shown on the desktop top bar
const DESKTOP_TABS: Array<{ key: TabKey; label: string; shortLabel: string; icon: React.ReactNode; badge?: string | number }> = [
  { key: "dashboard", label: "Monthly Dashboard", shortLabel: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: "reports", label: "Monthly Reports", shortLabel: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "sales", label: "Sales & Invoices", shortLabel: "Sales", icon: <ShoppingCart className="w-4 h-4" /> },
  { key: "purchases", label: "Stock Purchases", shortLabel: "Purchases", icon: <Package className="w-4 h-4" /> },
  { key: "debts", label: "Debts & Credit", shortLabel: "Debts", icon: <HandCoins className="w-4 h-4" /> },
  { key: "products", label: "Carpet Catalog", shortLabel: "Catalog", icon: <Layers className="w-4 h-4" />, badge: 12 },
  { key: "inventory", label: "Warehouse Stock", shortLabel: "Stock", icon: <Boxes className="w-4 h-4" /> },
  { key: "contacts", label: "Customers & Mills", shortLabel: "Contacts", icon: <Users className="w-4 h-4" /> },
  { key: "settings", label: "Settings", shortLabel: "Settings", icon: <SettingsIcon className="w-4 h-4" /> },
];

// Tabs shown in the mobile bottom navigation (5 slots max)
const MOBILE_NAV_TABS: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "dashboard", label: "Home", icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: "sales", label: "Sales", icon: <ShoppingCart className="w-5 h-5" /> },
  { key: "purchases", label: "Buy", icon: <Package className="w-5 h-5" /> },
  { key: "debts", label: "Debts", icon: <HandCoins className="w-5 h-5" /> },
  { key: "settings", label: "More", icon: <Boxes className="w-5 h-5" /> },
];

// Remaining tabs inside the mobile "More" sheet
const MORE_TABS: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "products", label: "Carpet Catalog", icon: <Layers className="w-4 h-4" /> },
  { key: "reports", label: "Monthly Reports", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "inventory", label: "Warehouse Stock", icon: <Boxes className="w-4 h-4" /> },
  { key: "contacts", label: "Customers & Mills", icon: <Users className="w-4 h-4" /> },
  { key: "settings", label: "Settings", icon: <SettingsIcon className="w-4 h-4" /> },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [selectedMonths, setSelectedMonths] = useState<number>(6);
  const [currency, setCurrency] = useState<string>("ETB");
  const [shopSettings, setShopSettings] = useState<ShopSetting | null>(null);

  // Mobile UI state
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  // Data States
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

  // Modals
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Sale | null>(null);
  const [selectedPurchaseForModal, setSelectedPurchaseForModal] = useState<Purchase | null>(null);

  // Fetch Dashboard Data
  const loadDashboardData = useCallback(async (months = selectedMonths) => {
    try {
      const res = await fetch(`/api/dashboard?months=${months}`);
      const data = await res.json();
      if (data && data.kpis) {
        setKpis(data.kpis);
        setMonthlyData(data.monthlyData || []);
        setTopSellingProducts(data.topSellingProducts || []);
        setCategoryDistribution(data.categoryDistribution || []);
        setLowStockItems(data.lowStockItems || []);
        setRecentSales(data.recentSales || []);
        setRecentPurchases(data.recentPurchases || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    }
  }, [selectedMonths]);

  // Fetch Products
  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }, []);

  // Fetch Sales
  const loadSales = useCallback(async () => {
    try {
      const res = await fetch("/api/sales");
      const data = await res.json();
      if (Array.isArray(data)) setSalesList(data);
    } catch (err) {
      console.error("Failed to load sales:", err);
    }
  }, []);

  // Fetch Purchases
  const loadPurchases = useCallback(async () => {
    try {
      const res = await fetch("/api/purchases");
      const data = await res.json();
      if (Array.isArray(data)) setPurchasesList(data);
    } catch (err) {
      console.error("Failed to load purchases:", err);
    }
  }, []);

  // Fetch Contacts
  const loadContacts = useCallback(async () => {
    try {
      const [custRes, supRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/suppliers"),
      ]);
      const [custData, supData] = await Promise.all([custRes.json(), supRes.json()]);
      if (Array.isArray(custData)) setCustomers(custData);
      if (Array.isArray(supData)) setSuppliers(supData);
    } catch (err) {
      console.error("Failed to load contacts:", err);
    }
  }, []);

  // Fetch Settings
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data && data.shopName) {
        setShopSettings(data);
        if (data.currency) setCurrency(data.currency);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  // Full Refresh
  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      loadDashboardData(selectedMonths),
      loadProducts(),
      loadSales(),
      loadPurchases(),
      loadContacts(),
      loadSettings(),
    ]);
    setIsLoading(false);
  }, [loadDashboardData, loadProducts, loadSales, loadPurchases, loadContacts, loadSettings, selectedMonths]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handle single sale view
  const handleViewSale = async (sale: Sale) => {
    try {
      const res = await fetch(`/api/sales/${sale.id}`);
      const data = await res.json();
      setSelectedInvoiceForModal(data || sale);
    } catch {
      setSelectedInvoiceForModal(sale);
    }
  };

  // Handle single purchase view
  const handleViewPurchase = async (purchase: Purchase) => {
    try {
      const res = await fetch(`/api/purchases/${purchase.id}`);
      const data = await res.json();
      setSelectedPurchaseForModal(data || purchase);
    } catch {
      setSelectedPurchaseForModal(purchase);
    }
  };

  // Delete sale
  const handleDeleteSale = async (saleId: number) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete sale");
      refreshAllData();
    } catch (err) {
      alert("Error deleting sale");
    }
  };

  // Delete purchase
  const handleDeletePurchase = async (purchaseId: number) => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete purchase");
      refreshAllData();
    } catch (err) {
      alert("Error deleting purchase");
    }
  };

  // Navigate helper: switches tab and closes mobile sheets
  const navigateTo = (tab: TabKey) => {
    setActiveTab(tab);
    setIsMoreSheetOpen(false);
    setIsQuickActionsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const quickActions = [
    { label: "Record Sale", icon: <ShoppingCart className="w-5 h-5" />, color: "bg-amber-500 text-slate-950", action: () => navigateTo("sales") },
    { label: "New Purchase", icon: <PackagePlus className="w-5 h-5" />, color: "bg-emerald-600 text-white", action: () => navigateTo("purchases") },
    { label: "Adjust Stock", icon: <Sliders className="w-5 h-5" />, color: "bg-cyan-600 text-white", action: () => navigateTo("inventory") },
    { label: "Refresh Data", icon: <RefreshCw className="w-5 h-5" />, color: "bg-slate-700 text-white", action: () => { setIsQuickActionsOpen(false); refreshAllData(); } },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header */}
      <Header
        shopName={shopSettings?.shopName || "Hamudi Carpet"}
        currency={currency}
        onCurrencyChange={(newCurr) => {
          setCurrency(newCurr);
          if (shopSettings) {
            setShopSettings({ ...shopSettings, currency: newCurr });
          }
        }}
        onOpenNewSale={() => navigateTo("sales")}
        onOpenNewPurchase={() => navigateTo("purchases")}
        onOpenQuickStock={() => navigateTo("inventory")}
        onRefreshData={refreshAllData}
        isLoading={isLoading}
      />

      {/* Desktop Navigation Tabs (hidden on mobile) */}
      <div className="hidden md:block bg-slate-900 border-b border-slate-800 sticky top-20 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none">
            {DESKTOP_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => navigateTo(tab.key)}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40 scale-[1.02]"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <span className={isActive ? "text-slate-950" : "text-amber-400"}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isActive
                          ? "bg-slate-950 text-amber-300"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Body Content (bottom padding on mobile for the fixed nav) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-8">
        
        {activeTab === "dashboard" && (
          <DashboardView
            kpis={kpis}
            monthlyData={monthlyData}
            topSellingProducts={topSellingProducts}
            categoryDistribution={categoryDistribution}
            lowStockItems={lowStockItems}
            recentSales={recentSales}
            recentPurchases={recentPurchases}
            currency={currency}
            onOpenSaleModal={() => navigateTo("sales")}
            onOpenPurchaseModal={() => navigateTo("purchases")}
            onViewSale={handleViewSale}
            onViewPurchase={handleViewPurchase}
            onSelectMonthsRange={(m) => {
              setSelectedMonths(m);
              loadDashboardData(m);
            }}
            selectedMonths={selectedMonths}
          />
        )}

        {activeTab === "reports" && (
          <MonthlyReportsView
            currency={currency}
            shopName={shopSettings?.shopName || "Hamudi Carpet"}
          />
        )}

        {activeTab === "sales" && (
          <SalesView
            products={products}
            salesList={salesList}
            customers={customers}
            currency={currency}
            onSaleCreated={refreshAllData}
            onViewInvoice={handleViewSale}
            onDeleteSale={handleDeleteSale}
          />
        )}

        {activeTab === "purchases" && (
          <PurchasesView
            products={products}
            purchasesList={purchasesList}
            suppliers={suppliers}
            currency={currency}
            onPurchaseCreated={refreshAllData}
            onViewPurchase={handleViewPurchase}
            onDeletePurchase={handleDeletePurchase}
          />
        )}

        {activeTab === "debts" && (
          <DebtsCreditView
            currency={currency}
            refreshKey={salesList.length + purchasesList.length}
          />
        )}

        {activeTab === "products" && (
          <ProductsView
            products={products}
            currency={currency}
            onRefresh={refreshAllData}
            onQuickRestock={() => navigateTo("purchases")}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryView
            products={products}
            currency={currency}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === "contacts" && (
          <ContactsView
            customers={customers}
            suppliers={suppliers}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView
            settings={shopSettings}
            onRefreshAll={refreshAllData}
          />
        )}

      </main>

      {/* Printable / Detail Modals */}
      <InvoiceModal
        sale={selectedInvoiceForModal}
        currency={currency}
        shopName={shopSettings?.shopName || "Hamudi Carpet"}
        onClose={() => setSelectedInvoiceForModal(null)}
      />

      <PurchaseModal
        purchase={selectedPurchaseForModal}
        currency={currency}
        shopName={shopSettings?.shopName || "Hamudi Carpet"}
        onClose={() => setSelectedPurchaseForModal(null)}
      />

      {/* Footer (desktop only) */}
      <footer className="hidden md:block mt-auto bg-slate-900 border-t border-slate-800/80 py-6 text-slate-400 text-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">Hamudi Carpet Shop Management</span>
            <span>•</span>
            <span>Monthly Purchase & Sales Analytics</span>
          </div>
          <p className="text-slate-500">
            Catalog: Readymade Carpets (3*4, 2.5*3.5, 2*3, 1.5*2.2, 4*5, 4*6), Wall to Wall, PVC, WA Carpet, Artificial Grass & Praying Mats.
          </p>
        </div>
      </footer>

      {/* ============ MOBILE: Floating Quick Action Button ============ */}
      <button
        onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
        aria-label="Quick actions"
        className="md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-xl shadow-amber-950/50 border border-amber-400/50 flex items-center justify-center transition-transform active:scale-90 hover:scale-105"
      >
        {isQuickActionsOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>

      {/* Mobile Quick Actions Sheet */}
      {isQuickActionsOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsQuickActionsOpen(false)} />
          <div className="absolute bottom-24 right-4 left-4 max-w-sm mx-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 space-y-1 animate-slide-up">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-1 pb-2">
              Quick Actions
            </p>
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={qa.action}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800 active:bg-slate-800 transition-colors text-left"
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${qa.color}`}>
                  {qa.icon}
                </span>
                <span className="text-sm font-bold text-white">{qa.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============ MOBILE: Bottom Navigation Bar ============ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {MOBILE_NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => (tab.key === "settings" ? setIsMoreSheetOpen(true) : navigateTo(tab.key))}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                  isActive ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.icon}
                <span className="text-[10px] font-bold">{tab.label}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-amber-400" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile "More" Sheet */}
      {isMoreSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => setIsMoreSheetOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-slide-up">
            <div className="mx-auto w-10 h-1 rounded-full bg-slate-700 mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-white">More Options</h3>
              <button
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 active:scale-95 transition-transform"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {MORE_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => navigateTo(tab.key)}
                    className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors ${
                      isActive ? "bg-amber-500/10 text-amber-300" : "hover:bg-slate-800 text-slate-200"
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-amber-400"}`}>
                      {tab.icon}
                    </span>
                    <span className="text-sm font-bold">{tab.label}</span>
                    {isActive && <span className="ml-auto text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">Current</span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <button
                onClick={() => { setIsMoreSheetOpen(false); refreshAllData(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 text-slate-200 text-sm font-bold active:scale-[0.98] transition-transform"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
                Refresh All Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
