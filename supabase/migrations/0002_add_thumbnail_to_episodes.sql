-- Add thumbnail_url column to episodes table
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Comment on column
COMMENT ON COLUMN episodes.thumbnail_url IS 'URL of the video thumbnail from YouTube';
