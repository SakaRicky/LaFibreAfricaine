-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "returned_quantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "discount_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fulfillment" TEXT NOT NULL DEFAULT 'awaiting_delivery',
ADD COLUMN     "lifecycle" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "payment_confirmed_at" TIMESTAMP(3),
ADD COLUMN     "payment_confirmed_by" INTEGER,
ADD COLUMN     "payment_method" TEXT NOT NULL DEFAULT 'interac',
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'awaiting',
ADD COLUMN     "refunded_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "request_key" TEXT,
ADD COLUMN     "salesperson_id" INTEGER,
ADD COLUMN     "salesperson_name" TEXT NOT NULL DEFAULT 'Boutique en ligne',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "product_sizes" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "order_events" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "admin_id" INTEGER,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "detail" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "size" TEXT,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "admin_id" INTEGER,
    "actor" TEXT NOT NULL,
    "order_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_events_order_id_created_at_idx" ON "order_events"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_created_at_idx" ON "stock_movements"("product_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_request_key_key" ON "orders"("request_key");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_payment_status_lifecycle_idx" ON "orders"("payment_status", "lifecycle");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

