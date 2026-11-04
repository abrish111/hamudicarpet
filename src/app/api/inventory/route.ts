import { NextResponse } from "next/server";
import { db, products, inventoryLogs } from "@/db";
import { seedDatabase } from "@/db/seed";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await seedDatabase(false);
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode"); // "logs" or "stock"

    if (mode === "logs") {
      const logs = await db.select().from(inventoryLogs).orderBy(desc(inventoryLogs.createdAt)).limit(100);
      return NextResponse.json(logs);
    }

    const allProducts = await db.select().from(products).orderBy(products.name);
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const productId = parseInt(data.productId, 10);
    const adjustmentType = data.type; // 'add' | 'subtract' | 'set'
    const quantity = Number(data.quantity);
    const reason = data.reason || "Manual Stock Adjustment";

    if (!productId || !Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json({ error: "Invalid product or quantity" }, { status: 400 });
    }

    const existing = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const prod = existing[0];
    let newStock = prod.stockQuantity;
    let qtyChange = 0;

    if (adjustmentType === "add") {
      qtyChange = quantity;
      newStock = prod.stockQuantity + quantity;
    } else if (adjustmentType === "subtract") {
      qtyChange = -quantity;
      newStock = Math.max(0, prod.stockQuantity - quantity);
    } else if (adjustmentType === "set") {
      qtyChange = quantity - prod.stockQuantity;
      newStock = Math.max(0, quantity);
    }

    const [updated] = await db.update(products)
      .set({
        stockQuantity: newStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    const [log] = await db.insert(inventoryLogs).values({
      productId: prod.id,
      productName: prod.name,
      changeType: "adjustment",
      quantityChange: qtyChange,
      previousStock: prod.stockQuantity,
      newStock,
      reason,
      referenceNumber: `ADJ-${Date.now().toString().slice(-4)}`,
    }).returning();

    return NextResponse.json({ product: updated, log });
  } catch (error) {
    console.error("Error adjusting inventory:", error);
    return NextResponse.json({ error: "Failed to adjust inventory" }, { status: 500 });
  }
}
