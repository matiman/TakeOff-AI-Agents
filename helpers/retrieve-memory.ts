import { cosineDistance, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { memoriesTable } from "../db/schema/memories-schema";
import { generateEmbedding } from "../generate-embedding";

export async function retrieveMemory(query: string, limit: number = 10, lessonIds?: string[]) {
  const embedding = await generateEmbedding(query);

  const similarity = sql<number>`1 - (${cosineDistance(memoriesTable.embedding, embedding)})`;

  const memories = await db.query.memories.findMany({
    orderBy: desc(similarity),
    limit: limit
  });

  return memories;
}
