---
trigger: always_on
---

Rule 1: Performance or Death (Lighthouse 100/100)
Server-First: Prioritize React Server Components (RSC). Use 'use client' only for interactive UI elements.

Asset Optimization: All images must use next/image with WebP format. No heavy external libraries.

Zero Bloat: If a feature can be done with vanilla CSS/JS instead of a library, do it.

Rule 2: The Zero-Dollar Architecture
Vector Optimization: Use 768-dimension embeddings (Gemini) instead of 1536 (OpenAI) to save Supabase storage space.

Edge Runtime: Execute API routes on the Edge to reduce latency and stay within Vercel’s free execution limits.

Smart Chunking: Split transcripts into meaningful segments (approx. 300-500 characters) to ensure high search relevance without hitting token limits.

Rule 3: RTL & Arabic First
Native Support: Use dir="rtl" and fonts like 'Readex Pro'.

Contextual Awareness: The AI must understand Saudi dialect nuances when processing search queries.

UI/UX: Ensure the layout is mirrored correctly for Arabic users without breaking the "Antigravity" speed.

Rule 4: Security & Clean Code
Env Management: Never hardcode keys. Use .env.local.

Type Safety: Strict TypeScript implementation for all components and database schemas.

Database Hygiene: Write SQL migrations for Supabase that include indices for pgvector (IVFFlat or HNSW) to keep searches fast as the data grows.

Rule 5: Evolutionary Coding (PoC Focus)
Modular Build: Build the data pipeline (Colab) first, then the database schema, then the UI.

Fail Fast: If a free tier limit is reached, find a technical workaround (e.g., caching) rather than suggesting a paid upgrade.

Rule 6: use the skills that we have globally:

1. Frontend design
2. UX pro max
3. Vercel react next best practices
4. behavioral

Rule 7: The "Thamanya" Aesthetic (Visual Identity)
Typography: Thamanya uses a distinct, clean sans-serif. Since we are on a $0 budget, use 'Readex Pro' (Google Fonts) or 'IBM Plex Sans Arabic'. Set the weight to 500 for body and 700 for headings to mimic their editorial weight.

Simplicity (The 80/20 Rule): Thamanya’s design is "Content-First." Remove all borders, shadows, and gradients. Use a strict monochrome palette: #000000 (Text) and #FFFFFF (Background), with a very subtle #F9F9F9 for card backgrounds.

Iconography: Use Lucide-React but keep them thin (stroke-width={1.5}) to maintain that high-end, minimal look.

Rule 8: Behavioral UX (The "Discovery" Flow)
Micro-interactions: Instead of a standard "Search" button, use an "Instant Results" pattern where results appear as the user stops typing (debounced).

The "Moment" Preview: When a user clicks a result, show a small "context card" explaining the guest’s vibe at that moment before they jump to YouTube.

Rule 9: Engineering for the Saudi Dialect
Semantic Pre-processing: Since Thamanya is heavily Saudi-dialect based, add a rule for the AI: "Always normalize Saudi slang (e.g., 'وش صار', 'هقوتي') into semantic concepts before embedding to ensure the vector matches the formal Arabic transcript if Whisper formalizes it."
