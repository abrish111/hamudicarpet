import { db, stores, products, customers, suppliers, sales, purchases, saleItems, purchaseItems, inventoryLogs, integrationImports, storeConnections } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { ApiError, textValue, money, payment, dateValue } from "./store-context";
import * as XLSX from "xlsx";

type Row = Record<string, any>;
const n=(v:any, fallback=0)=>{if(v===undefined||v===null||v==="")return fallback;const val=Number(v);if(!Number.isFinite(val))throw new ApiError("A numeric field contains an invalid value");return Math.round(val*100)/100;};
const text=(v:any)=>String(v??"").trim();
const normalizeKey=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]/g,"");
const get=(row:Row,...keys:string[])=>{ const map=Object.fromEntries(Object.entries(row).map(([k,v])=>[normalizeKey(k),v]));for(const key of keys){const val=map[normalizeKey(key)];if(val!==undefined&&val!==null&&val!=="")return val;}return undefined; };
const key=(row:Row,...keys:string[])=>text(get(row,...keys));
const numeric=(row:Row,...keys:string[])=>n(get(row,...keys));
const list=(obj:any):Row[]=>Array.isArray(obj)?obj.filter(r=>r&&typeof r==="object") : [];
const cents=(v:number)=>v.toFixed(2);

export function normalizeSnapshot(input:unknown) {
  if(!input||typeof input!=="object"||Array.isArray(input))throw new ApiError("Upload a JSON object, or an Excel workbook with Products, Sales and Purchases sheets.");
  let data:Row=input as Row; if(data.data&&typeof data.data==="object")data=data.data;
  const products=list(get(data,"products","catalog")),customers=list(get(data,"customers")),suppliers=list(get(data,"suppliers"));
  const sales=list(get(data,"sales","invoices")),purchases=list(get(data,"purchases","purchaseOrders"));
  if(products.length+customers.length+suppliers.length+sales.length+purchases.length===0)throw new ApiError("No records found. Use the downloadable template with Products, Customers, Suppliers, Sales and Purchases sheets.");
  if(products.length+customers.length+suppliers.length+sales.length+purchases.length>10000)throw new ApiError("Import up to 10,000 records at a time.");
  const seen=new Set<string>();
  return {version:1,products:products.map((r,i)=>{
    const name=key(r,"name","productName","itemName");const code=key(r,"code","sku","productCode");if(!name)throw new ApiError(`Product row ${i+1} needs a name`);
    const c=code||name.toUpperCase().replace(/[^A-Z0-9]+/g,"-").slice(0,40);if(seen.has(c.toLowerCase()))throw new ApiError(`Duplicate product code: ${c}`);seen.add(c.toLowerCase());
    const stock=numeric(r,"stockQuantity","stock","quantity","Stock","In Stock");if(stock<0||!Number.isInteger(stock))throw new ApiError(`Invalid stock for ${name}`);
    return {code:c.slice(0,40),name:name.slice(0,200),category:key(r,"category")||"Readymade Carpet",unit:key(r,"unit")||"pcs",dimensions:key(r,"dimensions","size")||"",costPrice:cents(Math.max(0,numeric(r,"costPrice","cost","unitCost"))),sellingPrice:cents(Math.max(0,numeric(r,"sellingPrice","sell","price","unitPrice"))),stockQuantity:stock,minStockThreshold:Math.max(0,Math.floor(numeric(r,"minStockThreshold","minStock"))),description:key(r,"description").slice(0,1000)};
  }),customers:customers.map(r=>({name:key(r,"name","customerName"),phone:key(r,"phone","customerPhone"),email:key(r,"email"),address:key(r,"address"),notes:key(r,"notes")})).filter(r=>r.name),
  suppliers:suppliers.map(r=>({name:key(r,"name","supplierName"),phone:key(r,"phone"),email:key(r,"email"),companyName:key(r,"companyName"),address:key(r,"address"),notes:key(r,"notes")})).filter(r=>r.name),
  sales:sales.map((r,i)=>normalizeTransaction(r,"sale",i)),purchases:purchases.map((r,i)=>normalizeTransaction(r,"purchase",i))};
}
function normalizeTransaction(r:Row,kind:"sale"|"purchase",i:number) {
  const number=key(r,kind==="sale"?"invoiceNumber":"purchaseNumber",kind==="sale"?"invoice":"PO","number");
  if(!number)throw new ApiError(`${kind} row ${i+1} needs an invoice / PO number`);
  const items=list(get(r,"items","lines")).map(x=>{const qty=numeric(x,"quantity","qty");if(!Number.isSafeInteger(qty)||qty<1)throw new ApiError(`Invalid quantity on ${kind} row ${i+1}`);return {code:key(x,"productCode","code","sku"),productName:key(x,"productName","name","itemName"),quantity:qty,unitPrice:Math.max(0,numeric(x,kind==="sale"?"unitPrice":"unitCost","price","cost")),totalPrice:Math.max(0,numeric(x,"totalPrice","amount"))};});
  const subtotal=numeric(r,"subtotal" )||items.reduce((s,it)=>s+it.totalPrice,0);
  const total=numeric(r,"totalAmount","total","amount");
  if(!Number.isFinite(total)||total<0)throw new ApiError(`Invalid total for ${number}`);
  const paidInput=get(r,"paidAmount","paid");const remainingInput=get(r,"remaining","remainingAmount","balance");
  const paid=paidInput!==undefined?numeric(r,"paidAmount","paid"):key(r,"paymentStatus","status")==="Paid"?total:remainingInput!==undefined?Math.max(0,total-numeric(r,"remaining","remainingAmount","balance")):0;
  if(paid<0||paid>total)throw new ApiError(`Invalid payment for ${number}`);
  if(items.length>100)throw new ApiError(`Too many line items for ${number}`);
  return {number,customerName:key(r,"customerName","customer"),supplierName:key(r,"supplierName","supplier"),customerPhone:key(r,"customerPhone","phone"),date:dateValue(get(r,"saleDate","purchaseDate","date")),subtotal:cents(subtotal),total:cents(total),totalCost:cents(numeric(r,"totalCost")),paid:cents(paid),discount:cents(numeric(r,"discount")),paymentMethod:key(r,"paymentMethod","method")||"Cash",status:payment(total,paid),currency:key(r,"currency")=== "USD"?"$":key(r,"currency")==="ETB"?"ETB ":key(r,"currency")||"ETB ",notes:key(r,"notes").slice(0,1000),items};
}

