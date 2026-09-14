# Báo cáo tổng kết — Blog Platform (TV4 + vận hành)

**Project:** `D:\Y4-S1\LTMNM\blog-platform` — Blog đa tác giả (BE PHP 8.3 Clean Architecture + FE Next.js 16 + nginx + PostgreSQL 16 + Redis 7, Docker Compose 5 services).
**Môi trường:** Windows, Docker 29.5.3, Compose v5.1.4. Lệnh Windows dùng `.\make.bat ...` (tương đương `make ...`).
**Tài khoản Admin seed:** `superadmin / superadmin@gmail.com / superadmin123@` (ID 1).
**Tài liệu bàn giao API chi tiết:** xem `TV4-HANDOVER.md`.

---

## 1. Dựng & chạy project

- Hướng dẫn chạy lần đầu: `Copy-Item ".env.example" ".env"` → `docker compose up -d --build` → `docker compose ps` → `composer install` trong backend → `php database/migrate.php` → seed admin.
- Truy cập: FE `http://localhost:3000`, qua nginx `http://localhost`, API `http://localhost/api`, PostgreSQL `localhost:5432`, Redis `localhost:6379`.
- Lệnh hằng ngày: `up / down / logs -f / restart`; quản trị: `ps, test, migrate, backend-sh, frontend-sh, db-sh, clean` (xem `make.bat help`).

## 2. Sự cố network Docker (đã fix)

- **Triệu chứng:** `seed_admin.php` báo `could not translate host name "postgres"`.
- **Nguyên nhân:** `blog_postgres`, `blog_redis`, `blog_frontend` bị rớt khỏi network `blog-platform_blog_network` (`docker inspect` → `Networks: {}`); `blog_nginx` `Restarting` vì `host not found in upstream "frontend"`.
- **Fix:** `docker compose down` (giữ volume, không mất data) → `docker compose up -d`. Verify cả 5 container `Up` trên cùng network, `postgres (healthy)`, `ping postgres/redis` OK từ backend.
- Sau đó `migrate` (`[OK] 001→003` lúc đó) + `seed_admin` → tạo Admin ID 1 thành công.

## 3. Phân tích Job TV4 (`Job.md`)

- TV4 = Backend 3: Comment + Reply + Search/Filter + Pagination + SystemLogs (§4.1–4.5) + theo bảng phân chia mới: Comment/Search/SystemLogs làm **API**, **Hỗ trợ API** Reports/Statistics, **Module** Testing, **Backend** Integration; Database/Authorization chỉ Hỗ trợ (TV2 Chính); Category/Post thuộc TV3; UI thuộc TV5; TV1 lead Tài liệu/Test.
- **Kết luận khảo sát:** không thể làm ngay — DB chỉ có `users, refresh_tokens`; thiếu `CommentController/SystemLogController`; search thiếu author/date/count; pagination chưa thống nhất; `SystemLogger.php` là file chết. Nền tốt: entity/repo Comment-SystemLog-Post đã có ~60%, `UserController` có sẵn mẫu `writeLog()` + pagination chuẩn.

## 4. Step 1 — Migration `004_tv4_core_tables.sql` ✅

- Tạo `categories`, `posts` (FK users/categories), `comments` (`parent_id → comments ON DELETE CASCADE` + check chống tự trỏ), `system_logs` (`old/new JSONB`) + index (`idx_comments_post_status`, `idx_posts_status_created`, `idx_logs_user_action_target_created`, ...). Tất cả `IF NOT EXISTS`.
- Verify: `migrate.php [OK] 001→004`, `\dt` đủ 6 bảng, smoke CRUD qua Repository thật OK (đã cleanup), `phpunit 20/20` xanh.
- ⚠️ Tạo luôn bảng của TV3 (categories/posts) để unblock — **cần review chung với TV2/TV3** trước khi họ viết migration riêng.

## 5. Step 2 — Vá Repository ✅

- `PostRepository` (+interface): `LIKE` → `ILIKE` (pgsql), thêm `fromDate/toDate`, tách `buildPublishedFilter()` dùng chung, thêm `countPublishedPosts(...)`.
- `SystemLogRepository` (+interface): `countLogs()` → `countLogs(user/action/target/start/end[/targetId])`, tách `buildFilter()` dùng chung với `getLogs()`.
- `CommentRepository` (+interface): `save()` thêm `created_by`, `update()` thêm `updated_at/updated_by`, thêm `hasReplies()` (`delete()` đã có từ `AbstractRepository`, xóa vật lý + FK cascade).
- Xóa `Infrastructure/Logging/SystemLogger.php` (sai namespace `App\...`, class DB không tồn tại, không ai gọi).
- Verify: `php -l` sạch, smoke (`ilike_lower=1/ilike_upper=1`, `countFuture=0`, audit đầy đủ, `countLogs` đúng filter), `phpunit 20/20`.

## 6. Step 3–5 — Controllers + wiring ✅ (E2E HTTP xanh hết)

