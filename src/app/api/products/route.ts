import { NextResponse } from "next/server";
import { db, products, inventoryLogs } from "@/db";
import { and, eq, asc } from "drizzle-orm";
import { getStore, apiError, assertSameOrigin, ApiError, money, textValue, quantity } from "@/lib/store-context";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try { const store = await getStore(req); const q = new URL(req.url).searchParams;
    let rows = await db.select().from(products).where(and(eq(products.storeId, store.id), eq(products.isActive, true))).orderBy(asc(products.id));
    if (q.get("category") && q.get("category") !== "All") rows = rows.filter(p => p.category === q.get("category"));
    if (q.get("search")) { const s=q.get("search")!.toLowerCase(); rows=rows.filter(p => [p.name,p.code,p.dimensions,p.category].some(v => (v||"").toLowerCase().includes(s))); }
    return NextResponse.json(rows);
  } catch(e) { return apiError(e); }
}
export async function POST(req: Request) {
  try { assertSameOrigin(req); const store=await getStore(req); const d=await req.json();
    const code=textValue(d.code,40).toUpperCase(), name=textValue(d.name,200);
    if (!code || !name) throw new ApiError("Product name and code are required");
    const stock=Number(d.stockQuantity || 0); if(!Number.isSafeInteger(stock)||stock<0)throw new ApiError("Stock must be a non-negative integer");
    const existing=await db.select({id:products.id}).from(products).where(and(eq(products.storeId,store.id),eq(products.code,code))).limit(1);
    if(existing.length)throw new ApiError("This product code already exists in this store",409);
    const result=await db.transaction(async tx=>{
      const [p]=await tx.insert(products).values({storeId:store.id,code,name,category:textValue(d.category,100)||"Readymade Carpet",unit:textValue(d.unit,30)||"pcs",dimensions:textValue(d.dimensions),costPrice:money(d.costPrice).toFixed(2),sellingPrice:money(d.sellingPrice).toFixed(2),stockQuantity:stock,minStockThreshold:Math.max(0,Number(d.minStockThreshold)||5),description:textValue(d.description,1000),imageUrl:textValue(d.imageUrl,1000)}).returning();
      if(stock>0)await tx.insert(inventoryLogs).values({storeId:store.id,productId:p.id,productName:p.name,changeType:"initial",quantityChange:stock,previousStock:0,newStock:stock,reason:"Opening stock",referenceNumber:p.code});
      return p;
    }); return NextResponse.json(result,{status:201});
  } catch(e) {return apiError(e);}
}
