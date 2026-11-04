import { NextResponse } from "next/server";
import { db, suppliers } from "@/db";
import { eq, asc } from "drizzle-orm";
import { getStore, apiError, assertSameOrigin, textValue, ApiError } from "@/lib/store-context";
export const dynamic="force-dynamic";
export async function GET(req:Request) {
  try {const store=await getStore(req);return NextResponse.json(await db.select().from(suppliers).where(eq(suppliers.storeId,store.id)).orderBy(asc(suppliers.name)));}catch(e){return apiError(e);}
}
export async function POST(req:Request) {
  try {assertSameOrigin(req);const store=await getStore(req);const d=await req.json();const name=textValue(d.name,200);if(!name)throw new ApiError("Enter a contact name");
    const [row]=await db.insert(suppliers).values({storeId:store.id,name,companyName:textValue(d.companyName,200), phone:textValue(d.phone,60),email:textValue(d.email,200),address:textValue(d.address,300),notes:textValue(d.notes,1000)}).returning();return NextResponse.json(row,{status:201});
  }catch(e){return apiError(e);}
}
