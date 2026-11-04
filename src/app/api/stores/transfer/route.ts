import { NextResponse } from "next/server";
import { db, products, stores, inventoryLogs, stockTransfers } from "@/db";
import { and,eq,inArray } from "drizzle-orm";
import { apiError,getStore,assertSameOrigin,ApiError,quantity,textValue } from "@/lib/store-context";
import { randomUUID } from "node:crypto";
export async function POST(req:Request){
  try {assertSameOrigin(req);const source=await getStore(req);const body=await req.json();const destination=Number(body.toStoreId);const qty=quantity(body.quantity);
    if(destination===source.id)throw new ApiError("Choose a different destination store");
    const [target]=await db.select().from(stores).where(eq(stores.id,destination)).limit(1);if(!target?.isActive)throw new ApiError("Destination store is unavailable",404);
    const result=await db.transaction(async tx=>{
      const [p]=await tx.select().from(products).where(and(eq(products.storeId,source.id),eq(products.id,Number(body.productId)),eq(products.isActive,true))).for("update");if(!p)throw new ApiError("Product not found in the sending store",404);
      if(p.stockQuantity<qty)throw new ApiError(`Only ${p.stockQuantity} ${p.unit} available to transfer`,409);
      let [dest]=await tx.select().from(products).where(and(eq(products.storeId,destination),eq(products.code,p.code))).for("update");
      if(!dest){const {id,storeId,stockQuantity,createdAt,updatedAt,...values}=p;[dest]=await tx.insert(products).values({...values,storeId:destination,stockQuantity:0}).returning();}
      if(dest.unit!==p.unit)throw new ApiError("The destination product must use the same unit. Edit its catalog before transferring.",409);
      const reference=`TR-${randomUUID().slice(0,8).toUpperCase()}`;
      const [transfer]=await tx.insert(stockTransfers).values({fromStoreId:source.id,toStoreId:destination,fromProductId:p.id,toProductId:dest.id,productCode:p.code,quantity:qty,reference,note:textValue(body.note,500)}).returning();
      await tx.update(products).set({stockQuantity:p.stockQuantity-qty,updatedAt:new Date()}).where(eq(products.id,p.id));
      await tx.update(products).set({stockQuantity:dest.stockQuantity+qty,isActive:true,updatedAt:new Date()}).where(eq(products.id,dest.id));
      await tx.insert(inventoryLogs).values([{storeId:source.id,productId:p.id,productName:p.name,changeType:"transfer_out",quantityChange:-qty,previousStock:p.stockQuantity,newStock:p.stockQuantity-qty,referenceNumber:reference,reason:`Stock transfer to ${target.name}`},{storeId:destination,productId:dest.id,productName:dest.name,changeType:"transfer_in",quantityChange:qty,previousStock:dest.stockQuantity,newStock:dest.stockQuantity+qty,referenceNumber:reference,reason:`Stock transfer from ${source.name}`}]);
      return transfer;
    });return NextResponse.json(result,{status:201});
  }catch(e){return apiError(e);}
}
