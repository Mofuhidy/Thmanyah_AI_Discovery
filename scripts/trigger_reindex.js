import fetch from 'node-fetch';

// CONFIGURATION
const VERCEL_URL = process.argv[2]; // Pass URL as argument
const SECRET = "temp-reindex-2026";

if (!VERCEL_URL) {
  console.error("Please provide your Vercel URL. Example:");
  console.error("node scripts/trigger_reindex.js https://your-project.vercel.app");
  process.exit(1);
}

const BATCH_SIZE = 5;

async function triggerBatch(offset) {
  const url = `${VERCEL_URL}/api/reindex?secret=${SECRET}&offset=${offset}&limit=${BATCH_SIZE}`;
  console.log(`🚀 Triggering batch at offset ${offset}...`);
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API Error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("❌ Request Failed:", err.message);
    return null;
  }
}

async function run() {
  let offset = 0;
  let processing = true;
  let totalUpdated = 0;

  while (processing) {
    const result = await triggerBatch(offset);
    
    if (!result) {
        console.log("⚠️  Creating a pause and retrying...");
        await new Promise(r => setTimeout(r, 2000));
        continue;
    }

    if (result.count === 0 || (result.processed === 0 && !result.details?.length)) {
        console.log("✅ Re-indexing completed!");
        processing = false;
        break;
    }

    // Log details
    const successes = result.details.filter(d => d.status === 'success').length;
    const failures = result.details.filter(d => d.status !== 'success').length;
    totalUpdated += successes;

    console.log(`   Processed: ${result.processed} (✅ ${successes}, ❌ ${failures})`);
    
    // Check if we are done (if less returned than limit, probably done)
    if (result.processed < BATCH_SIZE) {
        console.log("✅ End of stream reached.");
        processing = false;
    } else {
        offset = result.next_offset;
        // Small delay to be nice to serverless limits
        await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log(`\n🎉 Total chunks updated: ${totalUpdated}`);
}

run();
