import * as XLSX from "xlsx";

export function exportToExcel(data: any[], filename: string, sheetName = "Sheet1") {
  if (!data || data.length === 0) return;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename + ".xlsx");
}

export function exportSalesToExcel(sales: any[]) {
  const rows = sales.map((s: any) => ({
    "Store": s.storeId || 1,
    "Invoice": s.invoiceNumber,
    "Customer": s.customerName,
    "Phone": s.customerPhone || "",
    "Date": new Date(s.saleDate).toLocaleDateString(),
    "Subtotal": parseFloat(s.subtotal || "0"),
    "Discount": parseFloat(s.discount || "0"),
    "Total": parseFloat(s.totalAmount || "0"),
    "Paid": parseFloat(s.paidAmount || "0"),
    "Remaining": parseFloat(s.totalAmount || "0") - parseFloat(s.paidAmount || "0"),
    "Method": s.paymentMethod,
    "Status": s.paymentStatus,
    "Notes": s.notes || "",
  }));
  exportToExcel(rows, "Store_" + (sales[0]?.storeId || 1) + "_Sales", "Sales");
}

export function exportPurchasesToExcel(purchases: any[]) {
  const rows = purchases.map((p: any) => ({
    "Store": p.storeId || 1,
    "PO": p.purchaseNumber,
    "Supplier": p.supplierName,
    "Date": new Date(p.purchaseDate).toLocaleDateString(),
    "Subtotal": parseFloat(p.subtotal || "0"),
    "Total": parseFloat(p.totalAmount || "0"),
    "Paid": parseFloat(p.paidAmount || "0"),
    "Remaining": parseFloat(p.totalAmount || "0") - parseFloat(p.paidAmount || "0"),
    "Method": p.paymentMethod,
    "Status": p.paymentStatus,
    "Notes": p.notes || "",
  }));
  exportToExcel(rows, "Store_" + (purchases[0]?.storeId || 1) + "_Purchases", "Purchases");
}

export function exportDebtsToExcel(debts: any[], credits: any[]) {
  const storeId=debts[0]?.storeId||credits[0]?.storeId||1;
  const wb = XLSX.utils.book_new();
  const debtRows = debts.map((d: any) => ({
    "Invoice": d.invoiceNumber,
    "Customer": d.customerName,
    "Phone": d.customerPhone || "",
    "Date": new Date(d.saleDate).toLocaleDateString(),
    "Total": parseFloat(d.totalAmount || "0"),
    "Paid": parseFloat(d.paidAmount || "0"),
    "Remaining": parseFloat(d.totalAmount || "0") - parseFloat(d.paidAmount || "0"),
    "Method": d.paymentMethod,
    "Status": d.paymentStatus,
  }));
  const ws1 = XLSX.utils.json_to_sheet(debtRows);
  XLSX.utils.book_append_sheet(wb, ws1, "Customer Debts");

  const creditRows = credits.map((c: any) => ({
    "PO": c.purchaseNumber,
    "Supplier": c.supplierName,
    "Date": new Date(c.purchaseDate).toLocaleDateString(),
    "Total": parseFloat(c.totalAmount || "0"),
    "Paid": parseFloat(c.paidAmount || "0"),
    "Remaining": parseFloat(c.totalAmount || "0") - parseFloat(c.paidAmount || "0"),
    "Method": c.paymentMethod,
    "Status": c.paymentStatus,
  }));
  const ws2 = XLSX.utils.json_to_sheet(creditRows);
  XLSX.utils.book_append_sheet(wb, ws2, "Supplier Credits");

  XLSX.writeFile(wb, `Store_${storeId}_Debts_Credits.xlsx`);
}

export function exportInventoryToExcel(prods: any[]) {
  const rows = prods.map((p: any) => ({
    "Store": p.storeId || 1,
    "Code": p.code,
    "Name": p.name,
    "Category": p.category,
    "Size": p.dimensions || "",
    "Unit": p.unit,
    "Cost": parseFloat(p.costPrice || "0"),
    "Sell": parseFloat(p.sellingPrice || "0"),
    "Stock": p.stockQuantity,
    "Min": p.minStockThreshold,
    "Status": p.stockQuantity <= p.minStockThreshold ? "Low" : "OK",
  }));
  exportToExcel(rows, "Store_" + (prods[0]?.storeId || 1) + "_Inventory", "Inventory");
}

export function exportMonthlyReportToExcel(months: any[], storeName = "Hamudi Carpet") {
  const name = storeName.replace(/[^a-zA-Z0-9]+/g,"_");
  const rows = months.map((m: any) => ({
    "Month": m.monthName,
    "Sales": m.totalSalesRevenue,
    "COGS": m.totalCostOfSales,
    "Profit": m.grossProfit,
    "Margin%": m.marginPercent,
    "Purchases": m.totalPurchasesCost,
    "Cashflow": m.netCashflow,
    "Sales#": m.salesCount,
    "PO#": m.purchasesCount,
    "AvgTicket": m.avgSaleTicket,
  }));
  exportToExcel(rows, name + "_Monthly_Report", "Monthly");
}
