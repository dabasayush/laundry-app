/*
  Warnings:

  - You are about to drop the column `pickup_option` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_surcharge` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `pickup_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DriverDocumentType" AS ENUM ('LICENSE', 'ID_PROOF', 'VEHICLE_RC', 'INSURANCE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CancellationReason" AS ENUM ('CUSTOMER_REQUEST', 'OUT_OF_STOCK', 'DRIVER_UNAVAILABLE', 'TECHNICAL_ISSUE', 'OTHER');

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "total_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN     "user_id" UUID,
ADD COLUMN     "vehicle_type" VARCHAR(50),
ALTER COLUMN "password_hash" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "pickup_option",
DROP COLUMN "pickup_surcharge",
ADD COLUMN     "cancellation_reason" "CancellationReason",
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "login_attempts" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "pickup_settings";

-- CreateTable
CREATE TABLE "driver_documents" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "type" "DriverDocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "verified" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earnings" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "order_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DELIVERY',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "driver_documents_driver_id_idx" ON "driver_documents"("driver_id");

-- CreateIndex
CREATE INDEX "driver_documents_verified_idx" ON "driver_documents"("verified");

-- CreateIndex
CREATE INDEX "earnings_driver_id_idx" ON "earnings"("driver_id");

-- CreateIndex
CREATE INDEX "earnings_earned_at_idx" ON "earnings"("earned_at");

-- CreateIndex
CREATE INDEX "earnings_status_idx" ON "earnings"("status");

-- CreateIndex
CREATE INDEX "drivers_user_id_idx" ON "drivers"("user_id");

-- CreateIndex
CREATE INDEX "drivers_is_active_idx" ON "drivers"("is_active");

-- CreateIndex
CREATE INDEX "drivers_is_available_idx" ON "drivers"("is_available");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
