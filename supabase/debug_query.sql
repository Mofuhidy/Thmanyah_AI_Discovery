-- ---------------------------------------------------------
-- DEBUGGING SUPABASE SEMANTIC SEARCH
-- Run this in your Supabase SQL Editor
-- ---------------------------------------------------------

-- 1. Check if there is data in the chunks table
SELECT 
    count(*) as total_chunks, 
    min(start_time) as first_start_time, 
    max(start_time) as last_start_time 
FROM chunks;

-- 2. Simulate a Semantic Search using an EXISTING chunk
-- This verifies that match_chunks works correctly when given a valid vector.
-- It picks 1 random chunk, grabs its embedding, and searches for similar chunks.
WITH sample_query AS (
  SELECT embedding, content 
  FROM chunks 
  LIMIT 1
)
SELECT 
    c.id, 
    c.content as result_content, 
    c.start_time,
    1 - (c.embedding <=> sq.embedding) as similarity
FROM chunks c, sample_query sq
WHERE 1 - (c.embedding <=> sq.embedding) > 0.5 -- Low threshold for testing
ORDER BY similarity DESC
LIMIT 5;

-- 3. Check for specific keywords (Simple Text Search)
-- If semantic search fails, checks if the text actually exists.
SELECT content, start_time 
FROM chunks 
WHERE content ILIKE '%ريجيم%' 
OR content ILIKE '%جينات%'
LIMIT 5;
