import { NextResponse } from "next/server";
import { db, products, inventoryLogs } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    const item = await db.select().from(products).where(eq(products.id, productId)).limit(1);

    if (item.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(item[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    const data = await req.json();

    const existing = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const current = existing[0];
    const newStock = data.stockQuantity !== undefined ? parseFloat(data.stockQuantity) : current.stockQuantity;

    const [updated] = await db.update(products)
      .set({
        code: data.code !== undefined ? data.code.trim().toUpperCase() : current.code,
        name: data.name !== undefined ? data.name.trim() : current.name,
        category: data.category !== undefined ? data.category : current.category,
        unit: data.unit !== undefined ? data.unit : current.unit,
        dimensions: data.dimensions !== undefined ? data.dimensions : current.dimensions,
        costPrice: data.costPrice !== undefined ? String(data.costPrice) : current.costPrice,
        sellingPrice: data.sellingPrice !== undefined ? String(data.sellingPrice) : current.sellingPrice,
        stockQuantity: newStock,
        minStockThreshold: data.minStockThreshold !== undefined ? parseInt(data.minStockThreshold, 10) : current.minStockThreshold,
        description: data.description !== undefined ? data.description : current.description,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : current.imageUrl,
        isActive: data.isActive !== undefined ? data.isActive : current.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    // If stock changed directly via edit, log adjustment
    if (newStock !== current.stockQuantity) {
      const diff = newStock - current.stockQuantity;
      await db.insert(inventoryLogs).values({
        productId: updated.id,
        productName: updated.name,
        changeType: "adjustment",
        quantityChange: diff,
        previousStock: current.stockQuantity,
        newStock: newStock,
        reason: data.adjustmentReason || "Manual stock edit in product catalog",
        referenceNumber: updated.code,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    await db.delete(products).where(eq(products.id, productId));
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
