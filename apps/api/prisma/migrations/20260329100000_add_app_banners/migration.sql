-- CreateTable
CREATE TABLE "app_banners" (
    "id" UUID NOT NULL,
    "title" VARCHAR(150),
    "image_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_banners_is_active_sort_order_idx" ON "app_banners"("is_active", "sort_order");
