# Chạy toàn bộ dự án bằng Docker

Docker Compose chạy frontend Next.js, backend Laravel, MySQL và Nginx. Laragon không cần chạy cho cấu hình này.

## Khởi động lần đầu

Mở Docker Desktop, vào thư mục dự án rồi chạy:

```bash
docker compose up -d --build
docker compose exec backend php artisan migrate --seed
```

`DatabaseSeeder` gọi `VarietyPostsSeeder`, tạo thêm bài mẫu tiếng Việt và các tác giả demo. Nếu chỉ muốn seed lại dữ liệu mẫu mà không chạy migration, dùng:

```bash
docker compose exec backend php artisan db:seed
```

Seeder dùng `updateOrCreate`, nên chạy lại sẽ cập nhật bài mẫu hiện có thay vì tạo bản sao.

Backend tự cài Composer dependencies, tạo `be/.env` từ `be/.env.example` nếu chưa có, và sinh `APP_KEY` khi khởi động lần đầu. Các cấu hình OAuth, Brevo, email và dịch vụ ngoài vẫn lấy từ `be/.env`; điền thông tin của bạn ở đó trước khi dùng các chức năng tương ứng.

Mở web tại `http://localhost:8080`. API health check: `http://localhost:8080/api/health`.

MySQL trong Docker dùng cổng `3307` trên máy host để tránh trùng MySQL của Laragon ở `3306`. Web dùng cổng `8080` để tránh trùng Apache/Nginx của Laragon ở `80`.

## Lệnh thường dùng

```bash
docker compose stop
docker compose start
docker compose down
docker compose logs -f
docker compose exec backend php artisan migrate
```

`docker compose down` giữ dữ liệu trong volume MySQL. Không chạy `docker compose down -v` nếu muốn giữ cơ sở dữ liệu.
