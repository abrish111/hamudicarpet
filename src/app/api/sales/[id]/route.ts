import { NextResponse } from "next/server";
import { db, sales, saleItems } from "@/db";
import { and, eq } from "drizzle-orm";
import { getStore, apiError, assertSameOrigin, balance } from "@/lib/store-context";
import { receivePayment, deleteTransaction } from "@/lib/transaction-service";
export const dynamic = "force-dynamic";
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const store = await getStore(req); const { id } = await params;
    const [row] = await db.select().from(sales).where(and(eq(sales.id, Number(id)), eq(sales.storeId, store.id))).limit(1);
    if (!row) return NextResponse.json({error:"Record not found in this store"}, {status:404});
    const lines = await db.select().from(saleItems).where(and(eq(saleItems.saleId, row.id), eq(saleItems.storeId, store.id)));
    return NextResponse.json({...row, remainingAmount:balance(row),items:lines});
  } catch(e) { return apiError(e); }
}
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { assertSameOrigin(req); const store = await getStore(req); const { id } = await params;
    return NextResponse.json(await receivePayment(store.id, "sale", Number(id), await req.json()));
  } catch(e) { return apiError(e); }
}
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { assertSameOrigin(req); const store = await getStore(req); const { id } = await params;
    return NextResponse.json(await deleteTransaction(store.id, "sale", Number(id)));
  } catch(e) { return apiError(e); }
}
