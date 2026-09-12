-- Dong bo schema ma CategoryRepository dang su dung va dam bao luon co
-- mot chuyen muc hop le de form dang bai khong gui category_id khong ton tai.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

INSERT INTO categories (name, slug, description, sort_order, display_order)
VALUES ('Tổng hợp', 'tong-hop', 'Chuyên mục mặc định của hệ thống', 0, 0)
ON CONFLICT (slug) DO NOTHING;
