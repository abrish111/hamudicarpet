import { pgTable, serial, text, numeric, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const shopSettings = pgTable("shop_settings", {
  id: serial("id").primaryKey(),
  shopName: text("shop_name").notNull().default("Hamudi Carpet"),
  phone: text("phone").default("+971 50 123 4567"),
  email: text("email").default("contact@hamudicarpet.com"),
  address: text("address").default("Building 4, Carpet Souq, Al Rolla, Sharjah / Dubai"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0.00"), // % (VAT disabled)
  currency: text("currency").default("ETB"),
  invoicePrefix: text("invoice_prefix").default("HC-INV-"),
  purchasePrefix: text("purchase_prefix").default("HC-PO-"),
  footerNote: text("footer_note").default("Thank you for choosing Hamudi Carpet! Quality carpets for your home and office."),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g. RMC-01, W2W-02
  name: text("name").notNull(),
  category: text("category").notNull(), // Readymade, Wall to Wall, PVC, Artificial Grass, Prayer Mat, WA
  unit: text("unit").notNull().default("pcs"), // pcs, rolls, sqm, sqft
  dimensions: text("dimensions"), // e.g. "3x4 m", "2.5x3.5 m"
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  stockQuantity: numeric("stock_quantity", { mode: "number" }).notNull().default(0),
  minStockThreshold: integer("min_stock_threshold").notNull().default(5),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyName: text("company_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull().default("Walk-in Customer"),
  customerPhone: text("customer_phone"),
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0.00"),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull().default("0.00"), // for profit calc
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  paymentMethod: text("payment_method").notNull().default("Cash"), // Cash, Card, Bank Transfer, Cheque, Credit
  paymentStatus: text("payment_status").notNull().default("Paid"), // Paid, Partial, Unpaid
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  unit: text("unit").notNull().default("pcs"),
  dimensions: text("dimensions"),
  quantity: numeric("quantity", { mode: "number" }).notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  purchaseNumber: text("purchase_number").notNull().unique(),
  supplierId: integer("supplier_id"),
  supplierName: text("supplier_name").notNull().default("General Carpet Mills"),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0.00"),
  tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0.00"),
  shippingFee: numeric("shipping_fee", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  paymentStatus: text("payment_status").notNull().default("Paid"), // Paid, Partial, Unpaid
  paymentMethod: text("payment_method").notNull().default("Bank Transfer"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  unit: text("unit").notNull().default("pcs"),
  dimensions: text("dimensions"),
  quantity: numeric("quantity", { mode: "number" }).notNull().default(1),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventoryLogs = pgTable("inventory_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  changeType: text("change_type").notNull(), // 'sale', 'purchase', 'adjustment', 'initial'
  quantityChange: numeric("quantity_change", { mode: "number" }).notNull(), // positive for in, negative for out
  previousStock: numeric("previous_stock", { mode: "number" }).notNull(),
  newStock: numeric("new_stock", { mode: "number" }).notNull(),
  reason: text("reason"),
  referenceNumber: text("reference_number"), // e.g. invoice or PO number
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
