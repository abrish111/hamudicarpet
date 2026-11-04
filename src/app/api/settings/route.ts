import { NextResponse } from "next/server";
import { db, shopSettings, stores, sales, purchases } from "@/db";
import { eq, and, ne } from "drizzle-orm";
import { getStore, apiError, assertSameOrigin, ApiError, textValue } from "@/lib/store-context";
export const dynamic="force-dynamic";
export async function GET(req:Request) {
  try {const store=await getStore(req);const [row]=await db.select().from(shopSettings).where(eq(shopSettings.storeId,store.id)).limit(1);
    return NextResponse.json(row || {storeId:store.id,shopName:store.name,currency:store.currency,taxRate:"0.00"});
  }catch(e){return apiError(e);}
}
export async function PUT(req:Request) {
  try {assertSameOrigin(req);const store=await getStore(req);const d=await req.json();if(!textValue(d.shopName,100))throw new ApiError("Enter a shop name");
    const currency=["ETB ","$"].includes(d.currency)?d.currency:store.currency;
    if(currency!==store.currency){const [sale]=await db.select({id:sales.id}).from(sales).where(and(eq(sales.storeId,store.id),ne(sales.currency,currency))).limit(1);const [purchase]=await db.select({id:purchases.id}).from(purchases).where(and(eq(purchases.storeId,store.id),ne(purchases.currency,currency))).limit(1);if(sale||purchase)throw new ApiError("This store already has transactions in another currency. Amounts are never converted; use a separate store for the other currency.",409);}
    const values={shopName:textValue(d.shopName,100),phone:textValue(d.phone,60),email:textValue(d.email,200),address:textValue(d.address,300),taxRate:"0.00",currency,invoicePrefix:textValue(d.invoicePrefix,40)||"HC-INV-",purchasePrefix:textValue(d.purchasePrefix,40)||"HC-PO-",footerNote:textValue(d.footerNote,1000),updatedAt:new Date()};
    const [row]=await db.insert(shopSettings).values({storeId:store.id,...values}).onConflictDoUpdate({target:shopSettings.storeId,set:values}).returning();
    await db.update(stores).set({name:row.shopName,currency,address:row.address}).where(eq(stores.id,store.id));
    return NextResponse.json(row);
  }catch(e){return apiError(e);}
}
