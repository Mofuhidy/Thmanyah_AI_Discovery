
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing in environment variables.");
  process.exit(1);
}

async function checkDimension(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`;
  
  console.log(`Checking model: ${modelName}`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: "Hello world" }] },
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error(`Error for ${modelName}:`, data.error.message);
      return;
    }

    const vector = data.embedding?.values;
    if (vector) {
      console.log(`✅ Model ${modelName} returned vector with length: ${vector.length}`);
    } else {
      console.error(`❌ No vector returned for ${modelName}`);
    }
  } catch (err) {
    console.error(`Failed to fetch for ${modelName}:`, err);
  }
}

// Check both potential models
console.log("Starting diagnostic...");
await checkDimension("gemini-embedding-001");
await checkDimension("text-embedding-004");
