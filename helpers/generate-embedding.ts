import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });

const EMBEDDING_MODEL = "text-embedding-3-small";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      dimensions: 256,
      input: text
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}
