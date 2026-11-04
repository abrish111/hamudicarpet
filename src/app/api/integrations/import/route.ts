import {NextResponse} from "next/server";
import {apiError,getStore,assertSameOrigin,ApiError} from "@/lib/store-context";
import {parseImportFile,importSnapshot} from "@/lib/integration-data";
export async function POST(req:Request){try{assertSameOrigin(req);const store=await getStore(req);if(Number(req.headers.get("content-length")||0)>11*1024*1024)throw new ApiError("Maximum upload size is 10 MB",413);const form=await req.formData();const file=form.get("file");if(!(file instanceof File))throw new ApiError("Choose an Excel, CSV or JSON file");const buffer=Buffer.from(await file.arrayBuffer());const data=parseImportFile(buffer,file.name);return NextResponse.json(await importSnapshot(store.id,data,file.name));}catch(e){return apiError(e);}}
