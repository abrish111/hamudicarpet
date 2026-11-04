import { db, sales, saleItems, purchases, purchaseItems, products, inventoryLogs, customers, suppliers, shopSettings } from "@/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { ApiError, dateValue, money, payment, quantity, textValue } from "./store-context";

type Store = typeof shopSettings.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type InvoiceInput = Record<string, any>;

async function contact(tx: Tx, storeId: number, table: typeof customers | typeof suppliers, suppliedId: unknown) {
  if (suppliedId == null || suppliedId === "") return null;
  const id = Number(suppliedId);
  if (!Number.isSafeInteger(id)) throw new ApiError("Invalid contact");
  const [row] = await tx.select().from(table).where(and(eq(table.id, id), eq(table.storeId, storeId))).limit(1);
  if (!row) throw new ApiError("Select a contact from this store", 404);
  return row;
}

async function reserveItems(tx: Tx, storeId: number, data: InvoiceInput, kind: "sale" | "purchase", reference: string) {
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > 100) throw new ApiError("Add between 1 and 100 products");
  const qtyById = new Map<number, number>();
  for (const i of data.items) {
    const id = Number(i.productId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError("Select a valid product");
    if(qtyById.has(id))throw new ApiError("Combine duplicate product lines before saving this invoice");
    qtyById.set(id, quantity(i.quantity));
  }
  const rows = await tx.select().from(products).where(and(eq(products.storeId, storeId), inArray(products.id, [...qtyById.keys()]))).orderBy(products.id).for("update");
  if (rows.length !== qtyById.size) throw new ApiError("A product does not belong to this store", 404);
  const items = rows.map(p => {
    const qty = qtyById.get(p.id)!;
    const original = data.items.find((i: any) => Number(i.productId) === p.id);
    const unitPrice = kind === "sale" ? money(original.unitPrice ?? p.sellingPrice) : money(original.unitCost ?? p.costPrice);
    const newStock = p.stockQuantity + (kind === "sale" ? -qty : qty);
    if (newStock < 0) throw new ApiError(`${p.name}: only ${p.stockQuantity} ${p.unit} in stock.`, 409);
    return { product: p, qty, unitPrice, newStock };
  });
  for (const item of items) {
    await tx.update(products).set({ stockQuantity: item.newStock, ...(kind === "purchase" ? { costPrice: String(item.unitPrice) } : {}), updatedAt: new Date() }).where(and(eq(products.id, item.product.id), eq(products.storeId, storeId)));
    await tx.insert(inventoryLogs).values({ storeId, productId: item.product.id, productName: item.product.name, changeType: kind, quantityChange: kind === "sale" ? -item.qty : item.qty, previousStock: item.product.stockQuantity, newStock: item.newStock, reason: `${kind === "sale" ? "Sale" : "Purchase"} ${reference}`, referenceNumber: reference });
  }
  return items;
}

export async function recordTransaction(storeId: number, type: "sale" | "purchase", data: InvoiceInput) {
  const kind = type;
  return db.transaction(async tx => {
    const [setting] = await tx.select().from(shopSettings).where(eq(shopSettings.storeId, storeId)).limit(1);
    const currency = setting?.currency || "ETB ";
    const number = textValue(type === "sale" ? data.invoiceNumber : data.purchaseNumber, 80) || `${type === "sale" ? setting?.invoicePrefix || "HC-INV-" : setting?.purchasePrefix || "HC-PO-"}${Date.now().toString(36).toUpperCase()}`;
    const table = type === "sale" ? sales : purchases;
    const where = and(eq(table.storeId, storeId), eq(type === "sale" ? sales.invoiceNumber : purchases.purchaseNumber, number));
    const duplicate = await tx.select({ id: table.id }).from(table).where(where).limit(1);
    if (duplicate.length) throw new ApiError("This invoice / PO number is already used in this store. Choose another number or reopen the existing record.", 409);
    const customer = await contact(tx, storeId, customers, data.customerId);
    const supplier = await contact(tx, storeId, suppliers, data.supplierId);
    const items = await reserveItems(tx, storeId, data, kind, number);
    const subtotal = Math.round(items.reduce((s, i) => s + i.qty * i.unitPrice, 0) * 100) / 100;
    const totalCost = Math.round(items.reduce((s, i) => s + i.qty * Number(i.product.costPrice), 0) * 100) / 100;
    const discount = type === "sale" ? money(data.discount) : 0;
    if (discount > subtotal) throw new ApiError("Discount cannot exceed the subtotal");
    const total = Math.round((subtotal - discount) * 100) / 100;
    const paid = data.paidAmount === undefined ? (data.paymentStatus === "Unpaid" ? 0 : total) : money(data.paidAmount);
    const common = { storeId, currency, subtotal: subtotal.toFixed(2), tax: "0.00", totalAmount: total.toFixed(2), paidAmount: paid.toFixed(2), paymentStatus: payment(total, paid), paymentMethod: textValue(data.paymentMethod, 40) || (type === "sale" ? "Cash" : "Bank Transfer"), notes: textValue(data.notes, 1000) };
    if (type === "sale") {
      const [sale] = await tx.insert(sales).values({ ...common, invoiceNumber: number, customerId: customer?.id ?? null, customerName: customer?.name || textValue(data.customerName, 200) || "Walk-in Customer", customerPhone: textValue(data.customerPhone || customer?.phone, 60), supplierId: supplier?.id ?? null, supplierName: supplier?.name || textValue(data.supplierName, 200), totalCost: totalCost.toFixed(2), discount: discount.toFixed(2), saleDate: dateValue(data.saleDate) }).returning();
      const saved = await tx.insert(saleItems).values(items.map(i => ({ storeId, saleId: sale.id, productId: i.product.id, productName: i.product.name, unit: i.product.unit, dimensions: i.product.dimensions, quantity: i.qty, unitPrice: i.unitPrice.toFixed(2), unitCost: i.product.costPrice, totalPrice: (i.qty * i.unitPrice).toFixed(2) }))).returning();
      return { ...sale, items: saved, remainingAmount: Math.max(0, total - paid) };
    }
    const [purchase] = await tx.insert(purchases).values({ ...common, purchaseNumber: number, supplierId: supplier?.id ?? null, supplierName: supplier?.name || textValue(data.supplierName, 200) || "General Supplier", customerId: customer?.id ?? null, customerName: customer?.name || textValue(data.customerName, 200), shippingFee: "0.00", purchaseDate: dateValue(data.purchaseDate) }).returning();
    const saved = await tx.insert(purchaseItems).values(items.map(i => ({ storeId, purchaseId: purchase.id, productId: i.product.id, productName: i.product.name, unit: i.product.unit, dimensions: i.product.dimensions, quantity: i.qty, unitCost: i.unitPrice.toFixed(2), totalPrice: (i.qty * i.unitPrice).toFixed(2) }))).returning();
    return { ...purchase, items: saved, remainingAmount: Math.max(0, total - paid) };
  });
}

