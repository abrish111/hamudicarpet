import { NextResponse } from "next/server";
import { seedDatabase } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = Boolean(body.force);
    if (force) return NextResponse.json({ success:false, error:"Reset is disabled to protect both stores and imported data." }, {status:400});
    const result = await seedDatabase(force);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/seed:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await seedDatabase(false);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
