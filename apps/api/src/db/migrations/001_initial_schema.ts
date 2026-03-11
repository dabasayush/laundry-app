import type { Knex } from "knex";

// ─── USERS ────────────────────────────────────────────────────────────────────
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("name", 100).notNullable();
    t.string("email", 255).notNullable().unique();
    t.string("phone", 20).notNullable().unique();
    t.string("password_hash").notNullable();
    t.enum("role", ["customer", "driver", "admin"])
      .notNullable()
      .defaultTo("customer");
    t.string("fcm_token").nullable();
    t.boolean("is_verified").notNullable().defaultTo(false);
    t.boolean("is_active").notNullable().defaultTo(true);
    t.jsonb("address").nullable();
    t.timestamps(true, true);
  });

  // ─── SERVICES ──────────────────────────────────────────────────────────────
  await knex.schema.createTable("services", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("name", 100).notNullable();
    t.text("description").nullable();
    t.decimal("price_per_kg", 10, 2).notNullable();
    t.integer("estimated_hours").notNullable();
    t.boolean("is_active").notNullable().defaultTo(true);
    t.string("icon_url").nullable();
    t.timestamps(true, true);
  });

  // ─── SLOTS ─────────────────────────────────────────────────────────────────
  await knex.schema.createTable("slots", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.date("date").notNullable();
    t.time("start_time").notNullable();
    t.time("end_time").notNullable();
    t.integer("capacity").notNullable().defaultTo(10);
    t.integer("booked_count").notNullable().defaultTo(0);
    t.boolean("is_active").notNullable().defaultTo(true);
    t.unique(["date", "start_time"]);
    t.timestamps(true, true);
  });

  // ─── ORDERS ────────────────────────────────────────────────────────────────
  await knex.schema.createTable("orders", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("customer_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT");
    t.uuid("service_id")
      .notNullable()
      .references("id")
      .inTable("services")
      .onDelete("RESTRICT");
    t.uuid("pickup_slot_id")
      .notNullable()
      .references("id")
      .inTable("slots")
      .onDelete("RESTRICT");
    t.uuid("delivery_slot_id")
      .notNullable()
      .references("id")
      .inTable("slots")
      .onDelete("RESTRICT");
    t.uuid("driver_id")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    t.enum("status", [
      "pending",
      "confirmed",
      "picked_up",
      "processing",
      "ready_for_delivery",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ])
      .notNullable()
      .defaultTo("pending");
    t.decimal("weight_kg", 8, 2).nullable();
    t.decimal("amount", 10, 2).nullable();
    t.jsonb("pickup_address").notNullable();
    t.jsonb("delivery_address").notNullable();
    t.text("special_instructions").nullable();
    t.string("stripe_payment_intent_id").nullable();
    t.enum("payment_status", ["unpaid", "paid", "refunded"])
      .notNullable()
      .defaultTo("unpaid");
    t.timestamps(true, true);
  });

  // ─── ORDER STATUS HISTORY ──────────────────────────────────────────────────
  await knex.schema.createTable("order_status_history", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("order_id")
      .notNullable()
      .references("id")
      .inTable("orders")
      .onDelete("CASCADE");
    t.string("status").notNullable();
    t.text("notes").nullable();
    t.uuid("changed_by")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // ─── TRANSACTIONS ──────────────────────────────────────────────────────────
  await knex.schema.createTable("transactions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("order_id")
      .notNullable()
      .references("id")
      .inTable("orders")
      .onDelete("RESTRICT");
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT");
    t.decimal("amount", 10, 2).notNullable();
    t.enum("type", ["charge", "refund"]).notNullable();
    t.string("stripe_charge_id").nullable();
    t.enum("status", ["pending", "succeeded", "failed"])
      .notNullable()
      .defaultTo("pending");
    t.timestamps(true, true);
  });

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
  await knex.schema.createTable("notifications", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.string("title").notNullable();
    t.text("body").notNullable();
    t.jsonb("data").nullable();
    t.boolean("is_read").notNullable().defaultTo(false);
    t.timestamp("sent_at").nullable();
    t.timestamps(true, true);
  });

  // ─── REFRESH TOKENS ────────────────────────────────────────────────────────
  await knex.schema.createTable("refresh_tokens", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.string("token_hash").notNullable().unique();
    t.string("device_info").nullable();
    t.boolean("is_revoked").notNullable().defaultTo(false);
    t.timestamp("expires_at").notNullable();
    t.timestamps(true, true);
  });

  // ─── Indexes ───────────────────────────────────────────────────────────────
  await knex.schema.raw(
    "CREATE INDEX idx_orders_customer_id ON orders(customer_id)",
  );
  await knex.schema.raw("CREATE INDEX idx_orders_status ON orders(status)");
  await knex.schema.raw(
    "CREATE INDEX idx_orders_driver_id ON orders(driver_id)",
  );
  await knex.schema.raw(
    "CREATE INDEX idx_notifications_user_id ON notifications(user_id)",
  );
  await knex.schema.raw(
    "CREATE INDEX idx_order_history_order_id ON order_status_history(order_id)",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("refresh_tokens");
  await knex.schema.dropTableIfExists("notifications");
  await knex.schema.dropTableIfExists("transactions");
  await knex.schema.dropTableIfExists("order_status_history");
  await knex.schema.dropTableIfExists("orders");
  await knex.schema.dropTableIfExists("slots");
  await knex.schema.dropTableIfExists("services");
  await knex.schema.dropTableIfExists("users");
}
