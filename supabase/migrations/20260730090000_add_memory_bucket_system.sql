/*
# Add memory bucket system

1. New column
- `vocab.memory_bucket` stores the current study bucket for each word.
  - `flashcard`: default learning pool
  - `unremembered`: needs intensive review
  - `temporary`: currently being reinforced

2. Notes
- Existing rows are backfilled to `flashcard`.
- The old SRS columns remain for backward compatibility but are no longer used
  by the application logic.
*/

ALTER TABLE vocab
ADD COLUMN IF NOT EXISTS memory_bucket text NOT NULL DEFAULT 'flashcard';

UPDATE vocab
SET memory_bucket = 'flashcard'
WHERE memory_bucket IS NULL;

ALTER TABLE vocab
DROP CONSTRAINT IF EXISTS vocab_memory_bucket_check;

ALTER TABLE vocab
ADD CONSTRAINT vocab_memory_bucket_check
CHECK (memory_bucket IN ('flashcard', 'unremembered', 'temporary'));

CREATE INDEX IF NOT EXISTS idx_vocab_user_memory_bucket
ON vocab(user_id, memory_bucket);
