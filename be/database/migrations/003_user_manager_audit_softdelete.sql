-- =============================================
-- Migration 003: User Manager — audit + soft-delete
-- =============================================
-- Bổ sung các cột audit còn thiếu so với Domain
-- (BaseEntity + UserRepository::mapToEntity kỳ vọng
-- created_by / updated_at / updated_by) và soft-delete.
--
-- Cách chạy:
--   docker compose exec postgres psql -U blog_user -d blog_db \
--     -f /dev/stdin < be/database/migrations/003_user_manager_audit_softdelete.sql
-- Hoặc: make db-sh rồi \i <đường dẫn file>
-- =============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by INTEGER NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by INTEGER NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by INTEGER NULL;

-- Lọc nhanh theo role / status (trang admin/users)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
-- Ẩn user đã xóa mềm khỏi list mặc định
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
