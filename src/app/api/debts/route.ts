import { NextResponse } from "next/server";
import { db, sales, purchases, customers, suppliers } from "@/db";
import { seedDatabase } from "@/db/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await seedDatabase(false);

    const allSales = await db.select().from(sales);
    const allPurchases = await db.select().from(purchases);

    // Receivables: customer debts (sales with remaining balance)
    const receivables = allSales
      .filter((s) => parseFloat(s.totalAmount || "0") - parseFloat(s.paidAmount || "0") > 0.004)
      .map((s) => {
        const total = parseFloat(s.totalAmount || "0");
        const paid = parseFloat(s.paidAmount || "0");
        const remaining = Math.max(0, total - paid);
        return {
          id: s.id,
          reference: s.invoiceNumber,
          partyName: s.customerName,
          partyPhone: s.customerPhone || "",
          date: s.saleDate,
          total: Math.round(total * 100) / 100,
          paid: Math.round(paid * 100) / 100,
          remaining: Math.round(remaining * 100) / 100,
          paymentMethod: s.paymentMethod,
          paymentStatus: remaining >= total - 0.004 ? "Unpaid" : "Partial",
        };
      })
      .sort((a, b) => b.remaining - a.remaining);

    // Payables: supplier credits (purchases with remaining balance)
    const payables = allPurchases
      .filter((p) => parseFloat(p.totalAmount || "0") - parseFloat(p.paidAmount || "0") > 0.004)
      .map((p) => {
        const total = parseFloat(p.totalAmount || "0");
        const paid = parseFloat(p.paidAmount || "0");
        const remaining = Math.max(0, total - paid);
        return {
          id: p.id,
          reference: p.purchaseNumber,
          partyName: p.supplierName,
          date: p.purchaseDate,
          total: Math.round(total * 100) / 100,
          paid: Math.round(paid * 100) / 100,
          remaining: Math.round(remaining * 100) / 100,
          paymentMethod: p.paymentMethod,
          paymentStatus: remaining >= total - 0.004 ? "Unpaid" : "Partial",
        };
      })
      .sort((a, b) => b.remaining - a.remaining);

    const totalReceivable = receivables.reduce((s, r) => s + r.remaining, 0);
    const totalPayable = payables.reduce((s, p) => s + p.remaining, 0);

    // Grouped by customer
    const customerMap = new Map<string, { name: string; phone: string; remaining: number; count: number }>();
    receivables.forEach((r) => {
      const existing = customerMap.get(r.partyName) || { name: r.partyName, phone: r.partyPhone, remaining: 0, count: 0 };
      existing.remaining += r.remaining;
      existing.count += 1;
      customerMap.set(r.partyName, existing);
    });

    // Grouped by supplier
    const supplierMap = new Map<string, { name: string; remaining: number; count: number }>();
    payables.forEach((p) => {
      const existing = supplierMap.get(p.partyName) || { name: p.partyName, remaining: 0, count: 0 };
      existing.remaining += p.remaining;
      existing.count += 1;
      supplierMap.set(p.partyName, existing);
    });

    return NextResponse.json({
      summary: {
        totalReceivable: Math.round(totalReceivable * 100) / 100,
        totalPayable: Math.round(totalPayable * 100) / 100,
        netPosition: Math.round((totalReceivable - totalPayable) * 100) / 100,
        receivableCount: receivables.length,
        payableCount: payables.length,
        debtorCustomers: customerMap.size,
        creditorSuppliers: supplierMap.size,
      },
      receivables,
      payables,
      receivableByCustomer: Array.from(customerMap.values()).map((c) => ({
        ...c,
        remaining: Math.round(c.remaining * 100) / 100,
      })),
      payableBySupplier: Array.from(supplierMap.values()).map((s) => ({
        ...s,
        remaining: Math.round(s.remaining * 100) / 100,
      })),
    });
  } catch (error) {
    console.error("Error in debts API:", error);
    return NextResponse.json({ error: "Failed to load debts and credits" }, { status: 500 });
  }
}

/**
 * Record a payment against a sale (receive from customer) or purchase (pay supplier).
 * Body: { type: "sale" | "purchase", id: number, amount: number, method?: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = body.type;
    const recordId = parseInt(body.id, 10);
    const amount = parseFloat(body.amount || "0");

    if (!recordId || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid record or amount" }, { status: 400 });
    }

    if (type === "sale") {
      const existing = await db.select().from(sales).where(eq(sales.id, recordId)).limit(1);
      if (existing.length === 0) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

      const sale = existing[0];
      const total = parseFloat(sale.totalAmount || "0");
      const alreadyPaid = parseFloat(sale.paidAmount || "0");
      const newPaid = Math.min(total, alreadyPaid + amount);
      const status = newPaid >= total - 0.004 ? "Paid" : newPaid > 0 ? "Partial" : "Unpaid";

      const [updated] = await db.update(sales)
        .set({
          paidAmount: newPaid.toFixed(2),
          paymentStatus: status,
          paymentMethod: body.method || sale.paymentMethod,
        })
        .where(eq(sales.id, recordId))
        .returning();

      return NextResponse.json({
        success: true,
        type: "sale",
        record: updated,
        received: Math.round(amount * 100) / 100,
        remaining: Math.round(Math.max(0, total - newPaid) * 100) / 100,
      });
    }

    if (type === "purchase") {
      const existing = await db.select().from(purchases).where(eq(purchases.id, recordId)).limit(1);
      if (existing.length === 0) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

      const purchase = existing[0];
      const total = parseFloat(purchase.totalAmount || "0");
      const alreadyPaid = parseFloat(purchase.paidAmount || "0");
      const newPaid = Math.min(total, alreadyPaid + amount);
      const status = newPaid >= total - 0.004 ? "Paid" : newPaid > 0 ? "Partial" : "Unpaid";

      const [updated] = await db.update(purchases)
        .set({
          paidAmount: newPaid.toFixed(2),
          paymentStatus: status,
          paymentMethod: body.method || purchase.paymentMethod,
        })
        .where(eq(purchases.id, recordId))
        .returning();

      return NextResponse.json({
        success: true,
        type: "purchase",
        record: updated,
        paid: Math.round(amount * 100) / 100,
        remaining: Math.round(Math.max(0, total - newPaid) * 100) / 100,
      });
    }

    return NextResponse.json({ error: "Invalid type. Use 'sale' or 'purchase'." }, { status: 400 });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
