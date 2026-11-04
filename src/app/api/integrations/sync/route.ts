import {NextResponse} from "next/server";
import {db,storeConnections} from "@/db";
import {eq} from "drizzle-orm";
import {apiError,getStore,assertSameOrigin,ApiError} from "@/lib/store-context";
import {validateApiUrl,importSnapshot} from "@/lib/integration-data";
export async function POST(req:Request){try{assertSameOrigin(req);const store=await getStore(req);const [connection]=await db.select().from(storeConnections).where(eq(storeConnections.storeId,store.id)).limit(1);if(!connection?.apiUrl)throw new ApiError("Save an API endpoint first",400);const url=await validateApiUrl(connection.apiUrl);const token=connection.tokenEnvName?process.env[connection.tokenEnvName]:undefined;
 const response=await fetch(url,{headers:{Accept:"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},signal:AbortSignal.timeout(15000),redirect:"error",cache:"no-store"});
 if(!response.ok||!response.headers.get("content-type")?.includes("json"))throw new ApiError("This endpoint did not provide an accessible JSON snapshot",502);
 if(Number(response.headers.get("content-length")||0)>2*1024*1024)throw new ApiError("The remote snapshot is too large",413);
 const text=await response.text();if(text.length>2*1024*1024)throw new ApiError("The snapshot exceeds the 2 MB limit",413);
 const result=await importSnapshot(store.id,JSON.parse(text),"API import");
 await db.update(storeConnections).set({lastStatus:"imported",lastSyncAt:new Date(),lastError:null}).where(eq(storeConnections.storeId,store.id));return NextResponse.json(result);
 }catch(e){try{const store=await getStore(req);await db.update(storeConnections).set({lastStatus:"error",lastError:e instanceof ApiError?e.message:"The source API could not be reached or returned invalid data"}).where(eq(storeConnections.storeId,store.id));}catch{}return apiError(e);}}
