CREATE TABLE post_authors (
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO post_authors (post_id, user_id, position)
SELECT id, user_id, 0 FROM posts;

CREATE INDEX idx_post_authors_user_id ON post_authors(user_id, post_id);
