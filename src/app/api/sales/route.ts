import { NextResponse } from "next/server";
import { db, sales, saleItems, products, inventoryLogs } from "@/db";
import { seedDatabase } from "@/db/seed";
import { desc, eq, and, gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await seedDatabase(false);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const paymentStatus = searchParams.get("paymentStatus");
    const paymentMethod = searchParams.get("paymentMethod");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let salesList = await db.select().from(sales).orderBy(desc(sales.saleDate)).limit(limit);

    if (paymentStatus && paymentStatus !== "All") {
      salesList = salesList.filter(s => s.paymentStatus.toLowerCase() === paymentStatus.toLowerCase());
    }

    if (paymentMethod && paymentMethod !== "All") {
      salesList = salesList.filter(s => s.paymentMethod.toLowerCase() === paymentMethod.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      salesList = salesList.filter(s => 
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        (s.customerPhone && s.customerPhone.toLowerCase().includes(q))
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      salesList = salesList.filter(s => new Date(s.saleDate) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      salesList = salesList.filter(s => new Date(s.saleDate) <= end);
    }

    return NextResponse.json(salesList);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    if (data.items.some((item: { quantity?: unknown } | null) =>
      !item || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
      return NextResponse.json({ error: "Each item must have a positive quantity" }, { status: 400 });
    }

    // Process custom or generated invoice number
    let invoiceNumber = (data.invoiceNumber || "").trim();
    if (!invoiceNumber) {
      const timestamp = Date.now().toString().slice(-5);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      invoiceNumber = `HC-INV-${timestamp}${randomSuffix}`;
    }

    // Check if invoice number already exists, if so append unique suffix to avoid crash
    const existing = await db.select().from(sales).where(eq(sales.invoiceNumber, invoiceNumber)).limit(1);
    if (existing.length > 0) {
      invoiceNumber = `${invoiceNumber}-${Math.floor(10 + Math.random() * 90)}`;
    }

    const subtotal = parseFloat(data.subtotal || "0");
    const discount = parseFloat(data.discount || "0");
    const tax = 0; // VAT removed
    const totalAmount = parseFloat(data.totalAmount || "0");
    const paidAmount = parseFloat(data.paidAmount ?? totalAmount);
    const totalCost = parseFloat(data.totalCost || "0");

    const saleDate = data.saleDate ? new Date(data.saleDate) : new Date();

    const [createdSale] = await db.insert(sales).values({
      invoiceNumber,
      customerId: data.customerId ? parseInt(data.customerId, 10) : null,
      customerName: data.customerName || "Walk-in Customer",
      customerPhone: data.customerPhone || "",
      saleDate,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      tax: tax.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      totalCost: totalCost.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      paymentMethod: data.paymentMethod || "Cash",
      paymentStatus: data.paymentStatus || (paidAmount >= totalAmount ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid"),
      notes: data.notes || "",
    }).returning();

    const savedItems = [];

    for (const item of data.items) {
      const quantity = Number(item.quantity);
      const unitPrice = parseFloat(item.unitPrice || "0");
      const unitCost = parseFloat(item.unitCost || "0");
      const totalPrice = parseFloat(item.totalPrice || String(quantity * unitPrice));

      const [savedItem] = await db.insert(saleItems).values({
        saleId: createdSale.id,
        productId: item.productId,
        productName: item.productName || item.name,
        unit: item.unit || "pcs",
        dimensions: item.dimensions || "",
        quantity,
        unitPrice: unitPrice.toFixed(2),
        unitCost: unitCost.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
      }).returning();
      savedItems.push(savedItem);

      // Decrement product stock & log inventory
      const existingProduct = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (existingProduct.length > 0) {
        const prod = existingProduct[0];
        const newStock = Math.max(0, prod.stockQuantity - quantity);

        await db.update(products)
          .set({ stockQuantity: newStock, updatedAt: new Date() })
          .where(eq(products.id, prod.id));

        await db.insert(inventoryLogs).values({
          productId: prod.id,
          productName: prod.name,
          changeType: "sale",
          quantityChange: -quantity,
          previousStock: prod.stockQuantity,
          newStock,
          reason: `Sale Invoice #${createdSale.invoiceNumber}`,
          referenceNumber: createdSale.invoiceNumber,
        });
      }
    }

    return NextResponse.json({
      ...createdSale,
      items: savedItems,
    }, { status: 201 });
  } catch (error) {
    console.error("Error recording sale:", error);
    return NextResponse.json({ error: "Failed to record sale" }, { status: 500 });
  }
}
