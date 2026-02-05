import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "edge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query)
      return NextResponse.json({ error: "Query required" }, { status: 400 });

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API Key not configured" },
        { status: 500 },
      );
    }

    // Generate embedding
    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: query }] },
        }),
      },
    );

    const embeddingData = await embeddingResponse.json();

    if (embeddingData.error) {
      console.error("Gemini Error:", embeddingData.error);
      return NextResponse.json(
        { error: embeddingData.error.message },
        { status: 500 },
      );
    }

    if (!embeddingData.embedding) {
      console.error("Gemini Error: No embedding returned", embeddingData);
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 },
      );
    }

    const vector = embeddingData.embedding.values;

    const { data: chunks, error } = await supabase.rpc("match_chunks", {
      query_embedding: vector,
      match_threshold: 0.65, // Increased threshold for higher relevance
      match_count: 10,
    });

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ results: chunks });
  } catch (err) {
    console.error("Search API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
