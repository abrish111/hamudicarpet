import { NextResponse } from "next/server";
import { db, stores, shopSettings, products, sales, purchases, inventoryLogs, storeConnections, stockTransfers } from "@/db";
import { eq, desc, asc } from "drizzle-orm";
import { apiError, getStore, ensureStores, assertSameOrigin, textValue, ApiError } from "@/lib/store-context";
export const dynamic="force-dynamic";
export async function GET(req:Request) {
  try { await ensureStores(); const store=await getStore(req); const rows=await db.select().from(stores).orderBy(asc(stores.id));
    const catalog=await db.select().from(products);
    const allSales=await db.select().from(sales); const allPurchases=await db.select().from(purchases);
    const connections=await db.select().from(storeConnections);
    const transfers=await db.select().from(stockTransfers).orderBy(desc(stockTransfers.id)).limit(20);
    const summaries=rows.map(s=>{
      const ps=catalog.filter(p=>p.storeId===s.id&&p.isActive);const ss=allSales.filter(r=>r.storeId===s.id);const pp=allPurchases.filter(r=>r.storeId===s.id);
      const c=connections.find(c=>c.storeId===s.id);
      return {...s,totalProducts:ps.length,stockValue:ps.reduce((sum,p)=>sum+p.stockQuantity*Number(p.costPrice),0),lowStockCount:ps.filter(p=>p.stockQuantity<=p.minStockThreshold).length,
        salesCount:ss.length,purchaseCount:pp.length,totalSales:ss.reduce((sum,r)=>sum+Number(r.totalAmount),0),totalPurchases:pp.reduce((sum,r)=>sum+Number(r.totalAmount),0),
        receivable:ss.reduce((sum,r)=>sum+Math.max(0,Number(r.totalAmount)-Number(r.paidAmount)),0),payable:pp.reduce((sum,r)=>sum+Math.max(0,Number(r.totalAmount)-Number(r.paidAmount)),0),
        connection:{status:c?.lastStatus||"not_connected",apiConfigured:!!c?.apiUrl,lastSyncAt:c?.lastSyncAt||null,sourceUrl:c?.sourceUrl||"",lastError:c?.lastError||""}};
    });
    return NextResponse.json({selectedStoreId:store.id,stores:summaries,transfers,sourceReference:"https://v0.app/agabrish976-gmailcoms-projects/chat/carpet-shop-management-app-fax8wI0H7n6"});
  }catch(e){return apiError(e);}
}
export async function PUT(req:Request){
  try {assertSameOrigin(req);const store=await getStore(req);const d=await req.json();const name=textValue(d.name,100);if(!name)throw new ApiError("Enter a store name");
    const row=await db.transaction(async tx=>{const [updated]=await tx.update(stores).set({name,address:textValue(d.address,300)}).where(eq(stores.id,store.id)).returning();await tx.update(shopSettings).set({shopName:name,address:textValue(d.address,300),updatedAt:new Date()}).where(eq(shopSettings.storeId,store.id));return updated;});return NextResponse.json(row);
  }catch(e){return apiError(e);}
}
