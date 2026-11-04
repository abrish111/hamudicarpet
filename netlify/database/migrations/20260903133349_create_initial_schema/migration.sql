CREATE TABLE "customers" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_logs" (
	"id" serial PRIMARY KEY,
	"product_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"change_type" text NOT NULL,
	"quantity_change" integer NOT NULL,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"reason" text,
	"reference_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"dimensions" text,
	"cost_price" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"selling_price" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"min_stock_threshold" integer DEFAULT 5 NOT NULL,
	"description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_items" (
	"id" serial PRIMARY KEY,
	"purchase_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"dimensions" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_cost" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"total_price" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" serial PRIMARY KEY,
	"purchase_number" text NOT NULL UNIQUE,
	"supplier_id" integer,
	"supplier_name" text DEFAULT 'General Carpet Mills' NOT NULL,
	"purchase_date" timestamp DEFAULT now() NOT NULL,
	"subtotal" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"tax" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"shipping_fee" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"paid_amount" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"payment_status" text DEFAULT 'Paid' NOT NULL,
	"payment_method" text DEFAULT 'Bank Transfer' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" serial PRIMARY KEY,
	"sale_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"dimensions" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"unit_cost" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"total_price" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY,
	"invoice_number" text NOT NULL UNIQUE,
	"customer_id" integer,
	"customer_name" text DEFAULT 'Walk-in Customer' NOT NULL,
	"customer_phone" text,
	"sale_date" timestamp DEFAULT now() NOT NULL,
	"subtotal" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"discount" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"tax" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"total_cost" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"paid_amount" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"payment_method" text DEFAULT 'Cash' NOT NULL,
	"payment_status" text DEFAULT 'Paid' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_settings" (
	"id" serial PRIMARY KEY,
	"shop_name" text DEFAULT 'Hamudi Carpet' NOT NULL,
	"phone" text DEFAULT '+971 50 123 4567',
	"email" text DEFAULT 'contact@hamudicarpet.com',
	"address" text DEFAULT 'Building 4, Carpet Souq, Al Rolla, Sharjah / Dubai',
	"tax_rate" numeric(5,2) DEFAULT '0.00',
	"currency" text DEFAULT 'ETB',
	"invoice_prefix" text DEFAULT 'HC-INV-',
	"purchase_prefix" text DEFAULT 'HC-PO-',
	"footer_note" text DEFAULT 'Thank you for choosing Hamudi Carpet! Quality carpets for your home and office.',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"company_name" text,
	"phone" text,
	"email" text,
	"address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
