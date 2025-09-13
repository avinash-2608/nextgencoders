import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        syllabus TEXT
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        topic TEXT,
        score INTEGER,
        max_score INTEGER,
        last_updated TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    conn.commit()
    conn.close()

def upsert_user(name, email, syllabus):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE users SET name=?, syllabus=? WHERE id=?", (name, syllabus, row["id"]))
        user_id = row["id"]
    else:
        cur.execute("INSERT INTO users (name,email,syllabus) VALUES (?,?,?)", (name,email,syllabus))
        user_id = cur.lastrowid
    conn.commit()
    conn.close()
    return user_id

def update_performance(user_id, topic, score, max_score, ts):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM performance WHERE user_id=? AND topic=?", (user_id, topic))
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE performance SET score=?, max_score=?, last_updated=? WHERE id=?", (score, max_score, ts, row["id"]))
    else:
        cur.execute("INSERT INTO performance (user_id,topic,score,max_score,last_updated) VALUES (?,?,?,?,?)", (user_id,topic,score,max_score,ts))
    conn.commit()
    conn.close()

def get_progress(user_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT topic,score,max_score,last_updated FROM performance WHERE user_id=?", (user_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows