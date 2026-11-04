import { NextResponse } from "next/server";
import { db, stores } from "@/db";
import { eq } from "drizzle-orm";
import { apiError, assertSameOrigin, ApiError } from "@/lib/store-context";
export async function POST(req:Request){
  try {assertSameOrigin(req);const body=await req.json();const id=Number(body.storeId);const [store]=await db.select().from(stores).where(eq(stores.id,id)).limit(1);if(!store?.isActive)throw new ApiError("Select a valid store",404);
    const result=NextResponse.json({storeId:store.id});
    result.cookies.set("hc-store",String(store.id),{httpOnly:true,sameSite:"lax",secure:new URL(req.url).protocol==="https:",path:"/",maxAge:60*60*24*365});
    return result;
  }catch(e){return apiError(e);}
}
