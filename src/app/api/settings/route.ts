import { NextResponse } from "next/server";
import { db, shopSettings } from "@/db";
import { seedDatabase } from "@/db/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await seedDatabase(false);
    const settings = await db.select().from(shopSettings).limit(1);
    if (settings.length === 0) {
      const [newSetting] = await db.insert(shopSettings).values({
        shopName: "Hamudi Carpet",
        currency: "ETB",
        taxRate: "0.00",
      }).returning();
      return NextResponse.json(newSetting);
    }
    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const existing = await db.select().from(shopSettings).limit(1);

    if (existing.length === 0) {
      const [inserted] = await db.insert(shopSettings).values({
        shopName: data.shopName || "Hamudi Carpet",
        phone: data.phone,
        email: data.email,
        address: data.address,
        taxRate: "0.00",
        currency: data.currency || "ETB",
        invoicePrefix: data.invoicePrefix || "HC-INV-",
        purchasePrefix: data.purchasePrefix || "HC-PO-",
        footerNote: data.footerNote,
      }).returning();
      return NextResponse.json(inserted);
    }

    const [updated] = await db.update(shopSettings)
      .set({
        shopName: data.shopName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        taxRate: "0.00",
        currency: data.currency ?? "ETB",
        invoicePrefix: data.invoicePrefix ?? "HC-INV-",
        purchasePrefix: data.purchasePrefix ?? "HC-PO-",
        footerNote: data.footerNote,
        updatedAt: new Date(),
      })
      .where(eq(shopSettings.id, existing[0].id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