export async function receivePayment(storeId: number, type: "sale" | "purchase", id: number, body: InvoiceInput) {
  const table = type === "sale" ? sales : purchases;
  return db.transaction(async tx => {
    const [record] = await tx.select().from(table).where(and(eq(table.id, id), eq(table.storeId, storeId))).for("update");
    if (!record) throw new ApiError("Invoice / purchase not found in this store", 404);
    const total = Number(record.totalAmount);
    const paid = body.amount !== undefined ? money(Number(record.paidAmount) + money(body.amount)) : money(body.paidAmount);
    if (paid > total) throw new ApiError("Payment cannot exceed the invoice total");
    if (paid < Number(record.paidAmount)) throw new ApiError("A payment cannot reduce the recorded amount. Enter a new payment instead.");
    const [updated] = await tx.update(table).set({ paidAmount: paid.toFixed(2), paymentStatus: payment(total, paid), paymentMethod: textValue(body.paymentMethod, 40) || record.paymentMethod, ...(body.notes !== undefined ? { notes: textValue(body.notes, 1000) } : {}) }).where(and(eq(table.id, id), eq(table.storeId, storeId))).returning();
    return { ...updated, remainingAmount: Math.max(0, total - paid) };
  });
}

export async function deleteTransaction(storeId: number, type: "sale" | "purchase", id: number) {
  return db.transaction(async tx => {
    const table = type === "sale" ? sales : purchases;
    const itemsTable = type === "sale" ? saleItems : purchaseItems;
    const [record] = await tx.select().from(table).where(and(eq(table.id, id), eq(table.storeId, storeId))).for("update");
    if (!record) throw new ApiError("Not found in this store", 404);
    const lines = await tx.select().from(itemsTable).where(and(eq(itemsTable.storeId, storeId), eq(type === "sale" ? saleItems.saleId : purchaseItems.purchaseId, id)));
    const ids = [...new Set(lines.map(l => l.productId))];
    const stock = await tx.select().from(products).where(and(eq(products.storeId, storeId), inArray(products.id, ids))).orderBy(products.id).for("update");
    for (const row of lines) {
      const product = stock.find(p => p.id === row.productId);
      if (!product) continue;
      const delta = type === "sale" ? row.quantity : -row.quantity;
      const newStock = product.stockQuantity + delta;
      if (newStock < 0) throw new ApiError("Cannot void this purchase: its stock has already been sold. Correct the stock before deleting.", 409);
      await tx.update(products).set({ stockQuantity: newStock }).where(and(eq(products.id, product.id), eq(products.storeId, storeId)));
      product.stockQuantity = newStock;
      await tx.insert(inventoryLogs).values({ storeId, productId: product.id, productName: product.name, changeType: "void", quantityChange: delta, previousStock: product.stockQuantity - delta, newStock, reason: "Voided transaction", referenceNumber: type === "sale" ? (record as typeof sales.$inferSelect).invoiceNumber : (record as typeof purchases.$inferSelect).purchaseNumber });
    }
    await tx.delete(itemsTable).where(and(eq(itemsTable.storeId, storeId), eq(type === "sale" ? saleItems.saleId : purchaseItems.purchaseId, id)));
    await tx.delete(table).where(and(eq(table.id, id), eq(table.storeId, storeId)));
    return { success: true };
  });
}