export async function validateApiUrl(raw:string){
  let url:URL;try{url=new URL(raw);}catch{throw new ApiError("Enter a full HTTPS API URL");}
  if(url.hostname==="v0.app"&&url.pathname.includes("/chat/"))throw new ApiError("A v0 chat page is not a data API. Use the other app’s public or deployed JSON endpoint, or import an export file.");
  if(url.protocol!=="https:"||url.username||url.password||/localhost|\.local$|\.internal$|\.test$/.test(url.hostname)||url.pathname.startsWith("/api/health"))throw new ApiError("Use a public HTTPS data endpoint, without embedded passwords.");
  if(/token|password|secret|key/i.test(url.search))throw new ApiError("Put credentials in the server environment, not in the URL.");
  const addresses=await lookup(url.hostname,{all:true});if(!addresses.length||addresses.some(a=>/^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.|^169\.254\.|^0\.|^::|^fc|^fd|^fe80/i.test(a.address)))throw new ApiError("Private network endpoints are not supported");
  return url.toString();
}

export async function exportSnapshot(storeId:number){
  const [store]=await db.select().from(stores).where(eq(stores.id,storeId));
  const [ps,cs,ss,sa,pu]=await Promise.all([
    db.select().from(products).where(eq(products.storeId,storeId)),db.select().from(customers).where(eq(customers.storeId,storeId)),db.select().from(suppliers).where(eq(suppliers.storeId,storeId)),db.select().from(sales).where(eq(sales.storeId,storeId)),db.select().from(purchases).where(eq(purchases.storeId,storeId))]);
  const saleLines=await db.select().from(saleItems).where(eq(saleItems.storeId,storeId));const purchaseLines=await db.select().from(purchaseItems).where(eq(purchaseItems.storeId,storeId));
  return {version:1,store:{name:store.name,currency:store.currency},products:ps,customers:cs,suppliers:ss,sales:sa.map(r=>({...r,items:saleLines.filter(l=>l.saleId===r.id).map(l=>({...l,code:ps.find(p=>p.id===l.productId)?.code}))})),purchases:pu.map(r=>({...r,items:purchaseLines.filter(l=>l.purchaseId===r.id).map(l=>({...l,code:ps.find(p=>p.id===l.productId)?.code}))}))};
}

