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
