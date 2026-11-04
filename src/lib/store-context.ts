import { db, stores, shopSettings, products } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("API request failed", error);
  return NextResponse.json({ error: "The request could not be completed. Please try again." }, { status: 500 });
}

export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== (req.headers.get("x-forwarded-host")?.split(",")[0].trim() || req.headers.get("host") || new URL(req.url).host)) {
    throw new ApiError("Cross-origin requests are not allowed", 403);
  }
}

let initialization: Promise<void> | undefined;
export async function ensureStores() {
  if (!initialization) initialization = initialize().catch(error => { initialization = undefined; throw error; });
  await initialization;
}
async function initialize() {
  await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(5627421)`);
    await tx.insert(stores).values([
      { id: 1, code: "STORE-1", name: "Hamudi Carpet — Store 1", currency: "ETB " },
      { id: 2, code: "STORE-2", name: "Carpet Shop — Store 2", currency: "ETB " },
    ]).onConflictDoNothing();
    await tx.execute(sql`select setval(pg_get_serial_sequence('stores','id'), greatest((select max(id) from stores),1))`);
    const original = await tx.select().from(shopSettings).where(eq(shopSettings.storeId, 1)).limit(1);
    for (const id of [1, 2]) {
      const row = await tx.select().from(stores).where(eq(stores.id, id));
      const [settings] = await tx.select().from(shopSettings).where(eq(shopSettings.storeId, id));
      if (!settings) {
        await tx.insert(shopSettings).values({
          storeId: id, shopName: id === 1 ? (original[0]?.shopName || "Hamudi Carpet") : row[0].name,
          currency: id === 1 ? (original[0]?.currency || "ETB ") : "ETB ",
          phone: id === 1 ? original[0]?.phone : "", email: id === 1 ? original[0]?.email : "",
          address: id === 1 ? original[0]?.address : "", taxRate: "0.00",
        }).onConflictDoNothing();
      }
      if (id === 2) {
        const [existing] = await tx.select({ id: products.id }).from(products).where(eq(products.storeId, id)).limit(1);
        if (!existing) {
          const catalog = await tx.select().from(products).where(eq(products.storeId, 1));
          if (catalog.length) await tx.insert(products).values(catalog.map(({ id, storeId, createdAt, updatedAt, stockQuantity, ...p }) => ({
            ...p, storeId: 2, stockQuantity: 0,
          }))).onConflictDoNothing();
        }
      }
    }
  });
}

export async function getStore(req: Request) {
  await ensureStores();
  const cookie = req.headers.get("cookie")?.split(";").map(c => c.trim()).find(c => c.startsWith("hc-store="))?.split("=")[1];
  const selected = Number(req.headers.get("x-store-id") || cookie || "1");
  if (!Number.isInteger(selected) || selected < 1) throw new ApiError("Select a store before continuing", 400);
  const [store] = await db.select().from(stores).where(and(eq(stores.id, selected), eq(stores.isActive, true))).limit(1);
  if (!store) throw new ApiError("This store is unavailable", 404);
  return store;
}

export function storeFilter(table: { storeId: typeof products.storeId }, storeId: number) { return eq(table.storeId, storeId); }
export function money(value: unknown, fallback = 0) {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n) || n < 0 || n > 1e10) throw new ApiError("Enter a valid non-negative amount");
  return Math.round(n * 100) / 100;
}
export function quantity(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 1000000) throw new ApiError("Quantity must be a positive number");
  return Math.round(n * 1000) / 1000;
}
export function payment(total: number, paid: number) {
  if (paid > total) throw new ApiError("Payment cannot exceed the total");
  return paid >= total ? "Paid" : paid > 0 ? "Partial" : "Unpaid";
}
export function dateValue(value: unknown) {
  if (!value) return new Date();
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) throw new ApiError("Enter a valid date");
  return date;
}
export function textValue(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
export function balance(row: { totalAmount: string; paidAmount: string }) {
  return Math.max(0, Math.round((Number(row.totalAmount) - Number(row.paidAmount)) * 100) / 100);
}