export function parseImportFile(buffer:Buffer,filename:string){
  if(buffer.length>10*1024*1024)throw new ApiError("Maximum upload size is 10 MB");
  if(filename.toLowerCase().endsWith(".json"))return normalizeSnapshot(JSON.parse(buffer.toString("utf8")));
  if(!/\.(xlsx|csv)$/i.test(filename))throw new ApiError("Choose an XLSX, CSV or JSON file");
  const wb=XLSX.read(buffer,{type:"buffer",cellDates:true,sheetRows:10001});
  const snapshot:Row={};
  for(const sheet of wb.SheetNames){const lower=normalizeKey(sheet);if(["products","catalog","customers","suppliers","sales","purchases"].includes(lower))snapshot[lower]=XLSX.utils.sheet_to_json(wb.Sheets[sheet],{defval:"",raw:true});}
  if(!Object.keys(snapshot).length && wb.SheetNames.length===1){const rows=XLSX.utils.sheet_to_json<Row>(wb.Sheets[wb.SheetNames[0]],{defval:"",raw:true});const first=rows[0]||{};const keys=Object.keys(first).map(normalizeKey);const kind=keys.some(k=>["invoicenumber","invoice"].includes(k))?"sales":keys.some(k=>["purchasenumber","po"].includes(k))?"purchases":keys.some(k=>["code","sku","unit"].includes(k))?"products":"customers";snapshot[kind]=rows;}
  return normalizeSnapshot(snapshot);
}

