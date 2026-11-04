import { NextResponse } from "next/server";
import { db, products, inventoryLogs } from "@/db";
import { and, eq } from "drizzle-orm";
import { getStore, apiError, assertSameOrigin, ApiError, money, textValue } from "@/lib/store-context";
export const dynamic="force-dynamic";
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}) {
  try {const store=await getStore(req); const {id}=await params; const [row]=await db.select().from(products).where(and(eq(products.storeId,store.id),eq(products.id,Number(id)))).limit(1);if(!row)throw new ApiError("Product not found",404);return NextResponse.json(row);}catch(e){return apiError(e);}
}
export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}) {
  try { assertSameOrigin(req);const store=await getStore(req);const {id}=await params;const body=await req.json();
    const result=await db.transaction(async tx=>{
      const [p]=await tx.select().from(products).where(and(eq(products.storeId,store.id),eq(products.id,Number(id)))).for("update");if(!p)throw new ApiError("Product not found",404);
      const stock=body.stockQuantity!==undefined?Number(body.stockQuantity):p.stockQuantity;if(!Number.isSafeInteger(stock)||stock<0)throw new ApiError("Invalid stock quantity");
      const code=body.code!==undefined?textValue(body.code,40).toUpperCase():p.code;
      if(!code)throw new ApiError("Product code is required");
      const [other]=await tx.select({id:products.id}).from(products).where(and(eq(products.storeId,store.id),eq(products.code,code))).limit(1);
      if(other&&other.id!==p.id)throw new ApiError("This code is already used by another product",409);
      const [updated]=await tx.update(products).set({code,name:body.name!==undefined?textValue(body.name,200):p.name,category:body.category!==undefined?textValue(body.category,100):p.category,unit:body.unit!==undefined?textValue(body.unit,30):p.unit,dimensions:body.dimensions!==undefined?textValue(body.dimensions):p.dimensions,costPrice:money(body.costPrice??p.costPrice).toFixed(2),sellingPrice:money(body.sellingPrice??p.sellingPrice).toFixed(2),stockQuantity:stock,minStockThreshold:Math.max(0,Number(body.minStockThreshold??p.minStockThreshold)),description:body.description!==undefined?textValue(body.description,1000):p.description,imageUrl:body.imageUrl!==undefined?textValue(body.imageUrl,1000):p.imageUrl,updatedAt:new Date()}).where(and(eq(products.id,p.id),eq(products.storeId,store.id))).returning();
      if(stock!==p.stockQuantity)await tx.insert(inventoryLogs).values({storeId:store.id,productId:p.id,productName:p.name,changeType:"adjustment",quantityChange:stock-p.stockQuantity,previousStock:p.stockQuantity,newStock:stock,reason:textValue(body.adjustmentReason,1000)||"Manual stock adjustment",referenceNumber:code});
      return updated;
    });return NextResponse.json(result);
  } catch(e){return apiError(e);}
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}) {
  try {assertSameOrigin(req);const store=await getStore(req);const {id}=await params;const [p]=await db.update(products).set({isActive:false,updatedAt:new Date()}).where(and(eq(products.storeId,store.id),eq(products.id,Number(id)))).returning();if(!p)throw new ApiError("Product not found",404);return NextResponse.json({success:true,message:"Product archived. Historical invoices are preserved."});}catch(e){return apiError(e);}
}
