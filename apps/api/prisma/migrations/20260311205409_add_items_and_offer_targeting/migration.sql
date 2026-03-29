-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "applicable_item_id" UUID,
ADD COLUMN     "applicable_service_id" UUID;

-- AlterTable
ALTER TABLE "service_items" ADD COLUMN     "item_id" UUID;

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_name_key" ON "items"("name");

-- CreateIndex
CREATE INDEX "service_items_item_id_idx" ON "service_items"("item_id");

-- AddForeignKey
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
