-- Add video_id column to episodes table (Unique identifier from YouTube)
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS video_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_episodes_video_id ON episodes(video_id);
