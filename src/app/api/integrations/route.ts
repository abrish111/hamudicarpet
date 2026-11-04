import { NextResponse } from "next/server";
import { db,storeConnections } from "@/db";
import {eq} from "drizzle-orm";
import {apiError,getStore,assertSameOrigin,ApiError,textValue} from "@/lib/store-context";
import {validateApiUrl} from "@/lib/integration-data";
export const dynamic="force-dynamic";
const reference="https://v0.app/agabrish976-gmailcoms-projects/chat/carpet-shop-management-app-fax8wI0H7n6";
export async function GET(req:Request){try{const store=await getStore(req);const [connection]=await db.select().from(storeConnections).where(eq(storeConnections.storeId,store.id)).limit(1);return NextResponse.json({connection:connection||null,sourceReference:reference,tokenEnvName:`STORE_${store.id}_API_TOKEN`,tokenConfigured:!!process.env[`STORE_${store.id}_API_TOKEN`],mode:"manual_import"});}catch(e){return apiError(e);}}
export async function PUT(req:Request){try{assertSameOrigin(req);const store=await getStore(req);const d=await req.json();if(!d.apiUrl)throw new ApiError("Enter the public data API URL, not the v0 chat link.");const url=await validateApiUrl(textValue(d.apiUrl,2048));const tokenEnvName=`STORE_${store.id}_API_TOKEN`;const values={storeId:store.id,name:textValue(d.name,100)||"Other carpet app",sourceUrl:reference,apiUrl:url,tokenEnvName,lastStatus:"not_connected",lastError:null};const [row]=await db.insert(storeConnections).values(values).onConflictDoUpdate({target:storeConnections.storeId,set:values}).returning();return NextResponse.json(row);}catch(e){return apiError(e);}}
