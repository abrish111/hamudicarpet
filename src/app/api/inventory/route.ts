import { NextResponse } from "next/server";
import { db, products, inventoryLogs } from "@/db";
import { and, desc, eq } from "drizzle-orm";
import { getStore, apiError, assertSameOrigin, ApiError, textValue } from "@/lib/store-context";
export const dynamic="force-dynamic";
export async function GET(req:Request) {
  try { const store=await getStore(req);const logs=new URL(req.url).searchParams.get("mode")==="logs";
    if(logs)return NextResponse.json(await db.select().from(inventoryLogs).where(eq(inventoryLogs.storeId,store.id)).orderBy(desc(inventoryLogs.createdAt)).limit(100));
    return NextResponse.json(await db.select().from(products).where(and(eq(products.storeId,store.id),eq(products.isActive,true))).orderBy(products.name));
  }catch(e){return apiError(e);}
}
export async function POST(req:Request) {
  try {assertSameOrigin(req);const store=await getStore(req);const d=await req.json();const qty=Number(d.quantity); if(!Number.isSafeInteger(qty)||qty<0)throw new ApiError("Enter a non-negative whole quantity");
    if(!["add","subtract","set"].includes(d.type))throw new ApiError("Choose a valid adjustment type");
    const result=await db.transaction(async tx=>{
      const [p]=await tx.select().from(products).where(and(eq(products.storeId,store.id),eq(products.id,Number(d.productId)))).for("update");if(!p)throw new ApiError("Product not found in this store",404);
      const next=d.type==="add"?p.stockQuantity+qty:d.type==="subtract"?p.stockQuantity-qty:qty;if(next<0)throw new ApiError("This adjustment would make stock negative",409);
      const [updated]=await tx.update(products).set({stockQuantity:next,updatedAt:new Date()}).where(and(eq(products.id,p.id),eq(products.storeId,store.id))).returning();
      const [log]=await tx.insert(inventoryLogs).values({storeId:store.id,productId:p.id,productName:p.name,changeType:"adjustment",quantityChange:next-p.stockQuantity,previousStock:p.stockQuantity,newStock:next,reason:textValue(d.reason,1000)||"Stock adjustment",referenceNumber:`ADJ-${Date.now()}`}).returning();
      return {product:updated,log};
    });return NextResponse.json(result);
  }catch(e){return apiError(e);}
}
