-- Add pickup_option and pickup_surcharge columns to orders table
ALTER TABLE "orders" ADD COLUMN "pickup_option" VARCHAR(20);
ALTER TABLE "orders" ADD COLUMN "pickup_surcharge" DECIMAL(10, 2);
