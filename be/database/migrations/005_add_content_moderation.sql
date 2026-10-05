-- Migration an toan cho database dang ton tai: khong xoa hay reset du lieu.
CREATE TABLE IF NOT EXISTS moderation_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    pattern TEXT NOT NULL,
    rule_type VARCHAR(12) NOT NULL CHECK (rule_type IN ('keyword', 'regex')),
    reason TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

-- Ban migration dau tien dung views_count, trong khi repository dung view_count.
-- Sao chep gia tri neu cot cu ton tai, de giu nguyen luot xem.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'views_count') THEN
        EXECUTE 'UPDATE posts SET view_count = COALESCE(views_count, 0) WHERE view_count = 0';
    END IF;
END $$;

-- Dong bo cac gia tri status cu viet thuong voi enum hien tai cua ung dung.
UPDATE posts
SET status = CASE lower(status)
    WHEN 'draft' THEN 'Draft'
    WHEN 'pending' THEN 'Pending'
    WHEN 'published' THEN 'Published'
    WHEN 'reject' THEN 'Reject'
    ELSE status
END
WHERE lower(status) IN ('draft', 'pending', 'published', 'reject');
