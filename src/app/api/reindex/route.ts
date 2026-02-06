import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "edge"; // Use Edge for better connectivity/timeout handling

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

export async function GET(req: Request) {
  // 1. Security Check: CRON_SECRET or Bearer Token
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse Params
  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get("offset") || "0");
  const limit = parseInt(searchParams.get("limit") || "5"); // Small batch to avoid execution timeout

  if (!supabaseUrl || !supabaseKey || !GEMINI_API_KEY) {
    return NextResponse.json({ error: "Missing Config" }, { status: 500 });
  }

  // 3. Init Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 4. Fetch Chunks (Range)
  const { data: chunks, error } = await supabase
    .from("chunks")
    .select("id, content")
    .range(offset, offset + limit - 1)
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!chunks || chunks.length === 0) {
    return NextResponse.json({ message: "No more chunks found", count: 0 });
  }

  const results = [];

  // 5. Process Each Chunk
  for (const chunk of chunks) {
    try {
      // A. Generate Embedding
      const embeddingResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: { parts: [{ text: chunk.content }] },
            outputDimensionality: 768, // FORCE 768
          }),
        },
      );

      const embeddingData = await embeddingResponse.json();
      const vector = embeddingData.embedding?.values;

      if (!vector) {
        results.push({ id: chunk.id, status: "failed", error: "No vector" });
        continue;
      }

      // B. Update Supabase
      const { error: updateError } = await supabase
        .from("chunks")
        .update({ embedding: vector })
        .eq("id", chunk.id);

      if (updateError) {
        results.push({
          id: chunk.id,
          status: "failed",
          error: updateError.message,
        });
      } else {
        results.push({ id: chunk.id, status: "success" });
      }
    } catch (err: any) {
      results.push({ id: chunk.id, status: "error", error: err.message });
    }
  }

  // 6. Return Summary
  return NextResponse.json({
    message: "Batch processed",
    processed: results.length,
    next_offset: offset + limit,
    details: results,
  });
}
