import { NextResponse } from "next/server";
import { db, purchases, purchaseItems, products, inventoryLogs } from "@/db";
import { seedDatabase } from "@/db/seed";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await seedDatabase(false);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const paymentStatus = searchParams.get("paymentStatus");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let list = await db.select().from(purchases).orderBy(desc(purchases.purchaseDate)).limit(limit);

    if (paymentStatus && paymentStatus !== "All") {
      list = list.filter(p => p.paymentStatus.toLowerCase() === paymentStatus.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.purchaseNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
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

    // Process custom or generated purchase/invoice number
    let purchaseNumber = (data.purchaseNumber || data.invoiceNumber || "").trim();
    if (!purchaseNumber) {
      const timestamp = Date.now().toString().slice(-5);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      purchaseNumber = `HC-PO-${timestamp}${randomSuffix}`;
    }

    // Check if purchase number already exists, append suffix to avoid duplicate key error
    const existing = await db.select().from(purchases).where(eq(purchases.purchaseNumber, purchaseNumber)).limit(1);
    if (existing.length > 0) {
      purchaseNumber = `${purchaseNumber}-${Math.floor(10 + Math.random() * 90)}`;
    }

    const subtotal = parseFloat(data.subtotal || "0");
    const tax = 0; // VAT removed
    const shippingFee = parseFloat(data.shippingFee || "0");
    const totalAmount = parseFloat(data.totalAmount || "0");
    const paidAmount = parseFloat(data.paidAmount ?? totalAmount);
    const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : new Date();

    const [createdPurchase] = await db.insert(purchases).values({
      purchaseNumber,
      supplierId: data.supplierId ? parseInt(data.supplierId, 10) : null,
      supplierName: data.supplierName || "General Supplier",
      purchaseDate,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shippingFee: shippingFee.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      paymentStatus: data.paymentStatus || (paidAmount >= totalAmount ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid"),
      paymentMethod: data.paymentMethod || "Bank Transfer",
      notes: data.notes || "",
    }).returning();

    const savedItems = [];

    for (const item of data.items) {
      const quantity = Number(item.quantity);
      const unitCost = parseFloat(item.unitCost || "0");
      const totalPrice = parseFloat(item.totalPrice || String(quantity * unitCost));

      const [savedItem] = await db.insert(purchaseItems).values({
        purchaseId: createdPurchase.id,
        productId: item.productId,
        productName: item.productName || item.name,
        unit: item.unit || "pcs",
        dimensions: item.dimensions || "",
        quantity,
        unitCost: unitCost.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
      }).returning();
      savedItems.push(savedItem);

      // Increment product stock and update costPrice if provided
      const existingProduct = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (existingProduct.length > 0) {
        const prod = existingProduct[0];
        const newStock = prod.stockQuantity + quantity;

        await db.update(products)
          .set({ 
            stockQuantity: newStock,
            costPrice: unitCost > 0 ? unitCost.toFixed(2) : prod.costPrice,
            updatedAt: new Date(),
          })
          .where(eq(products.id, prod.id));

        await db.insert(inventoryLogs).values({
          productId: prod.id,
          productName: prod.name,
          changeType: "purchase",
          quantityChange: quantity,
          previousStock: prod.stockQuantity,
          newStock,
          reason: `Stock Purchase PO / Bill #${createdPurchase.purchaseNumber}`,
          referenceNumber: createdPurchase.purchaseNumber,
        });
      }
    }

    return NextResponse.json({
      ...createdPurchase,
      items: savedItems,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json({ error: "Failed to record purchase order" }, { status: 500 });
  }
}
