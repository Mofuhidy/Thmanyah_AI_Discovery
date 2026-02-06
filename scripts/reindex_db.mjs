import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import fetch from 'node-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !GEMINI_API_KEY) {
  console.error("Missing ENV variables");
  process.exit(1);
}

async function fetchChunks() {
  console.log(`Connecting to ${supabaseUrl}...`);
  // Fetch only 10 items to test connection, then we can loop if needed.
  // Or better: just fetch ALL but with a massive timeout? 
  // Let's try to fetch just IDs first to see if it works? No, we need content.
  // Let's try range.
  
  const response = await fetch(`${supabaseUrl}/rest/v1/chunks?select=id,content&limit=100`, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Range": "0-99"
    },
    timeout: 30000 
  });
  
  if (!response.ok) throw new Error(`Fetch Chunks Failed: ${response.statusText}`);
  return await response.json();
}

async function updateChunk(id, vector) {
  const response = await fetch(`${supabaseUrl}/rest/v1/chunks?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({ embedding: vector }),
    timeout: 60000
  });
  
  if (!response.ok) throw new Error(`Update Failed: ${response.statusText}`);
}

async function generateEmbedding(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: text }] },
        outputDimensionality: 768,
      }),
      timeout: 30000
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.embedding?.values;
  } catch (err) {
    console.error("Embedding Error:", err.message);
    return null;
  }
}

async function reindex() {
  console.log("Fetching chunks...");
  let chunks;
  try {
    chunks = await fetchChunks();
  } catch (err) {
    console.error("Critical Error Fetching Chunks:", err);
    return;
  }

  console.log(`Found ${chunks.length} chunks to re-index.`);

  let successCount = 0;
  let failCount = 0;

  for (const chunk of chunks) {
    console.log(`Processing chunk ID: ${chunk.id}`);
    const vector = await generateEmbedding(chunk.content);
    
    if (vector) {
      try {
        await updateChunk(chunk.id, vector);
        successCount++;
        // Rate limit: Sleep 500ms
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Failed to update chunk ${chunk.id}:`, err);
        failCount++;
      }
    } else {
      failCount++;
    }
  }

  console.log(`\nRe-indexing Complete!`);
  console.log(`✅ Updated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
}

reindex();

