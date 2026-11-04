import { NextResponse } from "next/server";
import { db, purchases, purchaseItems, products, inventoryLogs } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const purchaseId = parseInt(id, 10);

    const poRecords = await db.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1);
    if (poRecords.length === 0) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    const items = await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId));

    return NextResponse.json({
      ...poRecords[0],
      items,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch purchase details" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const purchaseId = parseInt(id, 10);
    const data = await req.json();

    const [updated] = await db.update(purchases)
      .set({
        paidAmount: data.paidAmount !== undefined ? String(data.paidAmount) : undefined,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        supplierName: data.supplierName,
      })
      .where(eq(purchases.id, purchaseId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update purchase" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const purchaseId = parseInt(id, 10);

    const items = await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId));
    const poRecord = await db.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1);

    for (const item of items) {
      const prod = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (prod.length > 0) {
        const p = prod[0];
        const newStock = Math.max(0, p.stockQuantity - item.quantity);
        await db.update(products).set({ stockQuantity: newStock }).where(eq(products.id, p.id));

        await db.insert(inventoryLogs).values({
          productId: p.id,
          productName: p.name,
          changeType: "adjustment",
          quantityChange: -item.quantity,
          previousStock: p.stockQuantity,
          newStock,
          reason: `Cancelled purchase order #${poRecord[0]?.purchaseNumber || purchaseId}`,
          referenceNumber: poRecord[0]?.purchaseNumber || `PO-${purchaseId}`,
        });
      }
    }

    await db.delete(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId));
    await db.delete(purchases).where(eq(purchases.id, purchaseId));

    return NextResponse.json({ success: true, message: "Purchase order removed" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete purchase" }, { status: 500 });
  }
}
