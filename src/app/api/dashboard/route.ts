import { NextResponse } from "next/server";
import { db, sales, saleItems, purchases, products } from "@/db";
import { seedDatabase } from "@/db/seed";
import { desc, sql, gte, lte } from "drizzle-orm";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await seedDatabase(false);

    const { searchParams } = new URL(req.url);
    const monthsCount = parseInt(searchParams.get("months") || "6", 10);
    const selectedYear = searchParams.get("year");

    const now = new Date();
    
    // Fetch all sales and purchases
    const allSales = await db.select().from(sales).orderBy(desc(sales.saleDate));
    const allPurchases = await db.select().from(purchases).orderBy(desc(purchases.purchaseDate));
    const allProducts = await db.select().from(products);
    const allSaleItems = await db.select().from(saleItems);

    // Current Month dates
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Calculate monthly history for the last N months (e.g. 6 or 12)
    const monthlyData: Array<{
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
    }> = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetDate = subMonths(now, i);
      const mStart = startOfMonth(targetDate);
      const mEnd = endOfMonth(targetDate);
      const monthKey = format(targetDate, "yyyy-MM");
      const monthLabel = format(targetDate, "MMM yyyy");
      const shortMonth = format(targetDate, "MMM");
      const year = targetDate.getFullYear();

      const monthSales = allSales.filter(s => {
        const d = new Date(s.saleDate);
        return d >= mStart && d <= mEnd;
      });

      const monthPurchases = allPurchases.filter(p => {
        const d = new Date(p.purchaseDate);
        return d >= mStart && d <= mEnd;
      });

      const totalSales = monthSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);
      const totalCostOfSales = monthSales.reduce((sum, s) => sum + parseFloat(s.totalCost || "0"), 0);
      const totalPurchases = monthPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount || "0"), 0);
      const profit = totalSales - totalCostOfSales;
      const margin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

      monthlyData.push({
        monthKey,
        monthLabel,
        shortMonth,
        year,
        salesAmount: Math.round(totalSales * 100) / 100,
        purchasesAmount: Math.round(totalPurchases * 100) / 100,
        profitAmount: Math.round(profit * 100) / 100,
        salesCount: monthSales.length,
        purchasesCount: monthPurchases.length,
        marginPercent: Math.round(margin * 10) / 10,
      });
    }

    // Current Month Metrics
    const curSales = allSales.filter(s => {
      const d = new Date(s.saleDate);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });
    const lastSales = allSales.filter(s => {
      const d = new Date(s.saleDate);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const curPurchases = allPurchases.filter(p => {
      const d = new Date(p.purchaseDate);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });
    const lastPurchases = allPurchases.filter(p => {
      const d = new Date(p.purchaseDate);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const currentMonthSales = curSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);
    const lastMonthSales = lastSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);
    const salesGrowth = lastMonthSales > 0 ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100 : 0;

    const currentMonthPurchases = curPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount || "0"), 0);
    const lastMonthPurchases = lastPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount || "0"), 0);
    const purchasesGrowth = lastMonthPurchases > 0 ? ((currentMonthPurchases - lastMonthPurchases) / lastMonthPurchases) * 100 : 0;

    const currentMonthCost = curSales.reduce((sum, s) => sum + parseFloat(s.totalCost || "0"), 0);
    const currentMonthProfit = currentMonthSales - currentMonthCost;
    const currentMonthMargin = currentMonthSales > 0 ? (currentMonthProfit / currentMonthSales) * 100 : 0;

    // Inventory Valuation
    let totalStockValueCost = 0;
    let totalStockValueRetail = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const lowStockItems = [];

    for (const p of allProducts) {
      const qty = p.stockQuantity || 0;
      const cost = parseFloat(p.costPrice || "0");
      const retail = parseFloat(p.sellingPrice || "0");
      totalStockValueCost += qty * cost;
      totalStockValueRetail += qty * retail;

      if (qty <= 0) {
        outOfStockCount++;
        lowStockItems.push(p);
      } else if (qty <= p.minStockThreshold) {
        lowStockCount++;
        lowStockItems.push(p);
      }
    }

    // Top Selling Products Calculation
    const productSalesMap = new Map<number, {
      id: number;
      name: string;
      unit: string;
      dimensions: string | null;
      quantitySold: number;
      revenue: number;
      cost: number;
      profit: number;
    }>();

    for (const item of allSaleItems) {
      const existing = productSalesMap.get(item.productId) || {
        id: item.productId,
        name: item.productName,
        unit: item.unit,
        dimensions: item.dimensions,
        quantitySold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      };

      const lineRev = parseFloat(item.totalPrice || "0");
      const lineCost = (parseFloat(item.unitCost || "0") * item.quantity);
      existing.quantitySold += item.quantity;
      existing.revenue += lineRev;
      existing.cost += lineCost;
      existing.profit += (lineRev - lineCost);

      productSalesMap.set(item.productId, existing);
    }

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
      .map(p => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100,
        profit: Math.round(p.profit * 100) / 100,
        margin: p.revenue > 0 ? Math.round(((p.profit / p.revenue) * 100) * 10) / 10 : 0,
      }));

    // Category breakdown
    const categoryMap = new Map<string, { category: string; revenue: number; quantity: number }>();
    for (const item of allSaleItems) {
      const prod = allProducts.find(p => p.id === item.productId);
      const cat = prod?.category || "Other";
      const existing = categoryMap.get(cat) || { category: cat, revenue: 0, quantity: 0 };
      existing.revenue += parseFloat(item.totalPrice || "0");
      existing.quantity += item.quantity;
      categoryMap.set(cat, existing);
    }

    const categoryDistribution = Array.from(categoryMap.values()).map(c => ({
      ...c,
      revenue: Math.round(c.revenue * 100) / 100,
    }));

    // All-time totals
    const totalAllTimeSales = allSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);
    const totalAllTimePurchases = allPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount || "0"), 0);
    const totalAllTimeCost = allSales.reduce((sum, s) => sum + parseFloat(s.totalCost || "0"), 0);
    const totalAllTimeProfit = totalAllTimeSales - totalAllTimeCost;

    // Recent 6 transactions
    const recentSales = allSales.slice(0, 6);
    const recentPurchases = allPurchases.slice(0, 6);

    return NextResponse.json({
      kpis: {
        currentMonthSales: Math.round(currentMonthSales * 100) / 100,
        currentMonthPurchases: Math.round(currentMonthPurchases * 100) / 100,
        currentMonthProfit: Math.round(currentMonthProfit * 100) / 100,
        currentMonthMargin: Math.round(currentMonthMargin * 10) / 10,
        salesGrowth: Math.round(salesGrowth * 10) / 10,
        purchasesGrowth: Math.round(purchasesGrowth * 10) / 10,
        currentMonthSalesCount: curSales.length,
        currentMonthPurchasesCount: curPurchases.length,
        totalStockValueCost: Math.round(totalStockValueCost * 100) / 100,
        totalStockValueRetail: Math.round(totalStockValueRetail * 100) / 100,
        lowStockCount,
        outOfStockCount,
        totalProducts: allProducts.length,
        totalAllTimeSales: Math.round(totalAllTimeSales * 100) / 100,
        totalAllTimePurchases: Math.round(totalAllTimePurchases * 100) / 100,
        totalAllTimeProfit: Math.round(totalAllTimeProfit * 100) / 100,
      },
      monthlyData,
      topSellingProducts,
      categoryDistribution,
      lowStockItems,
      recentSales,
      recentPurchases,
    });
  } catch (error) {
    console.error("Error in dashboard API:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
