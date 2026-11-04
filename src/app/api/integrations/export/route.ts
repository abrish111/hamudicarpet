import { NextResponse } from "next/server";
import {getStore,apiError} from "@/lib/store-context";
import {exportSnapshot} from "@/lib/integration-data";
export const dynamic="force-dynamic";
export async function GET(req:Request){try{const store=await getStore(req);const snapshot=await exportSnapshot(store.id);return new NextResponse(JSON.stringify(snapshot),{headers:{"Content-Type":"application/json","Content-Disposition":`attachment; filename="store-${store.id}-export.json"`}});}catch(e){return apiError(e);}}
