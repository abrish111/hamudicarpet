import { pgTable, serial, text, numeric, integer, timestamp, boolean, uniqueIndex, jsonb } from "drizzle-orm/pg-core";

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  currency: text("currency").notNull().default("ETB "),
  sourceUrl: text("source_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shopSettings = pgTable("shop_settings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().default(1).references(() => stores.id),
  shopName: text("shop_name").notNull().default("Hamudi Carpet"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
  currency: text("currency").default("ETB "),
  invoicePrefix: text("invoice_prefix").default("HC-INV-"),
  purchasePrefix: text("purchase_prefix").default("HC-PO-"),
  footerNote: text("footer_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("settings_store_unique").on(t.storeId)]);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().default(1).references(() => stores.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull().default("pcs"),
  dimensions: text("dimensions"),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  stockQuantity: numeric("stock_quantity", { mode: "number" }).notNull().default(0),
  minStockThreshold: integer("min_stock_threshold").notNull().default(5),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("product_store_code_unique").on(t.storeId, t.code)]);

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().default(1).references(() => stores.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().default(1).references(() => stores.id),
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
  storeId: integer("store_id").notNull().default(1).references(() => stores.id),
  invoiceNumber: text("invoice_number").notNull(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull().default("Walk-in Customer"),
  customerPhone: text("customer_phone"),
  supplierId: integer("supplier_id"),
  supplierName: text("supplier_name"),
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0.00"),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull().default("0.00"),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  paymentMethod: text("payment_method").notNull().default("Cash"),
  paymentStatus: text("payment_status").notNull().default("Paid"),
  currency: text("currency").notNull().default("ETB "),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("invoice_store_number_unique").on(t.storeId, t.invoiceNumber)]);

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().default(1).references(() => stores.id),
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
  storeId: integer("store_id").notNull().default(1).references(() => stores.id),
  purchaseNumber: text("purchase_number").notNull(),
  supplierId: integer("supplier_id"),
  supplierName: text("supplier_name").notNull().default("General Supplier"),
  customerId: integer("customer_id"),
  customerName: text("customer_name"),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0.00"),
  tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0.00"),
  shippingFee: numeric("shipping_fee", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  paymentStatus: text("payment_status").notNull().default("Paid"),
  paymentMethod: text("payment_method").notNull().default("Bank Transfer"),
  currency: text("currency").notNull().default("ETB "),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("purchase_store_number_unique").on(t.storeId, t.purchaseNumber)]);

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().default(1).references(() => stores.id),
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
  storeId: integer("store_id").notNull().default(1).references(() => stores.id),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  changeType: text("change_type").notNull(),
  quantityChange: numeric("quantity_change", { mode: "number" }).notNull(),
  previousStock: numeric("previous_stock", { mode: "number" }).notNull(),
  newStock: numeric("new_stock", { mode: "number" }).notNull(),
  reason: text("reason"),
  referenceNumber: text("reference_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeConnections = pgTable("store_connections", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().unique().references(() => stores.id),
  name: text("name").notNull().default("Carpet Shop App"),
  sourceUrl: text("source_url").notNull(),
  apiUrl: text("api_url"),
  tokenEnvName: text("token_env_name"),
  direction: text("direction").notNull().default("import"),
  lastSyncAt: timestamp("last_sync_at"),
  lastStatus: text("last_status").notNull().default("not_connected"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const integrationImports = pgTable("integration_imports", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  source: text("source").notNull(),
  fingerprint: text("fingerprint").notNull(),
  summary: jsonb("summary").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("store_import_fingerprint_unique").on(t.storeId, t.fingerprint)]);

export const stockTransfers = pgTable("stock_transfers", {
  id: serial("id").primaryKey(),
  fromStoreId: integer("from_store_id").notNull().references(() => stores.id),
  toStoreId: integer("to_store_id").notNull().references(() => stores.id),
  fromProductId: integer("from_product_id").notNull(),
  toProductId: integer("to_product_id").notNull(),
  productCode: text("product_code").notNull(),
  quantity: numeric("quantity", { mode: "number" }).notNull(),
  reference: text("reference").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


