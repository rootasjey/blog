-- Keep the legacy role column intact: its CHECK constraint only accepts
-- user/admin/moderator. New application authorization uses access_role.
ALTER TABLE users
  ADD COLUMN access_role TEXT NOT NULL DEFAULT 'reader'
  CHECK (access_role IN ('reader', 'writer', 'editor', 'admin'));

UPDATE users
SET access_role = CASE role
  WHEN 'admin' THEN 'admin'
  WHEN 'user' THEN 'editor'
  ELSE 'reader'
END;

CREATE TABLE IF NOT EXISTS post_collaborators (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by INTEGER NOT NULL REFERENCES users(id),
  can_edit INTEGER NOT NULL DEFAULT 1 CHECK (can_edit IN (0, 1)),
  can_publish INTEGER NOT NULL DEFAULT 0 CHECK (can_publish IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (can_publish = 0 OR can_edit = 1),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_collaborators_user_id
  ON post_collaborators(user_id);

INSERT OR IGNORE INTO site_settings (key, value)
VALUES ('editors_can_edit_all_articles', 'false');

ALTER TABLE api_keys
  ADD COLUMN scopes TEXT NOT NULL DEFAULT '["*"]' CHECK (json_valid(scopes));

ALTER TABLE api_keys
  ADD COLUMN post_ids TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(post_ids));

ALTER TABLE posts
  ADD COLUMN content_revision INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS post_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  blob_path TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  media_paths TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(media_paths)),
  source TEXT NOT NULL DEFAULT 'editor',
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (post_id, revision)
);

CREATE INDEX IF NOT EXISTS idx_post_revisions_post_created
  ON post_revisions(post_id, revision DESC);

ALTER TABLE ai_requests ADD COLUMN model TEXT;
ALTER TABLE ai_requests ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';
ALTER TABLE ai_requests ADD COLUMN duration_ms INTEGER;
ALTER TABLE ai_requests ADD COLUMN error_code TEXT;
