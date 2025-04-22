//Create a schema for the delivery table

import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const deliveryTable = pgTable("delivery", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(),
  deliveryStatus: varchar("delivery_status", { length: 255 }).notNull(),
  isRejected: boolean("is_rejected").notNull().default(false),
  rejectedReason: text("rejected_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type InsertDelivery = typeof deliveryTable.$inferInsert;
export type SelectDelivery = typeof deliveryTable.$inferSelect;

/**
 * INSERT INTO delivery (order_id, delivery_status, is_rejected, rejected_reason) VALUES
  -- Row 1: Order shipped recently, not rejected
  ('a1b2c3d4-e5f6-4890-8234-567890abcdef', 'shipped', false, NULL), -- Corrected UUID

  -- Row 2: Order currently out for delivery, not rejected
  ('f0e9d8c7-b6a5-4321-bedc-ba9876543210', 'out for delivery', false, NULL), -- Corrected UUID

  -- Row 3: Order delivered, but rejected due to damage
  ('123e4567-e89b-12d3-a456-426614174000', 'delivered', true, 'Package arrived damaged'), -- Corrected UUID

  -- Row 4: Order still pending processing, not rejected
  ('abcdef12-3456-4890-fedc-ba9876543210', 'pending', false, NULL), -- Corrected UUID

  -- Row 5: Order cancelled and rejected (e.g., payment issue before shipping)
  ('87654321-0987-4fed-bcba-012345abcdef', 'cancelled', true, 'Payment failed'); -- Corrected UUID

-- Note: id, created_at, and updated_at will be automatically populated
-- by the database defaults/triggers.
 * **/
