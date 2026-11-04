import { NextResponse } from "next/server";
import { db, suppliers } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db.select().from(suppliers).orderBy(suppliers.name);
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [created] = await db.insert(suppliers).values({
      name: data.name.trim(),
      companyName: data.companyName || data.name.trim(),
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      notes: data.notes || "",
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
