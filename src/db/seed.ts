import { db, products, shopSettings, customers, suppliers, sales, saleItems, purchases, purchaseItems, inventoryLogs } from "./index";
import { count, eq } from "drizzle-orm";
import { ensureStores } from "@/lib/store-context";

export const INITIAL_PRODUCTS = [
  {
    code: "RMC-STD",
    name: "Readmade Carpet",
    category: "Readymade Carpet",
    unit: "pcs",
    dimensions: "Standard 2.0m x 3.0m",
    costPrice: "48.00",
    sellingPrice: "85.00",
    stockQuantity: 42,
    minStockThreshold: 10,
    description: "Classic high-density woven readymade carpet for living spaces and guest halls.",
    imageUrl: "/images/carpet-classic.jpg",
  },
  {
    code: "W2W-RL",
    name: "Wall to Wall Carpet",
    category: "Wall to Wall",
    unit: "sqm",
    dimensions: "4.0m Width Roll (Custom Cut)",
    costPrice: "18.50",
    sellingPrice: "34.00",
    stockQuantity: 280,
    minStockThreshold: 50,
    description: "Heavy-duty commercial & residential wall to wall plush cut pile carpet.",
    imageUrl: "/images/carpet-wall.jpg",
  },
  {
    code: "PVC-RM",
    name: "PVC Readymade",
    category: "PVC Flooring",
    unit: "pcs",
    dimensions: "2.0m x 3.0m Sheet",
    costPrice: "24.00",
    sellingPrice: "46.00",
    stockQuantity: 65,
    minStockThreshold: 15,
    description: "Waterproof, easy-to-clean embossed woodgrain & stone effect PVC flooring sheet.",
    imageUrl: "/images/pvc-mat.jpg",
  },
  {
    code: "WAC-01",
    name: "WA Carpet",
    category: "WA Carpet",
    unit: "pcs",
    dimensions: "3.0m x 3.0m Square",
    costPrice: "70.00",
    sellingPrice: "125.00",
    stockQuantity: 30,
    minStockThreshold: 8,
    description: "Premium WA textured weave oriental pattern accent carpet.",
    imageUrl: "/images/carpet-wa.jpg",
  },
  {
    code: "RM-3X4",
    name: "Readymade 3*4",
    category: "Readymade Carpet",
    unit: "pcs",
    dimensions: "3.0m x 4.0m (12 sqm)",
    costPrice: "88.00",
    sellingPrice: "155.00",
    stockQuantity: 26,
    minStockThreshold: 6,
    description: "Large living room size readymade luxury carpet with anti-slip backing.",
    imageUrl: "/images/carpet-3x4.jpg",
  },
  {
    code: "RM-25X35",
    name: "Readymade 2.5*3.5",
    category: "Readymade Carpet",
    unit: "pcs",
    dimensions: "2.5m x 3.5m (8.75 sqm)",
    costPrice: "72.00",
    sellingPrice: "130.00",
    stockQuantity: 34,
    minStockThreshold: 8,
    description: "Medium-large master bedroom & dining area carpet with soft velvet touch.",
    imageUrl: "/images/carpet-25x35.jpg",
  },
  {
    code: "RM-2X3",
    name: "Readymade 2*3",
    category: "Readymade Carpet",
    unit: "pcs",
    dimensions: "2.0m x 3.0m (6 sqm)",
    costPrice: "45.00",
    sellingPrice: "82.00",
    stockQuantity: 58,
    minStockThreshold: 12,
    description: "Standard parlor and bedroom size carpet with floral & geometric motifs.",
    imageUrl: "/images/carpet-2x3.jpg",
  },
  {
    code: "RM-15X22",
    name: "Readymade 1.5*2.2",
    category: "Readymade Carpet",
    unit: "pcs",
    dimensions: "1.5m x 2.2m (3.3 sqm)",
    costPrice: "29.00",
    sellingPrice: "55.00",
    stockQuantity: 45,
    minStockThreshold: 10,
    description: "Compact coffee table, entryway and bedside soft carpet runner.",
    imageUrl: "/images/carpet-15x22.jpg",
  },
  {
    code: "RM-4X5",
    name: "Readymade 4*5",
    category: "Readymade Carpet",
    unit: "pcs",
    dimensions: "4.0m x 5.0m (20 sqm)",
    costPrice: "135.00",
    sellingPrice: "240.00",
    stockQuantity: 18,
    minStockThreshold: 5,
    description: "Extra large grand salon readymade carpet with rich borders and high knot count.",
    imageUrl: "/images/carpet-4x5.jpg",
  },
  {
    code: "RM-4X6",
    name: "Readymade 4*6",
    category: "Readymade Carpet",
    unit: "pcs",
    dimensions: "4.0m x 6.0m (24 sqm)",
    costPrice: "165.00",
    sellingPrice: "295.00",
    stockQuantity: 12,
    minStockThreshold: 4,
    description: "Palace and majlis size luxury readymade carpet with double backing.",
    imageUrl: "/images/carpet-4x6.jpg",
  },
  {
    code: "AG-25MM",
    name: "Artificial Grass",
    category: "Artificial Grass",
    unit: "sqm",
    dimensions: "25mm Pile / 2m x 25m Roll",
    costPrice: "9.50",
    sellingPrice: "18.50",
    stockQuantity: 310,
    minStockThreshold: 50,
    description: "UV-resistant natural look landscape & balcony synthetic turf with drainage holes.",
    imageUrl: "/images/grass.jpg",
  },
  {
    code: "PM-2X3",
    name: "Praying Mat 2*3",
    category: "Praying Mat",
    unit: "pcs",
    dimensions: "2.0m x 3.0m (Multi-Person)",
    costPrice: "32.00",
    sellingPrice: "62.00",
    stockQuantity: 48,
    minStockThreshold: 10,
    description: "Family / Mosque row praying mat with plush foam padding and Mihrab design.",
    imageUrl: "/images/prayer-mat.jpg",
  },
];

