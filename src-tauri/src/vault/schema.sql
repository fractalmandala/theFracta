-- The notes vault index.
--
-- This is a derived cache, not an archive: every row can be rebuilt by reading
-- the user's markdown again, and a schema change drops and rebuilds it. The
-- vault itself is only ever read.
--
-- Identity is file.id. Backlinks and full-text rows hang off it, so preserving
-- the id across a move preserves both.

PRAGMA journal_mode = WAL;
PRAGMA synchronous  = NORMAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vault (
  id              INTEGER PRIMARY KEY,
  root            TEXT    NOT NULL UNIQUE,   -- canonicalised absolute path
  label           TEXT    NOT NULL,
  added_at        INTEGER NOT NULL,
  scan_started_at INTEGER,
  discovered_at   INTEGER,                   -- metadata pass finished
  indexed_at      INTEGER,                   -- body pass finished; NULL = never
  last_delta_at   INTEGER,
  last_error      TEXT
);

CREATE TABLE IF NOT EXISTS dir (
  id            INTEGER PRIMARY KEY,
  vault_id      INTEGER NOT NULL REFERENCES vault(id) ON DELETE CASCADE,
  rel_path      TEXT    NOT NULL,            -- '' is the vault root
  parent_rel    TEXT,                        -- NULL only for the root row
  name          TEXT    NOT NULL,
  file_count    INTEGER NOT NULL DEFAULT 0,  -- direct markdown children
  subtree_count INTEGER NOT NULL DEFAULT 0,  -- markdown files below, inclusive
  missing_since INTEGER,
  UNIQUE(vault_id, rel_path)
);
CREATE INDEX IF NOT EXISTS dir_parent ON dir(vault_id, parent_rel, name);

CREATE TABLE IF NOT EXISTS file (
  id            INTEGER PRIMARY KEY,
  vault_id      INTEGER NOT NULL REFERENCES vault(id) ON DELETE CASCADE,
  rel_path      TEXT    NOT NULL,
  parent_rel    TEXT    NOT NULL,            -- '' for children of the root
  name          TEXT    NOT NULL,            -- with extension
  stem_fold     TEXT    NOT NULL,            -- lowercased stem; the wikilink key
  ext           TEXT    NOT NULL,
  mtime_ms      INTEGER NOT NULL,
  size          INTEGER NOT NULL,
  inode         INTEGER,                     -- move detection
  content_hash  TEXT,                        -- set by the body pass
  title         TEXT,                        -- frontmatter title > first H1 > stem
  indexed_at    INTEGER,                     -- NULL = discovered, body unread
  skip_reason   TEXT,                        -- 'too_large' | 'unreadable' | 'not_utf8'
  missing_since INTEGER,                     -- soft delete; kept for backlinks
  UNIQUE(vault_id, rel_path)
);
CREATE INDEX IF NOT EXISTS file_parent ON file(vault_id, parent_rel, name);
CREATE INDEX IF NOT EXISTS file_stem   ON file(vault_id, stem_fold);
CREATE INDEX IF NOT EXISTS file_mtime  ON file(vault_id, mtime_ms DESC);
CREATE INDEX IF NOT EXISTS file_inode  ON file(vault_id, inode);
CREATE INDEX IF NOT EXISTS file_hash   ON file(vault_id, content_hash);

-- Plain FTS5, not contentless and not external-content: those cannot produce
-- snippet(), and a search result without a snippet is a filename list.
CREATE VIRTUAL TABLE IF NOT EXISTS note_fts USING fts5(
  title,
  body,
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TABLE IF NOT EXISTS alias (
  file_id   INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  vault_id  INTEGER NOT NULL REFERENCES vault(id) ON DELETE CASCADE,
  name_fold TEXT    NOT NULL,
  PRIMARY KEY (file_id, name_fold)
);
CREATE INDEX IF NOT EXISTS alias_name ON alias(vault_id, name_fold);

CREATE TABLE IF NOT EXISTS link (
  id           INTEGER PRIMARY KEY,
  vault_id     INTEGER NOT NULL REFERENCES vault(id) ON DELETE CASCADE,
  src_file_id  INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  kind         TEXT    NOT NULL,   -- 'wiki' | 'embed' | 'md'
  raw_target   TEXT    NOT NULL,   -- as written, minus alias and fragment
  target_fold  TEXT    NOT NULL,   -- normalised resolution key
  alias_text   TEXT,
  fragment     TEXT,
  dest_file_id INTEGER REFERENCES file(id) ON DELETE SET NULL,
  resolution   TEXT    NOT NULL,   -- 'exact'|'stem'|'alias'|'ambiguous'|'missing'
  line         INTEGER NOT NULL,
  context      TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS link_src  ON link(src_file_id);
CREATE INDEX IF NOT EXISTS link_dest ON link(dest_file_id);
CREATE INDEX IF NOT EXISTS link_open ON link(vault_id, target_fold);

CREATE TABLE IF NOT EXISTS tag (
  id       INTEGER PRIMARY KEY,
  vault_id INTEGER NOT NULL REFERENCES vault(id) ON DELETE CASCADE,
  name     TEXT    NOT NULL,       -- case-folded, no leading '#'
  UNIQUE(vault_id, name)
);
CREATE TABLE IF NOT EXISTS file_tag (
  file_id INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tag(id)  ON DELETE CASCADE,
  source  TEXT    NOT NULL,        -- 'frontmatter' | 'inline'
  PRIMARY KEY (file_id, tag_id, source)
);
CREATE INDEX IF NOT EXISTS file_tag_tag ON file_tag(tag_id);
