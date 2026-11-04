CREATE TABLE "integration_imports" (
	"id" serial PRIMARY KEY,
	"store_id" integer NOT NULL,
	"source" text NOT NULL,
	"fingerprint" text NOT NULL,
	"summary" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" serial PRIMARY KEY,
	"from_store_id" integer NOT NULL,
	"to_store_id" integer NOT NULL,
	"from_product_id" integer NOT NULL,
	"to_product_id" integer NOT NULL,
	"product_code" text NOT NULL,
	"quantity" numeric NOT NULL,
	"reference" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_connections" (
	"id" serial PRIMARY KEY,
	"store_id" integer NOT NULL UNIQUE,
	"name" text DEFAULT 'Carpet Shop App' NOT NULL,
	"source_url" text NOT NULL,
	"api_url" text,
	"token_env_name" text,
	"direction" text DEFAULT 'import' NOT NULL,
	"last_sync_at" timestamp,
	"last_status" text DEFAULT 'not_connected' NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"code" text NOT NULL UNIQUE,
	"address" text,
	"currency" text DEFAULT 'ETB ' NOT NULL,
	"source_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "stores" ("id", "code", "name", "currency") VALUES (1, 'STORE-1', 'Hamudi Carpet — Store 1', 'ETB '), (2, 'STORE-2', 'Carpet Shop — Store 2', 'ETB ') ON CONFLICT DO NOTHING;--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('stores','id'), greatest((SELECT max(id) FROM stores), 1));--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_code_key";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_code_unique";--> statement-breakpoint
ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS "purchases_purchase_number_key";--> statement-breakpoint
ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS "purchases_purchase_number_unique";--> statement-breakpoint
ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_invoice_number_key";--> statement-breakpoint
ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_invoice_number_unique";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "store_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD COLUMN "store_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "store_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "store_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "store_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "customer_id" integer;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "customer_name" text;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "currency" text DEFAULT 'ETB ' NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_items" ADD COLUMN "store_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "store_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "supplier_id" integer;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "supplier_name" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "currency" text DEFAULT 'ETB ' NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_settings" ADD COLUMN "store_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "store_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "supplier_name" SET DEFAULT 'General Supplier';--> statement-breakpoint
ALTER TABLE "shop_settings" ALTER COLUMN "phone" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shop_settings" ALTER COLUMN "email" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shop_settings" ALTER COLUMN "address" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shop_settings" ALTER COLUMN "currency" SET DEFAULT 'ETB ';--> statement-breakpoint
ALTER TABLE "shop_settings" ALTER COLUMN "footer_note" DROP DEFAULT;--> statement-breakpoint
DELETE FROM "shop_settings" a USING "shop_settings" b WHERE a.store_id = b.store_id AND a.id < b.id;--> statement-breakpoint
CREATE UNIQUE INDEX "store_import_fingerprint_unique" ON "integration_imports" ("store_id","fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "product_store_code_unique" ON "products" ("store_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_store_number_unique" ON "purchases" ("store_id","purchase_number");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_store_number_unique" ON "sales" ("store_id","invoice_number");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_store_unique" ON "shop_settings" ("store_id");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "integration_imports" ADD CONSTRAINT "integration_imports_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_from_store_id_stores_id_fkey" FOREIGN KEY ("from_store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_to_store_id_stores_id_fkey" FOREIGN KEY ("to_store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "store_connections" ADD CONSTRAINT "store_connections_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id");--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_store_id_stores_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id");