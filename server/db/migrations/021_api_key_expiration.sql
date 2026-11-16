ALTER TABLE api_keys
  ADD COLUMN expires_at TEXT;

UPDATE api_keys
SET expires_at = datetime('now', '+90 days')
WHERE expires_at IS NULL;
