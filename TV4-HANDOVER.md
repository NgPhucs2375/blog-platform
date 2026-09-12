# Bàn giao TV4 — Backend Developer 3
**Phạm vi:** Comment + Reply + Search/Filter + Pagination + SystemLogs + hỗ trợ Reports.
**Base URL (qua nginx):** `http://localhost/api` · **Trực tiếp FE:** `http://localhost:3000`
**Tests:** `docker compose exec backend vendor/bin/phpunit` → **49 tests, 168 assertions, OK.**

---

## 1. Quy ước chung (áp dụng mọi API TV4)

### 1.1. Envelope trả về
```json
{ "success": true, "status_code": 200, "message": "...", "data": { "...": "..." }, "timestamp": "2026-09-09 12:00:00" }
```
Lỗi: `{ "success": false, "status_code": 4xx, "message": "...", "errors": null, "timestamp": "..." }`.

### 1.2. Xác thực
- Header: `Authorization: Bearer <access_token>` (lấy từ `POST /api/v1/auth/login` → `data.access_token`).
- Routes `auth` kiểm tra JWT; routes `Admin` kiểm tra thêm claim `role === "Admin"`.
- Mọi action ghi dữ liệu của TV4 còn kiểm tra **tài khoản Active** (khóa → `403`), kể cả khi token còn hạn.

### 1.3. Phân trang thống nhất (Job 4.4)
```json
"pagination": { "page": 1, "limit": 10, "total": 35, "totalPages": 4 }
```
- Query: `page` (≥1), `limit` (tên param là **`limit`**, không phải `pageSize` — theo convention sẵn của `UserController`).
- `totalPages = ceil(total / limit)`. Kèm `filters` echo lại điều kiện đã dùng.

### 1.4. Mã lỗi thường gặp
| Code | Khi nào |
|---|---|
| 200 / 201 | Thành công / tạo mới |
| 400 | Bình luận dưới bài chưa Published; `parentId` khác bài |
| 401 | Thiếu/sai token; xem log admin không đăng nhập |
| 403 | Tài khoản Locked; xóa comment của người khác; không phải Admin |
| 404 | Không thấy post/comment |
| 422 | Content rỗng/quá 2000 ký tự; `status/action/targetType` sai enum |

---

## 2. API Comments (9 endpoints)

### 2.1. `GET /api/v1/posts/{id}/comments` — public, cây Approved (Job 4.1 + 4.2)
- Post chưa Published → `404` (không lộ comment bài nháp).
- Query: `page` (default 1), `limit` (default 10, max 50).
- **Lưu ý:** phân trang trên **comment gốc**; `total` = số gốc, mỗi node kèm `replies[]` đệ quy.
```json
"data": { "comments": [ { "id": 1, "postId": 3, "userId": 2, "content": "...", "parentId": null, "status": "Approved", "createdAt": "...", "replies": [ { "...": "...", "replies": [] } ] } ], "pagination": { "...": "..." } }
```

### 2.2. `GET /api/v1/posts/{id}/comments/count` — public (badge/UI, reports đọc)
→ `{ "postId": 3, "total": 5 }` (`total` = số Approved mọi tầng).

### 2.3. `POST /api/v1/posts/{id}/comments` — auth (tạo + reply gộp, Job 4.1)
Body: `{ "content": "...", "parentId": 12 }` (`parentId` optional; có → thành reply, phải cùng bài).
→ `201` + comment mới ở trạng thái **`Pending`**: `"Đã gửi bình luận, đang chờ duyệt."`

### 2.4. `POST /api/v1/comments/{id}/reply` — auth (reply tường minh, Job 4.1)
Body: `{ "content": "..." }` → `201 Pending`: `"Đã gửi trả lời, đang chờ duyệt."`

### 2.5. `POST /api/v1/comments/{id}/approve` — Admin (Job 4.1)
Duyệt 1 comment. Đã Approved rồi → vẫn `200` (idempotent).

### 2.6. `POST /api/v1/comments/{id}/hide` — Admin (Job 4.1 + 4.2)
Ẩn comment **kèm toàn bộ con cháu** (cascade đệ quy). Đã Hidden rồi → vẫn `200`.

### 2.7. `DELETE /api/v1/comments/{id}` — auth, chủ sở hữu hoặc Admin (Job 4.1 + 4.2)
Xóa vật lý; FK `ON DELETE CASCADE` tự dọn con → toàn vẹn dữ liệu.

### 2.8. `GET /api/v1/admin/comments` — Admin (hàng đợi kiểm duyệt, hỗ trợ Reports)
Query: `status` (`Pending|Approved|Hidden`, optional), `postId?`, `page` (def 1), `limit` (def 20, max 100).
Trả **phẳng** mới-nhất-trước (work-list, không phải cây) + `pagination` + `filters`.

