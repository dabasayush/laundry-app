-- Track driver accept/reject actions for assigned orders
CREATE TYPE "DriverOrderActionType" AS ENUM ('ACCEPT', 'REJECT');

CREATE TABLE "driver_order_actions" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "action" "DriverOrderActionType" NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "driver_order_actions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "driver_order_actions"
  ADD CONSTRAINT "driver_order_actions_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "driver_order_actions"
  ADD CONSTRAINT "driver_order_actions_driver_id_fkey"
  FOREIGN KEY ("driver_id") REFERENCES "drivers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "driver_order_actions_driver_id_created_at_idx"
  ON "driver_order_actions"("driver_id", "created_at");

CREATE INDEX "driver_order_actions_order_id_created_at_idx"
  ON "driver_order_actions"("order_id", "created_at");
