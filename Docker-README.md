# Chạy tùy chọn bằng Docker

Laragon là cách chạy được hướng dẫn chính trong repo. Docker Compose hiện cũng dùng Laravel + MySQL:

```bash
docker compose up -d --build
docker compose exec backend php artisan migrate --seed
```

Web: `http://localhost`; frontend dev: `http://localhost:3000`; API: `http://localhost/api/health`.

Compose dùng MySQL port `3307` trên máy host để tránh đụng MySQL của Laragon đang ở `3306`. Không chạy cả Docker Nginx và Apache Laragon cùng cổng `80`; khi dùng Laragon, chỉ cần chạy MySQL và Laravel qua `php artisan serve`.
