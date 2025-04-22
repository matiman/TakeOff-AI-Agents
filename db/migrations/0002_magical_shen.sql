ALTER TABLE "delivery" RENAME COLUMN "is_refunded" TO "is_rejected";--> statement-breakpoint
ALTER TABLE "delivery" RENAME COLUMN "refund_reason" TO "rejected_reason";