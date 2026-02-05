import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "edge"; // Re-enabled for Vercel Free Tier (Zero-Dollar Arch)
export const dynamic = "force-dynamic"; // Ensure no caching of results

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
    // APPEND TIMESTAMP to URL to ensure Gemini request is never cached
    const timestamp = Date.now();
    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}&_t=${timestamp}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text: query }] },
        }),
        cache: "no-store",
        next: { revalidate: 0 }, // Extra Next.js cache busting
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
      match_threshold: 0.3, // Lowered to 0.3 to find English/distant matches
      match_count: 10,
    });

    if (error) {
      console.error("Supabase RPC Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = NextResponse.json({
      results: chunks,
      debug: {
        original_query: query,
        vector_sample: vector ? vector.slice(0, 5) : "null", // Inspect first 5 dims
        timestamp: new Date().toISOString(),
      },
    });

    // Aggressive Cache Busting Headers
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");
    response.headers.set("X-Debug-Query", encodeURIComponent(query)); // Echo query to verify backend received it

    return response;
  } catch (err) {
    console.error("Search API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
