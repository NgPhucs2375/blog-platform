# Chạy Blog Platform với Laragon

Backend Laravel nằm trong `be/` của repository để có thể commit/push cùng frontend. Dùng Laragon cho PHP và MySQL; không cần Docker.

1. Bật **MySQL** trong Laragon.
2. Sao chép `be/.env.example` thành `be/.env` và đặt thông tin tài khoản MySQL cục bộ. Database `blog_platform_laravel` được tạo riêng để giữ nguyên database cũ.
3. Trong Laragon Terminal, tại thư mục gốc repo, chạy:

   ```powershell
   cd be
   php database/create_database.php
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve --host=127.0.0.1 --port=8000
   ```

4. Mở terminal khác, chạy frontend:

   ```powershell
   cd fe/frontend
   npm install
   npm run dev -- --port 3001
   ```

Mở `http://localhost:3001`. Frontend gọi API tại `http://127.0.0.1:8000/api`. Kiểm tra backend bằng `http://127.0.0.1:8000/api/health`.

`.env` chứa khóa ứng dụng và mật khẩu database nên đã được ignore. Khi clone repo mới, chạy `composer install` trong `be/` rồi làm theo các bước trên.

## Đăng nhập Google (tùy chọn)

Tạo OAuth Client ID loại **Web application** trong Google Cloud Console và thêm Authorized JavaScript origins `http://localhost` và `http://localhost:3001`. Đặt Client ID đó vào `be/.env` dưới tên `GOOGLE_CLIENT_ID` và `fe/frontend/.env.local` dưới tên `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Sau đó chạy `php artisan migrate` trong `be/` và khởi động lại cả Laravel lẫn Next.js. Client ID không phải client secret; không commit file `.env`/`.env.local`.
