CREATE TABLE IF NOT EXISTS post_blob_gc (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  slug TEXT NOT NULL,
  prefix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deleting', 'deleted')),
  delete_after TEXT NOT NULL,
  quiet_until TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_blob_gc_due
  ON post_blob_gc(status, delete_after);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_blob_gc_post_prefix
  ON post_blob_gc(post_id, prefix);

CREATE TRIGGER IF NOT EXISTS trg_posts_slug_gc_reservation_insert
BEFORE INSERT ON posts
WHEN EXISTS (
  SELECT 1
  FROM post_blob_gc gc
  WHERE gc.status IN ('pending', 'deleting')
    AND (
      gc.prefix = 'posts/' || NEW.slug || '/'
      OR substr(gc.prefix, 1, length('posts/' || NEW.slug || '/')) = 'posts/' || NEW.slug || '/'
      OR substr('posts/' || NEW.slug || '/', 1, length(gc.prefix)) = gc.prefix
    )
)
BEGIN
  SELECT RAISE(ABORT, 'post blob namespace is reserved for cleanup');
END;

CREATE TRIGGER IF NOT EXISTS trg_posts_slug_gc_reservation_update
BEFORE UPDATE OF slug ON posts
WHEN NEW.slug != OLD.slug
  AND EXISTS (
    SELECT 1
    FROM post_blob_gc gc
    WHERE gc.status IN ('pending', 'deleting')
      AND (
        gc.prefix = 'posts/' || NEW.slug || '/'
        OR substr(gc.prefix, 1, length('posts/' || NEW.slug || '/')) = 'posts/' || NEW.slug || '/'
        OR substr('posts/' || NEW.slug || '/', 1, length(gc.prefix)) = gc.prefix
      )
  )
BEGIN
  SELECT RAISE(ABORT, 'post blob namespace is reserved for cleanup');
END;