export async function seedDatabase(force = false) {
  try {
    await ensureStores();
    if (force) return { success: false, error: "Demo reset is disabled to protect your store data. Add or edit records in each store instead." };
    const [{ value: productCount }] = await db.select({ value: count() }).from(products);
    
    if (productCount > 0 && !force) {
      return { success: true, message: "Database already seeded" };
    }

    if (force) {
      await db.delete(inventoryLogs);
      await db.delete(saleItems);
      await db.delete(sales);
      await db.delete(purchaseItems);
      await db.delete(purchases);
      await db.delete(products);
      await db.delete(customers);
      await db.delete(suppliers);
      await db.delete(shopSettings);
    }

    // 1. Settings
    await db.insert(shopSettings).values({
      shopName: "Hamudi Carpet",
      phone: "+971 50 847 2910",
      email: "hamudi.carpets@gmail.com",
      address: "Shop 14, Main Carpet & Rugs Market, Sharjah / Dubai",
      storeId: 1,
      taxRate: "0.00",
      currency: "ETB ",
      invoicePrefix: "HC-INV-",
      purchasePrefix: "HC-PO-",
      footerNote: "Hamudi Carpet - Premium Floorings, Readymade Carpets & Prayer Mats. Warranty against manufacturing defects.",
    }).onConflictDoNothing();

    // 2. Customers
    const insertedCustomers = await db.insert(customers).values([
      { name: "Ahmed Al-Mansoor", phone: "+971 50 234 5678", email: "ahmed.m@yahoo.com", address: "Villa 22, Al Zahia, Sharjah", notes: "Prefers large readymade carpets 4x5 and 4x6" },
      { name: "Fatima Noor Interior Design", phone: "+971 52 987 6543", email: "fatima@noordesign.ae", address: "Business Bay, Dubai", notes: "Regular bulk buyer for villa fit-outs" },
      { name: "Tariq Mahmood", phone: "+971 55 112 2334", email: "tariq.m@hotmail.com", address: "Al Nahda 2, Dubai", notes: "Prayer mats and living room carpets" },
      { name: "Al Baraka Mosque Committee", phone: "+971 56 445 5667", email: "contact@barakamosque.org", address: "Al Majaz 3, Sharjah", notes: "Regular buyer of 2x3 prayer mats and wall to wall rolls" },
      { name: "Green Oasis Villa Landscaping", phone: "+971 50 778 8990", email: "projects@greenoasis.ae", address: "Al Barsha, Dubai", notes: "Purchases artificial grass rolls" },
      { name: "Khaled Bin Sultan", phone: "+971 54 332 1199", email: "khaled.sultan@gmail.com", address: "Muwaileh Commercial, Sharjah", notes: "Apartment flooring customer" },
      { name: "Walk-in Customer", phone: "", email: "", address: "In-store visitor", notes: "Daily retail transactions" },
    ]).returning();

    // 3. Suppliers
    const insertedSuppliers = await db.insert(suppliers).values([
      { name: "Silk Route Carpet Mills Ltd", companyName: "Silk Route Mills", phone: "+971 4 888 1234", email: "orders@silkroutecarpet.com", address: "Jebel Ali Free Zone, Dubai", notes: "Primary supplier of Readymade carpets (3x4, 4x5, 4x6)" },
      { name: "Belgian Floorings & PVC Direct", companyName: "EuroPVC Global", phone: "+971 6 534 8899", email: "sales@belgianpvc.ae", address: "Industrial Area 13, Sharjah", notes: "Supplies PVC Readymade and Wall to Wall carpet rolls" },
      { name: "Turkmen & Anatolia Weavers", companyName: "Anatolia Rugs Inc", phone: "+90 212 555 7788", email: "export@anatoliatrading.tr", address: "Gaziantep, Turkey / UAE Branch", notes: "WA Carpet & premium classic woven carpets" },
      { name: "GreenTurf Synthetic Grass Co.", companyName: "GreenTurf Int.", phone: "+971 4 340 9922", email: "info@greenturf-grass.com", address: "Al Quoz Industrial 3, Dubai", notes: "Artificial grass rolls 25mm, 35mm" },
      { name: "Al Huda Textiles & Prayer Mats", companyName: "Al Huda Carpets", phone: "+966 12 654 3210", email: "sales@alhudamats.com", address: "Jeddah / Dubai Warehouse", notes: "Prayer mats 2x3 and mosque rolls" },
    ]).returning();

    // 4. Products
    const insertedProducts = await db.insert(products).values(INITIAL_PRODUCTS).returning();

    await db.insert(products).values(insertedProducts.map(({ id, storeId, createdAt, updatedAt, stockQuantity, ...p }) => ({ ...p, storeId: 2, stockQuantity: 0 }))).onConflictDoNothing();
    // 5. Generate Past 6 Months Realistic Purchases & Sales Data
    // We will generate realistic sales & purchases from Oct 2025 through current date (e.g. May 2026)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let invoiceCounter = 1001;
    let poCounter = 201;

    // We will create data for the last 6 months
    const monthOffsets = [5, 4, 3, 2, 1, 0]; // 5 months ago to this month
    
    for (const offset of monthOffsets) {
      const monthDate = new Date(currentYear, currentMonth - offset, 1);
      const daysInMonth = new Date(currentYear, currentMonth - offset + 1, 0).getDate();

      // Number of purchases in this month: 3 - 5 purchase orders
      const purchaseCountThisMonth = 3 + (offset % 3);
      for (let p = 0; p < purchaseCountThisMonth; p++) {
        const day = Math.min(2 + p * 6, daysInMonth);
        const pDate = new Date(currentYear, currentMonth - offset, day, 10 + (p * 2), 30);
        const supplier = insertedSuppliers[p % insertedSuppliers.length];

        // Pick 2-4 items for this purchase
        const itemCount = 2 + (p % 3);
        const selectedProducts = [...insertedProducts]
          .sort(() => 0.5 - Math.random())
          .slice(0, itemCount);

        let pSubtotal = 0;
        const pItemsToInsert: Array<{
          productId: number;
          productName: string;
          unit: string;
          dimensions: string | null;
          quantity: number;
          unitCost: string;
          totalPrice: string;
        }> = [];

        for (const prod of selectedProducts) {
          const qty = prod.unit === "sqm" ? 30 + Math.floor(Math.random() * 50) : 5 + Math.floor(Math.random() * 15);
          const cost = parseFloat(prod.costPrice);
          const lineTotal = qty * cost;
          pSubtotal += lineTotal;

          pItemsToInsert.push({
            productId: prod.id,
            productName: prod.name,
            unit: prod.unit,
            dimensions: prod.dimensions,
            quantity: qty,
            unitCost: cost.toFixed(2),
            totalPrice: lineTotal.toFixed(2),
          });
        }

        const tax = (pSubtotal * 0.05);
        const total = pSubtotal + tax;
        const poNumber = `HC-PO-${poCounter++}`;

        const [createdPo] = await db.insert(purchases).values({
          purchaseNumber: poNumber,
          supplierId: supplier.id,
          supplierName: supplier.name,
          purchaseDate: pDate,
          subtotal: pSubtotal.toFixed(2),
          tax: tax.toFixed(2),
          shippingFee: "0.00",
          totalAmount: total.toFixed(2),
          paidAmount: total.toFixed(2),
          paymentStatus: "Paid",
          paymentMethod: p % 2 === 0 ? "Bank Transfer" : "Cheque",
          notes: `Monthly stock replenishment order from ${supplier.companyName || supplier.name}`,
        }).returning();

        for (const itm of pItemsToInsert) {
          await db.insert(purchaseItems).values({
            purchaseId: createdPo.id,
            productId: itm.productId,
            productName: itm.productName,
            unit: itm.unit,
            dimensions: itm.dimensions,
            quantity: itm.quantity,
            unitCost: itm.unitCost,
            totalPrice: itm.totalPrice,
          });
        }
      }

      // Sales in this month: 14 to 22 sales transactions per month
      const salesCountThisMonth = 15 + ((offset * 3) % 8);
      for (let s = 0; s < salesCountThisMonth; s++) {
        const day = Math.min(1 + Math.floor((s / salesCountThisMonth) * daysInMonth), daysInMonth);
        const sDate = new Date(currentYear, currentMonth - offset, day, 9 + (s % 11), 15 + ((s * 7) % 45));
        const customer = insertedCustomers[s % insertedCustomers.length];

        const itemCount = 1 + (s % 3);
        const selectedProds = [...insertedProducts]
          .sort(() => 0.5 - Math.random())
          .slice(0, itemCount);

        let sSubtotal = 0;
        let sTotalCost = 0;
        const sItemsToInsert: Array<{
          productId: number;
          productName: string;
          unit: string;
          dimensions: string | null;
          quantity: number;
          unitPrice: string;
          unitCost: string;
          totalPrice: string;
        }> = [];

        for (const prod of selectedProds) {
          const qty = prod.unit === "sqm" ? 8 + Math.floor(Math.random() * 25) : 1 + Math.floor(Math.random() * 4);
          const price = parseFloat(prod.sellingPrice);
          const cost = parseFloat(prod.costPrice);
          const lineTotal = qty * price;
          sSubtotal += lineTotal;
          sTotalCost += qty * cost;

          sItemsToInsert.push({
            productId: prod.id,
            productName: prod.name,
            unit: prod.unit,
            dimensions: prod.dimensions,
            quantity: qty,
            unitPrice: price.toFixed(2),
            unitCost: cost.toFixed(2),
            totalPrice: lineTotal.toFixed(2),
          });
        }

        const discount = s % 4 === 0 ? Math.round(sSubtotal * 0.05) : 0;
        const afterDiscount = sSubtotal - discount;
        const tax = (afterDiscount * 0.05);
        const total = afterDiscount + tax;
        const invNumber = `HC-INV-${invoiceCounter++}`;
        const paymentMethod = s % 3 === 0 ? "Cash" : s % 3 === 1 ? "Card" : "Bank Transfer";
        const paymentStatus = s === salesCountThisMonth - 1 && offset === 0 ? "Partial" : "Paid";
        const paidAmount = paymentStatus === "Partial" ? (total * 0.5).toFixed(2) : total.toFixed(2);

        const [createdSale] = await db.insert(sales).values({
          invoiceNumber: invNumber,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone || "+971 50 000 0000",
          saleDate: sDate,
          subtotal: sSubtotal.toFixed(2),
          discount: discount.toFixed(2),
          tax: tax.toFixed(2),
          totalAmount: total.toFixed(2),
          totalCost: sTotalCost.toFixed(2),
          paidAmount: paidAmount,
          paymentMethod: paymentMethod,
          paymentStatus: paymentStatus,
          notes: `Customer Order for carpet installation / delivery.`,
        }).returning();

        for (const itm of sItemsToInsert) {
          await db.insert(saleItems).values({
            saleId: createdSale.id,
            productId: itm.productId,
            productName: itm.productName,
            unit: itm.unit,
            dimensions: itm.dimensions,
            quantity: itm.quantity,
            unitPrice: itm.unitPrice,
            unitCost: itm.unitCost,
            totalPrice: itm.totalPrice,
          });
        }
      }
    }

    return { success: true, message: "Seed data initialized successfully!" };
  } catch (error) {
    console.error("Failed to seed database:", error);
    return { success: false, error: String(error) };
  }
}