### 2.9. `GET /api/v1/admin/comments/stats` — Admin (dashboard Reports)
Query: `postId?` → `{ "postId": null, "total": 10, "pending": 3, "approved": 5, "hidden": 2 }`.

---

## 3. API Search/Filter Posts (Job 4.3) — ⚠️ BREAKING CHANGE

### `GET /api/v1/posts` — public
Query: `keyword` (tìm trong **title hoặc content**, không phân biệt hoa thường),
`categoryId?`, `authorId?`, `fromDate?`, `toDate?` (so `created_at`), `page`, `limit` (def 10, max 100).
Kết hợp AND nhiều tiêu chí; luôn chỉ bài `Published`; mặc định mới nhất trước.

**Đổi shape (FE phải sửa):** trước trả mảng trần, nay trả:
```json
"data": { "posts": [ { "id": 1, "title": "...", "slug": "...", "content": "...", "authorId": 2, "categoryId": 1, "status": "Published", "viewCount": 0, "createdAt": "..." } ], "pagination": { "...": "..." }, "filters": { "keyword": "hello", "categoryId": null, "authorId": null, "fromDate": null, "toDate": null } }
```

---

## 4. API SystemLogs (Job 4.5)

### `GET /api/v1/admin/logs` — Admin, append-only (không có sửa/xóa logs)
Query: `userId?`, `action?` (`CREATE|UPDATE|DELETE|CHANGE_STATUS`), `targetType?`
(`Users|Categories|Posts|Comments|Tags|PostTags|Follows|Likes|Notifications`),
`targetId?`, `startDate?`, `endDate?`, `page` (def 1), `limit` (def 20, max 100).
→ `{ logs: [{ id, userId, action, targetType, targetId, oldValue, newValue, createdAt, createdBy }], pagination, filters }`.

Ghi log tự động: tạo comment/reply (`CREATE`), duyệt/ẩn (`CHANGE_STATUS`), xóa (`DELETE`).
`UPDATE` do flow TV2/TV3 phát sinh (comment không có API sửa nên TV4 không sinh `UPDATE`).
Ghi log **không bao giờ làm vỡ API chính** (try-catch, contract thống nhất với TV2).

---

## 5. Database — migration `be/database/migrations/004_tv4_core_tables.sql`
Tạo (đều `IF NOT EXISTS`, chạy lại an toàn): `categories`, `posts`, `comments`
(`parent_id → comments ON DELETE CASCADE` + chống tự trỏ), `system_logs` (`old/new JSONB`)
+ index (`idx_comments_post_status`, `idx_posts_status_created`, `idx_logs_user_action_target_created`, ...).
⚠️ **Cần review chung với TV2 (Chính DB) + TV3 (chủ Category/Post)** trước khi họ viết migration riêng để khỏi trùng/lệch cột.

---

## 6. Việc còn lại theo bảng phân chia (phần IV Job.md)

| Việc | Chủ | Trạng thái / ghi chú |
|---|---|---|
| UI Comment/Search/Logs/Reports | TV5 | Chờ: dùng mục 2–4; FE `posts` và comment public phải theo shape mới |
| User/Post stats cho Reports | TV2/TV3 | TV4 chỉ xong phần Comment; ghép thêm khi TV2/TV3 xong API đếm |
| UPDATE logs các module khác | TV2/TV3 | Dùng `SystemLogRepository::save()` + bọc try-catch như `UserController::writeLog()` |
| Tài liệu tổng + test dẫn dắt | TV1 | File này là đầu vào; suite BE đang xanh 49/49 |
| `.env.example` staged-deleted | Ai đó kiểm tra | `git status` thấy `D .env.example` — restore nếu nhầm |

## 7. File đã thêm/sửa (để review)
- Mới: `004_tv4_core_tables.sql`, `CommentController.php`, `SystemLogController.php`,
  `test/CommentTest.php`, `test/CommentRoutesTest.php`, `test/SystemLogTest.php`,
  `test/Tv4SearchLogRoutesTest.php`, `test/Tv4ReportsRoutesTest.php`.
- Sửa: `PostRepository` (+`IPostRepository`: ILIKE, date filter, `countPublishedPosts`),
  `SystemLogRepository` (+interface: `countLogs` có filter, thêm `targetId`),
  `CommentRepository` (+interface: `searchComments/countSearchComments/countStats/hasReplies`, audit `created_by/updated_at`),
  `PostController::index`, `Container.php` (wire 2 controller mới).
- Xóa: `Infrastructure/Logging/SystemLogger.php` (chết: sai namespace `App\...`, class DB không tồn tại).
viết thêm một file.md tổng hợp tất cả những gì đã làm, đã test,... nói chung là tất cả