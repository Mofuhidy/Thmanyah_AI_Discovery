export interface Episode {
  id: number;
  title: string;
  url: string; // YouTube URL
  published_at: string;
  metadata?: Record<string, any>;
}

export interface Chunk {
  id: number;
  episode_id: number;
  content: string;
  start_time: number; // in seconds
  end_time: number;
  embedding?: number[]; // vector(768)
}

export interface SearchResult extends Chunk {
  similarity: number;
  episode_title: string;
  episode_url: string;
  thumbnail_url?: string;
}
