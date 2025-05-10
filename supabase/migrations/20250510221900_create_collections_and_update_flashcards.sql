-- Migration: create_collections_and_update_flashcards
-- Description: Adds a 'collections' table and modifies the 'flashcards' table
--              to support saving AI-generated flashcard collections with their review status.

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on collections.user_id
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

-- Enable Row Level Security on collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Policies for collections table
CREATE POLICY "Authenticated users can select their own collections" ON collections
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert their own collections" ON collections
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own collections" ON collections
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can delete their own collections" ON collections
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger for updated_at on collections
CREATE TRIGGER trig_collections_updated
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE PROCEDURE set_timestamp(); -- Assumes set_timestamp function exists from previous migration

-- Modify flashcards table
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ai_modified_by_user BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (ai_approval_status IN ('pending', 'accepted', 'rejected'));

-- Index on flashcards.collection_id
CREATE INDEX IF NOT EXISTS idx_flashcards_collection_id ON flashcards(collection_id);

-- Note: Existing RLS policies on 'flashcards' table should still apply appropriately.
-- If specific access control related to 'collection_id' is needed for flashcards,
-- those policies might need to be reviewed or augmented. 