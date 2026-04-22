import aiosqlite
from app.config import get_settings

_db_path: str = ""


def init_db_path():
    global _db_path
    _db_path = get_settings().database_url


async def get_db():
    async with aiosqlite.connect(_db_path) as db:
        db.row_factory = aiosqlite.Row
        yield db


CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS qa_reviews (
    call_id     TEXT NOT NULL,
    schema      TEXT NOT NULL,
    overall_score INTEGER,
    rubric_json TEXT DEFAULT '{}',
    reviewed_by TEXT,
    reviewed_at TEXT,
    qa_status   TEXT DEFAULT 'unreviewed',
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (call_id, schema)
);

CREATE TABLE IF NOT EXISTS qa_comments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    call_id     TEXT NOT NULL,
    schema      TEXT NOT NULL,
    text        TEXT NOT NULL,
    timestamp_anchor REAL,
    author      TEXT DEFAULT 'QA Analyst',
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS call_metadata_cache (
    call_id       TEXT NOT NULL,
    schema        TEXT NOT NULL,
    call_date     TEXT NOT NULL,
    customer_phone TEXT,
    agent_id      TEXT,
    audio_key     TEXT,
    file_size     INTEGER,
    cached_at     TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (call_id, schema)
);

CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'qa_analyst',
    display_name TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transcriptions (
    call_id         TEXT NOT NULL,
    schema          TEXT NOT NULL,
    job_name        TEXT,
    status          TEXT DEFAULT 'pending',
    language_code   TEXT,
    utterances_json TEXT DEFAULT '[]',
    error_message   TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (call_id, schema)
);

CREATE INDEX IF NOT EXISTS idx_comments_call ON qa_comments(call_id, schema);
CREATE INDEX IF NOT EXISTS idx_cache_date ON call_metadata_cache(schema, call_date);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
"""


async def create_tables():
    async with aiosqlite.connect(_db_path) as db:
        for stmt in CREATE_TABLES_SQL.split(";"):
            stmt = stmt.strip()
            if stmt:
                await db.execute(stmt)
        await db.commit()
        # Safe migrations for existing databases
        for col_sql in [
            "ALTER TABLE qa_reviews ADD COLUMN good_to_share INTEGER DEFAULT 0",
        ]:
            try:
                await db.execute(col_sql)
                await db.commit()
            except Exception:
                pass  # column already exists
        await _seed_users(db)


async def _seed_users(db):
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    seeds = [
        ("analyst",    pwd.hash("analyst123"),   "qa_analyst",  "QA Analyst"),
        ("supervisor", pwd.hash("supervisor123"), "supervisor",  "Supervisor"),
    ]
    for username, pw_hash, role, display_name in seeds:
        await db.execute(
            """INSERT OR IGNORE INTO users (username, password_hash, role, display_name)
               VALUES (?, ?, ?, ?)""",
            (username, pw_hash, role, display_name),
        )
    await db.commit()
