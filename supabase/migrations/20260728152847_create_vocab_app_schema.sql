/*
# Create vocabulary flashcard app schema (single-tenant, no auth)

1. New Tables
- `vocab`: stores each Chinese vocabulary word with its SRS scheduling state.
  - hanzi (text, not null): the Chinese characters
  - pinyin (text, not null): pinyin with tone marks
  - hanviet (text, nullable): Sino-Vietnamese reading
  - meaning (text, not null): Vietnamese meaning
  - example (text, nullable): example sentence or note
  - srs_level (int, default 0): mastery level 0..5
  - ease_factor (real, default 2.5): Anki-style ease factor
  - interval_days (int, default 0): current interval in days
  - repetitions (int, default 0): number of correct answers
  - lapses (int, default 0): number of times forgotten
  - next_review_at (date, default today): when the word is due again
  - last_reviewed_at (date, nullable): last review date
  - created_at (timestamptz, default now)
- `app_state`: singleton row holding the daily streak and last activity date.
  - id (int, primary key, always 1)
  - streak_count (int, default 0)
  - last_activity_date (date, nullable)
  - total_reviews (int, default 0)
- `activity_log`: one row per day recording reviews and new-word additions for the stats chart.
  - date (date, primary key)
  - reviewed (int, default 0)
  - added (int, default 0)

2. Security
- All tables are single-tenant (no sign-in), so RLS uses `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because the data is intentionally shared/public.
*/

CREATE TABLE IF NOT EXISTS vocab (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hanzi text NOT NULL,
  pinyin text NOT NULL,
  hanviet text,
  meaning text NOT NULL,
  example text,
  srs_level int NOT NULL DEFAULT 0,
  ease_factor real NOT NULL DEFAULT 2.5,
  interval_days int NOT NULL DEFAULT 0,
  repetitions int NOT NULL DEFAULT 0,
  lapses int NOT NULL DEFAULT 0,
  next_review_at date NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vocab ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vocab" ON vocab;
CREATE POLICY "anon_select_vocab" ON vocab FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vocab" ON vocab;
CREATE POLICY "anon_insert_vocab" ON vocab FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_vocab" ON vocab;
CREATE POLICY "anon_update_vocab" ON vocab FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vocab" ON vocab;
CREATE POLICY "anon_delete_vocab" ON vocab FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_vocab_next_review ON vocab(next_review_at);
CREATE INDEX IF NOT EXISTS idx_vocab_srs_level ON vocab(srs_level);

CREATE TABLE IF NOT EXISTS app_state (
  id int PRIMARY KEY DEFAULT 1,
  streak_count int NOT NULL DEFAULT 0,
  last_activity_date date,
  total_reviews int NOT NULL DEFAULT 0,
  CONSTRAINT app_state_singleton CHECK (id = 1)
);

INSERT INTO app_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_state" ON app_state;
CREATE POLICY "anon_select_app_state" ON app_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_app_state" ON app_state;
CREATE POLICY "anon_update_app_state" ON app_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_app_state" ON app_state;
CREATE POLICY "anon_insert_app_state" ON app_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS activity_log (
  date date PRIMARY KEY,
  reviewed int NOT NULL DEFAULT 0,
  added int NOT NULL DEFAULT 0
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_activity_log" ON activity_log;
CREATE POLICY "anon_select_activity_log" ON activity_log FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_activity_log" ON activity_log;
CREATE POLICY "anon_insert_activity_log" ON activity_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_activity_log" ON activity_log;
CREATE POLICY "anon_update_activity_log" ON activity_log FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_activity_log" ON activity_log;
CREATE POLICY "anon_delete_activity_log" ON activity_log FOR DELETE
  TO anon, authenticated USING (true);
