# Blog Platform

Nền tảng blog gồm giao diện Next.js, chatbot, và backend Laravel MVC dùng MySQL. Hướng dẫn này dành cho Windows + Laragon; không cần Docker.

## Thư mục chính

- `be/`: Laravel API, migration, seeder và model.
- `fe/frontend/`: giao diện Next.js và chatbot.
- `README.md`: hướng dẫn cài đặt và chạy dự án.

## Yêu cầu

- Laragon có PHP 8.3 trở lên và MySQL.
- Composer, Node.js/npm và Git.
- Dự án đã được clone vào một thư mục, ví dụ `C:\laragon\www\blog-platform-luan`.

> **Lưu ý:** Bật MySQL trong Laragon trước khi chạy. Mỗi lệnh `cd` và lệnh server phải chạy ở đúng thư mục; giữ các cửa sổ server mở.

## Cài lần đầu

### 1. Cài backend Laravel

Mở Laragon Terminal hoặc Cmder. Đổi đường dẫn trong lệnh nếu dự án nằm ở thư mục khác:

```cmd
cd /d "C:\laragon\www\blog-platform-luan\be"
```

Tạo cấu hình local và cài thư viện:

```cmd
copy .env.example .env
composer install
```

Mở `be/.env` bằng Notepad, kiểm tra thông tin MySQL (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`). Database mặc định `blog_platform_laravel` được tạo riêng, không ghi đè database cũ.

Để tạo tài khoản admin demo giống bản cũ, đặt các dòng sau trong `be/.env` trước khi seed:

```env
ADMIN_USERNAME=superadmin
ADMIN_EMAIL=superadmin@gmail.com
ADMIN_PASSWORD=superadmin123@
```

Mật khẩu này chỉ dùng cho demo/local. Với hệ thống công khai, hãy đặt mật khẩu riêng.

Tạo database, sinh app key và chạy migration cùng dữ liệu mẫu:

```cmd
php artisan key:generate
php database/create_database.php
php artisan migrate --seed
```

### 2. Cài frontend Next.js

Mở **tab Cmder mới**, không đóng tab backend:

```cmd
cd /d "C:\laragon\www\blog-platform-luan\fe\frontend"
copy .env.example .env.local
npm install
```

Các file mẫu đã có API URL và Google Client ID của dự án. Nếu cần, kiểm tra `fe/frontend/.env.local` có các biến:

```env
NEXT_PUBLIC_API_URL=/api
LARAVEL_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=Client_ID_của_dự_án
```

Trong `be/.env` cũng cần có cùng Client ID:

```env
GOOGLE_CLIENT_ID=Client_ID_của_dự_án
```

### 3. Chạy dự án

Bật MySQL trong Laragon. Từ thư mục gốc dự án, chạy `run-local.bat` hoặc mở PowerShell và chạy:

```powershell
.\run-local.bat
```

Script tự khởi động Laravel API ở phía sau và Next.js ở cổng 3000. Bạn chỉ cần mở [http://localhost:3000](http://localhost:3000); các lời gọi API được chuyển tiếp tự động, không cần mở địa chỉ cổng 8000. Nhấn `Ctrl+C` trong cửa sổ chạy để dừng.

## Đăng nhập Google

Client ID được điền sẵn trong các file `.env.example`; mỗi máy vẫn cần sao chép thành `.env` và `.env.local` theo hướng dẫn. Origin local là `http://localhost:3000`. Nếu ứng dụng OAuth đang ở trạng thái **Testing**, chủ dự án phải thêm email Google của từng bạn vào danh sách **Test users** trong Google Auth Platform. [Hướng dẫn Client ID của Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) · [Quy định Test users](https://support.google.com/cloud/answer/15549945?hl=en).

Luồng này không cần Client Secret. Không commit `.env` hoặc `.env.local`; Client ID không phải bí mật. Tài khoản Google mới được tạo với quyền User.

## OTP đăng ký và quên mật khẩu

Khi đăng ký bằng email (bao gồm Gmail), hệ thống gửi mã OTP 6 chữ số. Mã hết hạn sau 10 phút; nhập mã ở trang xác minh email trước khi đăng nhập. Trang **Quên mật khẩu** gửi liên kết đặt lại mật khẩu, có hiệu lực 60 phút.

Để email được gửi thật tới Gmail, mở `be/.env` và cấu hình SMTP bằng Gmail của bạn cùng **Google App Password** (mật khẩu ứng dụng), không dùng mật khẩu đăng nhập Gmail:

```env
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-address@gmail.com
MAIL_PASSWORD=your-16-character-app-password
MAIL_FROM_ADDRESS=your-address@gmail.com
MAIL_FROM_NAME="Blog Platform"
FRONTEND_URL=http://localhost:3000
```

Tạo App Password trong Google Account sau khi bật xác minh 2 bước. Giữ giá trị thật trong `.env` cục bộ; không gửi mật khẩu ứng dụng trong chat hoặc commit lên GitHub. Sau khi sửa cấu hình, chạy `php artisan config:clear` trong thư mục `be` rồi khởi động lại Laravel. Nếu `MAIL_MAILER=log`, email chỉ được ghi vào log của Laravel chứ không tới hộp thư.

## Tài khoản admin demo

Nếu đặt các biến `ADMIN_*` ở trên trước khi chạy `php artisan migrate --seed`, có thể đăng nhập bằng `superadmin@gmail.com` và mật khẩu `superadmin123@`. Mỗi máy có database riêng nên tài khoản được seed riêng trên máy đó.

## Lỗi thường gặp

- **`php` không được nhận diện:** mở Laragon Terminal để PHP của Laragon có trong PATH.
- **`next` không được nhận diện:** chạy `npm install` trong `fe/frontend`.
- **`ERR_CONNECTION_REFUSED` ở cổng 3001:** Next.js chưa chạy hoặc tab server đã đóng; chạy lại lệnh Next.js và giữ tab mở.
- **`401: invalid_client` khi đăng nhập Google:** kiểm tra Client ID trong `be/.env` và `fe/frontend/.env.local` giống nhau, đúng với Google Cloud; sau khi đổi `.env.local`, khởi động lại Next.js.
- **Không kết nối MySQL:** kiểm tra MySQL đang bật và thông tin DB trong `be/.env`.

## Đưa code lên GitHub

Push toàn bộ thư mục repository, gồm `be/`, `fe/frontend/` và README này. Không push `.env`, `.env.local`, `vendor/`, `node_modules/` hoặc mật khẩu. Kiểm tra bằng `git status` tại thư mục gốc trước khi commit.
