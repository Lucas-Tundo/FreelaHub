-- FreelaBoard — schema SQLite

CREATE TABLE IF NOT EXISTS opportunities (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  kind            TEXT    NOT NULL DEFAULT 'freelance'
                  CHECK(kind IN ('freelance', 'vaga')),
  platform        TEXT    NOT NULL,
  external_id     TEXT    NOT NULL,
  url             TEXT    NOT NULL,
  title           TEXT    NOT NULL,
  description     TEXT    NOT NULL DEFAULT '',
  budget          REAL,
  budget_currency TEXT    DEFAULT 'BRL',
  proposals_count INTEGER DEFAULT 0,
  client_country  TEXT,
  client_verified INTEGER DEFAULT 0,
  company_name    TEXT,
  location        TEXT,
  remote          INTEGER NOT NULL DEFAULT 0,
  employment_type TEXT,
  salary_min      REAL,
  salary_max      REAL,
  posted_at       TEXT    NOT NULL,
  score           REAL    NOT NULL DEFAULT 0,
  score_breakdown TEXT    NOT NULL DEFAULT '{}',
  content_hash    TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_opportunities_score ON opportunities(score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_platform ON opportunities(platform);
CREATE INDEX IF NOT EXISTS idx_opportunities_posted_at ON opportunities(posted_at DESC);

CREATE TABLE IF NOT EXISTS proposals (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  opportunity_id    INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  template_used     TEXT    NOT NULL DEFAULT 'default',
  body              TEXT    NOT NULL,
  is_weak           INTEGER NOT NULL DEFAULT 0,
  weak_reason       TEXT,
  generated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  regenerated_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(opportunity_id)
);

CREATE TABLE IF NOT EXISTS tracking (
  opportunity_id  INTEGER PRIMARY KEY REFERENCES opportunities(id) ON DELETE CASCADE,
  status          TEXT    NOT NULL DEFAULT 'nova'
                  CHECK(status IN ('nova','descartada','enviada','respondeu','fechou','perdeu')),
  sent_at         TEXT,
  replied_at      TEXT,
  closed_value    REAL,
  notes           TEXT    DEFAULT '',
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  platform    TEXT,
  level       TEXT    NOT NULL CHECK(level IN ('info','warn','error')),
  message     TEXT    NOT NULL,
  metadata    TEXT    DEFAULT '{}',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_level ON activity_log(level);
