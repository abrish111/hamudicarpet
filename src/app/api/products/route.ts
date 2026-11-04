import { NextResponse } from "next/server";
import { db, products, inventoryLogs } from "@/db";
import { seedDatabase } from "@/db/seed";
import { desc, asc, ilike, or, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await seedDatabase(false);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let items = await db.select().from(products).orderBy(asc(products.id));

    if (category && category !== "All") {
      items = items.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.dimensions && p.dimensions.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.name || !data.code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
    }

    const [newProduct] = await db.insert(products).values({
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      category: data.category || "Readymade Carpet",
      unit: data.unit || "pcs",
      dimensions: data.dimensions || "",
      costPrice: String(data.costPrice || "0.00"),
      sellingPrice: String(data.sellingPrice || "0.00"),
      stockQuantity: parseFloat(data.stockQuantity || "0"),
      minStockThreshold: parseInt(data.minStockThreshold || "5", 10),
      description: data.description || "",
      imageUrl: data.imageUrl || "",
      isActive: data.isActive ?? true,
    }).returning();

    // Log initial stock if > 0
    if (newProduct.stockQuantity > 0) {
      await db.insert(inventoryLogs).values({
        productId: newProduct.id,
        productName: newProduct.name,
        changeType: "initial",
        quantityChange: newProduct.stockQuantity,
        previousStock: 0,
        newStock: newProduct.stockQuantity,
        reason: "Initial product stock opening",
        referenceNumber: newProduct.code,
      });
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
