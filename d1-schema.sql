-- ReadVerse Cloudflare D1 Database Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    banner TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    preferences TEXT DEFAULT '{}',
    stats TEXT DEFAULT '{}',
    readlist TEXT DEFAULT '[]',
    recently_read TEXT DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 2. Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT DEFAULT '',
    author_level TEXT DEFAULT '1',
    content TEXT NOT NULL,
    media_url TEXT DEFAULT '',
    media_type TEXT DEFAULT '',
    book_id TEXT DEFAULT '',
    book_title TEXT DEFAULT '',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 3. Community Comments Table
CREATE TABLE IF NOT EXISTS community_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT DEFAULT '',
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
);

-- 4. Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
);

-- 5. Reading Sessions Table
CREATE TABLE IF NOT EXISTS reading_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    book_title TEXT DEFAULT '',
    duration_minutes INTEGER DEFAULT 0,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    status TEXT DEFAULT 'active'
);

-- 6. Scene Pins Table
CREATE TABLE IF NOT EXISTS scene_pins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    chapter_index INTEGER NOT NULL,
    paragraph_index INTEGER NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scene_pins_book ON scene_pins(book_id, chapter_index);
