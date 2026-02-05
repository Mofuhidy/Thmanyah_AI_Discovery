create or replace function match_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  start_time float,
  end_time float,
  similarity float,
  episode_title text,
  episode_url text
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.content,
    c.start_time,
    c.end_time,
    1 - (c.embedding <=> query_embedding) as similarity,
    e.title as episode_title,
    e.url as episode_url
  from chunks c
  join episodes e on c.episode_id = e.id
  where 1 - (c.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
