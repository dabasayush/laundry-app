-- Create pickup settings table used for admin-managed pickup windows and instant fee
CREATE TABLE IF NOT EXISTS "pickup_settings" (
  "id" INTEGER PRIMARY KEY,
  "morning_start" VARCHAR(5) NOT NULL DEFAULT '09:00',
  "morning_end" VARCHAR(5) NOT NULL DEFAULT '11:00',
  "evening_start" VARCHAR(5) NOT NULL DEFAULT '16:00',
  "evening_end" VARCHAR(5) NOT NULL DEFAULT '19:00',
  "instant_enabled" BOOLEAN NOT NULL DEFAULT true,
  "instant_fee" DECIMAL(10, 2) NOT NULL DEFAULT 50,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "pickup_settings" (
  "id",
  "morning_start",
  "morning_end",
  "evening_start",
  "evening_end",
  "instant_enabled",
  "instant_fee"
)
VALUES (1, '09:00', '11:00', '16:00', '19:00', true, 50)
ON CONFLICT ("id") DO NOTHING;