export async function importSnapshot(storeId:number,raw:unknown,source:string){
  const snapshot=normalizeSnapshot(raw);const fingerprint=createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  return db.transaction(async tx=>{
    await tx.execute(sql`select pg_advisory_xact_lock(${storeId+70000})`);
    const [existing]=await tx.select().from(integrationImports).where(and(eq(integrationImports.storeId,storeId),eq(integrationImports.fingerprint,fingerprint))).limit(1);
    if(existing)return {...(existing.summary as Row),skipped:true,imported:false};
    const [scope]=await tx.select().from(stores).where(eq(stores.id,storeId)).limit(1);
    if(snapshot.sales.some(r=>r.currency!==scope.currency)||snapshot.purchases.some(r=>r.currency!==scope.currency))throw new ApiError("Use one currency per store. Change the target store currency before importing records in that currency. No currency conversion is performed.");
    const originalProducts=await tx.select().from(products).where(eq(products.storeId,storeId)).for("update");
    const localCustomers=await tx.select().from(customers).where(eq(customers.storeId,storeId));const localSuppliers=await tx.select().from(suppliers).where(eq(suppliers.storeId,storeId));
    const summary={products:0,customers:0,suppliers:0,sales:0,purchases:0,stockInitialized:0,duplicates:0,warning:"Historical sales and purchases are imported as records; they do not alter stock. Existing stock with movement history is never overwritten."};
    const productMap=new Map(originalProducts.map(p=>[p.code.toLowerCase(),p]));
    
    for(const p of snapshot.products){
      const prior=productMap.get(p.code.toLowerCase());if(prior){
        const logs=await tx.select({id:inventoryLogs.id}).from(inventoryLogs).where(and(eq(inventoryLogs.storeId,storeId),eq(inventoryLogs.productId,prior.id))).limit(1);
        if(!logs.length&&prior.stockQuantity===0&&p.stockQuantity>0){await tx.update(products).set({stockQuantity:p.stockQuantity,costPrice:p.costPrice,sellingPrice:p.sellingPrice,updatedAt:new Date()}).where(eq(products.id,prior.id));await tx.insert(inventoryLogs).values({storeId,productId:prior.id,productName:prior.name,changeType:"import",quantityChange:p.stockQuantity,previousStock:0,newStock:p.stockQuantity,reason:"Opening stock from app import",referenceNumber:source.slice(0,80)});summary.stockInitialized++;prior.stockQuantity=p.stockQuantity;}
        summary.duplicates++;continue;
      }
      const [newP]=await tx.insert(products).values({...p,storeId}).returning();productMap.set(p.code.toLowerCase(),newP);summary.products++;
      if(p.stockQuantity>0){await tx.insert(inventoryLogs).values({storeId,productId:newP.id,productName:newP.name,changeType:"import",quantityChange:p.stockQuantity,previousStock:0,newStock:p.stockQuantity,reason:"Stock import",referenceNumber:source.slice(0,80)});summary.stockInitialized++;}
    }
    for(const c of snapshot.customers){const exists=localCustomers.find(x=>x.name.toLowerCase()===c.name.toLowerCase());if(exists)continue;const [row]=await tx.insert(customers).values({...c,storeId}).returning();localCustomers.push(row);summary.customers++;}
    for(const s of snapshot.suppliers){const exists=localSuppliers.find(x=>x.name.toLowerCase()===s.name.toLowerCase());if(exists)continue;const [row]=await tx.insert(suppliers).values({...s,storeId}).returning();localSuppliers.push(row);summary.suppliers++;}
    for(const kind of ["sale","purchase"] as const){
      const table=kind==="sale"?sales:purchases;const lines=kind==="sale"?saleItems:purchaseItems;const records=kind==="sale"?snapshot.sales:snapshot.purchases;
      for(const record of records){
        const where=and(eq(table.storeId,storeId),eq(kind==="sale"?sales.invoiceNumber:purchases.purchaseNumber,record.number));const [old]=await tx.select().from(table).where(where).limit(1);
        if(old){if(Number(old.totalAmount)!==Number(record.total)||Number(old.paidAmount)!==Number(record.paid))throw new ApiError(`Existing ${record.number} differs from the import; correct the source amounts before importing.`,409);summary.duplicates++;continue;}
        let customer=localCustomers.find(c=>c.name.toLowerCase()===record.customerName.toLowerCase())?.id||null;
        let supplier=localSuppliers.find(s=>s.name.toLowerCase()===record.supplierName.toLowerCase())?.id||null;
        if(!customer&&record.customerName&&record.customerName!=="Walk-in Customer"){const [c]=await tx.insert(customers).values({storeId,name:record.customerName,phone:record.customerPhone}).returning();localCustomers.push(c);customer=c.id;summary.customers++;}
        if(!supplier&&record.supplierName){const [s]=await tx.insert(suppliers).values({storeId,name:record.supplierName}).returning();localSuppliers.push(s);supplier=s.id;summary.suppliers++;}
        const common={storeId,subtotal:record.subtotal,totalAmount:record.total,tax:"0.00",paidAmount:record.paid,paymentStatus:record.status,paymentMethod:record.paymentMethod,notes:`Imported from ${source.slice(0,80)}. ${record.notes}`,currency:["ETB ","$","USD"].includes(record.currency)?record.currency:"ETB "};
        let parentId=0;
        if(kind==="sale") {const [r]=await tx.insert(sales).values({...common,invoiceNumber:record.number,customerId:customer,customerName:record.customerName||"Walk-in Customer",customerPhone:record.customerPhone,supplierId:supplier,discount:record.discount,totalCost:record.totalCost,saleDate:record.date}).returning();parentId=r.id;summary.sales++;}
        else {const [r]=await tx.insert(purchases).values({...common,purchaseNumber:record.number,supplierId:supplier,supplierName:record.supplierName||"Imported Supplier",customerId:customer,customerName:record.customerName,shippingFee:"0.00",purchaseDate:record.date}).returning();parentId=r.id;summary.purchases++;}
        for(const l of record.items){let product=productMap.get(l.code.toLowerCase())||[...productMap.values()].find(p=>p.name.toLowerCase()===l.productName.toLowerCase());
          if(!product){const code=l.code||(l.productName||"Imported Product").toUpperCase().replace(/[^A-Z0-9]+/g,"-").slice(0,40);const [p]=await tx.insert(products).values({storeId,code:code||`IMPORT-${Date.now()}`,name:l.productName||code,category:"Readymade Carpet",costPrice:cents(l.unitPrice),sellingPrice:cents(l.unitPrice),stockQuantity:0}).onConflictDoNothing().returning();if(p){product=p;productMap.set(p.code.toLowerCase(),p);}else continue;}
          if(kind==="sale")await tx.insert(saleItems).values({storeId,saleId:parentId,productId:product.id,productName:l.productName||product.name,unit:product.unit,quantity:l.quantity,unitPrice:cents(l.unitPrice),unitCost:product.costPrice,totalPrice:cents(l.totalPrice||l.unitPrice*l.quantity)});
          else await tx.insert(purchaseItems).values({storeId,purchaseId:parentId,productId:product.id,productName:l.productName||product.name,unit:product.unit,quantity:l.quantity,unitCost:cents(l.unitPrice),totalPrice:cents(l.totalPrice||l.unitPrice*l.quantity)});
        }
      }
    }
    await tx.insert(integrationImports).values({storeId,source, fingerprint,summary});
    return {...summary,imported:true,skipped:false};
  });
}
