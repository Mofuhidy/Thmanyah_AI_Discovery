import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "edge"; // Re-enabled for Vercel Free Tier (Zero-Dollar Arch)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    // 1. Generate embedding via Gemini
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
      console.error("Gemini API Error:", embeddingData.error);
      return NextResponse.json(
        { error: embeddingData.error.message },
        { status: 500 },
      );
    }

    const vector = embeddingData.embedding?.values;
    if (!vector) {
      console.error("No vector returned from Gemini");
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 },
      );
    }

    // 2. Initialize Supabase Client (Edge Compatible)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });

    // 3. Perform Similarity Search
    const { data: chunks, error } = await supabase.rpc("match_chunks", {
      query_embedding: vector,
      match_threshold: 0.6, // Balanced threshold for Prod (0.60 ensures good recall)
      match_count: 10,
    });

    if (error) {
      console.error("Supabase RPC Error:", error);
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
