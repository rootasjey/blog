INSERT OR IGNORE INTO post_blob_gc (
  post_id,
  slug,
  prefix,
  status,
  delete_after,
  quiet_until,
  created_at,
  updated_at
)
SELECT DISTINCT
  orphan.post_id,
  '',
  'posts/' || orphan.post_id || '/',
  'pending',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+1 day'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM (
  SELECT post_id FROM post_images
  UNION
  SELECT post_id FROM post_videos
  UNION
  SELECT post_id FROM post_audios
) orphan
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE posts.id = orphan.post_id);

DELETE FROM post_images
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE posts.id = post_images.post_id);

DELETE FROM post_videos
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE posts.id = post_videos.post_id);

DELETE FROM post_audios
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE posts.id = post_audios.post_id);

CREATE TRIGGER IF NOT EXISTS trg_posts_delete_media_metadata
AFTER DELETE ON posts
BEGIN
  DELETE FROM post_images WHERE post_id = OLD.id;
  DELETE FROM post_videos WHERE post_id = OLD.id;
  DELETE FROM post_audios WHERE post_id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_post_images_require_post
BEFORE INSERT ON post_images
WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = NEW.post_id)
BEGIN
  SELECT RAISE(ABORT, 'post image metadata requires an existing post');
END;

CREATE TRIGGER IF NOT EXISTS trg_post_videos_require_post
BEFORE INSERT ON post_videos
WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = NEW.post_id)
BEGIN
  SELECT RAISE(ABORT, 'post video metadata requires an existing post');
END;

CREATE TRIGGER IF NOT EXISTS trg_post_audios_require_post
BEFORE INSERT ON post_audios
WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = NEW.post_id)
BEGIN
  SELECT RAISE(ABORT, 'post audio metadata requires an existing post');
END;

CREATE TRIGGER IF NOT EXISTS trg_post_images_update_require_post
BEFORE UPDATE OF post_id ON post_images
WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = NEW.post_id)
BEGIN
  SELECT RAISE(ABORT, 'post image metadata requires an existing post');
END;

CREATE TRIGGER IF NOT EXISTS trg_post_videos_update_require_post
BEFORE UPDATE OF post_id ON post_videos
WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = NEW.post_id)
BEGIN
  SELECT RAISE(ABORT, 'post video metadata requires an existing post');
END;

CREATE TRIGGER IF NOT EXISTS trg_post_audios_update_require_post
BEFORE UPDATE OF post_id ON post_audios
WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = NEW.post_id)
BEGIN
  SELECT RAISE(ABORT, 'post audio metadata requires an existing post');
END;
