/*
# Convert vocab app to multi-user (owner-scoped) schema

1. Context
- The app previously used a single-tenant schema (no auth, anon-accessible).
- We now add sign-in/sign-up so each user's vocabulary, streak, and activity
  are private to them and accessible across devices.

2. Tables modified
- `vocab`: add `user_id uuid NOT NULL DEFAULT auth.uid()` referencing auth.users.
  - New index on (user_id, next_review_at) for per-user due queries.
- `app_state`: add `user_id uuid NOT NULL DEFAULT auth.uid()` and make it the
  primary key (drop the old integer id + singleton CHECK). One row per user.
- `activity_log`: add `user_id uuid NOT NULL DEFAULT auth.uid()` and a composite
  PK (user_id, date) so each user has one log row per day.

3. Security
- All RLS policies rewritten to `TO authenticated` with `auth.uid() = user_id`
  ownership checks. anon can no longer read or write any data.

4. Notes
- Existing rows were cleared before this migration so the NOT NULL DEFAULT
  auth.uid() ALTER succeeds.
- Each new user is auto-seeded with starter vocabulary on first sign-up.
*/

-- vocab: add owner column
ALTER TABLE vocab ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid();
ALTER TABLE vocab DROP CONSTRAINT IF EXISTS vocab_user_id_fkey;
ALTER TABLE vocab ADD CONSTRAINT vocab_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_vocab_user_next_review ON vocab(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_vocab_user_level ON vocab(user_id, srs_level);

-- app_state: per-user rows, user_id as PK
ALTER TABLE app_state ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid();
ALTER TABLE app_state DROP CONSTRAINT IF EXISTS app_state_singleton;
ALTER TABLE app_state DROP CONSTRAINT IF EXISTS app_state_pkey;
ALTER TABLE app_state DROP COLUMN IF EXISTS id;
ALTER TABLE app_state ADD CONSTRAINT app_state_pkey PRIMARY KEY (user_id);
ALTER TABLE app_state DROP CONSTRAINT IF EXISTS app_state_user_id_fkey;
ALTER TABLE app_state ADD CONSTRAINT app_state_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- activity_log: per-user daily rows
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid();
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_pkey;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_pkey PRIMARY KEY (user_id, date);
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, date);

-- ===== RLS: vocab =====
DROP POLICY IF EXISTS "anon_select_vocab" ON vocab;
DROP POLICY IF EXISTS "anon_insert_vocab" ON vocab;
DROP POLICY IF EXISTS "anon_update_vocab" ON vocab;
DROP POLICY IF EXISTS "anon_delete_vocab" ON vocab;

CREATE POLICY "select_own_vocab" ON vocab FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_vocab" ON vocab FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_vocab" ON vocab FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_vocab" ON vocab FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== RLS: app_state =====
DROP POLICY IF EXISTS "anon_select_app_state" ON app_state;
DROP POLICY IF EXISTS "anon_insert_app_state" ON app_state;
DROP POLICY IF EXISTS "anon_update_app_state" ON app_state;

CREATE POLICY "select_own_app_state" ON app_state FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_app_state" ON app_state FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_app_state" ON app_state FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_app_state" ON app_state FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== RLS: activity_log =====
DROP POLICY IF EXISTS "anon_select_activity_log" ON activity_log;
DROP POLICY IF EXISTS "anon_insert_activity_log" ON activity_log;
DROP POLICY IF EXISTS "anon_update_activity_log" ON activity_log;
DROP POLICY IF EXISTS "anon_delete_activity_log" ON activity_log;

CREATE POLICY "select_own_activity_log" ON activity_log FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_activity_log" ON activity_log FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_activity_log" ON activity_log FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_activity_log" ON activity_log FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
