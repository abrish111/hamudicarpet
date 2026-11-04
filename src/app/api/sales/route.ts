import { NextResponse } from "next/server";
import { db, sales, saleItems } from "@/db";
import { seedDatabase } from "@/db/seed";
import { eq, desc, and } from "drizzle-orm";
import { getStore, apiError, assertSameOrigin, balance } from "@/lib/store-context";
import { recordTransaction } from "@/lib/transaction-service";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    await seedDatabase(false); const store = await getStore(req); const q = new URL(req.url).searchParams;
    const limit = Math.min(5000, Math.max(1, Number(q.get("limit") || 5000)));
    let rows = await db.select().from(sales).where(eq(sales.storeId, store.id)).orderBy(desc(sales.id)).limit(limit);
    if (q.get("paymentStatus") && q.get("paymentStatus") !== "All") rows = rows.filter(r => r.paymentStatus === q.get("paymentStatus"));
    const search = (q.get("search") || "").toLowerCase();
    if (search) rows = rows.filter(r => [r.invoiceNumber, r.customerName, r.customerPhone].some(v => (v || "").toLowerCase().includes(search)));
    if (q.get("startDate")) rows = rows.filter(r => r.saleDate >= new Date(q.get("startDate")!));
    if (q.get("endDate")) { const end = new Date(q.get("endDate")!); end.setHours(23,59,59,999); rows = rows.filter(r => r.saleDate <= end); }
    return NextResponse.json(rows.map(r => ({ ...r, remainingAmount: balance(r) })));
  } catch(e) { return apiError(e); }
}
export async function POST(req: Request) {
  try { assertSameOrigin(req); const store = await getStore(req); return NextResponse.json(await recordTransaction(store.id, "sale", await req.json()), {status:201}); }
  catch(e) { return apiError(e); }
}
