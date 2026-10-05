# Blog Platform

Nền tảng blog đa người dùng với quản trị nội dung: đăng bài, chuyên mục,
kiểm duyệt, bình luận, báo cáo thống kê. Bài đọc hướng thiết kế editorial
(tạp chí điện tử) với chế độ sáng/tối.

## Cấu trúc dự án

```
blog-platform/
├── be/                  # Backend PHP thuần (không framework), REST API /api/v1
│   ├── database/
│   │   ├── migrations/  # Migration SQL (chạy theo thứ tự tên file)
│   │   └── seeders/     # Seeder tài khoản mặc định
│   └── src/             # Application / Domain / Infrastructure / WebApi
├── fe/frontend/         # Next.js 16 (App Router) + Tailwind CSS v4 + Motion
├── docker/              # Cấu hình nginx, backend, frontend cho Docker
└── docker-compose.yml   # Toàn bộ stack
```

## Chạy bằng Docker (khuyên dùng)

```bash
docker compose up -d --build
docker compose exec backend php database/migrate.php          # tạo bảng
docker compose exec backend php database/seeders/seed_admin.php  # seed tài khoản
```

Sau đó:

- Web    : http://localhost (nginx đưa FE + BE về một origin)
- FE dev : http://localhost:3000
- API    : http://localhost/api/v1/...

## Tài khoản seed

Seeder `be/database/seeders/seed_admin.php` tạo sẵn 2 tài khoản (chạy lại
nhiều lần không bị trùng — tài khoản đã tồn tại sẽ được bỏ qua):

| Vai trò | Username   | Email                 | Mật khẩu       | Ghi chú                              |
|---------|------------|-----------------------|----------------|--------------------------------------|
| Admin   | superadmin | superadmin@gmail.com  | superadmin123@ | Vào được Quản trị: users, categories, reports, moderation-rules |
| User    | usertest   | usertest@gmail.com    | usertest123@   | Tài khoản người dùng thường để test đăng bài, bình luận |

Đăng nhập tại `/login`. Đăng nhập Google/GitHub trên trang đăng nhập cần
backend hiện thực endpoint OAuth `POST /v1/auth/social/{provider}` (FE đã
nối sẵn contract).

## Chạy frontend ở môi trường dev

```bash
cd fe/frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost/api npm run dev   # http://localhost:3001
```

Không trỏ được BE thì dùng mock API nội bộ để xem giao diện (dữ liệu giả):
`NEXT_PUBLIC_API_URL=http://127.0.0.1:4000/api` kèm mock server riêng
(`node /tmp/blogmock/server.mjs`, port 4000). Mock hỗ trợ: posts, categories,
**CRUD user management đầy đủ** (list/search/filter/pagination, tạo, đổi role,
khóa/mở khóa, xóa mềm/vĩnh viễn, thao tác hàng loạt), **reports** (views trend
14 ngày, phân bố chuyên mục) và **auth** (login/register/logout) — toàn bộ
luồng demo chạy được, kể cả đăng nhập superadmin/usertest.

## Ghi chú kỹ thuật FE

- Bảng màu & token: `src/app/globals.css` (khối `:root` / `.dark`) +
  gradient thương hiệu ở `src/lib/chipColors.ts`.
- Nội dung banner / vé sự kiện trang chủ: `src/config/promotions.ts`.
- Menu điều hướng + thông báo: `src/config/navigation.ts`.
- Chatbot Anums (rule-based, dữ liệu thật): `src/components/Chatbot.tsx`,
  tài liệu kiến trúc tại `fe/frontend/docs/CHATBOT.md`.
- Icon: Phosphor Icons (`@phosphor-icons/react`).
