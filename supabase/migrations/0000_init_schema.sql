-- Enable pgvector extension
create extension if not exists vector;

-- Create episodes table
create table if not exists episodes (
  id bigint primary key generated always as identity,
  title text not null,
  url text not null,
  published_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);

-- Create chunks table
create table if not exists chunks (
  id bigint primary key generated always as identity,
  episode_id bigint references episodes(id) on delete cascade,
  content text not null,
  start_time float not null,
  end_time float not null,
  embedding vector(768) -- Gemini dimension
);

-- Note: IVFFlat index is good for performance but requires data to be present for optimal building.
-- For production with many rows, HNSW is often preferred, but IVFFlat is fine for start.
-- create index on chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
-- We use HNSW for better recall/performance trade-off in modern pgvector
create index on chunks using hnsw (embedding vector_cosine_ops);
