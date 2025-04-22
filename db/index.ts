import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { customersTable } from "./schema/customers-schema";
import { memoriesTable } from "./schema/memories-schema";
import { deliveryTable } from "./schema/delivery-schema";
config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const dbSchema = {
  // Tables
  memories: memoriesTable,
  customers: customersTable,
  delivery: deliveryTable
};

function initializeDb(url: string) {
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema: dbSchema });
}

export const db = initializeDb(databaseUrl);
