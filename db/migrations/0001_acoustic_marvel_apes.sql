ALTER TABLE "delivery" ADD COLUMN "is_refunded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery" ADD COLUMN "refund_reason" text;