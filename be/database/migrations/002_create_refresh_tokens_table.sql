-- =============================================
-- Migration 002: Create Refresh Tokens Table
-- =============================================
-- Lưu phiên đăng nhập persistent:
-- - Access token (JWT ngắn hạn) hết hạn -> FE dùng refresh token
--   để xin cặp token mới mà không bắt user đăng nhập lại.
-- - Mỗi lần refresh sẽ XOAY VÒNG (rotate): thu hồi token cũ,
--   cấp token mới. Token cũ bị dùng lại = dấu hiệu đánh cắp
--   -> thu hồi toàn bộ phiên của user đó.
-- - Chỉ lưu HASH (SHA-256) của refresh token, không lưu plain text.

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    replaced_by INTEGER NULL REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    user_agent VARCHAR(255) NULL,
    ip VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tìm phiên theo user (trang sessions, thu hồi hàng loạt)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Tra cứu token khi refresh/logout (so sánh theo hash)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
