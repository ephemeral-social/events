-- Ephemeral Waitlist Database Schema
-- Run this in Cloudflare D1 to create the tables

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by INTEGER REFERENCES subscribers(id),
    referral_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_founder INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    founder_at TEXT,
    
    -- Indexes for common queries
    CONSTRAINT valid_email CHECK (email LIKE '%@%.%')
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referral_code ON subscribers(referral_code);
CREATE INDEX IF NOT EXISTS idx_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_referred_by ON subscribers(referred_by);
CREATE INDEX IF NOT EXISTS idx_position ON subscribers(referral_count DESC, created_at ASC);

-- Optional: Track referral events for analytics
CREATE TABLE IF NOT EXISTS referral_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER REFERENCES subscribers(id),
    referred_id INTEGER REFERENCES subscribers(id),
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events(referrer_id);
