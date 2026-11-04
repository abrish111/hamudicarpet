ALTER TABLE "inventory_logs" ALTER COLUMN "quantity_change" SET DATA TYPE numeric USING "quantity_change"::numeric;--> statement-breakpoint
ALTER TABLE "inventory_logs" ALTER COLUMN "previous_stock" SET DATA TYPE numeric USING "previous_stock"::numeric;--> statement-breakpoint
ALTER TABLE "inventory_logs" ALTER COLUMN "new_stock" SET DATA TYPE numeric USING "new_stock"::numeric;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "stock_quantity" SET DATA TYPE numeric USING "stock_quantity"::numeric;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "stock_quantity" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "purchase_items" ALTER COLUMN "quantity" SET DATA TYPE numeric USING "quantity"::numeric;--> statement-breakpoint
ALTER TABLE "purchase_items" ALTER COLUMN "quantity" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "sale_items" ALTER COLUMN "quantity" SET DATA TYPE numeric USING "quantity"::numeric;--> statement-breakpoint
ALTER TABLE "sale_items" ALTER COLUMN "quantity" SET DEFAULT '1';