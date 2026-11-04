import { NextResponse } from "next/server";
import { db, sales, saleItems, products, inventoryLogs } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const saleId = parseInt(id, 10);

    const saleRecords = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
    if (saleRecords.length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));

    return NextResponse.json({
      ...saleRecords[0],
      items,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sale details" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const saleId = parseInt(id, 10);
    const data = await req.json();

    const [updated] = await db.update(sales)
      .set({
        paidAmount: data.paidAmount !== undefined ? String(data.paidAmount) : undefined,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
      })
      .where(eq(sales.id, saleId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json({ error: "Failed to update sale" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const saleId = parseInt(id, 10);

    // Fetch items to restore stock
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    const saleRecord = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);

    for (const item of items) {
      const prod = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (prod.length > 0) {
        const p = prod[0];
        const newStock = p.stockQuantity + item.quantity;
        await db.update(products).set({ stockQuantity: newStock }).where(eq(products.id, p.id));
        
        await db.insert(inventoryLogs).values({
          productId: p.id,
          productName: p.name,
          changeType: "adjustment",
          quantityChange: item.quantity,
          previousStock: p.stockQuantity,
          newStock,
          reason: `Restored stock from voided invoice #${saleRecord[0]?.invoiceNumber || saleId}`,
          referenceNumber: saleRecord[0]?.invoiceNumber || `INV-${saleId}`,
        });
      }
    }

    await db.delete(saleItems).where(eq(saleItems.saleId, saleId));
    await db.delete(sales).where(eq(sales.id, saleId));

    return NextResponse.json({ success: true, message: "Sale deleted and stock restored" });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 });
  }
}
