import { NextResponse } from "next/server";
import { db, sales, saleItems, purchases, purchaseItems, products } from "@/db";
import { seedDatabase } from "@/db/seed";
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await seedDatabase(false);
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");

    const now = new Date();
    const currentYear = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const allSales = await db.select().from(sales);
    const allSaleItems = await db.select().from(saleItems);
    const allPurchases = await db.select().from(purchases);
    const allPurchaseItems = await db.select().from(purchaseItems);
    const allProducts = await db.select().from(products);

    // Build 12 months for the selected year
    const monthlyReports = [];

    for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
      const monthStart = new Date(currentYear, monthIdx, 1);
      const monthEnd = new Date(currentYear, monthIdx + 1, 0, 23, 59, 59, 999);
      const monthKey = format(monthStart, "yyyy-MM");
      const monthName = format(monthStart, "MMMM yyyy");
      const shortName = format(monthStart, "MMM");

      // Filter sales and purchases in this month
      const monthSales = allSales.filter(s => {
        const d = new Date(s.saleDate);
        return d >= monthStart && d <= monthEnd;
      });

      const monthPurchases = allPurchases.filter(p => {
        const d = new Date(p.purchaseDate);
        return d >= monthStart && d <= monthEnd;
      });

      const totalSalesRevenue = monthSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);
      const totalCostOfSales = monthSales.reduce((sum, s) => sum + parseFloat(s.totalCost || "0"), 0);
      const grossProfit = totalSalesRevenue - totalCostOfSales;
      const marginPercent = totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;

      const totalPurchasesCost = monthPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount || "0"), 0);
      const avgSaleTicket = monthSales.length > 0 ? totalSalesRevenue / monthSales.length : 0;

      // Product level breakdown for this month
      const monthSaleIds = new Set(monthSales.map(s => s.id));
      const monthSaleItems = allSaleItems.filter(si => monthSaleIds.has(si.saleId));

      const monthPurchaseIds = new Set(monthPurchases.map(p => p.id));
      const monthPurchaseItemsList = allPurchaseItems.filter(pi => monthPurchaseIds.has(pi.purchaseId));

      const productPerformance = allProducts.map(prod => {
        const pSaleItems = monthSaleItems.filter(si => si.productId === prod.id);
        const pPurchaseItems = monthPurchaseItemsList.filter(pi => pi.productId === prod.id);

        const unitsSold = pSaleItems.reduce((sum, item) => sum + item.quantity, 0);
        const salesRevenue = pSaleItems.reduce((sum, item) => sum + parseFloat(item.totalPrice || "0"), 0);
        const costOfSold = pSaleItems.reduce((sum, item) => sum + (parseFloat(item.unitCost || "0") * item.quantity), 0);
        const prodProfit = salesRevenue - costOfSold;

        const unitsPurchased = pPurchaseItems.reduce((sum, item) => sum + item.quantity, 0);
        const purchaseCost = pPurchaseItems.reduce((sum, item) => sum + parseFloat(item.totalPrice || "0"), 0);

        return {
          productId: prod.id,
          productCode: prod.code,
          productName: prod.name,
          category: prod.category,
          unit: prod.unit,
          dimensions: prod.dimensions,
          unitsSold,
          salesRevenue: Math.round(salesRevenue * 100) / 100,
          grossProfit: Math.round(prodProfit * 100) / 100,
          unitsPurchased,
          purchaseCost: Math.round(purchaseCost * 100) / 100,
          currentStock: prod.stockQuantity,
        };
      });

      monthlyReports.push({
        monthKey,
        monthName,
        shortName,
        monthIdx: monthIdx + 1,
        year: currentYear,
        totalSalesRevenue: Math.round(totalSalesRevenue * 100) / 100,
        totalCostOfSales: Math.round(totalCostOfSales * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        marginPercent: Math.round(marginPercent * 10) / 10,
        totalPurchasesCost: Math.round(totalPurchasesCost * 100) / 100,
        netCashflow: Math.round((totalSalesRevenue - totalPurchasesCost) * 100) / 100,
        salesCount: monthSales.length,
        purchasesCount: monthPurchases.length,
        avgSaleTicket: Math.round(avgSaleTicket * 100) / 100,
        productPerformance,
      });
    }

    // Yearly summary
    const yearlyTotalSales = monthlyReports.reduce((sum, m) => sum + m.totalSalesRevenue, 0);
    const yearlyTotalPurchases = monthlyReports.reduce((sum, m) => sum + m.totalPurchasesCost, 0);
    const yearlyGrossProfit = monthlyReports.reduce((sum, m) => sum + m.grossProfit, 0);
    const yearlyMargin = yearlyTotalSales > 0 ? (yearlyGrossProfit / yearlyTotalSales) * 100 : 0;
    const yearlySalesCount = monthlyReports.reduce((sum, m) => sum + m.salesCount, 0);
    const yearlyPurchasesCount = monthlyReports.reduce((sum, m) => sum + m.purchasesCount, 0);

    return NextResponse.json({
      year: currentYear,
      availableYears: [currentYear - 1, currentYear, currentYear + 1],
      summary: {
        totalSales: Math.round(yearlyTotalSales * 100) / 100,
        totalPurchases: Math.round(yearlyTotalPurchases * 100) / 100,
        grossProfit: Math.round(yearlyGrossProfit * 100) / 100,
        marginPercent: Math.round(yearlyMargin * 10) / 10,
        salesCount: yearlySalesCount,
        purchasesCount: yearlyPurchasesCount,
      },
      months: monthlyReports,
    });
  } catch (error) {
    console.error("Error in monthly reports:", error);
    return NextResponse.json({ error: "Failed to generate monthly reports" }, { status: 500 });
  }
}