- **Mới `CommentController.php`** (9 route): `GET posts/{id}/comments` (public, cây Approved, paginate theo root), `GET .../comments/count` (public), `POST posts/{id}/comments` (tạo, `parentId?`), `POST comments/{id}/reply`, `POST .../approve` + `POST .../hide` (Admin, hide cascade con cháu, idempotent), `DELETE ...` (chủ/Admin), `GET admin/comments` (hàng đợi phẳng), `GET admin/comments/stats` (`{total,pending,approved,hidden}`). Check Active + Published mọi nơi; log CREATE/CHANGE_STATUS/DELETE bọc try-catch (contract TV2).
- **Nâng `PostController::index`**: thêm `authorId/fromDate/toDate`, `limit 1–100`, trả `{posts, pagination, totalPages, filters}` — ⚠️ **breaking change** (trước là mảng trần), FE phải sửa.
- **Mới `SystemLogController.php`**: `GET admin/logs` (Admin) lọc `userId/action/targetType/targetId/startDate/endDate` + validate enum 422; append-only (không sửa/xóa logs).
- **Wire `Container.php`**: `comments()/commentController()/systemLogController()` + register router.
- Verify: route match 11/11 đúng auth/roles; E2E qua nginx (login → tạo root+reply Pending → public `total=0` → approve ×2 → public `1 root/1 child` → search `total=1` → logs filter `=2` → hide cha → public `0` → delete OK); negative (`401` anon/không token, `422` action/content sai, `404` post ảo); `phpunit 20/20`; DB cleanup về `0/0/0/0`.

## 7. Module tests TV4 ✅ — `20/20 → 49/49 (168 assertions)`

Theo convention cũ (thuần unit, không chạm DB, mock repo), 5 file mới = **29 tests**:
| File | Số test | Nội dung |
|---|---|---|
| `test/CommentTest.php` | 7 | Entity: default Pending, approve/hide + audit, parentId, rỗng→exception, trim, toArray |
| `test/CommentRoutesTest.php` | 7 | 6 route đúng auth/roles + `buildTree` (lồng 3 tầng, con mồ côi lên root) qua reflection |
| `test/SystemLogTest.php` | 5 | toArray đủ 7 field, coerce string→enum, target lạ→exception, đủ 4 actions |
| `test/Tv4SearchLogRoutesTest.php` | 6 | Route search public, approve cần Admin, logs cần Admin, công thức `ceil(total/limit)` |
| `test/Tv4ReportsRoutesTest.php` | 4 | Route queue/stats cần Admin, count public, không clash `count` vs `index` |

## 8. Hỗ trợ Reports ✅ (đúng domain Comment, không lấn TV2/TV3)

BE/FE chưa có code reports nào nên chốt scope tối thiểu cho dashboard tương lai:
- Repo: `searchComments/countSearchComments` (cross-post, mới-nhất-trước) + `countStats()` (1 query `SUM(CASE...)`).
- API: `admin/comments` (queue) + `admin/comments/stats` + `posts/{id}/comments/count` (mục 2.8–2.9, 2.2).
- Verify HTTP (1 pending + 1 approved + 1 hidden): `queue Pending=1`, `queue post=3`, `stats 3/1/1/1`, `public count=1`, `401/422` đúng; `phpunit 49/49`; DB sạch.

## 9. Quyết định kỹ thuật đã chốt

1. Param phân trang tên **`limit`** (theo `UserController`), không dùng `pageSize`.
2. **`total` list comment cây = số comment gốc** (paginate root).
3. Ẩn cha cascade hết con; log chỉ ghi 1 dòng cho hành động chính.
4. Comment **không có API sửa** → TV4 không sinh log `UPDATE` (infra vẫn hỗ trợ, TV2/TV3 dùng).
5. Reports TV4 chỉ đụng **Comment**; user/post stats chờ TV2/TV3.

## 10. Thay đổi code (theo `git status`)

- **Mới:** `004_tv4_core_tables.sql`, `CommentController.php`, `SystemLogController.php`, 5 file `test/TV4*.php + CommentTest + CommentRoutesTest + SystemLogTest`, `TV4-HANDOVER.md`, `Job.md` (phân chia mới).
- **Sửa:** `IPostRepository/PostRepository`, `ISystemLogRepository/SystemLogRepository`, `ICommentRepository/CommentRepository`, `PostController`, `Container`.
- **Xóa:** `SystemLogger.php` (chết).
- **Lưu ý lạ:** `git status` hiện `.env.example` staged-deleted — không phải do session này tạo, cần kiểm tra/restore nếu nhầm.

## 11. Trạng thái cuối & việc còn lại

- **Xong:** BE TV4 (§4.1–4.5) + hỗ trợ Reports + module tests — `phpunit 49/49`, E2E HTTP pass, DB sạch, `TV4-HANDOVER.md` để bàn giao.
- **Còn lại:** TV5 làm UI (theo handover, lưu ý shape `posts` mới) → TV2/TV3 xong user/post stats thì ghép dashboard → review chung migration 004 → TV1 gom tài liệu tổng.
