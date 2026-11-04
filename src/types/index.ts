export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  dimensions?: string | null;
  costPrice: string;
  sellingPrice: string;
  stockQuantity: number;
  minStockThreshold: number;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleItem {
  id?: number;
  saleId?: number;
  productId: number;
  productName: string;
  unit: string;
  dimensions?: string | null;
  quantity: number;
  unitPrice: string;
  unitCost: string;
  totalPrice: string;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  customerId?: number | null;
  customerName: string;
  customerPhone?: string | null;
  saleDate: string;
  subtotal: string;
  discount: string;
  tax: string;
  totalAmount: string;
  totalCost: string;
  paidAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string | null;
  items?: SaleItem[];
  createdAt: string;
}

export interface PurchaseItem {
  id?: number;
  purchaseId?: number;
  productId: number;
  productName: string;
  unit: string;
  dimensions?: string | null;
  quantity: number;
  unitCost: string;
  totalPrice: string;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId?: number | null;
  supplierName: string;
  purchaseDate: string;
  subtotal: string;
  tax: string;
  shippingFee: string;
  totalAmount: string;
  paidAmount: string;
  paymentStatus: string;
  paymentMethod: string;
  notes?: string | null;
  items?: PurchaseItem[];
  createdAt: string;
}

export interface InventoryLog {
  id: number;
  productId: number;
  productName: string;
  changeType: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  referenceNumber?: string | null;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface Supplier {
  id: number;
  name: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface ShopSetting {
  id: number;
  shopName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxRate: string;
  currency: string;
  invoicePrefix: string;
  purchasePrefix: string;
  footerNote?: string | null;
}

export interface MonthlyDataPoint {
  monthKey: string;
  monthLabel: string;
  shortMonth: string;
  year: number;
  salesAmount: number;
  purchasesAmount: number;
  profitAmount: number;
  salesCount: number;
  purchasesCount: number;
  marginPercent: number;
}

export interface TopProduct {
  id: number;
  name: string;
  unit: string;
  dimensions: string | null;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export interface CategoryData {
  category: string;
  revenue: number;
  quantity: number;
}

export interface DashboardKPIs {
  currentMonthSales: number;
  currentMonthPurchases: number;
  currentMonthProfit: number;
  currentMonthMargin: number;
  salesGrowth: number;
  purchasesGrowth: number;
  currentMonthSalesCount: number;
  currentMonthPurchasesCount: number;
  totalStockValueCost: number;
  totalStockValueRetail: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalProducts: number;
  totalAllTimeSales: number;
  totalAllTimePurchases: number;
  totalAllTimeProfit: number;
}

export interface ProductMonthlyPerf {
  productId: number;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  dimensions: string | null;
  unitsSold: number;
  salesRevenue: number;
  grossProfit: number;
  unitsPurchased: number;
  purchaseCost: number;
  currentStock: number;
}

export interface MonthReportItem {
  monthKey: string;
  monthName: string;
  shortName: string;
  monthIdx: number;
  year: number;
  totalSalesRevenue: number;
  totalCostOfSales: number;
  grossProfit: number;
  marginPercent: number;
  totalPurchasesCost: number;
  netCashflow: number;
  salesCount: number;
  purchasesCount: number;
  avgSaleTicket: number;
  productPerformance: ProductMonthlyPerf[];
}
