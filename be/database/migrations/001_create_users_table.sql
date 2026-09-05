-- =============================================
-- Migration 001: Create Users Table
-- =============================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'User',
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookup (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for faster username lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
